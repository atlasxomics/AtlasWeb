<template>
  <v-row>
    <v-col cols="12" sm="1" class="shrinkCol">
      <div :style="{ 'color': (backgroundColor != 'black') ? 'black' : 'white', 'z-index': 0, 'position': 'relative' }"><h4><span style="white-space: nowrap;">{{selectedGenesFromParent.trim()}}</span></h4></div>
      <v-card
      class="rounded-0"
      flat
      :style="{ 'background-color': 'transparent', 'overflow-x': 'None' }"
      height="34vh">
        <v-card-text>
          <v-row justify="end">
            <v-btn
            small
            icon
            color="primary"
            @click="resetScaleAndPos"
            ><v-icon small>mdi-arrow-expand</v-icon>
            </v-btn>
          </v-row>
          <v-row justify="end">
            <v-btn
              small
              icon
              color="primary"
              @click="scale=scale*1.1"
              ><v-icon small>mdi-magnify-plus</v-icon>
            </v-btn>
          </v-row>
          <v-row justify="end">
            <v-btn
              small
              icon
              color="primary"
              @click="scale=scale*0.9"
              ><v-icon small>mdi-magnify-minus</v-icon>
            </v-btn>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" sm="11">
      <v-card id="stageParentSingle"
        :loading="loading"
        class="rounded-0"
        v-resize="onResize"
        flat
        :style="{ 'background-color': 'transparent', 'overflow-x': 'None'}"
        height="34vh"
        align="center">
        <v-stage
          ref="konvaStageSingle"
          :config="konvaConfigLeft"
          :style="{ 'overflow': 'hidden' }"
          >
          <v-layer
            ref="spatialLayerSingle"
            id="spatialLayerSingle">
            <v-circle v-for="p in circlesSpatialSingle"
              :config="p"
              v-bind:key="p.id"
              @mouseover="mouseMoveOnSpatial"
              @mouseout="mouseOutOnSpatial"/>
          </v-layer>
        </v-stage>
      </v-card>
      <v-row>
        <v-col cols="12" sm="11">
          <div :style="{ 'background-image': colorBarmap, 'display': 'flex' }" >
            <div v-for="step in stepArray" v-bind:key="`${step}`" :style="{ 'color': colorbarText, 'font-size': '18px', 'font-weight': 'bold', 'width': '20%', 'text-align': 'center' }" >
            {{ step }}
            </div>
          </div>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUpdated, onBeforeUpdate } from '@vue/composition-api';
import Konva from 'konva';
import lodash from 'lodash';
import colormap from 'colormap';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { get_uuid, generateRouteByQuery, splitarray, deepCopy } from '@/utils';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});
function colormapBounded(cmap: string[], values: any, amount: number) {
  const min_v = Math.min(...values) + (12 * amount);
  const max_v = Math.max(...values) + (12 * amount);
  const nshades = cmap.length;
  const output: string[] = [];
  lodash.each(values, (v: number) => {
    const plusTen = v + (12 * amount);
    const normalized = ((plusTen - min_v) / (max_v - min_v)) * (nshades - 1);
    const colidx = Math.trunc(normalized);
    output.push(cmap[colidx]);
  });
  return output;
}

