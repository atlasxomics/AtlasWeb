<template>
    <id-selector
        :new_available="new_available"
        label="Run ID"
        :id_list="run_id_list"
        :loading="loading"
        key_display_value="run_id"
        @run-selected="run_selected"
        @edit-run-id="edit_run_id"
        @close-edit-run-id="close_edit_run_id"
        @custom-id="custom_run_id"
        ref="id_selector"
    >
    </id-selector>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from '@vue/composition-api';
import { Client } from '@/api';
import store from '@/store';
import IdSelector from './IdSelector.vue';

export default defineComponent({
  name: 'RunIdSelector',
  components: { IdSelector },
  props: { new_available: { type: Boolean, required: true } },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const run_id_selected = ref<string>('');
    const run_id_list = ref<Array<Record<string, any>>>([]);
    const loading = ref<boolean>(false);
    function run_selected(ev: any) {
      run_id_selected.value = ev.run_id;
      ctx.emit('run-selected', ev);
    }
    function parent_selected_run(ev: string) {
      run_id_selected.value = ev;
      const ref_mod = ctx.refs.id_selector as any;
      ref_mod.set_id(ev);
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
    function set_selector(ids: Array<any>) {
      const ref_mod = ctx.refs.id_selector as any;
      ref_mod.reset_local_ids(ids);
      loading.value = false;
    }
    function set_run_ids() {
      loading.value = true;
      const run_id_promise = client.value?.get_run_ids();
      run_id_promise!.then((res: any) => {
        run_id_list.value = res;
        set_selector(res);
      });
    }
    function reset() {
      run_id_selected.value = '';
      const ref_mod = ctx.refs.id_selector as any;
      ref_mod.run_successfully_uploaded();
    }
    onMounted(() => {
      set_run_ids();
    });
    return {
      run_id_selected,
      run_id_list,
      loading,
      parent_selected_run,
      run_selected,
      edit_run_id,
      close_edit_run_id,
      custom_run_id,
      reset,
    };
  },
});

</script>
