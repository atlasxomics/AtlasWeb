<template>
  <v-container fluid>
    <file-upload-drag-drop/>
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import FileUploadDragDrop from './FileUploadDragDrop.vue';
import { generateRouteByQuery } from '@/utils';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'AtlasUploader',
  components: { FileUploadDragDrop },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
      console.log('Mounted');
    });
  },
});

</script>

<style>

</style>
