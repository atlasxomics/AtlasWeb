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
                    <aws-searcher
                    :only_files="true"
                    @path-selected="file.file_path = $event"
                    >
                    </aws-searcher>
                    </v-col>
                    <v-text-field
                    style="position: relative; left: 3%;"
                    label="File Description"
                    v-model="file.file_description"
                    >
                    </v-text-field>
                    <!-- <v-icon
                    style="position: relative; left: 8%; bottom: 10px;"
                    @click="edit_file(index)"
                    >
                      mdi-pencil
                    </v-icon> -->
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
    const file_type_options = ref<Array<any>>(['file type 1', 'file type 2']);
    const file_type_map = ref<Record<string, any>>({}); // file_type_name,  file_type_id
    const original_list: Record<string, any> = {};
    const changes_dict = computed(() => {
      const full_changes: Record<string, any> = {};
      run_files.value.forEach((file: any) => {
        const uid = file.unique_id;
        if (uid in original_list) {
          Object.keys(file).forEach((key: string) => {
            if (file[key] !== original_list[uid][key]) {
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
    const length_original = computed(() => {
      let number_original = 0;
      run_files.value.forEach((file: any) => {
        if (file.unique_id in original_list) {
          number_original += 1;
        }
      });
      return number_original;
    });
    // const added_inx = computed(() => {
    //   const added: number[] = [];
    //   run_files.value.forEach((file: any, index: number) => {
    //     if (!(file.unique_id in original_list)) {
    //       added.push(index);
    //     }
    //   });
    //   return added;
    // });
    const removed_uuids = computed(() => {
      const removed: string[] = [];
      Object.keys(original_list).forEach((key: string) => {
        if (!run_files.value.includes(key)) {
          removed.push(key);
        }
      });
      return removed;
    });
    async function get_run_files() {
      const files = await client.value!.get_downloadable_files_for_run(tissue_id.value);
      files.forEach((file: any) => {
        const unique = get_uuid();
        run_files.value.push({
          file_type_name: file.file_type_name,
          file_description: file.file_description,
          file_path: file.file_path,
          file_type_id: file.file_type_id,
          unique_id: unique,
        });
        original_list[unique] = file;
      });
    }
    function run_id_selected(ev: any) {
      const { temp_tissue_id } = ev;
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
      run_files.value.push({ file_type_name: '', file_description: '', file_path: '', file_type_id: '', unique_id: get_uuid() });
    }
    function added_file_type(file_type_name: string) {
      file_type_options.value.push(file_type_name);
      file_type_map.value[file_type_name] = null;
    }
    function edit_file(index: number) {
      console.log('edit_file', index);
    }
    function submit_file_changes() {
      console.log('submit_file_changes');
      console.log('removed_uuids', removed_uuids.value);
      console.log('run_files', run_files.value);
    }
    onMounted(async () => {
      const file_types = await client.value!.get_file_type_options();
      file_types.forEach((file_type: any) => {
        file_type_options.value.push(file_type.file_type_name);
      });
    });
    return {
      run_files,
      file_type_options,
      length_original,
      removed_uuids,
      changes_dict,
      original_list,
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
