<template>
  <v-container fluid>
    Atlas Analytics
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
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
  name: 'AtlasAnalytics',
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);

    const submenu = [
      {
        text: 'Test Func',
        icon: 'mdi-lock-outline',
        color: 'primary',
        tooltip: 'Test Func',
        click: () => {
          console.log('Test Function clicked');
        },
      },
    ];
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(submenu);
      console.log('Mounted');
    });
  },
});

</script>

<style>

</style>
