<template>
  <v-card>
    <v-card-title>Register User</v-card-title>
    <v-card-text>
      <v-form v-model="formValid">
        <v-text-field
          v-model="username"
          label="Username"
          :rules="commonRules"
          :error-messages="usernameErrorMessage"
        />
        <v-text-field
          v-model="name"
          label="Full Name"
        />
        <v-text-field
          v-model="email"
          label="Email"
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
        @click="registerUser"
      >
        Register
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, onMounted } from '@vue/composition-api';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { RegisterUserPayload } from '@/types';
import { registerNewUserMenu } from '../state';

export default defineComponent({
  name: 'RegisterNewUserMenu',
  setup() {
    const client = computed(() => store.state.client);
    const formValid = ref(false);
    const commonRules = [
      (val: string | number | null) => (val !== '' && val !== null),
    ];

    const username = ref<string | null>(null);
    const email = ref<string | null>(null);
    const usernameErrorMessage = ref<string | null>(null);
    const name = ref<string | null>(null);
    const groups = ref<string[] | []>([]);
    // Reset error message once value is changed
    watch(username, () => { usernameErrorMessage.value = null; });

    const password = ref<string | null>(null);

    // Set user group default when level changed

    function closeMenu() { registerNewUserMenu.value = false; }
    async function registerUser() {
      if (
        !client.value
        || !username.value
        || !name.value
        || !password.value
        || !email.value
      ) { return; }

      const payload: RegisterUserPayload = {
        username: username.value,
        password: password.value,
        name: name.value,
        email: email.value,
        groups: groups.value,
      };

      const success = await client.value.registerUser(payload);
      if (!success) {
        usernameErrorMessage.value = 'User already exists';
        return;
      }

      closeMenu();
      snackbar.dispatch({ text: 'User Successfully Registered' });
    }

    return {
      formValid,
      commonRules,
      username,
      name,
      email,
      usernameErrorMessage,
      password,
      closeMenu,
      registerUser,
    };
  },
});
</script>

<style>
</style>
