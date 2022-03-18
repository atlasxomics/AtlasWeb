<template>
  <v-app>
    <v-container fluid :style="{ 'background-color': backgroundColor, 'height': '100%', 'padding': '0' }">
      <v-row>
        <v-col cols="12" sm="12">
            <v-card tag="runid" style="width:200px;position: absolute;z-index: 999;top:70px;left:20px;"
              v-if="!query.public && runIdFlag"
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
            <v-card style="width:100px;position: absolute;z-index: 999;top:70px;left:180px;"
            v-if="backgroundFlag">
              <v-data-table
              v-model="selected"
              height="13vh"
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
            <v-card style="width:100px;position: absolute;z-index: 999;top:70px;left:270px;"
            v-if="heatmapFlag">
              <v-data-table
              v-model="selected"
              height="19vh"
              width="20%"
              dense
              single-select
              hide-default-footer
              hide-default-header
              :disabled="!spatialData"
              :items="heatmapOptions"
              :headers="heatmapHeader"
              @click:row="chooseHeatmap"
              />
            </v-card>
            <v-card style="width:100px;position: absolute;z-index: 999;top:70px;left:400px;"
            v-if="clusterFlag">
              <v-data-table
              v-model="selected"
              height="19vh"
              width="35px"
              dense
              single-select
              hide-default-footer
              :items="clusterItems"
              :headers="clusterHeaders"
              sort-by="name"
              @click:row="mouseOverClusterItem">
              <template v-slot:item.name="{ item }">
                <span>{{ item.name }} :</span>
                <v-chip
                  :color="clusterColors[Number(item.name.toString().replace('C', '')) - item.name.toString().split('C').length + 2]"
                  small>
                  {{ item.name }}
                </v-chip>
              </template>
              </v-data-table>
            </v-card>
            <v-card flat>
              <v-autocomplete
                v-model="selectedGenes"
                :items="filteredGenes"
                :outlined="false"
                multiple
                dense
                placeholder=""
                label="Enter gene ID:"
                style="padding-left:65vw;padding-right:10px;padding-top:15px"
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
                    small
                    text
                    :disabled="!filename"
                    @click="runSpatial('spatial');showFlag=true"
                    >Show</v-btn>
                </template>
              </v-autocomplete>
              <v-tooltip :disabled="runIdFlag" bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    :disabled="loading"
                    v-bind="attrs"
                    v-on="on"
                    small
                    class="mt-n16 ml-15"
                    @click="runIdFlag = !runIdFlag;dropDownFlag = true">
                  <v-icon>mdi-magnify</v-icon>
                  </v-btn>
                </template>
                <span>Run ID's</span>
              </v-tooltip>
              <v-tooltip :disabled="backgroundFlag" bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    :disabled="!spatialData || loading"
                    v-bind="attrs"
                    v-on="on"
                    small
                    class="mt-n16 ml-10"
                    @click="backgroundFlag = !backgroundFlag;dropDownFlag = true">
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
                    small
                    class="mt-n16 ml-10"
                    @click="heatmapFlag = !heatmapFlag;dropDownFlag = true">
                  <v-icon>mdi-fire</v-icon>
                  </v-btn>
                </template>
                <span>Heatmap</span>
              </v-tooltip>
              <v-tooltip :disabled="clusterFlag" bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    v-bind="attrs"
                    :disabled="!spatialData || loading"
                    v-on="on"
                    small
                    class="mt-n16 ml-10"
                    @click="clusterFlag = !clusterFlag;dropDownFlag = true">Clusters
                  </v-btn>
                </template>
                <span>Clusters</span>
              </v-tooltip>
          </v-card>
        </v-col>
        <v-col cols="2" sm="1">
          <v-card style="width:80px;height:250px" flat>
            <v-btn
              class="ml-4"
              v-model="isDrawing"
              :disabled="!spatialData"
              :color="colorOnOff"
              small
              @click="isDrawing = !isDrawing">
              <v-icon>mdi-lasso</v-icon>
            </v-btn>
            <v-btn
              class="ml-4 mt-5"
              v-model="isDrawing"
              :disabled="!spatialData"
              :color="colorOnOffRect"
              small>
              <v-icon>mdi-select</v-icon>
            </v-btn>
            <v-btn
              class="ml-1 mt-5"
              v-model="isDrawing"
              :disabled="!spatialData || !isDrawing"
              small>
            View C
            </v-btn>
            <v-btn
              class="ml-1 mt-5"
              v-model="isDrawing"
              :disabled="!spatialData"
              small>
            Save P
            </v-btn>
            <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                class="ml-4 mt-5"
                v-on="on"
                small
                v-clipboard:copy="publicLink">
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>
            </template>
            <span>Copy Public Llink</span>
            </v-tooltip>
          </v-card>
        </v-col>
        <v-col cols="11" sm="10">
          <v-row>
            <v-col cols="11" sm="6">
              <v-card id="stageParent"
                flat
                v-resize="onResize"
                :style="{ 'background-color': backgroundColor, 'overflow-x': 'None' }"
                height="48vh">
                <v-btn
                v-model="scale"
                color="white"
                :disabled="!spatialData"
                @click="scale += .05"
                x-small>
                <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-btn
                v-model="scale"
                color="white"
                :disabled="!spatialData"
                @click="scale -= .05"
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
                </v-stage>
              </v-card>
            </v-col>
            <v-col cols="11" sm="6">
              <v-card id="stageParentRight"
                flat
                v-resize="onResize"
                :style="{ 'background-color': backgroundColor, 'overflow-x': 'None' }"
                @mousedown="mouseDownOnStageRight"
                @mousemove="mouseMoveOnStageRight"
                @mouseup="mouseUpOnStageRight"
                height="48vh">
                <v-btn
                v-model="scaleUMAP"
                color="white"
                :disabled="!spatialData"
                @click="scaleUMAP += .05"
                x-small>
                <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-btn
                v-model="scaleUMAP"
                color="white"
                :disabled="!spatialData"
                @click="scaleUMAP -= .05"
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
                </v-stage>
              </v-card>
            </v-col>
          </v-row>
          <v-row>
          </v-row>
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
              <template v-slot:item="row">
                <tr>
                  <td>{{row.item['id']}}</td>
                  <td v-for="num in lengthClust" :key="num.toString()"><v-btn text x-small dense @click="sendGene(row.item['C'+num])">{{row.item['C'+num]}}</v-btn></td>
                </tr>
              </template>
              </v-data-table>
          </v-card>
        </v-col>
         <template v-if="!isClusterView && showFlag">
          <v-card :style="{ 'background-color': backgroundColor }" flat>
            <div :style="{ 'color':colorbarText, 'font-size':'22px' }">
              <div :style="{ 'background-image': colorBarmap, 'width':'30px','height':'340px','margin-top':'60px','float':'left'}" >
              </div>
              <div style="width:40px;float:left;height:300px;">
                <p style="position:absolute;top:40px;transform:rotate(-45deg);padding:5px;"> {{stepArray[4]}} </p>
                <p style="position:absolute;top:125px;transform:rotate(-45deg);padding:5px;"> {{stepArray[3]}} </p>
                <p style="position:absolute;top:210px;transform:rotate(-45deg);padding:5px;"> {{stepArray[2]}} </p>
                <p style="position:absolute;top:290px;transform:rotate(-45deg);padding:5px;"> {{stepArray[1]}} </p>
                <p style="position:absolute;top:365px;transform:rotate(-45deg);padding:5px;"> {{stepArray[0]}} </p>
              </div>
            </div>
          </v-card>
        </template>
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
    const clusterItems = ref<any[] | null>(null);
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
    const isClicked = ref<boolean>(false);
    const polygon = ref<any>({ x: 0, y: 0, points: [], opacity: 0.8, closed: true, fill: 'white', stroke: 'white', strokeWidth: 1 });
    const polygonUMAP = ref<any>({ x: 0, y: 0, points: [], opacity: 0.8, closed: true, fill: 'white', stroke: 'white', strokeWidth: 1 });
    const regions = ref<any[]>([]);
    const regionsUMAP = ref<any[]>([]);
    const lengthClust = ref<number>(0);
    const colorBar = ref<any[]>([]);
    const showFlag = ref<boolean>(false);
    const runIdFlag = ref<boolean>(false);
    const backgroundFlag = ref<boolean>(false);
    const heatmapFlag = ref<boolean>(false);
    const clusterFlag = ref<boolean>(false);
    const dropDownFlag = ref<boolean>(false);
    const lassoSide = ref<string>();
    const colorOnOff = ref<string>('');
    const colorOnOffRect = ref<string>('');
    const colorbarText = ref<string>('white');
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
    function closeDropDowns(ev: any) {
      console.log(ev);
    }
    function chooseBackground(ev: any) {
      backgroundColor.value = ev.background;
      if (ev.background === 'white') {
        colorbarText.value = 'black';
      } else {
        colorbarText.value = 'white';
      }
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
    function highlightRegion() {
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
      if (hitCount < 1) {
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
          circlesSpatial.value[idx].fill = 'white';
          circlesSpatial.value[idx].stroke = 'white';
          circlesSpatialUMAP.value[idx].fill = 'white';
          circlesSpatialUMAP.value[idx].stroke = 'white';
        }
      });
    }
    async function updateCircles() {
      if (!spatialData.value) return;
      regions.value = [];
      polygon.value.points = [];
      regionsUMAP.value = [];
      polygonUMAP.value.points = [];
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
      const viewScale = Math.min(stageWidth / (maxX - minX), stageHeight / (maxY - minY));
      const viewScaleUMAP = Math.min(stageWidth / (maxX_UMAP - minX_UMAP), stageHeight / (maxY_UMAP - minY_UMAP));
      const [paddingX, paddingY] = [10, 10];
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
            genes: { },
          };
          lodash.forIn(spatialData.value.genes, (val: number[], k: string) => {
            (c.genes as any)[k] = val[i];
          });
          circles.push(c);
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
            x: x * scaleUMAP.value * viewScaleUMAP + paddingY,
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
      const qc_data = filelist.map((v: string) => ({ id: `${v.split('/')[1]}/${v.split('/')[2]}` }));
      items.value = qc_data;
      loading.value = false;
    }
    async function runSpatial(stype: string) {
      console.log(ctx);
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
        const taskObject = props.query.public ? await client.value.postPublicTask(task, args, kwargs, 'joshua_gene') : await client.value.postTask(task, args, kwargs, 'joshua_gene');
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
        const fn = `${root}/${ev.id}/h5/obj/genes.h5ad`;
        filename.value = fn;
        currentRunId.value = ev.id;
        pushByQuery({ component: 'AtlasG', run_id: ev.id });
        selectedGenes.value = [];
      }
      await runSpatial(currentViewType.value);
      selectedGenes.value = [];
      isClusterView.value = true;
      isDrawing.value = false;
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
      if (isClusterView.value && item.cluster !== highlightedCluster.value && !isDrawing.value) {
        const { cluster } = item;
        highlightCluster(cluster);
      }
    }
    async function mouseOutOnSpatial(ev: any) {
      isHighlighted.value = false;
      tooltip.hide();
      tooltipRight.hide();
      if (!isDrawing.value) unHighlighCluster();
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
      if (isClusterView.value && item.cluster !== highlightedCluster.value && !isDrawing.value) {
        const { cluster } = item;
        highlightCluster(cluster);
      }
    }
    async function mouseOutOnSpatialRight(ev: any) {
      isHighlighted.value = false;
      tooltip.hide();
      tooltipRight.hide();
      if (!isDrawing.value) unHighlighCluster();
    }
    // Drawing Region
    function mouseDownOnStageLeft(ev: any) {
      if (isDrawing.value) {
        lassoSide.value = 'left';
        regions.value = [];
        polygon.value.points = [];
        regionsUMAP.value = [];
        polygonUMAP.value.points = [];
        highlightRegion();
        isClicked.value = true;
        polygon.value = { x: 0, y: 0, id: get_uuid(), points: [], opacity: 0.5, listening: true, closed: true, fill: 'white', stroke: 'white', strokeWidth: 1 };
        // polygon.value.x = Math.round(mousePos.x);
        // polygon.value.y = Math.round(mousePos.y);
        polygon.value.points = [];
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
        polygonUMAP.value = { x: 0, y: 0, id: get_uuid(), points: [], opacity: 0.5, listening: true, closed: true, fill: 'white', stroke: 'white', strokeWidth: 1 };
        const mousePos = (ctx as any).refs.konvaStageRight.getNode().getRelativePointerPosition();
        // polygon.value.x = Math.round(mousePos.x);
        // polygon.value.y = Math.round(mousePos.y);
        polygonUMAP.value.points = [];
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
    function mouseMoveOnStageRight(ev: any) {
      if (isDrawing.value) {
        if (isClicked.value) {
          const mousePos = (ctx as any).refs.konvaStageRight.getNode().getRelativePointerPosition();
          polygonUMAP.value.points.push(Math.round(mousePos.x));
          polygonUMAP.value.points.push(Math.round(mousePos.y));
          (ctx as any).refs.drawingLayerRight.getNode().batchDraw(); // forced update since due to pointer issue
        }
      }
    }
    function mouseUpOnStageLeft(ev: any) {
      if (isDrawing.value) {
        isClicked.value = false;
        regions.value.push(deepCopy(polygon.value));
        polygon.value.points = [];
        highlightRegion();
      }
    }
    function mouseUpOnStageRight(ev: any) {
      if (isDrawing.value) {
        isClicked.value = false;
        regionsUMAP.value.push(deepCopy(polygonUMAP.value));
        polygonUMAP.value.points = [];
        highlightRegion();
      }
    }
    // Drawing Region ends
    async function mouseOverClusterItem(ev: any) {
      highlightCluster(ev.name);
    }
    function removeRegions(ev: any) {
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
    }
    function reScaleUMAP(scaleRatio: number) {
      updateCircles();
      polygonUMAP.value.points = polygonUMAP.value.points.map((c: number) => c * scaleRatio);
    }
    async function onGenelistChanged(ev: any) {
      isClusterView.value = false;
      await runSpatial(currentViewType.value);
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
      if (!isDrawing.value) {
        colorOnOff.value = '';
        unHighlighCluster();
      } else {
        colorOnOff.value = 'green';
      }
    });
    watch(selectedGenes, (v: any[]) => {
      if (selectedGenes.value.length === 0) {
        isClusterView.value = true;
        showFlag.value = false;
        stepArray.value = [];
        updateCircles();
      }
    });
    watch(searchInput, (v: any) => {
      if (v) {
        querySelections(v);
      }
    });
    watch(dropDownFlag, (v: boolean) => {
      if (v) {
        window.addEventListener('click', closeDropDowns);
      } else {
        window.removeEventListener('click', closeDropDowns);
      }
    });
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
      fitStageToParent();
      (ctx.refs.annotationLayer as any).getNode().add(tooltip);
      (ctx.refs.annotationLayerRight as any).getNode().add(tooltipRight);
      console.log(ctx.refs);
      if (props.query) {
        if (!props.query.public) {
          loadCandidateWorkers('AtlasGX');
          await fetchFileList();
        } else {
          currentTask.value = { task: 'gene.compute_qc', queues: ['joshua_gene'] };
        }
      }
      if (props.query) {
        if (props.query.run_id) {
          await selectAction({ id: props.query.run_id });
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
      dropDownFlag,
      lassoSide,
      colorOnOff,
      colorOnOffRect,
      colorbarText,
      closeDropDowns,
    };
  },
});
</script>

<style>
</style>
