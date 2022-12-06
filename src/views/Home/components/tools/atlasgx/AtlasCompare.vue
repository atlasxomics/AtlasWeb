<template>
  <v-app>
    <v-container v-if="resolveAuthGroup(['admin', 'user'])" fluid id="container" :style="{ 'background-color': backgroundColor, 'height': '100%', 'margin': '0', 'width': '100%', 'padding': '0' }">
      <template v-if="query.public">
        <v-app-bar  style="margin-top:-7px">
          <div style="cursor: pointer;">
          <v-img @click="redirectToVisual" width="40px" src="favicon-nobg.png"></v-img>
          </div>
          <v-tooltip bottom :disabled="metaFlag">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                color="black"
                icon
                class="ml-1"
                medium
                :disabled="!spatialData"
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
                class="ml-1"
                medium
                text
                :disabled="!spatialData || assayFlag"
                @click="(geneMotif === 'gene') ? (geneMotif = 'motif') :  (geneMotif = 'gene')">{{geneMotif}}
              </v-btn>
            </template>
            <span>Gene/Motif</span>
          </v-tooltip>
          <v-tooltip :disabled="backgroundFlag" bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  :disabled="!spatialData"
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
                  :disabled="!spatialData"
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
          <v-card style="width:220px;position: absolute;z-index: 999;top:40px;left:85px;"
            :disabled="loading">
            <v-text-field
              v-model="search"
              :loading="loading"
              style="width: 190px;"
              prepend-icon="mdi-magnify"/>
            <v-data-table
            class="thickBorder"
            v-model="selected"
            height="20vh"
            width="20%"
            dense
            single-select
            :search="search"
            :loading="loading"
            :items="items"
            :headers="headers"
            sort-by="id">
            <template v-slot:item="row">
              <tr :style="{ 'background-color': colorForGroups[row.item.group] }">
              <td><v-checkbox color="black" :label="row.item.runID" @click="organizeGroup(row.item.runID)"></v-checkbox></td>
              </tr>
            </template>
            </v-data-table>
            <v-card-actions><v-btn color="red" text small >Clear</v-btn><v-spacer></v-spacer><v-btn @click="startMultiSample" :disabled="selectedGroups.length < 1" text small color="green">Begin</v-btn></v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog
          :value="backgroundFlag"
          @click:outside="backgroundFlag = !backgroundFlag"
          hide-overlay>
          <v-card style="width:100px;position: absolute;z-index: 999;top:40px;left:210px;">
            <v-data-table
            class="thickBorder"
            v-model="selected"
            width="20%"
            dense
            single-select
            hide-default-footer
            hide-default-header
            :disabled="!spatialData"
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
            class="thickBorder"
            v-model="selected"
            width="20%"
            dense
            single-select
            hide-default-footer
            hide-default-header
            :disabled="!spatialData || !isClusterView"
            :items="heatmapOptions"
            :headers="heatmapHeader">
              <template v-slot:item="row">
                <template v-if="row.item['heat'] != 'custom'">
                  <tr @click="chooseHeatmap(row.item['heat'])">
                  <td>{{row.item['heat']}}</td>
                  </tr>
                </template>
                <template v-else>
                  <tr @click="clusterColorFlag = true ; heatmapFlag = false" :style="{ 'pointer-events': isClusterView ? 'auto' : 'none' }">
                    <td>customize</td>
                  </tr>
                </template>
              </template>
            </v-data-table>
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
                :value="metadata.species.replace('_', ' ')"
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
              <v-text-field
                v-model="metadata.runid"
                class="bold-disabled"
                dense
                outlined
                disabled
                label="Run ID">
              </v-text-field>
              <!-- <v-text-field
              v-model="metadata.ngsid"
              class="bold-disabled"
              dense
              outlined
              disabled
              label="NGS ID">
              </v-text-field> -->
            </v-card-text>
          </v-card>
        </v-dialog>
        <v-dialog
          v-if="geneMotifFlag"
          :value="geneMotifFlag"
          @click:outside="geneMotifFlag = !geneMotifFlag"
          hide-overlay>
          <v-card style="width:100px;position: absolute;z-index: 999;top:40px;left:150px;"
            :disabled="loading">
            <v-data-table
            class="thickBorder"
            v-model="selected"
            width="20%"
            dense
            single-select
            hide-default-footer
            hide-default-header
            :items="['Genes', 'Motifs']">
              <template v-slot:item="row">
                <template v-if="row.item == 'Genes'">
                  <tr @click="geneMotif = 'gene'">
                    <td>{{row.item}}</td>
                  </tr>
                </template>
                <template v-if="row.item == 'Motifs'">
                  <tr @click="geneMotif = 'motif'">
                    <td>{{row.item}}</td>
                  </tr>
                </template>
                <template v-if="row.item == 'Features'">
                  <tr @click="geneMotif = 'feat'">
                    <td>{{row.item}}</td>
                  </tr>
                </template>
              </template>
            </v-data-table>
          </v-card>
        </v-dialog>
        <v-col cols="2" sm="1">
          <v-card :style="{ 'margin-left': '5px', 'width': '65px', 'min-width': '65px', 'height':'300px', 'padding-top': '15px', 'margin-top': '5px', 'background-color': 'silver' }" flat>
            <v-tooltip right :disabled="isDrawing">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                icon
                class="ml-4"
                v-model="isDrawing"
                :disabled="!spatialData || isDrawingRect || !isClusterView"
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
              :disabled="!spatialData || isDrawing || !isClusterView"
              :color="colorOnOffRect"
              small
              @click="isDrawingRect = !isDrawingRect">
              <v-icon>mdi-select</v-icon>
            </v-btn>
            </template>
            <span>Rect Select</span>
            </v-tooltip>
            <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="ml-4 mt-5"
                v-model="isDrawing"
                icon
                v-bind="attrs"
                color="black"
                v-on="on"
                :disabled="(!isDrawing && !isDrawingRect)"
                @click="listId = true"
                small>
              <v-icon>mdi-eye</v-icon>
              </v-btn>
            </template>
            <span>View Id's/Genes</span>
            </v-tooltip>
            <v-tooltip right :disabled="displayFlag">
            <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              class="ml-4 mt-5"
              icon
              v-model="isDrawing"
              color="black"
              :disabled="!spatialData"
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
                @click="linkAlert"
                v-clipboard:copy="publicLink">
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>
            </template>
            <span>Copy Public Link</span>
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
            v-if="clusterColorFlag"
            :value="clusterColorFlag"
            :scrollable="true"
            @click:outside="clearClusterColor">
              <v-card style="width:600px; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);z-index: 999; height: 90vh;">
                <v-card-title>Color Configuration</v-card-title>
                <v-card-text>
                  <v-divider/>
                  <div style="width:100%; height:20px"></div>
                  <v-row no-gutters>
                    <v-col cols="12" sm="12" class="d-flex justify-center align-center">
                      <table style="margin-bottom: 0;">
                        <tbody>
                          <tr v-for="(value, cluster) in colorMapCopy" v-bind:key="cluster"><b>{{ cluster }}</b>
                            <td style="padding-left: 50px; vertical-align: top;">
                              <v-tooltip color="black" right>
                              <template v-slot:activator="{ on, attrs }">
                              <v-btn
                              v-on="on"
                              v-bind="attrs"
                              class="round_chip"
                              :color="value"
                              @click="copyToClip(value)"/>
                              </template>
                              <span>{{ value }}</span>
                              </v-tooltip>
                            </td>
                            <td style="padding-left: 80px;">
                              <v-text-field
                              :value="value"
                              class="ma-0 pa-0"
                              clearable
                              @input="checkFieldColor(cluster + $event)"
                              label="Color Choice"/>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </v-col>
                  </v-row>
                </v-card-text>
                <div style="width:100%; height:8px"></div>
                <v-divider />
                <v-card-text>
                  <v-row no-gutters>
                    <v-col cols="12" sm="12" class="d-flex justify-center align-center" style="margin-top: 15px">
                      <v-color-picker value="hex" mode="hexa" hide-mode-switch></v-color-picker>
                    </v-col>
                  </v-row>
                </v-card-text>
                <div style="width:100%; height:20px"></div>
                <v-divider />
                <v-card-text>
                  <v-row no-gutters>
                    <v-col cols="12" sm="12"  class="pt-6" align="right">
                        <v-btn
                        color="red"
                        outlined
                        @click="clearClusterColor">
                        Cancel
                      </v-btn>
                      <v-btn
                        class="pl-5"
                        color="blue"
                        outlined
                        @click="changeClusterColor">
                        Apply
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-dialog>
            <v-dialog
            v-if="displayFlag"
            :value="displayFlag"
            @click:outside="displayFlag = !displayFlag"
            hide-overlay>
              <v-card style="width:100px;position:absolute;z-index:999;top:240px;left:65px;">
                <v-data-table
                class="thickBorder"
                v-model="selected"
                width="20%"
                dense
                single-select
                hide-default-footer
                hide-default-header
                :items="['Transparent', 'Opaque']">
                  <template v-slot:item="row">
                    <template v-if="row.item == 'Transparent'">
                      <tr @click="captureScreen('null')">
                        <td>{{row.item}}</td>
                      </tr>
                    </template>
                    <template v-else>
                      <tr @click="captureScreen(backgroundColor)">
                        <td>{{row.item}}</td>
                      </tr>
                    </template>
                  </template>
                </v-data-table>
              </v-card>
            </v-dialog>
          </v-card>
          <v-card :style="{ 'position': 'sticky', 'margin-left': '5px', 'width': '65px', 'min-width': '65px', 'height':'149px', 'padding-top': '15px', 'background-color': 'silver', 'top': '55vh' }" flat>
            <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                color="black"
                icon
                class="ml-4"
                :disabled="!spatialData"
                @click="featureTableFlag = true; peakViewerFlag = false; histoFlag = false"
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
                :disabled="!spatialData || assayFlag"
                @click="peakViewerFlag = true; featureTableFlag = false; histoFlag = false"
                small>
                <v-icon>mdi-chart-line</v-icon>
              </v-btn>
            </template>
            <span>Peak Viewer</span>
            </v-tooltip>
          </v-card>
        </v-col>
        <v-col cols="12" sm="11" class="mt-5">
          <v-row no-gutters>
            <v-col cols="12" sm="5">
              <multi-singleview
                @loading_value="updateLoading"
                @highlightedId='updateSelectors'
                @totalClust="updateClustTotal"
                @spatialCircleData="updateHistograph"
                @singleCircleData="dataToSingle"
                @sendColorBar="colorBarToSingle"
                @totalGM="loadExpressions"
                :query="{ public: query.public}"
                :filename="filename"
                :standalone="false"
                :selected_tixels="topSelected"
                :selected_genes="childGenes"
                :background="backgroundColor"
                :heatmap="heatMap"
                :manualColor="manualClusterFlag"
                :task="'gene.compute_qc'"
                :queue="'joshua_gene'"
                :lasso="isDrawing"
                :rect="isDrawingRect"
                :clickedCluster="clickedClusterFromChild"
                :checkBoxCluster="selectedClusters"
                :indFlag="averageInd"
                :antiKey="tableKey"
                :geneOmotif="geneMotif"
                :plot="'umap'"
                :idOfRun="runId"/>
            </v-col>
            <v-col cols="12" sm="5">
              <multi-singleview
                @loading_value="updateLoading"
                @highlightedId='updateSelectors'
                @totalClust="updateClustTotal"
                @spatialCircleData="updateHistograph"
                @singleCircleData="dataToSingle"
                @sendColorBar="colorBarToSingle"
                @totalGM="loadExpressions"
                :query="{ public: query.public}"
                :filename="filename"
                :standalone="false"
                :selected_tixels="topSelected"
                :selected_genes="childGenes"
                :background="backgroundColor"
                :heatmap="heatMap"
                :manualColor="manualClusterFlag"
                :task="'gene.compute_qc'"
                :queue="'joshua_gene'"
                :lasso="isDrawing"
                :rect="isDrawingRect"
                :clickedCluster="clickedClusterFromChild"
                :checkBoxCluster="selectedClusters"
                :indFlag="averageInd"
                :antiKey="tableKey"
                :geneOmotif="geneMotif"
                :plot="'spatial'"
                :idOfRun="allRunIds[0]"/>
            </v-col>
            <v-col cols="12" sm="2">
              <table style="margin-bottom: 0; height: 37vh;overflow-y: scroll;display: block;">
                  <tr v-for="(value, cluster) in cellTypeMap" v-bind:key="cluster" :style="{ 'vertical-align': 'middle' }">
                    <template>
                      <td>
                        <v-checkbox @click="unClickCluster(cluster)" :color="colorMap[cluster]" dense :dark="backgroundColor == 'white' ? false : true" input-value="1"/>
                      </td>
                    </template>
                    <template v-if="value.length > 0">
                      <td style="padding-bottom: 8px;">
                        <span :style="{ 'color': (backgroundColor == 'white') ? 'black' : 'white', 'font-weight': 'bold'}">{{value[0]}}&ensp;<span style="font-size:10px"> ({{totalInClust[cluster]}})</span></span>
                      </td>
                    </template>
                    <template v-else>
                      <td style="padding-bottom: 8px;">
                        <span :style="{ 'color': (backgroundColor == 'white') ? 'black' : 'white', 'font-weight': 'bold'}">{{cluster}}&ensp;<span style="font-size:10px"> ({{totalInClust[cluster]}})</span></span>
                      </td>
                    </template>
                  </tr>
              </table>
            </v-col>
          </v-row>
          <v-row no-gutters>
              <v-col cols="12" sm="12">
                <v-row>
                  <template v-for="runs in allRunIds.slice(1)">
                    <v-col cols="12" sm="4" :key="runs">
                      <multi-singleview
                        @loading_value="updateLoading"
                        @highlightedId='updateSelectors'
                        @totalClust="updateClustTotal"
                        @spatialCircleData="updateHistograph"
                        @singleCircleData="dataToSingle"
                        @sendColorBar="colorBarToSingle"
                        @totalGM="loadExpressions"
                        :query="{ public: query.public}"
                        :filename="filename"
                        :standalone="false"
                        :selected_tixels="topSelected"
                        :selected_genes="childGenes"
                        :background="backgroundColor"
                        :heatmap="heatMap"
                        :manualColor="manualClusterFlag"
                        :task="'gene.compute_qc'"
                        :queue="'joshua_gene'"
                        :lasso="isDrawing"
                        :rect="isDrawingRect"
                        :clickedCluster="clickedClusterFromChild"
                        :checkBoxCluster="selectedClusters"
                        :indFlag="averageInd"
                        :antiKey="tableKey"
                        :geneOmotif="geneMotif"
                        :plot="'spatial'"
                        :idOfRun="runs"/>
                    </v-col>
                  </template>
                </v-row>
              </v-col>
            </v-row>
          <v-col cols="12" sm="11">
            <v-card class="mt-3" v-show="featureTableFlag" flat>
              <table-component :loading="loading" :lengthClust="lengthClust" :gene="geneNames" :clusters="topHeaders" :colormap="colorMap" @sentGene="sendGene" @sentCluster="sendCluster"/>
            </v-card>
            <div id="capturePeak" :style="{ visibility: visible }">
              <v-card v-if="!assayFlag" class="mt-3" v-resize="onResize" ref="peakContainer" :disabled="loading" :loading="loading" flat>
                <template v-if="geneMotif == 'gene'">
                    <track-browser ref="trackbrowser" :run_id="runId" :metadata="metadata.species" :search_key="trackBrowserGenes[0]" @loading_value="updateLoading"/>
                </template>
                <template v-if="geneMotif == 'motif'">
                  <v-card-title>{{(trackBrowserGenes[0] ? trackBrowserGenes[0] : 'Please enter motif in search bar to see seqlogo')}}</v-card-title>
                  <bar-chart ref="chart" :seqlogo="seqLogoData" :width="widthFromCard" :motif="trackBrowserGenes[0]"/>
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
import { readCookie, resolveAuthGroup, logout } from '@/utils/auth';
import { Console, table } from 'console';
import html2canvas from 'html2canvas';
import GeneAutoComplete from './modules/GeneAutoComplete.vue';
import GeneDataTable from './modules/GeneDataTable.vue';
import TrackBrowser from './modules/TrackBrowser.vue';
import MultiSingleview from './modules/MultiSingleview.vue';
import BarChart from './modules/BarChart.vue';
import LoadingPage from './modules/LoadingPage.vue';
import HistogramGraph from './modules/HistogramGraph.vue';
import Singleview from './modules/Singleview.vue';

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
  { heat: 'custom' },
];
const colorRules = [
  // (v: any) => !!v || 'Name is required',
  // (v: any) => (v.length > 0 && v.length === 7) || 'Hex Code must have a length of 7',
  (v: any) => (v.startsWith('#')) || 'Must be of Hex Code',
];
interface Metadata {
  type: string | null;
  species: string | null;
  assay: string | null;
  organ: string | null;
  condition: string | null;
  date: string | null;
  runid: string | null;
  ngsid: string | null;
}

