<template>
          <v-col>
            <v-row>
            <v-text-field
            :label="label"
            :disabled="id_selected"
            v-model="search_input"
            @input="search_runs"
            @click="id_search_clicked = true;"
            v-click-outside="id_search_clicked = false"
        >
        </v-text-field>
        <v-icon
            v-if="unique_id && search_input && !id_selected && new_available"
            color="green"
            @click="user_entered_id"
        >
        mdi-plus
        </v-icon>
        <v-icon
            v-if="id_selected"
            @click="edit_id"
            color="red"
        >
            mdi-pencil
        </v-icon>
        <v-icon
            v-if="editing_id_selection"
            color="red"
            @click="close_edit_id"
        >
            mdi-arrow-right
        </v-icon>
        </v-row>
        <v-data-table
        v-if="!id_selected"
        dense
        single-select
        :items-per-page="4"
        :headers="headers"
        :items="available_ids"
        @click:row="run_selected"
        >
        </v-data-table>
      </v-col>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from '@vue/composition-api';
import { Client } from '@/api';
import store from '@/store';

export default defineComponent({
  name: 'IdSelector',
  props: {
    new_available: { type: Boolean, required: true },
    label: { type: String, required: true },
    id_list: { type: Array, required: true },
    key_display_value: { type: String, required: true },
  },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const headers = [{ text: props.label, value: props.key_display_value, sortable: false }];
    const id = ref<string>('');
    const id_selected = ref<boolean>(false);
    const local_id_list = ref<Array<Record<string, any>>>([]);
    const available_ids = ref<Array<Record<string, any>>>([]);
    const selected_id = ref<string>('');
    const editing_id_selection = ref<boolean>(false);
    const id_search_clicked = ref<boolean>(false);
    const search_input = ref<string>('');
    const unique_id = computed(() => {
      let res = true;
      available_ids.value.forEach((element: any) => {
        if (element.id === search_input.value) {
          res = false;
        }
      });
      return res;
    });
    function run_selected(ele: any) {
      selected_id.value = ele.id;
      search_input.value = ele.id;
      editing_id_selection.value = false;
      id.value = ele.id;
      ctx.emit('run-selected', ele);
      id_selected.value = true;
    }
    function search_runs() {
      const regexString = search_input.value;
      const matches: Array<Record<string, any>> = [];
      const regex = new RegExp(regexString, 'i');
      local_id_list.value.forEach((element: any) => {
        if (regex.test(element[props.key_display_value])) {
          matches.push(element);
        }
      });
      available_ids.value = matches;
    }
    function edit_id() {
      editing_id_selection.value = true;
      id_selected.value = false;
      search_runs();
      ctx.emit('edit-id');
    }
    function close_edit_id() {
      editing_id_selection.value = false;
      id_selected.value = true;
      search_input.value = id.value;
      ctx.emit('close-edit-id');
    }
    function set_id(user_set_id: string) {
      id.value = user_set_id;
      search_input.value = user_set_id;
      id_selected.value = true;
    }
    function user_entered_id() {
      const temp_ele = { id: search_input.value };
      editing_id_selection.value = false;
      local_id_list.value.push(temp_ele);
      available_ids.value.push(temp_ele);
      id.value = search_input.value;
      id_selected.value = true;
      ctx.emit('custom-id', id.value);
    }
    function run_successfully_uploaded() {
      available_ids.value = local_id_list.value;
      search_input.value = '';
      id_selected.value = false;
    }
    function reset_local_ids(prop_list: Array<Record<string, any>>) {
      local_id_list.value = prop_list;
      available_ids.value = prop_list;
    }
    watch(props.id_list, (new_val: Array<any>) => { reset_local_ids(new_val); });
    return {
      id,
      local_id_list,
      selected_id,
      available_ids,
      editing_id_selection,
      id_search_clicked,
      search_input,
      id_selected,
      headers,
      unique_id,
      run_selected,
      search_runs,
      edit_id,
      close_edit_id,
      user_entered_id,
      run_successfully_uploaded,
      set_id,
      reset_local_ids,
    };
  },
});

</script>
