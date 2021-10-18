<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" sm="3">
        <v-card class="mainCard">
          <v-card-title>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
            />
          </v-card-title>
          <v-data-table
            v-model="selected"
            height="36vh"
            width="30%"
            dense
            single-select
            :loading="loading"
            :items="items"
            :headers="headers"
            sort-by="id"
            @click:row="selectAction"
          />
          <v-data-table
            dense
            :items-per-page="999"
            :items="objectToArray(metadata)"
            :headers="metaHeaders"
            hide-default-footer
            sort-by="key"
            />
        </v-card>
        <v-card v-if="image">
        </v-card>
      </v-col>
      <v-col cols="12" sm="9">
          <atlas-browser-canvas ref="canvas" :image="image" :scale_factor="scaleFactor" :brush="brushMode" :eraser="eraserMode" :brushSize="brushSize" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import getPixels from 'get-pixels';
import savePixels from 'save-pixels';
import blobStream from 'blob-stream';
import adaptiveThreshold from 'adaptive-threshold';
import store from '@/store';
import { generateRouteByQuery, objectToArray } from '@/utils';
import AtlasBrowserCanvas from './AtlasBrowserCanvas.vue';

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
const metaHeaders = [
  { text: 'Field', value: 'key' },
  { text: 'Value', value: 'value' },
];

export default defineComponent({
  name: 'AtlasBrowser',
  components: { AtlasBrowserCanvas },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const items = ref<any[]>([]);
    const search = ref<string | null>();
    const loading = ref(false);
    const selected = ref<any | null>();
    const image = ref<any>();
    const scaleFactor = ref<number>(1.0);
    const brushMode = ref(false);
    const eraserMode = ref(false);
    const brushSize = ref(20);
    const metadata = ref<any>({});
    const submenu = [
      {
        text: 'Generate',
        icon: 'mdi-play',
        color: 'primary',
        tooltip: 'Generate cell grids',
        click: () => {
          (ctx as any).refs.canvas.generateLattices();
          (ctx as any).refs.canvas.setBrushMode(true);
        },
      },
      {
        text: 'Upload image',
        icon: 'mdi-upload',
        color: 'primary',
        tooltip: 'Upload new image',
        click: () => {
          (ctx as any).refs.canvas.generateLattices();
        },
      },
      {
        text: 'Save spatial data',
        icon: 'mdi-content-save',
        color: 'primary',
        tooltip: 'Save spatial data',
        click: () => {
          (ctx as any).refs.canvas.saveSpatial();
        },
      },
    ];
    async function fetchQcList() {
      if (!client.value) {
        return;
      }
      items.value = [];
      search.value = '';
      loading.value = true;
      const payload = { params: { filter: null, options: null } };
      const qc_data = await client.value.getQc(payload);
      loading.value = false;
      items.value = qc_data;
      // console.log(qc_data);
    }
    async function loadImage(filename: string) {
      if (!client.value) return;
      const img = await client.value.getImage({ params: { filename } });
      const imgObj = new window.Image();
      imgObj.src = URL.createObjectURL(img);

      if (imgObj) {
        imgObj.onload = (ev: any) => {
          // console.log('image loaded');
          // console.log(imgObj.width);
          // (ctx as any).refs.canvas.initialize();
          const scalefactor = (ctx as any).refs.canvas._data.stageWidth / imgObj.width;
          image.value = {
            x: 0,
            y: 0,
            draggable: false,
            scale: { x: scalefactor, y: scalefactor },
            image: imgObj,
            src: URL.createObjectURL(img),
            original_src: URL.createObjectURL(img),
            alternative_src: null,
          };
          scaleFactor.value = scalefactor;
        };
      }
    }
    async function selectAction(ev: any) {
      const { root } = ev.files;
      metadata.value = ev.metadata;
      const fn = `${root}/${ev.files.images.tissue_hires_image}`;
      loading.value = true;
      await loadImage(fn);
      (ctx as any).refs.canvas.initialize();
      loading.value = false;
    }
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(submenu);
      await fetchQcList();
    });
    return {
      items,
      headers,
      search,
      loading,
      selected,
      selectAction,
      image,
      scaleFactor,
      brushMode,
      eraserMode,
      brushSize,
      metaHeaders,
      objectToArray,
      metadata,
    };
  },
});

</script>

<style>
.mainCard {
  display: fixed;
}
</style>
