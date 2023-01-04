<template>
          <v-col>
            <v-row>
            <v-text-field
            :disabled="run_id_selected"
            label="Select Run ID"
            v-model="search_input"
            @input="search_runs"
            @click="run_id_search_clicked = true;"
            v-click-outside="run_id_search_clicked = false"
        >
        </v-text-field>
        <v-icon
            v-if="unique_run_id && search_input && !run_id_selected && new_available"
            color="green"
            @click="user_entered_run_id"
        >
        mdi-plus
        </v-icon>
        <v-icon
            v-if="run_id_selected"
            @click="edit_run_id"
            color="red"
        >
            mdi-pencil
        </v-icon>
        <v-icon
            v-if="editing_run_id_selection"
            color="red"
            @click="close_edit_run_id"
        >
            mdi-arrow-right
        </v-icon>
        </v-row>
        <v-data-table
        v-if="!run_id_selected"
        dense
        single-select
        :items-per-page="4"
        :headers="headers"
        :items="available_run_ids"
        @click:row="run_selected"
        >
        </v-data-table>
      </v-col>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from '@vue/composition-api';
import { Client } from '@/api';
import store from '@/store';

export default defineComponent({
  name: 'runIdSelector',
  props: { new_available: { type: Boolean, required: true } },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const headers = [{ text: 'Run ID', value: 'run_id', sortable: false }];
    const run_id = ref<string>('');
    const run_id_selected = ref<boolean>(false);
    const run_ids = ref<Array<Record<string, any>>>([]);
    const available_run_ids = ref<Array<Record<string, any>>>([]);
    const selected_run_id = ref<string>('');
    const editing_run_id_selection = ref<boolean>(false);
    const run_id_search_clicked = ref<boolean>(false);
    const search_input = ref<string>('');
    const unique_run_id = computed(() => {
      let res = true;
      available_run_ids.value.forEach((element: any) => {
        if (element.run_id === search_input.value) {
          res = false;
        }
      });
      return res;
    });
    function run_selected(ele: any) {
      selected_run_id.value = ele.run_id;
      search_input.value = ele.run_id;
      editing_run_id_selection.value = false;
      run_id.value = ele.run_id;
      ctx.emit('run-selected', run_id.value);
      run_id_selected.value = true;
    }
    function search_runs() {
      const regexString = search_input.value;
      const matches: Array<Record<string, any>> = [];
      const regex = new RegExp(`.*${regexString}.*`);
      run_ids.value.forEach((element: any) => {
        if (regex.test(element.run_id)) {
          matches.push({ run_id: element.run_id });
        }
      });
      available_run_ids.value = matches;
    }
    function edit_run_id() {
      editing_run_id_selection.value = true;
      run_id_selected.value = false;
      search_runs();
      ctx.emit('edit-run-id');
    }
    function clear_fields() {
      ctx.emit('clear-fields');
    }
    function close_edit_run_id() {
      editing_run_id_selection.value = false;
      run_id_selected.value = true;
      search_input.value = run_id.value;
      ctx.emit('close-edit-run-id');
    }
    function set_run_id(user_set_run_id: string) {
      run_id.value = user_set_run_id;
      search_input.value = user_set_run_id;
      run_id_selected.value = true;
    }
    function user_entered_run_id() {
      clear_fields();
      const temp_ele = { run_id: search_input.value };
      editing_run_id_selection.value = false;
      run_ids.value.push(temp_ele);
      available_run_ids.value.push(temp_ele);
      run_id.value = search_input.value;
      run_id_selected.value = true;
      ctx.emit('custom-run-id', run_id.value);
    }
    function run_successfully_uploaded() {
      available_run_ids.value = run_ids.value;
      search_input.value = '';
      run_id_selected.value = false;
    }
    onMounted(() => {
      const run_id_promise = client.value?.get_run_ids();
      run_id_promise!.then((elements: any[]) => {
        run_ids.value = elements;
        available_run_ids.value = elements;
      });
    });
    return {
      run_id,
      run_ids,
      selected_run_id,
      available_run_ids,
      editing_run_id_selection,
      run_id_search_clicked,
      search_input,
      run_id_selected,
      headers,
      unique_run_id,
      run_selected,
      search_runs,
      edit_run_id,
      clear_fields,
      close_edit_run_id,
      user_entered_run_id,
      run_successfully_uploaded,
      set_run_id,
    };
  },
});

</script>
