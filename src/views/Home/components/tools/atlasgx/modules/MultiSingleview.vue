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
    <v-col cols="12" sm="11">
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
  name: 'MultiSingleview.vue',
  props: ['query', 'filename', 'selected_genes', 'heatmap', 'background', 'task', 'queue', 'standalone', 'lasso', 'rect', 'manualColor', 'clickedCluster', 'checkBoxCluster', 'indFlag', 'geneOmotif', 'idOfRun', 'antiKey', 'plot'],
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const selectedFiles = ref<string>();
    const runId = computed(() => (props.idOfRun));
    const filenameGene = ref<string>('');
    const filenameFromParent = computed(() => props.filename);
    const colorFromParent = computed(() => props.manualColor);
    const typeOfPlot = computed(() => props.plot);
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
    const scale = ref<number>(0.75);
    const isClusterView = ref(true);
    const isHighlighted = ref(false);
    const lowestCount = ref<number>(10000);
    const highestCount = ref<number>(0);
    const highlightedCluster = ref<any>();
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
    const circlesSpatial = ref<any[]>([]);
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
    const rectangle = ref<any>({ x: 0, y: 0, width: 0, height: 0, opacity: 0.8, fill: 'white', stroke: 'green', strokeWidth: 1, endPointx: 0, endPointy: 0 });
    const regions = ref<any>();
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
    const geneSummation = ref<any[]>([]);
    const geneMotif = computed(() => (props.geneOmotif));
    function setDraggable(flag: boolean) {
      konvaConfigLeft.value.draggable = flag;
    }
    async function fitStageToParent() {
      const parent = document.querySelector('#stageParentDualAtac');
      if (!parent) return;
      const parentWidth = (parent as any).offsetWidth;
      const parentHeight = (parent as any).offsetHeight;
      konvaConfigLeft.value.width = parentWidth;
      konvaConfigLeft.value.height = parentHeight;
    }
    function remove(item: any) {
      const newArr = selectedGenes.value.filter((x: any) => x !== item.name);
      selectedGenes.value = newArr;
    }
    function unHighlighCluster() {
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
        const info = regions;
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
        if (regions.value !== undefined) {
          regions.value.forEach((poly: any, idx: number) => {
            if (pointInPolygon(pt, splitarray(poly.points, 2))) res = true;
          });
        }
        return res;
      };
      const filteredIndex = circlesSpatial.value.map((v: any) => funcInsideRegions([v.x, v.y]));
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
        } else {
          circlesSpatial.value[i].fill = c.originalColor;
          circlesSpatial.value[i].stroke = c.originalColor;
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
      if (spatialData.value === null || spatialData.value.spatial === undefined) return;
      isHighlighted.value = false;
      const circles: any[] = [];
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
      const viewScale = Math.min(stageWidth / (maxX.value - minX.value), stageHeight / (maxY.value - minY.value));
      const radius = (Math.min(stageWidth, stageHeight) / (30 * 5)) * scale.value;
      const [paddingX, paddingY] = [60, 30];
      if (isClusterView.value || averageInd.value) {
        const coordinatesSib: any = [];
        const TSS: any = [];
        const nFrags: any = [];
        spatialData.value.spatial.forEach((v: string[], i: number) => {
          if (v[0].includes('C')) {
            TSS.push(parseFloat(v[3]));
            nFrags.push(parseFloat(v[4]));
            let value1 = v[1];
            let value2 = v[2];
            if (v[1].includes('\'')) value1 = v[1].replace(/'/g, '');
            if (v[1].includes('"')) value1 = v[1].replace(/"/g, '');
            if (v[2].includes('\'')) value2 = v[2].replace(/'/g, '');
            if (v[2].includes('"')) value2 = v[2].replace(/"/g, '');
            const [tempX, tempY] = value1.split(',');
            const [tempUX, tempUY] = value2.split(',');
            const ax = parseFloat(tempX.slice(1));
            const ay = parseFloat(tempY.slice(0, -1));
            const auX = parseFloat(tempUX.slice(1));
            const auY = parseFloat(tempUY.slice(0, -1));
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
              hitStrokeWidth: radius * 4,
              genes: { },
            };
            selectedGenes.value.forEach((id: any, index: any) => {
              (c.genes as any)[id] = parseFloat(geneSummation.value[index][i]);
            });
            c.total = lodash.sum(Object.values(c.genes));
            circles.push(c);
          }
        });
        if (isClusterView.value) {
          ctx.emit('spatialCircleData', [TSS, nFrags]);
        } else ctx.emit('spatialCircleData', circles);
      } else {
        const geneSum: number[] = [];
        spatialData.value.spatial.forEach((v: string[], i: number) => {
          if (v[0].includes('C')) {
            let value1 = v[1];
            let value2 = v[2];
            if (v[1].includes('\'')) value1 = v[1].replace(/'/g, '');
            if (v[1].includes('"')) value1 = v[1].replace(/"/g, '');
            if (v[2].includes('\'')) value2 = v[2].replace(/'/g, '');
            if (v[2].includes('"')) value2 = v[2].replace(/"/g, '');
            const [tempX, tempY] = value1.split(',');
            const [tempUX, tempUY] = value2.split(',');
            const ax = parseFloat(tempX.slice(1));
            const ay = parseFloat(tempY.slice(0, -1));
            const auX = parseFloat(tempUX.slice(1));
            const auY = parseFloat(tempUY.slice(0, -1));
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
            selectedGenes.value.forEach((id: any, index: any) => {
              (c.genes as any)[id] = parseFloat(geneSummation.value[index][i]);
            });
            c.total = lodash.sum(Object.values(c.genes));
            geneSum.push(c.total);
            circles.push(c);
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
          console.log(runId.value);
          const tixelFileName = `data/${runId.value}/h5/data.csv`;
          const spatial = await client.value!.getCsvFile({ params: { filename: tixelFileName } });
          spatialData.value.spatial = spatial;
        } else {
          const spatial = await client.value!.getSpatialDataByToken(filenameGene.value, 0);
          spatialData.value.spatial = spatial;
          const gene = await client.value!.getGeneMotifNamesByToken(filenameGene.value, 1);
          spatialData.value.gene = gene;
          const motif = await client.value!.getGeneMotifNamesByToken(filenameGene.value, 2);
          spatialData.value.motif = motif;
        }
        console.log(spatialData.value);
        const spatialX: number[] = [];
        const spatialY: number[] = [];
        const totalHold: any = {};
        spatialData.value.spatial.forEach((list: string[], index: any) => {
          if (list[0].includes('C')) {
            let value1 = list[1];
            let value2 = list[2];
            if (list[1].includes('\'')) value1 = list[1].replace(/'/g, '');
            if (list[1].includes('"')) value1 = list[1].replace(/"/g, '');
            if (list[2].includes('\'')) value2 = list[2].replace(/'/g, '');
            if (list[2].includes('"')) value2 = list[2].replace(/"/g, '');
            const [tempX, tempY] = value1.split(',');
            const [tempUX, tempUY] = value2.split(',');
            const x = parseFloat(tempX.slice(1));
            const y = parseFloat(tempY.slice(0, -1));
            const uX = parseFloat(tempUX.slice(1));
            const uY = parseFloat(tempUY.slice(0, -1));
            spatialX.push(x);
            spatialY.push(y);
            if (!Object.keys(totalHold).includes(list[0])) totalHold[list[0]] = 1;
            else totalHold[list[0]] += 1;
          }
        });
        Object.keys(totalHold).forEach((v: any, index: any) => {
          const key = `C${index + 1}`;
          totalInClust.value[key] = totalHold[key];
        });
        minX.value = Math.min(...spatialX);
        minY.value = Math.min(...spatialY);
        maxX.value = Math.max(...spatialX);
        maxY.value = Math.max(...spatialY);
        ctx.emit('totalClust', totalInClust.value);
      }
      updateCircles();
      if (!props.query.public && (spatialData.value.gene === null || spatialData.value.gene === undefined)) {
        const geneFileName = `data/${runId.value}/h5/geneNames.txt`;
        const gene = await client.value!.getGeneMotifNames(geneFileName);
        spatialData.value.gene = gene;
        const motifFileName = `data/${runId.value}/h5/motifNames.txt`;
        const motif = await client.value!.getGeneMotifNames(motifFileName);
        spatialData.value.motif = motif;
      }
      loading.value = false;
      if (geneMotif.value === 'gene') {
        ctx.emit('totalGM', spatialData.value.gene);
      } else {
        ctx.emit('totalGM', spatialData.value.motif);
      }
    }
    async function runSpatial() {
      if (!client.value) return;
      // if (!selectedFiles.value) return;
      try {
        if (highlightIds.value.length > 0) {
          progressMessage.value = null;
          spatialRun.value = true;
          const task = currentTask.value;
          const queue = currentQueue.value;
          const args = [filenameGene.value, highlightIds.value, tableKeyFromParent.value];
          const kwargs = {};
          const taskObject = props.query.public ? await client.value.postPublicTask(task, args, kwargs, queue, (geneMotif.value === 'gene') ? 3 : 4) : await client.value.postTask(task, args, kwargs, queue);
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
            snackbar.dispatch({ text: 'Worker failed in MultSingleview.vue', options: { right: true, color: 'error' } });
            return;
          }
          progressMessage.value = taskStatus.value.status;
          const resp = taskStatus.value.result;
          ctx.emit('highlightedId', { ids: highlightIds.value, genes: resp.top_selected });
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
      const tixelDataFilename = (geneMotif.value === 'gene') ? `data/${runId.value}/h5/geneSummation.txt` : `data/${runId.value}/h5/motifSummation.txt`;
      const array = (geneMotif.value === 'gene') ? spatialData.value.gene : spatialData.value.motif;
      const rows = selectedGenes.value.map((v: any) => array.indexOf(v));
      const preSplit = await client.value?.getSummation(tixelDataFilename, rows);
      const emptyArrayHolder: any[] = [];
      preSplit.forEach((value: string, index: any) => {
        emptyArrayHolder.push(value.split(','));
      });
      geneSummation.value = emptyArrayHolder;
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
        text = `${text}\nAvg: ${(item.total / selectedGenes.value.length).toFixed(3)}`;
        lodash.forIn(item.genes, (v: number, k: string) => {
          text = `${text}\n${k}: ${v}`;
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
      const mousePos = { x: ev.evt.layerX, y: ev.evt.layerY };
      const stageWidth = (ctx as any).refs.konvaStageDualAtac.$el.offsetWidth;
      const stageHeight = (ctx as any).refs.konvaStageDualAtac.$el.offsetHeight;
      const first = (ctx as any).refs.konvaStageDualAtac.$children[0].$children[0].getNode().absolutePosition();
      const second = (ctx as any).refs.konvaStageDualAtac.$children[0].$children[49].getNode().absolutePosition();
      const third = (ctx as any).refs.konvaStageDualAtac.$children[0].$children[circlesSpatial.value.length - 50].getNode().absolutePosition();
      const end = (ctx as any).refs.konvaStageDualAtac.$children[0].$children[circlesSpatial.value.length - 1].getNode().absolutePosition();
      const boundaries = [first, second, third, end];
      let leftmost = 1000;
      let bottommost = 0;
      let rightmost = 0;
      let topmost = 1000;
      boundaries.forEach((v: any, i: number) => {
        if (v.x > rightmost) {
          if (v.x > stageWidth) {
            rightmost = stageWidth - 2;
          } else rightmost = v.x;
        }
        if (v.x < leftmost) {
          if (v.x < 0) {
            leftmost = 15;
          } else leftmost = v.x;
        }
        if (v.y > bottommost) {
          if (v.y > stageHeight) {
            bottommost = stageHeight - 2;
          } else bottommost = v.y;
        }
        if (v.y < topmost) {
          if (v.y < 0) {
            topmost = 15;
          } else topmost = v.y;
        }
      });
      const finale = [leftmost, topmost, rightmost, bottommost];
      isHighlighted.value = false;
      tooltip.hide();
      if ((!isDrawing.value && !isDrawingRect.value) && (mousePos.x < finale[0] || mousePos.y < finale[1] || mousePos.x > finale[2] || mousePos.y > finale[3])) unHighlighCluster();
    }
    // Drawing Region
    function removeRegions() {
      regions.value = [];
      polygon.value.points = [];
      rectangle.value = { x: 0, y: 0, id: 1, width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'green', strokeWidth: 3, endPointx: 0, endPointy: 0 };
      highlightRegion();
    }
    function mouseDownOnStageLeft(ev: any) {
      if (isDrawing.value) {
        removeRegions();
        isClicked.value = true;
        polygon.value = { x: 0, y: 0, id: get_uuid(), points: [], opacity: 0.6, listening: true, closed: true, fill: '', stroke: 'green', strokeWidth: 3 };
        polygon.value.points = [];
      }
      if (isDrawingRect.value) {
        removeRegions();
        const mousePos = (ctx as any).refs.konvaStageDualAtac.getNode().getRelativePointerPosition();
        rectangle.value = { x: mousePos.x, y: mousePos.y, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'green', strokeWidth: 3, endPointx: 0, endPointy: 0 };
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
    function mouseUpOnStageLeft(ev: any) {
      if (isDrawing.value) {
        isClicked.value = false;
        regions.value.push(deepCopy(polygon.value));
        polygon.value.points = [];
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial();
        }
      }
      if (isDrawingRect.value) {
        isClicked.value = false;
        regions.value.push(deepCopy(rectangle.value));
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial();
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
    function resetScaleAndPos(ev: any) {
      const stage = (ctx as any).refs.konvaStageDualAtac.getNode();
      const newPos = { x: 0, y: 0 };
      stage.position(newPos);
      scale.value = 0.75;
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
        retrieveData();
      }
    });
    watch(runId, async (v: any) => {
      if (v !== null && !props.query.public) {
        spatialData.value = null;
        totalInClust.value = {};
        loading.value = true;
        retrieveData();
      }
    });
    watch(geneMotif, async (v: any) => {
      if (spatialData.value !== null) {
        loading.value = true;
        retrieveData();
        selectedGenes.value = [];
        loading.value = false;
      }
    });
    watch(scale, () => {
      reScale();
    });
    watch(selectedGenes, async (v: any[]) => {
      if (v && selectedGenes.value.length === 0) {
        isClusterView.value = true;
        stepArray.value = [];
        geneSummation.value = [];
        updateCircles();
      } else {
        isClusterView.value = false;
        await obtainSummations();
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
    watch(loading, (v: any) => {
      ctx.emit('loading_value', v);
    });
    onMounted(async () => {
      await clientReady;
      if (runId.value !== null) retrieveData();
      tooltip.add(tooltipTag);
      tooltip.add(tooltipText);
      (ctx.refs.annotationLayerDualAtac as any).getNode().add(tooltip);
    });
    return {
      get_uuid,
      scale,
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
      circlesSpatial,
      isHighlighted,
      onResize,
      mouseMoveOnSpatial,
      mouseOutOnSpatial,
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
      mouseMoveOnStageLeft,
      mouseUpOnStageLeft,
      polygon,
      regions,
      rectangle,
      removeRegions,
      reScale,
      resetScaleAndPos,
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
      geneMotif,
      tableKeyFromParent,
      geneSummation,
      typeOfPlot,
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
