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
          <v-card flat>
            <v-select
                v-model="currentTask"
                v-if="workers"
                :items="workers"
                item-text="task"
                item-value="task"
                label="Current Task"
                return-object
                @change="selectActionTask"/>
            <template v-if="currentTask">
              <v-text-field
                  v-model="currentTask.worker"
                  disabled
                  label="Worker"/>
              <v-text-field
                  v-model="currentTask.queues"
                  disabled
                  label="Queue"/>
            </template>
          </v-card>
          <v-card v-if="currentItem" flat>
            <v-card-title>
              {{ currentItem.id }}
            </v-card-title>
            <v-card-text>

            </v-card-text>
            <v-card-actions>
              <v-btn color="primary">Run Task</v-btn>
            </v-card-actions>
          </v-card>
          <v-card v-if="currentItem && taskPayload" flat>
            {{ taskPayload.result }}
          </v-card>
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
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const search = ref<string>('');
    const items = ref<any[]>([]);
    const selected = ref<any>();
    const currentItem = ref<any | null>(null);
    const loading = ref(false);
    const taskPayload = ref<Task | null>(null);
    const workers = ref<any[] | null>(null);
    const currentTask = ref<string | null>(null);
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
      currentItem.value = null;
      currentTask.value = null;
      taskPayload.value = null;
      workers.value = null;
      loading.value = true;
      workers.value = await client.value.getWorkerSummary();
      const fl_payload = { params: { path: 'data', bucket: 'atx-cloud-dev', filter: 'spatial/metadata.json' } };
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
    async function selectActionTask(ev: any) {
      // console.log(ev);
      currentTask.value = ev;
    }
    const submenu = [
      {
        text: 'Refresh',
        icon: 'mdi-refresh',
        color: 'primary',
        tooltip: 'Refresh',
        click: async () => {
          await fetchData();
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
      taskPayload,
      workers,
      currentTask,
      selectActionTask,
    };
  },
});

</script>

<style>

</style>
