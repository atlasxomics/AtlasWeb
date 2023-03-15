<template>
  <v-data-table
    class="dataTable"
    dense
    :items-per-page="999"
    hide-default-footer
    hide-default-header
    :items="gene"
    :headers="cluster"
    :loading="loading"
    >
    <template v-slot:header="{ props }">
      <th v-for="clust in props.headers" :key="clust.text">
        <template v-if="clust.text == 'Anti'">
          <template v-if="clust.key == 1">
            <v-btn text dense :color="colormap[clust.text]" @click="sendCluster(clust.text)">UP</v-btn>
          </template>
          <template v-else>
            <v-btn text dense :color="colormap[clust.text]" @click="sendCluster(clust.text)">DOWN</v-btn>
          </template>
        </template>
        <template v-else>
          <v-btn text dense :color="colormap[clust.text]" @click="sendCluster(clust.text)">{{clust.text}}</v-btn>
        </template>
      </th>
    </template>
    <template v-slot:item="row">
      <tr>
      <td v-for="(value, keys) in row.item" :key="keys">
        <template v-if="typeof value == 'number'">
          {{value }}
        </template>
        <template v-else>
          <v-btn text x-small dense @click="sendGene(value)">{{value}}</v-btn>
        </template>
      </td>
      </tr>
    </template>
  </v-data-table>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
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
  name: 'GeneDataTable',
  props: ['gene', 'clusters', 'lengthClust', 'loading', 'colormap'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const gene = computed(() => props.gene);
    const cluster = computed(() => props.clusters);
    const lengthClust = computed(() => props.lengthClust);
    const loading = computed(() => props.loading);
    const colormap = computed(() => props.colormap);

    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    async function sendGene(ev: any) {
      ctx.emit('sentGene', ev);
    }
    async function sendCluster(ev: any) {
      if (ev === 'Anti') cluster.value[0].key *= -1;
      ctx.emit('sentCluster', ev);
    }
    onMounted(async () => {
      await clientReady;
    });
    return { cluster, sendGene, sendCluster };
  },
});

</script>

<style scoped>
  .dataTable {
    background-color: #EAEAEA !important;
  }
  .dataTable >>> th {
    padding: 4px !important;
    border-bottom: 1px solid black;
    text-align: left !important;
    font-weight: bolder !important;
  }

  .dataTable >>> tr:hover {
    background-color: transparent !important;
  }
</style>
