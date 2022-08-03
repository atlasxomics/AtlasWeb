<template>
    <v-col>
      <h1> Run Ids </h1>
        <p v-for="run in availableRunsPassed" :key="run">
          <v-btn
          class="{'white': !clicked, 'blue': clicked}"
          @click="$emit('run-selected', run)"
          >
            {{ run }}
          </v-btn>
        </p>
    </v-col>
</template>
<script lang='ts'>
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  name: 'RunIdList',
  props: { availableRunsPassed: { required: true, type: Array } },
  setup(props, ctx) {
    const name = 'jonah';
    const availableRuns = ref<any[]>([]);
    const clicked = ref<boolean>(false);
    // const passRun = function (run: string) {
    // };
    return {
      availableRuns,
      name,
      clicked,
      // passRun,
    };
  },
});
</script>

<style scoped>
.white {
  background-color: white;
}
.blue {
  background-color: blue;
}
</style>
