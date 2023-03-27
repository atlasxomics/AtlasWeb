<template>
  <v-app>
    <v-container v-if="atlasXplore_displayed" fluid id="container" :style="{ 'background-color': backgroundColor, 'height': '100%', 'margin': '0', 'width': '100%', 'padding': '0' }">
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
                @click="clusters_ann_flag = !clusters_ann_flag">{{geneMotif}}
              </v-btn>
            </template>
            <span>Cluster&lt;-&gt;Annotations</span>
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
              <span>Background/Heatmap</span>
          </v-tooltip>
          <div id="geneac">
          </div>
          </v-app-bar>
      </template>
      <v-row>
        <v-dialog
          :value="backgroundFlag"
          @click:outside="backgroundFlag = !backgroundFlag"
          hide-overlay>
          <v-card style="width: max-content;position: absolute;z-index: 999;top:47px;left:210px;">
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
              :headers="backgroundHeader">
              <template v-slot:item="row">
                <template v-if="row.item['background'] != 'custom'">
                  <tr @click="chooseBackground(row.item)">
                  <td>{{row.item['background']}}</td>
                  </tr>
                </template>
                <template v-else>
                  <tr @click="clusterColorFlag = true ; backgroundFlag= false" :style="{ 'pointer-events': isClusterView ? 'auto' : 'none' }">
                    <td>Heatmap</td>
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
          <v-card style="width:200px;position: absolute;z-index: 999;top:47px;left: 130px;"
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
          v-if="clusters_ann_flag"
          :value="clusters_ann_flag"
          @click:outside="clusters_ann_flag = !clusters_ann_flag"
          hide-overlay>
          <v-card style="width:100px;position: absolute;z-index: 999;top:47px;left:150px;"
            :disabled="loading">
            <v-data-table
            class="thickBorder"
            v-model="selected"
            width="20%"
            dense
            single-select
            hide-default-footer
            hide-default-header
            :items="clusters_ann_list">
              <template v-slot:item="row">
                <template v-if="row.item == 'gene'">
                  <tr @click="changeClustersAnn(row.item)">
                    <td>{{row.item}}</td>
                  </tr>
                </template>
                <template v-else-if="row.item == 'motif'">
                  <tr @click="changeClustersAnn(row.item)">
                    <td>{{row.item}}</td>
                  </tr>
                </template>
                <template v-else-if="row.item == 'eRegulon'">
                  <tr @click="changeClustersAnn('regulon')">
                    <td>{{row.item}}</td>
                  </tr>
                </template>
              </template>
            </v-data-table>
          </v-card>
        </v-dialog>
        <v-col cols="2" sm="1">
          <v-card :style="{ 'margin-left': '5px', 'width': '65px', 'min-width': '65px', 'height':'342px', 'padding-top': '15px', 'margin-top': '5px', 'background-color': 'silver' }" flat>
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
                :disabled="(!isDrawing && !isDrawingRect)"
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
                  <template v-if="geneMotif == 'gene'"><span class="text-h5">Top 10 Genes</span></template>
                  <template v-if="geneMotif == 'motif'"><span class="text-h5">Top 10 Motifs</span></template>
                  <template v-if="geneMotif == 'regulon'"><span class="text-h5">Top 10 Regulons</span></template>
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
                <v-card-title>Cell Type Mapping</v-card-title>
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
                              label="Cell Typing"/>
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
              <v-card  style="width: max-content; position: absolute; left: 65px; top: 240px;z-index: 999">
                <v-data-table
                class="thickBorder"
                v-model="selected"
                width="20%"
                dense
                single-select
                hide-default-footer
                hide-default-header
                :items="saveImageTable">
                  <template v-slot:item="row">
                    <template v-if="row.item == 'Transparent'">
                      <tr @click="captureScreen('null')">
                        <td>{{row.item}}</td>
                      </tr>
                    </template>
                    <template v-else-if="row.item == 'Opaque'">
                      <tr @click="captureScreen(backgroundColor)">
                        <td>{{row.item}}</td>
                      </tr>
                    </template>
                    <template v-else>
                      <tr @click="generateFrontPage">
                        <td>{{row.item}}</td>
                      </tr>
                    </template>
                  </template>
                </v-data-table>
              </v-card>
            </v-dialog>
            <v-dialog
            :scrollable="true"
            v-if="scaleFlag"
            :value="scaleFlag"
            @click:outside="scaleFlag = !scaleFlag"
            hide-overlay>
              <v-card style="width:600px; position: absolute; left: 50%; top: 30%; transform: translate(-50%, -50%);z-index: 999">
                <v-card-title>Min/Max Range</v-card-title>
                <v-row style="padding: 8px">
                <v-col cols="12" sm="6"><v-text-field type="text" :rules="onlyNumRule" v-model="userMinValue" label="Min"></v-text-field></v-col>
                <v-col cols="12" sm="6"><v-text-field type="text" :rules="onlyNumRule" v-model="userMaxValue" label="Max"></v-text-field></v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" sm="12" align="right"><v-btn outlined color="red" @click="resetBoundary">Reset</v-btn><v-btn outlined color="green" @click="applyBoundary">Apply</v-btn></v-col>
                </v-row>
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
              :disabled="!spatialData"
              @click="cellTypeFlag = !cellTypeFlag"
              small>
            <v-icon>mdi-eyedropper-variant</v-icon>
            </v-btn>
            </template>
            <span>Cell Typing</span>
            </v-tooltip>
            <v-tooltip right :disabled="scaleFlag">
            <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              class="ml-4 mt-5"
              icon
              color="black"
              :disabled="(childGenes.length === 0) ? true : false"
              @click="scaleFlag = !scaleFlag"
              small>
            <v-icon>mdi-scale</v-icon>
            </v-btn>
            </template>
            <span>Min/Max Range</span>
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
          </v-card>
          <v-card :style="{ 'position': 'sticky', 'margin-left': '5px', 'width': '65px', 'min-width': '65px', 'height':'149px', 'padding-top': '15px', 'background-color': 'silver', 'top': '62vh' }" flat>
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
                :loading="peakViewLoad"
                color="black"
                icon
                class="ml-4 mt-5"
                :disabled="(!spatialData || assayFlag || peakViewLoad)"
                @click="peakViewerFlag = true; featureTableFlag = false; histoFlag = false"
                small>
                <v-icon>mdi-chart-line</v-icon>
              </v-btn>
            </template>
            <span>{{(!regulons_flag) ? 'Peak/Motif Viewer' : 'Peak/Motif/Network Viewer'}}</span>
            </v-tooltip>
            <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                color="black"
                icon
                class="ml-4 mt-5"
                :disabled="!spatialData"
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
              <atx-atac-viewer
                @loading_value="updateLoading"
                @highlightedId='updateSelectors'
                @totalClust="updateClustTotal"
                @spatialCircleData="updateHistogram"
                @singleCircleData="dataToSingle"
                @sendColorBar="colorBarToSingle"
                @totalGM="loadExpressions"
                @maxMinCount="updateMaxMin"
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
                :antiKey="tableKey"
                :geneOmotif="geneMotif"
                :idOfRun="runId"
                :userBoundary="userMaxMinValue"
                :assay_flag="assayFlag"
                :regulonsFlag="regulons_flag"
                ref="mainAtxViewer"/>
            </v-col>
            <v-col cols="12" sm="2">
              <table style="margin-bottom: 0; height: 50vh;overflow-y: scroll;display: block;">
                  <tr v-for="(value, cluster) in colorMapCopy" v-bind:key="cluster" :style="{ 'vertical-align': 'middle' }">
                    <td>
                      <v-checkbox @click="unClickCluster(cluster)" :color="value" dense :dark="backgroundColor == 'white' ? false : true" input-value="1"/>
                    </td>
                    <td style="padding-bottom: 12px;">
                      <span :style="{ 'color': (backgroundColor == 'white') ? 'black' : 'white', 'font-weight': 'bold'}">{{cluster}}&ensp;<span style="font-size:10px"> ({{totalInClust[cluster]}})</span></span>
                    </td>
                  </tr>
              </table>
            </v-col>
          </v-row>
          <v-col cols="12" sm="11">
            <singleview v-if="averageInd && childGenes.length > 0" :gene="childGenes" :circleData="singleData" :userBoundary="userMaxMinValue" :heatmap="heatMap" :loadingProp="loading" :colorBar="colorBarFromSibling" :background="backgroundColor"/>
          </v-col>
          <v-col cols="12" sm="11">
            <v-card class="mt-3" v-show="featureTableFlag" flat>
              <table-component :loading="geneMotifLoad" :lengthClust="lengthClust" :gene="geneNames" :clusters="topHeaders" :colormap="colorMap" @sentGene="sendGene" @sentCluster="sendCluster"/>
            </v-card>
            <div id="captureHisto">
              <v-card class="mt-3" v-show="spatialCircleData.length > 0 && histoFlag" flat>
                <histogram-graph v-show="histoFlag" :colorCode="colorMap" :idName="childGenes" :chartData="spatialCircleData" :assay="assayFlag"/>
              </v-card>
            </div>
            <div id="capturePeak" :style="{ visibility: visible }">
              <v-card v-if="!assayFlag" class="mt-3" v-resize="onResize" ref="peakContainer" flat>
                <template v-if="geneMotif == 'motif'">
                  <v-card-title>{{(trackBrowserGenes[0] ? trackBrowserGenes[0] : 'Please enter motif in search bar to see seqlogo')}}</v-card-title>
                  <bar-chart ref="chart" :seqlogo="seqLogoData" :width="widthFromCard" :motif="trackBrowserGenes[0]"/>
                </template>
                <network-graph v-show="geneMotif == 'regulon'" :selected_regulons="childGenes" :run_id="runId" :flag="regulons_flag"></network-graph>
                <track-browser v-show="geneMotif == 'gene'" ref="trackbrowser" :run_id="runId" :metadata="metadata.species" :search_key="trackBrowserGenes[0]" @loading_value="updateLoading"/>
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
import AtxAtacViewer from './modules/AtxAtacViewer.vue';
import BarChart from './modules/BarChart.vue';
import LoadingPage from './modules/LoadingPage.vue';
import HistogramGraph from './modules/HistogramGraph.vue';
import Singleview from './modules/Singleview.vue';
import NetworkGraph from './modules/NetworkGraph.vue';
/* eslint-disable no-unused-expressions */

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
const backgroundOptions = [
  { background: 'black' },
  { background: 'white' },
  { background: 'darkgrey' },
  { background: 'custom' },
];
const onlyNumRule = [
  (v: any) => {
    if (v.match(/\d+/)) return true;
    return 'Value must be digit';
  },
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
  components: { 'table-component': GeneDataTable, 'search-component': GeneAutoComplete, TrackBrowser, AtxAtacViewer, BarChart, LoadingPage, HistogramGraph, Singleview, NetworkGraph },
  props: ['query'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const workers = computed(() => store.state.client?.workers);
    const globalXploreData = computed(() => store.state.xploreData);
    const saveImageTable = ref<any[]>((resolveAuthGroup(['admin'])) ? ['Transparent', 'Opaque', 'FrontPage'] : ['Transparent', 'Opaque']);
    const candidateWorkers = ref<any[]>([]);
    const filename = ref<string | null>(null);
    const holdMotif = ref<string | null>(null);
    const holdGene = ref<string | null>(null);
    const runId = ref<string | null>(null);
    const publicLink = ref<string | null>(null);
    const items = ref<any[]>([]);
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
    const collaborator_specific_ids = ref<Set<string> | null>(null);
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
    const totalInCellType = ref<any>({});
    const selectedClusters = ref<any[]>([]);
    const spatialCircleData = ref<any>({});
    const colorBarFromSibling = ref<any>();
    const singleData = ref<any>();
    const averageInd = ref<boolean>(false);
    const topTenIds = ref<any>({});
    const tableKey = ref<number>(1);
    const assayFlag = ref<boolean>(false);
    const regulons_flag = ref<boolean>(false);
    const scaleFlag = ref<boolean>(false);
    const userMaxValue = ref<string>('');
    const userMinValue = ref<string>('');
    const userMaxMinValue = ref<any[]>(['', '']);
    const peakViewLoad = ref<boolean>(false);
    const geneMotifLoad = ref<boolean>(false);
    const lassoLoad = ref<boolean>(false);
    const heatMap = ref<string[]>(['#D51F26', '#272E6A', '#208A42', '#89288F', '#F47D2B', '#FEE500', '#8A9FD1', '#C06CAB', '#D8A767', '#90D5E4', '#89C75F', '#F37B7D', '#9983BD', '#D24B27', '#3BBCA8', '#6E4B9E', '#0C727C', '#7E1416', '#E6C2DC', '#3D3D3D']);
    const oneTime = ref<boolean>(true);
    const clusters_ann_flag = ref<boolean>(false);
    const clusters_ann_list = ref<string[]>([]);
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
        router.go(-1);
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
    function updateLoading(ev: any) {
      peakViewLoad.value = ev;
    }
    function updateSelectors(ev: any) {
      highlightIds.value = ev.ids;
      topSelected.value = ev.genes;
    }
    function updateHistogram(ev: any) {
      spatialCircleData.value = ev;
    }
    // Functions that handle Clusters and Annotations
    async function changeClustersAnn(ev: any) {
      clusters_ann_flag.value = false;
      geneMotif.value = ev;
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
    // Functions to update the color map
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
    function changeClusterColor() {
      clusterColorFlag.value = false;
      if (colorMap.value !== colorMapCopy.value) {
        manualClusterFlag.value = true;
        const cmap: any = {};
        const heatcmap: any[] = [];
        lodash.each(colorMapCopy.value, (value: any, key: any) => {
          cmap[key] = value;
          heatcmap.push(value);
        });
        heatMap.value = heatcmap;
        colorMap.value = cmap;
        if (geneMotif.value === 'gene' && isClusterView.value && !assayFlag.value) {
          peakViewLoad.value = true;
          (ctx as any).refs.trackbrowser.reload(runId.value, colorMap.value);
          peakViewLoad.value = false;
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
    // Functions to update the Cell Type
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
    // Checkbox selection of clusteres
    function unClickCluster(ev: any) {
      if (!selectedClusters.value.includes(ev)) {
        selectedClusters.value.push(ev);
      } else {
        const index = selectedClusters.value.indexOf(ev);
        if (index > -1) selectedClusters.value.splice(index, 1);
      }
    }
    // Updating Max and Min boundray for summations
    function applyBoundary() {
      if (userMaxValue.value.match(/\d+/) && userMinValue.value.match(/\d+/)) {
        userMaxMinValue.value = [userMaxValue.value, userMinValue.value];
        scaleFlag.value = !scaleFlag.value;
      }
    }
    function resetBoundary() {
      userMaxValue.value = '';
      userMinValue.value = '';
      userMaxMinValue.value = [userMaxValue.value, userMinValue.value];
    }
    function updateMaxMin(ev: any) {
      const [max, min] = ev;
      userMaxValue.value = max;
      userMinValue.value = min;
    }
    // Saving TopTen from lasso and Tixel ID's
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
    // Functions to caprture images and save them
    function captureScreen(background: string) {
      displayFlag.value = false;
      if (isClusterView.value || (!isClusterView.value && !averageInd.value)) {
        const canvas2 = document.createElement('canvas');
        const context2 = canvas2.getContext('2d')!;
        const plot_ids = ['spatialGroup', 'umapGroup'];
        const el = document.getElementById('spatialGroup')!;
        const el2 = document.getElementById('umapGroup')!;
        console.log(el2.getAttribute('width'));
        let widthS = (parseFloat(el.getAttribute('width')!) > parseFloat(el2.getAttribute('width')!)) ? parseFloat(el.getAttribute('width')!) : parseFloat(el2.getAttribute('width')!);
        let heightS = (parseFloat(el.getAttribute('height')!) > parseFloat(el2.getAttribute('height')!)) ? parseFloat(el.getAttribute('height')!) : parseFloat(el2.getAttribute('height')!);
        widthS += 12;
        heightS += 12;
        canvas2.width = widthS * 2;
        canvas2.height = heightS;
        let count = 0;
        const xValues = [0, widthS];
        const go = (can: any, x: any, y: any) => {
          count += 1;
          context2?.drawImage(can, x, y);
          if (count === 2) {
            const base64image = canvas2.toDataURL('image/png');
            const pom = document.createElement('a');
            pom.id = `${runId.value}link`;
            pom.href = base64image;
            const listGene = childGenes.value.join();
            pom.setAttribute('download', `${runId.value}/${listGene}.png`);
            pom.click();
          }
        };
        plot_ids.forEach((gene: any, i: any) => {
          const tag = `${gene}`;
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          const ele = document.getElementById(`${tag}`)!;
          const widtH = parseFloat(ele.getAttribute('width')!);
          const heighT = parseFloat(ele.getAttribute('height')!);
          canvas.width = widtH + 8;
          canvas.height = heighT + 8;
          const svgURL = new XMLSerializer().serializeToString(ele);
          const image = new window.Image();
          const x = xValues[i];
          const y = 0;
          image.onload = () => {
            context?.drawImage(image, 0, 0, widtH, heighT);
            go(canvas, x, y);
          };
          image.src = `data:image/svg+xml; charset=utf8,${encodeURIComponent(svgURL)}`;
        });
      } else {
        const canvas2 = document.createElement('canvas');
        const context2 = canvas2.getContext('2d');
        let widthS = 0;
        let heightS = 0;
        let count = 0;
        const numOfLines = Math.floor(childGenes.value.length / 3) + 1;
        let xValues: any[];
        let yValueCount = -1;
        const go = (can: any, x: any, y: any) => {
          count += 1;
          context2?.drawImage(can, x, y);
          if (count === childGenes.value.length) {
            const base64image = canvas2.toDataURL('image/png');
            const pom = document.createElement('a');
            pom.id = `${runId.value}link`;
            pom.href = base64image;
            const listGene = childGenes.value.join();
            pom.setAttribute('download', `${runId.value}/${listGene}.png`);
            pom.click();
          }
        };
        childGenes.value.forEach((gene: any, i: any) => {
          const tag = `svgGroup${gene}`;
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          const el = document.getElementById(`${tag}`)!;
          widthS = el.getBoundingClientRect().width + 8;
          heightS = el.getBoundingClientRect().height + 8;
          if (i === 0) {
            canvas2.width = widthS * 3;
            canvas2.height = (numOfLines >= 1) ? heightS * numOfLines + (8 * numOfLines) : heightS;
            xValues = [0, widthS, widthS * 2];
          }
          canvas.width = widthS;
          canvas.height = heightS;
          const svgURL = new XMLSerializer().serializeToString(el);
          const image = new window.Image();
          const x = xValues[i % 3];
          if (i % 3 === 0) yValueCount += 1;
          const y = yValueCount * heightS;
          image.onload = () => {
            context?.drawImage(image, 0, 0, widthS, heightS);
            go(canvas, x, y);
          };
          image.src = `data:image/svg+xml; charset=utf8,${encodeURIComponent(svgURL)}`;
        });
        // arrayOfCanvas.forEach((v: any, i: any) => {
        //   const x = widthS * i;
        //   const y = Math.floor(i / childGenes.value.length) * heightS;
        //   context2?.drawImage(v, x, y);
        // });
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
    async function generateFrontPage() {
      displayFlag.value = false;
      const el = document.getElementById('spatialGroup')!;
      const widthS = parseFloat(el.getAttribute('width')!);
      const heightS = parseFloat(el.getAttribute('height')!);
      el.cloneNode(true);
      const svgURL = new XMLSerializer().serializeToString(el);
      const image = new window.Image();
      image.onload = async (v: any) => {
        const canvas = document.createElement('canvas');
        canvas.width = widthS;
        canvas.height = heightS;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0, widthS, heightS);
        const base64image = canvas.toDataURL('image/png');
        const pom = document.createElement('a');
        pom.id = `${runId.value}link`;
        pom.href = base64image;
        const end = `frontPage_${runId.value}.png`;
        pom.setAttribute('download', `${end}`);
        pom.click();
        const genPage = await client.value?.generateFrontPage(base64image, runId.value!);
      };
      image.src = `data:image/svg+xml; charset=utf8,${encodeURIComponent(svgURL)}`;
    }
    // Data being passed from TopTen Table to main component
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
    function chooseBackground(ev: any) {
      backgroundColor.value = ev.background;
      backgroundFlag.value = false;
    }
    // These functions are called once all the necessary files are loaded in to AtxAtacViewer (data.csv.gz)
    async function updateCircles() {
      if (!spatialData.value) return;
      isHighlighted.value = false;
      const cmap: any = {};
      const cellmap: any = {};
      const cellmapCopy: any = {};
      const cmapCopy: any = {};
      const colors: any[] = [];
      const clustKeys = Object.keys(totalInClust.value);
      const numClusters = Object.keys(totalInClust.value).length;
      if (!manualClusterFlag.value) {
        // const colors_raw = colormap({ colormap: heatMap.value, nshades: (numClusters) * 3, format: 'hex', alpha: 1 });
        // colors_raw.forEach((v: any, i: number) => {
        //   if ((i % 3) === 0) colors.push(colors_raw[i + 1]);
        // });
        for (let i = 0; i < clustKeys.length; i += 1) {
          const cidx = clustKeys[i];
          cmap[cidx] = heatMap.value[i];
          cmapCopy[cidx] = heatMap.value[i];
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
      loading.value = true;
      spatialData.value = true;
      await updateTable();
      await updateCircles();
      onResize();
      loading.value = false;
    }
    function updateClustTotal(ev: any) {
      totalInClust.value = ev;
      selectedClusters.value = Object.keys(totalInClust.value).map((v: any) => v);
      if (geneMotif.value === 'regulon') totalInCellType.value = ev;
      if (Object.keys(topTenIds.value).length > 0) {
        updateSpatial();
      }
    }
    async function updateTen() {
      const fileName = { params: { filename: `data/${runId.value}/h5/topTen_genes.json` } };
      const topTen_gene_json = await client.value?.getJsonFile(fileName);
      topTenIds.value.gene = topTen_gene_json;
      if (!assayFlag.value) {
        const fileNameMotif = { params: { filename: `data/${runId.value}/h5/topTen_motifs.json` } };
        const topTen_motif_json = await client.value?.getJsonFile(fileNameMotif);
        topTenIds.value.motif = topTen_motif_json;
      }
      if (regulons_flag.value) {
        const fileNameRegulon = { params: { filename: `data/${runId.value}/h5/topTen_eRegulons.json` } };
        const topTen_regulon_json = await client.value?.getJsonFile(fileNameRegulon);
        topTenIds.value.regulon = topTen_regulon_json;
      }
      spatialData.value = false;
      if (Object.keys(totalInClust.value).length > 1) {
        updateSpatial();
      }
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
    };
    async function updateFilename() {
      if (!spatialData.value) return;
      /* eslint-disable no-lonely-if */
      try {
        if (!props.query.public) {
          if (geneMotif.value === 'motif') {
            const hold = filename.value;
            filename.value = hold!.replace(/eRegulons|genes/i, 'motifs');
          } else if (geneMotif.value === 'gene') {
            const hold = filename.value;
            filename.value = hold!.replace(/eRegulons|motifs/i, 'genes');
          } else if (geneMotif.value === 'regulon') {
            const hold = filename.value;
            filename.value = hold!.replace(/motifs|genes/i, 'eRegulons');
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
    async function generatePublicLink(rid = runId.value) {
      if (!client.value) return;
      if (!filename.value) return;
      try {
        if (!props.query.public) {
          const existingCookie = readCookie();
          const split = existingCookie?.token.split('JWT ')[1];
          const geneFileName = `data/${rid}/h5/geneNames.txt.gz`;
          const motifFileName = `data/${rid}/h5/motifNames.txt.gz`;
          const tixelFileName = `data/${rid}/h5/data.csv.gz`;
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
      if (!globalXploreData.value) return;
      metadata.value.organ = globalXploreData.value.organ;
      metadata.value.species = globalXploreData.value.species;
      metadata.value.type = globalXploreData.value.assay;
      metadata.value.runid = globalXploreData.value.run_id;
      // metadata.value.ngsid = rid;
      // collabName.value = (Object.keys(data).includes('tissue_source')) ? data.tissue_source : data.group_name;
      const addCellType = ['gene'];
      if (globalXploreData.value.assay === 'Transcriptome') assayFlag.value = true;
      else addCellType.push('motif');
      if (globalXploreData.value.regulons_flag) {
        regulons_flag.value = true;
        addCellType.push('eRegulon');
      }
      clusters_ann_list.value = addCellType;
    }
    async function selectAction(ev: any) {
      const root = 'data';
      if (!props.query.public) {
        let fn = '';
        if (geneMotif.value === 'gene') fn = `${root}/${ev.id}/h5/obj/genes.h5ad`;
        if (geneMotif.value === 'motif') fn = `${root}/${ev.id}/h5/obj/motifs.h5ad`;
        if (geneMotif.value === 'regulon') fn = `${root}/${ev.id}/h5/obj/eRegulons.h5ad`;
        filename.value = fn;
        holdMotif.value = '';
        runId.value = ev.id;
        metadata.value.species = '';
      }
      generatePublicLink(runId.value);
      getMeta(runId.value);
      updateTen();
    }
    async function getPublicId(ev: any) {
      runId.value = ev.run_id;
      metadata.value.organ = ev.tissue;
      const addCellType = ['gene'];
      if (ev.assay === 'Transcriptome') assayFlag.value = true;
      else addCellType.push('motif');
      if (ev.regulons_flag) {
        regulons_flag.value = true;
        addCellType.push('eRegulon');
      }
      clusters_ann_list.value = addCellType;
      metadata.value.species = ev.species;
      metadata.value.type = ev.assay;
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
          if (ev.length === 1 && geneMotif.value !== 'regulon') {
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
      geneMotifLoad.value = true;
      if (!assayFlag.value) {
        if (!props.query.public) {
          const btn = document.getElementById('geneMotifButton')!;
          const span = btn.childNodes[0] as HTMLElement;
          if (v === 'gene') span.innerText = 'GENE';
          else if (v === 'motif') span.innerText = 'MOTIF';
          else if (v === 'regulon') span.innerText = 'EREGULON';
        }
        userMaxValue.value = '';
        userMinValue.value = '';
        userMaxMinValue.value = [userMaxValue.value, userMinValue.value];
        genes.value = [];
        featureTableFlag.value = true;
        peakViewerFlag.value = false;
        histoFlag.value = false;
        isClusterView.value = true;
        if (childGenes.value.length > 0) selectedGenes.value = [];
        showFlag.value = [false];
        geneButton.value = [];
        trackBrowserGenes.value = [];
        updateFilename();
        // updateTable();
      }
      geneMotifLoad.value = false;
    });
    watch(tableKey, (v: any) => {
      featureTableFlag.value = true;
      peakViewerFlag.value = false;
      histoFlag.value = false;
      isClusterView.value = true;
      selectedGenes.value = [];
      showFlag.value = [false];
      geneButton.value = [];
      childGenes.value = [];
      trackBrowserGenes.value = [];
      updateTable();
    });
    watch(isDrawing, (v: boolean) => {
      if (!isDrawing.value) {
        colorOnOff.value = 'black';
      } else {
        colorOnOff.value = 'green';
      }
    });
    watch(isDrawingRect, (v: boolean) => {
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
      tooltip: 'Cluster<->Annotations',
      disabled: loading.value,
      ref: 'geneMotifButton',
      enabled: true,
      click: () => {
        clusters_ann_flag.value = !clusters_ann_flag.value;
      },
    };
    const bg_color_button = {
      text: 'Background/Heatmap',
      icon: 'mdi-palette',
      tooltip: 'Background/Heatmap',
      enabled: true,
      click: () => {
        backgroundFlag.value = !backgroundFlag.value;
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
      submenu.value.push(metadata_button, gene_motif_button, bg_color_button, gene_ac_bar);
    }
    async function prep_atlasxplore(run_id: string) {
      if (submenu.value.length < 1) {
        prep_sub_menu();
      }
      store.commit.setSubmenu(submenu.value);
      if (!props.query.public) {
        await new Promise((f: any) => setTimeout(f, 1000));
        await selectAction({ id: run_id });
        currentTask.value = { task: 'gene.compute_qc', queues: ['atxcloud_gene'] };
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
      if (globalXploreData.value !== null || props.query.public) {
        runId.value = null;
        atlasXplore_displayed.value = true;
        prep_atlasxplore(props.query.run_id);
      } else redirectToVisual();
    });
    onUnmounted(() => {
      if (acInstance.value.$el) {
        acInstance.value.$destroy();
        acInstance.value.$el.parentNode!.removeChild(acInstance.value.$el);
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
      selected,
      loading,
      loadExpressions,
      clusterHeaders,
      backgroundOptions,
      backgroundHeader,
      genes,
      selectedGenes,
      generatePublicLink,
      spatialData,
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
      backgroundFlag,
      chooseBackground,
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
      collabData,
      removeZeros,
      collabName,
      updateClustTotal,
      totalInClust,
      totalInCellType,
      unClickCluster,
      selectedClusters,
      updateHistogram,
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
      metadata_button,
      gene_motif_button,
      bg_color_button,
      gene_ac_bar,
      prep_sub_menu,
      // initializeRun,
      tableKey,
      topTenIds,
      updateTen,
      redirectToVisual,
      assayFlag,
      regulons_flag,
      updateTable,
      logout,
      scaleFlag,
      userMaxValue,
      userMinValue,
      applyBoundary,
      resetBoundary,
      onlyNumRule,
      userMaxMinValue,
      updateMaxMin,
      peakViewLoad,
      geneMotifLoad,
      oneTime,
      saveImageTable,
      generateFrontPage,
      clusters_ann_flag,
      clusters_ann_list,
      changeClustersAnn,
    };
  },
});
</script>

<style>
  .container {
    padding: 0;
    min-width: 1020px;
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
  .hidden {
    visibility: hidden;
  }
  .v-input--selection-controls {
    padding-top: 0px;
  }
</style>
