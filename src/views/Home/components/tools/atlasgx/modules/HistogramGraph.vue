<template>
  <v-row no-gutters>
    <v-col cols="12" sm="12">
      <template v-if="idName.length > 0">
        <v-row>
          <template v-for="genes in data" >
            <v-col vols="12" sm="4" :key="genes.id">
              <Plotly :data="genes.data" :layout="genes.layout" :display-mode-bar="true"></Plotly>
            </v-col>
          </template>
        </v-row>
      </template>
      <template v-else>
        <v-row>
          <template v-for="genes in data" >
            <v-col vols="12" sm="6" :key="genes.id">
              <Plotly :data="genes.data" :layout="genes.layout" :display-mode-bar="true"></Plotly>
            </v-col>
          </template>
        </v-row>
      </template>
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
  props: ['colorCode', 'chartData', 'idName', 'assay'],
  setup(props, ctx) {
    const colorMap = computed(() => props.colorCode);
    const dataFromParent = computed(() => props.chartData);
    const idName = computed(() => props.idName);
    const assayFromParent = computed(() => props.assay);
    const data = ref<any>({});
    const layout = ref<any>();
    const created = ref<any>();

    async function constructChart(tixels: any) {
      const multGenes: any = {};
      data.value = {};
      if (idName.value.length > 0) {
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
          collectiveData.sort((a: any, b: any) => {
            const x = parseFloat(a.name.split('C')[1]);
            const y = parseFloat(b.name.split('C')[1]);
            if (x < y) return -1;
            if (x > y) return 1;
            return 0;
          });
          multGenes[idName.value[i]] = { id: idName.value[i], data: collectiveData, layout: { barmode: 'overlay', title: idName.value[i], traceorder: 'normal' } };
        }
        data.value = multGenes;
      } else {
        for (let i = 0; i < tixels.length; i += 1) {
          const trace = {
            x: (!assayFromParent.value) ? Object.values((i === 0) ? tixels[i] : tixels[i].map((v: number) => Math.log10(v + 1))) : Object.values(tixels[i].map((v: number) => Math.log10(v + 1))),
            marker: { color: 'red' },
            histnorm: 'count',
            type: 'histogram',
          };
          const titleArray = [(!assayFromParent.value) ? 'TSSEnrichment' : 'Gene Count', (!assayFromParent.value) ? 'Fragments' : 'UMI Count'];
          multGenes[i] = { id: i, data: [trace], layout: { title: titleArray[i], traceorder: 'normal' } };
        }
        data.value = multGenes;
      }
    }
    onMounted(async () => {
      // constructChart();
    });
    watch(dataFromParent, (v: any) => {
      constructChart(v);
    });
    return { data, layout, created, assayFromParent, constructChart };
  },
});
</script>

<style scoped>

</style>
