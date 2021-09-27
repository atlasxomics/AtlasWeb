<template>
    <v-container fluid>
      <v-row>
        <v-col cols="12" sm="5">
          <v-card>
            <v-card-title>
              Qc Viewer
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
                @click="fetchQcList"
              >
                Reload
              </v-btn>
              </v-card-title>
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                :label="`Search`"
                single-line
                hide-details
                @change="searchAction"
              />
            <v-divider></v-divider>
            <v-card-text
              class="datatable">
              <v-data-table
                height="72vh"
                v-model="selected"
                single-select
                :items-per-page="1000"
                :items=items
                :headers="headers"
                dense
                :search="search"
                hide-default-footer
                @click:row="selectAction"
              >
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="7">
          <v-tabs
            v-model="tab"
            >
            <v-tab v-for="item in tabs" :key="item">
              {{ item }}
            </v-tab>
          </v-tabs>
          <v-tabs-items v-model="tab">
            <v-tab-item key="overview">
              <v-card class="iv_image_parent">
                <v-card-title>
                  DBiT Details - {{ currentItem._id }}
                  <v-spacer/>
                  <span v-if="item_loading">
                    <v-progress-circular
                      :size="20"
                      indeterminate
                      color="primary"
                    ></v-progress-circular>
                  </span>
                </v-card-title>
                <v-text-field
                    v-model="search_details"
                    prepend-inner-icon="mdi-magnify"
                    :label="`Search`"
                    single-line
                    hide-details
                  />
                <v-divider></v-divider>
                <v-card-text>
                  <v-data-table
                    height="20vh"
                    :items-per-page="1000"
                    :items="details"
                    :headers="dbit_headers"
                    dense
                    :search="search_details"
                    hide-default-footer
                  >
                  </v-data-table>
                  <v-card-title>
                    Figures
                  </v-card-title>
                  <template v-for="image in images">
                    <div v-bind:key="image.id">
                      <br/>
                      <v-divider/>
                      {{ image.id }}
                      <v-img
                        class="iv_image_card"
                        :src="image.image_src"
                        contain
                        />
                    </div>
                  </template>
                </v-card-text>
              </v-card>
            </v-tab-item>
            <v-tab-item key="advanced">
              <v-card>
                <v-card-title>
                  Advanced viewer
                </v-card-title>
              </v-card>
            </v-tab-item>
          </v-tabs-items>
        </v-col>
      </v-row>
    </v-container>
</template>

<script lang="ts">
import _ from 'lodash';
import { defineComponent, ref, computed, onMounted, watch, watchEffect } from '@vue/composition-api';
import { snackbar } from '@/components/GlobalSnackbar';
import store from '@/store';
import { objectToArray } from '@/utils';

const tabs = ['overview', 'advanced'];
const headers = [
  { text: 'ID', value: 'id' },
  { text: 'Species', value: 'metadata.species' },
  { text: 'Assay', value: 'metadata.assay' },
  { text: 'Type', value: 'metadata.type' },
];
const dbit_headers = [
  { text: 'Field', value: 'key' },
  { text: 'Value', value: 'value' },
];

const appReadyForClient = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));

  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'QcViewer',
  setup() {
    const client = computed(() => store.state.client);
    const search = ref<string>('');
    const search_details = ref<string>('');
    const items = ref<any[]>([]);
    const details = ref<any[] | null>();
    const selected = ref<any>();
    const currentItem = ref<any>({});
    const images = ref<any>([]);
    const loading = ref(false);
    const item_loading = ref(false);
    const tab = ref<string>('overview');
    async function fetchQcList() {
      if (!client.value) {
        return;
      }
      items.value = [];
      search.value = '';
      loading.value = true;
      const payload = { params: { filter: null, options: null } };
      const qc_data = await client.value.getQc(payload);
      loading.value = false;
      items.value = qc_data;
      // convertToTree(track);
    }
    async function loadDbit(dbit_id: string) {
      if (!client.value) return;
      const fltr = { run_id: dbit_id };
      const payload = { params: { filter: JSON.stringify(fltr) } };
      const resp = await client.value.getDbits(payload);
      if (resp.length < 1) {
        return;
      }
      const [first_item] = resp;
      details.value = objectToArray(first_item);
    }
    async function searchAction() {
      console.log(search.value);
    }
    function item_filter(x: string) {
      if (x.includes('dbit')) return true;
      return false;
    }
    async function loadImages(qcEntry: any) {
      if (!client.value) {
        return;
      }
      const image_paths = objectToArray(qcEntry.files.images);
      const root_dir = qcEntry.files.root;
      const promises = image_paths.map((x) => {
        const fn = `${root_dir}/${x.value}`;
        if (client.value) return client.value.getImage({ params: { filename: fn } });
        return null;
      });
      const temp_array: any[] = [];
      await Promise.allSettled(promises).then((resps: any) => {
        _.each(resps, (v) => {
          if (v.status === 'fulfilled') {
            const elm = { id: v.value.name, image_src: URL.createObjectURL(v.value) };
            temp_array.push(elm);
          } else {
            console.log('Rejected');
            console.log(v);
          }
        });
      }).finally(() => {
        images.value = _.sortBy(temp_array, ['id']);
        item_loading.value = false;
      });
    }
    function resetDetails() {
      details.value = [];
      images.value = [];
    }
    async function selectAction(ev: any) {
      try {
        item_loading.value = true;
        currentItem.value = ev;
        resetDetails();
        await loadDbit(ev.id);
        await loadImages(ev);
        item_loading.value = false;
      } catch (e) {
        snackbar.dispatch({ text: `Failed to load the deatils of ${ev.id}`, options: { right: true, color: 'error' } });
        item_loading.value = false;
        details.value = [];
      }
      if (!details.value) return;
      if (details.value.length < 1) {
        snackbar.dispatch({ text: `Failed to load the deatils of ${ev.id}`, options: { right: true, color: 'error' } });
      }
    }
    onMounted(async () => {
      await appReadyForClient;
    });
    return {
      tabs,
      tab,
      search,
      search_details,
      items,
      currentItem,
      selected,
      headers,
      dbit_headers,
      loading,
      item_loading,
      searchAction,
      selectAction,
      fetchQcList,
      details,
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
