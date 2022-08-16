<template>
  <Bar
    :chart-options="chartOptions"
    :chart-data="chartData"
    :width=400
    :height=200
  />
</template>

<script lang='ts'>
import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUnmounted } from '@vue/composition-api';
import lodash, { lte } from 'lodash';
import colormap from 'colormap';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { Bar } from 'vue-chartjs/legacy';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default defineComponent({
  name: 'HistogramGraph',
  components: { Bar },
  setup(props, ctx) {
    const chartData = ref<any>({ labels: ['January', 'February', 'March'], datasets: [{ data: [40, 20, 12], barPercentage: 1.25 }] });
    const chartOptions = ref<any>({
      responsive: true,
      options: {
        legend: { display: false },
        scales: {
          x: {
            display: false,
            ticks: { max: 2 },
            gridLines: { display: false },
          },
          ys: { ticks: { beginAtZero: true } },
        },
      },
    });
    return { chartData, chartOptions };
  },
});
</script>

<style scoped>

</style>
