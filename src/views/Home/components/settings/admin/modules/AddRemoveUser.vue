<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-form
          v-model="validForm">
          <v-text-field
            v-model="userInfo.username"
            label="Username"
            />
          <v-text-field
          v-model="userInfo.password"
            label="Password"
            />
          <v-text-field
            v-model="userInfo.name"
            label="Name"
            />
          <v-text-field
            v-model="userInfo.email"
            label="Email"
            />
          <v-text-field
            v-model="group"
            append-outer-icon='mdi-check'
            @click:append-outer="updateGroups"
            label="Group"
            />
          <v-btn
            color="primary"
            :disabled='groupComplete'
            @click="onUserCreated"
          >Add User</v-btn>
          <v-btn
            color="error"
            :disabled='groupComplete'
            @click="removeUser"
          >Remove User</v-btn>
        </v-form>
      </v-col>
    </v-row>
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
  name: 'AddRemoveUser',
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const validForm = ref(false);
    const overview = ref<any>({ editable: false });
    const userInfo = ref<any>({ username: null, password: null, email: null, groups: [], name: null });
    const group = ref<string>('');
    const groupComplete = ref(false);

    async function updateGroups(ev: any) {
      if (group.value.length > 0) {
        userInfo.value.groups.push(group.value);
        group.value = '';
      }
    }
    async function onUserCreated(ev: any) {
      if (!client.value) return;
      const payload = { name: userInfo.value.name, password: userInfo.value.password, username: userInfo.value.username, email: userInfo.value.email, groups: userInfo.value.groups };
      try {
        const resp = await client.value.registerUser(payload);
        const resps = await client.value.confirmUser(userInfo.value.username);
        userInfo.value = { username: null, password: null, email: null, groups: [], name: null };
        snackbar.dispatch({ text: 'User creation successful', options: { color: 'success', right: true } });
      } catch (e) {
        snackbar.dispatch({ text: `User creation failed ${e}`, options: { color: 'error', right: true } });
        userInfo.value = { username: null, password: null, email: null, groups: [], name: null };
      }
    }
    async function removeUser(ev: any) {
      if (!client.value) return;
      try {
        const resp = await client.value.deleteUser(userInfo.value.username);
        userInfo.value = { username: null, password: null, email: null, groups: [], name: null };
        snackbar.dispatch({ text: 'User deletion successful', options: { color: 'success', right: true } });
      } catch (e) {
        snackbar.dispatch({ text: `User deletion failed ${e}`, options: { color: 'error', right: true } });
        userInfo.value = { username: null, password: null, email: null, groups: [], name: null };
      }
    }
    watch(group, (v: any) => {
      if (v.length === 0) {
        groupComplete.value = false;
      } else if (!userInfo.value.groups.includes(v)) {
        groupComplete.value = true;
      }
    });
    onMounted(async () => {
      await clientReady;
    });
    return {
      userInfo,
      overview,
      validForm,
      updateGroups,
      removeUser,
      group,
      groupComplete,
      onUserCreated,
    };
  },
});

</script>

<style>

</style>
