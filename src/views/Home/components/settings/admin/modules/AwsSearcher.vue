<template>
    <v-col>
          <v-select
            :disabled="loading"
            :loading="loading"
            v-model="bucket_name"
            :items="available_buckets"
            clearable
            @input="generatePaths"
            label="Bucket"/>
          <v-row>
          <v-text-field
          label="Path"
          :disabled="(loading || !bucket_name || path_selected)"
          :loading="loading"
          v-model="path_name"
          @input="filterPaths"
          hint="ex: <bucket_name>/folder with <h5ad files>/">
          </v-text-field>
            <v-icon
            v-if="path_selected"
            :disabled="!run_id_selected_bool"
            color="red"
            @click="path_selected = false;filterPaths()"
            >
              mdi-pencil
            </v-icon>
          </v-row>
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
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from '@vue/composition-api';
import store from '@/store';

export default defineComponent({
  name: 'AwsSearcher',
  props: {
    filters: { type: Array, default: null, required: false },
    path: { type: String, default: '', required: false },
    delimiter: { type: String, default: null, required: false },
    only_files: { type: Boolean, default: false, required: false },
  },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const loading = ref<boolean>(false);
    const available_buckets = ref<string[]>([]);
    const bucket_headers = [{ text: 'Path Names', value: 'path', sortable: false }];
    const bucket_name = ref<string>('');
    const available_paths = ref<any[]>([]);
    const search_consistent_paths = ref<any[]>([]);
    const path_name = ref<string>('');
    const path_selected = ref<boolean>(false);
    async function generatePaths() {
      if (!bucket_name.value || bucket_name.value.length === 0) return;
      path_selected.value = false;
      loading.value = true;
      const payload: any = { path: props.path, bucket: bucket_name.value, filter: props.filters, delimiter: props.delimiter, only_files: props.only_files };
      const important_objects = await client.value?.getFileList(payload);
      console.log(important_objects);
      const noRepeats = [...new Set(important_objects)];
      available_paths.value = noRepeats.map((v: any) => ({ path: v }));
      search_consistent_paths.value = available_paths.value;
      loading.value = false;
      path_name.value = '';
    }
    function filterPaths() {
      const temp_paths = available_paths.value.filter((v: any) => v.path.includes(path_name.value));
      search_consistent_paths.value = temp_paths;
    }
    async function fetchBuckets() {
      const list_buckets = await client.value?.getBuckets();
      const temp_avbuck = list_buckets.map((v: any) => v);
      available_buckets.value = temp_avbuck;
    }
    async function searchPath() {
      if (path_name.value!.length === null || path_name.value!.length === 0) return;
      loading.value = true;
      const payload = { path: path_name.value, bucket: bucket_name.value, filter: ['h5ad', 'motifs.csv'] };
      const important_objects = await client.value?.getFileList(payload);
      const one_string = important_objects.join();
      const allFileHold: any[] = [];
      loading.value = false;
    }
    function select_path(ev: any) {
      path_selected.value = true;
      path_name.value = ev.path;
      searchPath();
    }
    onMounted(() => {
      fetchBuckets();
    });
    return {
      loading,
      available_buckets,
      bucket_name,
      path_name,
      path_selected,
      available_paths,
      search_consistent_paths,
      bucket_headers,
      generatePaths,
      filterPaths,
      select_path,
    };
  },
});

</script>
