<template>
  <v-container fluid>
    <v-row v-if="client">
      <v-col cols="12" sm="12">
        <v-card>
          <v-card-title>
            Hello {{ client.user.username.toUpperCase() }}
          </v-card-title>
          <v-card-text>
            ATX-Cloud is currently under development, any feedback will be appreciated. Please contact <a href="mailto:skpark@atlasxomics.com">SK</a> or <a href="mailto:liyaw@atlasxomics.com">Liya</a> if you have any question or suggestion. All rights reserved by AtlasXomics, 2021.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" sm="6">
        <v-card>
          <v-card-title>
            Gene Viewer
          </v-card-title>
          <v-card-text>
            View spatial information and plots of genes
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn
              color="primary"
              @click="go('GeneViewer')"
              >Go</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6">
        <v-card>
          <v-card-title>
            Image Viewer
          </v-card-title>
          <v-card-text>
            Browse wafers/chips/DBiTs and view images related to the hardwares/runs
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn
              color="primary"
              @click="go('ImageViewer')"
              >Go</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" sm="6">
        <v-card>
          <v-card-title>
            QC Viewer
          </v-card-title>
          <v-card-text>
            QC file browser with metadata and output images
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn
              color="primary"
              @click="go('QcViewer')"
              >Go</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6">
        <v-card>
          <v-card-title>
            AtlasBrowser
          </v-card-title>
          <v-card-text>
            Generate the tixel information using adaptive filter and interactive annotations.
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn
              color="primary"
              @click="go('AtlasBrowser')"
              >Go</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { generateRouteByQuery } from '@/utils';

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
    async function go(component: string) {
      const route = generateRouteByQuery(currentRoute, { component });
      router.push(route);
    }
    onMounted(() => {
      store.commit.setSubmenu(null);
    });
    return { go, client };
  },
});

</script>

<style>

</style>
