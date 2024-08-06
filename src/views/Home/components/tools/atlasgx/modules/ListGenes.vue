<template>
    <v-simple-table :loading="loading" class="simpleTable">
      <tr><th :colspan="5">Select Cell Marker {{ cap_markers }}s</th></tr>
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
  .simpleTable {
    background-color: #EAEAEA !important;
    text-align: center;
  }
  .simpleTable td{
    border-bottom: thin solid rgba(0, 0, 0, .12);
  }
  .simpleTable >>> th {
    padding: 4px !important;
    border-bottom: 1px solid black;
    font-weight: bolder !important;
  }

  .simpleTable >>> tr:hover {
    background-color: transparent !important;
  }
</style>
