<template>
  <v-app>
    <v-container v-if="resolveAuthGroup(['admin','user'])" fluid id="container" :style="{ 'background-color': backgroundColor, 'height': '100%', 'margin': '0', 'width': '100%', 'padding': '0' }">
      <template v-if="query.public">
        <v-app-bar  style="margin-top:-7px">
          <v-tooltip bottom :disabled="metaFlag">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                color="black"
                icon
                class="ml-1"
                medium
                :disabled="!spatialData || loading || !isClusterView || (isDrawing || isDrawingRect)"
                @click="metaFlag = !metaFlag">
                <v-icon>mdi-filter-variant</v-icon>
              </v-btn>
            </template>
            <span>Metadata</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                color="black"
                icon
                class="ml-1"
                medium
                :disabled="!spatialData || loading || !isClusterView || (isDrawing || isDrawingRect)"
                @click="geneMotif = !geneMotif">
                <v-icon>mdi-teamviewer</v-icon>
              </v-btn>
            </template>
            <span>Gene/Motif</span>
          </v-tooltip>
          <v-tooltip :disabled="backgroundFlag" bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  :disabled="!spatialData || loading"
                  v-bind="attrs"
                  v-on="on"
                  class="ml-3"
                  small
                  @click="backgroundFlag = !backgroundFlag">
                <v-icon>mdi-palette</v-icon>
                </v-btn>
              </template>
              <span>Background Color</span>
          </v-tooltip>
          <v-tooltip :disabled="heatmapFlag" bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  :disabled="!spatialData || loading"
                  v-on="on"
                  class="ml-3 mr-3"
                  small
                  @click="heatmapFlag = !heatmapFlag;">
                <v-icon>mdi-fire</v-icon>
                </v-btn>
              </template>
              <span>Heatmap</span>
          </v-tooltip>
          <div id="geneac">
          </div>
          </v-app-bar>
      </template>
      <v-row>
        <v-dialog
          v-if="!query.public && runIdFlag"
          :value="runIdFlag"
          @click:outside="runIdFlag = !runIdFlag"
          hide-overlay>
          <v-card style="width:200px;position: absolute;z-index: 999;top:40px;left:85px;"
            :disabled="loading">
            <v-text-field
              v-model="search"
              :loading="loading"
              style="width: 190px;"
              prepend-icon="mdi-magnify"/>
            <v-data-table
            v-model="selected"
            height="20vh"
            width="20%"
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
        </v-dialog>
        <v-dialog
          :value="backgroundFlag"
          @click:outside="backgroundFlag = !backgroundFlag"
          hide-overlay>
          <v-card style="width:100px;position: absolute;z-index: 999;top:40px;left:210px;">
            <v-data-table
            v-model="selected"
            width="20%"
            dense
            single-select
            hide-default-footer
            hide-default-header
            :disabled="!spatialData || loading"
            :items="backgroundOptions"
            :headers="backgroundHeader"
            @click:row="chooseBackground"
            />
          </v-card>
        </v-dialog>
        <v-dialog
          :value="heatmapFlag"
          @click:outside="heatmapFlag = !heatmapFlag"
          hide-overlay>
          <v-card style="width:100px;position: absolute;z-index: 999;top:40px;left:250px;">
            <v-data-table
            v-model="selected"
            width="20%"
            dense
            single-select
            hide-default-footer
            hide-default-header
            :disabled="!spatialData || loading"
            :items="heatmapOptions"
            :headers="heatmapHeader"
            @click:row="chooseHeatmap"
            />
          </v-card>
        </v-dialog>
        <v-dialog
          v-if="metaFlag"
          :value="metaFlag"
          @click:outside="metaFlag = !metaFlag"
          hide-overlay>
          <v-card style="width:200px;position: absolute;z-index: 999;top:40px;left: 130px;"
              :disabled="loading">
            <v-card-title>
              {{ runId }}
            </v-card-title>
            <v-card-text>
              <v-text-field
                v-model="metadata.species"
                class="bold-disabled"
                dense
                disabled
                outlined
                label="Species">
              </v-text-field>
              <v-text-field
                v-model="metadata.organ"
                class="bold-disabled"
                dense
                outlined
                disabled
                label="Organ">
              </v-text-field>
              <v-text-field
                v-model="metadata.type"
                class="bold-disabled"
                dense
                outlined
                disabled
                label="Type">
              </v-text-field>
            </v-card-text>
          </v-card>
      </v-dialog>
        <v-col cols="2" sm="1">
          <v-card :style="{ 'margin-left': '5px', 'width': '65px', 'min-width': '65px', 'height':'250px', 'padding-top': '15px', 'margin-top': '5px', 'background-color': 'silver' }" flat>
            <v-tooltip right :disabled="isDrawing">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                icon
                class="ml-4"
                v-model="isDrawing"
                :disabled="!spatialData || isDrawingRect || !isClusterView || loading"
                :color="colorOnOff"
                small
                @click="isDrawing = !isDrawing">
                <v-icon>mdi-lasso</v-icon>
              </v-btn>
            </template>
            <span>Lasso Select</span>
            </v-tooltip>
            <v-tooltip right :disabled="isDrawingRect">
            <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              icon
              v-on="on"
              class="ml-4 mt-5"
              v-model="isDrawingRect"
              :disabled="!spatialData || isDrawing || !isClusterView || loading"
              :color="colorOnOffRect"
              small
              @click="isDrawingRect = !isDrawingRect">
              <v-icon>mdi-select</v-icon>
            </v-btn>
            </template>
            <span>Quad Select</span>
            </v-tooltip>
            <v-tooltip right :disabled="isDrawing || isDrawingRect">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="ml-4 mt-5"
                v-model="isDrawing"
                icon
                v-bind="attrs"
                color="black"
                v-on="on"
                :disabled="(!isDrawing && !isDrawingRect) || loading"
                @click="listId = true"
                small>
              <v-icon>mdi-eye</v-icon>
              </v-btn>
            </template>
            <span>View Id's/Genes</span>
            </v-tooltip>
            <v-dialog
              v-model="listId"
              width="600px"
              height="300px">
              <v-card>
                <v-card-title>
                  <span class="text-h5">Tixel Id's Selected</span>
                </v-card-title>
                <v-card-text>
                  {{highlightIds}}
                </v-card-text>
                <v-card-title>
                  <span class="text-h5">Top 10 Genes</span>
                </v-card-title>
                <v-card-text>
                  {{topSelected}}
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="green darken-1"
                    text
                    @click="saveTxt">
                    Save
                  </v-btn>
                  <v-btn
                    color="red"
                    text
                    @click="listId = false">
                    Close
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
            <v-dialog
            v-if="displayFlag"
            :value="displayFlag"
            @click:outside="displayFlag = !displayFlag"
            hide-overlay>
              <v-card style="width:100px;position:absolute;z-index:999;top:210px;left:65px;">
                <v-simple-table>
                  <tbody>
                    <tr><v-btn id="no-background-hover" text x-small @click="captureScreen('null')">Transparent</v-btn></tr>
                    <tr><v-btn id="no-background-hover" text x-small @click="captureScreen(backgroundColor)">Opaque</v-btn></tr>
                  </tbody>
                </v-simple-table>
              </v-card>
            </v-dialog>
            <v-tooltip right :disabled="displayFlag">
            <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              class="ml-4 mt-5"
              icon
              v-model="isDrawing"
              color="black"
              :disabled="!spatialData || loading"
              @click="displayFlag = !displayFlag"
              small>
            <v-icon>mdi-download</v-icon>
            </v-btn>
            </template>
            <span>Save Display</span>
            </v-tooltip>
            <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                icon
                color="black"
                class="ml-4 mt-5"
                small
                v-clipboard:copy="publicLink">
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>
            </template>
            <span>Copy Public Link</span>
            </v-tooltip>
          </v-card>
          <v-card :style="{ 'margin-left': '5px', 'width': '65px', 'min-width': '65px', 'height':'107px', 'padding-top': '15px', 'background-color': 'silver', 'margin-top': '300px' }" flat>
            <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                color="black"
                icon
                class="ml-4"
                :disabled="!spatialData || loading"
                @click="featureTableFlag = true; peakViewerFlag = false"
                small>
                <v-icon>mdi-table-large</v-icon>
              </v-btn>
            </template>
            <span>Feature Table</span>
            </v-tooltip>
            <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                color="black"
                icon
                class="ml-4 mt-5"
                :disabled="!spatialData || loading"
                @click="peakViewerFlag = true; featureTableFlag = false"
                small>
                <v-icon>mdi-chart-bar</v-icon>
              </v-btn>
            </template>
            <span>Peak Viewer</span>
            </v-tooltip>
          </v-card>
        </v-col>
        <v-col cols="12" sm="9" class="mt-5">
          <div id="screenCapture" :style="{ 'background-color': 'transparent' }">
            <atx-atac-viewer
              @loading_value="updateLoading"
              @spatialFlag='updateSpatial'
              @highlightedId='updateSelectors'
              @publicRun='getPublicId'
              :query="{ public: query.public}"
              :filename="filename"
              :genelist="genes"
              :standalone="false"
              :selected_tixels="topSelected"
              :selected_genes="childGenes"
              :background="backgroundColor"
              :heatmap="heatMap"
              :task="'gene.compute_qc'"
              :queue="'atxcloud_gene'"
              :lasso="isDrawing"
              :rect="isDrawingRect"
              ref="mainAtxViewer"
              />
          </div>
            <v-col cols="12" sm="12">
              <v-card class="mt-3" v-show="spatialData && featureTableFlag" :disabled="loading">
                <table-component :loading="loading" :lengthClust="lengthClust" :gene="geneNames" :clusters="topHeaders" v-on:toParent="sendGene"/>
              </v-card>
              <div id="capturePeak" :style="{ 'background-color': 'transparent' }" ref="peakContainer">
                  <v-card class="mt-3" :style="{ visibility: visible }" v-show="spatialData && !loading" v-resize="onResize" ref="peakContainer">
                    <template v-if="!geneMotif">
                      <track-browser ref="trackbrowser" :run_id="runId" :colormap="colorMap" :search_key="trackBrowserGenes[0]"/>
                    </template>
                    <template v-else>
                      <v-card-title>{{(trackBrowserGenes[0] ? trackBrowserGenes[0] : 'Nucleotides')}}</v-card-title>
                      <bar-chart class="mt-3" :style="{ visibility: visible }" v-show="spatialData && !loading" ref="chart" :seqlogo="seqLogoData" :width="widthFromCard" :motif="trackBrowserGenes[0]"/>
                    </template>
                  </v-card>
              </div>
            </v-col>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script lang='ts'>
