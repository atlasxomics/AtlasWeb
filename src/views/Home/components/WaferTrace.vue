<template>
    <v-container fluid>
      <v-row>
        <v-col md="3" sm="4">
          <v-card>
            <v-card-title>
              Wafer Trace Tree
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
                @click="fetchData"
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
              class="treeview">
              <v-treeview
                v-model="selected"
                activatable
                selectable
                dense
                :items="filtered_items"
                @update:active="activateItem"
              />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="9" sm="8">
          <v-card>
            <v-card-title>
              {{ currentDataName }} Details
              <v-spacer/>
              <v-checkbox v-model="include_dbit" label="DBiT"/>
              <v-checkbox v-model="include_chip" label="Chip"/>
              <v-spacer/>
              <span v-if="item_loading">
                <v-progress-circular
                  :size="20"
                  indeterminate
                  color="primary"
                ></v-progress-circular>
              </span>
              <v-select
                v-model="select_selected"
                :items="select_items"
                item-text="id"
                item-value="id"
                persistent-hint
                return-object
                single-line
              />
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-data-table
                height="20vh"
                dense
                hide-default-footer
                :items-per-page="1000"
                :headers="headers"
                :items="currentItemForTable"
                />
            </v-card-text>
          </v-card>
          <v-row>
            <v-col md="6">
              <v-card class="image_card_parent">
                <v-select
                  v-model="image_selected"
                  :items="image_items"
                  item-text="id"
                  item-value="path"
                  single_line
                  />
                <v-img
                  class="image_card"
                  :src="image_src"
                  contain
                  />
              </v-card>
            </v-col>
            <v-col md="6">
              <v-card class="image_card_parent">
                <v-select
                  v-model="image_selected2"
                  :items="image_items"
                  item-text="id"
                  item-value="path"
                  single_line
                  />
                <v-img
                  class="image_card"
                  :src="image_src2"
                  contain
                  />
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
</template>

<script lang="ts">
import _ from 'lodash';
import { defineComponent, ref, computed, onMounted, watch } from '@vue/composition-api';
import { snackbar } from '@/components/GlobalSnackbar';
import store from '@/store';

const headers = [
  { text: 'Field', value: 'name' },
  { text: 'Value', value: 'value' },
];

