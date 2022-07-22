<template>
  <v-container fluid>
    <v-row v-if="client">
      <v-col cols="12" sm="12">
        <v-card>
          <v-card-title>
            Hello {{ client.user.username.toUpperCase() }}
          </v-card-title>
          <v-card-text>
            ATX-Cloud is currently under development, any feedback will be appreciated. Please contact <a href="mailto:joshuab@atlasxomics.com">Joshua</a> or <a href="mailto:liyaw@atlasxomics.com">Liya</a> if you have any question or suggestion. All rights reserved by AtlasXomics, 2021.
          </v-card-text>
        </v-card>
      </v-col>
      <template v-for="item in tools">
        <v-col cols="12" sm="6" v-if="resolveAuthGroup(item.access_control)" v-bind:key="item.name">
          <v-card>
              <v-card-title>{{item.name}}</v-card-title>
              <v-card-text>{{item.text}}</v-card-text>
              <v-card-actions>
                <v-spacer/>
                <v-btn
                  color="primary"
                  @click="go(item.query.component)">
                  Go</v-btn>
              </v-card-actions>
          </v-card>
        </v-col>
      </template>
    </v-row>
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { generateRouteByQuery } from '@/utils';
import { resolveAuthGroup } from '@/utils/auth';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'HomePage',
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const tools = ref([
      { name: 'Atlas Browser', access_control: ['admin', 'user'], query: { component: 'AtlasBrowser' }, text: 'Generate the tixel information using adaptive filter and interactive annotations.' },
      { name: 'Image Viewer', access_control: ['admin'], query: { component: 'ImageViewer' }, text: 'Browse wafers/chips/DBiTs and view images related to the hardwares/runs' },
      { name: 'AtlasViewer', access_control: ['admin'], query: { component: 'AtlasViewer' }, text: 'QC file browser with metadata and output images' },
      { name: 'Atlas Gx', access_control: ['admin', 'user'], query: { component: 'AtlasG' }, text: 'View spatial information and plots of genes' },
      { name: 'Atlas Run Information Viewer', access_control: ['admin', 'user'], query: { component: 'AtlasRunViewer' }, text: 'View data files currently uploaded by run.' },
      // { name: 'Atlas Compare', access_control: ['admin'], query: { component: 'AtlasCompare' }, text: '' },
      // { name: 'Atlas Test', access_control: ['admin'], color: 'red', query: { component: 'AtlasTest' } },
      // { 'AtlasAnalytics', name: 'Atlas Analytics', access_control: ['admin'], query: { component: 'AtlasAnalytics' }, text: '' },
      { name: 'Atlas Uploader', access_control: ['admin'], query: { component: 'AtlasUploader' }, text: 'Upload images, spatial data to the common respository' },
    ]);
    async function go(component: string) {
      const route = generateRouteByQuery(currentRoute, { component });
      router.push(route);
    }
    onMounted(() => {
      store.commit.setSubmenu(null);
    });
    return { go, resolveAuthGroup, client, tools };
  },
});

</script>

<style>

</style>
