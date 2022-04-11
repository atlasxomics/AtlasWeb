<template>
  <v-data-table
    dense
    :items-per-page="999"
    hide-default-footer
    :items="gene"
    :headers="clusters"
    :loading="loading"
    >
  <template v-slot:item="row">
    <tr>
    <td>{{row.item['id']}}</td>
    <td v-for="num in lengthClust" :key="num.toString()"><v-btn text x-small dense @click="sendGene(row.item['C'+num])">{{row.item['C'+num]}}</v-btn></td>
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
  props: ['gene', 'clusters', 'lengthClust', 'loading'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const gene = computed(() => props.gene);
    const clusters = computed(() => props.clusters);
    const lengthClust = computed(() => props.lengthClust);
    const loading = computed(() => props.loading);

    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    async function sendGene(ev: any) {
      ctx.emit('toParent', ev);
    }
    onMounted(async () => {
      await clientReady;
    });
    return { sendGene };
  },
});

</script>

<style>

</style>
