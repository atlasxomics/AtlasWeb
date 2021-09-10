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
    // const client = computed(() => store.state.client);
    // const dialogOpen = computed(() => store.state.application.dialogOpen);
    // const dark = computed({
    //   get: () => store.state.application.darkTheme,
    //   set: (val) => { store.commit.application.setDarkTheme(val); },
    // });

    // watch(dialogOpen, (val) => {
    //   // TODO: refactor with more general solution using directives
    //   if (val) {
    //     Mousetrap.pause();
    //   } else {
    //     Mousetrap.unpause();
    //   }
    // });

    // Needed to link the theme config in ctx.root and store
    // watchEffect(() => {
    //   // eslint-disable-next-line no-param-reassign
    //   ctx.root.$vuetify.theme.dark = dark.value;
    // });
  },
});
</script>
<style>
html {
  overflow-y: auto !important;
}
</style>
