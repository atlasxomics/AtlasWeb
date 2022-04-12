<template>
    <v-container fixed>
          <fresh-dialog v-model="fileDialog" width="30%" height="30%">
            <v-card flat height="20vh" class="d-flex flex-column">
              <v-card-title>
                <file-auto-complete v-model="acFilename" :filter="'.h5ad'"/>
              </v-card-title>
              <v-spacer horizontal/>
              <v-card-actions>
                <v-spacer/>
                <v-btn color="success" @click="onSelectFiles(acFilename)">Select</v-btn>
                <v-btn color="error" @click="fileDialog=false">Cancel</v-btn>
              </v-card-actions>
            </v-card>
          </fresh-dialog>
          <v-row no-gutters v-if="!disable_gene_selection">
            <v-col cols="12" sm="12">
              <v-card flat>
                  <v-autocomplete
                    v-model="selectedGenes"
                    :items="filteredGenes"
                    :outlined="false"
                    multiple
                    dense
                    :label="selectedFiles"
                    clearable
                    :allow-overflow="false"
                    chips
                    :cache-items="false"
                    color="blue-grey lighten-2"
                    item-text="name"
                    item-value="name"
                    @input="acInputChanged"
                    :search-input.sync="searchInput"
                    :loading="autocompleteLoading || loading"
                    @change="onGenelistChanged"
                    width="100%"
                    small-chips>
                    <template v-slot:selection="data">
                      <v-chip
                        v-bind="data.attrs"
                        :input-value="data.selected"
                        close
                        small
                        color="warning"
                        @click="data.select"
                        @click:close="remove(data.item)"
                      >{{ data.item.name }}
                      </v-chip>
                    </template>
                  </v-autocomplete>
              </v-card>
            </v-col>
          </v-row>
          <v-row no-gutters>
              <v-col cols="12" sm="1" class="ma-0 pa-0">
                <v-card
                  class="rounded-0"
                  flat
                  :style="{ 'background-color': backgroundColor, 'overflow-x': 'None' }"
                  :height="konvaConfig.height"
                  width="100%"
                  >
                  <v-card-text>
                    <v-row>
                      <v-btn
                        small
                        icon
                        color="primary"
                        @click="fileDialog = true"
                        ><v-icon>mdi-folder</v-icon>
                      </v-btn>
                    </v-row>
                    <v-row>
                      <template v-if="currentViewType=='umap'">
                        <v-btn
                          small
                          icon
                          color="primary"
                          @click="currentViewType='spatial'"
                          ><v-icon>mdi-teamviewer</v-icon>
                        </v-btn>
                      </template>
                      <template v-else>
                        <v-btn
                          small
                          icon
                          color="primary"
                          @click="currentViewType='umap'"
                          ><v-icon>mdi-teamviewer</v-icon>
                        </v-btn>
                      </template>
                    </v-row>
                    <v-row>
                      <v-btn
                        small
                        icon
                        color="primary"
                        @click="resetScaleAndPos"
                        ><v-icon small>mdi-arrow-expand</v-icon>
                      </v-btn>
                    </v-row>
                    <template v-if="isLocked">
                      <v-row>
                        <v-btn
                          small
                          icon
                          color="error"
                          @click="isLocked=false"
                          ><v-icon small>mdi-lock</v-icon>
                        </v-btn>
                      </v-row>
                    </template>
                    <template v-else>
                      <v-row>
                        <v-btn
                          small
                          icon
                          color="primary"
                          @click="isLocked=true"
                          ><v-icon small>mdi-lock-open-outline</v-icon>
                        </v-btn>
                      </v-row>
                    </template>
                    <template v-if="isDrawing">
                      <v-row>
                        <v-btn
                          small
                          icon
                          color="primary"
                          @click="isDrawing = false"
                          ><v-icon small>mdi-eye</v-icon>
                        </v-btn>
                      </v-row>
                      <v-row>
                        <v-btn
                          small
                          icon
                          color="primary"
                          @click="removeRegions"
                          ><v-icon small>mdi-delete</v-icon>
                        </v-btn>
                      </v-row>
                    </template>
                    <template v-else>
                      <v-row>
                        <v-btn
                          small
                          icon
                          color="primary"
                          @click="isDrawing = true"
                          ><v-icon small>mdi-pencil</v-icon>
                        </v-btn>
                      </v-row>
                    </template>
                    <v-row>
                        <v-btn
                          small
                          icon
                          color="primary"
                          @click="scale=scale*1.1"
                          ><v-icon small>mdi-magnify-plus</v-icon>
                        </v-btn>
                    </v-row>
                    <v-row>
                        <v-btn
                          small
                          icon
                          color="primary"
                          @click="scale=scale*0.9"
                          ><v-icon small>mdi-magnify-minus</v-icon>
                        </v-btn>
                    </v-row>
                    <v-row>
                      <template v-if="loadingprop || loading">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                      </template>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="11">
                <v-card id="stageParent"
                        v-resize="onResize"
                        class="rounded-0"
                        flat
                        :style="{ 'background-color': backgroundColor, 'overflow-x': 'None' }"
                        :height="konvaConfig.height">
                  <v-stage
                    ref="konvaStage"
                    class="mainStage"
                    :config="konvaConfig"
                    :style="{ 'overflow': 'hidden' }"
                    @mousedown="mouseDownOnStage"
                    @mousemove="mouseMoveOnStage"
                    @mouseup="mouseUpOnStage"
                    @wheel="mouseWheelOnStage"
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
                  </v-stage>
                </v-card>
              </v-col>
          </v-row>
          <v-row no-gutters>
              <v-col cols="12" md="12">
                <template v-if="!isClusterView">
                  <v-card
                    class="rounded-0"
                    flat
                    :style="{
                      'background-image':`linear-gradient(to right, rgba(0, 0, 100, 1) 0%, rgba(28, 127, 238, 1) 14%,rgba(47, 201, 226, 1) 28%, rgba(63, 218, 216, 1) 38%, rgba(79, 220, 74, 1) 52%, rgba(208, 222, 33, 1) 65%, rgba(184, 10, 10, 1) 100%, red)` }"
                    height="2vh"
                    width="100%"
                    >
                    <v-row no-gutters>
                      <v-col v-if="stepArray.length < 1">
                        No step info
                      </v-col>
                      <v-col v-for="step in stepArray" v-bind:key="`${step}-${get_uuid()}`" class="ma-0 pa-0">
                        <p class="overline h6 text-center">{{ step }}</p>
                      </v-col>
                    </v-row>
                  </v-card>
                </template>
                <template v-else>
                  <v-card
                      class="rounded-0"
                      flat
                      :style="{'background-color': backgroundColor, 'overflow-x': 'None'}"
                      height="2vh"
                      width="100%">
                          <v-row no-gutters>
                            <v-col v-if="!clusterItems">
                              No clusters
                            </v-col>
                            <v-col v-for="item in clusterItems"
                                   v-bind:key="`${item.name}-${get_uuid()}`" class="ma-0 pa-0 text-center">
                              <v-btn
                                small
                                icon
                                :color="clusterColors[Number(item.name.toString().replace('C', ''))]"
                                @click="mouseOverClusterItem(item)"
                                >{{ item.name }}
                              </v-btn>
                            </v-col>
                          </v-row>
                  </v-card>
                </template>
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
import FreshDialog from '@/components/FreshDialog.vue';
import FileAutoComplete from './FileAutoComplete.vue';

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

