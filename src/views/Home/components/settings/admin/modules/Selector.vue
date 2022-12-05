<template>
    <div>
        <v-select
        :disabled="disabled"
        :items="display_options"
        :label="display_label"
        @input="value_changed"
        v-model="local_variable"
        >
        <template
        v-slot:append-outer
        >
          <v-icon
          :color="add_option ? 'red' : 'green'"
          @click="add_option = !add_option"
          >
            {{ add_option ? 'mdi-close' : 'mdi-table-plus' }}
          </v-icon>
        </template>
        </v-select>
        <v-row
        v-if="add_option"
        >
        <v-text-field
        label="Add Option"
        v-model="custom_option"
        >
        <template
        v-slot:append
        >
        <v-icon
        :disabled="custom_option.length == 0"
        color="green"
        @click="new_option"
        >
        mdi-check
        </v-icon>
        </template>
        </v-text-field>
        </v-row>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch, onMounted } from '@vue/composition-api';

export default defineComponent({
  name: 'custom-selector',
  props: {
    display_options: { type: Array, required: true },
    display_label: { type: String, required: true },
    variable: { required: true },
    disabled: { type: Boolean },
  },
  watch: {
    variable(new_val) {
      this.local_variable = new_val;
    },
  },
  setup(props, ctx) {
    const local_variable = ref<string>('');
    const custom_option = ref<string>('');
    const add_option = ref<boolean>(false);
    function value_changed() {
      ctx.emit('changed', local_variable.value);
    }
    function new_option() {
      ctx.emit('option-added', custom_option.value);
      local_variable.value = custom_option.value;
      custom_option.value = '';
      add_option.value = false;
      value_changed();
    }
    onMounted(() => {
      if (props.variable) {
        local_variable.value = String(props.variable);
      }
    });
    return {
      local_variable,
      // local_options,
      // local_label,
      custom_option,
      add_option,
      value_changed,
      new_option,
    };
  },
});
</script>
