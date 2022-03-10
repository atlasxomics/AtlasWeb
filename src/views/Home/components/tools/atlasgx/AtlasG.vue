<template>
    <v-container fluid>
      <v-row>
        <v-col cols="12" sm="3">
          <v-card>
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
          <v-card>
            <v-card-title>
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
            <v-combobox
              v-model="backgroundColor"
              dense
              no-details
              :disabled="!spatialData"
              :items="['black',  'white', 'darkgray']"
              label="Background Color"
              />
            <v-combobox
              v-model="inactiveColor"
              dense
              no-details
              :disabled="!spatialData"
              :items="['darkgray',  'transparent', 'black', 'white']"
              label="Inactive Color (gene)"
              @change="updateCircles()"
              />
            <v-combobox
              v-model="heatMap"
              dense
              no-details
              :disabled="!spatialData"
              :items="['jet',  'hot', 'inferno', 'picnic', 'bone']"
              label="Heatmap (gene)"
              @change="updateCircles()"
              />
            <v-combobox
              v-model="clusterColorMap"
              dense
              no-details
              :disabled="!spatialData"
              :items="['jet',  'hot']"
              label="Heatmap (cluster)"
              @change="updateCircles()"
              />
            <v-text-field
              v-model="scale"
              label="Scale"
              type="number"
              :disabled="!spatialData"
              dense
              :readonly="false"
              :step="0.02"
              :min="0.05"
              :max="1.0"
              @input="updateCircles"
              />
            <v-card-text v-if="clusterItems && isClusterView">
              <v-data-table
                height="37vh"
                v-model="selected"
                dense
                :items-per-page="999"
                hide-default-footer
                :loading="loading"
                :items="clusterItems"
                :headers="clusterHeaders"
                sort-by="name"
                @click:row="mouseOverClusterItem"
              >
              <template v-slot:item.name="{ item }">
                <span>{{ item.name }} :</span>
                <v-chip
                  :color="clusterColors[Number(item.name.toString().replace('C', '')) - item.name.toString().split('C').length + 1]"
                  small>{{ item.name }}</v-chip>
              </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="11" sm="7">
          <v-card flat>
            <v-card-title>
              <v-autocomplete
                v-model="selectedGenes"
                :items="filteredGenes"
                :outlined="false"
                multiple
                dense
                clearable
                :allow-overflow="false"
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
                    >Spatial</v-btn>
                  <v-btn
                    color="primary"
                    small
                    text
                    :disabled="!filename"
                    @click="runSpatial('umap')"
                    >UMAP</v-btn>
