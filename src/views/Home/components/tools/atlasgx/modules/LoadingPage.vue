<template>
  <v-container fluid class="ma-0 pa-0">
    <!-- <template v-if="loading_bool">
      <div :style="{ 'position': 'absolute', 'z-index': '999', 'top': '20', 'left': '39%'}">
        <v-progress-circular
          :size="300"
          :width="30"
          color="primary"
          indeterminate>
        </v-progress-circular>
      </div>
    </template> -->
    <table style="width: 100%;border-spacing: 35px;" v-if="allRuns.length > 0">
    <!-- <caption style="font-size: 20px;font-weight: bold;padding: 15px;border-bottom: 1px solid;">{{name}}</caption> -->
      <tr style="border-bottom:1px solid rgb(92, 112, 128); color:rgb(92, 112, 128);font-weight: 500;">
        <th> NGS ID </th>
        <th>Run ID</th>
        <th> Sample ID </th>
        <th>Tissue</th>
        <th>Organism</th>
        <th>Experimental Condition</th>
        <th>Date</th>
        <th>Browser Link</th>
      </tr>
      <tr v-for="runs in allRuns" v-bind:key="runs.inx" style="border-bottom:1px solid rgb(92, 112, 128);">

        <td style="text-align:center;">
          <div>
            {{ runs.cntn_id_NGS }}
          </div>
        </td>
        <td style="text-align:center;">
          <div>
            {{ runs.cntn_cf_runId }}
          </div>
        </td>
        <td style="text-align:center;">
          <div>
            {{ runs.cntn_cf_sampleId }}
          </div>
        </td>
        <td style="text-align:center;">
          <div>
            {{ runs.cntn_cf_fk_tissueType }}
          </div>
        </td>
        <td style="text-align:center;">
          <div>
            {{ runs.cntn_cf_fk_species }}
          </div>
        </td>
        <td style="text-align:center;">
          <div>
            {{ runs.cntn_cf_experimentalCondition }}
          </div>
        </td>
        <td style="text-align:center;">
          <div>
            {{ runs.cntn_createdOn_NGS }}
          </div>
        </td>
        <td style="text-align:center;">
          <v-btn
          outlined
          @click="toAtlasXplore(runs)"
          >
            AtlasXplore
          </v-btn>
        </td>
        <!-- <td v-for="data in runs" v-bind:key="data" style="text-align:center;">
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
        </td> -->
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
  props: {
    relevantRuns: { type: Array, required: true },
    collabName: { type: String, required: true },
  },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const allRuns = computed(() => props.relevantRuns);
    const name = computed(() => props.collabName);
    const data = ref<any[]>([]);
    const loading = ref<boolean>(true);

    async function nextPage(ev: any) {
      window.open(`${ev}`, '_blank');
    }
    function toAtlasXplore(run_data: any) {
      this.$emit('run-selected', run_data.cntn_id_NGS);
    }
    onMounted(async () => {
      // dlskmk
    });
    return {
      allRuns,
      name,
      loading,
      nextPage,
      toAtlasXplore,
      router,
    };
  },
});
</script>

<style scoped>

</style>
