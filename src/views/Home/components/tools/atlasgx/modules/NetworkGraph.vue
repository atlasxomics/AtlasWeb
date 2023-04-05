<template>
  <v-row v-if="go">
    <v-col cols="12" sm="9">
      <template v-if="elements"><VueCytoscape :key="update_component" ref="cyRef" :config="config" :preConfig="preConfig" :afterCreated="afterCreated" /></template>
    </v-col>
    <v-col cols="12" sm="3" class="pr-22">
      <v-card flat>
        <v-card-text>Layout</v-card-text>
        <v-select
          v-model="default_layout"
          :items="['Forced-Algorithm', 'Concentric', 'Circle', 'Grid']"
          @input="updateLayout"
        ></v-select>
        <v-card-text>Connection Strength</v-card-text>
        <div style="width:100%; height:20px"></div>
        <v-slider
            :disabled="regulons_from_parent.length == 0"
            v-model="slider"
            :min="min_width"
            :max="max_width"
            ticks="always"
            tick-size="7"
            thumb-label="always"
            @end="sliceGraph(regulons_from_parent, slider, false)">
            <template v-slot:thumb-label="{ value }">
              {{ slider_labels[value] }}
            </template></v-slider>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { VueCytoscape } from 'vue-cytoscape';
import cola from 'cytoscape-cola';
import styles from './styles';
/* eslint-disable prefer-destructuring */
export default defineComponent({
  name: 'NetworkGraph',
  components: { VueCytoscape },
  props: ['selected_regulons', 'run_id', 'flag'],
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const regulons_from_parent = computed(() => props.selected_regulons);
    const runId = computed(() => props.run_id);
    const go = computed(() => props.flag);
    const elements = ref<any>();
    const all_elements = ref<any>();
    const config = ref<any>();
    const node_edge_index = ref<any>();
    const update_component = ref<number>(0);
    const all_cell_types = ref<any[]>([]);
    const current_selected = ref<number>(0);
    const layout_value: any = { Concentric: 'concentric', 'Forced-Algorithm': 'cola', Circle: 'circle', Grid: 'grid' };
    const default_layout = ref<string>('Forced-Algorithm');
    const slider = ref<number>(4);
    const min_width = ref<number>(0);
    const max_width = ref<number>(4);
    const index_edges = ref<any>();
    const truncate_value = ref<any[]>([0.15, 0.25, 0.5, 0.75, 1]);
    const slider_labels = ref<any[]>(['15%', '25%', '50%', '75%', '100%']);
    function preConfig(Cytoscape: any) {
      if (default_layout.value === 'Forced-Algorithm') Cytoscape.use(cola);
    }
    function afterCreated(cy: any) {
      // add elements and run layout algorithm
      cy.add(elements.value)
        .layout({ name: `${layout_value[default_layout.value]}`, idealEdgeLength: 230 })
        .run();

      // example cytoscape event listener
      cy.on('mouseover', 'edge', (event: any) => {
        // d qwdnkasmn
      });
    }
    function constructGraph(data: any) {
      const holder_elements: any = [];
      let format_data: any = {};
      const index_hold: any = {};
      data.forEach((value: any, index: any) => {
        if (Object.keys(value).includes('position')) {
          format_data = { data: { id: value.data.name, label: value.data.name, color: value.data.color_rgb, size: value.data.size } };
        } else {
          format_data = { data: { id: index, source: value.data.source, color: value.data.color_rgb, target: value.data.target, width: value.data.width } };
          index_hold[index] = format_data;
        }
        holder_elements.push(format_data);
      });
      index_edges.value = index_hold;
      all_elements.value = holder_elements;
      elements.value = holder_elements;
      config.value = styles;
      update_component.value += 1;
    }

    function sliceGraph(select: any, greater: number, start: boolean) {
      const holder_elements: any = [];
      const holder_indexes: any = [];
      const all_values: any = [];
      const found_elements: any = [];
      let goodie = false;
      const all_width: any = [];
      const iterate = (list: any, found: any) => {
        const index: any = [];
        const element: any = [];
        const all_keys = Object.keys(node_edge_index.value);
        list.forEach((value: any, i: any) => {
          if (all_keys.includes(value)) {
            let element_array = node_edge_index.value[value].index;
            const cut_off = Math.ceil((element_array.length - 1) * truncate_value.value[greater]);
            if (node_edge_index.value[value].group === 'TF') {
              element_array = element_array.slice(0, cut_off);
            }
            const connect_array = element_array.map((v: any) => all_elements.value[v].data.target);
            index.push(...element_array);
            connect_array.forEach((v2: any) => {
              if (!found.includes(v2)) element.push(v2);
            });
          }
        });
        return [index, element];
      };
      let initial = iterate(select, found_elements);
      found_elements.push(...select);
      holder_indexes.push(...initial[0]);
      select.forEach((value: any) => {
        const edges = node_edge_index.value[value].control.map((v: any) => v);
        edges.forEach((source: any) => {
          const src = node_edge_index.value[index_edges.value[source].data.source].index[0];
          edges.push(src);
        });
        const ee = edges.map((v: any) => all_elements.value[v]);
        holder_elements.push(...ee);
      });
      while (!goodie) {
        if (initial[1].length === 0) goodie = true;
        initial = iterate(initial[1], found_elements);
        initial[1].forEach((v: any) => {
          if (!found_elements.includes(v)) found_elements.push(v);
        });
        initial[0].forEach((v: any) => {
          if (!holder_indexes.includes(v)) holder_indexes.push(v);
        });
      }
      holder_indexes.forEach((value: any, index: any) => {
        const element = all_elements.value[value];
        holder_elements.push(element);
      });
      elements.value = holder_elements;
      update_component.value += 1;
    }

    function updateLayout(ev: any) {
      update_component.value += 1;
    }
    onMounted(async () => {
      // const fileName = { params: { filename: 'data/NG00495/h5/networks/network_Chondrocytes.json' } };
      // const fileNameIndex = { params: { filename: 'data/NG00495/h5/networks/network_Chondrocytes_index.json' } };
      // const node_edge = await client.value?.getJsonFile(fileName);
      // const node_edge_ind = await client.value?.getJsonFile(fileNameIndex);
      // constructGraph(node_edge);
      // node_edge_index.value = node_edge_ind;
    });
    watch(runId, async (v: any) => {
      /* eslint-disable no-await-in-loop */
      if (typeof v === 'string' && go.value) {
        const payload = { path: `data/${runId.value}/h5/networks`, bucket: '', filter: ['json'] };
        const important_objects = await client.value?.getFileList(payload);
        important_objects.sort();
        let index_array = [];
        for (let i = 0; i < important_objects.length; i += 1) {
          const fileName = { params: { filename: `${important_objects[i]}` } };
          const node_edge = await client.value?.getJsonFile(fileName);
          index_array.push(node_edge);
          if (i === 1) {
            constructGraph(index_array[0]);
            node_edge_index.value = node_edge;
          }
          if (i % 2 === 1) {
            all_cell_types.value.push(index_array);
            index_array = [];
          }
        }
      }
    });
    watch(regulons_from_parent, (v: any) => {
      if (v.length > 0) {
        slider.value = 4;
        sliceGraph(v, 4, true);
      } else if (v.length === 0 && all_elements.value) {
        const holder_elements: any = [];
        all_elements.value.forEach((value: any, index: any) => {
          holder_elements.push(value);
        });
        elements.value = holder_elements;
        update_component.value += 1;
      }
    });
    return { elements, config, regulons_from_parent, update_component, all_cell_types, current_selected, default_layout, go, slider, min_width, max_width, index_edges, truncate_value, slider_labels, preConfig, afterCreated, constructGraph, sliceGraph, updateLayout };
  },
});

</script>
<style scoped>
</style>
