<template>
  <v-container fluid>
    <component v-bind:is="component.component" :query="component"/>
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUnmounted } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { SERVER_URL, TEST_SERVER_URL, PROD_SERVER_URL } from '@/environment';
import { snackbar } from '@/components/GlobalSnackbar';
import { generateRouteByQuery } from '@/utils';
import { Client } from '@/api';
import { saveCookie, loginExisting } from '@/utils/auth';
import PublicGeneViewer from './viewers/PublicGeneViewer.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'PublicMain',
  props: ['query'],
  components: { PublicGeneViewer },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const component = computed(() => store.state.currentComponent);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    onMounted(async () => {
      // await clientReady;
      store.commit.setSubmenu(null);
      const route = currentRoute.value;
      console.log(route);
      if (route.query.component) store.commit.setComponent(route.query);
      else store.commit.setComponent({ component: null });
      store.commit.setClient(await Client.CreatePublic(PROD_SERVER_URL, component.value.token));
    });
    onUnmounted(async () => {
      // await clientReady;
      // store.commit.setClient(await Client.Create(PROD_SERVER_URL, ''));
    });
    return { component };
  },
});

</script>

<style>

</style>
