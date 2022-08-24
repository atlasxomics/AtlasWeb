<template>
  <v-container fluid>
    <v-card :loading="loading">
      <v-card-title>
        Novogen downloading and transfer to S3
      </v-card-title>
      <v-card-text>
        <v-form
          ref="credential_form"
          :disabled="formDisabled"
          v-model="credentialValid">
          <v-text-field
            v-model="credentials.host"
            label="FTP Host"
            :rules="[inputRules.nonEmpty]"
            clearable
            @input="credentialsChanged"
            />
          <v-text-field
            v-model.number="credentials.port"
            label="FTP Port"
            clearable
            :rules="[inputRules.isNumber]"
            @input="credentialsChanged"
            />
          <v-text-field
            v-model="credentials.username"
            label="Username (Batch ID)"
            clearable
            :rules="[inputRules.nonEmpty]"
            @input="credentialsChanged"
            />
          <v-text-field
            v-model="credentials.password"
            type="password"
            label="Password"
            clearable
            :rules="[inputRules.nonEmpty]"
            @input="credentialsChanged"
            />
          <v-text-field
            v-model="credentials.source_root"
            label="FTP Batch Root directory (raw_data)"
            clearable
            :rules="[inputRules.nonEmpty]"
            @input="credentialsChanged"
            />
          <v-text-field
            v-model="credentials.output_root"
            label="S3 Root directory (data)"
            clearable
            :rules="[inputRules.nonEmpty]"
            @input="credentialsChanged"
            />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-row>
          <v-spacer/>
          <v-col>
            <v-btn
                icon
                :disabled="!credentialValid"
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
    <template v-for="run in batchList">
      <v-card v-bind:key="run.source_filename">
        <v-card-subtitle>
          <v-row>
            <v-col cols="12" sm="2">
            {{ run.run_id }}
            <span v-if="downloadStatus[run.source_filename].done">
              <v-icon color="success">mdi-check</v-icon>
            </span>
            </v-col>
            <v-col cols="12" sm="4">
              <v-progress-linear
                v-if="downloadStatus[run.source_filename].running"
                :me="downloadStatus[run.source_filename].progress"
                :value="downloadStatus[run.source_filename].progress"/>
            </v-col>
            <v-col
              cols="12" sm="2"
              v-if="downloadStatus[run.source_filename].status">
              {{ downloadStatus[run.source_filename].status.status }}
              <span v-if="downloadStatus[run.source_filename].started || downloadStatus[run.source_filename].done">{{ downloadStatus[run.source_filename].progress }}%</span>
            </v-col>
            <v-col cols="12" sm="2">
              <span v-if="downloadStatus[run.source_filename].status">
                {{ downloadStatus[run.source_filename].status.position}}
              </span>
            </v-col>
            <v-spacer/>
            <v-col cols="12" sm="2">
              <v-btn
                small
                icon
                color='primary'
                :disabled="downloadStatus[run.source_filename].started || downloadStatus[run.source_filename].done"
                @click="executeDownload(run,$event)">
                <v-icon>mdi-cloud-download</v-icon><span>Download To S3</span></v-btn>
            </v-col>
          </v-row>
        </v-card-subtitle>
        <v-card-text>
          <v-simple-table dense>
              <tbody>
                <tr>
                  <th>File Name : {{ run.source_filename }}</th>
                </tr>
                <tr>
                  <th>Size : {{ new Intl.NumberFormat('en-IN', { style: 'decimal' }).format(run.size / (1024*1024)) }} MB</th>
                </tr>
                <tr>
                  <th>S3 Output Path : {{ run.output_key }} <span v-if="run.output_exists" class="warning">WARNING : File already exists</span></th>
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
  name: 'NovogenTransfer',
  props: ['query', 'disabled'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const loading = ref<boolean>(false);
    const downloadStatus = ref<any>({});
    const formDisabled = ref<boolean>(false);
    const credentials = ref<any>({
      host: null,
      port: 21,
      username: null,
      password: null,
      source_root: null,
      output_root: null,
    });
    const credentialValid = ref<boolean>(false);
    const batchList = ref<any[]>([]);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    async function listBatches(ev: any) {
      if (!client.value) return;
      batchList.value = [];
      loading.value = true;
      try {
        const cr = credentials.value;
        const args = [cr.host, cr.port, cr.username, cr.password, cr.source_root, cr.output_root];
        const res = await client.value.postTaskSync('core.list_novogene_batch', args, {}, 'atxcloud_core');
        const tmp: any = {};
        res.forEach((x: any) => {
          tmp[x.source_filename] = { progress: 0, started: false, running: false, done: false, status: null };
        });
        batchList.value = res;
        downloadStatus.value = tmp;
        snackbar.dispatch({ text: 'Batch information retrieved', options: { color: 'success', right: true } });
        formDisabled.value = true;
      } catch (e) {
        console.log(e);
        snackbar.dispatch({ text: 'Error in retrieving batch information', options: { color: 'error', right: true } });
      } finally {
        loading.value = false;
      }
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
    };
    async function executeDownload(payload: any, ev: any) {
      if (!client.value) return;
      console.log(payload);
      downloadStatus.value[payload.source_filename].progress = 0;
      downloadStatus.value[payload.source_filename].started = true;
      const cr = credentials.value;
      const task = 'core.download_from_ftp_to_s3';
      const queue = 'atxcloud_core';
      const args = [cr.host, cr.port, cr.username, cr.password, payload.source_filename, payload.output_key];
      const kwargs = {};
      const taskObject = await client.value.postTask(task, args, kwargs, queue);
      await checkTaskStatus(taskObject._id);
      /* eslint-disable no-await-in-loop */
      while (taskStatus.value.status !== 'SUCCESS' && taskStatus.value.status !== 'FAILURE') {
        if (taskStatus.value.status === 'PROGRESS') {
          // progressMessage.value = `${taskStatus.value.progress}% - ${taskStatus.value.position}`;
          downloadStatus.value[payload.source_filename].progress = taskStatus.value.progress;
          downloadStatus.value[payload.source_filename].running = true;
        }
        await new Promise((r) => {
          taskTimeout.value = window.setTimeout(r, 1000);
        });
        taskTimeout.value = null;
        await checkTaskStatus(taskObject._id);
        downloadStatus.value[payload.source_filename].status = taskStatus.value;
      }
      /* eslint-disable no-await-in-loop */
      if (taskStatus.value.status !== 'SUCCESS') {
        snackbar.dispatch({ text: 'Worker failed', options: { right: true, color: 'error' } });
      } else {
        downloadStatus.value[payload.source_filename].progress = 100;
        downloadStatus.value[payload.source_filename].started = false;
        downloadStatus.value[payload.source_filename].done = true;
      }
      downloadStatus.value[payload.source_filename].running = false;
    }
    function credentialsChanged(ev: any) {
      batchList.value = [];
    }
    async function initLoader() {
      if (!client.value) return;
      try {
        loading.value = true;
        const { tasks: temp } = await client.value.postTaskSync('core.task_list', [], {}, 'atxcloud_core');
        const default_args = temp['core.list_novogene_batch'].args;
        default_args.forEach((v: any) => {
          credentials.value[v.name] = v.value;
        });
      } catch (e) {
        snackbar.dispatch({ text: 'Error in retrieving task information', options: { color: 'error', right: true } });
      } finally {
        loading.value = false;
      }
    }
    async function reset() {
      batchList.value = [];
      await initLoader();
      formDisabled.value = false;
    }
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
      await initLoader();
    });
    return {
      loading,
      formDisabled,
      reset,
      inputRules,
      credentials,
      credentialValid,
      credentialsChanged,
      listBatches,
      batchList,
      downloadStatus,
      executeDownload,
      taskStatus,
    };
  },
});

</script>

<style>

</style>
