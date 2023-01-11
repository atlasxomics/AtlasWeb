<template>
  <!-- <v-container v-if="resolveAuthGroup(['admin'])" fluid> -->
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
      <v-tab-item key="UserManagement" eager>
        <user-management
        ref="user_managment"
        />
      </v-tab-item>
      <v-tab-item key="GroupManagment">
        <group-managment
        @update-groups="update_groups_list">
        </group-managment>/>
      </v-tab-item>
      <v-tab-item key="CreateWebObject">
        <create-web-object/>
      </v-tab-item>
      <v-tab-item key="Uploader" eager>
        <web-uploader
        ref="run_editor"
        >
        </web-uploader>
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect, getCurrentInstance } from '@vue/composition-api';
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
import WebUploader from './modules/WebUploader.vue';
import CreateWebObject from './modules/CreateWebObject.vue';
import GroupManagment from './modules/GroupManagment.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

const tabs = ['Reset Password', 'Worker Status', 'User Management', 'Group Managment', 'Create A Run', 'Add A Run'];

export default defineComponent({
  name: 'AdminPanel',
  props: ['query'],
  components: {
    ResetPassword,
    AddRemoveGroup,
    WorkerStatus,
    AddRemoveUser,
    UserManagement,
    WebUploader,
    CreateWebObject,
    GroupManagment,
  },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const tab = ref<any>(1);
    const parent_results_id = ref<any>(null);
    const example_ref = ref(null);
    function update_groups_list() {
      console.log('getting updated list');
      (ctx as any).refs.user_managment.update_groups_list();
    }
    onMounted(async () => {
      await clientReady;
      if (props.query.params) {
        tab.value = 5;
        if (props.query.params.action === 'edit') {
          console.log(props.query.params);
          (ctx as any).refs.run_editor.auto_populate_from_run_id(props.query.params.run_id);
        }
      }
      store.commit.setSubmenu(null);
    });
    return {
      tabs,
      tab,
      client,
      parent_results_id,
      resolveAuthGroup,
      update_groups_list,
    };
  },
});

</script>

<style>

</style>