export default defineComponent({
  name: 'WaferTrace',
  setup() {
    const client = computed(() => store.state.client);
    const search = ref<string>('');
    const items = ref<any[]>([]);
    const filtered_items = ref<any[]>([]);
    const select_items = ref<any[]>([]);
    const select_items_all = ref<any[]>([]);
    const select_selected = ref<string>();
    const currentDataName = ref<string>();
    const currentItemForTable = ref<any[]>([]);
    const loading = ref(false);
    const item_loading = ref(false);
    const activated = ref([]);
    const selected = ref([]);
    const asset_data = ref<any>();
    const image_selected = ref<any>();
    const image_selected2 = ref<any>();
    const image_items = ref<any[]>([]);
    const image = ref(new window.Image());
    const image2 = ref(new window.Image());
    const image_src = ref<string | null>();
    const image_src2 = ref<string | null>();
    const include_dbit = ref<boolean>(true);
    const include_chip = ref<boolean>(false);
    let children1: any[];
    let children2: any[];
    console.log('WaferTrace Loaded');
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
    function generateDataTableItem(data: any) {
      const result: any[] = [];
      _.forIn(data, (v: any, k: string) => {
        const item = {
          name: k,
          value: v,
        };
        if ((k.trim() !== '') && (k !== '_id')) {
          result.push(item);
        }
      });
      return result;
    }
    async function selectAction(vals: any[]) {
      const splitted = vals.map((v) => v.split('/'));
      const item_id = vals[0];
      if (splitted.length < 1) {
        return;
      }
      if (!client.value) {
        return;
      }
      item_loading.value = true;
      image_items.value = [];
      image_src.value = null;
      image_src2.value = null;
      image_selected.value = null;
      image_selected2.value = null;

      const [type, id] = splitted[0];
      switch (type) {
        case 'wafer': {
          const payload = { params: { filter: JSON.stringify({ wafer_id: id }), options: null } };
          const result: any[] = await client.value.getWafers(payload);
          [asset_data.value] = result;
          break;
        }
        case 'chip': {
          const payload = { params: { filter: JSON.stringify({ chip_id: id }), options: null } };
          const result = await client.value.getChips(payload);
          [asset_data.value] = result;
          break;
        }
        case 'dbit': {
          const payload = { params: { filter: JSON.stringify({ run_id: id }), options: null } };
          const result = await client.value.getDbits(payload);
          [asset_data.value] = result;
          // const fl_payload = { params: { path: `data/${id}.out/Gene/raw/figure` } };
          const fl_payload = { params: { filter: JSON.stringify({ id: `${id}` }), options: null } };
          const [study] = await client.value.getQc(fl_payload);
          if (study) {
            const fl: any[] = Object.values(study.files.images);
            const rootdir: string = study.files.root;
            const fileList: any[] = fl.map((x) => `${rootdir}/${x}`);
            const imageFileList = _.filter(fileList, (x) => x.includes('.png'));
            image_items.value = imageFileList.map((v) => ({ id: v.split('/').pop(), path: v }));
            const umis = image_items.value.filter((x) => (['umi-1.png', 'before_after_umi-1.png'].includes(x.id)));
            const [i1, i2] = umis;
            image_selected.value = i1.path;
            image_selected2.value = i2.path;
          } else {
            snackbar.dispatch({ text: 'No images found', options: { right: true } });
          }
          // [image_selected.value] = image_items.value;
          break;
        }
        default:
      }
      currentDataName.value = type.toUpperCase();
      currentItemForTable.value = generateDataTableItem(asset_data.value);
      [select_selected.value] = vals;
      item_loading.value = false;
    }
    async function activateItem(vals: any[]) {
      const [val] = vals;
      select_items.value = select_items.value.concat(vals);
      [select_selected.value] = vals;
      await selectAction(vals);
    }
    async function fetchData() {
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
      if (include_dbit.value && x.includes('dbit')) return true;
      if (include_chip.value && x.includes('chip')) return true;
      return false;
    }
    watch([include_dbit, include_chip], async (nv, ov) => {
      select_items.value = select_items_all.value.filter(item_filter);
    });
    watch(selected, async (nv, ov) => {
      select_items_all.value = nv;
      select_items.value = select_items_all.value.filter(item_filter);
    });
    watch(select_selected, async (nv, ov) => {
      const item = [select_selected.value];
      await selectAction(item);
    });
    watch(image_selected, async (nv, ov) => {
      if (!client.value || !nv) {
        return;
      }
      // console.log(nv);
      if (nv.includes('.png')) {
        const resp = await client.value.getImage({ params: { filename: nv } });
        const src = URL.createObjectURL(resp);
        image.value = new window.Image();
        image_src.value = src;
      }
    });
    watch(image_selected2, async (nv, ov) => {
      if (!client.value || !nv) {
        return;
      }
      // console.log(nv);
      if (nv.includes('.png')) {
        const resp = await client.value.getImage({ params: { filename: nv } });
        const src = URL.createObjectURL(resp);
        image2.value = new window.Image();
        image_src2.value = src;
      }
    });

    return {
      search,
      items,
      filtered_items,
      select_items,
      select_selected,
      image_selected,
      image_selected2,
      image_items,
      headers,
      currentItemForTable,
      currentDataName,
      loading,
      item_loading,
      activated,
      selected,
      asset_data,
      selectAction,
      searchAction,
      activateItem,
      fetchData,
      image,
      image2,
      image_src,
      image_src2,
      include_dbit,
      include_chip,
    };
  },

});

</script>
<style>
  .image_card_parent {
    height: 52vh;
  }
  .image_card {
    height: 44vh;
  }
  .tree_card {
    width: 30vh;
  }
  .treeview {
    overflow-y: auto;
    height: 76vh;
  }
</style>
