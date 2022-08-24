<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-form
          v-model="validPassword">
          <v-text-field
            type="password"
            v-model="passwordChange.old_password"
            label="Old Password"
            />
          <v-text-field
            type="password"
            v-model="passwordChange.new_password"
            label="New Password"
            />
          <v-text-field
            type="password"
            v-model="passwordChange.confirm_password"
            label="Confirm Password"
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
  name: 'ChangePassword',
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const userInfo = ref<any | null>();
    const validPassword = ref(false);
    const overview = ref<any>({ editable: false });
    const passwordChange = ref<any>({ old_password: null, new_password: null, confirm_password: null });
    async function getUserInfo() {
      if (!client.value) return;
      userInfo.value = await client.value.user;
    }
    async function onChangePassword(ev: any) {
      if (!client.value) return;
      if (validPassword.value) {
        const payload = { old_password: passwordChange.value.old_password, new_password: passwordChange.value.new_password };
        const resp = await client.value.changePassword(payload);
        if (resp) {
          passwordChange.value = { old_password: null, new_password: null, confirm_password: null };
          snackbar.dispatch({ text: 'Password changed successfully', options: { color: 'success', right: true } });
        } else {
          snackbar.dispatch({ text: 'Password change failed', options: { color: 'error', right: true } });
          passwordChange.value = { old_password: null, new_password: null, confirm_password: null };
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
