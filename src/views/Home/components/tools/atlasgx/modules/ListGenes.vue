<template>
    <v-simple-table>
      <caption>Important Markers</caption>
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
  props: ['gene', 'loading'],
  setup(props, ctx) {
    const gene = computed(() => props.gene);
    const loading = computed(() => props.loading);
    const formArr = ref<any>();

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
    onMounted(async () => {
      await clientReady;
      format();
    });
    return { formArr, sendGene };
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
