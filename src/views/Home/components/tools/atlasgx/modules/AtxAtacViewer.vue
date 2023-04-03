<template>
  <v-row no-gutters>
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
            :disabled="!spatialData"
            @click="resetScaleAndPos"
            ><v-icon small>mdi-arrow-expand</v-icon>
            </v-btn>
          </v-row>
          <v-row justify="end">
            <v-btn
              small
              icon
              color="primary"
              :disabled="!spatialData"
              @click="reScale('plus')"
              ><v-icon small>mdi-magnify-plus</v-icon>
            </v-btn>
          </v-row>
          <v-row justify="end">
            <v-btn
              small
              icon
              color="primary"
              :disabled="!spatialData"
              @click="reScale('neg')"
              ><v-icon small>mdi-magnify-minus</v-icon>
            </v-btn>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" sm="5">
      <v-card id="stageParentDualAtac"
        :loading="loading"
        class="rounded-0"
        v-resize="onResize"
        flat
        :style="{ 'background-color': 'transparent', 'overflow-x': 'None'}"
        height="50vh"
        align="center"
        @mousedown="mouseDownOnStageLeft"
        @mousemove="mouseMoveOnStageLeft"
        @mouseup="mouseUpOnStageLeft"
        @mouseleave="hideToolTipS">
        <div id="toolTipSpatial" :style="{'width':'max-content','position': 'absolute','z-index': '999','background-color': 'white', 'opacity': '0.7','visibility': visibility, 'top': TTposition[1], 'left': TTposition[0], 'border-radius': '3px', 'font-size': '12px', 'text-align': 'left'}"></div>
        <svg id="svgSpatial" style="" :width="konvaConfigLeft.width" :height="konvaConfigLeft.height" :viewBox="`0 0 ${svg_spatial_wh[0]} ${svg_spatial_wh[1]}`">
          <svg id="spatialGroup" :width="spatial_wh[0]" :height="spatial_wh[1]" x="30" y="30" style="pointer-events:bounding-box"></svg>
        </svg>
      </v-card>
      <v-row>
        <v-col cols="12" sm="10">
          <template v-if="!isClusterView && !spatialRun">
            <div :style="{ 'background-image': colorBarmap, 'display': 'flex' }" >
              <div v-for="step in stepArray" v-bind:key="`${step}`" :style="{ 'color': colorbarText, 'font-size': '18px', 'font-weight': 'bold', 'width': '20%', 'text-align': 'center' }" >
              {{ step }}
              </div>
            </div>
          </template>
        </v-col>
      </v-row>
    </v-col>
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
            :disabled="!spatialData"
            @click="resetScaleAndPosUMAP"
            ><v-icon small>mdi-arrow-expand</v-icon>
            </v-btn>
          </v-row>
          <v-row justify="end">
            <v-btn
              small
              icon
              color="primary"
              :disabled="!spatialData"
              @click="reScaleUMAP('plus')"
              ><v-icon small>mdi-magnify-plus</v-icon>
            </v-btn>
          </v-row>
          <v-row justify="end">
            <v-btn
              small
              icon
              color="primary"
              :disabled="!spatialData"
              @click="reScaleUMAP('neg')"
              ><v-icon small>mdi-magnify-minus</v-icon>
            </v-btn>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" sm="5">
      <v-card
        :loading="loading"
        class="rounded-0"
        flat
        v-resize="onResize"
        :style="{ 'background-color': 'transparent', 'overflow-x': 'None' }"
        height="50vh"
        @mousedown="mouseDownOnStageRight"
        @mousemove="mouseMoveOnStageRight"
        @mouseup="mouseUpOnStageRight"
        @mouseleave="hideToolTipU">
        <div id="toolTipUmap" :style="{'width':'max-content','position': 'absolute','z-index': '999','background-color': 'white', 'opacity': '0.7','visibility': visibilityUmap, 'top': TTpositionUmap[1], 'left': TTpositionUmap[0], 'border-radius': '3px', 'font-size': '12px', 'text-align': 'left'}">{{toolTipTextUmap}}</div>
        <svg id="svgUmap" style="" :width="konvaConfigRight.width" :height="konvaConfigRight.height" :viewBox="`0 0 ${svg_umap_wh[0]} ${svg_umap_wh[1]}`">
          <svg id="umapGroup" :width="umap_wh[0]" :height="umap_wh[1]" x="30" y="30" style="pointer-events:bounding-box"></svg>
        </svg>
      </v-card>
      <v-row>
        <v-col cols="12" sm="10">
          <template v-if="!isClusterView && !spatialRun">
            <div :style="{ 'background-image': colorBarmap, 'display': 'flex' }" >
              <div v-for="step in stepArray" v-bind:key="`${step}`" :style="{ 'color': colorbarText, 'font-size': '18px', 'font-weight': 'bold', 'width': '20%', 'text-align': 'center' }" >
              {{ step }}
              </div>
            </div>
          </template>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang='ts'>