export default defineComponent({
  name: 'Singleview',
  props: ['query', 'gene', 'heatmap', 'background', 'circleData', 'colorBar', 'loadingProp', 'userBoundary'],
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const loading = computed(() => props.loadingProp);
    const selectedGenesFromParent = computed(() => props.gene);
    const spatialData = ref<any | null>(null);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const konvaConfigLeft = ref<any>({ x: 0, y: 0, width, height, draggable: true });
    const scale = ref<number>(0.68);
    const isClusterView = ref(true);
    const lowestCount = ref<number>(10000);
    const highestCount = ref<number>(0);
    const tooltip = new Konva.Label({ visible: false });
    const tooltipTag = new Konva.Tag({
      fill: 'white',
      pointerDirection: 'down',
      pointerWidth: 10,
      pointerHeight: 10,
      lineJoin: 'round',
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffsetX: 10,
      shadowOffsetY: 10,
      shadowOpacity: 0.5,
    });
    const tooltipText = new Konva.Text({
      text: '',
      fontFamily: 'Calibri',
      fontSize: 15,
      padding: 5,
      fill: 'black',
    });
    const coordGene = computed(() => (props.circleData));
    const clusterColors = ref<string[]>([]);
    const heatMap = computed(() => (props.heatmap ? props.heatmap : 'jet'));
    const stepArray = ref<any[]>([]);
    const colorBarmap = ref<string>('');
    const colorsValues = computed(() => (props.colorBar));
    const backgroundColor = computed(() => (props.background));
    const colorbarText = ref<string>('white');
    const circlesSpatialSingle = ref<any[]>([]);
    const maxMin = ref<any[]>([]);
    const colors_intensity = ref<any>();
    const coordinates = ref<any>();
    const maxMinBoundaryFromParents = computed(() => (props.userBoundary));
    const maxMinBoundary = ref<any[]>([]);
    function setDraggable(flag: boolean) {
      konvaConfigLeft.value.draggable = flag;
    }
    async function fitStageToParent() {
      const parent = document.querySelector('#stageParentSingle');
      if (!parent) return;
      const parentWidth = (parent as any).offsetWidth;
      const parentHeight = (parent as any).offsetHeight;
      konvaConfigLeft.value.width = parentWidth;
      konvaConfigLeft.value.height = parentHeight;
    }
    function makearray(stopValue: number, startValue: number): any[] {
      if (highestCount.value === 0) return [];
      const arr = [];
      const steps = 5;
      const step = (stopValue - startValue) / (steps - 1);
      for (let i = 0; i < steps; i += 1) {
        arr.push(parseFloat((startValue + (step * i)).toFixed(2)));
      }
      return arr;
    }
    function checkBoundary(value: number) {
      if (maxMinBoundary.value.length === 0) return value;
      if (value > parseFloat(maxMinBoundary.value[0])) return parseFloat(maxMinBoundary.value[0]);
      if (value < parseFloat(maxMinBoundary.value[0]) && value > parseFloat(maxMinBoundary.value[1])) return value;
      if (value < parseFloat(maxMinBoundary.value[1])) return parseFloat(maxMinBoundary.value[1]);
      return value;
    }
    function checkBoundaryColor(value: number) {
      if (maxMinBoundary.value.length === 0) return true;
      if (value > parseFloat(maxMinBoundary.value[0])) return false;
      if (value < parseFloat(maxMinBoundary.value[0]) && value > parseFloat(maxMinBoundary.value[1])) return true;
      if (value < parseFloat(maxMinBoundary.value[1])) return false;
      return value;
    }
    async function updateCircles() {
      if (coordinates.value === undefined) return;
      const circles: any[] = [];
      const geneSum: number[] = [];
      const minX = maxMin.value[0];
      const minY = maxMin.value[1];
      const maxX = maxMin.value[2];
      const maxY = maxMin.value[3];
      const { width: stageWidth, height: stageHeight } = konvaConfigLeft.value;
      const viewScale = Math.min(stageWidth / (maxX - minX), stageHeight / (maxY - minY));
      const [paddingX, paddingY] = [60, 30];
      const radiusSize = (coordinates.value.length < 4000) ? 22 : 44;
      const radius = (Math.min(stageWidth, stageHeight) / (radiusSize * 5)) * scale.value;
      coordinates.value.forEach((v: any, i: any) => {
        const c = {
          id: get_uuid(),
          x: v.ogx * scale.value * viewScale + paddingX,
          y: v.ogy * scale.value * viewScale + paddingY,
          radius,
          originalColor: 'grey',
          fill: 'grey',
          stroke: 'grey',
          strokeWidth: 0,
          cluster: v.cluster,
          total: v.genes[selectedGenesFromParent.value],
          inactive: false,
          genes: { [selectedGenesFromParent.value]: v.genes[selectedGenesFromParent.value] },
          perfectDrawEnabled: false,
          shadowForStrokeEnabled: false,
          listening: false,
        };
        circles.push(c);
        geneSum.push(checkBoundary(c.total));
      });
      circlesSpatialSingle.value = circles;
      highestCount.value = -10000;
      lowestCount.value = 10000;
      const geneColors = colormapBounded(colors_intensity.value, geneSum, 1);
      circles.forEach((v: any, i: any) => {
        const col = checkBoundaryColor(circles[i].total);
        const clr = (col) ? geneColors[i] : 'grey';
        highestCount.value = geneSum[i] > highestCount.value ? geneSum[i] : highestCount.value;
        lowestCount.value = geneSum[i] < lowestCount.value ? geneSum[i] : lowestCount.value;
        circles[i].originalColor = clr;
        circles[i].fill = clr;
        circles[i].stroke = clr;
      });
      stepArray.value = makearray((maxMinBoundary.value.length !== 0) ? parseFloat(maxMinBoundary.value[0]) : highestCount.value, (maxMinBoundary.value.length !== 0) ? parseFloat(maxMinBoundary.value[1]) : lowestCount.value);
    }
    // Drawing
    async function mouseMoveOnSpatial(ev: any) {
      const mousePos = (ctx as any).refs.konvaStageSingle.getNode().getRelativePointerPosition();
      const item = ev.target.attrs;
      tooltip.position({
        x: mousePos.x,
        y: mousePos.y,
      });
      let text = `Cluster: ${item.cluster}`;
      text = `${text}\nTotal: ${(item.total).toFixed(2)}`;
      lodash.forIn(item.genes, (v: number, k: string) => {
        text = `${text}\n${k}: ${v.toFixed(2)}`;
      });
      tooltipText.text(text);
      tooltip.show();
    }
    async function mouseOutOnSpatial(ev: any) {
      tooltip.hide();
    }
    // Drawing Region
    function reScale() {
      updateCircles();
    }
    function resetScaleAndPos(ev: any) {
      const stage = (ctx as any).refs.konvaStageSingle.getNode();
      const newPos = { x: 0, y: 0 };
      stage.position(newPos);
      scale.value = 0.68;
    }
    function onResize() {
      fitStageToParent();
      updateCircles();
    }
    watch(heatMap, (v: string) => {
      if (v === 'picnic') {
        colorbarText.value = 'black';
      } else if (v === 'bone') {
        colorbarText.value = 'brown';
      } else if (v === 'hot') {
        colorbarText.value = 'grey';
      } else {
        colorbarText.value = 'white';
      }
      updateCircles();
    });
    watch([coordGene, selectedGenesFromParent, colorsValues], ([v, x, y], [prevv, prevx, prevy]) => {
      if (v !== undefined && x !== undefined && y !== undefined && v !== prevv) {
        coordinates.value = v.coords;
        colors_intensity.value = v.intense;
        colorBarmap.value = y.color;
        maxMin.value = y.maxMin;
        onResize();
      }
    }, { deep: true });
    watch(scale, () => {
      reScale();
    });
    watch(maxMinBoundaryFromParents, (v: any) => {
      if (v[0] === '' && v[0] === '') maxMinBoundary.value = [];
      else maxMinBoundary.value = v;
      updateCircles();
    });
    onMounted(async () => {
      await clientReady;
    });
    return {
      get_uuid,
      scale,
      loading,
      konvaConfigLeft,
      onResize,
      mouseMoveOnSpatial,
      mouseOutOnSpatial,
      isClusterView,
      clusterColors,
      updateCircles,
      heatMap,
      stepArray,
      colorBarmap,
      highestCount,
      lowestCount,
      reScale,
      resetScaleAndPos,
      colorbarText,
      spatialData,
      selectedGenesFromParent,
      colorsValues,
      maxMin,
      circlesSpatialSingle,
      colors_intensity,
      coordinates,
      backgroundColor,
      maxMinBoundary,
      maxMinBoundaryFromParents,
      checkBoundary,
      checkBoundaryColor,
    };
  },
});
</script>

<style scoped>
.shrinkCol {
  flex: 0 0 6% !important;
  max-width: 6% !important;
}
</style>