function pointInPolygon(point: number[], vs: any[]) { // point is like [5,5], vs is like [[1,2],[10,20],[100,200]]
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i + 0, i += 1) {
    const [xi, yi] = vs[i];
    const [xj, yj] = vs[j];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((((xj - xi) * (y - yi)) / (yj - yi)) + xi));
    if (intersect) inside = !inside;
  }
  return inside;
}

export default defineComponent({
  name: 'AtxViewer',
  props: ['query', 'filename', 'spatialdata', 'genelist', 'selected_genes', 'presentation', 'selected_tixels', 'heatmap', 'background', 'worker', 'queue', 'standalone', 'disable_gene_selection', 'loadingprop', 'highlighted_cluster', 'selected_tixel_index'],
  components: { FreshDialog, FileAutoComplete },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const fileDialog = ref<boolean>(false);
    const selectedFiles = ref<string>();
    const acFilename = ref<string>();
    const workers = computed(() => store.state.client?.workers);
    const currentRunId = ref<string | null>(null);
    const filename = computed(() => props.filename);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    const currentTask = computed(() => props.worker);
    const currentQueue = computed(() => props.queue);
    const runId = ref<string | null>(null);
    const publicLink = ref<string | null>(null);
    const items = ref<any[]>();
    const search = ref<string>();
    const selected = ref<any>();
    const genes = ref<any[]>(props.genelist);
    const filteredGenes = ref<any[]>([]);
    const loading = ref<boolean>(false);
    const selectedGenes = ref<any[]>([]);
    const selectedGenesFromParent = computed(() => props.selected_genes);
    const searchInput = ref<string | null>(null);
    const spatialData = ref<any | null>();
    const spatialDataFromParent = computed(() => props.spatialdata);
    const selectedTixelsFromParent = computed(() => props.selected_tixels);
    const selectedTixelIndexFromParent = computed(() => props.selected_tixel_index);
    const clusterItems = ref<any[] | null>(null);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const konvaConfig = ref<any>({ x: 0, y: 0, width, height, draggable: true });
    const scale = ref<number>(0.95);
    const currentViewType = ref<any>(props.presentation);
    const isClusterView = ref(true);
    const isSummation = ref(true);
    const isHighlighted = ref(false);
    const highlightedSpatial = ref<any[]>([]);
    const lowestCount = ref<number>(10000);
    const highestCount = ref<number>(0);
    const highlightedCluster = ref<any>();
    const highlightedClusterFromParent = computed(() => props.highlighted_cluster);
    const topHeaders = ref<any[]>([]);
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
    const gradientColors = ref<string[]>([]);
    const stepArray = ref<any[]>([]);
    const autocompleteLoading = ref(false);
    const progressMessage = ref<string | null>(null);
    const geneNames = ref<any[]>([]);
    const toggleExclusive = ref<number | null>(null);
    const isDrawing = ref<boolean>(false);
    const isClicked = ref<boolean>(false);
    const isLocked = ref<boolean>(true);
    const polygon = ref<any>({ x: 0, y: 0, points: [], opacity: 0.8, closed: true, fill: 'white', stroke: 'white', strokeWidth: 1 });
    const regions = ref<any[]>([]);
    const selectedTixels = ref<boolean[]>(props.selected_tixels);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    function resetPolygon() {
      polygon.value.points = [];
    }
    function setDraggable(flag: boolean) {
      konvaConfig.value.draggable = flag;
    }
    async function fitStageToParent() {
      const parent = document.querySelector('#stageParent');
      if (!parent) return;
      const parentWidth = (parent as any).offsetWidth * 0.99;
      const parentHeight = (parent as any).offsetHeight * 0.99;
      konvaConfig.value.width = parentWidth;
      konvaConfig.value.height = parentWidth;
    }
    function remove(item: any) {
      const newArr = selectedGenes.value.filter((x: any) => x !== item.name);
      selectedGenes.value = newArr;
    }
    function highlightRegion(tixels: boolean[] | null = null) {
      // let filteredIndex = [];
      if (!tixels) {
        const funcInsideRegions = (pt: number[]) => {
          let res = false;
          regions.value.forEach((poly: any, idx: number) => {
            if (pointInPolygon(pt, splitarray(poly.points, 2))) res = true;
          });
          return res;
        };
        selectedTixels.value = circlesSpatial.value.map((v: any) => funcInsideRegions([v.x, v.y]));
        const hitCount = selectedTixels.value.filter((x: boolean) => x).length;
        if (hitCount < 1) {
          // unHighlighCluster();
          return;
        }
      } else {
        selectedTixels.value = tixels;
      }
      lodash.each(selectedTixels.value, (v: boolean, idx: number) => {
        if (!v) {
          circlesSpatial.value[idx].fill = circlesSpatial.value[idx].originalColor;
          circlesSpatial.value[idx].stroke = circlesSpatial.value[idx].originalColor;
        } else {
          circlesSpatial.value[idx].fill = 'white';
          circlesSpatial.value[idx].stroke = 'white';
        }
      });
      ctx.emit('regionUpdated', selectedTixels.value);
    }
    function unHighlighCluster() {
      lodash.each(circlesSpatial.value, (c: any, i: number) => {
        circlesSpatial.value[i].fill = c.originalColor;
        circlesSpatial.value[i].stroke = c.originalColor;
      });
      highlightedCluster.value = '';
      ctx.emit('cluster-highlighted', null);
      highlightRegion(selectedTixels.value);
    }
    function highlightCluster(clusterName: string) {
      lodash.each(circlesSpatial.value, (c: any, i: number) => {
        if (c.cluster !== clusterName) {
          circlesSpatial.value[i].fill = inactiveColor.value;
          circlesSpatial.value[i].stroke = inactiveColor.value;
        } else {
          circlesSpatial.value[i].fill = c.originalColor;
          circlesSpatial.value[i].stroke = c.originalColor;
        }
      });
      highlightedCluster.value = clusterName;
      isHighlighted.value = true;
      ctx.emit('cluster-highlighted', clusterName);
      // highlightRegion(selectedTixels.value);
    }
    function makearray(stopValue: number, startValue: number) {
      if (highestCount.value === 0) return;
      const arr = [];
      const steps = 6;
      const step = (stopValue - startValue) / (steps - 1);
      for (let i = 0; i < steps; i += 1) {
        arr.push(Math.round((startValue + (step * i)) * 10) / 10);
      }
      stepArray.value = arr;
    }
    async function updateCircles() {
      if (!spatialData.value) return;
      isHighlighted.value = false;
      const geneSum = spatialData.value.genes_summation;
      const circles: any[] = [];
      const numClusters = lodash.uniq(spatialData.value.clusters).length;
      const colors_raw = colormap({ colormap: heatMap.value, nshades: (numClusters + 1) * 3, format: 'hex', alpha: 1 });
      const colors: any[] = [];
      colors_raw.forEach((v: any, i: number) => {
        if ((i % 3) === 0) colors.push(v);
      });
      clusterColors.value = colors;
      const colors_intensity = colormap({ colormap: heatMap.value, nshades: 64, format: 'hex', alpha: 1 });
      const spatialCoord = (currentViewType.value !== 'umap') ? spatialData.value.coordinates : spatialData.value.coordinates_umap.map((v: number[]) => ([v[0], -v[1]]));
      const minX = Math.min(...spatialCoord.map((a: number[]) => a[0]));
      const minY = Math.min(...spatialCoord.map((a: number[]) => a[1]));
      const maxX = Math.max(...spatialCoord.map((a: number[]) => a[0]));
      const maxY = Math.max(...spatialCoord.map((a: number[]) => a[1]));
      const { width: stageWidth, height: stageHeight } = konvaConfig.value;
      const viewScale = Math.min(stageWidth / (maxX - minX), stageHeight / (maxY - minY));
      const [paddingX, paddingY] = [10, 10];
      const radius = (Math.min(stageWidth, stageHeight) / (30 * 5)) * scale.value;
      if (isClusterView.value) {
        lodash.each(spatialData.value.clusters, (v: string, i: number) => {
          const [ax, ay] = spatialCoord[i];
          const x = ax - minX;
          const y = ay - minY;
          const vv = Number(v.replace('C', ''));
          const c = {
            id: get_uuid(),
            x: x * scale.value * viewScale + paddingX,
            y: y * scale.value * viewScale + paddingY,
            radius,
            originalColor: colors[vv],
            fill: colors[vv],
            stroke: colors[vv],
            strokeWidth: 1.0,
            cluster: v,
            total: geneSum[i],
            inactive: false,
            index: i,
            genes: { },
          };
          lodash.forIn(spatialData.value.genes, (val: number[], k: string) => {
            (c.genes as any)[k] = val[i];
          });
          circles.push(c);
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
          const rd = (geneSum[i] > 0) ? 1 : 1;
          highestCount.value = geneSum[i] > highestCount.value ? geneSum[i] : highestCount.value;
          lowestCount.value = geneSum[i] < lowestCount.value ? geneSum[i] : lowestCount.value;
          const c = {
            id: get_uuid(),
            x: x * scale.value * viewScale + paddingY,
            y: y * scale.value * viewScale + paddingY,
            radius,
            originalColor: clr,
            fill: clr,
            stroke: clr,
            strokeWidth: 1.0,
            cluster: v,
            total: geneSum[i],
            inactive: false,
            index: i,
            genes: { },
          };
          lodash.forIn(spatialData.value.genes, (val: number[], k: string) => {
            (c.genes as any)[k] = val[i];
          });
          makearray(highestCount.value, lowestCount.value);
          circles.push(c);
        });
      }
      circlesSpatial.value = circles;
      highlightRegion(selectedTixels.value);
    }
    async function loadExpressions() {
      if (!client.value) return;
      if (!selectedFiles.value) return;
      const resp = props.query.public ? await client.value.getGeneExpressionsByToken(selectedFiles.value) : await client.value.getGeneExpressions(selectedFiles.value);
      genes.value = resp.map((v: string) => ({ name: v }));
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
        if (workerRequired) {
          await loadExpressions();
          const task = currentTask.value;
          const queue = currentQueue.value;
          const args = [selectedFiles.value, selectedGenes.value, []];
          if (!props.query.public) {
            const { encoded: filenameToken } = await client.value.encodeLink({ args: [selectedFiles.value], meta: { run_id: currentRunId.value } });
            const { host } = window.location;
            publicLink.value = `https://${host}/public?component=PublicGeneViewer&run_id=${filenameToken}&public=true`;
          }
          const kwargs = {};
          const taskObject = props.query.public ? await client.value.postPublicTask(task, args, kwargs, queue) : await client.value.postTask(task, args, kwargs, queue);
          if (props.query.public) runId.value = taskObject.meta.run_id;
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
        } else {
          loading.value = false;
          spatialData.value = props.spatialdata;
          genes.value = props.genelist;
          if (!spatialData.value) return;
        }
        clusterItems.value = lodash.uniq(spatialData.value.cluster_names).map((v: any) => ({ name: v }));
        await updateCircles();
        await fitStageToParent();
        loading.value = false;
      } catch (error) {
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: error, options: { right: true, color: 'error' } });
      } finally {
        loading.value = false;
      }
    }
    function resetScaleAndPos(ev: any) {
      const stage = (ctx as any).refs.konvaStage.getNode();
      const newPos = { x: 0, y: 0 };
      stage.position(newPos);
      scale.value = 0.95;
    }
    function onResize() {
      fitStageToParent();
      updateCircles();
    }
    async function mouseMoveOnSpatial(ev: any) {
      const mousePos = (ctx as any).refs.konvaStage.getNode().getRelativePointerPosition();
      const item = ev.target.attrs;
      tooltip.position({
        x: item.x,
        y: item.y,
      });
      let text = `Cluster: ${item.cluster}`;
      if (item.total > 0) text = `${text}\nSum: ${item.total}`;
      lodash.forIn(item.genes, (v: number, k: string) => {
        if (v > 0) text = `${text}\n${k}: ${v}`;
      });
      tooltipText.text(text);
      tooltip.show();
      if (isClusterView.value && item.cluster !== highlightedCluster.value && !isDrawing.value) {
        const { cluster } = item;
        highlightCluster(cluster);
      }
      ctx.emit('tixel_selected', item);
    }
    async function showTooltip(idx: number | null) {
      if (!idx) {
        tooltip.hide();
        return;
      }
      const item = circlesSpatial.value[idx];
      tooltip.position({
        x: item.x,
        y: item.y,
      });
      let text = `Cluster: ${item.cluster}`;
      if (item.total > 0) text = `${text}\nSum: ${item.total}`;
      lodash.forIn(item.genes, (v: number, k: string) => {
        if (v > 0) text = `${text}\n${k}: ${v}`;
      });
      tooltipText.text(text);
      tooltip.show();
    }
    async function mouseOutOnSpatial(ev: any) {
      isHighlighted.value = false;
      tooltip.hide();
      ctx.emit('tixel_selected', null);
      if (!isDrawing.value) unHighlighCluster();
    }
    // Drawing Region
    function mouseDownOnStage(ev: any) {
      if (isDrawing.value) {
        isClicked.value = true;
        polygon.value = { x: 0, y: 0, id: get_uuid(), points: [], opacity: 0.5, listening: true, closed: true, fill: 'white', stroke: 'white', strokeWidth: 1 };
        const mousePos = (ctx as any).refs.konvaStage.getNode().getRelativePointerPosition();
        polygon.value.points = [];
      }
    }
    function mouseMoveOnStage(ev: any) {
      if (isDrawing.value) {
        if (isClicked.value) {
          const mousePos = (ctx as any).refs.konvaStage.getNode().getRelativePointerPosition();
          polygon.value.points.push(Math.round(mousePos.x));
          polygon.value.points.push(Math.round(mousePos.y));
          (ctx as any).refs.drawingLayer.getNode().batchDraw(); // forced update since due to pointer issue
        }
      }
    }
    function mouseUpOnStage(ev: any) {
      if (isDrawing.value) {
        isClicked.value = false;
        regions.value.push(deepCopy(polygon.value));
        polygon.value.points = [];
        highlightRegion();
      }
    }
    function mouseWheelOnStage(ev: any) {
      if (!isLocked.value) {
        ev.evt.preventDefault();
        const scaleBy = 1.05;
        const stage = (ctx as any).refs.konvaStage.getNode();
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const mousePointTo = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale,
        };
        let direction = ev.evt.deltaY > 0 ? -1 : 1;
        if (ev.evt.ctrlKey) {
          direction = -direction;
        }
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };
        scale.value = newScale;
        stage.position(newPos);
      }
    }
    // Drawing Region ends
    async function mouseOverClusterItem(ev: any) {
      highlightCluster(ev.name);
    }
    function removeRegions(ev: any) {
      regions.value = [];
      polygon.value.points = [];
      selectedTixels.value = selectedTixels.value.map((x: any) => false);
      highlightRegion(selectedTixels.value);
    }
    async function acInputChanged() { // autocomplete input event handler;
      filteredGenes.value = filteredGenes.value.filter((v: any) => selectedGenes.value.includes(v.name));
      searchInput.value = null;
    }
    async function querySelections(v: string) {
      if (!v) return;
      autocompleteLoading.value = true;
      setTimeout(() => {
        filteredGenes.value = genes.value.filter((g: any) => g.name.toLowerCase().startsWith(v.toLowerCase()) || selectedGenes.value.includes(g.name));
        autocompleteLoading.value = false;
      }, 500);
    }
    async function onGenelistChanged(ev: any) {
      isClusterView.value = false;
      // console.log('gene_list_changed');
      // TODO to send signal to the parent
    }
    function onFilesChanged(ev: any) {
      selectedFiles.value = ev;
    }
    async function onSelectFiles(ev: any) {
      fileDialog.value = false;
      selectedGenes.value = [];
      selectedFiles.value = ev;
      runSpatial(true);
    }
    watch(selectedFiles, (v: any) => {
      // console.log(v);
    });
    watch(filename, (v: string) => {
      selectedGenes.value = [];
      selectedFiles.value = v;
      onSelectFiles(v);
      // runSpatial(false);
    });
    watch(currentViewType, (v: any) => {
      updateCircles();
    });
    watch(spatialDataFromParent, (nv: any, ov: any) => {
      spatialData.value = nv;
      // console.log('Parent data changed');
      // console.log(spatialData.value);
      runSpatial(false);
    });
    watch(selectedTixelsFromParent, (v: any) => {
      selectedTixels.value = v;
      highlightRegion(v);
    });
    watch(selectedTixelIndexFromParent, (v: number) => {
      showTooltip(v);
    });
    watch(highlightedClusterFromParent, (v: any) => {
      if (v) {
        highlightCluster(v);
      } else {
        unHighlighCluster();
      }
    });
    watch(scale, (v: number, ov: number) => {
      const stage = (ctx as any).refs.konvaStage.getNode();
      tooltipText.fontSize(15 / scale.value);
      stage.scale({ x: scale.value, y: scale.value });
    });
    watch(isDrawing, (v: boolean) => {
      setDraggable(!v);
      if (!isDrawing.value) unHighlighCluster();
      polygon.value.points = [];
    });
    watch(selectedGenes, (v: any[]) => {
      if (selectedGenes.value.length > 0) {
        runSpatial(true);
        isClusterView.value = false;
      } else {
        isClusterView.value = true;
      }
      updateCircles();
    });
    watch(selectedGenesFromParent, (v: any) => {
      // console.log(v);
      selectedGenes.value = v;
    });
    watch(searchInput, (v: any) => {
      if (v) {
        querySelections(v);
      }
    });
    onMounted(async () => {
      await clientReady;
      tooltip.add(tooltipTag);
      tooltip.add(tooltipText);
      (ctx.refs.annotationLayer as any).getNode().add(tooltip);
      updateCircles();
    });
    return {
      get_uuid,
      scale,
      items,
      headers,
      search,
      selected,
      loading,
      fileDialog,
      acFilename,
      selectedFiles,
      onFilesChanged,
      onSelectFiles,
      clusterHeaders,
      genes,
      selectedGenes,
      searchInput,
      remove,
      konvaConfig,
      circlesSpatial,
      isHighlighted,
      onResize,
      mouseMoveOnSpatial,
      mouseOutOnSpatial,
      currentViewType,
      isClusterView,
      isSummation,
      clusterItems,
      clusterColors,
      inactiveColor,
      backgroundColor,
      updateCircles,
      mouseOverClusterItem,
      autocompleteLoading,
      filteredGenes,
      acInputChanged,
      onGenelistChanged,
      heatMap,
      gradientColors,
      stepArray,
      highestCount,
      lowestCount,
      geneNames,
      isDrawing,
      isLocked,
      toggleExclusive,
      mouseDownOnStage,
      mouseMoveOnStage,
      mouseUpOnStage,
      mouseWheelOnStage,
      polygon,
      regions,
      removeRegions,
      resetScaleAndPos,
      runId,
    };
  },
});
</script>

<style>
</style>
