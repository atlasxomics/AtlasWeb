<template>
    <v-container>
      <study-selector
      @study-selected="study_selected"
      >
      </study-selector>
    </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import StudySelector from '@/views/Home/components/settings/admin/modules/StudySelector.vue';

export default defineComponent({
  components: { StudySelector },
  setup(props, ctx) {
    const run_id_list = ref<Array<string>>([]);
    const study = ref<any>({});
    function study_selected(ev: any) {
      console.log(ev);
    }
    return {
      study,
      run_id_list,
      study_selected,
    };
  },
});
</script>