export default defineComponent({
  name: 'AtlasXplore',
  components: { 'table-component': GeneDataTable, 'search-component': GeneAutoComplete, TrackBrowser, BarChart, LoadingPage, HistogramGraph, Singleview, MultiSingleview },
  props: ['query'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const workers = computed(() => store.state.client?.workers);
    const globalXploreData = computed(() => store.state.xploreData);
    const candidateWorkers = ref<any[]>([]);
    const filename = ref<string | null>(null);
    const holdMotif = ref<string | null>(null);
    const holdGene = ref<string | null>(null);
    const runId = ref<string | null>(null);
    const publicLink = ref<string | null>(null);
    const items = ref<any>({});
    const search = ref<string>();
    const selected = ref<any>();
    const genes = ref<any[]>([]);
    const loading = ref<boolean>(false);
    const selectedGenes = ref<any[]>([]);
    const childGenes = ref<any[]>([]);
    const trackBrowserGenes = ref<any[]>([]);
    const spatialData = ref<boolean>(false);
    const clusterItems = ref<any[]>([]);
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
    const colorBarmap = ref<string>('');
    const metaFlag = ref<boolean>(false);
    // Metadata
    const metadata = ref<Metadata>({
      type: '',
      species: '',
      assay: '',
      organ: '',
      condition: '',
      date: '',
      runid: '',
      ngsid: '',
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
    const atlasXplore_displayed = ref<boolean>(false);
    const showFlag = ref<boolean[]>([false]);
    const runIdFlag = ref<boolean>(false);
    const collaborator_specific_ids = ref<Set<string> | null>(null);
    const backgroundFlag = ref<boolean>(false);
    const heatmapFlag = ref<boolean>(false);
    const autoCompleteFlag = ref<boolean>(false);
    const geneMotifFlag = ref<boolean>(false);
    const listId = ref<boolean>(false);
    const lassoSide = ref<string>();
    const colorOnOff = ref<string>('black');
    const colorOnOffRect = ref<string>('black');
    const colorbarText = ref<string>('white');
    const highlightIds = ref<any[]>([]);
    const topSelected = ref<any[]>([]);
    const highlightCount = ref<number>(0);
    const geneButton = ref<any[]>(['']);
    const geneMotif = ref<string>('gene');
    const featureTableFlag = ref<boolean>(true);
    const peakViewerFlag = ref<boolean>(false);
    const histoFlag = ref<boolean>(false);
    const displayFlag = ref<boolean>(false);
    const clusterColorFlag = ref<boolean>(false);
    const cellTypeFlag = ref<boolean>(false);
    const visible = ref<string>('hidden');
    const spatialRun = ref<boolean>(false);
    const colorMap = ref<any>({});
    const colorMapCopy = ref<any>({});
    const cellTypeMap = ref<any>({});
    const cellTypeMapCopy = ref<any>({});
    const seqLogoData = ref<any>();
    const widthFromCard = ref<number>();
    const publicSeqlogo = ref<any>();
    const clickedCluster = ref<string>('');
    const userSelectedColor = ref<string>('');
    const manualClusterFlag = ref<boolean>(false);
    const clickedClusterFromChild = ref<any[]>([]);
    const fileContent = ref<any[]>([]);
    const collabData = ref<any[]>([]);
    const collabName = ref<string>('');
    const totalInClust = ref<any>({});
    const selectedClusters = ref<any[]>([]);
    const spatialCircleData = ref<any>({});
    const colorBarFromSibling = ref<any>();
    const singleData = ref<any>();
    const averageInd = ref<boolean>(false);
    const topTenIds = ref<any>({});
    const tableKey = ref<number>(1);
    const assayFlag = ref<boolean>(false);
    const allRunIds = ref<any[]>([]);
    const selectedGroups = ref<any[]>([]);
    const colorForGroups = ref<any>({});
    const clearGroups = ref<boolean[]>([false]);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    function onResize() {
      const parent = (ctx as any).refs.peakContainer;
      if (!parent) return;
      widthFromCard.value = parent.$el.offsetWidth - 2;
    }
    function redirectToVisual() {
      if (client.value!.user! === null) {
        router.push('/visualization');
      } else router.push('/');
    }
    function cleanRunId(rid: string) {
      return rid.match('[A-Z]+[0-9]+')![0];
    }
    function removeZeros(rid: any) {
      if (!rid.includes('D')) {
        return '';
      }
      const go = rid.replace(/D0+/i, 'D');
      return go;
    }
    function setDraggable(flag: boolean) {
      konvaConfigLeft.value.draggable = flag;
      konvaConfigRight.value.draggable = flag;
    }
    function updateLoading(ev: any) {
      loading.value = ev;
    }
    function updateSelectors(ev: any) {
      highlightIds.value = ev.ids;
      topSelected.value = ev.genes;
    }
    function updateHistograph(ev: any) {
      spatialCircleData.value = ev;
    }
    function dataToSingle(ev: any) {
      singleData.value = ev;
    }
    function colorBarToSingle(ev: any) {
      colorBarFromSibling.value = ev;
    }
    function linkAlert() {
      snackbar.dispatch({ text: 'Public link copied to clipboard', options: { left: true, color: 'success' } });
    }
    function copyToClip(ev: any) {
      navigator.clipboard.writeText(ev);
    }
    function organizeGroup(ev: any) {
      if (selectedGroups.value.length === 0) selectedGroups.value.push(ev);
      else if (!selectedGroups.value.includes(ev)) {
        selectedGroups.value.push(ev);
      } else {
        const index = selectedGroups.value.indexOf(ev);
        if (index > -1) selectedGroups.value.splice(index, 1);
      }
      console.log(selectedGroups.value);
    }
    function updateClusterLabel(ev: any) {
      clickedCluster.value = ev;
    }
    function checkFieldColor(ev: any) {
      if (ev.indexOf('#') !== -1) {
        const cluster = ev.split('#')[0];
        const color = ev.split('#')[1];
        let newColor = '#';
        if (color.length >= 6) {
          newColor += color;
          colorMapCopy.value[cluster] = newColor;
        }
      }
    }
    function checkFieldCell(cluster: any, ev: any) {
      const name = typeof ev.srcElement._value !== 'string' ? '' : ev.srcElement._value;
      cellTypeMapCopy.value[cluster] = [name];
    }
    function clearCellType() {
      cellTypeFlag.value = false;
      const defaultCmap: any = {};
      lodash.each(cellTypeMap.value, (value: any, key: any) => {
        defaultCmap[key] = value;
      });
      cellTypeMapCopy.value = defaultCmap;
    }
    function changeCellType() {
      cellTypeFlag.value = false;
      const cell: any = {};
      lodash.each(cellTypeMapCopy.value, (value: any, key: any) => {
        cell[key] = value;
      });
      cellTypeMap.value = cell;
    }
    function unClickCluster(ev: any) {
      if (!selectedClusters.value.includes(ev)) {
        selectedClusters.value.push(ev);
      } else {
        const index = selectedClusters.value.indexOf(ev);
        if (index > -1) selectedClusters.value.splice(index, 1);
      }
    }
    function changeClusterColor() {
      clusterColorFlag.value = false;
      if (colorMap.value !== colorMapCopy.value) {
        manualClusterFlag.value = true;
        const cmap: any = {};
        const heatcmap: any = {};
        lodash.each(colorMapCopy.value, (value: any, key: any) => {
          cmap[key] = value;
          heatcmap[key] = value;
        });
        heatMap.value = heatcmap;
        colorMap.value = cmap;
        if (geneMotif.value === 'gene' && isClusterView.value && !assayFlag.value) {
          loading.value = true;
          (ctx as any).refs.trackbrowser.reload(runId.value, colorMap.value);
          loading.value = false;
        }
      }
    }
    function clearClusterColor() {
      clusterColorFlag.value = false;
      const defaultCmap: any = {};
      lodash.each(colorMap.value, (value: any, key: any) => {
        defaultCmap[key] = value;
      });
      colorMapCopy.value = defaultCmap;
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
      displayFlag.value = false;
      if (!averageInd.value) {
        const el = document.getElementById('screenCapture')!;
        html2canvas(el, { backgroundColor: background }).then((canvas) => {
          const base64image = canvas.toDataURL('image/png');
          const pom = document.createElement('a');
          pom.href = base64image;
          const listGene = childGenes.value.join();
          pom.setAttribute('download', `${runId.value}/${listGene}.png`);
          pom.click();
        });
      } else {
        const el = document.getElementById('screenCaptureSingle')!;
        html2canvas(el, { backgroundColor: background }).then((canvas) => {
          const base64image = canvas.toDataURL('image/png');
          const pom = document.createElement('a');
          pom.href = base64image;
          const listGene = childGenes.value.join();
          pom.setAttribute('download', `${runId.value}/${listGene}_single.png`);
          pom.click();
        });
      }
      if (peakViewerFlag.value) {
        const ele = document.getElementById('capturePeak')!;
        html2canvas(ele, { backgroundColor: background }).then((canvas) => {
          const base64image = canvas.toDataURL('image/png');
          const pom = document.createElement('a');
          pom.href = base64image;
          let end: string;
          if (geneMotif.value === 'motif') {
            end = `${runId.value}_${trackBrowserGenes.value[0]}_seqlogo`;
          } else end = `${runId.value}_${trackBrowserGenes.value[0]}_peaks`;
          pom.setAttribute('download', `${end}.png`);
          pom.click();
        });
      }
      if (histoFlag.value) {
        const ele = document.getElementById('captureHisto')!;
        html2canvas(ele, { backgroundColor: background }).then((canvas) => {
          const base64image = canvas.toDataURL('image/png');
          const pom = document.createElement('a');
          pom.href = base64image;
          const listGeneH = childGenes.value.join();
          pom.setAttribute('download', `${runId.value}/${listGeneH}_histogram.png`);
          pom.click();
        });
      }
    }
    function sendGene(ev: any) {
      if (!selectedGenes.value.includes(ev) && genes.value.length > 0) {
        geneButton.value = [ev];
        isClusterView.value = false;
      }
    }
    function sendCluster(ev: any) {
      if (ev !== 'Anti') clickedClusterFromChild.value = [ev];
      else tableKey.value *= -1;
    }
    async function loadExpressions(ev: any) {
      if (!client.value) return;
      genes.value = ev.map((v: string) => ({ name: v }));
      loading.value = false;
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
      const cmap: any = {};
      const cellmap: any = {};
      const cellmapCopy: any = {};
      const cmapCopy: any = {};
      const colors: any[] = [];
      const numClusters = Object.keys(totalInClust.value).length;
      if (!manualClusterFlag.value) {
        const colors_raw = colormap({ colormap: heatMap.value, nshades: (numClusters) * 3, format: 'hex', alpha: 1 });
        colors_raw.forEach((v: any, i: number) => {
          if ((i % 3) === 0) colors.push(colors_raw[i + 1]);
        });
        for (let i = 0; i < colors.length; i += 1) {
          const cidx = `C${i + 1}`;
          cmap[cidx] = colors[i];
          cmapCopy[cidx] = colors[i];
          cellmap[cidx] = '';
          cellmapCopy[cidx] = '';
        }
        colorMap.value = cmap;
        colorMapCopy.value = cmapCopy;
        if (!('C1' in cellTypeMap.value)) {
          cellTypeMap.value = cellmap;
          cellTypeMapCopy.value = cellmapCopy;
        }
      }
      if (geneMotif.value === 'gene' && isClusterView.value && (!isDrawing.value && !isDrawingRect.value) && !assayFlag.value) {
        (ctx as any).refs.trackbrowser.reload(runId.value, colorMap.value);
      }
    }
    async function updateTable() {
      const geneRank: any[] = [];
      const tableHeaders: any[] = [];
      const clustKeys = Object.keys(totalInClust.value);
      clusterItems.value = clustKeys.map((v: any) => ({ name: v }));
      tableHeaders.push({ text: 'Anti', value: 'id', sortable: false, key: tableKey.value });
      for (let i = 0; i < clusterItems.value.length; i += 1) {
        tableHeaders.push({ text: clusterItems.value[i].name, value: clusterItems.value[i].name, sortable: false });
      }
      topHeaders.value = tableHeaders;
      lodash.each(topTenIds.value[geneMotif.value][tableKey.value], (v: string[], i: number) => {
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
    }
    async function updateSpatial() {
      if (!spatialData.value) {
        loading.value = true;
        spatialData.value = true;
        updateTable();
        await updateCircles();
        onResize();
        loading.value = false;
      }
    }
    function updateClustTotal(ev: any) {
      totalInClust.value = ev;
      selectedClusters.value = Object.keys(totalInClust.value).map((v: any) => v);
      if (Object.keys(topTenIds.value).length > 0) {
        updateSpatial();
      }
    }
    async function updateTen() {
      const fileName = { params: { filename: 'study/S1/h5/topTen_genes.json' } };
      const fileNameMotif = { params: { filename: 'study/S1/h5/topTen_motifs.json' } };
      const topTen_gene_json = await client.value?.getJsonFile(fileName);
      const topTen_motif_json = await client.value?.getJsonFile(fileNameMotif);
      topTenIds.value.gene = topTen_gene_json;
      topTenIds.value.motif = topTen_motif_json;
      spatialData.value = false;
      if (Object.keys(totalInClust.value).length > 1) {
        updateSpatial();
      }
    }
    function chooseHeatmap(ev: any) {
      heatMap.value = ev;
      heatmapFlag.value = false;
      manualClusterFlag.value = false;
      if (ev === 'picnic') {
        colorbarText.value = 'black';
      } else if (ev === 'jet' || ev === 'inferno') {
        colorbarText.value = 'white';
      } else if (ev === 'hot') {
        colorbarText.value = 'grey';
      } else {
        colorbarText.value = 'brown';
      }
      updateCircles();
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
    };
    async function fetchFileList() {
      if (!client.value) {
        return;
      }
      search.value = '';
      loading.value = true;
      const data = { NG00547: 1, NG00877: 1 };
      const mult = (Object.keys(data).length < 9) ? 9 : Object.keys(data).length;
      const colors_raw = colormap({ colormap: 'phase', nshades: mult * 3, format: 'hex', alpha: 1 });
      const colorHolder: any = {};
      const itemHolder: any[] = [];
      let count = 0;
      lodash.each(data, (value: any, key: any) => {
        itemHolder.push({ runID: key, group: value, clicked: false });
        const correct = (count === 0) ? 0 : (count + 1) * 3;
        if (!Object.keys(colorHolder).includes(value)) {
          colorHolder[value] = colors_raw[correct];
          count += 1;
        }
      });
      colorForGroups.value = colorHolder;
      items.value = itemHolder;
      loading.value = false;
    }
    async function updateFilename() {
      if (!spatialData.value) return;
      /* eslint-disable no-lonely-if */
      try {
        if (!props.query.public) {
          if (geneMotif.value === 'motif') {
            const hold = filename.value;
            filename.value = hold!.replace(/genes/i, 'motifs');
          } else {
            const hold = filename.value;
            filename.value = hold!.replace(/motifs/i, 'genes');
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
    async function startMultiSample() {
      allRunIds.value = selectedGroups.value.map((v: any) => v);
      // runId.value = 'study/S1';
      updateTen();
    }
    async function runSpatial(rid = runId.value) {
      if (!client.value) return;
      if (!filename.value) return;
      try {
        if (!props.query.public) {
          const existingCookie = readCookie();
          const split = existingCookie?.token.split('JWT ')[1];
          const geneFileName = `data/${rid}/h5/geneNames.txt`;
          const motifFileName = `data/${rid}/h5/motifNames.txt`;
          const tixelFileName = `data/${rid}/h5/data.csv`;
          const motifHold = filename.value;
          const { encoded: filenameToken } = await client.value.encodeLink({ args: [tixelFileName, geneFileName, motifFileName, motifHold!.replace(/motifs/i, 'genes'), motifHold!.replace(/genes/i, 'motifs'), `data/${runId.value}/h5/obj/motifs.csv`], meta: { run_id: rid, species: metadata.value.species, tissue: metadata.value.organ, assay: metadata.value.assay } });
          const { host } = window.location;
          publicLink.value = `https://${host}/public?component=PublicGeneViewer&run_id=${filenameToken}&public=true&token=JWT%20${split}`;
        }
      } catch (error) {
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: `${error}`, options: { right: true, color: 'error' } });
      }
    }
    async function seqlogo() {
      try {
        const root = 'data';
        const task = 'gene.seq_logo';
        const queue = 'joshua_gene';
        const args = [props.query.public ? filename.value : `${root}/${runId.value}/h5/obj/motifs.csv`, trackBrowserGenes.value[0]];
        const kwargs: any = {};
        const taskObject = props.query.public ? await client.value!.postPublicTask(task, args, kwargs, queue, 5) : await client.value!.postTask(task, args, kwargs, queue);

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
          snackbar.dispatch({ text: 'Worker failed in AtlasXplore', options: { right: true, color: 'error' } });
          loading.value = false;
        } else {
          snackbar.dispatch({ text: `Motif ${trackBrowserGenes.value[0]} found`, options: { right: true, color: 'success' } });
          progressMessage.value = taskStatus.value.status;
          const resp = taskStatus.value.result;
          seqLogoData.value = resp;
        }
      } catch (error) {
        console.log(error);
      }
    }
    async function runCellType(marker: any) {
      if (marker) {
        loading.value = true;
        const task = 'gene.compute_cell_type';
        const queue = 'joshua_gene';
        const args = [filename.value, marker];
        const kwargs = {};
        const taskObject = props.query.public ? await client.value!.postPublicTask(task, args, kwargs, queue, (geneMotif.value === 'gene') ? 3 : 4) : await client.value!.postTask(task, args, kwargs, queue);
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
          snackbar.dispatch({ text: 'Worker failed for CellType', options: { right: true, color: 'error' } });
          loading.value = false;
          return;
        }
        progressMessage.value = taskStatus.value.status;
        const resp = taskStatus.value.result;

        const cell: any = {};
        lodash.each(cellTypeMapCopy.value, (value: any, key: any) => {
          if (Object.keys(resp).includes(key)) {
            cell[key] = resp[key];
          } else cell[key] = ['Undefined'];
        });
        cellTypeMapCopy.value = cell;
        loading.value = false;
      }
    }
    function uploadCellType() {
      const theFile = (ctx as any).refs.file.files[0];
      const reader = new FileReader();
      if (theFile.type.includes('csv')) {
        reader.onload = (res) => {
          fileContent.value = [res.target!.result];
        };
        reader.onerror = (err) => console.log(err);
        reader.readAsText(theFile);
      } else {
        snackbar.dispatch({ text: 'Wrong file type must be csv', options: { right: true, color: 'error' } });
      }
    }
    function resetFile(ev: any) {
      const element = ev.target as HTMLInputElement;
      element.value = '';
    }
    async function getMeta(rid = runId.value) {
      if (!runId.value) return;
      console.log(globalXploreData.value);
      if (globalXploreData.value && globalXploreData.value.results_folder_path.includes(rid)) {
        console.log(globalXploreData.value);
        metadata.value.organ = globalXploreData.value.organ;
        metadata.value.species = globalXploreData.value.species;
        [metadata.value.assay] = globalXploreData.value.assay;
        metadata.value.type = globalXploreData.value.tissue_type;
        metadata.value.runid = globalXploreData.value.run_id;
        // metadata.value.ngsid = rid;
        // collabName.value = (Object.keys(data).includes('tissue_source')) ? data.tissue_source : data.group_name;
        // if (metadata.value.assay === 'wt_dbit-seq') assayFlag.value = true;
      } else {
        // const data = await client.value?.getDBColumns_row('ngs_id', ['species', 'organ_name', 'tissue_source', 'tissue_type', 'assay', 'created_on', 'experimental_condition', 'sample_id'], [runId.value]);
        const d = await client.value?.get_info_from_run_id(runId.value);
        const data = d[0];
        console.log(data);
        metadata.value.organ = data.organ_name;
        metadata.value.species = data.species;
        [metadata.value.date] = data.created_on.split(' ');
        metadata.value.assay = data.assay;
        metadata.value.type = data.tissue_type;
        metadata.value.runid = data.run_id;
        metadata.value.ngsid = data.ngs_id;
        collabName.value = (Object.keys(data).includes('tissue_source')) ? data.tissue_source : data.group_name;
        if (metadata.value.assay === 'wt_dbit-seq') assayFlag.value = true;
      }
    }
    async function selectAction(ev: any) {
      const root = 'data';
      if (!props.query.public) {
        const fn = (geneMotif.value === 'gene') ? `${root}/${ev.id}/h5/obj/genes.h5ad` : `${root}/${ev.id}/h5/obj/motifs.h5ad`;
        filename.value = fn;
        holdMotif.value = '';
        runId.value = ev.id;
        metadata.value.species = '';
        pushByQuery({ component: 'AtlasXplore', run_id: ev.id });
        selectedGenes.value = [];
        featureTableFlag.value = true;
        peakViewerFlag.value = false;
        histoFlag.value = false;
      }
      runIdFlag.value = false;
      selectedGenes.value = [];
      isClusterView.value = true;
      isDrawing.value = false;
      isDrawingRect.value = false;
      heatMap.value = 'jet';
      manualClusterFlag.value = false;
      cellTypeMap.value = {};
      cellTypeMapCopy.value = {};
      tableKey.value = 1;
      spatialData.value = false;
      assayFlag.value = false;
      genes.value = [];
      runSpatial(runId.value);
      getMeta(runId.value);
      updateTen();
    }
    async function loadingPage(collab_name: any) {
      loading.value = true;
      const collab_run_data = await client.value!.getRunsCollaborator(collab_name, true);
      collabData.value = collab_run_data;
      for (let i = 0; i < collabData.value.length; i += 1) {
        const temp_obj = { id: collabData.value[i].ngs_id };
        items.value.push(temp_obj);
      }
    }
    async function getPublicId(ev: any) {
      runId.value = ev.run_id;
      metadata.value.organ = ev.tissue;
      if (ev.assay === 'wt_dbit-seq') assayFlag.value = true;
      metadata.value.species = ev.species;
      updateTen();
      if (props.query && runId.value === null) {
        if (props.query.run_id) {
          await selectAction({ id: props.query.run_id });
        }
      }
    }
    const GeneAutoCompleteClass = Vue.extend(GeneAutoComplete);
    const acInstance = ref<any>(new GeneAutoCompleteClass({
      vuetify,
      propsData: { gene_list: genes, gene_button: geneButton },
      created() {
        this.$on('changed', (ev: any[]) => {
          selectedGenes.value = ev;
        });
        this.$on('avgind', (ev: any) => {
          averageInd.value = ev;
        });
        this.$on('sentgenes', (ev: any) => {
          isClusterView.value = false;
          childGenes.value = [];
          trackBrowserGenes.value = [];
          ev.forEach((v: string, i: number) => {
            childGenes.value.push(v);
          });
          if (ev.length === 1) {
            ev.forEach((v: string, i: number) => {
              trackBrowserGenes.value.push(v);
            });
            if (geneMotif.value === 'motif') {
              seqlogo();
            }
          }
        });
      },
    }));
    watch(peakViewerFlag, (v: any) => {
      if (v) {
        visible.value = 'visible';
      } else {
        visible.value = 'hidden';
      }
    });
    watch(geneMotif, (v: any) => {
      if (!assayFlag.value) {
        if (!props.query.public) {
          const btn = document.getElementById('geneMotifButton')!;
          const span = btn.childNodes[0] as HTMLElement;
          if (v === 'gene') {
            span.innerText = 'GENE';
          } else if (v === 'motif') {
            span.innerText = 'MOTIF';
          }
        }
        genes.value = [];
        featureTableFlag.value = true;
        peakViewerFlag.value = false;
        histoFlag.value = false;
        geneMotifFlag.value = false;
        isClusterView.value = true;
        selectedGenes.value = [];
        showFlag.value = [false];
        geneButton.value = [];
        childGenes.value = [];
        trackBrowserGenes.value = [];
        updateFilename();
        updateTable();
      }
    });
    watch(tableKey, (v: any) => {
      featureTableFlag.value = true;
      peakViewerFlag.value = false;
      histoFlag.value = false;
      geneMotifFlag.value = false;
      isClusterView.value = true;
      selectedGenes.value = [];
      showFlag.value = [false];
      geneButton.value = [];
      childGenes.value = [];
      trackBrowserGenes.value = [];
      updateTable();
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
        trackBrowserGenes.value = [];
        childGenes.value = [];
      } else {
        isDrawing.value = false;
        isDrawingRect.value = false;
      }
    });
    watch(tableKey, (v: any) => {
      featureTableFlag.value = true;
      peakViewerFlag.value = false;
      histoFlag.value = false;
      geneMotifFlag.value = false;
      isClusterView.value = true;
      selectedGenes.value = [];
      showFlag.value = [false];
      geneButton.value = [];
      childGenes.value = [];
      trackBrowserGenes.value = [];
    });
    watch(showFlag, (v: any[]) => {
      const bool = v[0];
      if (!bool) {
        isClusterView.value = true;
        geneButton.value = [];
        spatialRun.value = true;
      }
    });
    watch(clusterColorFlag, (v: any) => {
      if (!v) {
        userSelectedColor.value = '';
        clickedCluster.value = '';
      }
    });
    watch(clearGroups, (v: any) => {
      console.log(v);
    });
    watch(fileContent, (value: any) => {
      const funcInsideFile = (gene: string) => {
        const lower = gene.toLowerCase();
        const stringFormat = lower.charAt(0).toUpperCase() + lower.slice(1);
        return stringFormat;
      };
      const eachLine = value[0].split('\n');
      const listOflines = eachLine.map((s: any) => s.split(','));
      const markerGenes = listOflines.map((s: any[]) => ({ [s[0].replace(/[.\\/#!$%^&*;:{}=_`~()@'"\r\n]/g, '')]: s.slice(1, s.length) }));
      let cleanedArray: any = {};
      cleanedArray = {};
      markerGenes.forEach((v: any[], i: number) => {
        const values = Object.values(v);
        const key = Object.keys(v);
        values.forEach((v2: any, i2: number) => {
          const newArray = v2.filter((gene: string) => gene.length > 1);
          cleanedArray[key[0]] = newArray.map((s: any) => funcInsideFile(s.replace(/[.,\\/#!$%^&*;:{}=_`~()@'"\r\n\s]/g, '')));
        });
      });
      runCellType(cleanedArray);
    });
    const submenu = ref<any[]>([]);
    const list_ids = {
      text: 'Run ID\'s',
      icon: 'mdi-magnify',
      tooltip: 'Run ID\'s',
      enabled: true,
      click: () => {
        runIdFlag.value = !runIdFlag.value;
      },
    };
    const metadata_button = {
      text: 'Metadata',
      icon: 'mdi-filter-variant',
      tooltip: 'Metadata',
      enabled: true,
      disabled: loading.value,
      click: () => {
        metaFlag.value = !metaFlag.value;
      },
    };
    /* eslint-disable no-unused-expressions */
    const gene_motif_button = {
      text: geneMotif.value,
      icon: null,
      tooltip: 'Gene/Motif',
      disabled: loading.value,
      ref: 'geneMotifButton',
      enabled: true,
      click: () => {
        (geneMotif.value === 'gene') ? geneMotif.value = 'motif' : geneMotif.value = 'gene';
      },
    };
    const bg_color_button = {
      text: 'Background Color',
      icon: 'mdi-palette',
      tooltip: 'Background Color',
      enabled: true,
      click: () => {
        backgroundFlag.value = !backgroundFlag.value;
      },
    };
    const heat_map_button = {
      text: 'Heat Map',
      icon: 'mdi-fire',
      tooltip: 'HeatMap Color',
      enabled: true,
      click: () => {
        heatmapFlag.value = !heatmapFlag.value;
      },
    };
    const gene_ac_bar = {
      type: 'component',
      name: 'GeneAutoComplete',
      id: 'geneac',
      enabled: true,
      component: acInstance,
    };
    function prep_sub_menu() {
      submenu.value.push(list_ids, metadata_button, gene_motif_button, bg_color_button, heat_map_button, gene_ac_bar);
    }
    async function prep_atlasxplore(run_id: string, use_specified: boolean) {
      if (submenu.value.length < 1) {
        prep_sub_menu();
        console.log(submenu.value);
      }
      store.commit.setSubmenu(submenu.value);
      if (!props.query.public) {
        await new Promise((f: any) => setTimeout(f, 1000));
        fetchFileList();
        // await selectAction({ id: run_id });
      }
      if (props.query && props.query.run_id && props.query.public) {
        const value = await client.value?.decodeMetadata(props.query.run_id);
        getPublicId(value);
        const fn = props.query.run_id;
        filename.value = fn;
      }
      acInstance.value.$mount('#geneac');
    }

    onMounted(async () => {
      await clientReady;
      // if (resolveAuthGroup(['admin', 'user'])) {
      //   atlasXplore_displayed.value = true;
      prep_atlasxplore(props.query.run_id, false);
      // }
    });
    onUnmounted(() => {
      if (acInstance.value.$el) {
        acInstance.value.$destroy();
        acInstance.value.$el.parentNode!.removeChild(acInstance.value.$el);
        store.commit.setSubmenu(null);
      }
    });
    return {
      resolveAuthGroup,
      scale,
      scaleUMAP,
      filename,
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
      topHeaders,
      geneNames,
      isDrawing,
      isDrawingRect,
      runId,
      sendGene,
      sendCluster,
      lengthClust,
      colorBarmap,
      showFlag,
      runIdFlag,
      backgroundFlag,
      chooseBackground,
      chooseHeatmap,
      heatmapFlag,
      geneMotifFlag,
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
      histoFlag,
      colorMap,
      spatialRun,
      visible,
      trackBrowserGenes,
      metadata,
      metaFlag,
      displayFlag,
      clusterColorFlag,
      cellTypeFlag,
      getMeta,
      cleanRunId,
      childGenes,
      updateLoading,
      updateSpatial,
      updateFilename,
      updateSelectors,
      getPublicId,
      seqlogo,
      publicSeqlogo,
      seqLogoData,
      widthFromCard,
      linkAlert,
      holdGene,
      holdMotif,
      copyToClip,
      updateClusterLabel,
      clickedCluster,
      userSelectedColor,
      colorRules,
      changeClusterColor,
      manualClusterFlag,
      clearClusterColor,
      checkFieldColor,
      checkFieldCell,
      clearCellType,
      changeCellType,
      colorMapCopy,
      clickedClusterFromChild,
      cellTypeMap,
      cellTypeMapCopy,
      uploadCellType,
      fileContent,
      runCellType,
      resetFile,
      loadingPage,
      collabData,
      removeZeros,
      collabName,
      updateClustTotal,
      totalInClust,
      unClickCluster,
      selectedClusters,
      updateHistograph,
      spatialCircleData,
      colorBarToSingle,
      colorBarFromSibling,
      dataToSingle,
      singleData,
      averageInd,
      atlasXplore_displayed,
      collaborator_specific_ids,
      prep_atlasxplore,
      acInstance,
      submenu,
      list_ids,
      metadata_button,
      gene_motif_button,
      bg_color_button,
      heat_map_button,
      gene_ac_bar,
      prep_sub_menu,
      // initializeRun,
      tableKey,
      topTenIds,
      updateTen,
      redirectToVisual,
      assayFlag,
      updateTable,
      logout,
      allRunIds,
      selectedGroups,
      colorForGroups,
      organizeGroup,
      clearGroups,
      startMultiSample,
    };
  },
});
</script>

<style>
</style>
