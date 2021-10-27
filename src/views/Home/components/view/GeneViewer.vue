<template>
    <v-container fluid>
      <v-row>
        <v-col cols="12" sm="3">
          <v-card>
            <v-card-title>
              <v-text-field
                v-model="filename"
              />
              <v-btn
                @click="loadExpressions"
                color="primary"
                >Load Expressions</v-btn>
            </v-card-title>
            <v-card-text v-if="genes">
              <v-text-field
                v-model="search"
                dense
                prepend-icon="mdi-magnify"/>
              <v-data-table
                v-model="selected"
                :search="search"
                dense
                :loading="loading"
                :items="genes"
                :headers="geneHeaders"
              >
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="9">
          <v-card flat>
            <v-card-title>
              <v-autocomplete
                v-model="selectedGenes"
                :items="genes"
                :outlined="false"
                multiple
                dense
                chips
                color="blue-grey lighten-2"
                item-text="name"
                item-value="name"
                small-chips>
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs"
                    :input-value="data.selected"
                    close
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
                    @click="runSpatial"
                    >Go</v-btn>
                  <v-btn
                    color="secondary"
                    small
                    text
                    @click="selectedGenes=[]"
                    >Clear</v-btn>
                </template>
              </v-autocomplete>
            </v-card-title>
          </v-card>
          <v-card id="stageParent" v-resize="onResize">
            <v-stage
              ref="konvaStage"
              class="mainStage"
              :config="konvaConfig"
              @wheel="zoom"
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

const geneHeaders = [
  { text: 'Gene', value: 'name' },
];
export default defineComponent({
  name: 'GeneViewer',
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const filename = ref<string>('data/D200.out/Gene/raw/spatial/D200.h5ad');
    const search = ref<string>();
    const selected = ref<any>();
    const genes = ref<any[]>([]);
    const loading = ref<boolean>(false);
    const selectedGenes = ref<any[]>([]);
    const spatialData = ref<any | null>(null);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const konvaConfig = ref<any>({ width, height });
    const scale = ref<number>(0.15);
    const tooltip = new Konva.Text({
      text: '',
      fontFamily: 'Calibri',
      fontSize: 15,
      fontStyle: 'bold',
      padding: 5,
      visible: false,
      fill: 'white',
      opacity: 1,
      textFill: 'red',
    });
    const circlesSpatial = ref<any[]>([]);
    async function loadExpressions() {
      if (!client.value) return;
      loading.value = true;
      const resp = await client.value.getGeneExpressions(filename.value);
      genes.value = resp.map((v: string) => ({ name: v }));
      loading.value = false;
    }
    function remove(item: any) {
      const newArr = selectedGenes.value.filter((x: any) => x !== item.name);
      selectedGenes.value = newArr;
    }
    async function updateCircles() {
      const circles: any[] = [];
      const numClusters = lodash.uniq(spatialData.value.clusters).length;
      const colors = colormap({ colormap: 'jet', nshades: numClusters, format: 'hex', alpha: 1 });
      lodash.each(spatialData.value.clusters, (v: string, i: number) => {
        const [x, y] = spatialData.value.coordinates[i];
        const c = {
          id: get_uuid(),
          x: x * scale.value,
          y: y * scale.value,
          radius: 2 * scale.value * 10,
          fill: colors[Number(v)],
          stroke: colors[Number(v)],
          cluster: v,
        };
        circles.push(c);
      });
      circlesSpatial.value = circles;
    }
    async function runSpatial(ev: any) {
      if (!client.value) return;
      loading.value = true;
      const resp = await client.value.getGeneSpatial(filename.value, selectedGenes.value);
      console.log(resp);
      spatialData.value = resp;
      updateCircles();
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
    async function mouseMoveOnSpatial(ev: any) {
      const mousePos = (ctx as any).refs.konvaStage.getNode().getRelativePointerPosition();
      tooltip.position({
        x: mousePos.x + 5,
        y: mousePos.y + 5,
      });
      const item = ev.target.attrs;
      tooltip.text(`Cluster: ${item.cluster}`);
      tooltip.show();
    }
    async function mouseOutOnSpatial(ev: any) {
      tooltip.hide();
    }
    async function zoom(ev: any) {
      ev.evt.preventDefault();
      const scaleDelta = Math.min(0.01, Math.abs(ev.evt.deltaY) / 1000);
      const direction = ev.evt.deltaY > 0 ? -1 : 1;
      scale.value = Math.max(0.05, scale.value + direction * scaleDelta);
      updateCircles();
    }
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
      fitStageToParent();
      (ctx.refs.spatialLayer as any).getNode().add(tooltip);
    });
    return {
      filename,
      search,
      selected,
      loading,
      loadExpressions,
      geneHeaders,
      genes,
      selectedGenes,
      remove,
      runSpatial,
      spatialData,
      konvaConfig,
      circlesSpatial,
      onResize,
      mouseMoveOnSpatial,
      mouseOutOnSpatial,
      zoom,
    };
  },
});

</script>

<style>
#stageParent {
  background-color: black;
}
</style>
