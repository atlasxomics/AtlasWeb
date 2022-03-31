<template>
  <v-app>
    <v-container fluid :style="{ 'background-color': backgroundColor, 'height': '100%', 'padding': '0' }">
      <v-row>
        <v-col cols="12" sm="12">
          <template v-if="!query.public && runIdFlag">
            <v-dialog
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
                item-key="id_with_tag"
                :items="items"
                :headers="headers"
                sort-by="id_with_tag"
                @click:row="selectAction"
                />
              </v-card>
            </v-dialog>
          </template>
          <template v-if="backgroundFlag">
            <v-dialog
              :value="backgroundFlag"
              @click:outside="backgroundFlag = !backgroundFlag"
              hide-overlay>
              <v-card style="width:100px;position: absolute;z-index: 999;top:40px;left:130px;">
                <v-data-table
                v-model="selected"
                height="13vh"
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
          </template>
          <template v-if="heatmapFlag">
            <v-dialog
              :value="heatmapFlag"
              @click:outside="heatmapFlag = !heatmapFlag"
              hide-overlay>
              <v-card style="width:100px;position: absolute;z-index: 999;top:40px;left:200px;">
                <v-data-table
                v-model="selected"
                height="19vh"
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
          </template>
          <template>
          <v-card flat :style="{ 'width': '450px', 'left':searchgenePlace }">
            <v-autocomplete
              v-model="selectedGenes"
              :items="filteredGenes"
              :outlined="false"
              multiple
              dense
              clearable
              placeholder=""
              label="Enter gene ID:"
              :allow-overflow="false"
              chips
              :cache-items="false"
              color="blue-grey lighten-2"
              item-text="name"
              item-value="name"
              @input="acInputChanged"
              :search-input.sync="searchInput"
              :loading="autocompleteLoading"
              :disabled="!filename || loading"
              @change="onGenelistChanged"
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
              <template v-slot:append-outer v-if="selectedGenes.length > 0">
                <v-btn
                  color="primary"
                  large
                  text
                  :disabled="!filename || loading"
                  @click="runSpatial('spatial');showFlag=true"
                  >Show</v-btn>
              </template>
            </v-autocomplete>
          </v-card>
          </template>
        </v-col>
        <v-col cols="2" sm="1">
          <v-card :style="{ 'margin-left': '5px', 'width': '83px', 'min-width': '83px', 'height':'250px', 'padding-top': '15px', 'background-color': 'silver' }" flat>
            <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
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
            <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
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
                v-bind="attrs"
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
            <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              class="ml-4 mt-5"
              v-model="isDrawing"
              :disabled="!spatialData || loading"
              @click="captureScreen"
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
                class="ml-4 mt-5"
                small
                v-clipboard:copy="publicLink">
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>
            </template>
            <span>Copy Public Llink</span>
            </v-tooltip>
          </v-card>
        </v-col>
        <v-col cols="11" md="10">
          <div id="screenCapture">
          <v-row>
            <v-col cols="11" sm="5">
              <v-card id="stageParent"
                flat
                v-resize="onResize"
                :style="{ 'background-color': backgroundColor, 'overflow-x': 'None'}"
                height="48vh"
                align="center">
                <v-btn
                  v-model="scale"
                  color="white"
                  :disabled="!spatialData"
                  @click="scale *= 1.1"
                  x-small>
                  <v-icon>mdi-plus</v-icon>
                </v-btn>&nbsp;
                <v-btn
                  v-model="scale"
                  color="white"
                  :disabled="!spatialData"
                  @click="scale *= 0.9"
                  x-small>
                  <v-icon>mdi-minus</v-icon>
                </v-btn>
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
            </v-col>
          <v-col cols="11" sm="1">
          <template v-if="!isClusterView && showFlag">
            <v-card :style="{ 'background-color': backgroundColor }" flat>
              <div :style="{ 'color':colorbarText, 'font-size':'22px' }">
                <div :style="{ 'background-image': colorBarmap, 'width':'30px','height':'340px','margin-top':'75px','float':'left'}" >
                </div>
                <div style="width:40px;float:left;height:300px;">
                  <p style="position:absolute;top:55px;transform:rotate(-45deg);padding:5px;"> {{stepArray[4]}} </p>
                  <p style="position:absolute;top:130px;transform:rotate(-45deg);padding:5px;"> {{stepArray[3]}} </p>
                  <p style="position:absolute;top:220px;transform:rotate(-45deg);padding:5px;"> {{stepArray[2]}} </p>
                  <p style="position:absolute;top:295px;transform:rotate(-45deg);padding:5px;"> {{stepArray[1]}} </p>
                  <p style="position:absolute;top:380px;transform:rotate(-45deg);padding:5px;"> {{stepArray[0]}} </p>
                </div>
              </div>
            </v-card>
          </template>
          </v-col>
            <v-col cols="11" sm="5">
              <v-card id="stageParentRight"
                flat
                v-resize="onResize"
                :style="{ 'background-color': backgroundColor, 'overflow-x': 'None' }"
                @mousedown="mouseDownOnStageRight"
                @mousemove="mouseMoveOnStageRight"
                @mouseup="mouseUpOnStageRight"
                height="48vh"
                align="center">
                <v-btn
                  v-model="scale"
                  color="white"
                  :disabled="!spatialData"
                  @click="scaleUMAP *= 1.1"
                  x-small>
                  <v-icon>mdi-plus</v-icon>
                </v-btn>&nbsp;
                <v-btn
                  v-model="scale"
                  color="white"
                  :disabled="!spatialData"
                  @click="scaleUMAP *= 0.9"
                  x-small>
                  <v-icon>mdi-minus</v-icon>
                </v-btn>
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
            </v-col>
          </v-row>
          </div>
          <v-card v-if="clusterItems" :disabled="loading">
              <v-data-table
                height="35vh"
                dense
                :items-per-page="999"
                hide-default-footer
                :loading="loading"
                :items="geneNames"
                :headers="topHeaders"
              >
              <template v-slot:item="row">
                <tr>
                  <td>{{row.item['id']}}</td>
                  <td v-for="num in lengthClust" :key="num.toString()"><v-btn text x-small dense @click="sendGene(row.item['C'+num])">{{row.item['C'+num]}}</v-btn></td>
                </tr>
              </template>
              </v-data-table>
          </v-card>
        </v-col>
          <v-card v-if="isClusterView && spatialData" :style="{ 'background-color': backgroundColor }" flat>
            <v-data-table
              width="10vw"
              v-model="selected"
              dense
              :items-per-page="lengthClust"
              hide-default-footer
              :items="clusterItems"
              :headers="clusterHeaders"
              sort-by="name"
              @click:row="mouseOverClusterItem"
            >
            <template v-slot:item.name="{ item }">
              <span>{{ item.name }} </span>
              <v-chip
                :color="clusterColors[Number(item.name.toString().replace('C', '')) - item.name.toString().split('C').length + 2]"
                small>{{ item.name }}</v-chip>
            </template>
            </v-data-table>
          </v-card>
      </v-row>
    </v-container>
  </v-app>
