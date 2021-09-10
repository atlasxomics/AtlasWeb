<template>
  <v-dialog
    :key="key"
    v-model="model"
    v-bind="dialogProps"
  >
    <slot />
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from '@vue/composition-api';

const randomString = () => Math.random().toString(36).substring(7);

/**
 * Wraps a v-dialog to ensure that each open results in a
 * fresh instance of the slotted component.
 */
export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, ctx) {
    const model = computed({
      get: () => props.value,
      set: (val) => ctx.emit('input', val),
    });

    const key = ref(randomString());
    watch(model, (val) => {
      if (val) {
        key.value = randomString();
      }
    });

    const dialogProps = computed(() => ctx.attrs);

    return {
      key,
      model,
      dialogProps,
    };
  },
});
</script>

<style>

</style>
