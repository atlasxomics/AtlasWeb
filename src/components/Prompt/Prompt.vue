<template>
  <v-dialog
    v-model="show"
    max-width="400"
    @keydown.esc="clickNegative"
    @input="v => v || clickNegative()"
  >
    <v-card>
      <v-toolbar-title
        v-if="!!title"
        class="title pa-4"
      >
        {{ title }}
      </v-toolbar-title>

      <v-card-text
        v-show="!!message"
        class="pl-4"
      >
        {{ message }}
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="!!negativeText"
          text
          @click="clickNegative"
        >
          {{ negativeText }}
        </v-btn>
        <v-btn
          v-if="!!positiveText"
          color="primary"
          text
          @click="clickPositive"
        >
          {{ positiveText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { show, title, message, callback, positiveText, negativeText } from './state';

export default defineComponent({
  name: 'Prompt',
  setup() {
    function clickPositive() {
      if (callback.value) {
        // resolve callback to return true
        callback.value(true);
      }
      show.value = false;
    }

    function clickNegative() {
      if (callback.value) {
        // resolve callback to return false
        callback.value(false);
      }
      show.value = false;
    }

    return {
      show,
      title,
      message,
      positiveText,
      negativeText,
      clickPositive,
      clickNegative,
    };
  },
});
</script>
