<template>
  <v-container fluid>
    <v-card :loading="loading">
      <v-card-title>
        Illumina Sequence Transfer from BaseSpace (Fastq only)
      </v-card-title>
      <v-card-text>
      </v-card-text>
      <v-card-actions>
        <v-row>
          <v-spacer/>
          <v-col>
            <v-btn
                icon
                color="primary"
                @click="listBatches">
              <v-icon>mdi-play-circle</v-icon><span>List Batches</span>
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
                icon
                :disabled="false"
                color="warning"
                @click="reset">
              <v-icon>mdi-keyboard-backspace</v-icon><span>Reset</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
    <v-card v-if="batchList.length > 0" flat>
      <v-card-title>
        <v-row>
          <v-col>
            [{{ currentPage + 1 }}-{{ batchList.length + currentPage }}] / {{ totalPage }}
          </v-col>
          <v-col>
            <v-btn
              icon
              @click="moveOffset(false)"
              color="primary"
              :disabled="currentPage < 1">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <v-btn
              icon
              @click="moveOffset(true)"
              color="primary"
              :disabled="(currentPage + pagingLimit + 1) >= totalPage ">
              <v-icon>mdi-arrow-right</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>
    </v-card>
    <template v-for="run in batchList">
      <v-card v-bind:key="run.Id">
        <v-card-subtitle>
          <v-row>
            <v-col cols="12" sm="3">
            {{ run.run_id }} ({{ run.DatasetType.Name }})
            <span v-if="downloadStatus[run.Id].done">
              <v-icon color="success">mdi-check</v-icon>
            </span>
            </v-col>
            <v-col cols="12" sm="3">
              <v-progress-linear
                v-if="downloadStatus[run.Id].running"
                :me="downloadStatus[run.Id].progress"
                :value="downloadStatus[run.Id].progress"/>
            </v-col>
            <v-col
              cols="12" sm="2"
              v-if="downloadStatus[run.Id].status">
              {{ downloadStatus[run.Id].status.status }}
              <span v-if="downloadStatus[run.Id].started || downloadStatus[run.Id].done">{{ downloadStatus[run.Id].progress }}%</span>
            </v-col>
            <v-col cols="12" sm="2">
              <span v-if="downloadStatus[run.Id].status">
                {{ downloadStatus[run.Id].status.position}}
              </span>
            </v-col>
            <v-spacer/>
            <v-col cols="12" sm="2">
              <v-btn
                small
                icon
                color='primary'
                :disabled="downloadStatus[run.Id].started || downloadStatus[run.Id].done"
                @click="executeDownload(run,$event)">
                <v-icon>mdi-cloud-download</v-icon><span>Download To S3</span></v-btn>
            </v-col>
          </v-row>
        </v-card-subtitle>
        <v-card-text>
          <v-simple-table dense>
              <tbody>
                <tr>
                  <th>Dataset Name : {{ run.Name }}, Project Name : {{ run.Project.Name }} </th>
                </tr>
                <tr>
                  <th>Total Size : {{ new Intl.NumberFormat('en-IN', { style: 'decimal' }).format(run.TotalSize / (1024*1024)) }} MB , Created on {{ run.DateCreated.substr(0,10) }} </th>
                </tr>
                <tr v-for="dlink, i in run.file_downloads" v-bind:key="dlink.name">
                  <th>
                    File {{ i + 1 }}  : {{ dlink.name }} , Size : {{ new Intl.NumberFormat('en-IN', { style: 'decimal' }).format(dlink.size / (1024*1024)) }} MB <v-icon>mdi-arrow-right</v-icon> {{ dlink.outpath }}  <span v-if="dlink.output_exists" class="warning">WARNING : File already exists</span>
                  </th>
                </tr>
              </tbody>
          </v-simple-table>
        </v-card-text>
      </v-card>
    </template>
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { generateRouteByQuery, inputRules } from '@/utils';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'IlluminaTransfer',
  props: ['query', 'disabled'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const loading = ref<boolean>(false);
    const downloadStatus = ref<any>({});
    const batchList = ref<any[]>([]);
    const currentPage = ref<number>(0);
    const totalPage = ref<number>(0);
    const pagingLimit = ref<number>(10);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    async function listBatches(ev: any, offset = 0) {
      if (!client.value) return;
      batchList.value = [];
      loading.value = true;
      try {
        const allres: any = await client.value.postTaskSync('core.list_basespace_datasets', [offset], {}, 'atxcloud_core');
        const res = allres.Items;
        currentPage.value = allres.Paging.Offset;
        totalPage.value = allres.Paging.TotalCount;
        const tmp: any = {};
        // console.log(res);
        res.forEach((x: any) => {
          tmp[x.Id] = { progress: 0, started: false, running: false, done: false, status: null };
        });
        batchList.value = res;
        downloadStatus.value = tmp;
        snackbar.dispatch({ text: 'Batch information retrieved', options: { color: 'success', right: true } });
      } catch (e) {
        console.log(e);
        snackbar.dispatch({ text: 'Error in retrieving batch information', options: { color: 'error', right: true } });
      } finally {
        loading.value = false;
      }
    }
    async function moveOffset(goNext: boolean) {
      if (goNext) await listBatches(null, currentPage.value + pagingLimit.value);
      else await listBatches(null, currentPage.value - pagingLimit.value);
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
    };
    async function executeDownload(payload: any, ev: any) {
      if (!client.value) return;
      // console.log(payload);
      downloadStatus.value[payload.Id].progress = 0;
      downloadStatus.value[payload.Id].started = true;
      const task = 'core.download_from_basespace_href';
      const queue = 'atxcloud_core';
      const args: any[] = [payload.file_downloads];
      const kwargs = {};
      const taskObject = await client.value.postTask(task, args, kwargs, queue);
      await checkTaskStatus(taskObject._id);
      /* eslint-disable no-await-in-loop */
      while (taskStatus.value.status !== 'SUCCESS' && taskStatus.value.status !== 'FAILURE') {
        if (taskStatus.value.status === 'PROGRESS') {
          // progressMessage.value = `${taskStatus.value.progress}% - ${taskStatus.value.position}`;
          downloadStatus.value[payload.Id].progress = taskStatus.value.progress;
          downloadStatus.value[payload.Id].running = true;
        }
        await new Promise((r) => {
          taskTimeout.value = window.setTimeout(r, 1000);
        });
        taskTimeout.value = null;
        await checkTaskStatus(taskObject._id);
        downloadStatus.value[payload.Id].status = taskStatus.value;
      }
      /* eslint-disable no-await-in-loop */
      if (taskStatus.value.status !== 'SUCCESS') {
        snackbar.dispatch({ text: 'Worker failed', options: { right: true, color: 'error' } });
      } else {
        downloadStatus.value[payload.Id].progress = 100;
        downloadStatus.value[payload.Id].started = false;
        downloadStatus.value[payload.Id].done = true;
      }
      downloadStatus.value[payload.Id].running = false;
    }

    async function reset() {
      batchList.value = [];
    }
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
    });
    return {
      loading,
      reset,
      inputRules,
      listBatches,
      batchList,
      downloadStatus,
      executeDownload,
      taskStatus,
      currentPage,
      totalPage,
      pagingLimit,
      moveOffset,
    };
  },
});

</script>

<style>

</style>
