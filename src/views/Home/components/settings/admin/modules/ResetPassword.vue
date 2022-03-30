<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-form
          v-model="validPassword">
          <v-text-field
            v-model="passwordChange.username"
            label="Username"
            />
          <v-text-field
            type="password"
            v-model="passwordChange.password"
            label="New Password"
            />
          <v-btn
            color="primary"
            @click="onChangePassword"
          >Change Password</v-btn>
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
  name: 'ResetPassword',
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const userInfo = ref<any | null>();
    const validPassword = ref(false);
    const overview = ref<any>({ editable: false });
    const passwordChange = ref<any>({ username: null, password: null });
    async function getUserInfo() {
      if (!client.value) return;
      userInfo.value = await client.value.user;
    }
    async function onChangePassword(ev: any) {
      if (!client.value) return;
      if (validPassword.value) {
        const payload = { username: passwordChange.value.username, password: passwordChange.value.password };
        try {
          const resp = await client.value.resetUserPassword(payload);
          passwordChange.value = { username: null, password: null };
          snackbar.dispatch({ text: 'Password reset successfully', options: { color: 'success', right: true } });
        } catch (e) {
          snackbar.dispatch({ text: `Password reset failed ${e}`, options: { color: 'error', right: true } });
          passwordChange.value = { username: null, password: null };
        }
      } else {
        snackbar.dispatch({ text: 'Password is not valid', options: { color: 'error', right: true } });
      }
    }
    onMounted(async () => {
      await clientReady;
      await getUserInfo();
    });
    return {
      userInfo,
      overview,
      passwordChange,
      validPassword,
      onChangePassword,
    };
  },
});

</script>

<style>

</style>
