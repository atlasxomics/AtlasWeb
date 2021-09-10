<template>
    <v-container fluid>
      <v-row>
        <v-col md="3" sm="4">
          <v-card>
            <v-card-title>
              Image Viewer
              <v-spacer/>
              <span v-if="loading">
                <v-progress-circular
                  :size="20"
                  indeterminate
                  color="primary"
                ></v-progress-circular>
              </span>
              <v-spacer/>
              <v-btn
                color="primary"
                @click="fetchTreeData"
              >
                Reload
              </v-btn>
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                :label="`Search`"
                single-line
                hide-details
                @change="searchAction"
              />
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text
              class="iv_treeview">
              <v-treeview
                v-model="tree_selected"
                activatable
                selectable
                dense
                :items="filtered_items"
              />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="9" sm="8">
          <v-card class="iv_image_parent">
            <v-card-title>
              Images
              <v-spacer/>
              <span v-if="item_loading">
                <v-progress-circular
                  :size="20"
                  indeterminate
                  color="primary"
                ></v-progress-circular>
              </span>
              <v-select
                v-model="image_selected"
                :items="image_items"
                single_line/>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <template v-for="image in images">
                <v-card :key="image.id">
                  <v-card-title>
                    {{ image.id }}
                  </v-card-title>
                  <v-divider/>
                  <v-img
                    class="iv_image_card"
                    :src="image.image_src"
                    contain
                    />
                </v-card>
              </template>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
</template>

<script lang="ts">
import _ from 'lodash';
import { defineComponent, ref, computed, onMounted, watch } from '@vue/composition-api';
import { snackbar } from '@/components/GlobalSnackbar';
import store from '@/store';

export default defineComponent({
  name: 'ImageViewer',
  setup() {
    const client = computed(() => store.state.client);
    const search = ref<string>('');
    const items = ref<any[]>([]);
    const filtered_items = ref<any[]>([]);
    const select_items = ref<any[]>([]);
    const select_items_all = ref<any[]>([]);
    const currentDataName = ref<string>();
    const currentItemForTable = ref<any[]>([]);
    const loading = ref(false);
    const item_loading = ref(false);
    const activated = ref([]);
    const tree_selected = ref([]);
    const image_selected = ref<any>();
    const image_items = ref<string[]>([]);
    const images_preload = ref<any[]>([]);
    const images = ref<any>([]);
    const image_paths = ref<any>({});
    let children1: any[];
    let children2: any[];
    console.log('ImageViewer Loaded');
    function convertToTree(data: any) {
      let item: any;
      _.forIn(data, (v, k) => {
        children1 = [];
        _.forIn(v, (v2, k2) => {
          children2 = [];
          _.each(v2, (v3: any, i: number) => {
            const children = {
              id: `dbit/${v3.run_id}`,
              type: 'dbit',
              name: `DBiT/${v3.run_id}`,
              children: [],
            };
            children2.push(children);
          });
          const children = {
            id: `chip/${k2}`,
            type: 'chip',
            name: `Chip/${k2}`,
            children: children2,
          };
          children1.push(children);
        });
        item = {
          id: `wafer/${k}`,
          type: 'wafer',
          name: `Wafer/${k}`,
          children: children1,
        };
        items.value.push(item);
      });
      filtered_items.value = items.value;
    }
    function filterTree(treeData: any, key: string) {
      const filtered_output: any = [];
      _.each(treeData, (parent: any, i: number) => {
        if (parent.id.includes(key)) {
          filtered_output.push(parent);
        } else {
          const new_parent: any = { };
          Object.assign(new_parent, parent);
          new_parent.children = [];
          const new_chips: any[] = [];
          if ('children' in parent) {
            _.each(parent.children, (c1: any, i2: number) => {
              if (c1.id.includes(key)) {
                new_chips.push(c1);
              } else if ('children' in c1) {
                const current_chip: any = { };
                Object.assign(current_chip, c1);
                current_chip.children = [];
                const dbits: any[] = [];
                _.each(c1.children, (c2: any, i3: number) => {
                  if (c2.id.includes(key)) {
                    dbits.push(c2);
                  }
                });
                if (dbits.length > 0) {
                  current_chip.children = dbits;
                  new_chips.push(current_chip);
                }
              }
            });
            if (new_chips.length > 0) {
              new_parent.children = new_chips;
              filtered_output.push(new_parent);
            }
          }
        }
      });
      return filtered_output;
    }
    async function fetchTreeData() {
      if (!client.value) {
        return;
      }
      items.value = [];
      search.value = '';
      loading.value = true;
      const payload = { params: { filter: null, options: null } };
      const track = await client.value.getWaferTrace(payload);
      loading.value = false;
      convertToTree(track);
    }
    async function searchAction() {
      filtered_items.value = filterTree(items.value, search.value);
    }
    function item_filter(x: string) {
      if (x.includes('dbit')) return true;
      return false;
    }
    async function loadStudies(dbit_ids: string[], image_name: string) {
      if (!client.value) return;
      const fltr = { id: { $in: dbit_ids } };
      const payload = { params: { filter: fltr } };
      const resp = await client.value.getStudies(payload);
      if (resp.length < 1) {
        images.value = [];
        image_items.value = [];
        image_selected.value = null;
        return;
      }
      const [first_item] = resp;
      image_items.value = Object.keys(first_item.files.images);
      image_selected.value = 'umi-1';
      image_paths.value = resp;
    }
    watch(tree_selected, async (nv, ov) => {
      select_items_all.value = nv;
      select_items.value = select_items_all.value.filter(item_filter);
      const dbit_ids = select_items.value.map((x) => x.split('/')[1]);
      await loadStudies(dbit_ids, image_selected.value);
    });

    watch(image_selected, async (nv, ov) => {
      if (!client.value || !nv) {
        return;
      }
      images.value = [];
      image_paths.value = _.sortBy(image_paths.value, ['id']);
      // _.each(image_paths.value, async (v) => {
      //   const fn = `${v.files.root}/${v.files.images[image_selected.value]}`;
      //   if (client.value) {
      //     const resp = await client.value.getImage({ params: { filename: fn } });
      //     const elm = { id: v.id, image_src: URL.createObjectURL(resp) };
      //     images.value.push(elm);
      //   }
      // });
      item_loading.value = true;
      const promises: any[] = [];
      _.each(image_paths.value, (v) => {
        const fn = `${v.files.root}/${v.files.images[image_selected.value]}`;
        if (client.value) {
          const resp: Promise<any> = client.value.getImage({ params: { filename: fn } });
          promises.push(resp);
        } else {
          console.log('api client null');
        }
      });
      const temp_array: any[] = [];
      Promise.all(promises).then((resps) => {
        _.each(resps, (v) => {
          const elm = { id: v.name, image_src: URL.createObjectURL(v) };
          temp_array.push(elm);
        });
        images.value = _.sortBy(temp_array, ['id']);
        item_loading.value = false;
      });
    });

    return {
      search,
      items,
      filtered_items,
      image_selected,
      image_items,
      currentItemForTable,
      currentDataName,
      loading,
      item_loading,
      activated,
      tree_selected,
      searchAction,
      fetchTreeData,
      images,
    };
  },

});

</script>
<style>
  .iv_image_parent {
    overflow-y: auto;
    height: 88vh;
  }
  .iv_image_card {
/*    height: 44vh;*/
  }
  .iv_tree_card {
    width: 30vh;
  }
  .iv_treeview {
    overflow-y: auto;
    height: 76vh;
  }
</style>
