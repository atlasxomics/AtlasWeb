<template>
  <v-container fluid class="ma-0 pa-0"  v-if="allRuns">
    <table style="width: 100%;border-spacing: 35px;">
    <caption style="font-size: 20px;font-weight: bold;padding: 15px;border-bottom: 1px solid;">{{name}}</caption>
      <tr style="border-bottom:1px solid rgb(92, 112, 128); color:rgb(92, 112, 128);font-weight: 500;">
        <th>Run ID</th>
        <th>Tissue</th>
        <th>Organism</th>
        <th>Disease</th>
        <th>Browser Link</th>
      </tr>
      <tr v-for="runs in allRuns" v-bind:key="runs" style="border-bottom:1px solid rgb(92, 112, 128);">
        <td v-for="data in runs" v-bind:key="data" style="text-align:center;">
        <template v-if="data.includes('http')">
          <v-btn
            small
            icon
            @click="nextPage(data)">
          <v-icon>mdi-scatter-plot</v-icon>
          </v-btn>
        </template>
        <template v-else>
          {{data}}
        </template>
        </td>
      </tr>
    </table>
    <div style="padding:10px;text-align: right;">(<a href="https://docs.atlasxomics.com/projects/AtlasXplore" target="_blank">Browser Documentation</a>)</div>
  </v-container>
</template>

<script lang='ts'>
import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import lodash, { lte } from 'lodash';
import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUnmounted } from '@vue/composition-api';

export default defineComponent({
  name: 'LoadingPage',
  props: ['listRuns', 'collabName'],
  setup(props, ctx) {
    const allRuns = computed(() => props.listRuns);
    const name = computed(() => props.collabName);
    const data = ref<any[]>([]);

    async function compute() {
      // jnknj
    }
    async function nextPage(ev: any) {
      window.open(`${ev}`, '_blank');
    }
    watch(allRuns, (v: any) => {
      if (v) {
        compute();
      }
    });
    onMounted(async () => {
      // dlskmk
    });
    return { allRuns, name, compute, nextPage };
  },
});
</script>

<style scoped>

</style>
