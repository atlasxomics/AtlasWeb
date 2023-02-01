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
                <v-row v-for="(file, index) in run_files" :key="index" style="position: relative; right: 15%;">
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
                    style="position: relative; left: 12%; bottom: 10px;"
                    @click="run_files.splice(index, 1)"
                    >
                        mdi-delete
                    </v-icon>
                </v-row>
            </v-col>
        </v-row>
        <v-row class="d-flex justify-center">
            <v-btn
            color="primary"
            @click="add_file"
            style="margin-bottom: 15px;"
            >
               Add File
            </v-btn>
        </v-row>
    </v-container>
</template>

<script lang='ts'>

import { ref, defineComponent, computed, onMounted } from '@vue/composition-api';
import { Client } from '@/api';
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
    const run_files = ref<Array<any>>([]);
    const file_type_options = ref<Array<any>>(['file type 1', 'file type 2']);
    const file_type_map = ref<Record<string, any>>({}); // file_type_name,  file_type_id
    async function get_run_files(tissue_id: string) {
      run_files.value = await client.value!.get_downloadable_files_for_run(tissue_id);
    }
    function run_id_selected(ev: any) {
      const { tissue_id } = ev;
      get_run_files(tissue_id);
    }
    function edit_run_id() {
      console.log('edit_run_id');
    }
    function close_edit_run_id() {
      console.log('close_edit_run_id');
    }
    function add_file() {
      run_files.value.push({ file_type_name: '', file_description: '', file_path: '', file_type_id: '' });
    }
    function added_file_type(file_type_name: string) {
      file_type_options.value.push(file_type_name);
      file_type_map.value[file_type_name] = null;
    }
    function edit_file(index: number) {
      console.log('edit_file', index);
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
