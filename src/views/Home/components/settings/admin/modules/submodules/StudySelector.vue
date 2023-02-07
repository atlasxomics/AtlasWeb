<template>
    <v-row>
    <id-selector
    :new_available="true"
    :label="'Study Name'"
    :id_list="study_id_list"
    :loading="loading"
    key_display_value="study_name"
    @run-selected="study_selected"
    @edit-id="edit_study_id"
    @close-edit-id="close_edit_study_id"
    @custom-id="user_entered_study_id"
    ref="id_selector"
    >
    </id-selector>
    </v-row>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from '@vue/composition-api';
import { Client } from '@/api';
import store from '@/store';
import IdSelector from './IdSelector.vue';

export default defineComponent({
  name: 'StudySelector',
  components: { IdSelector },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const study_id_selected = ref<any>('');
    const study_id_list = ref<Array<Record<string, any>>>([]);
    const loading = ref<boolean>(false);
    function study_selected(ev: any) {
      study_id_selected.value = ev;
      ctx.emit('study-selected', study_id_selected.value);
    }
    function edit_study_id() {
      console.log('edit_study_id');
      ctx.emit('edit-study-id');
    }
    function close_edit_study_id() {
      console.log('close_edit_study_id');
      ctx.emit('close-edit-study-id');
    }
    function user_entered_study_id(ev: any) {
      study_id_selected.value = ev;
      ctx.emit('new-study-id', study_id_selected.value);
    }
    function set_ids_selector(ids: Array<any>) {
      const ref_mod = ctx.refs.id_selector as any;
      ref_mod.reset_local_ids(ids);
      ref_mod.reset_search_input();
      loading.value = false;
    }
    function get_studies() {
      loading.value = true;
      const study_id_promise = client.value?.get_study_ids();
      study_id_promise!.then((res: any) => {
        study_id_list.value = res;
        set_ids_selector(res);
      });
    }
    function reset_fields() {
      study_id_selected.value = '';
      get_studies();
      const ref_mod = ctx.refs.id_selector as any;
      ref_mod.run_successfully_uploaded();
    }
    onMounted(() => {
      get_studies();
    });
    return {
      study_id_selected,
      study_id_list,
      study_selected,
      edit_study_id,
      close_edit_study_id,
      user_entered_study_id,
      loading,
      reset_fields,
    };
  },
});

</script>
