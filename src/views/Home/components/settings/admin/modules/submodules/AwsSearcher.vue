<template>
    <div
    >
          <v-select
            :disabled="loading"
            :loading="loading"
            v-model="bucket_name"
            :items="available_buckets"
            @input="generatePaths"
            label="Bucket"/>
          <v-row>
          <v-text-field
          label="Path"
          :disabled="(loading || !bucket_name || path_selected)"
          :loading="loading"
          v-model="path_name"
          hint="ex: <bucket_name>/folder with <h5ad files>/">
          </v-text-field>
            <v-icon
            v-if="path_selected"
            color="red"
            @click="edit_path"
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
    </div>
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
    const path_name = ref<string>('');
    const path_selected = ref<boolean>(false);
    const search_consistent_paths = computed(() => available_paths.value.filter((v: any) => v.path.toLowerCase().includes(path_name.value.toLowerCase())));
    async function get_paths_in_bucket(args: any) {
      loading.value = true;
      const important_objects = await client.value?.getFileList(args);
      const noRepeats = [...new Set(important_objects)];
      loading.value = false;
      available_paths.value = noRepeats.map((v: any) => ({ path: v }));
    }
    async function generatePaths() {
      if (!bucket_name.value || bucket_name.value.length === 0) return;
      ctx.emit('bucket-selected', bucket_name.value);
      path_selected.value = false;
      const args = { path: props.path, bucket: bucket_name.value, filters: props.filters, delimiter: props.filters, only_files: props.only_files };
      await get_paths_in_bucket(args);
      path_name.value = '';
    }
    async function fetchBuckets() {
      const list_buckets = await client.value?.getBuckets();
      const temp_avbuck = list_buckets.map((v: any) => v);
      available_buckets.value = temp_avbuck;
    }
    function edit_path() {
      console.log('editing pat');
      path_selected.value = false;
      ctx.emit('editing-path');
    }
    function select_path(ev: any) {
      path_selected.value = true;
      path_name.value = ev.path;
      const full_path = `S3://${bucket_name.value}/${ev.path}`;
      ctx.emit('path-selected', full_path);
    }
    async function load_from_parent(bucket_name_prop: string, path_name_prop: string) {
      bucket_name.value = bucket_name_prop;
      path_name.value = path_name_prop;
      path_selected.value = true;
      const args: any = { bucket: bucket_name_prop, path: '', filters: [], delimiter: '', only_files: true };
      await get_paths_in_bucket(args);
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
      // filterPaths,
      select_path,
      load_from_parent,
      edit_path,
    };
  },
});

</script>
