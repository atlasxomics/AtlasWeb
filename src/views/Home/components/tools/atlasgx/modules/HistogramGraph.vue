<template>
  <v-row no-gutters>
    <v-col cols="12" sm="12">
      <v-row>
        <template v-for="genes in data" >
          <v-col vols="12" sm="4" :key="genes.id">
            <Plotly :data="genes.data" :layout="genes.layout" :display-mode-bar="true"></Plotly>
          </v-col>
        </template>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang='ts'>
import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUnmounted } from '@vue/composition-api';
import lodash, { lte } from 'lodash';
import colormap from 'colormap';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { Plotly } from 'vue-plotly';

export default defineComponent({
  name: 'HistogramGraph',
  components: { Plotly },
  props: ['colorCode', 'chartData', 'idName'],
  setup(props, ctx) {
    const colorMap = computed(() => props.colorCode);
    const dataFromParent = computed(() => props.chartData);
    const idName = computed(() => props.idName);
    const data = ref<any>({});
    const layout = ref<any>();
    const created = ref<any>();

    async function constructChart(tixels: any) {
      const multGenes: any = {};
      data.value = {};
      for (let i = 0; i < idName.value.length; i += 1) {
        const categorization: any = {};
        const collectiveData: any = [];
        tixels.forEach((value: any, index: any) => {
          if (!Object.keys(categorization).includes(value.cluster)) {
            categorization[value.cluster] = [];
          }
          categorization[value.cluster].push(value.genes[idName.value[i]]);
        });
        lodash.each(categorization, (value: any, cluster: any) => {
          const trace = {
            x: value,
            type: 'histogram',
            opacity: 0.5,
            marker: { color: colorMap.value[cluster] },
            name: cluster,
          };
          collectiveData.push(trace);
        });
        multGenes[idName.value[i]] = { id: idName.value[i], data: collectiveData, layout: { barmode: 'overlay', title: idName.value[i] } };
      }
      data.value = multGenes;
    }
    onMounted(async () => {
      // constructChart();
    });
    watch(dataFromParent, (v: any) => {
      constructChart(v);
    });
    return { data, layout, created, constructChart };
  },
});
</script>

<style scoped>

</style>
