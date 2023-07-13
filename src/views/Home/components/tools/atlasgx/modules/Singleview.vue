<template>
  <v-row no-gutters>
    <v-col cols="12" sm="12" v-resize="onResize">
      <v-row id="viewContainer"  style="height:34vh">

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
import { get_uuid, generateRouteByQuery, splitarray, deepCopy } from '@/utils';
/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */

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
    const konvaConfigLeft = ref<any>({ x: 0, y: 0, width, height, draggable: true, ogx: 0 });
    const viewBoxSpatial = ref<number[]>([width, height]);
    const scale = ref<number>(0.8);
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
    const globalSpatial = ref<any>();
    const initialized = ref<boolean>(false);
    function setDraggable(flag: boolean) {
      konvaConfigLeft.value.draggable = flag;
    }
    async function fitStageToParent() {
      const parent = document.querySelector('#viewContainer');
      if (!parent) return;
      const parentWidth = (parent as any).offsetWidth;
      const parentHeight = (parent as any).offsetHeight;
      konvaConfigLeft.value.width = Math.floor(parentWidth / 3) - 1;
      konvaConfigLeft.value.height = parentHeight;
      konvaConfigLeft.value.ogx = parentWidth;
      viewBoxSpatial.value = [konvaConfigLeft.value.width, konvaConfigLeft.value.height];
    }
    function makearray(stopValue: number, startValue: number): any[] {
      if (highestCount.value === 0) return [];
      const arr: any [] = [];
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
    async function resizeCircles() {
      if (!initialized.value) return;
      const minX = maxMin.value[0];
      const minY = maxMin.value[1];
      const maxX = maxMin.value[2];
      const maxY = maxMin.value[3];
      const { width: stageWidth, height: stageHeight } = konvaConfigLeft.value;
      const viewScale = Math.min(stageWidth / (maxX - minX), stageHeight / (maxY - minY));
      const radiusSize = (coordinates.value.length < 4000) ? 22 : 44;
      const radius = (Math.min(stageWidth, stageHeight) / (radiusSize * 5)) * scale.value;
      const inV = scale.value * viewScale * minX - radius;
      const inH = scale.value * viewScale * minY - radius;
      selectedGenesFromParent.value.forEach((gene: any) => {
        const svg = document.getElementById(`svg${gene}`);
        svg?.setAttribute('width', `${stageWidth}px`);
        coordinates.value.forEach((v: any, i: any) => {
          const circle = document.getElementById(`tixel${i}${gene}`)!;
          circle.setAttribute('cx', `${v.ogx * scale.value * viewScale - inV}`);
          circle.setAttribute('cy', `${v.ogy * scale.value * viewScale - inH}`);
          circle.setAttribute('r', `${radius}`);
        });
      });
    }
    function timer(ms: any) { return new Promise((res: any) => setTimeout(res, ms)); }
    async function initializePlots() {
      if (coordinates.value === undefined) return;
      const circles: any[] = [];
      let geneSum: number[] = [];
      const minX = maxMin.value[0];
      const minY = maxMin.value[1];
      const maxX = maxMin.value[2];
      const maxY = maxMin.value[3];
      const { width: stageWidth, height: stageHeight } = konvaConfigLeft.value;
      const viewScale = Math.min(stageWidth / (maxX - minX), stageHeight / (maxY - minY));
      const radiusSize = (coordinates.value.length < 4000) ? 22 : 44;
      const radius = (Math.min(stageWidth, stageHeight) / (radiusSize * 5)) * scale.value;
      const inV = scale.value * viewScale * minX - radius;
      const inH = scale.value * viewScale * minY - radius;
      const NS = 'http://www.w3.org/2000/svg';
      const container = document.getElementById('viewContainer');
      container?.setAttribute('style', 'height: auto');
      const repeat = async (gene: any, index: number) => {
        let stepArray: any = [];
        const daddyDiv = document.createElement('div');
        daddyDiv.setAttribute('id', `plotWrapper${gene}`);
        const svgId = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgId.setAttribute('width', `${stageWidth}px`);
        svgId.setAttribute('height', '34vh');
        svgId.setAttribute('id', `svg${gene}`);
        const svgG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgG.setAttribute('id', `svgGroup${gene}`);
        svgG.setAttribute('y', '30');
        const tag = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tag.setAttribute('fill', 'white');
        tag.setAttribute('y', '15');
        const tagText = document.createTextNode(`${gene}`);
        tag.appendChild(tagText);
        const color_bar = document.createElement('div');
        color_bar.setAttribute('id', `colorBar${gene}`);
        color_bar.setAttribute('style', `background-image:${colorBarmap.value}; display:flex; width: 85%`);
        geneSum = [];
        coordinates.value.forEach((v: any, i: any) => {
          geneSum.push(checkBoundary(v.genes[gene]));
        });
        highestCount.value = -10000;
        lowestCount.value = 10000;
        const geneColors = colormapBounded(colors_intensity.value, geneSum, 1);
        coordinates.value.forEach((v: any, i: any) => {
          const col = checkBoundaryColor(v.genes[gene]);
          const clr = (col) ? geneColors[i] : 'grey';
          highestCount.value = geneSum[i] > highestCount.value ? geneSum[i] : highestCount.value;
          lowestCount.value = geneSum[i] < lowestCount.value ? geneSum[i] : lowestCount.value;
          const circle = document.createElementNS(NS, 'circle');
          circle.setAttribute('cx', `${v.ogx * scale.value * viewScale - inV}`);
          circle.setAttribute('cy', `${v.ogy * scale.value * viewScale - inH}`);
          circle.setAttribute('r', `${radius}`);
          circle.setAttribute('id', `tixel${i}${gene}`);
          circle.setAttribute('fill', `${clr}`);
          svgG.appendChild(circle);
        });
        stepArray = makearray((maxMinBoundary.value.length !== 0) ? parseFloat(maxMinBoundary.value[0]) : highestCount.value, (maxMinBoundary.value.length !== 0) ? parseFloat(maxMinBoundary.value[1]) : lowestCount.value);
        svgId.appendChild(tag);
        svgId.appendChild(svgG);
        daddyDiv?.appendChild(svgId);
        stepArray.forEach((v: any) => {
          const div = document.createElement('div');
          div.setAttribute('style', `color:${colorbarText.value}; font-size:16px; font-weight:bold; width:20%; text-align:center`);
          div.innerHTML = v;
          color_bar.appendChild(div);
        });
        daddyDiv?.appendChild(color_bar);
        container?.appendChild(daddyDiv);
        await timer(30);
      };
      for (let i = 0; i < selectedGenesFromParent.value.length; i += 1) {
        await repeat(selectedGenesFromParent.value[i], i);
      }
      initialized.value = true;
    }
    async function removeOld() {
      const parent = document.getElementById('viewContainer')!;
      while (parent.firstChild) {
        parent.firstChild.remove();
      }
    }
    async function updateCircles() {
      if (coordinates.value === undefined) return;
      let stepArray = [];
      const geneSum: number[] = [];
      selectedGenesFromParent.value.forEach((gene: any) => {
        const color_bar = document.getElementById(`colorBar${gene}`);
        while (color_bar?.firstChild) {
          color_bar?.firstChild.remove();
        }
        color_bar?.setAttribute('style', `background-image:${colorBarmap.value}; display:flex; width: 85%`);
        coordinates.value.forEach((v: any, i: any) => {
          geneSum.push(checkBoundary(v.genes[gene]));
        });
        highestCount.value = -10000;
        lowestCount.value = 10000;
        const geneColors = colormapBounded(colors_intensity.value, geneSum, 1);
        coordinates.value.forEach((v: any, i: any) => {
          const col = checkBoundaryColor(v.genes[gene]);
          const clr = (col) ? geneColors[i] : 'grey';
          highestCount.value = geneSum[i] > highestCount.value ? geneSum[i] : highestCount.value;
          lowestCount.value = geneSum[i] < lowestCount.value ? geneSum[i] : lowestCount.value;
          const circle = document.getElementById(`tixel${i}${gene}`)!;
          circle.setAttribute('fill', `${clr}`);
        });
        stepArray = makearray((maxMinBoundary.value.length !== 0) ? parseFloat(maxMinBoundary.value[0]) : highestCount.value, (maxMinBoundary.value.length !== 0) ? parseFloat(maxMinBoundary.value[1]) : lowestCount.value);
        stepArray.forEach((v: any) => {
          const div = document.createElement('div');
          div.setAttribute('style', `color:${colorbarText.value}; font-size:16px; font-weight:bold; width:20%; text-align:center`);
          div.innerHTML = v;
          color_bar?.appendChild(div);
        });
      });
    }
    async function onResize() {
      await fitStageToParent();
      resizeCircles();
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
    watch([coordGene, selectedGenesFromParent, colorsValues, maxMinBoundaryFromParents], async ([v, x, y, z], [prevv, prevx, prevy, prevz]) => {
      if (v !== undefined && x !== undefined && y !== undefined && v !== prevv) {
        coordinates.value = v.coords;
        colors_intensity.value = v.intense;
        colorBarmap.value = y.color;
        maxMin.value = y.maxMin;
        if (z[0] === '' && z[1] === '') maxMinBoundary.value = [];
        else maxMinBoundary.value = z;
        await removeOld();
        initializePlots();
      }
    }, { deep: true });
    watch(maxMinBoundaryFromParents, (v: any) => {
      if (v[0] === '' && v[0] === '') maxMinBoundary.value = [];
      else maxMinBoundary.value = v;
      updateCircles();
    });
    onMounted(async () => {
      await clientReady;
      fitStageToParent();
    });
    return {
      get_uuid,
      scale,
      loading,
      konvaConfigLeft,
      onResize,
      isClusterView,
      clusterColors,
      updateCircles,
      heatMap,
      colorBarmap,
      highestCount,
      lowestCount,
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
      globalSpatial,
      viewBoxSpatial,
      resizeCircles,
      initialized,
      initializePlots,
      removeOld,
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