import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import Konva from 'konva';
import lodash from 'lodash';
import colormap from 'colormap';
import { rainbow } from '@indot/rainbowvis';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { get_uuid, generateRouteByQuery, splitarray, deepCopy } from '@/utils';
/* eslint-disable no-unused-expressions */

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});
const headers = [
  { text: 'ID', value: 'id' },
];
const clusterHeaders = [
  { text: 'Cluster', value: 'name' },
];
function colormapBounded(cmap: string[], values: number[], amount: number) {
  const min_v = Math.min(...values) + (12 * amount);
  const max_v = Math.max(...values) + (12 * amount);
  // if (min_v === max_v) return null;
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
  name: 'AtxAtacViewer',
  props: ['query', 'filename', 'selected_genes', 'heatmap', 'background', 'task', 'queue', 'standalone', 'lasso', 'rect', 'manualColor', 'clickedCluster', 'checkBoxCluster', 'indFlag', 'geneOmotif', 'idOfRun', 'antiKey', 'userBoundary', 'assay_flag', 'regulonsFlag'],
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const selectedFiles = ref<string>();
    const runId = computed(() => (props.idOfRun));
    const filenameGene = ref<string>('');
    const filenameFromParent = computed(() => props.filename);
    const colorFromParent = computed(() => props.manualColor);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    const currentTask = computed(() => props.task);
    const currentQueue = computed(() => props.queue);
    const selected = ref<any>();
    const loading = ref<boolean>(false);
    const selectedGenes = ref<any[]>([]);
    const selectedGenesFromParent = computed(() => props.selected_genes);
    const spatialData = ref<any | null>(null);
    const clusterItems = ref<any[] | null>(null);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const konvaConfigLeft = ref<any>({ x: 0, y: 0, width, height, draggable: true });
    const konvaConfigRight = ref<any>({ x: 0, y: 0, width, height, draggable: true });
    const scale = ref<number>(0.75);
    const scaleUMAP = ref<number>(0.75);
    const isClusterView = ref(true);
    const isHighlighted = ref(false);
    const lowestCount = ref<number>(10000);
    const highestCount = ref<number>(0);
    const highlightedCluster = ref<any>();
    const circlesSpatial = ref<any[]>([]);
    const circlesSpatialUMAP = ref<any[]>([]);
    const clusterColors = ref<string[]>([]);
    const inactiveColor = ref<string>('darkgray');
    const backgroundColor = computed(() => (props.background ? props.background : 'black'));
    const heatMap = computed(() => (props.heatmap ? props.heatmap : 'jet'));
    const stepArray = ref<any[]>([]);
    const colorBarmap = ref<string>('');
    const progressMessage = ref<string | null>(null);
    const geneNames = ref<any[]>([]);
    const isDrawing = computed(() => (props.lasso));
    const isDrawingRect = computed(() => (props.rect));
    const isClicked = ref<boolean>(false);
    const isClickedU = ref<boolean>(false);
    const polygon = ref<number[]>([]);
    const polygonUMAP = ref<number[]>([]);
    const regions = ref<any>();
    const regionsUMAP = ref<any>();
    const lassoSide = ref<string>();
    const colorbarText = ref<string>('white');
    const highlightIds = ref<any[]>([]);
    const topSelected = ref<any[]>([]);
    const highlightCount = ref<number>(0);
    const spatialRun = ref<boolean>(false);
    const totalInClust = ref<any>({});
    const totalInCellType = ref<any>({});
    const clickedClusterFromParent = computed(() => (props.clickedCluster));
    const checkedClusterFromParent = computed(() => (props.checkBoxCluster));
    const tableKeyFromParent = computed(() => (props.antiKey));
    const averageInd = computed(() => (props.indFlag));
    const geneObject = ref<any>({});
    const motifObject = ref<any>({});
    const tixelObject = ref<any>({});
    const minX = ref<number>(0);
    const minY = ref<number>(0);
    const maxX = ref<number>(0);
    const maxY = ref<number>(0);
    const minX_UMAP = ref<number>(0);
    const minY_UMAP = ref<number>(0);
    const maxX_UMAP = ref<number>(0);
    const maxY_UMAP = ref<number>(0);
    const geneSummation = ref<any[]>([]);
    const geneMotif = computed(() => (props.geneOmotif));
    const maxMinBoundaryFromParents = computed(() => (props.userBoundary));
    const maxMinBoundary = ref<any[]>([]);
    const currentClickedCluster = ref<string>('');
    const originalClickedPoint = ref<number[]>([]);
    const originalClickedPointU = ref<number[]>([]);
    const globalSpatialGroup = ref<any>();
    const globalUmapGroup = ref<any>();
    const globalSvgS = ref<any>();
    const globalSvgU = ref<any>();
    const translatePoint = ref<number[]>([]);
    const translatePointU = ref<number[]>([]);
    const svg_spatial_wh = ref<number[]>([0, 0]);
    const svg_umap_wh = ref<number[]>([0, 0]);
    const spatial_wh = ref<number[]>([0, 0]);
    const umap_wh = ref<number[]>([0, 0]);
    const bufferSize = 1;
    const buffer: any = [];
    let strPath = '';
    let strPathUmap = '';
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathUmap = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    let startRectCoords: number[];
    const rectUmap = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    let startRectUmapCoords: number[];
    const initialized = ref<boolean>(false);
    const toolTipSpatial = document.getElementById('toolTipSpatial');
    const toolTipUmap = document.getElementById('toolTipUmap');
    const visibility = ref<string>('hidden');
    const visibilityUmap = ref<string>('hidden');
    const toolTipTextUmap = ref<string>('');
    const TTposition = ref<string[]>(['0', '0']);
    const TTpositionUmap = ref<string[]>(['0', '0']);
    const assayFlag = computed(() => (props.assay_flag));
    const regulons_flag = computed(() => (props.regulonsFlag));
    const current_tixel_colors = ref<string[]>([]);
    const multi_sample_flag = ref<boolean>(false);
    const clusters_ann_flag = ref<boolean>(false);
    let position_of_celltype = 0;
    async function fitStageToParent() {
      const parent = document.querySelector('#stageParentDualAtac');
      if (!parent) return;
      const parentWidth = (parent as any).offsetWidth;
      const parentHeight = (parent as any).offsetHeight;
      konvaConfigLeft.value.width = parentWidth;
      konvaConfigLeft.value.height = parentHeight;
      konvaConfigRight.value.width = parentWidth;
      konvaConfigRight.value.height = parentHeight;
      svg_spatial_wh.value = [konvaConfigLeft.value.width, konvaConfigLeft.value.height];
      svg_umap_wh.value = [konvaConfigRight.value.width, konvaConfigRight.value.height];
      const el = document.getElementById('spatialGroup')!;
      const el2 = document.getElementById('umapGroup')!;
      spatial_wh.value = [el.getBoundingClientRect().width, el.getBoundingClientRect().height];
      umap_wh.value = [el2.getBoundingClientRect().width, el2.getBoundingClientRect().height];
    }
    function remove(item: any) {
      const newArr = selectedGenes.value.filter((x: any) => x !== item.name);
      selectedGenes.value = newArr;
    }
    function unHighlightCluster() {
      const colors: any[] = [];
      const celltype: any = {};
      if (!clusters_ann_flag.value) {
        lodash.each(heatMap.value, (value: any, key: any) => {
          colors.push(value);
        });
      } else {
        const celltype_list = Object.keys(totalInCellType.value);
        const heatMapValues = heatMap.value;
        celltype_list.forEach((v: any, i: any) => {
          celltype[v] = heatMapValues[i];
        });
      }
      for (let i = 0; i < spatialData.value.spatial.length; i += 1) {
        const tixel = document.getElementById(`tixel${i}`);
        const tixelUmap = document.getElementById(`tixelUmap${i}`);
        const regex = /\d+/g;
        let string;
        if (!clusters_ann_flag.value) string = (tixel) ? tixel.getAttribute('cluster') : '';
        else string = (tixel) ? tixel.getAttribute('celltype') : '';
        if (isClusterView.value || averageInd.value) {
          if (!clusters_ann_flag.value) {
            const match = Number(string!.match(regex)![0]) - 1;
            const color = colors[match];
            tixel?.setAttribute('fill', `${color}`);
            tixelUmap?.setAttribute('fill', `${color}`);
          } else {
            const type = (tixel) ? tixel.getAttribute('celltype') : '';
            tixel?.setAttribute('fill', `${celltype[type!]}`);
            tixelUmap?.setAttribute('fill', `${celltype[type!]}`);
          }
        } else {
          tixel?.setAttribute('fill', `${current_tixel_colors.value[i]}`);
          tixelUmap?.setAttribute('fill', `${current_tixel_colors.value[i]}`);
        }
        tixel?.setAttribute('opacity', '1.0');
        tixelUmap?.setAttribute('opacity', '1.0');
      }
      highlightedCluster.value = '';
    }
    function pointInPolygon(point: number[], vs: any[]) { // point is like [5,5], vs is like [[1,2],[10,20],[100,200]]
      let inside = false;
      if (isDrawing.value) {
        const [x, y] = point;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i + 0, i += 1) {
          const [xi, yi] = vs[i];
          const [xj, yj] = vs[j];
          const intersect = ((yi > y) !== (yj > y)) && (x < ((((xj - xi) * (y - yi)) / (yj - yi)) + xi));
          if (intersect) inside = !inside;
        }
      }
      if (isDrawingRect.value) {
        const [x, y] = point;
        let info: any;
        if (lassoSide.value === 'left') {
          info = regions.value[0].points;
        } else {
          info = regionsUMAP.value[0].points;
        }
        if (x >= info[0] && x <= info[0] + info[2]) {
          if (y >= info[1] && y <= info[1] + info[3]) {
            inside = true;
          }
        }
      }
      return inside;
    }
    function highlightRegion() {
      highlightIds.value = [];
      const funcInsideRegions = (pt: number[]) => {
        let res = false;
        if (lassoSide.value === 'left') {
          regions.value.forEach((poly: any, idx: number) => {
            if (isDrawing.value) if (pointInPolygon(pt, splitarray(poly.points, 2))) res = true;
            if (isDrawingRect.value) if (pointInPolygon(pt, [])) res = true;
          });
        }
        if (lassoSide.value === 'right') {
          regionsUMAP.value.forEach((poly: any, idx: number) => {
            if (isDrawing.value) if (pointInPolygon(pt, splitarray(poly.points, 2))) res = true;
            if (isDrawingRect.value) if (pointInPolygon(pt, [])) res = true;
          });
        }
        return res;
      };
      const getCirclePositions = (element: any) => {
        const svg = element.ownerSVGElement;
        const moveXvalue = (lassoSide.value === 'left') ? globalSpatialGroup.value.getAttribute('x') : globalUmapGroup.value.getAttribute('x');
        const moveYvalue = (lassoSide.value === 'left') ? globalSpatialGroup.value.getAttribute('y') : globalUmapGroup.value.getAttribute('y');
        const pt = { x: parseFloat(moveXvalue) + parseFloat(element.cx.baseVal.value), y: parseFloat(moveYvalue) + parseFloat(element.cy.baseVal.value) };
        return pt;
      };
      const filteredIndex: any = [];
      if (lassoSide.value === 'left') {
        for (let i = 0; i < spatialData.value.spatial.length; i += 1) {
          const tixel = document.getElementById(`tixel${i}`);
          const transformedCoords = getCirclePositions(tixel);
          filteredIndex.push(funcInsideRegions([transformedCoords.x!, transformedCoords.y!]));
        }
      } else {
        for (let i = 0; i < spatialData.value.spatial.length; i += 1) {
          const tixel = document.getElementById(`tixelUmap${i}`);
          const transformedCoords = getCirclePositions(tixel);
          filteredIndex.push(funcInsideRegions([transformedCoords.x!, transformedCoords.y!]));
        }
      }
      const hitCount = filteredIndex.filter((x: boolean) => x).length;
      highlightCount.value = hitCount;
      if (hitCount < 1) {
        topSelected.value = [];
        unHighlightCluster();
        return;
      }
      lodash.each(filteredIndex, (v: boolean, idx: number) => {
        const tixel = document.getElementById(`tixel${idx}`);
        const tixelUmap = document.getElementById(`tixelUmap${idx}`);
        if (!v) {
          tixel?.setAttribute('opacity', '0.3');
          tixelUmap?.setAttribute('opacity', '0.2');
        } else highlightIds.value.push(idx);
      });
    }
    function highlightCluster(clusterName: string[]) {
      const colors: any[] = [];
      const celltype: any = {};
      if (!clusters_ann_flag.value) {
        lodash.each(heatMap.value, (value: any, key: any) => {
          colors.push(value);
        });
      } else {
        const celltype_list = Object.keys(totalInCellType.value);
        const heatMapValues = heatMap.value;
        celltype_list.forEach((v: any, i: any) => {
          celltype[v] = heatMapValues[i];
        });
      }
      if (backgroundColor.value === 'darkgrey') {
        inactiveColor.value = 'white';
      } else {
        inactiveColor.value = 'darkgrey';
      }
      for (let i = 0; i < spatialData.value.spatial.length; i += 1) {
        const tixel = document.getElementById(`tixel${i}`);
        const tixelUmap = document.getElementById(`tixelUmap${i}`);
        const regex = /\d+/g;
        let string;
        if (!clusters_ann_flag.value) string = (tixel) ? tixel.getAttribute('cluster') : '';
        else string = (tixel) ? tixel.getAttribute('celltype') : '';
        if (clusterName.includes(string!)) {
          if (isClusterView.value || averageInd.value) {
            if (!clusters_ann_flag.value) {
              const match = Number(string!.match(regex)![0]) - 1;
              const color = colors[match];
              tixel?.setAttribute('fill', `${color}`);
              tixelUmap?.setAttribute('fill', `${color}`);
            } else {
              const type = (tixel) ? tixel.getAttribute('celltype') : '';
              tixel?.setAttribute('fill', `${celltype[type!]}`);
              tixelUmap?.setAttribute('fill', `${celltype[type!]}`);
            }
          } else {
            tixel?.setAttribute('fill', `${current_tixel_colors.value[i]}`);
            tixelUmap?.setAttribute('fill', `${current_tixel_colors.value[i]}`);
          }
        } else {
          tixel?.setAttribute('fill', `${inactiveColor.value}`);
          tixelUmap?.setAttribute('fill', `${inactiveColor.value}`);
        }
      }
      highlightedCluster.value = clusterName;
      isHighlighted.value = true;
    }
    function makearray(stopValue: number, startValue: number): any[] {
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
    async function resizeCircles() {
      if (!initialized.value) return;
      const radiusSize = (spatialData.value.spatial.length < 4000) ? 22 : 44;
      const radiusSizeUmap = (spatialData.value.spatial.length < 4000) ? 30 : 58;
      const { width: stageWidth, height: stageHeight } = konvaConfigLeft.value;
      const { width: stageWidthR, height: stageHeightR } = konvaConfigRight.value;
      const viewScale = Math.min(stageWidth / (maxX.value - minX.value), stageHeight / (maxY.value - minY.value));
      const viewScaleUMAP = Math.min(stageWidthR / (maxX_UMAP.value - minX_UMAP.value), stageHeightR / (maxY_UMAP.value - minY_UMAP.value));
      const radius = (Math.min(stageWidth, stageHeight) / (radiusSize * 5)) * scale.value;
      const radiusUMAP = (Math.min(stageWidthR, stageHeightR) / (radiusSizeUmap * 5)) * scaleUMAP.value;
      const inV = scale.value * viewScale * minX.value - radius;
      const inH = scale.value * viewScale * minY.value - radius;
      const inVU = scaleUMAP.value * viewScaleUMAP * minX_UMAP.value - radiusUMAP;
      const inHU = scaleUMAP.value * viewScaleUMAP * minY_UMAP.value - radiusUMAP;
      spatialData.value.spatial.forEach((v: string[], i: number) => {
        const x = parseFloat(v[1]);
        const y = parseFloat(v[2]);
        const auX = parseFloat(v[3]);
        const auY = parseFloat(v[4]);
        const circle = document.getElementById(`tixel${i}`)!;
        const circleUmap = document.getElementById(`tixelUmap${i}`)!;
        circle.setAttribute('cx', `${x * scale.value * viewScale - inV}`);
        circle.setAttribute('cy', `${y * scale.value * viewScale - inH}`);
        circle.setAttribute('r', `${radius}`);
        circleUmap.setAttribute('cx', `${auX * scaleUMAP.value * viewScaleUMAP - inVU}`);
        circleUmap.setAttribute('cy', `${auY * scaleUMAP.value * viewScaleUMAP - inHU}`);
        circleUmap.setAttribute('r', `${radiusUMAP}`);
      });
    }
    async function initializePlots() {
      const colors: any[] = [];
      lodash.each(heatMap.value, (value: any, key: any) => {
        colors.push(value);
      });
      const radiusSize = (spatialData.value.spatial.length < 4000) ? 22 : 44;
      const radiusSizeUmap = (spatialData.value.spatial.length < 4000) ? 30 : 58;
      const { width: stageWidth, height: stageHeight } = konvaConfigLeft.value;
      const { width: stageWidthR, height: stageHeightR } = konvaConfigRight.value;
      const viewScale = Math.min(stageWidth / (maxX.value - minX.value), stageHeight / (maxY.value - minY.value));
      const viewScaleUMAP = Math.min(stageWidthR / (maxX_UMAP.value - minX_UMAP.value), stageHeightR / (maxY_UMAP.value - minY_UMAP.value));
      const radius = (Math.min(stageWidth, stageHeight) / (radiusSize * 5)) * scale.value;
      const radiusUMAP = (Math.min(stageWidthR, stageHeightR) / (radiusSizeUmap * 5)) * scaleUMAP.value;
      const [paddingX, paddingY] = [60, 30];
      const inV = scale.value * viewScale * minX.value - radius;
      const inH = scale.value * viewScale * minY.value - radius;
      const inVU = scaleUMAP.value * viewScaleUMAP * minX_UMAP.value - radiusUMAP;
      const inHU = scaleUMAP.value * viewScaleUMAP * minY_UMAP.value - radiusUMAP;
      const NS = 'http://www.w3.org/2000/svg';
      globalSpatialGroup.value = document.getElementById('spatialGroup')!;
      globalUmapGroup.value = document.getElementById('umapGroup')!;
      globalSvgS.value = document.getElementById('svgSpatial')!;
      globalSvgU.value = document.getElementById('svgUmap')!;
      const TSS: any = [];
      const nFrags: any = [];
      spatialData.value.spatial.forEach((v: string[], i: number) => {
        TSS.push(parseFloat(v[5]));
        nFrags.push(parseFloat(v[6]));
        const x = parseFloat(v[1]);
        const y = parseFloat(v[2]);
        const auX = parseFloat(v[3]);
        const auY = parseFloat(v[4]);
        const regex = /\d+/g;
        const string = v[0];
        const match = Number(string.match(regex)![0]) - 1;
        const circle = document.createElementNS(NS, 'circle');
        const circleUmap = document.createElementNS(NS, 'circle');
        circle.setAttribute('cx', `${x * scale.value * viewScale - inV}`);
        circle.setAttribute('cy', `${y * scale.value * viewScale - inH}`);
        circle.setAttribute('r', `${radius}`);
        circle.setAttribute('fill', `${colors[match]}`);
        circle.setAttribute('id', `tixel${i}`);
        circle.setAttribute('cluster', `${v[0]}`);
        circle.setAttribute('opacity', '1.0');
        circleUmap.setAttribute('cx', `${auX * scaleUMAP.value * viewScaleUMAP - inVU}`);
        circleUmap.setAttribute('cy', `${auY * scaleUMAP.value * viewScaleUMAP - inHU}`);
        circleUmap.setAttribute('r', `${radiusUMAP}`);
        circleUmap.setAttribute('fill', `${colors[match]}`);
        circleUmap.setAttribute('id', `tixelUmap${i}`);
        circleUmap.setAttribute('cluster', `${v[0]}`);
        circleUmap.setAttribute('opacity', '1.0');
        if (position_of_celltype !== 0) {
          circle.setAttribute('celltype', `${v[position_of_celltype]}`);
          circleUmap.setAttribute('celltype', `${v[position_of_celltype]}`);
        }
        if (multi_sample_flag.value) {
          circle.setAttribute('sample', `${v[7]}`);
          circle.setAttribute('treatment', `${v[8]}`);
          circleUmap.setAttribute('sample', `${v[7]}`);
          circleUmap.setAttribute('treatment', `${v[8]}`);
        }
        globalSpatialGroup.value.appendChild(circle);
        globalUmapGroup.value.appendChild(circleUmap);
      });
      spatial_wh.value = [globalSpatialGroup.value.getBoundingClientRect().width, globalSpatialGroup.value.getBoundingClientRect().height];
      umap_wh.value = [globalUmapGroup.value.getBoundingClientRect().width, globalUmapGroup.value.getBoundingClientRect().height];
      initialized.value = true;
      ctx.emit('spatialCircleData', [TSS, nFrags]);
    }
    async function updateCircles() {
      if (spatialData.value === null || spatialData.value.spatial === undefined) return;
      isHighlighted.value = false;
      const circles: any[] = [];
      stepArray.value = [];
      const colors: any[] = [];
      let colors_intensity: any[] = [];
      const geneSum: number[] = [];
      const celltype: any = {};
      if (!clusters_ann_flag.value) {
        lodash.each(heatMap.value, (value: any, key: any) => {
          colors.push(value);
        });
      } else {
        const celltype_list = Object.keys(totalInCellType.value);
        const heatMapValues = heatMap.value;
        celltype_list.forEach((v: any, i: any) => {
          celltype[v] = heatMapValues[i];
        });
      }
      colors_intensity = colormap({ colormap: 'jet', nshades: 64, format: 'hex', alpha: 1 });
      colorBarmap.value = `linear-gradient(to right, ${colors_intensity[0]}, ${colors_intensity[16]}, ${colors_intensity[32]} , ${colors_intensity[48]}, ${colors_intensity[63]})`;
      clusterColors.value = colors;
      highestCount.value = -10000;
      lowestCount.value = 10000;
      let summer = 0;
      if (isClusterView.value || averageInd.value) {
        const coordinatesSib: any = [];
        const TSS: any = [];
        const nFrags: any = [];
        spatialData.value.spatial.forEach((v: string[], i: number) => {
          summer = 0;
          TSS.push(parseFloat(v[5]));
          nFrags.push(parseFloat(v[6]));
          const x = parseFloat(v[1]);
          const y = parseFloat(v[2]);
          const regex = /\d+/g;
          const string = v[0];
          const match = Number(string.match(regex)![0]) - 1;
          coordinatesSib.push([x, y, v]);
          const c = {
            cluster: v[0],
            ogx: x,
            ogy: y,
            total: 0,
            genes: { },
          };
          const tixel = document.getElementById(`tixel${i}`);
          const tixelUmap = document.getElementById(`tixelUmap${i}`);
          if (!clusters_ann_flag.value) {
            tixel?.setAttribute('fill', `${colors[match]}`);
            tixelUmap?.setAttribute('fill', `${colors[match]}`);
          } else {
            tixel?.setAttribute('fill', `${celltype[v[position_of_celltype]]}`);
            tixelUmap?.setAttribute('fill', `${celltype[v[position_of_celltype]]}`);
          }
          selectedGenes.value.forEach((id: any, index: any) => {
            summer += parseFloat(geneSummation.value[index][i]);
            (c.genes as any)[id] = parseFloat(geneSummation.value[index][i]);
          });
          if (averageInd.value) {
            c.total = summer;
            geneSum.push(checkBoundary(summer));
            const avg = summer / selectedGenes.value.length;
            if (avg > highestCount.value) highestCount.value = avg;
            if (avg < lowestCount.value) lowestCount.value = avg;
          }
          circles.push(c);
        });
        if (isClusterView.value) {
          ctx.emit('spatialCircleData', [TSS, nFrags]);
        } else ctx.emit('spatialCircleData', circles);
      } else {
        spatialData.value.spatial.forEach((v: string[], i: number) => {
          summer = 0;
          const x = parseFloat(v[1]);
          const y = parseFloat(v[2]);
          const c = {
            cluster: v[0],
            ogx: x,
            ogy: y,
            total: 0,
            genes: { },
          };
          selectedGenes.value.forEach((id: any, index: any) => {
            summer += parseFloat(geneSummation.value[index][i]);
            (c.genes as any)[id] = parseFloat(geneSummation.value[index][i]);
          });
          c.total = summer;
          geneSum.push(checkBoundary(summer));
          const avg = summer / selectedGenes.value.length;
          if (avg > highestCount.value) highestCount.value = avg;
          if (avg < lowestCount.value) lowestCount.value = avg;
          circles.push(c);
        });
        const geneColors = colormapBounded(colors_intensity, geneSum, selectedGenes.value.length);
        ctx.emit('spatialCircleData', circles);
        circles.forEach((v: any, i: any) => {
          const col = checkBoundaryColor(circles[i].total);
          const clr = (col) ? geneColors[i] : inactiveColor.value;
          current_tixel_colors.value.push(clr);
          const tixel = document.getElementById(`tixel${i}`);
          const tixelUmap = document.getElementById(`tixelUmap${i}`);
          tixel?.setAttribute('fill', `${clr}`);
          tixelUmap?.setAttribute('fill', `${clr}`);
        });
        stepArray.value = makearray((maxMinBoundary.value.length !== 0) ? parseFloat(maxMinBoundary.value[0]) : highestCount.value, (maxMinBoundary.value.length !== 0) ? parseFloat(maxMinBoundary.value[1]) : lowestCount.value);
        ctx.emit('maxMinCount', [highestCount.value.toString(), lowestCount.value.toString()]);
      }
      if (averageInd.value) {
        ctx.emit('singleCircleData', { coords: circles, intense: colors_intensity });
        ctx.emit('sendColorBar', { color: colorBarmap.value, maxMin: [minX.value, minY.value, maxX.value, maxY.value], tixelColor: colors_intensity });
        ctx.emit('maxMinCount', [highestCount.value.toString(), lowestCount.value.toString()]);
      }
      spatialRun.value = false;
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
    };
    async function retrieveData() {
      /* eslint-disable no-lonely-if */
      if (spatialData.value === null) {
        spatialData.value = {};
        if (!props.query.public) {
          const tixelFileName = `data/${runId.value}/h5/data.csv.gz`;
          const spatial = await client.value!.getSpatialData(tixelFileName);
          spatialData.value.spatial = spatial;
        } else {
          const spatial = await client.value!.getSpatialDataByToken(filenameGene.value, 0);
          spatialData.value.spatial = spatial;
          const gene = await client.value!.getGeneMotifNamesByToken(filenameGene.value, 1);
          spatialData.value.gene = gene;
          if (!assayFlag.value) {
            const motif = await client.value!.getGeneMotifNamesByToken(filenameGene.value, 2);
            spatialData.value.motif = motif;
          }
          if (regulons_flag.value) {
            const regulon = await client.value!.getGeneMotifNamesByToken(filenameGene.value, 3);
            spatialData.value.eRegulon = regulon;
          }
        }
        const spatialX: number[] = [];
        const spatialY: number[] = [];
        const umapX: number[] = [];
        const umapY: number[] = [];
        const totalHold: any = {};
        const cellTypeHold: any = {};
        if (spatialData.value.spatial[0].length === 8) position_of_celltype = 7;
        else if (spatialData.value.spatial[0].length === 9) multi_sample_flag.value = true;
        else if (spatialData.value.spatial[0].length === 10) {
          multi_sample_flag.value = true;
          position_of_celltype = 9;
        }
        spatialData.value.spatial.forEach((list: string[], index: any) => {
          if (list[0].includes('C')) {
            spatialX.push(parseFloat(list[1]));
            spatialY.push(parseFloat(list[2]));
            umapX.push(parseFloat(list[3]));
            umapY.push(parseFloat(list[4]));
            if (!Object.keys(totalHold).includes(list[0])) totalHold[list[0]] = 1;
            else totalHold[list[0]] += 1;
            if (position_of_celltype !== 0) {
              if (!Object.keys(cellTypeHold).includes(list[position_of_celltype])) cellTypeHold[list[position_of_celltype]] = 1;
              else cellTypeHold[list[position_of_celltype]] += 1;
            }
          }
        });
        const sorter = Object.keys(totalHold);
        const sorterCellType = Object.keys(cellTypeHold);
        sorter.sort((a: any, b: any) => {
          if (a.match(/C\d+/) === null || b.match(/C\d+/) === null) return 0;
          const xCsplit = a.match(/C\d+/)[0];
          const yCsplit = b.match(/C\d+/)[0];
          const x = parseFloat(xCsplit.split('C')[1]);
          const y = parseFloat(yCsplit.split('C')[1]);
          if (x < y) return -1;
          if (x > y) return 1;
          return 0;
        });
        sorterCellType.sort();
        sorter.forEach((v: any, index: any) => {
          totalInClust.value[v] = totalHold[v];
        });
        sorterCellType.forEach((v: any, index: any) => {
          totalInCellType.value[v] = cellTypeHold[v];
        });
        minX.value = Math.min(...spatialX);
        minY.value = Math.min(...spatialY);
        maxX.value = Math.max(...spatialX);
        maxY.value = Math.max(...spatialY);
        minX_UMAP.value = Math.min(...umapX);
        minY_UMAP.value = Math.min(...umapY);
        maxX_UMAP.value = Math.max(...umapX);
        maxY_UMAP.value = Math.max(...umapY);
        initializePlots();
      }
      if (!props.query.public && (spatialData.value.gene === null || spatialData.value.gene === undefined)) {
        const geneFileName = `data/${runId.value}/h5/geneNames.txt.gz`;
        const gene = await client.value!.getGeneMotifNames(geneFileName);
        spatialData.value.gene = gene;
        if (!assayFlag.value) {
          const motifFileName = `data/${runId.value}/h5/motifNames.txt.gz`;
          const motif = await client.value!.getGeneMotifNames(motifFileName);
          spatialData.value.motif = motif;
        }
        if (regulons_flag.value) {
          const regulonFileName = `data/${runId.value}/h5/eRegulonNames.txt.gz`;
          const regulon = await client.value!.getGeneMotifNames(regulonFileName);
          regulon.sort();
          spatialData.value.eRegulon = regulon;
        }
      }
      loading.value = false;
      if (geneMotif.value === 'gene') {
        ctx.emit('totalClust', totalInClust.value);
        clusters_ann_flag.value = false;
        ctx.emit('totalGM', spatialData.value.gene);
      } else if (geneMotif.value === 'motif') {
        ctx.emit('totalClust', totalInClust.value);
        clusters_ann_flag.value = false;
        ctx.emit('totalGM', spatialData.value.motif);
      } else if (geneMotif.value === 'eRegulon') {
        ctx.emit('totalClust', totalInCellType.value);
        ctx.emit('totalGM', spatialData.value.eRegulon);
        if (position_of_celltype !== 0) {
          clusters_ann_flag.value = true;
          updateCircles();
        } else clusters_ann_flag.value = false;
      }
    }
    async function runSpatial() {
      if (!client.value) return;
      // if (!selectedFiles.value) return;
      try {
        if (highlightIds.value.length > 0) {
          loading.value = true;
          progressMessage.value = null;
          spatialRun.value = true;
          const task = currentTask.value;
          const queue = currentQueue.value;
          const args = [filenameGene.value, highlightIds.value, tableKeyFromParent.value];
          const kwargs = {};
          let which_h5ad = 0;
          if (props.query.public) {
            if (geneMotif.value === 'gene') which_h5ad = 4;
            if (geneMotif.value === 'motif') which_h5ad = 5;
            if (geneMotif.value === 'eRegulon') which_h5ad = 6;
          }
          const taskObject = props.query.public ? await client.value.postPublicTask(task, args, kwargs, queue, which_h5ad) : await client.value.postTask(task, args, kwargs, queue);
          await checkTaskStatus(taskObject._id);
          /* eslint-disable no-await-in-loop */
          while (taskStatus.value.status !== 'SUCCESS' && taskStatus.value.status !== 'FAILURE') {
            if (taskStatus.value.status === 'PROGRESS') {
              progressMessage.value = `${taskStatus.value.progress}% - ${taskStatus.value.position}`;
            }
            await new Promise((r) => {
              taskTimeout.value = window.setTimeout(r, 1000);
            });
            taskTimeout.value = null;
            await checkTaskStatus(taskObject._id);
          }
          /* eslint-disable no-await-in-loop */
          if (taskStatus.value.status !== 'SUCCESS') {
            snackbar.dispatch({ text: 'Worker failed in AtxAtacViewer', options: { right: true, color: 'error' } });
            loading.value = false;
            return;
          }
          progressMessage.value = taskStatus.value.status;
          const resp = taskStatus.value.result;
          ctx.emit('highlightedId', { ids: highlightIds.value, genes: resp.top_selected });
          loading.value = false;
        } else {
          await fitStageToParent();
        }
      } catch (error) {
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: error, options: { right: true, color: 'error' } });
      }
      spatialRun.value = false;
    }
    async function obtainSummations() {
      let tixelDataFilename = '';
      let array: string[];
      if (geneMotif.value === 'gene') {
        tixelDataFilename = `data/${runId.value}/h5/summations/geneSummation`;
        array = spatialData.value.gene;
      } else if (geneMotif.value === 'motif') {
        tixelDataFilename = `data/${runId.value}/h5/summations/motifSummation`;
        array = spatialData.value.motif;
      } else if (geneMotif.value === 'eRegulon') {
        tixelDataFilename = `data/${runId.value}/h5/summations/eRegulonSummation`;
        array = spatialData.value.eRegulon;
      }
      const rows = selectedGenes.value.map((v: string) => array.indexOf(v));
      const preSplit = await client.value?.getSummation(tixelDataFilename, rows);
      const emptyArrayHolder: any[] = [];
      preSplit.forEach((value: string, index: any) => {
        emptyArrayHolder.push(value.split(','));
      });
      geneSummation.value = emptyArrayHolder;
    }
    // Drawing Region
    function removeRegions() {
      strPath = '';
      strPathUmap = '';
      path.setAttribute('d', '');
      pathUmap.setAttribute('d', '');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', '0');
      rect.setAttribute('height', '0');
      rectUmap.setAttribute('x', '0');
      rectUmap.setAttribute('y', '0');
      rectUmap.setAttribute('width', '0');
      rectUmap.setAttribute('height', '0');
      regionsUMAP.value = [];
      polygonUMAP.value = [];
      regions.value = [];
      polygon.value = [];
      unHighlightCluster();
    }

    const appendToBuffer = (pt: any) => {
      buffer.push(pt);
      while (buffer.length > bufferSize) {
        buffer.shift();
      }
    };
    const getAveragePoint = (offset: number) => {
      const len = buffer.length;
      if (len % 2 === 1 || len >= bufferSize) {
        let totalX = 0;
        let totalY = 0;
        let pt;
        let i;
        let count = 0;
        for (i = offset; i < len; i += 1) {
          count += 1;
          pt = buffer[i];
          totalX += pt.x;
          totalY += pt.y;
        }
        return {
          x: totalX / count,
          y: totalY / count,
        };
      }
      return { x: 'no' };
    };
    const updateSvgPath = () => {
      let pt = getAveragePoint(0);
      if (pt.x !== 'no') {
        if (isClicked.value) strPath += ` L${pt.x} ${pt.y}`;
        if (isClickedU.value) strPathUmap += ` L${pt.x} ${pt.y}`;
        let tmpPath = '';
        for (let offset = 2; offset < buffer.length; offset += 2) {
          pt = getAveragePoint(offset);
          tmpPath += ` L${pt.x} ${pt.y}`;
        }
        if (isClicked.value) path.setAttribute('d', strPath + tmpPath);
        if (isClickedU.value) pathUmap.setAttribute('d', strPathUmap + tmpPath);
      }
    };
    function showToolTipSpatial(clust: string, sample: string, treat: string) {
      const toolTipDiv = document.getElementById('toolTipSpatial');
      while (toolTipDiv?.firstChild) {
        toolTipDiv?.firstChild.remove();
      }
      if (!multi_sample_flag.value) {
        const paragraph = document.createElement('p');
        paragraph.innerText = (!clusters_ann_flag.value) ? `Cluster: ${clust}` : `CellType: ${clust}`;
        paragraph.setAttribute('style', 'margin: 0; padding: 0');
        toolTipDiv?.appendChild(paragraph);
      } else {
        const values = [clust, sample, treat];
        const key = [(!clusters_ann_flag.value) ? 'Cluster' : 'CellType', 'Run_ID', 'Condition'];
        values.forEach((v: string, i: any) => {
          const paragraph = document.createElement('p');
          paragraph.innerText = `${key[i]}: ${values[i]}`;
          paragraph.setAttribute('style', 'margin: 0; padding: 0');
          toolTipDiv?.appendChild(paragraph);
        });
      }
      visibility.value = 'visible';
    }
    function showToolTipUmap(clust: any) {
      toolTipTextUmap.value = (!clusters_ann_flag.value) ? `Cluster: ${clust}` : `CellType: ${clust}`;
      visibilityUmap.value = 'visible';
    }
    function hideToolTipS() {
      visibility.value = 'hidden';
    }
    function hideToolTipU() {
      visibilityUmap.value = 'hidden';
    }
    function mouseDownOnStageLeft(ev: any) {
      isClicked.value = true;
      visibility.value = 'hidden';
      const point = globalSvgS.value.createSVGPoint();
      point.x = ev.clientX;
      point.y = ev.clientY;
      const ctm = globalSvgS.value.getScreenCTM();
      const normalize_pointer = point.matrixTransform(ctm.inverse());
      if (isDrawing.value) {
        lassoSide.value = 'left';
        removeRegions();
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#6ffc03');
        path.setAttribute('stroke-width', '1');
        if (!path.getAttribute('id')) path.setAttribute('id', 'spa');
        appendToBuffer({ x: normalize_pointer.x, y: normalize_pointer.y });
        strPath += `M${normalize_pointer.x} ${normalize_pointer.y}`;
        path.setAttribute('d', strPath);
        globalSvgS.value.appendChild(path);
      } else if (isDrawingRect.value) {
        lassoSide.value = 'left';
        removeRegions();
        rect.setAttribute('x', `${normalize_pointer.x}`);
        rect.setAttribute('y', `${normalize_pointer.y}`);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', '#6ffc03');
        rect.setAttribute('width', '0');
        rect.setAttribute('height', '0');
        globalSvgS.value.appendChild(rect);
        startRectCoords = [normalize_pointer.x, normalize_pointer.y];
      } else {
        originalClickedPoint.value = [normalize_pointer.x, normalize_pointer.y];
        const moveXvalue = globalSpatialGroup.value.getAttribute('x');
        const moveYvalue = globalSpatialGroup.value.getAttribute('y');
        translatePoint.value = [parseFloat(moveXvalue), parseFloat(moveYvalue)];
      }
    }
    function mouseDownOnStageRight(ev: any) {
      isClickedU.value = true;
      visibilityUmap.value = 'hidden';
      const point = globalSvgU.value.createSVGPoint();
      point.x = ev.clientX;
      point.y = ev.clientY;
      const ctm = globalSvgU.value.getScreenCTM();
      const normalize_pointer = point.matrixTransform(ctm.inverse());
      if (isDrawing.value) {
        lassoSide.value = 'right';
        removeRegions();
        pathUmap.setAttribute('fill', 'none');
        pathUmap.setAttribute('stroke', '#6ffc03');
        pathUmap.setAttribute('stroke-width', '1');
        if (!pathUmap.getAttribute('id')) pathUmap.setAttribute('id', 'uma');
        appendToBuffer({ x: normalize_pointer.x, y: normalize_pointer.y });
        strPathUmap += `M${normalize_pointer.x} ${normalize_pointer.y}`;
        pathUmap.setAttribute('d', strPathUmap);
        globalSvgU.value.appendChild(pathUmap);
        polygonUMAP.value = [];
      } else if (isDrawingRect.value) {
        lassoSide.value = 'right';
        removeRegions();
        rectUmap.setAttribute('x', `${normalize_pointer.x}`);
        rectUmap.setAttribute('y', `${normalize_pointer.y}`);
        rectUmap.setAttribute('fill', 'none');
        rectUmap.setAttribute('stroke', '#6ffc03');
        rectUmap.setAttribute('width', '0');
        rectUmap.setAttribute('height', '0');
        globalSvgU.value.appendChild(rectUmap);
        startRectUmapCoords = [normalize_pointer.x, normalize_pointer.y];
      } else {
        originalClickedPointU.value = [normalize_pointer.x, normalize_pointer.y];
        const moveXvalue = globalUmapGroup.value.getAttribute('x');
        const moveYvalue = globalUmapGroup.value.getAttribute('y');
        translatePointU.value = [parseFloat(moveXvalue), parseFloat(moveYvalue)];
      }
    }
    function mouseMoveOnStageLeft(ev: any) {
      if (!isClicked.value) {
        if (ev.target.nodeName === 'circle') {
          const clust_cell = (!clusters_ann_flag.value) ? 5 : 7;
          const add_one = (!clusters_ann_flag.value) ? 0 : 1;
          if (!multi_sample_flag.value) showToolTipSpatial(ev.target.attributes[clust_cell].value, '', '');
          else showToolTipSpatial(ev.target.attributes[clust_cell].value, ev.target.attributes[7 + add_one].value, ev.target.attributes[8 + add_one].value);
          const post = [`${ev.offsetX + 10}px`, `${ev.offsetY - 13}px`];
          TTposition.value = post;
        } else if (ev.target.id !== 'spatialGroup' && ev.target.nodeName !== 'circle') visibility.value = 'hidden';
      } else {
        const point = globalSvgS.value.createSVGPoint();
        point.x = ev.clientX;
        point.y = ev.clientY;
        const ctm = globalSvgS.value.getScreenCTM();
        const normalize_pointer = point.matrixTransform(ctm.inverse());
        if (isDrawing.value) {
          appendToBuffer({ x: normalize_pointer.x, y: normalize_pointer.y });
          updateSvgPath();
          polygon.value.push(normalize_pointer.x);
          polygon.value.push(normalize_pointer.y);
        } else if (isDrawingRect.value) {
          const xdiff = Math.abs((normalize_pointer.x) - startRectCoords[0]);
          const ydiff = Math.abs((normalize_pointer.y) - startRectCoords[1]);
          if ((normalize_pointer.x) < startRectCoords[0]) rect.setAttribute('x', `${normalize_pointer.x}`);
          if ((normalize_pointer.y) < startRectCoords[1]) rect.setAttribute('y', `${normalize_pointer.y}`);
          rect.setAttribute('width', `${xdiff}`);
          rect.setAttribute('height', `${ydiff}`);
        } else {
          const diffX = Math.abs(originalClickedPoint.value[0] - normalize_pointer.x);
          const diffY = Math.abs(originalClickedPoint.value[1] - normalize_pointer.y);
          const x = (originalClickedPoint.value[0] < normalize_pointer.x) ? 1 : -1;
          const y = (originalClickedPoint.value[1] < normalize_pointer.y) ? 1 : -1;
          globalSpatialGroup.value.setAttribute('x', `${translatePoint.value[0] + diffX * x}`);
          globalSpatialGroup.value.setAttribute('y', `${translatePoint.value[1] + diffY * y}`);
        }
      }
    }
    function mouseMoveOnStageRight(ev: any) {
      if (!isClickedU.value) {
        if (ev.target.nodeName === 'circle') {
          showToolTipUmap(ev.target.attributes[(!clusters_ann_flag.value) ? 5 : 7].value);
          const post = [`${ev.offsetX + 10}px`, `${ev.offsetY - 13}px`];
          TTpositionUmap.value = post;
        } else if (ev.target.id !== 'umapGroup' && ev.target.nodeName !== 'circle') visibilityUmap.value = 'hidden';
      } else {
        const point = globalSvgU.value.createSVGPoint();
        point.x = ev.clientX;
        point.y = ev.clientY;
        const ctm = globalSvgU.value.getScreenCTM();
        const normalize_pointer = point.matrixTransform(ctm.inverse());
        if (isDrawing.value) {
          appendToBuffer({ x: normalize_pointer.x, y: normalize_pointer.y });
          updateSvgPath();
          polygonUMAP.value.push(normalize_pointer.x);
          polygonUMAP.value.push(normalize_pointer.y);
        } else if (isDrawingRect.value) {
          const xdiff = Math.abs((normalize_pointer.x) - startRectUmapCoords[0]);
          const ydiff = Math.abs((normalize_pointer.y) - startRectUmapCoords[1]);
          if ((normalize_pointer.x) < startRectUmapCoords[0]) rectUmap.setAttribute('x', `${normalize_pointer.x}`);
          if ((normalize_pointer.y) < startRectUmapCoords[1]) rectUmap.setAttribute('y', `${normalize_pointer.y}`);
          rectUmap.setAttribute('width', `${xdiff}`);
          rectUmap.setAttribute('height', `${ydiff}`);
        } else {
          const diffX = Math.abs(originalClickedPointU.value[0] - normalize_pointer.x);
          const diffY = Math.abs(originalClickedPointU.value[1] - normalize_pointer.y);
          const x = (originalClickedPointU.value[0] < normalize_pointer.x) ? 1 : -1;
          const y = (originalClickedPointU.value[1] < normalize_pointer.y) ? 1 : -1;
          globalUmapGroup.value.setAttribute('x', `${translatePointU.value[0] + diffX * x}`);
          globalUmapGroup.value.setAttribute('y', `${translatePointU.value[1] + diffY * y}`);
        }
      }
    }
    function mouseUpOnStageLeft(ev: any) {
      isClicked.value = false;
      if (isDrawing.value) {
        const regValue = { key: 'lasso', points: polygon.value };
        regions.value.push(regValue);
        polygon.value = [];
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial();
        }
      }
      if (isDrawingRect.value) {
        const regValue = { key: 'rect', points: [parseFloat(rect.getAttribute('x')!), parseFloat(rect.getAttribute('y')!), parseFloat(rect.getAttribute('width')!), parseFloat(rect.getAttribute('height')!)] };
        regions.value.push(regValue);
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial();
        }
      }
    }
    function mouseUpOnStageRight(ev: any) {
      isClickedU.value = false;
      if (isDrawing.value) {
        const regValue = { key: 'lasso', points: polygonUMAP.value };
        regionsUMAP.value.push(regValue);
        polygonUMAP.value = [];
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial();
        }
      }
      if (isDrawingRect.value) {
        const regValue = { key: 'rect', points: [parseFloat(rectUmap.getAttribute('x')!), parseFloat(rectUmap.getAttribute('y')!), parseFloat(rectUmap.getAttribute('width')!), parseFloat(rectUmap.getAttribute('height')!)] };
        regionsUMAP.value.push(regValue);
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial();
        }
      }
    }
    function onFilesChanged(ev: any) {
      selectedFiles.value = ev;
    }
    function reScale(scalar: string) {
      let scaled: any = [];
      if (scalar === 'plus') scaled = [svg_spatial_wh.value[0] - 20, svg_spatial_wh.value[1] - 20];
      else scaled = [svg_spatial_wh.value[0] + 20, svg_spatial_wh.value[0] + 20];
      svg_spatial_wh.value = scaled;
    }
    function reScaleUMAP(scalar: string) {
      let scaled: any = [];
      if (scalar === 'plus') scaled = [svg_umap_wh.value[0] - 20, svg_umap_wh.value[1] - 20];
      else scaled = [svg_umap_wh.value[0] + 20, svg_umap_wh.value[0] + 20];
      svg_umap_wh.value = scaled;
    }
    function resetScaleAndPos(ev: any) {
      const reset = [konvaConfigLeft.value.width, konvaConfigLeft.value.height];
      svg_spatial_wh.value = reset;
    }
    function resetScaleAndPosUMAP(ev: any) {
      const reset = [konvaConfigRight.value.width, konvaConfigRight.value.height];
      svg_umap_wh.value = reset;
    }
    async function onResize() {
      await fitStageToParent();
      resizeCircles();
    }
    watch(averageInd, (v: any) => {
      if (selectedGenes.value.length > 0) {
        updateCircles();
      }
    });
    watch(isDrawing, (v: boolean) => {
      removeRegions();
      if (!isDrawing.value) unHighlightCluster();
    });
    watch(isDrawingRect, (v: boolean) => {
      removeRegions();
      if (!isDrawingRect.value) unHighlightCluster();
    });
    watch(clickedClusterFromParent, (v: any) => {
      if (!isDrawing.value && !isDrawingRect.value) {
        if (currentClickedCluster.value === v[0]) {
          currentClickedCluster.value = '';
          unHighlightCluster();
        } else {
          [currentClickedCluster.value] = v;
          highlightCluster(v);
        }
      }
    });
    watch(checkedClusterFromParent, (v: any) => {
      if (!isDrawing.value && !isDrawingRect.value) {
        highlightCluster(v);
      }
    });
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
    watch(filenameFromParent, async (v: string) => {
      filenameGene.value = v;
      if (props.query.public) {
        spatialData.value = null;
        loading.value = true;
        retrieveData();
      }
    });
    watch(runId, async (v: any) => {
      if (v !== null && !props.query.public) {
        spatialData.value = null;
        loading.value = true;
        retrieveData();
      }
    });
    watch(geneMotif, async (v: any) => {
      if (spatialData.value !== null) {
        loading.value = true;
        if (isDrawing.value || isDrawingRect.value) runSpatial();
        retrieveData();
        if (selectedGenes.value.length > 0) selectedGenes.value = [];
      }
    });
    watch(selectedGenes, async (v: any[]) => {
      maxMinBoundary.value = [];
      if (v && selectedGenes.value.length === 0) {
        current_tixel_colors.value = [];
        isClusterView.value = true;
        stepArray.value = [];
        geneSummation.value = [];
        updateCircles();
      } else {
        current_tixel_colors.value = [];
        loading.value = true;
        isClusterView.value = false;
        await obtainSummations();
        removeRegions();
        updateCircles();
        loading.value = false;
      }
    });
    watch(selectedGenesFromParent, (v: any) => {
      let gene = v;
      if (typeof v === 'undefined') gene = [];
      if (typeof v === 'string') gene = [gene];
      selectedGenes.value = gene;
    });
    watch(maxMinBoundaryFromParents, (v: any) => {
      if (v[0] === '' && v[1] === '') maxMinBoundary.value = [];
      else maxMinBoundary.value = v;
      updateCircles();
    });
    watch(loading, (v: any) => {
      // ctx.emit('loading_value', v);
    });
    onMounted(async () => {
      await clientReady;
    });
    return {
      get_uuid,
      scale,
      scaleUMAP,
      filenameGene,
      filenameFromParent,
      headers,
      selected,
      loading,
      selectedFiles,
      onFilesChanged,
      clusterHeaders,
      selectedGenes,
      remove,
      konvaConfigLeft,
      konvaConfigRight,
      circlesSpatial,
      circlesSpatialUMAP,
      isHighlighted,
      onResize,
      isClusterView,
      clusterItems,
      clusterColors,
      inactiveColor,
      backgroundColor,
      updateCircles,
      heatMap,
      stepArray,
      colorBarmap,
      highestCount,
      lowestCount,
      geneNames,
      isDrawing,
      isDrawingRect,
      mouseDownOnStageLeft,
      mouseDownOnStageRight,
      mouseMoveOnStageLeft,
      mouseMoveOnStageRight,
      mouseUpOnStageLeft,
      mouseUpOnStageRight,
      polygon,
      polygonUMAP,
      regions,
      regionsUMAP,
      removeRegions,
      reScale,
      reScaleUMAP,
      resetScaleAndPos,
      resetScaleAndPosUMAP,
      runId,
      colorbarText,
      highlightIds,
      lassoSide,
      highlightCount,
      spatialData,
      spatialRun,
      colorFromParent,
      clickedClusterFromParent,
      totalInClust,
      totalInCellType,
      averageInd,
      retrieveData,
      geneObject,
      motifObject,
      tixelObject,
      minX,
      minY,
      maxX,
      maxY,
      minX_UMAP,
      minY_UMAP,
      maxX_UMAP,
      maxY_UMAP,
      geneMotif,
      tableKeyFromParent,
      geneSummation,
      maxMinBoundary,
      maxMinBoundaryFromParents,
      checkBoundary,
      checkBoundaryColor,
      currentClickedCluster,
      assayFlag,
      regulons_flag,
      originalClickedPoint,
      originalClickedPointU,
      globalSpatialGroup,
      globalUmapGroup,
      globalSvgS,
      globalSvgU,
      initializePlots,
      translatePoint,
      translatePointU,
      svg_spatial_wh,
      svg_umap_wh,
      initialized,
      visibility,
      visibilityUmap,
      showToolTipSpatial,
      showToolTipUmap,
      toolTipTextUmap,
      TTposition,
      TTpositionUmap,
      hideToolTipS,
      hideToolTipU,
      current_tixel_colors,
      multi_sample_flag,
      clusters_ann_flag,
      spatial_wh,
      umap_wh,
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
