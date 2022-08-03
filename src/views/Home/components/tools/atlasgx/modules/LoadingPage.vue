<template>
<table style="width: 100%;border-spacing: 35px;">
  <tr style="border-bottom:1px solid rgb(92, 112, 128); color:rgb(92, 112, 128);font-weight: 500;">
    <th>Run Id</th>
    <th>Organ</th>
    <th>Disease</th>
    <th>Organism</th>
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
</template>

<script lang='ts'>
import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import lodash, { lte } from 'lodash';
import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUnmounted } from '@vue/composition-api';

export default defineComponent({
  name: 'LoadingPage',
  props: ['listRuns'],
  setup(props, ctx) {
    const allRuns = computed(() => props.listRuns);
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
    return { allRuns, compute, nextPage };
  },
});
</script>

<style scoped>

</style>
