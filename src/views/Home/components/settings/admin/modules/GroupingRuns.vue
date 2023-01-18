<template>
    <v-container>
      <study-selector>
      </study-selector>
    </v-container>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import StudySelector from '@/views/Home/components/settings/admin/modules/StudySelector.vue';

export default defineComponent({
  components: { StudySelector },
  setup(props, ctx) {
    const foo = 'bar';
    const buzz = 'bazz';
  },
});
</script>
