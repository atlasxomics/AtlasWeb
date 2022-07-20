<template>
    <v-col>
        <p v-for="run in availableRunsPassed" :key="run">
          <v-btn @click="$emit('run-selected', run)">
            {{ run }}
          </v-btn>
        </p>
    </v-col>
</template>
<script lang='ts'>
import { defineComponent, ref } from '@vue/composition-api';
import EventEmitter from 'events';

export default defineComponent({
  name: 'RunIdList',
  props: { availableRunsPassed: { required: true, type: Array } },
  setup(props, ctx) {
    const name = 'jonah';
    const availableRuns = ref<any[]>([]);
    // const passRun = function (run: string) {
    // };
    return {
      availableRuns,
      name,
      // passRun,
    };
  },
});
</script>
