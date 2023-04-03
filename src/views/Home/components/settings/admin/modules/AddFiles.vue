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
                <v-row v-for="(file, index) in run_files" :key="file.unique_id">
                    <selector
                    :display_options="file_type_options"
                    display_label="File Type"
                    :variable="file.file_type_name"
                    :disabled="!file.editing"
                    item_text="text"
                    item_value="value"
                    @changed="file_type_selected(index, $event)"
                    @option-added="added_file_type(index, $event)"
                    >
                    </selector>
                    <v-col
                    cols="5"
                    style="padding: 0px; margin-left: 25px"
                    >
                    <v-text-field
                    v-show="!file.editing"
                    label="Bucket Name"
                    v-model="file.bucket_name"
                    readonly
                    >
                    </v-text-field>
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
                    @editing-path="file.file_path = null"
                    @bucket-selected="file.bucket_name = $event; file.file_path = null;"
                    :ref="'aws_searcher_'.concat(file.unique_id)"
                    >
                    </aws-searcher>
                    </v-col>
                    <v-text-field
                    style="margin-left: 30px"
                    label="File Description"
                    v-model="file.file_description"
                    :disabled="!file.editing"
                    >
                    </v-text-field>
                    <v-icon
                    v-if="!file.editing"
                    @click="edit_file(index)"
                    large
                    style="margin-left: 15px"
                    >
                      mdi-pencil
                    </v-icon>
                    <v-icon
                    color="green"
                    v-if="file.editing"
                    :disabled="!file.file_path || !file.file_description || !file.file_type_name"
                    @click="save_state(index)"
                    large
                    >
                      mdi-check
                    </v-icon>
                    <v-icon
                    large
                    style="margin-left: 15px"
                    @click="remove_file(index)"
                    >
                        mdi-delete
                    </v-icon>
                </v-row>
            </v-col>
        </v-row>
        <v-row class="d-flex justify-center">
            <v-icon
            :disabled="currently_editing || !tissue_id"
            large
            color="green"
            @click="add_file"
            >
            mdi-plus
            </v-icon>
        </v-row>
        <v-row class="d-flex justify-center">
            <v-btn
            :disabled="currently_editing || !action_made || !tissue_id"
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
import { snackbar } from '@/components/GlobalSnackbar';
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
    const original_list = ref<Record<string, any>>({});
    const file_type_id_to_name = ref<Record<string, any>>({});
    const file_type_name_to_id = ref<Record<string, any>>({});
    const action_made = ref<boolean>(false);
    const currently_editing = computed(() => {
      let editing = false;
      run_files.value.forEach((element: any) => {
        if (element.editing) editing = true;
      });
      return editing;
    });
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
        const file_type_name_mapped = file_type_id_to_name.value[file.file_type_id];
        run_files.value.push({
          file_type_name: file_type_name_mapped,
          file_description: file.file_description,
          file_path: file.file_path,
          bucket_name: file.bucket_name,
          file_type_id: file.file_type_id,
          unique_id: unique,
          editing: false,
        });
        original_list.value[unique] = file;
      });
    }
    async function set_file_types() {
      const file_types = await client.value!.get_file_type_options();
      file_types.forEach((file_type: any) => {
        file_type_id_to_name.value[file_type.file_type_id] = file_type.file_type_name;
        file_type_name_to_id.value[file_type.file_type_name] = file_type.file_type_id;
        file_type_options.value.push(file_type.file_type_name);
      });
    }
    function run_id_selected(ev: any) {
      console.log('run_id_selected', ev);
      action_made.value = false;
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
      run_files.value.push({ file_type_name: '', file_description: '', file_path: '', file_type_id: '', unique_id: get_uuid(), editing: true, bucket_name: '' });
    }
    function file_type_selected(index: number, file_type_name: string) {
      run_files.value[index].file_type_name = file_type_name;
      run_files.value[index].file_type_id = file_type_name_to_id.value[file_type_name];
    }
    function added_file_type(index: number, file_type_name: string) {
      file_type_options.value.push(file_type_name);
      file_type_name_to_id.value[file_type_name] = null;
      file_type_selected(index, file_type_name);
    }
    function save_state(index: number) {
      run_files.value[index].editing = false;
      action_made.value = true;
    }
    function remove_file(index: number) {
      run_files.value.splice(index, 1);
      action_made.value = true;
    }
    function reset_view() {
      original_list.value = {};
      run_files.value = [];
      const run_selector = ctx.refs.run_id_selector;
      run_selector.reset_visual();
      set_file_types();
      tissue_id.value = '';
    }
    function edit_file(index: number) {
      action_made.value = true;
      run_files.value[index].editing = true;
      const key = 'aws_searcher_'.concat(run_files.value[index].unique_id);
      const aws_comp = ctx.refs[key][0] as any;
      const { bucket_name, file_path } = run_files.value[index];
      console.log(bucket_name, file_path);
      aws_comp.load_from_parent(bucket_name, file_path);
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
        snackbar.dispatch({ text: 'Success', options: { color: 'green', right: true } });
        reset_view();
      }
    }
    onMounted(async () => {
      set_file_types();
    });
    return {
      run_files,
      file_type_options,
      removed_uuids,
      changes_dict,
      original_list,
      tissue_id,
      file_type_id_to_name,
      currently_editing,
      action_made,
      added_file_type,
      file_type_selected,
      save_state,
      remove_file,
      set_file_types,
      submit_file_changes,
      run_id_selected,
      edit_run_id,
      close_edit_run_id,
      add_file,
      edit_file,
    };
  },
});
</script>
