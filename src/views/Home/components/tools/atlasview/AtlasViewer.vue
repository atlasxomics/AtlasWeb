<template>
    <v-container v-if="resolveAuthGroup(['admin'])" fluid>
    <fresh-dialog
      v-model="uploadQcDirectoryMenu"
    >
      <upload-qc-directory-menu />
    </fresh-dialog>
      <v-row>
        <v-col cols="12" sm="3">
          <v-card>
            <v-card-title>
              Atlas Viewer
              </v-card-title>
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                :label="`Search`"
                single-line
                hide-details
                :loading="loading"
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
                :loading="loading"
                sort-by="id"
                hide-default-footer
                @click:row="selectAction"
              >
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="9">
          <v-card flat>
            <v-card-title>
              RUN <span v-if="currentItem"> - {{ currentItem.id }} </span>
            </v-card-title>
          </v-card>
          <v-tabs
            v-model="tab"
            >
            <v-tab v-for="item in tabs" :key="item">
              {{ item }}
            </v-tab>
          </v-tabs>
          <v-tabs-items v-model="tab">
            <v-tab-item key="Figures">
              <v-card class="iv_image_parent" v-if="currentItem">
                <v-card-title>
                  Figures
                </v-card-title>
                <v-card-text>
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
            <v-tab-item key="Metadata">
              <v-card v-if="currentItem && metadata">
                <v-card-title>
                  Metadata
                </v-card-title>
                <v-simple-table>
                  <tbody>
                    <tr>
                      <td>Species</td>
                      <td>{{ metadata.species }}</td>
                    </tr>
                    <tr>
                      <td>Sample Type</td>
                      <td>{{ metadata.type }}</td>
                    </tr>
                    <tr>
                      <td>Assay</td>
                      <td>{{ metadata.assay }}</td>
                    </tr>
                  </tbody>
                </v-simple-table>
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
import { objectToArray, generateRouteByQuery } from '@/utils';
import { resolveAuthGroup } from '@/utils/auth';
import FreshDialog from '@/components/FreshDialog.vue';
import UploadQcDirectoryMenu from '@/filemenu/file/components/UploadQCDirectoryMenu.vue';
import { uploadQcDirectoryMenu } from '@/filemenu/file/state';

const tabs = ['Figures', 'Metadata'];
const headers = [
  { text: 'ID', value: 'id' },
];

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));

  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});
const submenu = [
  {
    text: 'Upload QC Directory',
    icon: 'mdi-upload',
    tooltip: 'Upload QC Directory',
    color: 'primary',
    click: () => {
      uploadQcDirectoryMenu.value = true;
    },
  },
];
export default defineComponent({
  name: 'AtlasViewer',
  props: ['query'],
  components: { FreshDialog, UploadQcDirectoryMenu },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const currentRoute = computed(() => ctx.root.$route);
    const client = computed(() => store.state.client);
    const search = ref<string>('');
    const search_details = ref<string>('');
    const items = ref<any[]>([]);
    const details = ref<any[] | null>();
    const selected = ref<any>();
    const currentItem = ref<any | null>(null);
    const images = ref<any>([]);
    const metadata = ref<any | null>(null);
    const loading = ref(false);
    const tab = ref<string>('Figures');
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    async function fetchFileList() {
      if (!client.value) {
        return;
      }
      items.value = [];
      search.value = '';
      loading.value = true;
      const fl_payload = { params: { path: 'data', filter: 'out/' } };
      const filelist = await client.value.getFileList(fl_payload);
      const runids = filelist.filter((v: string) => v.includes('metadata.json')).map((x: string) => x.split('/')[1]);
      const qc_list: any[] = [];
      runids.forEach((v: any) => {
        const subfiles = filelist.filter((x: string) => x.includes(v));
        const [metadatafile] = subfiles.filter((x: string) => x.includes('metadata.json'));
        const imagefiles = subfiles.filter((y: string) => y.toLowerCase().includes('.png') || y.toLowerCase().includes('.jpg') || y.toLowerCase().includes('.jpeg'));
        const temp = {
          id: v,
          metadatafile,
          files: subfiles,
          imagefiles,
        };
        qc_list.push(temp);
      });
      items.value = qc_list;
      loading.value = false;
    }
    async function searchAction() {
      // console.log(search.value);
    }
    async function loadSpatial(qcEntry: any) {
      if (!client.value) {
        return;
      }
      if (!qcEntry) {
        snackbar.dispatch({ text: 'Failed to load', options: { right: true, color: 'error' } });
        return;
      }
      metadata.value = await client.value.getJsonFile({ params: { filename: qcEntry.metadatafile } });
      const image_paths = objectToArray(qcEntry.imagefiles);
      const promises = image_paths.map((x) => {
        const fn = x.value;
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
        loading.value = false;
      });
    }
    async function selectAction(ev: any) {
      try {
        // console.log(ev);
        loading.value = true;
        currentItem.value = ev;
        pushByQuery({ component: 'AtlasViewer', run_id: ev.id });
        await loadSpatial(ev);
        loading.value = false;
      } catch (e) {
        snackbar.dispatch({ text: `Failed to load the deatils of ${ev.id}`, options: { right: true, color: 'error' } });
        loading.value = false;
        details.value = [];
      }
      if (!details.value) return;
      if (details.value.length < 1) {
        snackbar.dispatch({ text: `Failed to load the deatils of ${ev.id}`, options: { right: true, color: 'error' } });
      }
    }
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(submenu);
      await fetchFileList();
      if (props.query) {
        if (props.query.run_id) {
          const [entry] = items.value.filter((v: any) => v.id === props.query.run_id);
          await selectAction(entry);
        }
      }
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
      loading,
      searchAction,
      selectAction,
      details,
      images,
      metadata,
      uploadQcDirectoryMenu,
      resolveAuthGroup,
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
