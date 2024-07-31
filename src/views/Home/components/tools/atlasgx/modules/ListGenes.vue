<template>
    <v-simple-table :loading="loading">
      <caption>Select Cell Marker {{ cap_markers }}s</caption>
      <template v-for="(list, index) in formArr">
        <tr :key="index">
          <td v-for="value in list" :key="value"><v-btn text medium dense @click="sendGene(value)">{{value}}</v-btn></td>
        </tr>
      </template>
    </v-simple-table>
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
  name: 'ListGenes',
  props: ['gene', 'loading', 'markers'],
  setup(props, ctx) {
    const gene = computed(() => props.gene);
    const loading = computed(() => props.loading);
    const markers = computed(() => props.markers);
    const formArr = ref<any>();
    const cap_markers = ref<string>('Gene');

    async function sendGene(ev: any) {
      ctx.emit('sentGene', ev.trim());
    }
    async function format() {
      console.log(gene.value);
      const new_arr: any[] = [];
      if (gene.value.length > 0) {
        let iter = [];
        for (let i = 0; i < gene.value[0].length; i += 1) {
          iter.push(gene.value[0][i]);
          if ((i + 1) % 5 === 0) {
            new_arr.push(iter);
            iter = [];
          }
        }
      }
      formArr.value = new_arr;
    }
    watch(gene, (v: any) => {
      format();
    });
    watch(markers, (v: any) => {
      cap_markers.value = v[0].toUpperCase() + v.slice(1);
      console.log(cap_markers.value);
    });
    onMounted(async () => {
      await clientReady;
      format();
    });
    return { cap_markers, formArr, sendGene };
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
