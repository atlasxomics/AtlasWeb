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
              @click="scale=scale*1.1"
              ><v-icon small>mdi-magnify-plus</v-icon>
            </v-btn>
          </v-row>
          <v-row justify="end">
            <v-btn
              small
              icon
              color="primary"
              :disabled="!spatialData"
              @click="scale=scale*0.9"
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
        align="center">
        <v-stage
          ref="konvaStageDualAtac"
          class="mainStage"
          :config="konvaConfigLeft"
          :style="{ 'overflow': 'hidden' }"
          @mousedown="mouseDownOnStageLeft"
          @mousemove="mouseMoveOnStageLeft"
          @mouseup="mouseUpOnStageLeft"
          >
          <v-layer
            ref="spatialLayerDualAtac"
            id="spatialLayerDualAtac">
            <v-circle v-for="p in circlesSpatial"
              :config="p"
              v-bind:key="p.id"
              @mouseover="mouseMoveOnSpatial"
              @mouseout="mouseOutOnSpatial"/>
          </v-layer>
          <v-layer
            ref="annotationLayerDualAtac"
            />
          <v-layer
            ref="drawingLayer"
            id="drawingLayer"
            v-if="isDrawing">
            <template
              v-for="poly in regions">
              <v-line
                v-bind:key="poly.id"
                :config="poly"/>
            </template>
            <v-line
              :config="polygon"/>
          </v-layer>
          <v-layer
            v-if="isDrawingRect"
            ref="drawingLayerRect"
            id="drawingLayerRect">
            <v-rect
              :config="rectangle"/>
          </v-layer>
        </v-stage>
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
              @click="scaleUMAP=scaleUMAP*1.1"
              ><v-icon small>mdi-magnify-plus</v-icon>
            </v-btn>
          </v-row>
          <v-row justify="end">
            <v-btn
              small
              icon
              color="primary"
              :disabled="!spatialData"
              @click="scaleUMAP=scaleUMAP*0.9"
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
        height="50vh">
        <v-stage
          ref="konvaStageDualAtacRight"
          class="mainStage"
          :config="konvaConfigRight"
          @mousedown="mouseDownOnStageRight"
          @mousemove="mouseMoveOnStageRight"
          @mouseup="mouseUpOnStageRight"
          :style="{ 'overflow': 'hidden' }"
          >
          <v-layer
            ref="spatialLayerDualAtacRight"
            id="spatialLayerDualAtacRight">
            <v-circle v-for="p in circlesSpatialUMAP"
              :config="p"
              v-bind:key="p.id"
              @mousemove="mouseMoveOnSpatialRight"
              @mouseout="mouseOutOnSpatialRight"/>
          </v-layer>
          <v-layer
            ref="annotationLayerDualAtacRight"
            />
          <v-layer
            ref="drawingLayerRight"
            id="drawingLayerRight"
            v-if="isDrawing">
            <template
              v-for="poly in regionsUMAP">
              <v-line
                v-bind:key="poly.id"
                :config="poly"/>
            </template>
            <v-line
              :config="polygonUMAP"/>
          </v-layer>
          <v-layer
            v-if="isDrawingRect"
            ref="drawingLayerRightRect"
            id="drawingLayerRightRect">
            <v-rect
              :config="rectangleUMAP"/>
          </v-layer>
        </v-stage>
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
import template from '../../../_empty/template.vue';

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
  props: ['query', 'filename', 'selected_genes', 'heatmap', 'background', 'task', 'queue', 'standalone', 'lasso', 'rect', 'manualColor', 'clickedCluster', 'checkBoxCluster', 'indFlag', 'geneOmotif', 'idOfRun', 'antiKey'],
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
    const tooltip = new Konva.Label({ visible: false });
    const tooltipRight = new Konva.Label({ visible: false });
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
    const tooltipTextRight = new Konva.Text({
      text: '',
      fontFamily: 'Calibri',
      fontSize: 15,
      padding: 5,
      fill: 'black',
    });
    const tooltipTagRight = new Konva.Tag({
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
    const polygon = ref<any>({ x: 0, y: 0, points: [], opacity: 0.8, closed: true, fill: 'white', stroke: 'green', strokeWidth: 1 });
    const polygonUMAP = ref<any>({ x: 0, y: 0, points: [], opacity: 0.8, closed: true, fill: 'white', stroke: 'green', strokeWidth: 1 });
    const rectangle = ref<any>({ x: 0, y: 0, width: 0, height: 0, opacity: 0.8, fill: 'white', stroke: 'green', strokeWidth: 1, endPointx: 0, endPointy: 0 });
    const rectangleUMAP = ref<any>({ x: 0, y: 0, width: 0, height: 0, opacity: 0.8, fill: 'white', stroke: 'green', strokeWidth: 1, endPointx: 0, endPointy: 0 });
    const regions = ref<any>();
    const regionsUMAP = ref<any>();
    const lassoSide = ref<string>();
    const colorbarText = ref<string>('white');
    const highlightIds = ref<any[]>([]);
    const topSelected = ref<any[]>([]);
    const highlightCount = ref<number>(0);
    const spatialRun = ref<boolean>(false);
    const totalInClust = ref<any>({});
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
    const geneMotif = computed(() => (props.geneOmotif));
    function setDraggable(flag: boolean) {
      konvaConfigLeft.value.draggable = flag;
      konvaConfigRight.value.draggable = flag;
    }
    async function fitStageToParent() {
      const parent = document.querySelector('#stageParentDualAtac');
      if (!parent) return;
      const parentWidth = (parent as any).offsetWidth;
      const parentHeight = (parent as any).offsetHeight;
      konvaConfigLeft.value.width = parentWidth;
      konvaConfigLeft.value.height = parentHeight;
      konvaConfigRight.value.width = parentWidth;
      konvaConfigRight.value.height = parentHeight;
    }
    function remove(item: any) {
      const newArr = selectedGenes.value.filter((x: any) => x !== item.name);
      selectedGenes.value = newArr;
    }
    function unHighlighCluster() {
      lodash.each(circlesSpatialUMAP.value, (c: any, i: number) => {
        circlesSpatialUMAP.value[i].fill = c.originalColor;
        circlesSpatialUMAP.value[i].stroke = c.originalColor;
        circlesSpatial.value[i].fill = c.originalColor;
        circlesSpatial.value[i].stroke = c.originalColor;
      });
      highlightedCluster.value = '';
    }
    function pointInPolygon(point: number[], vs: any[]) { // point is like [5,5], vs is like [[1,2],[10,20],[100,200]]
      let inside = false;
      if (isDrawing) {
        const [x, y] = point;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i + 0, i += 1) {
          const [xi, yi] = vs[i];
          const [xj, yj] = vs[j];
          const intersect = ((yi > y) !== (yj > y)) && (x < ((((xj - xi) * (y - yi)) / (yj - yi)) + xi));
          if (intersect) inside = !inside;
        }
      }
      if (isDrawingRect) {
        const [x, y] = point;
        let info: any;
        if (lassoSide.value === 'left') {
          info = regions;
        } else {
          info = regionsUMAP;
        }
        if (x >= info.value[0].x && x <= info.value[0].endPointx) {
          if (y >= info.value[0].y && y <= info.value[0].endPointy) {
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
            if (pointInPolygon(pt, splitarray(poly.points, 2))) res = true;
          });
        }
        if (lassoSide.value === 'right') {
          regionsUMAP.value.forEach((poly: any, idx: number) => {
            if (pointInPolygon(pt, splitarray(poly.points, 2))) res = true;
          });
        }
        return res;
      };
      let filteredIndex: any;
      if (lassoSide.value === 'left') {
        filteredIndex = circlesSpatial.value.map((v: any) => funcInsideRegions([v.x, v.y]));
      } else {
        filteredIndex = circlesSpatialUMAP.value.map((v: any) => funcInsideRegions([v.x, v.y]));
      }
      const hitCount = filteredIndex.filter((x: boolean) => x).length;
      highlightCount.value = hitCount;
      if (hitCount < 1) {
        topSelected.value = [];
        unHighlighCluster();
        return;
      }
      lodash.each(filteredIndex, (v: boolean, idx: number) => {
        if (!v) {
          circlesSpatial.value[idx].fill = circlesSpatial.value[idx].originalColor;
          circlesSpatial.value[idx].stroke = circlesSpatial.value[idx].originalColor;
          circlesSpatialUMAP.value[idx].fill = circlesSpatialUMAP.value[idx].originalColor;
          circlesSpatialUMAP.value[idx].stroke = circlesSpatialUMAP.value[idx].originalColor;
        } else {
          let color: any;
          if (backgroundColor.value === 'white') {
            color = 'darkgrey';
          } else {
            color = 'white';
          }
          highlightIds.value.push(idx);
          circlesSpatial.value[idx].fill = color;
          circlesSpatial.value[idx].stroke = color;
          circlesSpatialUMAP.value[idx].fill = color;
          circlesSpatialUMAP.value[idx].stroke = color;
        }
      });
    }
    function highlightCluster(clusterName: string[]) {
      if (backgroundColor.value === 'darkgrey') {
        inactiveColor.value = 'white';
      } else {
        inactiveColor.value = 'darkgrey';
      }
      lodash.each(circlesSpatial.value, (c: any, i: number) => {
        if (!clusterName.includes(c.cluster)) {
          circlesSpatial.value[i].fill = inactiveColor.value;
          circlesSpatial.value[i].stroke = inactiveColor.value;
          circlesSpatialUMAP.value[i].fill = inactiveColor.value;
          circlesSpatialUMAP.value[i].stroke = inactiveColor.value;
        } else {
          circlesSpatial.value[i].fill = c.originalColor;
          circlesSpatial.value[i].stroke = c.originalColor;
          circlesSpatialUMAP.value[i].fill = c.originalColor;
          circlesSpatialUMAP.value[i].stroke = c.originalColor;
        }
      });
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
    async function updateCircles() {
      if (spatialData.value === null) return;
      isHighlighted.value = false;
      const circles: any[] = [];
      const circlesUMAP: any[] = [];
      stepArray.value = [];
      const colors: any[] = [];
      let colors_intensity: any[] = [];
      const totalHold: any = {};
      const numClusters = lodash.uniq(spatialData.value.spatial.map((v: any) => v[0])).length;
      if (!colorFromParent.value) {
        const colors_raw = colormap({ colormap: heatMap.value, nshades: (numClusters) * 3, format: 'hex', alpha: 1 });
        colors_raw.forEach((v: any, i: number) => {
          if ((i % 3) === 0) colors.push(colors_raw[i + 1]);
        });
        colors_intensity = colormap({ colormap: heatMap.value, nshades: 64, format: 'hex', alpha: 1 });
        colorBarmap.value = `linear-gradient(to right, ${colors_intensity[0]}, ${colors_intensity[16]}, ${colors_intensity[32]} , ${colors_intensity[48]}, ${colors_intensity[63]})`;
      } else {
        let linearString = 'linear-gradient(to right,';
        lodash.each(heatMap.value, (value: any, key: any) => {
          colors.push(value);
          linearString += `${value},`;
        });
        let holder = linearString.slice(0, -1);
        holder += ')';
        colorBarmap.value = holder;
        const numberOfItems = 64;
        const rb = rainbow();
        rb.setNumberRange(1, numberOfItems);
        rb.setSpectrum(...colors);
        for (let i = 1; i <= numberOfItems; i += 1) {
          let hash = '#';
          colors_intensity.push(hash += rb.colourAt(i));
        }
      }
      clusterColors.value = colors;
      const { width: stageWidth, height: stageHeight } = konvaConfigLeft.value;
      const { width: stageWidthR, height: stageHeightR } = konvaConfigRight.value;
      const viewScale = Math.min(stageWidth / (maxX.value - minX.value), stageHeight / (maxY.value - minY.value));
      const viewScaleUMAP = Math.min(stageWidthR / (maxX_UMAP.value - minX_UMAP.value), stageHeightR / (maxY_UMAP.value - minY_UMAP.value));
      const radius = (Math.min(stageWidth, stageHeight) / (30 * 5)) * scale.value;
      const radiusUMAP = (Math.min(stageWidthR, stageHeightR) / (30 * 5)) * scaleUMAP.value;
      const [paddingX, paddingY] = [60, 30];
      if (isClusterView.value || averageInd.value) {
        const coordinatesSib: any = [];
        const TSS: any = [];
        const nFrags: any = [];
        spatialData.value.spatial.forEach((v: string[], i: number) => {
          if (v[0].includes('C')) {
            TSS.push(parseFloat(v[3]));
            nFrags.push(parseFloat(v[4]));
            const [tempX, tempY] = v[1].split(',');
            const [tempUX, tempUY] = v[2].split(',');
            const ax = parseFloat(tempX.slice(1));
            const ay = parseFloat(tempY.slice(0, -1));
            const auX = parseFloat(tempUX.slice(1));
            const auY = parseFloat(tempUY.slice(0, -1));
            const uX = auX - minX_UMAP.value;
            const uY = auY - minY_UMAP.value;
            const x = ax - minX.value;
            const y = ay - minY.value;
            const regex = /\d+/g;
            const string = v[0];
            const match = Number(string.match(regex)![0]) - 1;
            coordinatesSib.push([x, y, v]);
            const c = {
              id: get_uuid(),
              x: x * scale.value * viewScale + paddingX,
              y: y * scale.value * viewScale + paddingY,
              ogx: x,
              ogy: y,
              radius,
              originalColor: colors[match],
              fill: colors[match],
              stroke: colors[match],
              strokeWidth: 1.0,
              cluster: v[0],
              total: 0,
              inactive: false,
              hitStrokeWidth: radius * 2,
              genes: { },
            };
            const ci = {
              id: get_uuid(),
              x: uX * scaleUMAP.value * viewScaleUMAP + paddingX,
              y: uY * scaleUMAP.value * viewScaleUMAP + paddingY,
              radius: radiusUMAP,
              originalColor: colors[match],
              fill: colors[match],
              stroke: colors[match],
              strokeWidth: 1.0,
              cluster: v[0],
              total: 0,
              inactive: false,
              genes: { },
            };
            selectedGenes.value.forEach((id: any, na: any) => {
              if (geneMotif.value === 'gene') {
                (c.genes as any)[id] = parseFloat(spatialData.value.gene[id][i]);
                (ci.genes as any)[id] = parseFloat(spatialData.value.gene[id][i]);
              } else {
                (c.genes as any)[id] = parseFloat(spatialData.value.motif[id][i]);
                (ci.genes as any)[id] = parseFloat(spatialData.value.motif[id][i]);
              }
              c.total = lodash.sum(Object.values(c.genes));
              ci.total = lodash.sum(Object.values(ci.genes));
            });
            circles.push(c);
            circlesUMAP.push(ci);
          }
        });
        if (isClusterView.value) {
          ctx.emit('spatialCircleData', [TSS, nFrags]);
        } else ctx.emit('spatialCircleData', circles);
      } else {
        const geneSum: number[] = [];
        spatialData.value.spatial.forEach((v: string[], i: number) => {
          if (v[0].includes('C')) {
            const [tempX, tempY] = v[1].split(',');
            const [tempUX, tempUY] = v[2].split(',');
            const ax = parseFloat(tempX.slice(1));
            const ay = parseFloat(tempY.slice(0, -1));
            const auX = parseFloat(tempUX.slice(1));
            const auY = parseFloat(tempUY.slice(0, -1));
            const uX = auX - minX_UMAP.value;
            const uY = auY - minY_UMAP.value;
            const x = ax - minX.value;
            const y = ay - minY.value;
            const regex = /\d+/g;
            const string = v[0];
            const match = Number(string.match(regex)![0]) - 1;
            const c = {
              id: get_uuid(),
              x: x * scale.value * viewScale + paddingX,
              y: y * scale.value * viewScale + paddingY,
              ogx: x,
              ogy: y,
              radius,
              originalColor: colors[match],
              fill: colors[match],
              stroke: colors[match],
              strokeWidth: 1.0,
              cluster: v[0],
              total: 0,
              inactive: false,
              genes: { },
            };
            const ci = {
              id: get_uuid(),
              x: uX * scaleUMAP.value * viewScaleUMAP + paddingX,
              y: uY * scaleUMAP.value * viewScaleUMAP + paddingY,
              radius: radiusUMAP,
              originalColor: colors[match],
              fill: colors[match],
              stroke: colors[match],
              strokeWidth: 1.0,
              cluster: v[0],
              total: 0,
              inactive: false,
              genes: { },
            };
            selectedGenes.value.forEach((id: any, na: any) => {
              if (geneMotif.value === 'gene') {
                (c.genes as any)[id] = parseFloat(spatialData.value.gene[id][i]);
                (ci.genes as any)[id] = parseFloat(spatialData.value.gene[id][i]);
              } else {
                (c.genes as any)[id] = parseFloat(spatialData.value.motif[id][i]);
                (ci.genes as any)[id] = parseFloat(spatialData.value.motif[id][i]);
              }
              c.total = lodash.sum(Object.values(c.genes));
              ci.total = lodash.sum(Object.values(ci.genes));
            });
            geneSum.push(c.total);
            circles.push(c);
            circlesUMAP.push(ci);
          }
        });
        highestCount.value = -10000;
        lowestCount.value = 10000;
        let highAvg = -10000;
        let lowAvg = 10000000;
        const geneColors = colormapBounded(colors_intensity, geneSum, selectedGenes.value.length);
        circles.forEach((v: any, i: any) => {
          const clr = (geneSum[i] + (12 * selectedGenes.value.length) > 0) ? geneColors[i] : inactiveColor.value;
          highestCount.value = geneSum[i] > highestCount.value ? geneSum[i] : highestCount.value;
          lowestCount.value = geneSum[i] < lowestCount.value ? geneSum[i] : lowestCount.value;
          circles[i].originalColor = clr;
          circles[i].fill = clr;
          circles[i].stroke = clr;
          circlesUMAP[i].originalColor = clr;
          circlesUMAP[i].fill = clr;
          circlesUMAP[i].stroke = clr;
          const avg = v.total / selectedGenes.value.length;
          if (avg > highAvg) {
            highAvg = avg;
          }
          if (avg < lowAvg) {
            lowAvg = avg;
          }
        });
        stepArray.value = makearray(highAvg, lowAvg);
        ctx.emit('spatialCircleData', circles);
      }
      if (averageInd.value) {
        ctx.emit('singleCircleData', { coords: circles, intense: colors_intensity });
        ctx.emit('sendColorBar', { color: colorBarmap.value, maxMin: [minX.value, minY.value, maxX.value, maxY.value], tixelColor: colors_intensity });
      }
      circlesSpatial.value = circles;
      circlesSpatialUMAP.value = circlesUMAP;
      highlightRegion();
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
          const tixelFileName = `data/${runId.value}/h5/obj/data.csv`;
          const spatial = await client.value!.getCsvFile({ params: { filename: tixelFileName } });
          spatialData.value.spatial = spatial;
        } else {
          const spatial = await client.value!.getGeneMotifSpatialByToken(filenameGene.value, 0);
          spatialData.value.spatial = spatial;
        }
        const spatialX: number[] = [];
        const spatialY: number[] = [];
        const umapX: number[] = [];
        const umapY: number[] = [];
        const totalHold: any = {};
        spatialData.value.spatial.forEach((list: string[], index: any) => {
          if (list[0].includes('C')) {
            const [tempX, tempY] = list[1].split(',');
            const [tempUX, tempUY] = list[2].split(',');
            const x = parseFloat(tempX.slice(1));
            const y = parseFloat(tempY.slice(0, -1));
            const uX = parseFloat(tempUX.slice(1));
            const uY = parseFloat(tempUY.slice(0, -1));
            spatialX.push(x);
            spatialY.push(y);
            umapX.push(uX);
            umapY.push(uY);
            if (!Object.keys(totalHold).includes(list[0])) totalHold[list[0]] = 1;
            else totalHold[list[0]] += 1;
          }
        });
        minX.value = Math.min(...spatialX);
        minY.value = Math.min(...spatialY);
        maxX.value = Math.max(...spatialX);
        maxY.value = Math.max(...spatialY);
        minX_UMAP.value = Math.min(...umapX);
        minY_UMAP.value = Math.min(...umapY);
        maxX_UMAP.value = Math.max(...umapX);
        maxY_UMAP.value = Math.max(...umapY);
        await updateCircles();
        Object.keys(totalHold).forEach((v: any, index: any) => {
          const key = `C${index + 1}`;
          totalInClust.value[key] = totalHold[key];
        });
        ctx.emit('totalClust', totalInClust.value);
      }
      loading.value = false;
      if (!props.query.public) {
        if (geneMotif.value === 'gene') {
          const geneFileName = `data/${runId.value}/h5/obj/gene.csv`;
          const gene = await client.value!.getGeneMotifSpatial(geneFileName);
          spatialData.value.gene = gene;
          ctx.emit('totalGM', Object.keys(spatialData.value.gene));
        } else {
          const motifFileName = `data/${runId.value}/h5/obj/motif.csv`;
          const motif = await client.value!.getGeneMotifSpatial(motifFileName);
          spatialData.value.motif = motif;
          ctx.emit('totalGM', Object.keys(spatialData.value.motif));
        }
      } else {
        if (geneMotif.value === 'gene') {
          const gene = await client.value!.getGeneMotifSpatialByToken(filenameGene.value, 1);
          spatialData.value.gene = gene;
          ctx.emit('totalGM', Object.keys(spatialData.value.gene));
        } else {
          const motif = await client.value!.getGeneMotifSpatialByToken(filenameGene.value, 2);
          spatialData.value.motif = motif;
          ctx.emit('totalGM', Object.keys(spatialData.value.motif));
        }
      }
    }
    async function runSpatial(change: boolean) {
      if (!client.value) return;
      // if (!selectedFiles.value) return;
      try {
        if (highlightIds.value.length > 0 || change === true) {
          progressMessage.value = null;
          spatialRun.value = true;
          const task = currentTask.value;
          const queue = currentQueue.value;
          const args = [filenameGene.value, selectedGenes.value, highlightIds.value, tableKeyFromParent.value];
          const kwargs = {};
          const taskObject = props.query.public ? await client.value.postPublicTask(task, args, kwargs, queue, (geneMotif.value === 'gene') ? 3 : 4) : await client.value.postTask(task, args, kwargs, queue);
          if (props.query.public) {
            ctx.emit('publicRun', { id: taskObject.meta.run_id, species: taskObject.meta.species, organ: taskObject.meta.tissue, assay: taskObject.meta.assay });
          }
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
            return;
          }
          progressMessage.value = taskStatus.value.status;
          const resp = taskStatus.value.result;
          ctx.emit('highlightedId', { ids: highlightIds.value, genes: resp.top_selected });
          if (change) {
            ctx.emit('topTen', resp.top_ten);
          }
        } else {
          await fitStageToParent();
          spatialRun.value = false;
        }
      } catch (error) {
        ctx.emit('spatialFlag', false);
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: error, options: { right: true, color: 'error' } });
      }
    }
    // Drawing
    async function mouseMoveOnSpatial(ev: any) {
      const mousePos = (ctx as any).refs.konvaStageDualAtac.getNode().getRelativePointerPosition();
      const item = ev.target.attrs;
      tooltip.position({
        x: mousePos.x,
        y: mousePos.y,
      });
      let text = `Cluster: ${item.cluster}`;
      if (selectedGenes.value.length > 0) {
        text = `${text}\nAvg: ${(item.total / selectedGenes.value.length).toFixed(2)}`;
        lodash.forIn(item.genes, (v: number, k: string) => {
          text = `${text}\n${k}: ${v.toFixed(2)}`;
        });
      }
      tooltipText.text(text);
      tooltip.show();
      if (isClusterView.value && !highlightedCluster.value.includes(item.cluster) && (!isDrawing.value && !isDrawingRect.value)) {
        const { cluster } = item;
        highlightCluster([cluster]);
      }
    }
    async function mouseOutOnSpatial(ev: any) {
      isHighlighted.value = false;
      tooltip.hide();
      tooltipRight.hide();
      if ((!isDrawing.value && !isDrawingRect.value)) unHighlighCluster();
    }
    async function mouseMoveOnSpatialRight(ev: any) {
      const mousePosRight = (ctx as any).refs.konvaStageDualAtacRight.getNode().getRelativePointerPosition();
      const item = ev.target.attrs;
      tooltipRight.position({
        x: mousePosRight.x,
        y: mousePosRight.y,
      });
      let text = `Cluster: ${item.cluster}`;
      if (selectedGenes.value.length > 0) {
        text = `${text}\nAvg: ${(item.total / selectedGenes.value.length).toFixed(2)}`;
        lodash.forIn(item.genes, (v: number, k: string) => {
          text = `${text}\n${k}: ${v.toFixed(2)}`;
        });
      }
      tooltipTextRight.text(text);
      tooltipRight.show();
      if (isClusterView.value && !highlightedCluster.value.includes(item.cluster) && (!isDrawing.value && !isDrawingRect.value)) {
        const { cluster } = item;
        highlightCluster([cluster]);
      }
    }
    async function mouseOutOnSpatialRight(ev: any) {
      isHighlighted.value = false;
      tooltip.hide();
      tooltipRight.hide();
      if ((!isDrawing.value && !isDrawingRect.value)) unHighlighCluster();
    }
    // Drawing Region
    function removeRegions() {
      regionsUMAP.value = [];
      polygonUMAP.value.points = [];
      regions.value = [];
      polygon.value.points = [];
      rectangle.value = { x: 0, y: 0, id: 1, width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'green', strokeWidth: 3, endPointx: 0, endPointy: 0 };
      rectangleUMAP.value = { x: 0, y: 0, id: 1, width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'green', strokeWidth: 3, endPointx: 0, endPointy: 0 };
      highlightRegion();
    }
    function mouseDownOnStageLeft(ev: any) {
      if (isDrawing.value) {
        lassoSide.value = 'left';
        removeRegions();
        isClicked.value = true;
        polygon.value = { x: 0, y: 0, id: get_uuid(), points: [], opacity: 0.6, listening: true, closed: true, fill: '', stroke: 'green', strokeWidth: 3 };
        polygon.value.points = [];
      }
      if (isDrawingRect.value) {
        lassoSide.value = 'left';
        removeRegions();
        const mousePos = (ctx as any).refs.konvaStageDualAtac.getNode().getRelativePointerPosition();
        rectangle.value = { x: mousePos.x, y: mousePos.y, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'green', strokeWidth: 3, endPointx: 0, endPointy: 0 };
        rectangleUMAP.value = { x: 0, y: 0, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'green', strokeWidth: 3, endPointx: 0, endPointy: 0 };
        highlightRegion();
        isClicked.value = true;
      }
    }
    function mouseDownOnStageRight(ev: any) {
      if (isDrawing.value) {
        lassoSide.value = 'right';
        removeRegions();
        isClicked.value = true;
        polygonUMAP.value = { x: 0, y: 0, id: get_uuid(), points: [], opacity: 0.6, listening: true, closed: true, fill: '', stroke: 'green', strokeWidth: 3 };
        polygonUMAP.value.points = [];
      }
      if (isDrawingRect.value) {
        lassoSide.value = 'right';
        removeRegions();
        const mousePos = (ctx as any).refs.konvaStageDualAtacRight.getNode().getRelativePointerPosition();
        rectangleUMAP.value = { x: mousePos.x, y: mousePos.y, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'green', strokeWidth: 3, endPointx: 0, endPointy: 0 };
        rectangle.value = { x: 0, y: 0, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'green', strokeWidth: 3, endPointx: 0, endPointy: 0 };
        highlightRegion();
        isClicked.value = true;
      }
    }
    function mouseMoveOnStageLeft(ev: any) {
      if (isDrawing.value) {
        if (isClicked.value) {
          const mousePos = (ctx as any).refs.konvaStageDualAtac.getNode().getRelativePointerPosition();
          polygon.value.points.push(Math.round(mousePos.x));
          polygon.value.points.push(Math.round(mousePos.y));
          (ctx as any).refs.drawingLayer.getNode().batchDraw(); // forced update since due to pointer issue
        }
      }
      if (isDrawingRect.value) {
        if (isClicked.value) {
          const mousePos = (ctx as any).refs.konvaStageDualAtac.getNode().getRelativePointerPosition();
          const xdiff = Math.abs(mousePos.x - rectangle.value.x);
          const ydiff = Math.abs(mousePos.y - rectangle.value.y);
          rectangle.value.width = xdiff;
          rectangle.value.height = ydiff;
          rectangle.value.endPointx = mousePos.x;
          rectangle.value.endPointy = mousePos.y;
          (ctx as any).refs.drawingLayerRect.getNode().batchDraw(); // forced update since due to pointer issue
        }
      }
    }
    function mouseMoveOnStageRight(ev: any) {
      if (isDrawing.value) {
        if (isClicked.value) {
          const mousePos = (ctx as any).refs.konvaStageDualAtacRight.getNode().getRelativePointerPosition();
          polygonUMAP.value.points.push(Math.round(mousePos.x));
          polygonUMAP.value.points.push(Math.round(mousePos.y));
          (ctx as any).refs.drawingLayerRight.getNode().batchDraw(); // forced update since due to pointer issue
        }
      }
      if (isDrawingRect.value) {
        if (isClicked.value) {
          const mousePos = (ctx as any).refs.konvaStageDualAtacRight.getNode().getRelativePointerPosition();
          const xdiff = Math.abs(mousePos.x - rectangleUMAP.value.x);
          const ydiff = Math.abs(mousePos.y - rectangleUMAP.value.y);
          rectangleUMAP.value.width = xdiff;
          rectangleUMAP.value.height = ydiff;
          rectangleUMAP.value.endPointx = mousePos.x;
          rectangleUMAP.value.endPointy = mousePos.y;
          (ctx as any).refs.drawingLayerRightRect.getNode().batchDraw(); // forced update since due to pointer issue
        }
      }
    }
    function mouseUpOnStageLeft(ev: any) {
      if (isDrawing.value) {
        isClicked.value = false;
        regions.value.push(deepCopy(polygon.value));
        polygon.value.points = [];
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial(false);
        }
      }
      if (isDrawingRect.value) {
        isClicked.value = false;
        regions.value.push(deepCopy(rectangle.value));
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial(false);
        }
      }
    }
    function mouseUpOnStageRight(ev: any) {
      if (isDrawing.value) {
        isClicked.value = false;
        regionsUMAP.value.push(deepCopy(polygonUMAP.value));
        polygonUMAP.value.points = [];
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial(false);
        }
      }
      if (isDrawingRect.value) {
        isClicked.value = false;
        regionsUMAP.value.push(deepCopy(rectangleUMAP.value));
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial(false);
        }
      }
    }
    async function mouseOverClusterItem(ev: any) {
      highlightCluster([ev.name]);
    }
    function onFilesChanged(ev: any) {
      selectedFiles.value = ev;
    }
    function reScale() {
      updateCircles();
    }
    function reScaleUMAP() {
      updateCircles();
    }
    function resetScaleAndPos(ev: any) {
      const stage = (ctx as any).refs.konvaStageDualAtac.getNode();
      const newPos = { x: 0, y: 0 };
      stage.position(newPos);
      scale.value = 0.75;
    }
    function resetScaleAndPosUMAP(ev: any) {
      const stage = (ctx as any).refs.konvaStageDualAtacRight.getNode();
      const newPos = { x: 0, y: 0 };
      stage.position(newPos);
      scaleUMAP.value = 0.75;
    }
    function onResize() {
      fitStageToParent();
      updateCircles();
    }
    watch(backgroundColor, (v: any) => {
      if (isDrawing.value || isDrawingRect.value) {
        highlightRegion();
      }
    });
    watch(averageInd, (v: any) => {
      if (selectedGenes.value.length > 0) {
        updateCircles();
      }
    });
    watch(isDrawing, (v: boolean) => {
      setDraggable(!v);
      removeRegions();
      if (!isDrawing.value) unHighlighCluster();
    });
    watch(isDrawingRect, (v: boolean) => {
      setDraggable(!v);
      removeRegions();
      if (!isDrawingRect.value) unHighlighCluster();
    });
    watch(clickedClusterFromParent, (v: any) => {
      if (!isDrawing.value && !isDrawingRect.value) {
        mouseOverClusterItem({ name: `${v[0]}` });
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
        await runSpatial(true);
        await retrieveData();
      }
    });
    watch(runId, async (v: any) => {
      if (v !== null && !props.query.public) {
        spatialData.value = null;
        totalInClust.value = {};
        loading.value = true;
        await runSpatial(true);
        await retrieveData();
      }
    });
    watch(geneMotif, async (v: any) => {
      if (spatialData.value !== null) {
        loading.value = true;
        await runSpatial(true);
        await retrieveData();
        selectedGenes.value = [];
        loading.value = false;
      }
    });
    watch(scale, () => {
      reScale();
    });
    watch(scaleUMAP, () => {
      reScaleUMAP();
    });
    watch(selectedGenes, (v: any[]) => {
      if (v && selectedGenes.value.length === 0) {
        isClusterView.value = true;
        stepArray.value = [];
        updateCircles();
      } else {
        isClusterView.value = false;
        removeRegions();
        updateCircles();
      }
    });
    watch(selectedGenesFromParent, (v: any) => {
      let gene = v;
      if (typeof v === 'undefined') gene = [];
      if (typeof v === 'string') gene = [gene];
      selectedGenes.value = gene;
    });
    watch(tableKeyFromParent, (v: number) => {
      runSpatial(true);
    });
    watch(loading, (v: any) => {
      ctx.emit('loading_value', v);
    });
    onMounted(async () => {
      await clientReady;
      tooltip.add(tooltipTag);
      tooltip.add(tooltipText);
      tooltipRight.add(tooltipTagRight);
      tooltipRight.add(tooltipTextRight);
      (ctx.refs.annotationLayerDualAtac as any).getNode().add(tooltip);
      (ctx.refs.annotationLayerDualAtacRight as any).getNode().add(tooltipRight);
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
      mouseMoveOnSpatial,
      mouseOutOnSpatial,
      mouseMoveOnSpatialRight,
      mouseOutOnSpatialRight,
      isClusterView,
      clusterItems,
      clusterColors,
      inactiveColor,
      backgroundColor,
      updateCircles,
      mouseOverClusterItem,
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
      rectangle,
      rectangleUMAP,
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
