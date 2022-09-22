<template>
  <v-app>
    <v-container v-if="resolveAuthGroup(['admin', 'user']) || query.public" fluid id="container" :style="{ 'background-color': backgroundColor, 'height': '100%', 'margin': '0', 'width': '100%', 'padding': '0' }">
      <template v-if="query.public">
        <v-app-bar  style="margin-top:-7px">
          <v-btn @click="redirectToLogin" text>Home</v-btn>
          <v-tooltip bottom :disabled="metaFlag">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                color="black"
                icon
                class="ml-1"
                medium
                :disabled="!spatialData || loading"
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
                :disabled="!spatialData || loading"
                @click="(geneMotif === 'gene') ? (geneMotif = 'motif') :  (geneMotif = 'gene')">{{geneMotif}}
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
            class="thickBorder"
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
            class="thickBorder"
            v-model="selected"
            width="20%"
            dense
            single-select
            hide-default-footer
            hide-default-header
            :disabled="!spatialData || loading || !isClusterView"
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
            <v-tooltip right>
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
            v-if="cellTypeFlag"
            :value="cellTypeFlag"
            :scrollable="true"
            @click:outside="cellTypeFlag = !cellTypeFlag">
              <v-card style="width:600px; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);z-index: 999" :loading="loading">
                <v-card-title>Cell Type Configuration</v-card-title>
                <v-card-text>
                  <v-divider/>
                  <div style="width:100%; height:20px"></div>
                  <v-row no-gutters>
                    <v-col cols="12" sm="12" class="d-flex justify-center align-center">
                      <table style="margin-bottom: 0;">
                        <tbody>
                          <tr v-for="(value, cluster) in colorMapCopy" v-bind:key="cluster"><b>{{ cluster }}</b>
                            <td style="padding-left: 50px; vertical-align: top;">
                              <v-btn
                              class="round_chip"
                              :color="value"/>
                            </td>
                            <td style="padding-left: 80px;">
                              <v-text-field
                              :value="cellTypeMapCopy[cluster]"
                              class="ma-0 pa-0"
                              clearable
                              @blur="checkFieldCell(cluster, $event)"
                              label="Cell Type"/>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-card-text>
                  <v-row no-gutters>
                    <v-col cols="12" sm="12"  class="pt-6" align="right">
                        <v-btn
                        color="red"
                        outlined
                        @click="clearCellType">
                        Cancel
                      </v-btn>
                      <input type="file" ref="file" style="display: none" @change="uploadCellType()" @click="resetFile"/>
                      <v-btn
                        class="pl-5"
                        color="green"
                        outlined
                        @click="$refs.file.click()">
                        Upload
                      </v-btn>
                      <v-btn
                        class="pl-5"
                        color="blue"
                        outlined
                        @click="changeCellType">
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
            <v-tooltip right :disabled="cellTypeFlag">
            <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              class="ml-4 mt-5"
              icon
              v-model="isDrawing"
              color="black"
              :disabled="!spatialData || loading"
              @click="cellTypeFlag = !cellTypeFlag"
              small>
            <v-icon>mdi-eyedropper-variant</v-icon>
            </v-btn>
            </template>
            <span>Cell Type</span>
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
                @click="linkAlert"
                v-clipboard:copy="publicLink">
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>
            </template>
            <span>Copy Public Link</span>
            </v-tooltip>
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
                :disabled="!spatialData || loading"
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
                :disabled="!spatialData || loading"
                @click="peakViewerFlag = true; featureTableFlag = false; histoFlag = false"
                small>
                <v-icon>mdi-chart-line</v-icon>
              </v-btn>
            </template>
            <span>Peak Viewer</span>
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
                @click="histoFlag = true; peakViewerFlag = false; featureTableFlag = false"
                small>
                <v-icon>mdi-chart-bar</v-icon>
              </v-btn>
            </template>
            <span>Histogram</span>
            </v-tooltip>
          </v-card>
        </v-col>
        <v-col cols="12" sm="11" class="mt-5">
          <v-row no-gutters>
            <v-col cols="12" sm="10">
              <div id="screenCapture" :style="{ 'background-color': 'transparent' }">
              <atx-atac-viewer
                @loading_value="updateLoading"
                @highlightedId='updateSelectors'
                @publicRun='getPublicId'
                @totalClust="updateClustTotal"
                @spatialCircleData="updateHistograph"
                @singleCircleData="dataToSingle"
                @sendColorBar="colorBarToSingle"
                @totalGM="loadExpressions"
                @topTen="updateTen"
                :query="{ public: query.public}"
                :filename="filename"
                :standalone="false"
                :selected_tixels="topSelected"
                :selected_genes="childGenes"
                :background="backgroundColor"
                :heatmap="heatMap"
                :manualColor="manualClusterFlag"
                :task="'gene.compute_qc'"
                :queue="'atxcloud_gene'"
                :lasso="isDrawing"
                :rect="isDrawingRect"
                :clickedCluster="clickedClusterFromChild"
                :checkBoxCluster="selectedClusters"
                :indFlag="averageInd"
                :geneOmotif="geneMotif"
                :idOfRun="runId"
                ref="mainAtxViewer"/>
            </div>
            </v-col>
            <v-col cols="12" sm="2">
              <table style="margin-bottom: 0;">
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
          <div id="screenCaptureSingle" :style="{ 'background-color': 'transparent' }">
            <v-row no-gutters v-show="averageInd">
              <v-col cols="12" sm="11">
                <v-row>
                  <template v-for="genes in childGenes" >
                    <v-col cols="12" sm="4" :key="genes">
                      <singleview :gene="genes" :circleData="singleData" :heatmap="heatMap" :loadingProp="loading" :colorBar="colorBarFromSibling" :background="backgroundColor"/>
                    </v-col>
                  </template>
                </v-row>
              </v-col>
            </v-row>
          </div>
          <v-col cols="12" sm="11">
            <v-card class="mt-3" v-show="genes.length > 0 && featureTableFlag" :disabled="loading" flat>
              <table-component :loading="loading" :lengthClust="lengthClust" :gene="geneNames" :clusters="topHeaders" :colormap="colorMap" @sentGene="sendGene" @sentCluster="sendCluster"/>
            </v-card>
            <div id="captureHisto">
              <v-card class="mt-3" v-show="genes.length > 0 && histoFlag" flat>
                <histogram-graph v-show="histoFlag" :colorCode="colorMap" :idName="childGenes" :chartData="spatialCircleData"/>
              </v-card>
            </div>
            <div id="capturePeak" :style="{ visibility: visible }">
              <v-card class="mt-3" v-show="genes.length > 0" v-resize="onResize" ref="peakContainer" :disabled="loading" flat>
                <template v-if="geneMotif == 'gene'">
                    <track-browser ref="trackbrowser" :run_id="runId" :search_key="trackBrowserGenes[0]" @loading_value="updateLoading"/>
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
    <loading-page v-if="resolveAuthGroup(['collab']) && !query.public" :listRuns="collabData" :collabName="collabName" :loading="loading"/>
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
}

