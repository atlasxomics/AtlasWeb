<template>
  <v-row>
    <v-col cols="12" sm="1" class="shrinkCol">
      <v-card
      class="rounded-0"
      flat
      :style="{ 'background-color': 'transparent', 'overflow-x': 'None' }"
      height="38vh">
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
        height="38vh"
        align="center">
        <v-card-title :style="{ 'color': (backgroundColor != 'black') ? 'black' : 'white' }">{{selectedGenesFromParent}}</v-card-title>
        <v-stage
          ref="konvaStageSingle"
          class="mainStage"
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
          <v-layer
            ref="annotationLayerSingle"
            />
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
import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
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
  const min_v = Math.min(...values) + (10 * amount);
  const max_v = Math.max(...values) + (10 * amount);
  const nshades = cmap.length;
  const output: string[] = [];
  lodash.each(values, (v: number) => {
    const plusTen = v + (10 * amount);
    const normalized = ((plusTen - min_v) / (max_v - min_v)) * (nshades - 1);
    const colidx = Math.trunc(normalized);
    output.push(cmap[colidx]);
  });
  return output;
}

export default defineComponent({
  name: 'AtxAtacViewer',
  props: ['query', 'gene', 'heatmap', 'background', 'circleData', 'colorBar', 'loadingProp'],
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const loading = computed(() => props.loadingProp);
    const selectedGenesFromParent = computed(() => props.gene);
    const spatialData = ref<any | null>(null);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const konvaConfigLeft = ref<any>({ x: 0, y: 0, width, height, draggable: true });
    const scale = ref<number>(0.6);
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
    const geneSum = ref<any>();
    const coordinates = ref<any>();
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
    async function updateCircles() {
      if (geneSum.value === undefined) return;
      const circles: any[] = [];
      const minX = maxMin.value[0];
      const minY = maxMin.value[1];
      const maxX = maxMin.value[2];
      const maxY = maxMin.value[3];
      const { width: stageWidth, height: stageHeight } = konvaConfigLeft.value;
      const viewScale = Math.min(stageWidth / (maxX - minX), stageHeight / (maxY - minY));
      const [paddingX, paddingY] = [60, 30];
      const radius = (Math.min(stageWidth, stageHeight) / (30 * 5)) * scale.value;
      highestCount.value = 0;
      lowestCount.value = 10000;
      const geneColors = colormapBounded(colors_intensity.value, geneSum.value, 1);
      lodash.each(geneSum.value, (v: any, i: number) => {
        highestCount.value = v > highestCount.value ? v : highestCount.value;
        lowestCount.value = v < lowestCount.value ? v : lowestCount.value;
        const clr = (i + 10 > 0) ? geneColors[i] : 'grey';
        const c = {
          id: get_uuid(),
          x: coordinates.value[i][0] * scale.value * viewScale + paddingX,
          y: coordinates.value[i][1] * scale.value * viewScale + paddingY,
          radius,
          originalColor: clr,
          fill: clr,
          stroke: clr,
          strokeWidth: 1.0,
          cluster: coordinates.value[i][2],
          total: v,
          inactive: false,
          genes: { [selectedGenesFromParent.value]: v },
        };
        circles.push(c);
      });
      circlesSpatialSingle.value = circles;
      stepArray.value = makearray(highestCount.value, lowestCount.value);
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
      scale.value = 0.6;
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
        geneSum.value = v.geneSum[x];
        coordinates.value = v.coords;
        colors_intensity.value = v.intense;
        colorBarmap.value = y.color;
        maxMin.value = y.maxMin;
        updateCircles();
      }
    }, { deep: true });
    watch(scale, () => {
      reScale();
    });
    onMounted(async () => {
      await clientReady;
      tooltip.add(tooltipTag);
      tooltip.add(tooltipText);
      (ctx.refs.annotationLayerSingle as any).getNode().add(tooltip);
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
      geneSum,
      coordinates,
      backgroundColor,
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