</template>

<script lang='ts'>
import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import Konva from 'konva';
import lodash from 'lodash';
import colormap from 'colormap';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { get_uuid, generateRouteByQuery, splitarray, deepCopy } from '@/utils';
import { Console } from 'console';
import html2canvas from 'html2canvas';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});
const headers = [
  { text: 'ID', value: 'id_with_tag' },
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
    const runId = ref<string | null>(null);
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
    const clusterItems = ref<any[]>();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const searchgenePlace = ref<string>(`${Math.abs(width / 2)}px`);
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
    const polygon = ref<any>({ x: 0, y: 0, points: [], opacity: 0.8, closed: true, fill: 'white', stroke: 'white', strokeWidth: 1 });
    const polygonUMAP = ref<any>({ x: 0, y: 0, points: [], opacity: 0.8, closed: true, fill: 'white', stroke: 'white', strokeWidth: 1 });
    const rectangle = ref<any>({ x: 0, y: 0, width: 0, height: 0, opacity: 0.8, fill: 'white', stroke: 'white', strokeWidth: 1, endPointx: 0, endPointy: 0 });
    const rectangleUMAP = ref<any>({ x: 0, y: 0, width: 0, height: 0, opacity: 0.8, fill: 'white', stroke: 'white', strokeWidth: 1, endPointx: 0, endPointy: 0 });
    const regions = ref<any>();
    const regionsUMAP = ref<any[]>([]);
    const regionRect = ref<any[]>([]);
    const regionRectUMAP = ref<any[]>([]);
    const lengthClust = ref<number>(0);
    const colorBar = ref<any[]>([]);
    const showFlag = ref<boolean>(false);
    const runIdFlag = ref<boolean>(false);
    const backgroundFlag = ref<boolean>(false);
    const heatmapFlag = ref<boolean>(false);
    const clusterFlag = ref<boolean>(false);
    const autoCompleteFlag = ref<boolean>(false);
    const listId = ref<boolean>(false);
    const lassoSide = ref<string>();
    const colorOnOff = ref<string>('');
    const colorOnOffRect = ref<string>('');
    const colorbarText = ref<string>('white');
    const highlightIds = ref<any[]>([]);
    const topSelected = ref<any[]>([]);
    const highlightCount = ref<number>(0);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    function resetPolygon() {
      polygon.value.points = [];
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
      searchgenePlace.value = `${Math.abs(window.innerWidth / 2.9)}px`;
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
      pom.setAttribute('download', `${currentRunId.value}/Selection.txt`);
      pom.click();
    }
    function captureScreen() {
      const holder = colorbarText.value;
      colorbarText.value = 'black';
      setTimeout(() => {
        html2canvas(document.getElementById('screenCapture')!).then((canvas) => {
          const base64image = canvas.toDataURL('image/png');
          // const win = window.open();
          // win!.document.write(`<div style="background-repeat:no-repeat;height:${window.innerHeight};width:100%;background-size:contain;background-image:url(${base64image})"></div>`);
          colorbarText.value = holder;
          const pom = document.createElement('a');
          pom.href = base64image;
          const listGene = selectedGenes.value.join();
          pom.setAttribute('download', `${currentRunId.value}/${listGene}.png`);
          pom.click();
        });
      }, 1000);
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
      const steps = 5;
      const step = (stopValue - startValue) / (steps - 1);
      for (let i = 0; i < steps; i += 1) {
        arr.push(Math.round((startValue + (step * i)) * 10) / 10);
      }
      stepArray.value = arr;
    }
    function sendGene(ev: any) {
      if (!selectedGenes.value.includes(ev)) {
        searchInput.value = ev;
        selectedGenes.value.push(ev);
      }
      isClusterView.value = false;
    }
    async function loadExpressions() {
      if (!client.value) return;
      if (!filename.value) return;
      const resp = props.query.public ? await client.value.getGeneExpressionsByToken(filename.value) : await client.value.getGeneExpressions(filename.value);
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
        } else {
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
      if (ev.background === 'white') {
        colorbarText.value = 'black';
      } else {
        colorbarText.value = 'white';
      }
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
      const colors_raw = colormap({ colormap: heatMap.value, nshades: (numClusters + 1) * 3, format: 'hex', alpha: 1 });
      const colors: any[] = [];
      colors_raw.forEach((v: any, i: number) => {
        if ((i % 3) === 0) colors.push(v);
      });
      clusterColors.value = colors;
      const colors_intensity = colormap({ colormap: heatMap.value, nshades: 64, format: 'hex', alpha: 1 });
      colorBar.value = colors_intensity;
      colorBarmap.value = `linear-gradient( ${colors_intensity[63]}, ${colors_intensity[48]}, ${colors_intensity[32]} , ${colors_intensity[16]}, ${colors_intensity[0]})`;
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
          const vv = Number(v.replace('C', '')) - v.split('C').length + 2;
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
          const vv = Number(v.replace('C', '')) - v.split('C').length + 2;
          const c = {
            id: get_uuid(),
            x: x * scaleUMAP.value * viewScaleUMAP + paddingX,
            y: y * scaleUMAP.value * viewScaleUMAP + paddingY,
            radius: radiusUMAP,
            originalColor: colors[vv],
            fill: colors[vv],
            stroke: colors[vv],
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
      const qc_data = filelist.map((v: string) => ({ id: `${v.split('/')[1]}`, tag: 'Genes', id_with_tag: `${v.split('/')[1]}-Genes` }));
      const fl_payload_motif = { params: { path: 'data', filter: 'obj/motifs.h5ad' } };
      const filelist_motif = await client.value.getFileList(fl_payload_motif);
      const qc_data_motif = filelist_motif.map((v: string) => ({ id: `${v.split('/')[1]}`, tag: 'Motifs', id_with_tag: `${v.split('/')[1]}-Motifs` }));
      items.value = qc_data.concat(...qc_data_motif);
      loading.value = false;
    }
    async function runSpatial(stype: string) {
      if (!client.value) return;
      if (!filename.value) return;
      try {
        progressMessage.value = null;
        loading.value = true;
        await loadExpressions();
        const { task } = currentTask.value;
        const [queue] = currentTask.value.queues;
        // const queue = 'atxcloud_liya_gene';
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
      } catch (error) {
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: error, options: { right: true, color: 'error' } });
      }
    }
    async function selectAction(ev: any) {
      if (props.query.public) {
        const fn = ev.id;
        filename.value = fn;
      } else {
        const root = 'data';
        const fn = ev.tag === 'Genes' ? `${root}/${ev.id}/h5/obj/genes.h5ad` : `${root}/${ev.id}/h5/obj/motifs.h5ad`;
        filename.value = fn;
        currentRunId.value = ev.id;
        pushByQuery({ component: 'AtlasG', run_id: ev.id, tag: ev.tag });
        selectedGenes.value = [];
      }
      await runSpatial(currentViewType.value);
      runIdFlag.value = false;
      selectedGenes.value = [];
      isClusterView.value = true;
      isDrawing.value = false;
      isDrawingRect.value = false;
      stepArray.value = [];
    }
    function onResize() {
      fitStageToParent();
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
    function mouseDownOnStageLeft(ev: any) {
      if (isDrawing.value) {
        lassoSide.value = 'left';
        regionsUMAP.value = [];
        polygonUMAP.value.points = [];
        regions.value = [];
        polygon.value.points = [];
        highlightRegion();
        isClicked.value = true;
        polygon.value = { x: 0, y: 0, id: get_uuid(), points: [], opacity: 0.6, listening: true, closed: true, fill: '', stroke: 'black', strokeWidth: 3 };
        polygon.value.points = [];
      }
      if (isDrawingRect.value) {
        lassoSide.value = 'left';
        regionsUMAP.value = [];
        polygonUMAP.value.points = [];
        regions.value = [];
        polygon.value.points = [];
        const mousePos = (ctx as any).refs.konvaStage.getNode().getRelativePointerPosition();
        rectangle.value = { x: mousePos.x, y: mousePos.y, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'black', strokeWidth: 3, endPointx: 0, endPointy: 0 };
        rectangleUMAP.value = { x: 0, y: 0, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'black', strokeWidth: 3, endPointx: 0, endPointy: 0 };
        highlightRegion();
        isClicked.value = true;
      }
    }
    function mouseDownOnStageRight(ev: any) {
      if (isDrawing.value) {
        lassoSide.value = 'right';
        regionsUMAP.value = [];
        polygonUMAP.value.points = [];
        regions.value = [];
        polygon.value.points = [];
        highlightRegion();
        isClicked.value = true;
        polygonUMAP.value = { x: 0, y: 0, id: get_uuid(), points: [], opacity: 0.6, listening: true, closed: true, fill: '', stroke: 'black', strokeWidth: 3 };
        polygonUMAP.value.points = [];
      }
      if (isDrawingRect.value) {
        lassoSide.value = 'right';
        regionsUMAP.value = [];
        polygonUMAP.value.points = [];
        regions.value = [];
        polygon.value.points = [];
        const mousePos = (ctx as any).refs.konvaStageRight.getNode().getRelativePointerPosition();
        rectangleUMAP.value = { x: mousePos.x, y: mousePos.y, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'black', strokeWidth: 3, endPointx: 0, endPointy: 0 };
        rectangle.value = { x: 0, y: 0, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'black', strokeWidth: 3, endPointx: 0, endPointy: 0 };
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
    // Drawing Region ends
    async function mouseOverClusterItem(ev: any) {
      highlightCluster(ev.name);
      clusterFlag.value = false;
    }
    function removeRegions(ev: any) {
      isDrawing.value = false;
      isDrawingRect.value = false;
      regionsUMAP.value = [];
      polygonUMAP.value.points = [];
      regions.value = [];
      polygon.value.points = [];
      highlightRegion();
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
    function reScale(scaleRatio: number) {
      updateCircles();
      polygon.value.points = polygon.value.points.map((c: number) => c * scaleRatio);
      rectangle.value.x *= scaleRatio;
      rectangle.value.endPointx *= rectangle.value.endPointx * scaleRatio;
      rectangle.value.y *= rectangle.value.y * scaleRatio;
      rectangle.value.endPointy *= rectangle.value.endPointy * scaleRatio;
    }
    function reScaleUMAP(scaleRatio: number) {
      updateCircles();
      polygonUMAP.value.points = polygonUMAP.value.points.map((c: number) => c * scaleRatio);
      rectangleUMAP.value.x *= rectangleUMAP.value.x * scaleRatio;
      rectangleUMAP.value.endPointx *= rectangleUMAP.value.endPointx * scaleRatio;
      rectangleUMAP.value.y *= rectangleUMAP.value.y * scaleRatio;
      rectangleUMAP.value.endPointy *= rectangleUMAP.value.endPointy * scaleRatio;
    }
    async function onGenelistChanged(ev: any) {
      if (selectedGenes.value.length > 0) {
        isClusterView.value = false;
      } else {
        isClusterView.value = true;
      }
    }
    watch(scale, (v: number, ov: number) => {
      if (ov >= 0.2 && ov <= 1.2) {
        const scaleRatio = v / ov;
        reScale(scaleRatio);
      }
    });
    watch(scaleUMAP, (v: number, ov: number) => {
      if (ov >= 0.2 && ov <= 1.2) {
        const scaleRatio = v / ov;
        reScaleUMAP(scaleRatio);
      }
    });
    watch(currentTask, (v: any) => {
      runSpatial(currentViewType.value);
    });
    watch(isDrawing, (v: boolean) => {
      setDraggable(!v);
      regions.value = [];
      polygon.value.points = [];
      rectangle.value = { x: 0, y: 0, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'black', strokeWidth: 3, endPointx: 0, endPointy: 0 };
      rectangleUMAP.value = { x: 0, y: 0, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'black', strokeWidth: 3, endPointx: 0, endPointy: 0 };
      if (!isDrawing.value) {
        colorOnOff.value = '';
        unHighlighCluster();
      } else {
        colorOnOff.value = 'green';
      }
    });
    watch(isDrawingRect, (v: boolean) => {
      setDraggable(!v);
      regions.value = [];
      polygon.value.points = [];
      rectangle.value = { x: 0, y: 0, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'black', strokeWidth: 3, endPointx: 0, endPointy: 0 };
      rectangleUMAP.value = { x: 0, y: 0, id: get_uuid(), width: 0, height: 0, points: [], opacity: 0.6, fill: '', stroke: 'black', strokeWidth: 3, endPointx: 0, endPointy: 0 };
      if (!isDrawingRect.value) {
        colorOnOffRect.value = '';
        unHighlighCluster();
      } else {
        colorOnOffRect.value = 'green';
      }
    });
    watch(selectedGenes, (v: any[]) => {
      if (selectedGenes.value.length === 0) {
        isClusterView.value = true;
        showFlag.value = false;
        stepArray.value = [];
        updateCircles();
      } else {
        removeRegions('');
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
    ];
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(submenu);
      fitStageToParent();
      (ctx.refs.annotationLayer as any).getNode().add(tooltip);
      (ctx.refs.annotationLayerRight as any).getNode().add(tooltipRight);
      if (props.query) {
        if (!props.query.public) {
          loadCandidateWorkers('AtlasGX');
          await fetchFileList();
        } else {
          currentTask.value = { task: 'gene.compute_qc', queues: ['atxcloud_gene'] };
        }
      }
      if (props.query) {
        if (props.query.run_id && props.query.tag) {
          await selectAction({ id: props.query.run_id, tag: props.query.tag });
        }
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
      onGenelistChanged,
      heatMap,
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
      regionRect,
      regionRectUMAP,
      removeRegions,
      reScale,
      reScaleUMAP,
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
      searchgenePlace,
    };
  },
});
</script>

<style>
</style>