<!--                   <v-btn
                    color="secondary"
                    small
                    text
                    @click="selectedGenes=[]"
                    >Clear</v-btn> -->
                </template>
              </v-autocomplete>
            </v-card-title>
          </v-card>
          <v-card id="stageParent" v-resize="onResize" :style="{ 'background-color': backgroundColor }">
            <v-stage
              ref="konvaStage"
              class="mainStage"
              :config="konvaConfig"
              >
              <v-layer
                ref="spatialLayer"
                id="spatialLayer">
                <v-circle v-for="p in circlesSpatial"
                  :config="p"
                  v-bind:key="p.id"
                  @mousemove="mouseMoveOnSpatial"
                  @mouseout="mouseOutOnSpatial"/>
              </v-layer>
              <v-layer
                ref="highlightLayer"
                v-if="isHighlighted"
                >
                <v-circle v-for="p in highlightedSpatial"
                  :config="p"
                  v-bind:key="p.id"
                  @mousemove="mouseMoveOnSpatial"
                  @mouseout="mouseOutOnSpatial"/>
              </v-layer>
              <v-layer
                ref="annotationLayer"
                />
            </v-stage>
          </v-card>
          <v-card v-if="clusterItems">
              <v-data-table
                height="37vh"
                dense
                :items-per-page="999"
                hide-default-footer
                :loading="loading"
                :items="geneNames"
                :headers="topHeaders"
              >
              </v-data-table>
          </v-card>
        </v-col>
        <v-template v-if="!isClusterView">
          <v-card flat>
            <div style="padding:5px;">
              <div style="background-image:linear-gradient(to top, rgba(0, 0, 100, 1) 0%, rgba(28, 127, 238, 1) 14%,rgba(47, 201, 226, 1) 28%, rgba(63, 218, 216, 1) 38%, rgba(79, 220, 74, 1) 52%, rgba(208, 222, 33, 1) 65%, rgba(184, 10, 10, 1) 100%, red);width:30px;height:340px;margin-top:100px;float:left;">
              </div>
              <div style="width:40px;float:left;margin-top:100px;height:450px;">
                <p style="position:absolute;top:80px;transform:rotate(-45deg);padding:5px;"> {{stepArray[5]}} </p>
                <p style="position:absolute;top:148px;transform:rotate(-45deg);padding:5px;"> {{stepArray[4]}} </p>
                <p style="position:absolute;top:216px;transform:rotate(-45deg);padding:5px;"> {{stepArray[3]}} </p>
                <p style="position:absolute;top:284px;transform:rotate(-45deg);padding:5px;"> {{stepArray[2]}} </p>
                <p style="position:absolute;top:352px;transform:rotate(-45deg);padding:5px;"> {{stepArray[1]}} </p>
                <p style="position:absolute;top:420px;transform:rotate(-45deg);padding:5px;"> {{stepArray[0]}} </p>
              </div>
            </div>
          </v-card>
        </v-template>
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
    const konvaConfig = ref<any>({ x: 0, y: 0, width, height });
    const scale = ref<number>(0.15);
    const currentViewType = ref<string>('spatial');
    const isClusterView = ref(true);
    const isSummation = ref(true);
    const isHighlighted = ref(false);
    const highlightedSpatial = ref<any[]>([]);
    const highestCount = ref<number>(0);
    const lowestCount = ref<number>(10000);
    const stepArray = ref<any[]>([]);
    const tooltip = new Konva.Text({
      text: '',
      fontFamily: 'Calibri',
      fontSize: 15,
      fontStyle: 'bold',
      padding: 5,
      visible: false,
      fill: 'white',
    });
    const circlesSpatial = ref<any[]>([]);
    const clusterColors = ref<string[]>([]);
    const inactiveColor = ref<string>('darkgray');
    const backgroundColor = ref<string>('black');
    const clusterColorMap = ref<string>('jet');
    const heatMap = ref<string>('jet');
    const autocompleteLoading = ref(false);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    const currentTask = ref<any | null>();
    const progressMessage = ref<string | null>(null);
    const geneNames = ref<any[]>([]);
    const topHeaders = ref<any[]>([]);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
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
      const numClusters = lodash.uniq(spatialData.value.clusters).length;
      const colors = colormap({ colormap: clusterColorMap.value, nshades: numClusters, format: 'hex', alpha: 1 });
      clusterColors.value = colors;
      const colors_intensity = colormap({ colormap: heatMap.value, nshades: 64, format: 'hex', alpha: 1 });
      const t = currentViewType.value;
      const spatialCoord = (t === 'spatial') ? spatialData.value.coordinates : spatialData.value.coordinates_umap;
      const viewScale = (t === 'spatial') ? 1.0 : 200;
      const [paddingX, paddingY] = [100, 100];
      const minX = Math.min(...spatialCoord.map((a: number[]) => a[0]));
      const minY = Math.min(...spatialCoord.map((a: number[]) => a[1]));
      if (isClusterView.value) {
        lodash.each(spatialData.value.clusters, (v: string, i: number) => {
          const [ax, ay] = spatialCoord[i];
          const x = ax - minX;
          const y = ay - minY;
          const c = {
            id: get_uuid(),
            x: x * scale.value * viewScale + paddingX,
            y: y * scale.value * viewScale + paddingY,
            radius: 1 * scale.value * 20,
            fill: colors[Number(v.toString().replace('C', '')) - v.toString().split('C').length + 1],
            stroke: colors[Number(v.toString().replace('C', '')) - v.toString().split('C').length + 1],
            cluster: v,
            total: geneSum[i],
            genes: { },
          };
          lodash.forIn(spatialData.value.genes, (val: number[], k: string) => {
            (c.genes as any)[k] = val[i];
          });
          circles.push(c);
        });
      } else {
        stepArray.value = [];
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
            radius: rd * scale.value * 20,
            fill: clr,
            stroke: clr,
            cluster: v,
            total: geneSum[i],
            genes: { },
          };
          lodash.forIn(spatialData.value.genes, (val: number[], k: string) => {
            (c.genes as any)[k] = val[i];
          });
          circles.push(c);
        });
        makearray(highestCount.value, lowestCount.value);
      }
      circlesSpatial.value = circles;
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
        const args = [filename.value, selectedGenes.value, genes.value];
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
        const geneRank: any[] = [];
        const tableHeaders: any[] = [];
        clusterItems.value = lodash.uniq(spatialData.value.cluster_names).map((v: any) => ({ name: v }));
        tableHeaders.push({ text: 'Rank', value: 'id', sortable: false });
        for (let i = 0; i < clusterItems.value.length; i += 1) {
          tableHeaders.push({ text: clusterItems.value[i].name, value: clusterItems.value[i].name, sortable: false });
        }
        topHeaders.value = tableHeaders;
        lodash.each(spatialData.value.top_ten, (v: string[], i: number) => {
          const tenGenes: {[k: string]: any} = {};
          const key = [];
          const value = [];
          key.push('id');
          value.push(i);
          for (let x = 0; x < clusterItems.value!.length; x += 1) {
            key.push(clusterItems.value![x].name);
            value.push(v[x]);
          }
          for (let j = 0; j < key.length; j += 1) {
            tenGenes[key[j]] = value[j];
          }
          geneRank.push(tenGenes);
        });
        geneNames.value = geneRank;
        await updateCircles();
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
    async function fitStageToParent() {
      const parent = document.querySelector('#stageParent');
      if (!parent) return;
      const parentWidth = (parent as any).offsetWidth;
      const parentHeight = (parent as any).offsetHeight;
      konvaConfig.value = {
        draggable: true,
        width: parentWidth,
        height: parentHeight,
      };
    }
    function onResize() {
      fitStageToParent();
    }
    function highlightCluster(clusterName: string) {
      const highlighted: any[] = [];
      lodash.each(circlesSpatial.value, (c: any) => {
        if (c.cluster !== clusterName) {
          const nc = {
            x: c.x,
            y: c.y,
            radius: c.radius,
            fill: 'gray',
            stroke: 'gray',
            cluster: c.cluster,
            total: c.total,
          };
          highlighted.push(nc);
        }
      });
      highlightedSpatial.value = highlighted;
      isHighlighted.value = true;
    }
    async function mouseMoveOnSpatial(ev: any) {
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
      if (isClusterView.value) {
        const { cluster } = item;
        highlightCluster(cluster);
      }
    }
    async function mouseOutOnSpatial(ev: any) {
      isHighlighted.value = false;
      highlightedSpatial.value = [];
      tooltip.hide();
    }
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
    watch(isClusterView, (v: boolean) => {
      updateCircles();
    });
    watch(selectedGenes, (v: any[]) => {
      runSpatial(currentViewType.value);
      if (selectedGenes.value.length > 0) {
        isClusterView.value = false;
      } else {
        isClusterView.value = true;
      }
    });
    watch(searchInput, (v: any) => {
      if (v) {
        querySelections(v);
      }
    });
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
      fitStageToParent();
      (ctx.refs.annotationLayer as any).getNode().add(tooltip);
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
      konvaConfig,
      circlesSpatial,
      highlightedSpatial,
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
      heatMap,
      clusterColorMap,
      progressMessage,
      selectAction,
      workers,
      candidateWorkers,
      loadCandidateWorkers,
      currentTask,
      highestCount,
      lowestCount,
      makearray,
      stepArray,
      topHeaders,
      geneNames,
    };
  },
});

</script>

<style>

</style>
