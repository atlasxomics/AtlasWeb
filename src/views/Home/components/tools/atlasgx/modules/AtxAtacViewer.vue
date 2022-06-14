<template>
    <v-container fixed>
      <v-row no-gutters>
        <v-col cols="12" sm="1">
          <v-card
          class="rounded-0"
          flat
          :style="{ 'background-color': 'transparent', 'overflow-x': 'None' }"
          height="50vh">
            <v-card-text style="margin-left:4vw">
              <v-row>
                <v-btn
                small
                icon
                color="primary"
                :disabled="!spatialData"
                @click="resetScaleAndPos"
                ><v-icon small>mdi-arrow-expand</v-icon>
                </v-btn>
              </v-row>
              <v-row>
                <v-btn
                  small
                  icon
                  color="primary"
                  :disabled="!spatialData"
                  @click="scale=scale*1.1"
                  ><v-icon small>mdi-magnify-plus</v-icon>
                </v-btn>
              </v-row>
              <v-row>
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
          <v-card id="stageParent"
            class="rounded-0"
            v-resize="onResize"
            flat
            :style="{ 'background-color': 'transparent', 'overflow-x': 'None'}"
            height="50vh"
            align="center">
            <v-stage
              ref="konvaStage"
              class="mainStage"
              :config="konvaConfigLeft"
              :style="{ 'overflow': 'hidden' }"
              @mousedown="mouseDownOnStageLeft"
              @mousemove="mouseMoveOnStageLeft"
              @mouseup="mouseUpOnStageLeft"
              >
              <v-layer
                ref="spatialLayer"
                id="spatialLayer">
                <v-circle v-for="p in circlesSpatial"
                  :config="p"
                  v-bind:key="p.id"
                  @mouseover="mouseMoveOnSpatial"
                  @mouseout="mouseOutOnSpatial"/>
              </v-layer>
              <v-layer
                ref="annotationLayer"
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
              <template v-else>
                <v-card
                  flat
                  :style="{'background-color': 'transparent', 'overflow-x': 'None'}"
                  height="3vh"
                  width="100%">
                  <v-row no-gutters>
                    <v-col v-if="!clusterItems">
                        No clusters
                    </v-col>
                    <v-col v-for="item in clusterItems" v-bind:key="`${item.name}`" class="ma-0 pa-0 text-center">
                      <v-btn
                      small
                      icon
                      :color="clusterColors[Number(item.name.toString().replace('C', ''))-1]"
                      @click="mouseOverClusterItem(item)"
                      >{{ item.name }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card>
              </template>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="12" sm="1">
          <v-card
          class="rounded-0"
          flat
          :style="{ 'background-color': 'transparent', 'overflow-x': 'None' }"
          height="50vh"
          width="100%">
            <v-card-text style="margin-left:4vw">
              <v-row>
                <v-btn
                small
                icon
                color="primary"
                :disabled="!spatialData"
                @click="resetScaleAndPosUMAP"
                ><v-icon small>mdi-arrow-expand</v-icon>
                </v-btn>
              </v-row>
              <v-row>
                <v-btn
                  small
                  icon
                  color="primary"
                  :disabled="!spatialData"
                  @click="scaleUMAP=scaleUMAP*1.1"
                  ><v-icon small>mdi-magnify-plus</v-icon>
                </v-btn>
              </v-row>
              <v-row>
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
          <v-card id="stageParentRight"
            class="rounded-0"
            flat
            v-resize="onResize"
            :style="{ 'background-color': 'transparent', 'overflow-x': 'None' }"
            height="50vh">
            <v-stage
              ref="konvaStageRight"
              class="mainStage"
              :config="konvaConfigRight"
              @mousedown="mouseDownOnStageRight"
              @mousemove="mouseMoveOnStageRight"
              @mouseup="mouseUpOnStageRight"
              :style="{ 'overflow': 'hidden' }"
              >
              <v-layer
                ref="spatialLayerRight"
                id="spatialLayerRight">
                <v-circle v-for="p in circlesSpatialUMAP"
                  :config="p"
                  v-bind:key="p.id"
                  @mousemove="mouseMoveOnSpatialRight"
                  @mouseout="mouseOutOnSpatialRight"/>
              </v-layer>
              <v-layer
                ref="annotationLayerRight"
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
              <template v-else>
                <v-card
                  flat
                  :style="{'background-color': 'transparent', 'overflow-x': 'None'}"
                  height="3vh"
                  width="100%">
                  <v-row no-gutters>
                    <v-col v-if="!clusterItems">
                        No clusters
                    </v-col>
                    <v-col v-for="item in clusterItems" v-bind:key="`${item.name}`" class="ma-0 pa-0 text-center">
                      <v-btn
                      small
                      icon
                      :color="clusterColors[Number(item.name.toString().replace('C', ''))-1]"
                      @click="mouseOverClusterItem(item)"
                      >{{ item.name }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card>
              </template>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
</template>

<script lang='ts'>
import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import Konva from 'konva';
import lodash from 'lodash';
import colormap from 'colormap';
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
function colormapBounded(cmap: string[], values: number[]) {
  const min_v = Math.min(...values);
  const max_v = Math.max(...values);
  // if (min_v === max_v) return null;
  const nshades = cmap.length;
  const output: string[] = [];
  lodash.each(values, (v: number) => {
    const normalized = ((v - min_v) / (max_v - min_v)) * (nshades - 1);
    const colidx = Math.trunc(normalized);
    output.push(cmap[colidx]);
  });
  return output;
}

export default defineComponent({
  name: 'AtxAtacViewer',
  props: ['query', 'filename', 'genelist', 'selected_genes', 'heatmap', 'background', 'task', 'queue', 'standalone', 'lasso', 'rect'],
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const selectedFiles = ref<string>();
    const runId = ref<string | null>(null);
    const filenameGene = ref<string>('');
    const filenameFromParent = computed(() => props.filename);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    const currentTask = computed(() => props.task);
    const currentQueue = computed(() => props.queue);
    const selected = ref<any>();
    const genes = ref<any[]>(props.genelist);
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
    const geneMotif = ref<boolean>(false);
    const lassoSide = ref<string>();
    const colorbarText = ref<string>('white');
    const highlightIds = ref<any[]>([]);
    const topSelected = ref<any[]>([]);
    const highlightCount = ref<number>(0);
    const spatialRun = ref<boolean>(false);
    function setDraggable(flag: boolean) {
      konvaConfigLeft.value.draggable = flag;
      konvaConfigRight.value.draggable = flag;
    }
    async function fitStageToParent() {
      const parent = document.querySelector('#stageParent');
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
      });
      lodash.each(circlesSpatial.value, (c: any, i: number) => {
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
    function highlightCluster(clusterName: string) {
      if (backgroundColor.value === 'darkgrey') {
        inactiveColor.value = 'white';
      } else {
        inactiveColor.value = 'darkgrey';
      }
      lodash.each(circlesSpatial.value, (c: any, i: number) => {
        if (c.cluster !== clusterName) {
          circlesSpatial.value[i].fill = inactiveColor.value;
          circlesSpatial.value[i].stroke = inactiveColor.value;
        } else {
          circlesSpatial.value[i].fill = c.originalColor;
          circlesSpatial.value[i].stroke = c.originalColor;
        }
      });
      lodash.each(circlesSpatialUMAP.value, (c: any, i: number) => {
        if (c.cluster !== clusterName) {
          circlesSpatialUMAP.value[i].fill = inactiveColor.value;
          circlesSpatialUMAP.value[i].stroke = inactiveColor.value;
        } else {
          circlesSpatialUMAP.value[i].fill = c.originalColor;
          circlesSpatialUMAP.value[i].stroke = c.originalColor;
        }
      });
      highlightedCluster.value = clusterName;
      isHighlighted.value = true;
    }
    function makearray(stopValue: number, startValue: number) {
      if (highestCount.value === 0) return;
      const arr = [];
      const steps = 5;
      const step = (stopValue - startValue) / (steps - 1);
      for (let i = 0; i < steps; i += 1) {
        arr.push(parseFloat((startValue + (step * i)).toFixed(2)));
      }
      stepArray.value = arr;
    }
    async function updateCircles() {
      if (spatialData.value === null) return;
      isHighlighted.value = false;
      const geneSum = spatialData.value.genes_summation;
      const circles: any[] = [];
      const circlesUMAP: any[] = [];
      stepArray.value = [];
      const numClusters = lodash.uniq(spatialData.value.clusters).length;
      const colors_raw = colormap({ colormap: heatMap.value, nshades: (numClusters) * 3, format: 'hex', alpha: 1 });
      const colors: any[] = [];
      colors_raw.forEach((v: any, i: number) => {
        if ((i % 3) === 0) colors.push(colors_raw[i + 1]);
      });
      clusterColors.value = colors;
      const cmap: any = {};
      for (let i = 0; i < clusterColors.value.length; i += 1) {
        const cidx = `C${i + 1}`;
        cmap[cidx] = clusterColors.value[i];
      }
      const colors_intensity = colormap({ colormap: heatMap.value, nshades: 64, format: 'hex', alpha: 1 });
      colorBarmap.value = `linear-gradient(to right, ${colors_intensity[0]}, ${colors_intensity[16]}, ${colors_intensity[32]} , ${colors_intensity[48]}, ${colors_intensity[63]})`;
      const spatialCoord = spatialData.value.coordinates;
      const spatialCoordUMAP = spatialData.value.coordinates_umap.map((v: number[]) => ([v[0], -v[1]]));
      const minX = Math.min(...spatialCoord.map((a: number[]) => a[0]));
      const minY = Math.min(...spatialCoord.map((a: number[]) => a[1]));
      const maxX = Math.max(...spatialCoord.map((a: number[]) => a[0]));
      const maxY = Math.max(...spatialCoord.map((a: number[]) => a[1]));
      const minX_UMAP = Math.min(...spatialCoordUMAP.map((a: number[]) => a[0]));
      const minY_UMAP = Math.min(...spatialCoordUMAP.map((a: number[]) => a[1]));
      const maxX_UMAP = Math.max(...spatialCoordUMAP.map((a: number[]) => a[0]));
      const maxY_UMAP = Math.max(...spatialCoordUMAP.map((a: number[]) => a[1]));
      const { width: stageWidth, height: stageHeight } = konvaConfigLeft.value;
      const { width: stageWidthR, height: stageHeightR } = konvaConfigRight.value;
      const viewScale = Math.min(stageWidth / (maxX - minX), stageHeight / (maxY - minY));
      const viewScaleUMAP = Math.min(stageWidthR / (maxX_UMAP - minX_UMAP), stageHeightR / (maxY_UMAP - minY_UMAP));
      const radiusUMAP = (Math.min(stageWidthR, stageHeightR) / (30 * 5)) * scaleUMAP.value;
      const [paddingX, paddingY] = [60, 30];
      const radius = (Math.min(stageWidth, stageHeight) / (30 * 5)) * scale.value;
      if (isClusterView.value) {
        lodash.each(spatialData.value.clusters, (v: string, i: number) => {
          const [ax, ay] = spatialCoord[i];
          const x = ax - minX;
          const y = ay - minY;
          const regex = /\d+/g;
          const string = v;
          const match = Number(string.match(regex)![0]) - 1;
          const c = {
            id: get_uuid(),
            x: x * scale.value * viewScale + paddingX,
            y: y * scale.value * viewScale + paddingY,
            radius,
            originalColor: colors[match],
            fill: colors[match],
            stroke: colors[match],
            strokeWidth: 1.0,
            cluster: v,
            total: geneSum[i],
            inactive: false,
            genes: { },
          };
          lodash.forIn(spatialData.value.genes, (val: number[], k: string) => {
            (c.genes as any)[k] = val[i];
          });
          circles.push(c);
        });
        lodash.each(spatialData.value.clusters, (v: string, i: number) => {
          const [ax, ay] = spatialCoordUMAP[i];
          const x = ax - minX_UMAP;
          const y = ay - minY_UMAP;
          const regex = /\d+/g;
          const string = v;
          const match = Number(string.match(regex)![0]) - 1;
          const c = {
            id: get_uuid(),
            x: x * scaleUMAP.value * viewScaleUMAP + paddingX,
            y: y * scaleUMAP.value * viewScaleUMAP + paddingY,
            radius: radiusUMAP,
            originalColor: colors[match],
            fill: colors[match],
            stroke: colors[match],
            strokeWidth: 1.0,
            cluster: v,
            total: geneSum[i],
            inactive: false,
            genes: { },
          };
          lodash.forIn(spatialData.value.genes, (val: number[], k: string) => {
            (c.genes as any)[k] = val[i];
          });
          circlesUMAP.push(c);
        });
      } else {
        highestCount.value = 0;
        lowestCount.value = 10000;
        const geneColors = colormapBounded(colors_intensity, geneSum);
        lodash.each(spatialData.value.clusters, (v: string, i: number) => {
          const [ax, ay] = spatialCoord[i];
          const x = ax - minX;
          const y = ay - minY;
          const clr = (geneSum[i] > 0) ? geneColors[i] : inactiveColor.value;
          highestCount.value = geneSum[i] > highestCount.value ? geneSum[i] : highestCount.value;
          lowestCount.value = geneSum[i] < lowestCount.value ? geneSum[i] : lowestCount.value;
          const c = {
            id: get_uuid(),
            x: x * scale.value * viewScale + paddingX,
            y: y * scale.value * viewScale + paddingY,
            radius,
            originalColor: clr,
            fill: clr,
            stroke: clr,
            strokeWidth: 1.0,
            cluster: v,
            total: geneSum[i],
            inactive: false,
            genes: { },
          };
          lodash.forIn(spatialData.value.genes, (val: number[], k: string) => {
            (c.genes as any)[k] = val[i];
          });
          circles.push(c);
        });
        lodash.each(spatialData.value.clusters, (v: string, i: number) => {
          const [ax, ay] = spatialCoordUMAP[i];
          const x = ax - minX_UMAP;
          const y = ay - minY_UMAP;
          const clr = (geneSum[i] > 0) ? geneColors[i] : inactiveColor.value;
          highestCount.value = geneSum[i] > highestCount.value ? geneSum[i] : highestCount.value;
          lowestCount.value = geneSum[i] < lowestCount.value ? geneSum[i] : lowestCount.value;
          const c = {
            id: get_uuid(),
            x: x * scaleUMAP.value * viewScaleUMAP + paddingX,
            y: y * scaleUMAP.value * viewScaleUMAP + paddingY,
            radius: radiusUMAP,
            originalColor: clr,
            fill: clr,
            stroke: clr,
            strokeWidth: 1.0,
            cluster: v,
            total: geneSum[i],
            inactive: false,
            genes: { },
          };
          lodash.forIn(spatialData.value.genes, (val: number[], k: string) => {
            (c.genes as any)[k] = val[i];
          });
          circlesUMAP.push(c);
        });
        makearray(highestCount.value, lowestCount.value);
        lodash.each(spatialData.value.clusters, (v: string, i: number) => {
          const [ax, ay] = spatialCoordUMAP[i];
          const x = ax - minX_UMAP;
          const y = ay - minY_UMAP;
          const clr = (geneSum[i] > 0) ? geneColors[i] : inactiveColor.value;
          const rd = (geneSum[i] > 0) ? 1 : 1;
          const c = {
            id: get_uuid(),
            x: x * scaleUMAP.value * viewScaleUMAP + paddingX,
            y: y * scaleUMAP.value * viewScaleUMAP + paddingY,
            radius,
            originalColor: clr,
            fill: clr,
            stroke: clr,
            strokeWidth: 1.0,
            cluster: v,
            total: geneSum[i],
            inactive: false,
            genes: { },
          };
          lodash.forIn(spatialData.value.genes, (val: number[], k: string) => {
            (c.genes as any)[k] = val[i];
          });
          circlesUMAP.push(c);
        });
      }
      circlesSpatial.value = circles;
      circlesSpatialUMAP.value = circlesUMAP;
      highlightRegion();
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = props.query.public ? await client.value.getPublicTaskStatus(task_id) : await client.value.getTaskStatus(task_id);
    };
    async function runSpatial(workerRequired = true) {
      if (!client.value) return;
      // if (!selectedFiles.value) return;
      try {
        progressMessage.value = null;
        loading.value = true;
        spatialRun.value = true;
        if (workerRequired) {
          const task = currentTask.value;
          const queue = currentQueue.value;
          const args = [filenameGene.value, selectedGenes.value, highlightIds.value];
          const kwargs = {};
          const taskObject = props.query.public ? await client.value.postPublicTask(task, args, kwargs, queue) : await client.value.postTask(task, args, kwargs, queue);
          if (props.query.public && runId.value === null) {
            runId.value = taskObject.meta.run_id;
            ctx.emit('publicRun', runId.value);
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
            snackbar.dispatch({ text: 'Worker failed in AtxViewer', options: { right: true, color: 'error' } });
            loading.value = false;
            return;
          }
          progressMessage.value = taskStatus.value.status;
          const resp = taskStatus.value.result;
          spatialData.value = resp;
          genes.value = props.genelist;
          if (highlightIds.value.length > 0) {
            ctx.emit('highlightedId', highlightIds.value);
          }
        }
        clusterItems.value = lodash.uniq(spatialData.value.cluster_names).map((v: any) => ({ name: v }));
        await updateCircles();
        await fitStageToParent();
        spatialRun.value = false;
      } catch (error) {
        ctx.emit('spatialFlag', false);
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: error, options: { right: true, color: 'error' } });
      } finally {
        loading.value = false;
        ctx.emit('spatialFlag', spatialData.value);
      }
    }
    // Drawing
    async function mouseMoveOnSpatial(ev: any) {
      const mousePos = (ctx as any).refs.konvaStage.getNode().getRelativePointerPosition();
      const item = ev.target.attrs;
      tooltip.position({
        x: mousePos.x,
        y: mousePos.y,
      });
      let text = `Cluster: ${item.cluster}`;
      if (item.total > 0 && selectedGenes.value.length > 0) {
        text = `${text}\nSum: ${item.total}`;
        lodash.forIn(item.genes, (v: number, k: string) => {
          if (v > 0) text = `${text}\n${k}: ${v}`;
        });
      }
      tooltipText.text(text);
      tooltip.show();
      if (isClusterView.value && item.cluster !== highlightedCluster.value && (!isDrawing.value && !isDrawingRect.value)) {
        const { cluster } = item;
        highlightCluster(cluster);
      }
    }
    async function mouseOutOnSpatial(ev: any) {
      isHighlighted.value = false;
      tooltip.hide();
      tooltipRight.hide();
      if ((!isDrawing.value && !isDrawingRect.value)) unHighlighCluster();
    }
    async function mouseMoveOnSpatialRight(ev: any) {
      const mousePosRight = (ctx as any).refs.konvaStageRight.getNode().getRelativePointerPosition();
      const item = ev.target.attrs;
      tooltipRight.position({
        x: mousePosRight.x,
        y: mousePosRight.y,
      });
      let text = `Cluster: ${item.cluster}`;
      if (item.total > 0 && selectedGenes.value.length > 0) {
        text = `${text}\nSum: ${item.total}`;
        lodash.forIn(item.genes, (v: number, k: string) => {
          if (v > 0) text = `${text}\n${k}: ${v}`;
        });
      }
      tooltipTextRight.text(text);
      tooltipRight.show();
      if (isClusterView.value && item.cluster !== highlightedCluster.value && (!isDrawing.value && !isDrawingRect.value)) {
        const { cluster } = item;
        highlightCluster(cluster);
      }
    }
    async function mouseOutOnSpatialRight(ev: any) {
      isHighlighted.value = false;
      tooltip.hide();
      tooltipRight.hide();
      if (!isDrawing.value && !isDrawingRect.value) unHighlighCluster();
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
        const mousePos = (ctx as any).refs.konvaStage.getNode().getRelativePointerPosition();
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
        const mousePos = (ctx as any).refs.konvaStageRight.getNode().getRelativePointerPosition();
        rectangleUMAP.value = { x: mousePos.x, y: mousePos.y, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'green', strokeWidth: 3, endPointx: 0, endPointy: 0 };
        rectangle.value = { x: 0, y: 0, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'green', strokeWidth: 3, endPointx: 0, endPointy: 0 };
        highlightRegion();
        isClicked.value = true;
      }
    }
    function mouseMoveOnStageLeft(ev: any) {
      if (isDrawing.value) {
        if (isClicked.value) {
          const mousePos = (ctx as any).refs.konvaStage.getNode().getRelativePointerPosition();
          polygon.value.points.push(Math.round(mousePos.x));
          polygon.value.points.push(Math.round(mousePos.y));
          (ctx as any).refs.drawingLayer.getNode().batchDraw(); // forced update since due to pointer issue
        }
      }
      if (isDrawingRect.value) {
        if (isClicked.value) {
          const mousePos = (ctx as any).refs.konvaStage.getNode().getRelativePointerPosition();
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
          const mousePos = (ctx as any).refs.konvaStageRight.getNode().getRelativePointerPosition();
          polygonUMAP.value.points.push(Math.round(mousePos.x));
          polygonUMAP.value.points.push(Math.round(mousePos.y));
          (ctx as any).refs.drawingLayerRight.getNode().batchDraw(); // forced update since due to pointer issue
        }
      }
      if (isDrawingRect.value) {
        if (isClicked.value) {
          const mousePos = (ctx as any).refs.konvaStageRight.getNode().getRelativePointerPosition();
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
          runSpatial(true);
        }
      }
      if (isDrawingRect.value) {
        isClicked.value = false;
        regions.value.push(deepCopy(rectangle.value));
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial(true);
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
          runSpatial(true);
        }
      }
      if (isDrawingRect.value) {
        isClicked.value = false;
        regionsUMAP.value.push(deepCopy(rectangleUMAP.value));
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial(true);
        }
      }
    }
    async function mouseOverClusterItem(ev: any) {
      highlightCluster(ev.name);
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
      const stage = (ctx as any).refs.konvaStage.getNode();
      const newPos = { x: 0, y: 0 };
      stage.position(newPos);
      scale.value = 0.75;
    }
    function resetScaleAndPosUMAP(ev: any) {
      const stage = (ctx as any).refs.konvaStageRight.getNode();
      const newPos = { x: 0, y: 0 };
      stage.position(newPos);
      scaleUMAP.value = 0.75;
    }
    function onResize() {
      fitStageToParent();
      updateCircles();
    }
    watch(isDrawing, (v: boolean) => {
      setDraggable(!v);
      removeRegions();
      if (!isDrawing.value) {
        unHighlighCluster();
      }
    });
    watch(isDrawingRect, (v: boolean) => {
      setDraggable(!v);
      removeRegions();
      if (!isDrawingRect.value) {
        unHighlighCluster();
      }
    });
    watch(heatMap, (v: string) => {
      if (v === 'picnic') {
        colorbarText.value = 'black';
      } else if (v === 'jet' || v === 'inferno') {
        colorbarText.value = 'white';
      } else if (v === 'hot') {
        colorbarText.value = 'grey';
      } else {
        colorbarText.value = 'brown';
      }
      updateCircles();
    });
    watch(filenameFromParent, (v: string) => {
      selectedGenes.value = [];
      if (v === '') {
        ctx.emit('spatialFlag', false);
      }
      filenameGene.value = v;
      runSpatial(true);
    });
    watch(scale, () => {
      reScale();
    });
    watch(scaleUMAP, () => {
      reScaleUMAP();
    });
    watch(isDrawing, (v: boolean) => {
      setDraggable(!v);
      if (!isDrawing.value) unHighlighCluster();
      polygon.value.points = [];
    });
    watch(selectedGenes, (v: any[]) => {
      if (selectedGenes.value.length === 0) {
        isClusterView.value = true;
        stepArray.value = [];
        updateCircles();
      } else {
        isClusterView.value = false;
        removeRegions();
        console.log('2');
        runSpatial(true);
      }
    });
    watch(selectedGenesFromParent, (v: any) => {
      selectedGenes.value = v;
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
      (ctx.refs.annotationLayer as any).getNode().add(tooltip);
      (ctx.refs.annotationLayerRight as any).getNode().add(tooltipRight);
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
      genes,
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
      geneMotif,
      colorbarText,
      highlightIds,
      lassoSide,
      highlightCount,
      spatialData,
      spatialRun,
    };
  },
});
</script>

<style>
</style>
