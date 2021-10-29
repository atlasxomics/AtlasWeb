<template>
    <v-container fluid>
      <v-row>
        <v-col cols="12" sm="3">
          <v-card>
            <v-card-title>
              <v-text-field
                v-model="filename"
                :loading="loading"
              />
            </v-card-title>
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
              :step="0.02"
              :min="0.05"
              :max="1.0"
              @input="updateCircles"
              />
            <v-card-text v-if="clusterItems && isClusterView">
              <v-text-field
                v-model="search"
                dense
                prepend-icon="mdi-magnify"/>
              <v-data-table
                height="34vh"
                v-model="selected"
                :search="search"
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
                  :color="clusterColors[Number(item.name)]"
                  small>{{ item.name }}</v-chip>
              </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="9">
          <v-card flat>
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
                    @click="runSpatial('spatial')"
                    >Spatial</v-btn>
                  <v-btn
                    color="primary"
                    small
                    text
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
import { get_uuid, generateRouteByQuery } from '@/utils';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

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
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const filename = ref<string>('data/D200.out/Gene/raw/spatial/D200.h5ad');
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
    async function loadExpressions() {
      if (!client.value) return;
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
            radius: 1 * scale.value * 10,
            fill: colors[Number(v)],
            stroke: colors[Number(v)],
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
            radius: rd * scale.value * 10,
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
      }
      circlesSpatial.value = circles;
    }
    async function runSpatial(stype: string) {
      if (!client.value) return;
      loading.value = true;
      await loadExpressions();
      const resp = await client.value.getGeneSpatial(filename.value, selectedGenes.value);
      currentViewType.value = stype;
      spatialData.value = resp;
      // console.log(spatialData.value);
      clusterItems.value = lodash.uniq(spatialData.value.clusters).map((v: any) => ({ name: v }));
      await updateCircles();
      loading.value = false;
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
        if (c.cluster === clusterName) {
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
    // async function zoom(ev: any) {
    //   ev.evt.preventDefault();
    //   const scaleDelta = Math.min(0.01, Math.abs(ev.evt.deltaY) / 1000);
    //   const direction = ev.evt.deltaY > 0 ? -1 : 1;
    //   scale.value = Math.max(0.05, scale.value + direction * scaleDelta);
    //   updateCircles();
    // }
    async function acInputChanged() { // autocomplete input event handler;
      filteredGenes.value = filteredGenes.value.filter((v: any) => selectedGenes.value.includes(v.name));
      searchInput.value = null;
    }
    async function querySelections(v: string) {
      if (!v) return;
      autocompleteLoading.value = true;
      setTimeout(() => {
        filteredGenes.value = genes.value.filter((g: any) => g.name.toLowerCase().includes(v.toLowerCase()) || selectedGenes.value.includes(g.name));
        autocompleteLoading.value = false;
      }, 500);
    }
    watch(isClusterView, (v: boolean) => {
      updateCircles();
    });
    watch(selectedGenes, (v: any[]) => {
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
    });
    return {
      scale,
      filename,
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
    };
  },
});

</script>

<style>

</style>
