<template>
  <v-app>
    <v-container fluid id="container" :style="{ 'background-color': backgroundColor, 'height': '100%', 'margin': '0', 'width': '100%', 'padding': '0' }">
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
                    <tr><v-btn id="no-background-hover" flat text x-small @click="captureScreen('null')">Transparent</v-btn></tr>
                    <tr><v-btn id="no-background-hover" flat text x-small @click="captureScreen(backgroundColor)">Background</v-btn></tr>
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
                :disabled="!spatialData || loading || geneMotif"
                @click="peakViewerFlag = true; featureTableFlag = false"
                small>
                <v-icon>mdi-chart-bar</v-icon>
              </v-btn>
            </template>
            <span>Peak Viewer</span>
            </v-tooltip>
          </v-card>
        </v-col>
        <v-col cols="12" sm="10" class="mt-5">
          <div id="screenCapture" :style="{ 'background-color': 'transparent' }">
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
                      <v-card
                        class="rounded-0"
                        flat
                        :style="{ 'background-image': colorBarmap, 'overflow-x': 'None' }"
                        height="3vh"
                        width="100%">
                        <v-row no-gutters>
                          <v-col v-for="step in stepArray" v-bind:key="`${step}`" class="ma-0 pa-0">
                          <p :style=" { 'color': colorbarText, 'font-size': '18px', 'font-weight': 'bold' } "  class="text-center">{{ step }}</p>
                          </v-col>
                        </v-row>
                      </v-card>
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
                      <v-card
                        class="rounded-0"
                        flat
                        :style="{ 'background-image': colorBarmap, 'overflow-x': 'None' }"
                        height="3vh"
                        width="100%">
                        <v-row no-gutters>
                          <v-col v-for="step in stepArray" v-bind:key="`${step}`" class="ma-0 pa-0">
                          <p :style=" { 'color': colorbarText, 'font-size': '18px', 'font-weight': 'bold' } "  class="text-center">{{ step }}</p>
                          </v-col>
                        </v-row>
                      </v-card>
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
          </div>
          <v-row no-gutters>
            <v-col cols="12" sm="12">
              <v-card class="mt-3" v-show="clusterItems && featureTableFlag" :disabled="loading">
                <table-component :loading="loading" :lengthClust="lengthClust" :gene="geneNames" :clusters="topHeaders" v-on:toParent="sendGene"/>
              </v-card>
              <div id="capturePeak" :style="{ 'background-color': 'transparent' }">
                <v-card class="mt-3" :style="{ visibility: visible }" v-show="clusterItems">
                  <track-browser ref="trackbrowser" :run_id="runId" :colormap="colorMap" :search_key="trackBrowserGenes[trackBrowserGenes.length - 1]"/>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script lang='ts'>
import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUnmounted } from '@vue/composition-api';
import Konva from 'konva';
import lodash, { lte } from 'lodash';
import colormap from 'colormap';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { get_uuid, generateRouteByQuery, splitarray, deepCopy } from '@/utils';
import { readCookie } from '@/utils/auth';
import { Console } from 'console';
import html2canvas from 'html2canvas';
import GeneAutoComplete from './modules/GeneAutoComplete.vue';
import GeneDataTable from './modules/GeneDataTable.vue';
import TrackBrowser from './modules/TrackBrowser.vue';

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
function padzeros(v: number, digit: number): string {
  let s = v.toString();
  while (s.length < digit) s = `0${s}`;
  return s;
}