export default defineComponent({
  name: 'AtlasXplore',
  components: { 'table-component': GeneDataTable, 'search-component': GeneAutoComplete, TrackBrowser, AtxAtacViewer, BarChart, LoadingPage, HistogramGraph, Singleview },
  props: ['query'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const workers = computed(() => store.state.client?.workers);
    const candidateWorkers = ref<any[]>([]);
    const filename = ref<string | null>(null);
    const holdMotif = ref<string | null>(null);
    const holdGene = ref<string | null>(null);
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
      species: 'Mouse',
      assay: 'mRNA',
      organ: null,
      condition: null,
      date: null,
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
    const topTenIds = ref<any>();
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
    function redirectToLogin() {
      router.push('/login');
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
    function updateClusterLabel(ev: any) {
      clickedCluster.value = ev;
    }
    function updateTen(ev: any) {
      topTenIds.value = ev;
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
        if (geneMotif.value === 'gene' && isClusterView.value) {
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
      if (!selectedGenes.value.includes(ev)) {
        geneButton.value = [ev];
      }
      isClusterView.value = false;
    }
    function sendCluster(ev: any) {
      clickedClusterFromChild.value = [ev];
    }
    async function loadExpressions(ev: any) {
      if (!client.value) return;
      if (!spatialData.value) return;
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
      selectedClusters.value = [];
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
          selectedClusters.value.push(cidx);
        }
        colorMap.value = cmap;
        colorMapCopy.value = cmapCopy;
        if (!('C1' in cellTypeMap.value)) {
          cellTypeMap.value = cellmap;
          cellTypeMapCopy.value = cellmapCopy;
        }
      }
      if (geneMotif.value === 'gene' && isClusterView.value && (!isDrawing.value && !isDrawingRect.value)) {
        (ctx as any).refs.trackbrowser.reload(runId.value, colorMap.value);
      }
    }
    async function updateSpatial() {
      if (!spatialData.value) {
        loading.value = true;
        spatialData.value = true;
        const geneRank: any[] = [];
        const tableHeaders: any[] = [];
        const clustMap: any[] = [];
        const clustKeys = Object.keys(totalInClust.value);
        clusterItems.value = clustKeys.map((v: any) => ({ name: v }));
        tableHeaders.push({ text: 'Rank', value: 'id', sortable: false });
        for (let i = 0; i < clusterItems.value.length; i += 1) {
          tableHeaders.push({ text: clusterItems.value[i].name, value: clusterItems.value[i].name, sortable: false });
        }
        topHeaders.value = tableHeaders;
        lodash.each(topTenIds.value, (v: string[], i: number) => {
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
        await updateCircles();
        onResize();
        loading.value = false;
      }
    }
    function updateClustTotal(ev: any) {
      totalInClust.value = ev;
      updateSpatial();
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
      if (!spatialData.value) return;
      spatialData.value = false;
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
        await updateCircles();
      } catch (error) {
        console.log(error);
      }
    }
    async function runSpatial(rid = runId.value) {
      if (!client.value) return;
      if (!filename.value) return;
      try {
        if (!props.query.public) {
          const existingCookie = readCookie();
          const split = existingCookie?.token.split('JWT ')[1];
          const geneFileName = `data/${rid}/gene.csv`;
          const motifFileName = `data/${rid}/motif.csv`;
          const tixelFileName = `data/${rid}/data.csv`;
          const motifHold = filename.value;
          const { encoded: filenameToken } = await client.value.encodeLink({ args: [tixelFileName, geneFileName, motifFileName, motifHold!.replace(/motifs/i, 'genes'), motifHold!.replace(/genes/i, 'motifs'), `data/${runId.value}/h5/obj/motifs.csv`], meta: { run_id: rid } });
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
        const queue = 'atxcloud_gene';
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
        const queue = 'atxcloud_gene';
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
      const root = 'data';
      const task = 'creation.create_files';
      const queue = 'creation_worker';
      const params = {
        data: null,
        path: `${root}/${rid}`,
        file_type: 'json',
        file_name: 'metadata.json',
        bucket_name: 'atx-cloud-dev2',
      };
      const args: any[] = [params];
      const kwargs: any = {};
      const name = `${root}/${rid}/metadata.json`;
      const jsonFileName = { params: { filename: name } };
      const jsonBoolean = await client.value?.getJsonFile(jsonFileName);
      let slimsData: any;
      if (!jsonBoolean) {
        loading.value = true;
        slimsData = await client.value!.getMetadataFromRunId(`${cleanRunId(rid!)}`);
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
      metadata.value.organ = slimsData.cntn_cf_fk_organ;
      metadata.value.species = slimsData.cntn_cf_fk_species;
      metadata.value.type = slimsData.cntn_cf_fk_tissueType;
      metadata.value.assay = slimsData.cntn_cf_fk_workflow;
      [metadata.value.date] = slimsData.sequenced_on.split(' ');
      if (slimsData.cntn_cf_experimentalCondition && slimsData.cntn_cf_sampleId) {
        const beginning = slimsData.cntn_cf_experimentalCondition;
        if (slimsData.cntn_cf_sampleId.includes(beginning)) {
          metadata.value.condition = slimsData.cntn_cf_sampleId;
        } else {
          const ending = `${beginning}-${slimsData.cntn_cf_sampleId}`;
          metadata.value.condition = ending;
        }
      }
      collabName.value = slimsData.cntn_cf_source;
      loading.value = false;
    }
    async function selectAction(ev: any) {
      const root = 'data';
      if (!props.query.public) {
        const fn = (geneMotif.value === 'gene') ? `${root}/${ev.id}/h5/obj/genes.h5ad` : `${root}/${ev.id}/h5/obj/motifs.h5ad`;
        filename.value = fn;
        holdMotif.value = '';
        runId.value = ev.id;
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
      await runSpatial(runId.value);
      await getMeta(runId.value);
    }
    async function loadingPage() {
      loading.value = true;
      const funcInsideLoad = (id: string, checker: any) => {
        let v = false;
        if (id.length > 1) {
          checker.forEach((val: any, i: any) => {
            if (val.includes(id)) {
              v = val;
            }
          });
        }
        return v;
      };
      const val = await client.value!.getRunIdList();
      await fetchFileList();
      if (items.value) {
        const checker = items.value.map((ids: any) => ids.id);
        const matchedRuns: any[] = [];
        val.forEach((value: any, i: any) => {
          const yeah = funcInsideLoad(removeZeros(value['Run Id']), checker);
          if (yeah && !matchedRuns.includes(yeah)) {
            matchedRuns.push(yeah);
          }
        });
        const dataStruct: any[] = [];
        for (let i = 0; i < matchedRuns.length; i += 1) {
          const rid = matchedRuns[i];
          const fn = `data/${rid}/h5/obj/genes.h5ad`;
          filename.value = fn;
          await getMeta(rid);
          await runSpatial(rid);
          const valueHolder = { runId: `${cleanRunId(rid)}`, organ: `${metadata.value.organ}`, species: `${metadata.value.species}`, expcond: `${metadata.value.condition}`, date: `${metadata.value.date}`, link: `${publicLink.value}` };
          dataStruct.push(valueHolder);
        }
        collabData.value = dataStruct;
      }
      loading.value = false;
    }
    async function getPublicId(ev: any) {
      runId.value = ev;
      if (props.query && runId.value === null) {
        if (props.query.run_id) {
          await selectAction({ id: props.query.run_id });
        }
      } else getMeta();
    }
    const GeneAutoCompleteClass = Vue.extend(GeneAutoComplete);
    const acInstance = new GeneAutoCompleteClass({
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
    });
    watch(peakViewerFlag, (v: any) => {
      if (v) {
        visible.value = 'visible';
      } else {
        visible.value = 'hidden';
      }
    });
    watch(geneMotif, (v: any) => {
      if (!props.query.public) {
        const btn = document.getElementById('geneMotifButton')!;
        const span = btn.childNodes[0] as HTMLElement;
        if (v === 'gene') {
          span.innerText = 'GENE';
        } else if (v === 'motif') {
          span.innerText = 'MOTIF';
        }
      }
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
    const submenu = [
      /* eslint-disable no-unused-expressions */
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
        text: geneMotif.value,
        icon: null,
        tooltip: 'Gene/Motif',
        disabled: loading.value,
        ref: 'geneMotifButton',
        click: () => {
          (geneMotif.value === 'gene') ? geneMotif.value = 'motif' : geneMotif.value = 'gene';
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
      if (resolveAuthGroup(['collab']) && (props.query && !props.query.public)) {
        await loadingPage();
      } else {
        store.commit.setSubmenu(submenu);
        if (props.query && !props.query.public) {
          await fetchFileList();
          if (props.query.run_id) {
            // loadCandidateWorkers('AtlasXploreX');
            currentTask.value = { task: 'gene.compute_qc', queues: ['atxcloud_gene'] };
            await selectAction({ id: props.query.run_id });
          } else {
            currentTask.value = { task: 'gene.compute_qc', queues: ['atxcloud_gene'] };
          }
        }
        if (props.query) {
          if (props.query.run_id && props.query.public) {
            const fn = props.query.run_id;
            filename.value = fn;
          }
        }
        acInstance.$mount('#geneac');
      }
    });
    onUnmounted(() => {
      if (acInstance.$el) {
        acInstance.$destroy();
        acInstance.$el.parentNode!.removeChild(acInstance.$el);
        store.commit.setSubmenu(null);
      }
    });
    return {
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
      resolveAuthGroup,
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
      topTenIds,
      updateTen,
      redirectToLogin,
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
  .round_chip {
    width: 27px !important;
    height: 27px !important;
    border-radius: 50% !important;
    pointer-events: all !important;
    padding: 0 !important;
    min-width: 27px !important;
  }
  .round_chip2 {
    width: 20px !important;
    height: 20px !important;
    border-radius: 50% !important;
    pointer-events: all !important;
    margin: 0 !important;
    padding: 0 !important;
    min-width: 20px !important;
  }
  .round_chip_active {
    opacity: 0.5;
  }
  .thickBorder td{
    border-bottom-width: 2px !important;
  }
  .bold-disabled-Text{
    padding: 0 !important;
    margin: 0 !important;
    border-style: none !important;
  }
  .bold-disabled-Text .theme--light.v-input--is-disabled, .theme--light.v-input--is-disabled input, .theme--light.v-input--is-disabled textarea {
    color: rgba(0,0,0,1) !important;
  }
  .bold-disabled-Text .theme--dark.v-input--is-disabled, .theme--dark.v-input--is-disabled input, .theme--dark.v-input--is-disabled textarea {
    color: hsla(0,0%,100%,1) !important;
  }
  .bold-disabled-Text .theme--dark.v-text-field--solo, .v-input__control .v-input__slot {
    background: transparent !important;
  }
  .bold-disabled-Text .v-text-field.v-text-field--enclosed .v-text-field__details {
    margin-bottom: 0 !important;
  }
  .bold-disabled-Text .v-text-field.v-text-field--solo .v-input__control {
    min-height: auto !important;
    padding: 0;
    padding-top: 0px;
    padding-right: 0px;
    padding-bottom: 0px;
    padding-left: 0px;
  }
   .bold-disabled-Text .v-input__slot {
    margin-bottom: 0px !important;
  }
</style>
