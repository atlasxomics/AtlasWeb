<template>
  <v-container v-if="resolveAuthGroup(['admin'])" fluid>
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
      <v-tab-item key="AddRemoveUser">
        <add-remove-user/>
      </v-tab-item>
      <v-tab-item key="AddRemoveGroup">
        <add-remove-group/>
      </v-tab-item>
      <v-tab-item key="WorkerStatus">
        <worker-status/>
      </v-tab-item>
      <v-tab-item key="UserManagement">
        <user-management/>
      <v-tab-item key="DatabaseAdmin">
        <database-admin/>
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
import { resolveAuthGroup } from '@/utils/auth';
import ResetPassword from './modules/ResetPassword.vue';
import WorkerStatus from './modules/WorkerStatus.vue';
import AddRemoveGroup from './modules/AddRemoveGroup.vue';
import AddRemoveUser from './modules/AddRemoveUser.vue';
import UserManagement from './modules/UserManagement.vue';
import DatabaseAdmin from './modules/DatabaseAdmin.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

const tabs = ['Reset Password', 'Add/Remove User', 'Add/Remove Group', 'Worker Status', 'User Management', 'Database Administration'];

export default defineComponent({
  name: 'AdminPanel',
  components: {
    ResetPassword,
    AddRemoveGroup,
    WorkerStatus,
    AddRemoveUser,
    UserManagement,
    DatabaseAdmin,
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
      resolveAuthGroup,
    };
  },
});

</script>

<style>

</style>
