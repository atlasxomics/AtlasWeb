<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="6">
        <v-card flat>
          <v-card-actions>
        <v-col>
        <b> Create/Select Run ID </b>
        <run-id-selector
          :new_available="true"
          @run-selected="run_id_selected"
          @edit-run-id="edit_run_id"
          @close-edit-run-id="run_id_selected_bool = true"
          @custom-run-id="custom_run_id"
          >
        </run-id-selector>
        <b> Specify H5AD Path </b>
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
          :disabled="(loading || !bucket_name || path_selected || !run_id_selected_bool)"
          :loading="loading"
          v-model="path_name"
          @input="filterPaths"
          hint="ex: <bucket_name>/folder with <h5ad files>/">
          </v-text-field>
            <v-icon
            v-if="path_selected"
            :disabled="!run_id_selected_bool"
            color="red"
            @click="path_selected = false;filterPaths(); creation_job_sent = false;"
            >
              mdi-pencil
            </v-icon>
          </v-row>
          <v-simple-table
          v-if="(path_selected) && (run_id_selected_bool)"
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
          <v-checkbox :color="'green'" @click="toggle_transcriptome"  v-model="is_transcriptome" v-if="(all_files.length > 0 && path_selected)" :disabled="!run_id_selected_bool" label="Is this run Transcriptome" />
          <v-data-table
            v-if="(bucket_name && !loading && !path_selected)"
            dense
            single-select
            :items-per-page="5"
            :headers="bucket_headers"
            :items="search_consistent_paths"
            @click:row="select_path">
          </v-data-table>
            </v-col>
          </v-card-actions>
          </v-card>
        <v-btn
          :disabled="((!is_transcriptome || !genes_h5ad_present) && !all_files_present || !path_selected || loading || !bucket_name || !run_id_selected_bool || creation_job_sent)"
          style="position: relative; left: 45%; bottom: 2%;"
          @click="createObjects">
          Submit
        </v-btn>
      </v-col>
      <v-col cols="12" sm="6">
                <v-card flat
        class="mx-auto"
        v-if="run_id_selected_bool"
        >
        <v-card-title
        style="position: relative;"
        class="justify-center"
        >Run Creation History for {{run_id}}</v-card-title>
        <v-card-actions
        class="justify-center"
        >
        <jobs-table
          ref="job_table"
          :filter_username="true"
          :filter_job_name="true"
          :filter_run_id="true"
          job_name="webfile.create_files"
          :run_id="run_id"
        >
        </jobs-table>
        </v-card-actions>
      </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
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
    const creation_job_sent = ref<boolean>(false);
    const available_paths = ref<any[]>([]);
    const search_consistent_paths = ref<any>([]);
    const loading = ref<boolean>(false);
    const all_files = ref<any[]>([]);
    const checkbox_flag = ref<boolean>(false);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    const progressMessage = ref<string | null>(null);
    const path_selected = ref<boolean>(false);
    const run_id = ref<string>('');
    const run_id_selected_bool = ref<boolean>(false);
    const is_transcriptome = ref<boolean>(false);
    const all_files_present = ref<boolean>(false);
    const genes_h5ad_present = ref<boolean>(false);
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
    };
    function filterPaths() {
      const temp_paths = available_paths.value.filter((v: any) => v.path.includes(path_name.value));
      search_consistent_paths.value = temp_paths;
    }
    function updatePath(ev: any) {
      // all_files.value = [];
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
      path_selected.value = false;
      creation_job_sent.value = false;
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
      path_name.value = '';
    }
    function toggle_transcriptome() {
      creation_job_sent.value = false;
      if (is_transcriptome.value === true) {
        all_files.value.forEach((file: any, index: number) => {
          if (file.name !== 'genes.h5ad') {
            all_files.value[index].visible = false;
          }
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
        let obj: any = {};
        if (one_string.includes(v)) {
          obj = { name: v, color: 'green', value: true, visible: true };
        } else {
          obj = { name: v, color: 'red', value: false, visible: true };
        }
        if (is_transcriptome.value === true && v !== 'genes.h5ad') {
          obj.visible = false;
        }
        allFileHold.push(obj);
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
    }
    async function updateProgress(value: number) {
      // not working
    }
    function update_jobs_table() {
      const jobs_table = ctx.refs.job_table as any;
      console.log(jobs_table);
      jobs_table.get_jobs();
    }
    async function createObjects() {
      if (!client.value) return;
      try {
        const ensure_created = await client.value?.ensure_run_id_created(run_id.value);
        console.log(ensure_created);
        if (ensure_created === 'Success') {
          const task = 'webfile.create_files';
          const queue = 'jonah_webfile';
          const params = {
            aws_path: `${path_name.value}/h5/obj`,
            rna_flag: checkbox_flag.value,
            bucket_name: bucket_name.value,
          };
          const args: any[] = [params];
          const kwargs = { run_id: run_id.value };
          // const kwargs: any = { run_id: run_id.value };
          const taskObject = await client.value.postTask(task, args, kwargs, queue);
          update_jobs_table();
          creation_job_sent.value = true;
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
          update_jobs_table();
          if (taskStatus.value.status !== 'SUCCESS') {
            snackbar.dispatch({ text: 'Worker failed in Creating Object', options: { right: true, color: 'error' } });
            creation_job_sent.value = false;
            loading.value = false;
          } else {
            snackbar.dispatch({ text: 'The Web Objects are created', options: { right: true, color: 'success' } });
            progressMessage.value = taskStatus.value.status;
            const resp = taskStatus.value.result;
          }
        } else {
          snackbar.dispatch({ text: 'Run ID not created', options: { right: true, color: 'error' } });
          creation_job_sent.value = false;
          loading.value = false;
        }
      } catch (error) {
        console.log(error);
      }
    }
    function reset_bucket_path() {
      all_files_present.value = false;
      all_files.value = [];
      path_name.value = '';
      path_selected.value = false;
      available_paths.value = [];
      search_consistent_paths.value = [];
      checkbox_flag.value = false;
      genes_h5ad_present.value = false;
      bucket_name.value = null;
    }
    async function run_id_selected(ev: any) {
      creation_job_sent.value = false;
      reset_bucket_path();
      const run_data = await client.value?.get_info_from_run_id(ev);
      if (run_data[0].assay === 'Transcriptome') {
        is_transcriptome.value = true;
      }
      if (run_data[0].results_folder_path !== null) {
        const path = run_data[0].results_folder_path;
        const inx = path.indexOf('S3://') + 5;
        const non_pre = path.substring(inx);
        const inx2 = non_pre.indexOf('/');
        const bucket = non_pre.substring(0, inx2);
        const sub_path_name = non_pre.substring(inx2 + 1, non_pre.length - 1);
        bucket_name.value = bucket;
        console.log(bucket_name);
        await generatePaths();
        path_name.value = sub_path_name;
        select_path({ path: path_name.value });
      }
      run_id.value = ev;
      run_id_selected_bool.value = true;
    }
    function custom_run_id(id: string) {
      run_id_selected_bool.value = true;
      run_id.value = id;
      is_transcriptome.value = false;
      reset_bucket_path();
    }
    function edit_run_id() {
      run_id_selected_bool.value = false;
    }
    watch(bucket_name, () => {
      if (bucket_name.value === null) {
        reset_bucket_path();
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
      checkbox_flag,
      taskStatus,
      taskTimeout,
      progressMessage,
      search_consistent_paths,
      run_id_selected_bool,
      path_selected,
      fetchBuckets,
      searchPath,
      custom_run_id,
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
      run_id,
      creation_job_sent,
    };
  },
});
</script>
