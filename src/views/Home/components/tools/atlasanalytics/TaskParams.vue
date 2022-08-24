<template>
  <v-container fluid>
    <template v-for="arg, i in meta.args">
      <template v-if="arg.type === 'number'">
        <v-text-field
          v-bind:key="arg.name"
          :label="arg.caption"
          v-model.number="params.args[i].value"
          @change="onChanged(params)"
        />
      </template>
      <template v-else>
        <v-text-field
          v-bind:key="arg.name"
          :label="arg.caption"
          v-model="params.args[i].value"
          @change="onChanged(params)"
        />
      </template>
    </template>
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
  name: 'TaskParams',
  props: ['query', 'meta'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const params = ref<any>(props.meta);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    const submenu: any[] = [];
    function onChanged(p: any) {
      ctx.emit('changed', params.value);
    }
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(submenu);
      ctx.emit('changed', props.meta);
    });
    return {
      params,
      onChanged,
    };
  },
});

</script>

<style>

</style>
