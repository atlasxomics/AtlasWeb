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
      <v-tab-item key="ChangePassword">
        <change-password/>
      </v-tab-item>
      <v-tab-item key="WorkerStatus">
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
import ChangePassword from './ChangePassword.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

const tabs = ['Change Password', 'Config'];

export default defineComponent({
  name: 'UserSettings',
  components: { ChangePassword },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const tab = ref<any>(0);
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