import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUnmounted } from '@vue/composition-api';
import lodash, { lte } from 'lodash';
import colormap from 'colormap';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { get_uuid, generateRouteByQuery, splitarray, deepCopy } from '@/utils';
import { readCookie, resolveAuthGroup } from '@/utils/auth';
import { Console } from 'console';
import html2canvas from 'html2canvas';
import GeneAutoComplete from './modules/GeneAutoComplete.vue';
import GeneDataTable from './modules/GeneDataTable.vue';
import TrackBrowser from './modules/TrackBrowser.vue';
import AtxAtacViewer from './modules/AtxAtacViewer.vue';
import BarChart from './modules/BarChart.vue';

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
const backgroundHeader = [
  { text: '', value: 'background' },
];
const heatmapHeader = [
  { text: '', value: 'heat' },
];
const backgroundOptions = [
  { background: 'black' },
  { background: 'white' },
  { background: 'darkgrey' },
];
const heatmapOptions = [
  { heat: 'jet' },
  { heat: 'hot' },
  { heat: 'inferno' },
  { heat: 'picnic' },
  { heat: 'bone' },
];
interface Metadata {
  run: string | null;
  type: string | null;
  species: string | null;
  organ: string | null;
}

export default defineComponent({
  name: 'AtlasG',
  components: { 'table-component': GeneDataTable, 'search-component': GeneAutoComplete, TrackBrowser, AtxAtacViewer, BarChart },
  props: ['query'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const workers = computed(() => store.state.client?.workers);
    const candidateWorkers = ref<any[]>([]);
    const filename = ref<string | null>(null);
    const filenameMotif = ref<string | null>(null);
    const runId = ref<string | null>(null);
    const publicLink = ref<string | null>(null);
    const items = ref<any[]>();
    const search = ref<string>();
    const selected = ref<any>();
    const genes = ref<any[]>([]);
    const loading = ref<boolean>(false);
    const selectedGenes = ref<any[]>([]);
    const childGenes = ref<any[]>([]);
    const trackBrowserGenes = ref<any[]>([]);
    const spatialData = ref<any>();
    const clusterItems = ref<any[]>();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const konvaConfigLeft = ref<any>({ x: 0, y: 0, width, height, draggable: true });
    const konvaConfigRight = ref<any>({ x: 0, y: 0, width, height, draggable: true });
    const scale = ref<number>(0.75);
    const scaleUMAP = ref<number>(0.75);
    const isClusterView = ref(true);
    const isSummation = ref(true);
    const isHighlighted = ref(false);
    const highestCount = ref<number>(0);
    const lowestCount = ref<number>(10000);
    const stepArray = ref<any[]>([]);
    const colorBarmap = ref<string>('');
    const metaFlag = ref<boolean>(false);
    // Metadata
    const metadata = ref<Metadata>({
      run: null,
      type: '',
      species: '',
      organ: null,
    });
    const backgroundColor = ref<string>('black');
    const heatMap = ref<string>('jet');
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    const currentTask = ref<any | null>();
    const progressMessage = ref<string | null>(null);
    const geneNames = ref<any[]>([]);
    const topHeaders = ref<any[]>([]);
    const isDrawing = ref<boolean>(false);
    const isDrawingRect = ref<boolean>(false);
    const lengthClust = ref<number>(0);
    const showFlag = ref<boolean[]>([false]);
    const runIdFlag = ref<boolean>(false);
    const backgroundFlag = ref<boolean>(false);
    const heatmapFlag = ref<boolean>(false);
    const autoCompleteFlag = ref<boolean>(false);
    const listId = ref<boolean>(false);
    const lassoSide = ref<string>();
    const colorOnOff = ref<string>('black');
    const colorOnOffRect = ref<string>('black');
    const colorbarText = ref<string>('white');
    const highlightIds = ref<any[]>([]);
    const topSelected = ref<any[]>([]);
    const highlightCount = ref<number>(0);
    const geneButton = ref<any[]>(['']);
    const geneMotif = ref<boolean>(false);
    const featureTableFlag = ref<boolean>(true);
    const peakViewerFlag = ref<boolean>(false);
    const displayFlag = ref<boolean>(false);
    const visible = ref<string>('hidden');
    const spatialRun = ref<boolean>(false);
    const colorMap = ref<any>({});
    const seqLogoData = ref<any>();
    const widthFromCard = ref<number>();
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    function cleanRunId(rid: string) {
      return rid.match('[A-Z]+[0-9]+')![0];
    }
    function setDraggable(flag: boolean) {
      konvaConfigLeft.value.draggable = flag;
      konvaConfigRight.value.draggable = flag;
    }
    function updateLoading(ev: any) {
      loading.value = ev;
    }
    function updateSelectors(ev: any) {
      highlightIds.value = ev;
    }
    function saveTxt() {
      listId.value = false;
      const ids = highlightIds.value.join();
      const listGene = topSelected.value.join();
      const final = `${ids}\n\n${listGene}`;
      const pom = document.createElement('a');
      const blob = new Blob([final], { type: 'text;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      pom.href = url;
      pom.setAttribute('download', `${runId.value}/Selection.txt`);
      pom.click();
    }
    function captureScreen(background: string) {
      const el = document.getElementById('screenCapture')!;
      html2canvas(el, { backgroundColor: background }).then((canvas) => {
        const base64image = canvas.toDataURL('image/png');
        const pom = document.createElement('a');
        pom.href = base64image;
        const listGene = selectedGenes.value.join();
        pom.setAttribute('download', `${runId.value}/${listGene}.png`);
        pom.click();
      });
      if (peakViewerFlag.value) {
        const ele = document.getElementById('capturePeak')!;
        html2canvas(ele, { backgroundColor: background }).then((canvas) => {
          const base64image = canvas.toDataURL('image/png');
          const pom = document.createElement('a');
          pom.href = base64image;
          pom.setAttribute('download', `${runId.value}/peaks.png`);
          pom.click();
        });
      }
    }
    function sendGene(ev: any) {
      if (!selectedGenes.value.includes(ev)) {
        geneButton.value = [ev];
      }
      isClusterView.value = false;
    }
    async function loadExpressions() {
      if (!client.value) return;
      if (!filename.value) return;
      let resp: any;
      if (props.query.public) {
        if (geneMotif.value) {
          resp = await client.value.getGeneExpressionsByToken(filenameMotif.value!);
        } else {
          resp = await client.value.getGeneExpressionsByToken(filename.value);
        }
      } else {
        resp = await client.value.getGeneExpressions(filename.value);
      }
      genes.value = resp.map((v: string) => ({ name: v }));
    }
    function remove(item: any) {
      const newArr = selectedGenes.value.filter((x: any) => x !== item.name);
      selectedGenes.value = newArr;
    }
    function chooseBackground(ev: any) {
      backgroundColor.value = ev.background;
      backgroundFlag.value = false;
    }
    async function updateCircles() {
      if (!spatialData.value) return;
      isHighlighted.value = false;
      stepArray.value = [];
      const numClusters = lodash.uniq(spatialData.value.clusters).length;
      const colors_raw = colormap({ colormap: heatMap.value, nshades: (numClusters) * 3, format: 'hex', alpha: 1 });
      const colors: any[] = [];
      colors_raw.forEach((v: any, i: number) => {
        if ((i % 3) === 0) colors.push(colors_raw[i + 1]);
      });
      const cmap: any = {};
      for (let i = 0; i < colors.length; i += 1) {
        const cidx = `C${i + 1}`;
        cmap[cidx] = colors[i];
      }
      colorMap.value = cmap;
      if (!showFlag.value[0] && !loading.value && !geneMotif.value) {
        (ctx as any).refs.trackbrowser.reload(runId.value!, colorMap.value);
      }
    }
    async function updateSpatial(ev: any) {
      if (ev) {
        spatialData.value = ev;
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
        lengthClust.value = clusterItems.value.length;
        topSelected.value = spatialData.value.top_selected;
      }
      await updateCircles();
    }
    function chooseHeatmap(ev: any) {
      heatMap.value = ev.heat;
      heatmapFlag.value = false;
      if (ev.heat === 'picnic') {
        colorbarText.value = 'black';
      } else if (ev.heat === 'jet' || ev.heat === 'inferno') {
        colorbarText.value = 'white';
      } else if (ev.heat === 'hot') {
        colorbarText.value = 'grey';
      } else {
        colorbarText.value = 'brown';
      }
      updateCircles();
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = props.query.public ? await client.value.getPublicTaskStatus(task_id) : await client.value.getTaskStatus(task_id);
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
      const qc_data = filelist.map((v: string) => ({ id: `${v.split('/')[1]}` }));
      items.value = qc_data;
      loading.value = false;
    }
    async function updateFilename() {
      try {
        if (!props.query.public) {
          if (geneMotif.value) {
            const hold = filename.value;
            filename.value = hold!.replace(/genes/i, 'motifs');
            if (isClusterView.value && (!isDrawing.value && !isDrawingRect.value)) {
              await loadExpressions();
            }
          } else {
            const hold = filename.value;
            filename.value = hold!.replace(/motifs/i, 'genes');
            if (isClusterView.value && (!isDrawing.value && !isDrawingRect.value)) {
              await loadExpressions();
            }
          }
        } else {
          const hold = filename.value;
          const holdMotif = filenameMotif.value;
          if (geneMotif.value) {
            filename.value = holdMotif;
            if (isClusterView.value && (!isDrawing.value && !isDrawingRect.value)) {
              await loadExpressions();
            }
          } else {
            filename.value = hold;
            if (isClusterView.value && (!isDrawing.value && !isDrawingRect.value)) {
              await loadExpressions();
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
    async function runSpatial(stype: string) {
      if (!client.value) return;
      if (!filename.value) return;
      try {
        if (!props.query.public) {
          const existingCookie = readCookie();
          const split = existingCookie?.token.split('JWT ')[1];
          const motifHold = filename.value;
          const { encoded: filenameToken } = await client.value.encodeLink({ args: [motifHold!.replace(/motifs/i, 'genes')], meta: { run_id: runId.value } });
          const { encoded: filenameTokenMotif } = await client.value.encodeLink({ args: [motifHold!.replace(/genes/i, 'motifs')], meta: { run_id: runId.value } });
          const { host } = window.location;
          publicLink.value = `https://${host}/public?component=PublicGeneViewer&run_id=${filenameToken}motif${filenameTokenMotif}&public=true&token=JWT%20${split}`;
        }
      } catch (error) {
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: `${error}`, options: { right: true, color: 'error' } });
      }
    }
    async function seqlogo() {
      const root = 'data';
      const task = 'gene.seq_logo';
      const { queue } = currentTask.value.queues;
      const params = {
        path: `${root}/${runId.value}/h5/obj/${runId.value}motifs.csv`,
        motif: trackBrowserGenes.value[0],
      };
      const args: any[] = [params];
      const kwargs: any = {};
      const taskObject = props.query.public ? await client.value!.postPublicTask(task, args, kwargs, queue) : await client.value!.postTask(task, args, kwargs, queue);
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
      if (taskStatus.value.status !== 'SUCCESS') {
        snackbar.dispatch({ text: 'Worker failed in AtlasGx', options: { right: true, color: 'error' } });
        loading.value = false;
      } else {
        snackbar.dispatch({ text: `Motif ${trackBrowserGenes.value[0]} found`, options: { right: true, color: 'success' } });
        progressMessage.value = taskStatus.value.status;
        const resp = taskStatus.value.result;
        seqLogoData.value = resp;
      }
    }
    async function getMeta() {
      const root = 'data';
      const task = 'creation.create_files';
      const queue = 'creation_worker';
      const params = {
        data: null,
        path: `${root}/${runId.value}`,
        file_type: 'json',
        file_name: 'metadata.json',
      };
      const args: any[] = [params];
      const kwargs: any = {};
      const name = `${root}/${runId.value}/metadata.json`;
      const jsonFileName = { params: { filename: name } };
      const jsonBoolean = await client.value?.getJsonFile(jsonFileName);
      let slimsData: any;
      if (!jsonBoolean) {
        loading.value = true;
        slimsData = await client.value!.getMetadataFromRunId(`${cleanRunId(runId.value!)}`);
        params.data = slimsData;
        const taskObject = await client.value!.postTask(task, args, kwargs, queue);
        await checkTaskStatus(taskObject._id);
        while (taskStatus.value.status !== 'SUCCESS' && taskStatus.value.status !== 'FAILURE') {
          progressMessage.value = `${taskStatus.value.progress}% - ${taskStatus.value.position}`;
          /* eslint-disable no-await-in-loop */
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
        loading.value = false;
      } else {
        slimsData = jsonBoolean;
      }
      loading.value = false;
      metadata.value.organ = slimsData.Organ;
      metadata.value.species = slimsData.Species;
      metadata.value.type = slimsData['Tissue type'];
    }
    async function selectAction(ev: any) {
      const root = 'data';
      if (!props.query.public) {
        const fn = (!geneMotif.value) ? `${root}/${ev.id}/h5/obj/genes.h5ad` : `${root}/${ev.id}/h5/obj/motifs.h5ad`;
        filename.value = fn;
        filenameMotif.value = '';
        runId.value = ev.id;
        pushByQuery({ component: 'AtlasG', run_id: ev.id });
        selectedGenes.value = [];
      }
      await runSpatial('begin');
      await loadExpressions();
      runIdFlag.value = false;
      selectedGenes.value = [];
      isClusterView.value = true;
      isDrawing.value = false;
      isDrawingRect.value = false;
      stepArray.value = [];
      await getMeta();
      updateCircles();
    }
    async function getPublicId(ev: any) {
      runId.value = ev;
      if (props.query) {
        if (props.query.run_id) {
          await selectAction({ id: props.query.run_id });
        }
      }
    }
    function onResize() {
      const parent = (ctx as any).refs.peakContainer;
      if (!parent) return;
      widthFromCard.value = (ctx as any).refs.peakContainer.offsetWidth - 2;
    }
    const GeneAutoCompleteClass = Vue.extend(GeneAutoComplete);
    const acInstance = new GeneAutoCompleteClass({
      vuetify,
      propsData: { gene_list: genes, gene_button: geneButton },
      created() {
        this.$on('changed', (ev: any[]) => {
          selectedGenes.value = ev;
        });
        this.$on('flag', (ev: any) => {
          if (ev) {
            isClusterView.value = false;
            childGenes.value = [];
            selectedGenes.value.forEach((v: string, i: number) => {
              childGenes.value.push(v);
            });
            trackBrowserGenes.value = [selectedGenes.value[selectedGenes.value.length - 1]];
            if (geneMotif) {
              seqlogo();
            }
          }
        });
        this.$on('track', (ev: any) => {
          trackBrowserGenes.value = [ev];
          if (geneMotif) {
            seqlogo();
          }
        });
      },
    });
    watch(peakViewerFlag, (v: any) => {
      if (v) {
        visible.value = 'visible';
      } else {
        visible.value = 'hidden';
      }
    });
    watch(geneMotif, (v: any) => {
      isClusterView.value = true;
      selectedGenes.value = [];
      showFlag.value = [false];
      stepArray.value = [];
      geneButton.value = [];
      childGenes.value = [];
      updateFilename();
    });
    watch(isDrawing, (v: boolean) => {
      setDraggable(!v);
      if (!isDrawing.value) {
        colorOnOff.value = 'black';
      } else {
        colorOnOff.value = 'green';
      }
    });
    watch(isDrawingRect, (v: boolean) => {
      setDraggable(!v);
      if (!isDrawingRect.value) {
        colorOnOffRect.value = 'black';
      } else {
        colorOnOffRect.value = 'green';
      }
    });
    watch(selectedGenes, (v: any[]) => {
      if (selectedGenes.value.length === 0) {
        isClusterView.value = true;
        showFlag.value = [false];
        stepArray.value = [];
        trackBrowserGenes.value = [];
        childGenes.value = [];
      } else {
        isDrawing.value = false;
        isDrawingRect.value = false;
      }
    });
    watch(showFlag, (v: any[]) => {
      const bool = v[0];
      if (!bool) {
        isClusterView.value = true;
        geneButton.value = [];
        spatialRun.value = true;
      }
    });
    const submenu = [
      {
        text: 'Run ID\'s',
        icon: 'mdi-magnify',
        tooltip: 'Run ID\'s',
        disabled: loading.value,
        click: () => {
          runIdFlag.value = !runIdFlag.value;
        },
      },
      {
        text: 'Metadata',
        icon: 'mdi-filter-variant',
        tooltip: 'Metadata',
        disabled: loading.value,
        click: () => {
          metaFlag.value = !metaFlag.value;
        },
      },
      {
        text: 'Gene/Motif',
        icon: 'mdi-teamviewer',
        tooltip: 'Gene/Motif',
        disabled: loading.value,
        click: () => {
          geneMotif.value = !geneMotif.value;
        },
      },
      {
        text: 'Background Color',
        icon: 'mdi-palette',
        tooltip: 'Background Color',
        click: () => {
          backgroundFlag.value = !backgroundFlag.value;
        },
      },
      {
        text: 'Heat Map',
        icon: 'mdi-fire',
        tooltip: 'HeatMap Color',
        click: () => {
          heatmapFlag.value = !heatmapFlag.value;
        },
      },
      {
        type: 'component',
        name: 'GeneAutoComplete',
        id: 'geneac',
        component: acInstance,
      },
    ];
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(submenu);
      if (props.query && !props.query.public) {
        await fetchFileList();
        if (props.query.run_id) {
          // loadCandidateWorkers('AtlasGX');
          currentTask.value = { task: 'gene.compute_qc', queues: ['atxcloud_gene'] };
          await selectAction({ id: props.query.run_id });
        } else {
          currentTask.value = { task: 'gene.compute_qc', queues: ['atxcloud_gene'] };
        }
      }
      if (props.query) {
        if (props.query.run_id && props.query.public) {
          const mid = props.query.run_id.search(/motif/i);
          const end = props.query.run_id.length;
          const fn = props.query.run_id.slice(0, mid);
          const fn2 = props.query.run_id.slice(mid + 5, end);
          filename.value = fn;
          filenameMotif.value = fn2;
        }
      }
      acInstance.$mount('#geneac');
    });
    onUnmounted(() => {
      acInstance.$destroy();
      acInstance.$el.parentNode!.removeChild(acInstance.$el);
      store.commit.setSubmenu(null);
    });
    return {
      scale,
      scaleUMAP,
      filename,
      filenameMotif,
      publicLink,
      items,
      headers,
      search,
      selected,
      loading,
      loadExpressions,
      clusterHeaders,
      backgroundOptions,
      backgroundHeader,
      heatmapHeader,
      heatmapOptions,
      genes,
      selectedGenes,
      remove,
      runSpatial,
      spatialData,
      konvaConfigLeft,
      konvaConfigRight,
      isHighlighted,
      onResize,
      isClusterView,
      isSummation,
      clusterItems,
      backgroundColor,
      updateCircles,
      heatMap,
      progressMessage,
      selectAction,
      workers,
      candidateWorkers,
      currentTask,
      highestCount,
      lowestCount,
      stepArray,
      topHeaders,
      geneNames,
      isDrawing,
      isDrawingRect,
      runId,
      sendGene,
      lengthClust,
      colorBarmap,
      showFlag,
      runIdFlag,
      backgroundFlag,
      chooseBackground,
      chooseHeatmap,
      heatmapFlag,
      lassoSide,
      colorOnOff,
      colorOnOffRect,
      colorbarText,
      highlightIds,
      topSelected,
      listId,
      captureScreen,
      saveTxt,
      highlightCount,
      autoCompleteFlag,
      geneButton,
      geneMotif,
      featureTableFlag,
      peakViewerFlag,
      colorMap,
      spatialRun,
      visible,
      trackBrowserGenes,
      metadata,
      metaFlag,
      displayFlag,
      getMeta,
      cleanRunId,
      childGenes,
      updateLoading,
      updateSpatial,
      updateFilename,
      updateSelectors,
      getPublicId,
      resolveAuthGroup,
      seqlogo,
      seqLogoData,
      widthFromCard,
    };
  },
});
</script>

<style>
  .container {
    padding: 0;
    min-width: 900px;
  }
  .bold-disabled input {
      color: black !important;
  }
  #no-background-hover::before {
   background-color: transparent !important;
  }
  .dalliance.dalliance-root {
    max-height: 800px;
  }
</style>
