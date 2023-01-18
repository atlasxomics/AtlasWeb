<template>
    <id-selector
        :new_available="new_available"
        label="Run ID"
        :id_list="run_id_list"
        @run-selected="run_selected"
        @edit-run-id="edit_run_id"
        @close-edit-run-id="close_edit_run_id"
        @custom-run-id="custom_run_id"
        @clear-fields="clear_fields"
        ref="id_selector"
    >
    </id-selector>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from '@vue/composition-api';
import { Client } from '@/api';
import store from '@/store';
import IdSelector from '@/views/Home/components/settings/admin/modules/IdSelector.vue';

export default defineComponent({
  name: 'RunIdSelector',
  components: { IdSelector },
  props: { new_available: { type: Boolean, required: true } },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const run_id_selected = ref<string>('');
    const run_id_list = ref<Array<Record<string, any>>>([]);
    const available_id_list = ref<Array<Record<string, any>>>([]);
    function search_runs(search_string: string) {
      const matches: Array<Record<string, any>> = [];
      const regex = new RegExp(`.*${search_string}.*`);
      run_id_list.value.forEach((element: any) => {
        if (regex.test(element.id)) {
          matches.push({ id: element.id });
        }
      });
      available_id_list.value = matches;
    }
    function run_selected(ev: any) {
      run_id_selected.value = ev;
      ctx.emit('run-selected', run_id_selected.value);
    }
    function edit_run_id() {
      ctx.emit('edit-run-id');
    }
    function close_edit_run_id() {
      ctx.emit('close-edit-run-id');
    }
    function custom_run_id(ev: any) {
      run_id_selected.value = ev;
      ctx.emit('custom-run-id', run_id_selected.value);
    }
    function clear_fields() {
      run_id_selected.value = '';
      ctx.emit('clear-fields');
    }
    function set_selector(ids: Array<any>) {
      const ref_mod = ctx.refs.id_selector as any;
      ref_mod.reset_local_ids(ids);
    }
    function set_run_ids() {
      const run_id_promise = client.value?.get_run_ids();
      run_id_promise!.then((res: any) => {
        run_id_list.value = res;
        available_id_list.value = res;
        set_selector(res);
      });
    }
    onMounted(() => {
      const run_id_promise = client.value?.get_run_ids();
      set_run_ids();
    });
    return {
      run_id_selected,
      run_id_list,
      available_id_list,
      run_selected,
      edit_run_id,
      close_edit_run_id,
      custom_run_id,
      clear_fields,
      search_runs,
    };
  },
});

</script>