export default defineComponent({
  name: 'AtlasG',
  components: { 'table-component': GeneDataTable, 'search-component': GeneAutoComplete, TrackBrowser },
  props: ['query'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const workers = computed(() => store.state.client?.workers);
    const slimsRuns = computed(() => store.state.slimsData);
    const candidateWorkers = ref<any[]>([]);
    const filename = ref<string | null>(null);
    const filenameMotif = ref<string | null>(null);
    const runId = ref<string | null>(null);
    const publicLink = ref<string | null>(null);
    const items = ref<any[]>();
    const search = ref<string>();
    const selected = ref<any>();
    const genes = ref<any[]>([]);
    const filteredGenes = ref<any[]>([]);
    const loading = ref<boolean>(false);
    const selectedGenes = ref<any[]>([]);
    const trackBrowserGenes = ref<any[]>([]);
    const searchInput = ref<string | null>(null);
    const spatialData = ref<any | null>(null);
    const clusterItems = ref<any[]>();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const konvaConfigLeft = ref<any>({ x: 0, y: 0, width, height, draggable: true });
    const konvaConfigRight = ref<any>({ x: 0, y: 0, width, height, draggable: true });
    const scale = ref<number>(0.75);
    const scaleUMAP = ref<number>(0.75);
    const currentViewType = ref<string>('spatial');
    const isClusterView = ref(true);
    const isSummation = ref(true);
    const isHighlighted = ref(false);
    const highlightedSpatial = ref<any[]>([]);
    const highestCount = ref<number>(0);
    const lowestCount = ref<number>(10000);
    const stepArray = ref<any[]>([]);
    const colorBarmap = ref<string>('');
    const highlightedCluster = ref<any>();
    const metaFlag = ref<boolean>(false);
    // Metadata
    const metadata = ref<Metadata>({
      run: null,
      type: '',
      species: '',
      organ: null,
    });
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
    const backgroundColor = ref<string>('black');
    const heatMap = ref<string>('jet');
    const autocompleteLoading = ref(false);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    const currentTask = ref<any | null>();
    const progressMessage = ref<string | null>(null);
    const geneNames = ref<any[]>([]);
    const topHeaders = ref<any[]>([]);
    const isDrawing = ref<boolean>(false);
    const isDrawingRect = ref<boolean>(false);
    const isClicked = ref<boolean>(false);
    const polygon = ref<any>({ x: 0, y: 0, points: [], opacity: 0.8, closed: true, fill: 'white', stroke: 'green', strokeWidth: 1 });
    const polygonUMAP = ref<any>({ x: 0, y: 0, points: [], opacity: 0.8, closed: true, fill: 'white', stroke: 'green', strokeWidth: 1 });
    const rectangle = ref<any>({ x: 0, y: 0, width: 0, height: 0, opacity: 0.8, fill: 'white', stroke: 'green', strokeWidth: 1, endPointx: 0, endPointy: 0 });
    const rectangleUMAP = ref<any>({ x: 0, y: 0, width: 0, height: 0, opacity: 0.8, fill: 'white', stroke: 'green', strokeWidth: 1, endPointx: 0, endPointy: 0 });
    const regions = ref<any>();
    const regionsUMAP = ref<any>();
    const lengthClust = ref<number>(0);
    const colorBar = ref<any[]>([]);
    const showFlag = ref<boolean[]>([false]);
    const runIdFlag = ref<boolean>(false);
    const backgroundFlag = ref<boolean>(false);
    const heatmapFlag = ref<boolean>(false);
    const clusterFlag = ref<boolean>(false);
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
          const listGene = selectedGenes.value.join();
          pom.setAttribute('download', `${runId.value}/peaks.png`);
          pom.click();
        });
      }
    }
    // function loadCandidateWorkers(target: string) {
    //   if (!workers.value) return;
    //   candidateWorkers.value = workers.value.filter((x: any) => {
    //     if (x) {
    //       if (x.params) {
    //         if (x.params.target === target) {
    //           return true;
    //         }
    //       }
    //     }
    //     return false;
    //   });
    //   [currentTask.value] = candidateWorkers.value;
    // }
    function makearray(stopValue: number, startValue: number) {
      if (highestCount.value === 0) return;
      const arr = [];
      const steps = 5;
      const step = (stopValue - startValue) / (steps - 1);
      for (let i = 0; i < steps; i += 1) {
        arr.push(Math.round((startValue + (step * i)) * 10) / 10);
      }
      stepArray.value = arr;
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
    function chooseBackground(ev: any) {
      backgroundColor.value = ev.background;
      backgroundFlag.value = false;
      if (isDrawing || isDrawingRect) {
        highlightRegion();
      }
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
      colorMap.value = cmap;
      if (!showFlag.value[0]) {
        (ctx as any).refs.trackbrowser.reload(runId.value, colorMap.value);
      }
      const colors_intensity = colormap({ colormap: heatMap.value, nshades: 64, format: 'hex', alpha: 1 });
      colorBar.value = colors_intensity;
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
      /*
      const intersect = filelist.map((v: string) => (`${v.split('/')[1]}`));
      const uniq: any[] = [];
      let run_id: string;
      console.log(slimsRuns.value);
      slimsRuns.value!.forEach((v: any, idx: number) => {
        const rid = v['Run Id'];
        if (rid.includes('0')) {
          run_id = `D${rid.split('0')[2]}`;
        } else run_id = rid;
        if (intersect.includes(run_id)) {
          uniq.push(run_id);
        }
      }); */
      const qc_data = filelist.map((v: string) => ({ id: `${v.split('/')[1]}` }));
      items.value = qc_data;
      loading.value = false;
    }
    async function runSpatial(stype: string) {
      if (!client.value) return;
      if (!filename.value) return;
      try {
        progressMessage.value = null;
        loading.value = true;
        spatialRun.value = true;
        if (geneMotif.value && !props.query.public) {
          const hold = filename.value.replace(/genes/i, 'motifs');
          filename.value = hold;
          if (isClusterView.value && (!isDrawing.value && !isDrawingRect.value)) {
            await loadExpressions();
          }
        } else {
          const hold = filename.value.replace(/motifs/i, 'genes');
          filename.value = hold;
          if (isClusterView.value && (!isDrawing.value && !isDrawingRect.value)) {
            await loadExpressions();
          }
        }
        const { task } = currentTask.value;
        const [queue] = currentTask.value.queues;
        // const queue = 'atxcloud_liya_gene';
        const args = (!props.query.public) ? [filename.value, selectedGenes.value, highlightIds.value] : [(geneMotif.value) ? filenameMotif.value : filename.value, selectedGenes.value, highlightIds.value];
        if (!props.query.public) {
          const existingCookie = readCookie();
          const split = existingCookie?.token.split('JWT ')[1];
          const motifHold = filename.value!.replace(/genes/i, 'motifs');
          const hold = filename.value!.replace(/motifs/i, 'genes');
          filename.value = hold;
          const { encoded: filenameToken } = await client.value.encodeLink({ args: [filename.value], meta: { run_id: runId.value } });
          const { encoded: filenameTokenMotif } = await client.value.encodeLink({ args: [motifHold], meta: { run_id: runId.value } });
          const { host } = window.location;
          publicLink.value = `http://${host}/public?component=PublicGeneViewer&run_id=${filenameToken}motif${filenameTokenMotif}&public=true&token=JWT%20${split}`;
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
          snackbar.dispatch({ text: 'Worker failed', options: { right: true, color: 'error' } });
          loading.value = false;
          return;
        }
        progressMessage.value = taskStatus.value.status;
        const resp = taskStatus.value.result;
        currentViewType.value = stype;
        spatialData.value = resp;
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
        await updateCircles();
        await fitStageToParent();
        loading.value = false;
        spatialRun.value = false;
      } catch (error) {
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: error, options: { right: true, color: 'error' } });
      }
    }
    async function selectAction(ev: any) {
      const root = 'data';
      if (props.query.public) {
        const mid = ev.id.search(/motif/i);
        const end = ev.id.length;
        const fn = ev.id.slice(0, mid);
        const fn2 = ev.id.slice(mid + 5, end);
        filename.value = fn;
        filenameMotif.value = fn2;
      } else {
        const fn = (!geneMotif.value) ? `${root}/${ev.id}/h5/obj/genes.h5ad` : `${root}/${ev.id}/h5/obj/motifs.h5ad`;
        filename.value = fn;
        filenameMotif.value = '';
        runId.value = ev.id;
        pushByQuery({ component: 'AtlasG', run_id: ev.id });
        selectedGenes.value = [];
      }
      await runSpatial(currentViewType.value);
      await loadExpressions();
      runIdFlag.value = false;
      selectedGenes.value = [];
      isClusterView.value = true;
      isDrawing.value = false;
      isDrawingRect.value = false;
      stepArray.value = [];
      /* const task = 'creation.create_files';
      const queue = 'creation_atlasbrowser';
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
        slimsData = await client.value!.getMetadataFromRunId(`${runId.value}`);
        params.data = slimsData;
        const taskObject = await client.value!.postTask(task, args, kwargs, queue);
        await checkTaskStatus(taskObject._id);
        while (taskStatus.value.status !== 'SUCCESS' && taskStatus.value.status !== 'FAILURE') {
          progressMessage.value = `${taskStatus.value.progress}% - ${taskStatus.value.position}`;
          await new Promise((r) => {
            taskTimeout.value = window.setTimeout(r, 1000);
          });
          taskTimeout.value = null;
          await checkTaskStatus(taskObject._id);
        } *//*
        eslint-disable no-await-in-loop *//*
        if (taskStatus.value.status !== 'SUCCESS') {
          snackbar.dispatch({ text: 'Worker failed', options: { right: true, color: 'error' } });
          loading.value = false;
          return;
        }
        loading.value = false;
      } else slimsData = jsonBoolean;
      loading.value = false; */
      const slimsData = await client.value!.getMetadataFromRunId(`${runId.value}`);
      metadata.value.organ = slimsData.Organ;
      metadata.value.species = slimsData.Species;
      metadata.value.type = slimsData['Tissue type'];
    }
    function onResize() {
      fitStageToParent();
    }
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
          runSpatial('spatial');
        }
      }
      if (isDrawingRect.value) {
        isClicked.value = false;
        regions.value.push(deepCopy(rectangle.value));
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial('spatial');
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
          runSpatial('spatial');
        }
      }
      if (isDrawingRect.value) {
        isClicked.value = false;
        regionsUMAP.value.push(deepCopy(rectangleUMAP.value));
        highlightRegion();
        if (highlightCount.value > 0) {
          runSpatial('spatial');
        }
      }
    }
    async function mouseOverClusterItem(ev: any) {
      highlightCluster(ev.name);
      clusterFlag.value = false;
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
    const GeneAutoCompleteClass = Vue.extend(GeneAutoComplete);
    const acInstance = new GeneAutoCompleteClass({
      vuetify,
      propsData: { gene_list: genes, gene_button: geneButton },
      created() {
        this.$on('changed', (ev: any[]) => {
          selectedGenes.value = ev;
        });
        this.$on('flag', (ev: any) => {
          showFlag.value = [ev];
        });
        this.$on('track', (ev: any) => {
          trackBrowserGenes.value = [ev];
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
    watch(scale, () => {
      reScale();
    });
    watch(geneMotif, (v: any) => {
      if (v) {
        featureTableFlag.value = true;
        peakViewerFlag.value = false;
      }
      isClusterView.value = true;
      selectedGenes.value = [];
      showFlag.value = [false];
      stepArray.value = [];
      geneButton.value = [];
      // updateCircles();
      runSpatial('spatial');
    });
    watch(scaleUMAP, () => {
      reScaleUMAP();
    });
    watch(currentTask, (v: any) => {
      runSpatial(currentViewType.value);
    });
    watch(isDrawing, (v: boolean) => {
      setDraggable(!v);
      removeRegions();
      if (!isDrawing.value) {
        colorOnOff.value = 'black';
        unHighlighCluster();
      } else {
        colorOnOff.value = 'green';
      }
    });
    watch(isDrawingRect, (v: boolean) => {
      setDraggable(!v);
      removeRegions();
      if (!isDrawingRect.value) {
        colorOnOffRect.value = 'black';
        unHighlighCluster();
      } else {
        colorOnOffRect.value = 'green';
      }
    });
    watch(selectedGenes, (v: any[]) => {
      if (selectedGenes.value.length === 0) {
        isClusterView.value = true;
        showFlag.value = [false];
        stepArray.value = [];
        updateCircles();
        trackBrowserGenes.value = [];
      } else {
        isDrawing.value = false;
        isDrawingRect.value = false;
        removeRegions();
      }
    });
    watch(showFlag, (v: any[]) => {
      const bool = v[0];
      if (bool) {
        isClusterView.value = false;
        runSpatial('spatial');
        trackBrowserGenes.value = [selectedGenes.value[selectedGenes.value.length - 1]];
      } else {
        geneButton.value = [];
        spatialRun.value = true;
      }
    });
    watch(searchInput, (v: any) => {
      if (v) {
        querySelections(v);
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
      fitStageToParent();
      tooltip.add(tooltipTag);
      tooltip.add(tooltipText);
      tooltipRight.add(tooltipTagRight);
      tooltipRight.add(tooltipTextRight);
      (ctx.refs.annotationLayer as any).getNode().add(tooltip);
      (ctx.refs.annotationLayerRight as any).getNode().add(tooltipRight);
      if (props.query) {
        if (!props.query.public) {
          // loadCandidateWorkers('AtlasGX');
          currentTask.value = { task: 'gene.compute_qc', queues: ['atxcloud_gene'] };
          await fetchFileList();
        } else {
          currentTask.value = { task: 'gene.compute_qc', queues: ['atxcloud_gene'] };
        }
      }
      if (props.query) {
        if (props.query.run_id) {
          await selectAction({ id: props.query.run_id });
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
      progressMessage,
      selectAction,
      workers,
      candidateWorkers,
      // loadCandidateWorkers,
      currentTask,
      highestCount,
      lowestCount,
      makearray,
      stepArray,
      topHeaders,
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
      sendGene,
      lengthClust,
      colorBar,
      colorBarmap,
      showFlag,
      runIdFlag,
      backgroundFlag,
      chooseBackground,
      chooseHeatmap,
      heatmapFlag,
      clusterFlag,
      lassoSide,
      colorOnOff,
      colorOnOffRect,
      colorbarText,
      highlightIds,
      topSelected,
      listId,
      pointInPolygon,
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
</style>
