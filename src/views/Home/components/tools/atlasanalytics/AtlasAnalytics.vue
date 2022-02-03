<template>
  <v-container fluid>
<v-row>
        <v-col cols="12" sm="3">
          <v-card>
            <v-card-title>
              Atlas Analytics
              </v-card-title>
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                :label="`Search`"
                single-line
                hide-details
                :loading="loading"
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
          <task-execute ref="taskexecute"/>
        </v-col>
      </v-row>
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { generateRouteByQuery } from '@/utils';
import TaskExecute from './TaskExecute.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});
const headers = [
  { text: 'ID', value: 'id' },
];

interface Task {
  task: string | null;
  queue: string | null;
  args: any[] | null;
  kwargs: any | null;
  result?: any | null;
}

export default defineComponent({
  name: 'AtlasAnalytics',
  props: ['query'],
  components: { TaskExecute },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const search = ref<string>('');
    const items = ref<any[]>([]);
    const selected = ref<any>();
    const currentItem = ref<any | null>(null);
    const loading = ref(false);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    async function fetchData() {
      if (!client.value) {
        return;
      }
      items.value = [];
      search.value = '';
      loading.value = true;
      const fl_payload = { params: { path: 'data', filter: 'spatial/metadata.json' } };
      const filelist = await client.value.getFileList(fl_payload);
      const qc_data = filelist.map((v: string) => ({ id: v.split('/')[1] }));
      items.value = qc_data;
      loading.value = false;
      // console.log(qc_data);
    }
    async function selectAction(ev: any) {
      try {
        // console.log(ev);
        loading.value = true;
        currentItem.value = ev;
      } catch (e) {
        // snackbar.dispatch({ text: `Failed to load the deatils of ${ev.id}`, options: { right: true, color: 'error' } });
        loading.value = false;
      }
      loading.value = false;
    }
    async function refreshWorkers() {
      if (!client.value) return;
      await (ctx as any).refs.taskexecute.refresh();
      snackbar.dispatch({ text: 'Workers refreshed', options: { color: 'success', right: true } });
    }
    const submenu = [
      {
        text: 'Refresh',
        icon: 'mdi-refresh',
        color: 'primary',
        tooltip: 'Refresh',
        click: async () => {
          await refreshWorkers();
        },
      },
    ];
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(submenu);
      await fetchData();
    });
    return {
      search,
      headers,
      items,
      currentItem,
      selected,
      loading,
      selectAction,
    };
  },
});

</script>

<style>

</style>
