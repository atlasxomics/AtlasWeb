<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="6">
        <v-card flat>
          <v-card-title>Select Path</v-card-title>
          <v-text-field
          label="Path"
          width="70%"
          clearable
          :disabled="loading"
          :loading="loading"
          v-model="path_name"
          @input="pathText"
          @keyup.enter="searchPath"
          hint="ex: <bucket_name>/folder with <h5ad files>/">
          <template v-slot:append-outer>
            <v-icon color="green" @click="searchPath">
              mdi-magnify
            </v-icon>
          </template>
          </v-text-field>
          <v-simple-table v-if="(all_files.length > 0 && path_name && path_name.length > 0)" dense>
            <template v-slot:default>
              <thead>
                <tr><th>Status</th><th>File Name</th></tr>
              </thead>
              <tbody>
                <tr v-for="item in all_files" :key="item.name">
                  <td>{{`${(item.value) ? 'Present':'Not Present'}`}}</td>
                  <td><v-chip small :color="item.color" label>{{(item.name)}}</v-chip></td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
          <v-checkbox :color="(required_files) ? 'green' : 'red'" @click="required_files = !required_files" v-if="(all_files.length > 0 && path_name && path_name.length > 0 && checkbox_flag)" label="Is this run Transcriptome" />
        </v-card>
      </v-col>
      <v-col cols="12" sm="6">
        <v-card flat>
          <v-card-title>Search Bucket</v-card-title>
          <v-select
            :disabled="loading"
            :loading="loading"
            v-model="bucket_name"
            :items="available_buckets"
            clearable
            @input="generatePaths"
            label="Bucket"/>
          <v-data-table
            v-if="(bucket_name && !loading)"
            dense
            single-select
            :items-per-page="5"
            :headers="bucket_headers"
            :items="available_paths"
            @click:row="updatePath">
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-btn
          :disabled="!required_files"
          style="position: relative; left: 50%; bottom: 5%;"
          @click="createObjects">
          Submit
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Client } from '@/api';
import { snackbar } from '@/components/GlobalSnackbar';
import store from '@/store';
import { defineComponent, onMounted, ref, computed, watch } from '@vue/composition-api';

export default defineComponent({
  name: 'CreateWebObject',
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const path_name = ref<string | null>(null);
    const bucket_headers = [{ text: 'Path Names', value: 'path', sortable: false }];
    const available_buckets = ref<any[]>([]);
    const bucket_name = ref<string | null>(null);
    const available_paths = ref<any[]>([]);
    const loading = ref<boolean>(false);
    const all_files = ref<any[]>([]);
    const required_files = ref<boolean>(false);
    const checkbox_flag = ref<boolean>(false);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    const progressMessage = ref<string | null>(null);
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
    };
    function pathText(ev: any) {
      if (!ev || ev.length === 0) all_files.value = [];
    }
    function updatePath(ev: any) {
      all_files.value = [];
      required_files.value = false;
      checkbox_flag.value = false;
      path_name.value = ev.path;
    }
    async function fetchBuckets() {
      const list_buckets = await client.value?.getBuckets();
      const temp_avbuck = list_buckets.map((v: any) => v);
      available_buckets.value = temp_avbuck;
    }
    async function generatePaths() {
      if (!bucket_name.value || bucket_name.value.length === 0) return;
      required_files.value = false;
      checkbox_flag.value = false;
      loading.value = true;
      const matchPath = (path: string) => {
        const matchRegex = path.match(/(data\/.+\/)(h5)/);
        let xploreId = matchRegex![1];
        if (xploreId) {
          xploreId = xploreId.slice(0, -1);
          return xploreId;
        }
        return '';
      };
      const payload = { path: 'data', bucket: bucket_name.value, filter: ['h5ad'] };
      const important_objects = await client.value?.getFileList(payload);
      const withRepeats = important_objects.map((v: any) => matchPath(v));
      const noRepeats = [...new Set(withRepeats)];
      available_paths.value = noRepeats.map((v: any) => ({ path: v }));
      loading.value = false;
    }
    async function searchPath() {
      if (path_name.value!.length === null || path_name.value!.length === 0) return;
      loading.value = true;
      const fileNames = ['genes.h5ad', 'motifs.h5ad', 'motifs.csv'];
      const payload = { path: path_name.value, bucket: bucket_name.value, filter: ['h5ad', 'motifs.csv'] };
      const important_objects = await client.value?.getFileList(payload);
      const one_string = important_objects.join();
      const allFileHold: any[] = [];
      fileNames.forEach((v: string) => {
        if (one_string.includes(v)) allFileHold.push({ name: v, color: 'green', value: true });
        else allFileHold.push({ name: v, color: 'red', value: false });
      });
      all_files.value = allFileHold;
      if (one_string.includes('genes.h5ad') && one_string.includes('motifs.h5ad')) {
        checkbox_flag.value = false;
        required_files.value = true;
      } else {
        checkbox_flag.value = true;
        required_files.value = false;
      }
      loading.value = false;
    }
    async function updateProgress(value: number) {

    }
    async function createObjects() {
      if (!client.value) return;
      try {
        const task = 'webfile.create_files';
        const queue = 'joshua_webfile';
        const params = {
          aws_path: `${path_name.value}/h5/obj`,
          rna_flag: checkbox_flag.value,
        };
        const args: any[] = [params];
        const kwargs: any = {};
        const taskObject = await client.value.postTask(task, args, kwargs, queue);

        await checkTaskStatus(taskObject._id);
        /* eslint-disable no-await-in-loop */
        while (taskStatus.value.status !== 'SUCCESS' && taskStatus.value.status !== 'FAILURE') {
          if (taskStatus.value.status === 'PROGRESS') {
            await updateProgress(taskStatus.value.progress);
            progressMessage.value = `${taskStatus.value.progress}% - ${taskStatus.value.position}`;
          }
          await new Promise((r) => {
            taskTimeout.value = window.setTimeout(r, 1000);
          });
          taskTimeout.value = null;
          await checkTaskStatus(taskObject._id);
        }
        if (taskStatus.value.status !== 'SUCCESS') {
          snackbar.dispatch({ text: 'Worker failed in Creating Object', options: { right: true, color: 'error' } });
          loading.value = false;
        } else {
          snackbar.dispatch({ text: 'The Web Objects are created', options: { right: true, color: 'success' } });
          progressMessage.value = taskStatus.value.status;
          const resp = taskStatus.value.result;
        }
      } catch (error) {
        console.log(error);
      }
    }
    watch(all_files, (v: any) => {
      if (v.length === 0) {
        required_files.value = false;
        checkbox_flag.value = false;
      }
    });
    onMounted(() => {
      fetchBuckets();
    });
    return {
      path_name,
      bucket_name,
      available_buckets,
      bucket_headers,
      available_paths,
      loading,
      all_files,
      required_files,
      checkbox_flag,
      taskStatus,
      taskTimeout,
      progressMessage,
      fetchBuckets,
      searchPath,
      updatePath,
      generatePaths,
      createObjects,
      pathText,
      updateProgress,
    };
  },
});
</script>
