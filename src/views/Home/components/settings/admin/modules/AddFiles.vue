<template>
    <v-container>
        <v-row
        class="d-flex justify-center"
        >
            <v-col
            cols="5"
            style="padding: 0px;"
            >
                <v-card flat>
                    <v-card-title> Select Run Id </v-card-title>
                    <v-card-actions>
                        <run-id-selector
                        :new_available="false"
                        @edit-run-id="edit_run_id"
                        @close-edit-run-id="close_edit_run_id"
                        @run-selected="run_id_selected"
                        ref="run_id_selector"
                        >
                        </run-id-selector>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <v-row v-for="(file, index) in run_files" :key="file.unique_id" style="position: relative; right: 15%;">
                    <selector
                    :display_options="file_type_options"
                    display_label="File Type"
                    :variable="file.file_type_name"
                    item_text="text"
                    item_value="value"
                    @changed="file.file_type_name = $event"
                    @option-added="added_file_type($event)"
                    >
                    </selector>
                    <v-col
                    cols="5"
                    style="padding: 0px;"
                    >
                    <v-text-field
                    v-show="!file.editing"
                    label="File Path"
                    v-model="file.file_path"
                    readonly
                    >
                    </v-text-field>
                    <aws-searcher
                    v-show="file.editing"
                    :only_files="true"
                    @path-selected="file.file_path = $event"
                    :ref="'aws_searcher_'.concat(file.unique_id)"
                    >
                    </aws-searcher>
                    </v-col>
                    <v-text-field
                    style="position: relative; left: 3%;"
                    label="File Description"
                    v-model="file.file_description"
                    >
                    </v-text-field>
                    <v-icon
                    style="position: relative; left: 8%; bottom: 10px;"
                    @click="edit_file(index)"
                    >
                      mdi-pencil
                    </v-icon>
                    <v-icon
                    large
                    style="position: relative; left: 12%; bottom: 10px;"
                    @click="run_files.splice(index, 1)"
                    >
                        mdi-delete
                    </v-icon>
                </v-row>
            </v-col>
        </v-row>
        <v-row class="d-flex justify-center">
            <v-icon
            large
            color="green"
            @click="add_file"
            >
            mdi-plus
            </v-icon>
        </v-row>
        <v-row class="d-flex justify-center">
            <v-btn
            color="primary"
            @click="submit_file_changes"
            style="margin-bottom: 15px;"
            >
            Submit
            </v-btn>
        </v-row>
    </v-container>
</template>

<script lang='ts'>

import { ref, defineComponent, computed, onMounted } from '@vue/composition-api';
import { Client } from '@/api';
import { get_uuid } from '@/utils';
import store from '@/store';
import RunIdSelector from './submodules/RunIdSelector.vue';
import Selector from './submodules/Selector.vue';
import AwsSearcher from './submodules/AwsSearcher.vue';

export default defineComponent({
  name: 'AddFiles',
  components: {
    RunIdSelector,
    Selector,
    AwsSearcher,
  },
  setup(props: any, ctx: any) {
    const client = computed(() => store.state.client);
    const tissue_id = ref<string>('');
    const run_files = ref<Array<any>>([]);
    const file_type_options = ref<Array<any>>([]);
    const file_type_map = ref<Record<string, any>>({}); // file_type_name,  file_type_id
    const original_list = ref<Record<string, any>>({});
    const file_type_dictionary = ref<Record<string, any>>({});
    const changes_dict = computed(() => {
      const full_changes: Record<string, any> = {};
      run_files.value.forEach((file: any) => {
        const uid = file.unique_id;
        if (uid in original_list.value) {
          Object.keys(file).forEach((key: string) => {
            if ((key in original_list.value[uid]) && (file[key] !== original_list.value[uid][key])) {
              if (!(uid in full_changes)) {
                full_changes[uid] = {};
              }
              full_changes[uid][key] = file[key];
            }
          });
        }
      });
      return full_changes;
    });
    const removed_uuids = computed(() => {
      const removed: string[] = [];
      Object.keys(original_list.value).forEach((key: string) => {
        console.log(key);
        if (!run_files.value.map((file: any) => file.unique_id).includes(key)) {
          removed.push(key);
        }
      });
      return removed;
    });
    async function get_run_files() {
      const files = await client.value!.get_downloadable_files_for_run(tissue_id.value);
      files.forEach((file: any) => {
        const unique = get_uuid();
        const file_type_name_mapped = file_type_dictionary.value[file.file_type_id];
        run_files.value.push({
          file_type_name: file_type_name_mapped,
          file_description: file.file_description,
          file_path: file.file_path,
          file_type_id: file.file_type_id,
          unique_id: unique,
          editing: false,
        });
        original_list.value[unique] = file;
      });
    }
    function run_id_selected(ev: any) {
      console.log('run_id_selected', ev);
      original_list.value = {};
      run_files.value = [];
      const { tissue_id: temp_tissue_id } = ev;
      tissue_id.value = temp_tissue_id;
      get_run_files();
    }
    function edit_run_id() {
      console.log('edit_run_id');
    }
    function close_edit_run_id() {
      console.log('close_edit_run_id');
    }
    function add_file() {
      run_files.value.push({ file_type_name: '', file_description: '', file_path: '', file_type_id: '', unique_id: get_uuid(), editing: true });
    }
    function added_file_type(file_type_name: string) {
      file_type_options.value.push(file_type_name);
      file_type_map.value[file_type_name] = null;
    }
    function reset_view() {
      original_list.value = {};
      run_files.value = [];
      const run_selector = ctx.refs.run_id_selector;
      run_selector.reset();
      tissue_id.value = '';
    }
    function edit_file(index: number) {
      run_files.value[index].editing = true;
      const key = 'aws_searcher_'.concat(run_files.value[index].unique_id);
      const aws_comp = ctx.refs[key][0] as any;
      const path = run_files.value[index].file_path;
      const split = path.split('S3://')[1];
      const split_inx = split.indexOf('/');
      const bucket = split.slice(0, split_inx);
      const key_path = split.slice(split_inx + 1);
      aws_comp.load_from_parent(bucket, key_path);
    }
    async function submit_file_changes() {
      const file_ids_to_remove: string[] = [];
      removed_uuids.value.forEach((uuid: string) => {
        file_ids_to_remove.push(original_list.value[uuid].file_id);
      });
      const file_changes: any[] = [];
      Object.keys(changes_dict.value).forEach((key: string) => {
        const { file_id } = changes_dict.value[key];
        file_changes.push({ file_id, ...changes_dict.value[key] });
      });
      const files_to_add: any[] = [];
      run_files.value.forEach((file: any) => {
        if (!(file.unique_id in original_list.value)) {
          files_to_add.push(file);
        }
      });
      const pl = {
        tissue_id: tissue_id.value,
        file_ids_to_remove,
        file_changes,
        files_to_add,
      };
      const res = await client.value!.submit_file_changes(pl);
      if (res === 'Success') {
        reset_view();
      }
    }
    onMounted(async () => {
      const file_types = await client.value!.get_file_type_options();
      console.log(file_types);
      file_types.forEach((file_type: any) => {
        file_type_dictionary.value[file_type.file_type_id] = file_type.file_type_name;
        file_type_options.value.push(file_type.file_type_name);
      });
    });
    return {
      run_files,
      file_type_options,
      removed_uuids,
      changes_dict,
      original_list,
      tissue_id,
      file_type_dictionary,
      submit_file_changes,
      run_id_selected,
      edit_run_id,
      close_edit_run_id,
      add_file,
      added_file_type,
      edit_file,
    };
  },
});
</script>
