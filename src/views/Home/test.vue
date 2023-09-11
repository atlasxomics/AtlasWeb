<template>
  <v-app>
    <router-view />
    <global-snackbar />
    <prompt />
    <upload-progress-display />
  </v-app>
</template>

<script lang="ts">
import { defineComponent, computed, watchEffect, watch } from '@vue/composition-api';
import Mousetrap from 'mousetrap';
import store from '@/store';
import GlobalSnackbar from '@/components/GlobalSnackbar/Snackbar.vue';
import Prompt from '@/components/Prompt/Prompt.vue';
import UploadProgressDisplay from '@/components/UploadProgressDisplay.vue';

export default defineComponent({
  name: 'App',
  components: { GlobalSnackbar, Prompt, UploadProgressDisplay },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
  },
});
</script>
<style>
html {
  overflow-y: auto !important;
}
</style>
