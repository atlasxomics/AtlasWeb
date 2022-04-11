<template>
    <v-container fluid>
      <v-row no-gutters>
        <v-col cols="12" sm="12">
          <v-row>
            <v-col cols="12" sm="12">
              <run-id-auto-complete v-model="runId" :filter="'genes.h5ad'" :multiple="false" label="Search Run ID" v-on:changed="onRunIdChanged"/>
              <gene-auto-complete :gene_list="genes" v-on:changed="onSelectedGeneChanged"/>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="12">
              <atx-viewer :query="{ public: false }"
                          :filename="filename"
                          :spatialdata="spatialData"
                          :genelist="genes"
                          :standalone="false"
                          :presentation="'spatial'"
                          :selected_tixels="selectedTixels"
                          :selected_genes="selectedGenes"
                          :highlighted_cluster="highlightedCluster"
                          :selected_tixel_index="selectedTixelIndex"
                          :background="'black'"
                          :heatmap="'jet'"
                          :worker="'gene.compute_qc'"
                          :queue="'atxcloud_gene'"
                          :loadingprop="loading"
                          disable_gene_selection="true"
                          v-on:regionUpdated="onRegionUpdated"
                          v-on:cluster-highlighted="onClusterHighlighted"
                          v-on:tixel_selected="onTixelSelected"
                          ref="mainAtxViewer"
                          />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="12">
              <atx-viewer :query="{ public: false }"
                          :filename="filename"
                          :spatialdata="spatialData"
                          :genelist="genes"
                          :standalone="false"
                          :presentation="'umap'"
                          :selected_tixels="selectedTixels"
                          :selected_genes="selectedGenes"
                          :highlighted_cluster="highlightedCluster"
                          :selected_tixel_index="selectedTixelIndex"
                          :background="'black'"
                          :heatmap="'jet'"
                          :worker="'gene.compute_qc'"
                          :queue="'atxcloud_gene'"
                          :loadingprop="loading"
                          disable_gene_selection="true"
                          v-on:regionUpdated="onRegionUpdated"
                          v-on:cluster-highlighted="onClusterHighlighted"
                          v-on:tixel_selected="onTixelSelected"
                          />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col cols="12" sm="12">
              <track-browser ref="trackbrowser" :run_id="runId" :colormap="colorMap" :search_key="selectedGenes[selectedGenes.length - 1]"/>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
</template>

<script lang='ts'>
import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUnmounted } from '@vue/composition-api';
import Konva from 'konva';
import lodash from 'lodash';
import colormap from 'colormap';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { get_uuid, generateRouteByQuery, splitarray, deepCopy } from '@/utils';
import AtxViewer from './AtxViewer.vue';
import GeneAutoComplete from './GeneAutoComplete.vue';
import RunIdAutoComplete from './RunIdAutoComplete.vue';
import TrackBrowser from './TrackBrowser.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'AtxDualGeneViewer',
  components: { AtxViewer, GeneAutoComplete, RunIdAutoComplete, TrackBrowser },
  props: ['query'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const filename = ref<string | null>(null);
    const currentRunId = ref<string | null>(null);
    const runId = ref<string | null>(null);
    const publicLink = ref<string | null>(null);
    const genes = ref<any[]>([]);
    const filteredGenes = ref<any[]>([]);
    const loading = ref<boolean>(false);
    const selectedGenes = ref<any[]>([]);
    const spatialData = ref<any | null>(null);
    const currentViewType = ref<string>('spatial');
    const isClusterView = ref(true);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    const currentTask = ref<any | null>();
    const progressMessage = ref<string | null>(null);
    const selectedTixels = ref<boolean[]>([]);
    const colorMap = ref<any>({});
    const highlightedCluster = ref<string>();
    const selectedTixelIndex = ref<number | null>(null);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    async function loadExpressions() {
      if (!client.value) return;
      if (!filename.value) return;
      const resp = props.query.public ? await client.value.getGeneExpressionsByToken(filename.value) : await client.value.getGeneExpressions(filename.value);
      genes.value = resp.map((v: string) => ({ name: v }));
      // console.log(genes.value);
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = props.query.public ? await client.value.getPublicTaskStatus(task_id) : await client.value.getTaskStatus(task_id);
    };
    async function runSpatial(stype = 'spatial') {
      if (!client.value) return;
      if (!filename.value) return;
      try {
        progressMessage.value = null;
        loading.value = true;
        await loadExpressions();
        const { task } = currentTask.value;
        const [queue] = currentTask.value.queues;
        const args = [filename.value, selectedGenes.value];
        if (!props.query.public) {
          const { encoded: filenameToken } = await client.value.encodeLink({ args: [filename.value], meta: { run_id: currentRunId.value } });
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
          snackbar.dispatch({ text: 'Worker failed in AtxDualViewer', options: { right: true, color: 'error' } });
          loading.value = false;
          return;
        }
        progressMessage.value = taskStatus.value.status;
        const resp = taskStatus.value.result;
        currentViewType.value = stype;
        spatialData.value = resp;
        const { clusterColors } = (ctx as any).refs.mainAtxViewer;
        const cmap: any = {};
        clusterColors.forEach((x: string, i: number) => {
          const cidx = `C${i + 1}`;
          cmap[cidx] = x;
        });
        colorMap.value = cmap;
        loading.value = false;
        // console.log(colorMap.value);
        // (ctx as any).refs.trackbrowser.reload(runId.value, colorMap.value);
      } catch (error) {
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: error, options: { right: true, color: 'error' } });
      }
    }
    async function onRunIdChanged(ev: any) {
      // console.log(ev);
      if (!ev) return;
      const root = 'data';
      const fn = `${root}/${ev}/h5/obj/genes.h5ad`;
      filename.value = fn;
      currentRunId.value = ev;
      await runSpatial();
      // console.log(spatialData.value);
    }
    async function onGenelistChanged(ev: any) {
      isClusterView.value = false;
      await runSpatial(currentViewType.value);
    }
    // custom events
    function onRegionUpdated(filtIndex: boolean[]) {
      selectedTixels.value = filtIndex;
    }
    async function onSelectedGeneChanged(ev: any) {
      selectedGenes.value = ev;
    }
    async function onClusterHighlighted(ev: any) {
      const clusterName = ev;
      highlightedCluster.value = clusterName;
    }
    async function onTixelSelected(ev: any) {
      if (ev) selectedTixelIndex.value = ev.index;
      else selectedTixelIndex.value = null;
    }
    onMounted(async () => {
      await clientReady;
      if (props.query) {
        if (!props.query.public) {
          currentTask.value = { task: 'gene.compute_qc', queues: ['atxcloud_gene'] };
        } else {
          currentTask.value = { task: 'gene.compute_qc', queues: ['atxcloud_gene'] };
        }
      }
    });
    return {
      filename,
      publicLink,
      loading,
      loadExpressions,
      genes,
      selectedGenes,
      runSpatial,
      spatialData,
      currentViewType,
      onGenelistChanged,
      currentTask,
      selectedTixels,
      onRegionUpdated,
      runId,
      onRunIdChanged,
      onSelectedGeneChanged,
      colorMap,
      onClusterHighlighted,
      highlightedCluster,
      onTixelSelected,
      selectedTixelIndex,
    };
  },
});
</script>

<style>
</style>
