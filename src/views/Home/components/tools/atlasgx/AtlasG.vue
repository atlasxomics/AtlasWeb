<template>
    <v-container fluid>
      <v-row>
        <v-col cols="12" sm="3">
          <v-card
            :disabled="loading">
            <v-text-field
              v-model="search"
              :loading="loading"
              prepend-icon="mdi-magnify"/>
            <v-data-table
            v-model="selected"
            height="20vh"
            width="30%"
            dense
            single-select
            :search="search"
            :loading="loading"
            :items="items"
            :headers="headers"
            sort-by="id"
            @click:row="selectAction"
            />
          </v-card>
          <v-card :disabled="loading">
            <v-card-title>
              <v-text-field
                v-model="filename"
                :loading="loading"
                :messages="progressMessage"
                label="Filename"
              />
              <v-checkbox
                v-model="useCached"
                label="Cached">
              </v-checkbox>
              <v-text-field
                v-model="publicLink"
                label="Public Link"
                :readonly='true'
              >
                <template v-slot:append>
                  <v-btn
                    icon
                    small
                    color="primary"
                    v-clipboard:copy="publicLink"
                    >
                    <v-icon>mdi-content-copy</v-icon>
                  </v-btn>
                </template>
              </v-text-field>
              <v-select
                v-model="currentTask"
                v-if="candidateWorkers"
                :items="candidateWorkers"
                label="Select Worker"
                item-text="task"
                return-object>
              </v-select>
            </v-card-title>
            <v-checkbox
              v-model="isDrawing"
              label="Draw Region"
              dense
              :disabled="!spatialData"
            >
            </v-checkbox>
            <v-checkbox
              v-model="isClusterView"
              label="Cluster"
              dense
              :disabled="!spatialData"
            />
            <v-checkbox
              v-model="isSummation"
              label="Summation"
              dense
              :disabled="true"
            />
            <v-combobox
              v-model="inactiveColor"
              dense
              no-details
              :disabled="!spatialData"
              :items="['darkgray',  'transparent', 'black', 'white']"
              label="Inactive Color"
              @change="updateCircles()"
              />
            <v-combobox
              v-model="backgroundColor"
              dense
              no-details
              :disabled="!spatialData"
              :items="['black',  'white', 'darkgray']"
              label="Background Color"
              />
            <v-combobox
              v-model="heatMap"
              dense
              no-details
              :disabled="!spatialData"
              :items="['jet',  'hot', 'inferno', 'picnic', 'bone']"
              label="Heatmap"
              @change="updateCircles()"
              />
            <v-combobox
              v-model="clusterColorMap"
              dense
              no-details
              :disabled="!spatialData"
              :items="['jet',  'hot', 'inferno', 'picnic']"
              label="Cluster Color Map"
              @change="updateCircles()"
              />
            <v-text-field
              v-model="scale"
              label="Scale"
              type="number"
              :disabled="!spatialData"
              dense
              :readonly="false"
              :step="0.05"
              :min="0.2"
              :max="1.2"
              @input="updateCircles"
              />
            <v-card-text v-if="clusterItems && isClusterView">
              <v-data-table
                height="34vh"
                v-model="selected"
                dense
                :items-per-page="999"
                hide-default-footer
                :items="clusterItems"
                :headers="clusterHeaders"
                sort-by="name"
                @click:row="mouseOverClusterItem"
              >
              <template v-slot:item.name="{ item }">
                <span>{{ item.name }} :</span>
                <v-chip
                  :color="clusterColors[Number(item.name)]"
                  small>{{ item.name }}</v-chip>
              </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="9">
          <v-card flat :disabled="loading">
            <v-card-title>
              <v-autocomplete
                v-model="selectedGenes"
                :items="filteredGenes"
                :outlined="false"
                multiple
                dense
                clearable
                chips
                :cache-items="false"
                color="blue-grey lighten-2"
                item-text="name"
                item-value="name"
                @input="acInputChanged"
                :search-input.sync="searchInput"
                :loading="autocompleteLoading"
                :disabled="!filename"
                small-chips>
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs"
                    :input-value="data.selected"
                    close
                    color="warning"
                    @click="data.select"
                    @click:close="remove(data.item)"
                  >{{ data.item.name }}
                  </v-chip>
                </template>
                <template v-slot:append-outer>
                  <v-btn
                    color="primary"
                    small
                    text
                    :disabled="!filename"
                    @click="runSpatial('spatial')"
                    >Load</v-btn>
                </template>
              </v-autocomplete>
            </v-card-title>
          </v-card>
          <v-row>
            <v-col cols="12" sm="6">
              <v-card id="stageParent"
                      v-resize="onResize"
                      :style="{ 'background-color': backgroundColor, 'overflow-x': 'None' }"
                      height="50vh">
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
                    id="drawingLayer">
                    <v-line
                      :config="polygon"/>
                  </v-layer>
                </v-stage>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card id="stageParentRight"
                  v-resize="onResize"
                  :style="{ 'background-color': backgroundColor, 'overflow-x': 'None' }"
                  height="50vh">
                <v-stage
                  ref="konvaStageRight"
                  class="mainStage"
                  :config="konvaConfigRight"
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
                </v-stage>
              </v-card>
            </v-col>
          </v-row>
          <v-row>
            <v-card>
              <v-card-title>
                Statistics
              </v-card-title>
            </v-card>
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
import { get_uuid, generateRouteByQuery } from '@/utils';

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
  name: 'AtlasG',
  props: ['query'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const workers = computed(() => store.state.client?.workers);
    const candidateWorkers = ref<any[]>([]);
    const filename = ref<string | null>(null);
    const currentRunId = ref<string | null>(null);
    const publicLink = ref<string | null>(null);
    const items = ref<any[]>();
    const search = ref<string>();
    const selected = ref<any>();
    const genes = ref<any[]>([]);
    const filteredGenes = ref<any[]>([]);
    const loading = ref<boolean>(false);
    const selectedGenes = ref<any[]>([]);
    const searchInput = ref<string | null>(null);
    const spatialData = ref<any | null>(null);
    const clusterItems = ref<any[] | null>(null);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const konvaConfigLeft = ref<any>({ x: 0, y: 0, width, height, draggable: true });
    const konvaConfigRight = ref<any>({ x: 0, y: 0, width, height, draggable: true });
    const scale = ref<number>(0.95);
    const currentViewType = ref<string>('spatial');
    const isClusterView = ref(true);
    const isSummation = ref(true);
    const isHighlighted = ref(false);
    const highlightedCluster = ref<any>();
    const tooltip = new Konva.Text({
      text: '',
      fontFamily: 'Calibri',
      fontSize: 15,
      fontStyle: 'bold',
      padding: 5,
      visible: false,
      fill: 'white',
    });
    const tooltipRight = new Konva.Text({
      text: '',
      fontFamily: 'Calibri',
      fontSize: 15,
      fontStyle: 'bold',
      padding: 5,
      visible: false,
      fill: 'white',
    });
    const circlesSpatial = ref<any[]>([]);
    const circlesSpatialUMAP = ref<any[]>([]);
    const clusterColors = ref<string[]>([]);
    const inactiveColor = ref<string>('black');
    const backgroundColor = ref<string>('black');
    const clusterColorMap = ref<string>('jet');
    const heatMap = ref<string>('jet');
    const autocompleteLoading = ref(false);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    const currentTask = ref<any | null>();
    const progressMessage = ref<string | null>(null);
    const useCached = ref<boolean>(true);
    const isDrawing = ref<boolean>(false);
    const isClicked = ref<boolean>(false);
    const polygon = ref<any>({ x: 0, y: 0, points: [], opacity: 0.8, closed: true, fill: 'gray', stroke: 'gray', strokeWidth: 1 });
    // const polygon = ref<any>({ x: 10, y: 10, points: [10, 10, 100, 100, 100, 200], stroke: 'blue' });
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
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
    function loadCandidateWorkers(target: string) {
      if (!workers.value) return;
      candidateWorkers.value = workers.value.filter((x: any) => {
        if (x) {
          if (x.params) {
            if (x.params.target === target) {
              return true;
            }
          }
        }
        return false;
      });
      [currentTask.value] = candidateWorkers.value;
    }
    async function loadExpressions() {
      if (!client.value) return;
      if (!filename.value) return;
      const resp = await client.value.getGeneExpressions(filename.value);
      genes.value = resp.map((v: string) => ({ name: v }));
    }
    function remove(item: any) {
      const newArr = selectedGenes.value.filter((x: any) => x !== item.name);
      selectedGenes.value = newArr;
    }
    async function updateCircles() {
      isHighlighted.value = false;
      const geneSum = spatialData.value.genes_summation;
      const circles: any[] = [];
      const circlesUMAP: any[] = [];
      const numClusters = lodash.uniq(spatialData.value.clusters).length;
      const colors = colormap({ colormap: clusterColorMap.value, nshades: numClusters, format: 'hex', alpha: 1 });
      clusterColors.value = colors;
      const colors_intensity = colormap({ colormap: heatMap.value, nshades: 64, format: 'hex', alpha: 1 });
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
      const viewScale = stageWidth / (maxX - minX);
      const viewScaleUMAP = stageWidth / (maxX_UMAP - minX_UMAP);
      const [paddingX, paddingY] = [10, 10];
      const radius = 5;
      if (isClusterView.value) {
        lodash.each(spatialData.value.clusters, (v: string, i: number) => {
          const [ax, ay] = spatialCoord[i];
          const x = ax - minX;
          const y = ay - minY;
          const c = {
            id: get_uuid(),
            x: x * scale.value * viewScale + paddingX,
            y: y * scale.value * viewScale + paddingY,
            radius: 1 * scale.value * radius,
            originalColor: colors[Number(v)],
            fill: colors[Number(v)],
            stroke: colors[Number(v)],
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
          const c = {
            id: get_uuid(),
            x: x * scale.value * viewScaleUMAP + paddingX,
            y: y * scale.value * viewScaleUMAP + paddingY,
            radius: 1 * scale.value * radius,
            originalColor: colors[Number(v)],
            fill: colors[Number(v)],
            stroke: colors[Number(v)],
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
        const geneColors = colormapBounded(colors_intensity, geneSum);
        lodash.each(spatialData.value.clusters, (v: string, i: number) => {
          const [ax, ay] = spatialCoord[i];
          const x = ax - minX;
          const y = ay - minY;
          const clr = (geneSum[i] > 0) ? geneColors[i] : inactiveColor.value;
          const rd = (geneSum[i] > 0) ? 1 : 1;
          const c = {
            id: get_uuid(),
            x: x * scale.value * viewScale + paddingY,
            y: y * scale.value * viewScale + paddingY,
            radius: rd * scale.value * radius,
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
          const rd = (geneSum[i] > 0) ? 1 : 1;
          const c = {
            id: get_uuid(),
            x: x * scale.value * viewScaleUMAP + paddingY,
            y: y * scale.value * viewScaleUMAP + paddingY,
            radius: rd * scale.value * radius,
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
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
    };
    async function fetchFileList() {
      if (!client.value) {
        return;
      }
      items.value = [];
      search.value = '';
      loading.value = true;
      const fl_payload = { params: { path: 'data', filter: 'obj/genes.h5ad' } };
      const filelist = await client.value.getFileList(fl_payload);
      const qc_data = filelist.map((v: string) => ({ id: v.split('/')[1] }));
      items.value = qc_data;
      loading.value = false;
      // console.log(qc_data);
    }
    async function runSpatial(stype: string) {
      if (!client.value) return;
      if (!filename.value) return;
      try {
        progressMessage.value = null;
        loading.value = true;
        await loadExpressions();
        // console.log(currentRunId.value);
        const { task } = currentTask.value;// 'gene.compute_qc';
        const [queue] = currentTask.value.queues;// 'atxcloud_gene';
        const args = [filename.value, selectedGenes.value, useCached.value];
        const { encoded: filenameToken } = await client.value.encodeLink({ args: [filename.value], meta: { run_id: currentRunId.value } });
        const { host } = window.location;
        publicLink.value = `https://${host}/public?component=PublicGeneViewer&run_id=${filenameToken}`;
        const kwargs = {};
        const taskObject = await client.value.postTask(task, args, kwargs, queue);
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
          snackbar.dispatch({ text: 'Worker failed', options: { right: true, color: 'error' } });
          loading.value = false;
          return;
        }
        progressMessage.value = taskStatus.value.status;
        const resp = taskStatus.value.result;
        currentViewType.value = stype;
        spatialData.value = resp;
        // console.log(spatialData.value);
        clusterItems.value = lodash.uniq(spatialData.value.clusters).map((v: any) => ({ name: v }));
        await updateCircles();
        await fitStageToParent();
        loading.value = false;
      } catch (error) {
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: error, options: { right: true, color: 'error' } });
      }
    }
    async function selectAction(ev: any) {
      const root = 'data';
      const fn = `${root}/${ev.id}/h5/obj/genes.h5ad`;
      filename.value = fn;
      currentRunId.value = ev.id;
      pushByQuery({ component: 'AtlasG', run_id: ev.id });
      await runSpatial(currentViewType.value);
    }
    function onResize() {
      fitStageToParent();
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
    function highlightCluster(clusterName: string) {
      lodash.each(circlesSpatial.value, (c: any, i: number) => {
        if (c.cluster !== clusterName) {
          circlesSpatial.value[i].fill = inactiveColor.value;
        } else {
          circlesSpatial.value[i].fill = c.originalColor;
          circlesSpatial.value[i].stroke = c.originalColor;
        }
      });
      lodash.each(circlesSpatialUMAP.value, (c: any, i: number) => {
        if (c.cluster !== clusterName) {
          circlesSpatialUMAP.value[i].fill = inactiveColor.value;
        } else {
          circlesSpatialUMAP.value[i].fill = c.originalColor;
          circlesSpatialUMAP.value[i].stroke = c.originalColor;
        }
      });
      highlightedCluster.value = clusterName;
      isHighlighted.value = true;
    }
    async function mouseMoveOnSpatial(ev: any) {
      if (isDrawing.value) return;
      const mousePos = (ctx as any).refs.konvaStage.getNode().getRelativePointerPosition();
      tooltip.position({
        x: mousePos.x + 5,
        y: mousePos.y + 5,
      });
      const item = ev.target.attrs;
      let text = `Cluster: ${item.cluster}`;
      if (item.total > 0) text = `${text}\nSum: ${item.total}`;
      lodash.forIn(item.genes, (v: number, k: string) => {
        if (v > 0) text = `${text}\n${k}: ${v}`;
      });
      tooltip.text(text);
      tooltip.show();
      if (isClusterView.value && item.cluster !== highlightedCluster.value) {
        const { cluster } = item;
        highlightCluster(cluster);
      }
    }
    async function mouseOutOnSpatial(ev: any) {
      if (isDrawing.value) return;
      isHighlighted.value = false;
      tooltip.hide();
      tooltipRight.hide();
      unHighlighCluster();
    }
    async function mouseMoveOnSpatialRight(ev: any) {
      if (isDrawing.value) return;
      const mousePosRight = (ctx as any).refs.konvaStageRight.getNode().getRelativePointerPosition();
      tooltipRight.position({
        x: mousePosRight.x + 5,
        y: mousePosRight.y + 5,
      });
      const item = ev.target.attrs;
      let text = `Cluster: ${item.cluster}`;
      if (item.total > 0) text = `${text}\nSum: ${item.total}`;
      lodash.forIn(item.genes, (v: number, k: string) => {
        if (v > 0) text = `${text}\n${k}: ${v}`;
      });
      tooltipRight.text(text);
      tooltipRight.show();
      if (isClusterView.value && item.cluster !== highlightedCluster.value) {
        const { cluster } = item;
        highlightCluster(cluster);
      }
    }
    async function mouseOutOnSpatialRight(ev: any) {
      if (isDrawing.value) return;
      isHighlighted.value = false;
      tooltip.hide();
      tooltipRight.hide();
      unHighlighCluster();
    }
    // Drawing Region
    function mouseDownOnStageLeft(ev: any) {
      if (isDrawing.value) {
        isClicked.value = true;
        const mousePos = (ctx as any).refs.konvaStage.getNode().getRelativePointerPosition();
        // polygon.value.x = Math.round(mousePos.x);
        // polygon.value.y = Math.round(mousePos.y);
        polygon.value.points = [];
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
    }
    function mouseUpOnStageLeft(ev: any) {
      if (isDrawing.value) {
        isClicked.value = false;
      }
    }
    // Drawing Region ends
    async function mouseOverClusterItem(ev: any) {
      highlightCluster(ev.name);
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
    watch(currentTask, (v: any) => {
      runSpatial(currentViewType.value);
    });
    watch(isDrawing, (v: boolean) => {
      setDraggable(!v);
    });
    watch(isClusterView, (v: boolean) => {
      if (isClusterView.value) inactiveColor.value = 'black';
      else inactiveColor.value = 'darkgray';
      updateCircles();
    });
    watch(selectedGenes, (v: any[]) => {
      isClusterView.value = false;
      runSpatial(currentViewType.value);
    });
    watch(searchInput, (v: any) => {
      if (v) querySelections(v);
    });
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
      fitStageToParent();
      (ctx.refs.annotationLayer as any).getNode().add(tooltip);
      (ctx.refs.annotationLayerRight as any).getNode().add(tooltipRight);
      loadCandidateWorkers('AtlasGX');
      await fetchFileList();
      if (props.query) {
        if (props.query.run_id) {
          await selectAction({ id: props.query.run_id });
        }
      }
    });
    return {
      scale,
      filename,
      publicLink,
      items,
      headers,
      search,
      selected,
      loading,
      loadExpressions,
      clusterHeaders,
      genes,
      selectedGenes,
      searchInput,
      remove,
      runSpatial,
      spatialData,
      konvaConfigLeft,
      konvaConfigRight,
      circlesSpatial,
      circlesSpatialUMAP,
      // highlightedSpatial,
      // highlightedSpatialUMAP,
      isHighlighted,
      onResize,
      mouseMoveOnSpatial,
      mouseOutOnSpatial,
      mouseMoveOnSpatialRight,
      mouseOutOnSpatialRight,
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
      heatMap,
      clusterColorMap,
      progressMessage,
      selectAction,
      workers,
      candidateWorkers,
      loadCandidateWorkers,
      currentTask,
      useCached,
      isDrawing,
      mouseDownOnStageLeft,
      mouseMoveOnStageLeft,
      mouseUpOnStageLeft,
      polygon,
    };
  },
});

</script>

<style>

</style>
