<template>
  <v-snackbar
    v-model="show"
    v-bind="options"
    :timeout="timeout"
  >
    {{ text }}
    <v-spacer v-if="buttonExists" />
    <template
      v-if="buttonExists"
      v-slot:action="{ attrs }"
    >
      <v-btn
        v-bind="attrs"
        text
        :icon="!!buttonIcon"
        @click="buttonClicked"
      >
        <v-icon v-if="!!buttonIcon">
          {{ buttonIcon }}
        </v-icon>
        <span v-else>
          {{ button }}
        </span>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { show, text, button, buttonIcon, callback, timeout, options } from './state';

export default defineComponent({
  name: 'Snackbar',
  setup() {
    const buttonExists = computed(() => button.value || buttonIcon.value);
    function buttonClicked() {
      if (callback.value !== null) {
        callback.value();
      }

      show.value = false;
    }

    return {
      show,
      text,
      button,
      buttonIcon,
      buttonExists,
      callback,
      timeout,
      options,
      buttonClicked,
    };
  },
});
</script>
