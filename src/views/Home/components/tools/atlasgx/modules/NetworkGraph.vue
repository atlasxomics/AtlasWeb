<template>
  <v-row v-if="go">
    <v-col cols="12" sm="9">
      <template v-if="elements"><VueCytoscape :key="update_component" ref="cyRef" :config="config" :preConfig="preConfig" :afterCreated="afterCreated" /></template>
    </v-col>
    <v-col cols="12" sm="3">
      <v-card flat>
        <v-card-text>Layout</v-card-text>
        <v-select
          v-model="default_layout"
          :items="['Forced-Algorithm', 'Concentric', 'Circle', 'Grid']"
          @input="updateLayout"
        ></v-select>
        <v-card-text>Connection Strength</v-card-text>
        <v-slider
            :disabled="regulons_from_parent.length == 0"
            v-model="slider"
            thumb-label
            :min="min_width"
            :max="max_width"
            ticks="always"
            tick-size="7"
            :tick-labels="['10%', '25%', '50%', '75%', '100%']"
            @end="sliceGraph(regulons_from_parent, slider, false)"
          ></v-slider>
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
    const mapped_width = ref<any[]>([0]);
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
    function makearray(stopValue: number, startValue: number): any[] {
      const arr = [];
      const steps = 4;
      const ten_percent = stopValue - (stopValue * 0.10);
      const step = (ten_percent - startValue) / (steps - 1);
      for (let i = 0; i < steps; i += 1) {
        arr.push(parseFloat((startValue + (step * i)).toFixed(4)));
      }
      arr.reverse();
      arr.push(0);
      return arr;
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
      const width_check = mapped_width.value[greater];
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
            const element_array = node_edge_index.value[value].index;
            const connect_array = node_edge_index.value[value].connect;
            if (width_check !== 0) {
              if (node_edge_index.value[value].group === 'TF') {
                for (let j = 1; j < element_array.length; j += 1) {
                  const val = element_array[j];
                  if (index_edges.value[val].data.width >= width_check) {
                    index.push(val);
                    index.push(node_edge_index.value[index_edges.value[val].data.target].index[0]);
                    if (!found.includes(index_edges.value[val].data.target)) element.push(index_edges.value[val].data.target);
                  }
                }
              }
            } else {
              index.push(...element_array);
              connect_array.forEach((v2: any) => {
                if (!found.includes(v2)) element.push(v2);
              });
            }
          }
        });
        return [index, element];
      };
      let initial = iterate(select, found_elements);
      found_elements.push(...select);
      select.forEach((value: any) => {
        holder_indexes.push(node_edge_index.value[value].index[0]);
      });
      holder_indexes.push(...initial[0]);
      holder_indexes.forEach((value: any, index: any) => {
        if (index_edges.value[value]) all_width.push(index_edges.value[value].data.width);
      });
      if (start) mapped_width.value = makearray(Math.max(...all_width), Math.min(...all_width));
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
        mapped_width.value = [0];
        slider.value = 4;
        sliceGraph(v, 0, true);
      } else if (v.length === 0 && all_elements.value) {
        const holder_elements: any = [];
        all_elements.value.forEach((value: any, index: any) => {
          holder_elements.push(value);
        });
        elements.value = holder_elements;
        update_component.value += 1;
      }
    });
    return { elements, config, regulons_from_parent, update_component, all_cell_types, current_selected, default_layout, go, slider, min_width, max_width, index_edges, mapped_width, preConfig, afterCreated, constructGraph, sliceGraph, updateLayout };
  },
});

</script>
<style scoped>
</style>
