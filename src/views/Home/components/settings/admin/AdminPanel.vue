<template>
  <v-container fluid>
    <v-tabs
      v-model="tab"
      >
      <v-tab v-for="item in tabs" :key="item">
        {{ item }}
      </v-tab>
    </v-tabs>
    <v-tabs-items v-model="tab">
      <v-tab-item key="ResetPassword">
        <reset-password/>
      </v-tab-item>
      <v-tab-item key="WorkerStatus">
        <worker-status/>
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { generateRouteByQuery } from '@/utils';
import ResetPassword from './ResetPassword.vue';
import WorkerStatus from './WorkerStatus.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

const tabs = ['Reset Password', 'Worker Status'];

export default defineComponent({
  name: 'AdminPanel',
  components: {
    ResetPassword,
    WorkerStatus,
  },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const tab = ref<any>(1);
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
    });
    return {
      tabs,
      tab,
      client,
    };
  },
});

</script>

<style>

</style>
