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
                <v-row v-for="file in run_files" :key="file.name">
                    {{ file.name }}
                    <selector
                    :display_options="file_type_options"
                    display_label="File Type"
                    :variable="file.file_type_id"
                    item_text="text"
                    item_value="value"
                    @changed="file.file_type_id = $event"
                    >
                    </selector>
                </v-row>
            </v-col>
        </v-row>
        <v-row class="d-flex justify-center">
            <v-btn
            color="primary"
            @click="add_file"
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

export default defineComponent({
  name: 'AddFiles',
  components: { RunIdSelector, Selector },
  setup(props: any, ctx: any) {
    const client = computed(() => store.state.client);
    const run_files = ref<Array<any>>([]);
    const file_type_options = ref<Array<any>>([{ text: 'file type 1', value: 17 }, { text: 'file type 2', value: 18 }]);
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
      run_files.value.push({
        name: 'new file'.concat(run_files.value.length.toString()),
        file_type_id: 17,
      });
    }
    onMounted(async () => {
      const file_types = await client.value!.get_file_type_options();
      file_types.forEach((file_type: any) => {
        file_type_options.value.push({
          text: file_type.file_type_name,
          value: file_type.file_type_id,
        });
      });
    });
    return {
      run_id_selected,
      edit_run_id,
      close_edit_run_id,
      run_files,
      file_type_options,
      add_file,
    };
  },
});
</script>
