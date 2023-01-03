<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="6">
        <v-card flat>
          <v-card-title>Run ID</v-card-title>
          <v-card-actions>
        <run-id-selector
          @run-selected="run_id_selected"
          @edit-run-id="edit_run_id"
          @close-edit-run-id="run_id_selected_bool = true"
          >
        </run-id-selector>
          </v-card-actions>
          </v-card>
      </v-col>
      <v-col cols="12" sm="6">
        <v-card flat>
          <v-card-title>Path to H5AD File</v-card-title>
          <v-select
            :disabled="loading || !run_id_selected_bool"
            :loading="loading"
            v-model="bucket_name"
            :items="available_buckets"
            clearable
            @input="generatePaths"
            label="Bucket"/>
          <v-row>
          <v-text-field
          label="Path"
          width="70%"
          clearable
          :disabled="(loading || !bucket_name || path_selected)"
          :loading="loading"
          v-model="path_name"
          @input="filterPaths"
          hint="ex: <bucket_name>/folder with <h5ad files>/">
          <!-- <template v-slot:append-outer>
            <v-icon color="green" @click="searchPath">
              mdi-magnify
            </v-icon> -->
          <!-- </template> -->
          </v-text-field>
            <v-icon
            v-if="path_selected"
            color="red"
            @click="path_selected = false"
            >
              mdi-pencil
            </v-icon>
          </v-row>
          <v-simple-table
          v-if="(path_selected)"
          dense
          >
            <template v-slot:default>
              <thead>
                <tr><th>Status</th><th>File Name</th></tr>
              </thead>
              <tbody>
                <tr v-for="item in all_files" :key="item.name">
                  <td v-if="item.visible">{{`${(item.value) ? 'Present':'Not Present'}`}}</td>
                  <td v-if="item.visible"><v-chip small :color="item.color" label>{{(item.name)}}</v-chip></td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
          <v-checkbox :color="'green'" @click="toggle_transcriptome" value="is_transcriptome" v-if="(all_files.length > 0 && path_selected)" label="Is this run Transcriptome" />
          <v-data-table
            v-if="(bucket_name && !loading && !path_selected)"
            dense
            single-select
            :items-per-page="5"
            :headers="bucket_headers"
            :items="search_consistent_paths"
            @click:row="select_path">
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-btn
          :disabled="((!is_transcriptome || !genes_h5ad_present) && !all_files_present || !path_selected || loading || !bucket_name || !run_id_selected_bool)"
          style="position: relative; left: 50%; bottom: 5%;"
          @click="createObjects">
          Submit
        </v-btn>
        <jobs-table
        v-if="path_selected"
          :filter_username="true"
          :filter_job_name="true"
          job_name="webfile.create_files"
        >
        </jobs-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Client } from '@/api';
import { snackbar } from '@/components/GlobalSnackbar';
import store from '@/store';
import JobsTable from '@/views/Home/components/settings/admin/modules/JobsTable.vue';
import { defineComponent, onMounted, ref, computed, watch } from '@vue/composition-api';
import RunIdSelector from './RunIdSelector.vue';

export default defineComponent({
  name: 'CreateWebObject',
  components: { JobsTable, RunIdSelector },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const path_name = ref<string | null>(null);
    const bucket_headers = [{ text: 'Path Names', value: 'path', sortable: false }];
    const available_buckets = ref<any[]>([]);
    const bucket_name = ref<string | null>(null);
    const bucket_selected = ref<boolean>(false);
    const available_paths = ref<any[]>([]);
    const search_consistent_paths = ref<any>([]);
    const loading = ref<boolean>(false);
    const all_files = ref<any[]>([]);
    const checkbox_flag = ref<boolean>(false);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    const progressMessage = ref<string | null>(null);
    const path_selected = ref<boolean>(false);
    const run_id_selected_bool = ref<boolean>(false);
    const is_transcriptome = ref<boolean>(false);
    const all_files_present = ref<boolean>(false);
    const genes_h5ad_present = ref<boolean>(false);
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
    };
    function filterPaths(ev: any) {
      const temp_paths = available_paths.value.filter((v: any) => v.path.includes(ev));
      search_consistent_paths.value = temp_paths;
    }
    function updatePath(ev: any) {
      // all_files.value = [];
      checkbox_flag.value = false;
      path_name.value = ev.path;
    }
    function run_id_selected(ev: any) {
      console.log(ev);
      run_id_selected_bool.value = true;
    }
    function edit_run_id() {
      run_id_selected_bool.value = false;
      console.log('edit run id');
    }
    async function fetchBuckets() {
      const list_buckets = await client.value?.getBuckets();
      const temp_avbuck = list_buckets.map((v: any) => v);
      available_buckets.value = temp_avbuck;
    }
    async function generatePaths() {
      if (!bucket_name.value || bucket_name.value.length === 0) return;
      path_selected.value = false;
      genes_h5ad_present.value = false;
      all_files_present.value = false;
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
      search_consistent_paths.value = available_paths.value;
      loading.value = false;
      path_name.value = null;
    }
    function toggle_transcriptome() {
      is_transcriptome.value = !is_transcriptome.value;
      if (is_transcriptome.value === true) {
        all_files.value.forEach((file: any, index: number) => {
          if (file.name !== 'genes.h5ad') {
            all_files.value[index].visible = false;
          }
          console.log(file);
          console.log(index);
        });
      } else {
        console.log('not transcriptome');
        all_files.value.forEach((file: any, index: number) => {
          all_files.value[index].visible = true;
        });
      }
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
        if (one_string.includes(v)) allFileHold.push({ name: v, color: 'green', value: true, visible: true });
        else allFileHold.push({ name: v, color: 'red', value: false, visible: true });
      });
      all_files.value = allFileHold;
      if (one_string.includes('genes.h5ad') && one_string.includes('motifs.h5ad') && one_string.includes('motifs.csv')) {
        checkbox_flag.value = false;
        all_files_present.value = true;
        genes_h5ad_present.value = true;
      } else if (one_string.includes('genes.h5ad')) {
        checkbox_flag.value = true;
        all_files_present.value = false;
        genes_h5ad_present.value = true;
      } else {
        checkbox_flag.value = true;
        all_files_present.value = false;
        genes_h5ad_present.value = false;
      }
      loading.value = false;
    }
    function select_path(ev: any) {
      all_files.value = [];
      path_selected.value = true;
      path_name.value = ev.path;
      searchPath();
      console.log(ev);
    }
    async function updateProgress(value: number) {
      // not working
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
        const kwargs = {};
        // const kwargs: any = { run_id: run_id.value };
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
      checkbox_flag,
      taskStatus,
      taskTimeout,
      progressMessage,
      search_consistent_paths,
      run_id_selected_bool,
      path_selected,
      fetchBuckets,
      searchPath,
      updatePath,
      generatePaths,
      createObjects,
      filterPaths,
      updateProgress,
      edit_run_id,
      run_id_selected,
      is_transcriptome,
      select_path,
      toggle_transcriptome,
      all_files_present,
      genes_h5ad_present,
    };
  },
});
</script>
