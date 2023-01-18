<template>
    <v-container>
      <study-selector
      @study-selected="study_selected"
      >
      </study-selector>
    </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { Client } from '@/api';
import store from '@/store';
import StudySelector from '@/views/Home/components/settings/admin/modules/StudySelector.vue';

export default defineComponent({
  components: { StudySelector },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const run_id_list = ref<Array<string>>([]);
    const study = ref<any>({});
    function get_study_runs(study_id: string) {
      const res = client.value?.get_study_runs(study_id);
    }
    function study_selected(ev: any) {
      study.value = ev;
    }
    return {
      study,
      run_id_list,
      study_selected,
    };
  },
});
</script>
