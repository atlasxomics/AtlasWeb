<template>
  <v-container fluid>
    <v-card
      flat>
      <v-card-title>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          :label="`Search`"
          single-line
          hide-details
          :loading="loading"
        />
        <v-spacer/>
        <v-btn
          icon
          color="primary"
          @click="refresh"
        >
        <v-icon>mdi-refresh</v-icon><span>Refresh</span>
        </v-btn>
      </v-card-title>
      <v-card-text
          v-if="workers"
        >
        <v-data-table
          v-model="selected"
          single-select
          :items-per-page="1000"
          :items="workers"
          :headers="headers"
          dense
          :search="search"
          :loading="loading"
          sort-by="worker"
          hide-default-footer
          @click:row="selectAction"
        >
        </v-data-table>
      </v-card-text>
    </v-card>
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
  { text: 'Worker', value: 'worker' },
  { text: 'Task Name', value: 'task' },
  { text: 'Queues', value: 'queues' },
  { text: 'Requested', value: 'requests' },
];
export default defineComponent({
  name: 'WorkerStatus',
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const workers = computed(() => store.state.client?.workers);
    const loading = ref<boolean>(false);
    const search = ref<string>();
    const selected = ref<any>();
    async function refresh() {
      if (!client.value) return;
      loading.value = true;
      await client.value.updateWorkers();
      snackbar.dispatch({ text: 'Workers are loaded', options: { color: 'success', right: true } });
      loading.value = false;
    }
    async function selectAction(ev: any) {
      console.log(ev);
    }
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
    });
    return {
      workers,
      refresh,
      loading,
      search,
      selected,
      headers,
      selectAction,
    };
  },
});

</script>

<style>

</style>
