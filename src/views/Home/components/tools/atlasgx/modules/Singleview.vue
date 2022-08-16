<template>
  <v-row>
    <v-col cols="12" sm="1" class="shrinkCol">
      <v-card
      class="rounded-0"
      flat
      :style="{ 'background-color': 'transparent', 'overflow-x': 'None' }"
      height="50vh"
      width="100%">
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
        height="50vh"
        align="center">
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
      <v-card-title>{{selectedGenesFromParent}}</v-card-title>
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

export default defineComponent({
  name: 'AtxAtacViewer',
  props: ['query', 'genes', 'heatmap', 'circleData', 'colorBar', 'loadingProp'],
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const loading = computed(() => props.loadingProp);
    const selectedGenesFromParent = computed(() => props.genes);
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
    const circlesSpatial = computed(() => (props.circleData));
    const clusterColors = ref<string[]>([]);
    const heatMap = computed(() => (props.heatmap ? props.heatmap : 'jet'));
    const stepArray = ref<any[]>([]);
    const colorBarmap = ref<string>('');
    const colorsValues = computed(() => (props.colorBar));
    const colorbarText = ref<string>('white');
    const circlesSpatialSingle = ref<any[]>([]);
    const maxMin = ref<any[]>([]);
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
      const minX = maxMin.value[0];
      const minY = maxMin.value[1];
      const maxX = maxMin.value[2];
      const maxY = maxMin.value[3];
      const { width: stageWidth, height: stageHeight } = konvaConfigLeft.value;
      const viewScale = Math.min(stageWidth / (maxX - minX), stageHeight / (maxY - minY));
      const [paddingX, paddingY] = [60, 30];
      highestCount.value = 0;
      lowestCount.value = 10000;
      lodash.each(circlesSpatial.value, (v: any, i: number) => {
        highestCount.value = circlesSpatial.value[i].total > highestCount.value ? circlesSpatial.value[i].total : highestCount.value;
        lowestCount.value = circlesSpatial.value[i].total < lowestCount.value ? circlesSpatial.value[i].total : lowestCount.value;
        const tixelHold = v;
        tixelHold.x *= scale.value * viewScale + paddingX;
        tixelHold.y *= scale.value * viewScale + paddingY;
        tixelHold.id = get_uuid();
        circlesSpatialSingle.value.push(tixelHold);
        console.log(tixelHold);
      });
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
      text = `${text}\nAvg: ${(item.total).toFixed(2)}`;
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
    watch(colorsValues, (v: any) => {
      colorBarmap.value = v.color;
      maxMin.value = v.maxMin;
    });
    watch(scale, () => {
      reScale();
    });
    watch(selectedGenesFromParent, () => {
      updateCircles();
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
      circlesSpatial,
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
