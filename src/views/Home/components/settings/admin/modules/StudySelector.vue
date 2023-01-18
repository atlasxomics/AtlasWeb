<template>
    <id-selector
    :new_available="true"
    :label="'Study Name'"
    :id_list="study_id_list"
    @run-selected="study_selected"
    @edit-run-id="edit_study_id"
    @close-edit-run-id="close_edit_study_id"
    @custom-run-id="user_entered_study_id"
    >
    </id-selector>

</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from '@vue/composition-api';
import { Client } from '@/api';
import store from '@/store';
import IdSelector from '@/views/Home/components/settings/admin/modules/IdSelector.vue';

export default defineComponent({
  name: 'StudySelector',
  components: { IdSelector },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const study_id_selected = ref<string>('');
    const study_id_list = ref<Array<Record<string, any>>>([]);
    function study_selected(ev: any) {
      study_id_selected.value = ev.id;
      ctx.emit('study-selected', study_id_selected.value);
    }
    function edit_study_id() {
      ctx.emit('edit-study-id');
    }
    function close_edit_study_id() {
      ctx.emit('close-edit-study-id');
    }
    function user_entered_study_id(ev: any) {
      study_id_selected.value = ev;
      ctx.emit('user-entered-study-id', study_id_selected.value);
    }
    onMounted(() => {
      const study_id_promise = client.value?.get_study_ids();
      study_id_promise!.then((res: any) => {
        study_id_list.value = res;
      });
    });
    return {
      study_id_selected,
      study_id_list,
      study_selected,
      edit_study_id,
      close_edit_study_id,
      user_entered_study_id,
    }
  }
})

</script>