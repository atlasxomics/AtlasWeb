<template>
  <v-card>
    <v-card-title>Reset User Password</v-card-title>
    <v-card-text>
      <v-form v-model="formValid">
        <v-text-field
          v-model="username"
          label="Username"
          :rules="commonRules"
        />
        <v-text-field
          v-model="password"
          label="Password"
          type="password"
          :rules="commonRules"
        />
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        color="secondary"
        @click="closeMenu"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        :disabled="!formValid"
        @click="resetUserPassword"
      >
        Reset
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { resetUserPasswordMenu } from '../state';

export default defineComponent({
  name: 'ResetUserPasswordMenu',
  setup() {
    const client = computed(() => store.state.client);

    const formValid = ref(false);
    const commonRules = [
      (val: string | number | null) => (!!val),
    ];

    const username = ref<string | null>(null);
    const password = ref<string | null>(null);

    function closeMenu() {
      resetUserPasswordMenu.value = false;
    }

    async function resetUserPassword() {
      if (
        !client.value
        || !username.value
        || !password.value
      ) { return; }

      const payload = {
        username: username.value,
        password: password.value,
      };

      await client.value.resetUserPassword(payload);
      closeMenu();
      snackbar.dispatch({ text: 'Password Successfully Reset' });
    }

    return {
      formValid,
      commonRules,
      username,
      password,
      closeMenu,
      resetUserPassword,
    };
  },
});
</script>

<style>
</style>
