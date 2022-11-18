<template>
    <div>
        <v-select
        :items="display_options"
        :label="display_label"
        @input="value_changed"
        v-model="local_variable"
        >
        </v-select>
        <v-row
        v-if="variable === 'Add Option'">
        <v-text-field
        :label="local_label"
        v-model="custom_option"
        append-icon="mdi-check"
        @click:append="new_option"
        >
        </v-text-field>
        </v-row>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from '@vue/composition-api';

export default defineComponent({
  name: 'custom-selector',
  props: {
    display_options: { type: Array, required: true },
    display_label: { type: String, required: true },
    variable: { type: String, required: true },
  },
  setup(props, ctx) {
    const local_variable = ref<string>('');
    const custom_option = ref<string>('');
    const selected_option = ref<string>('');
    function new_option() {
      // local_options.value.splice(local_options.value.length - 2, 0, custom_option.value);
      selected_option.value = custom_option.value;
      custom_option.value = '';
      this.$emit('custom-field', custom_option.value);
    }
    function value_changed() {
      console.log(local_variable);
      ctx.emit('changed', local_variable.value);
    }
    return {
      local_variable,
      // local_options,
      // local_label,
      selected_option,
      custom_option,
      value_changed,
      new_option,
    };
  },
});
</script>
