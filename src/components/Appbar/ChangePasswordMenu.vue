<template>
  <v-card>
    <v-card-title>Change Password</v-card-title>
    <v-card-text>
      <v-form v-model="formValid">
        <v-text-field
          v-model="oldPassword"
          label="Old Password"
          :rules="commonRules"
          :error-messages="oldPasswordError"
          type="password"
        />
        <v-text-field
          v-model="newPassword"
          label="New Password"
          :rules="commonRules"
          type="password"
        />
        <v-text-field
          v-model="confirmNewPassword"
          label="Confirm New Password"
          :rules="commonRules"
          :error-messages="confirmNewPasswordError"
          type="password"
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
        @click="changePassword"
      >
        Set
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from '@vue/composition-api';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';

export default defineComponent({
  name: 'ChangePasswordMenu',
  setup(props, ctx) {
    const client = computed(() => store.state.client);

    const formValid = ref(false);
    const commonRules = [
      (val: string | number | null) => (!!val || 'Field cannot be empty'),
    ];

    const oldPassword = ref<string | null>(null);
    const oldPasswordError = ref<string | null>(null);

    // Reset error message once value is changed
    watch(oldPassword, () => { oldPasswordError.value = null; });

    const newPassword = ref<string | null>(null);
    const confirmNewPassword = ref<string | null>(null);
    const confirmNewPasswordError = computed(() => {
      if (
        newPassword.value !== null
        && confirmNewPassword.value !== null
        && newPassword.value !== confirmNewPassword.value
      ) {
        return "Passwords don't match";
      }

      return null;
    });

    function closeMenu() {
      ctx.emit('close');
    }

    async function changePassword() {
      if (
        !client.value
        || !oldPassword.value
        || !newPassword.value
      ) { return; }

      const payload = {
        old_password: oldPassword.value,
        new_password: newPassword.value,
      };

      const resp = await client.value.changePassword(payload);
      if (resp === false) {
        oldPasswordError.value = 'Incorrect password';
        return;
      }

      closeMenu();
      snackbar.dispatch({ text: 'Password Successfully Changed' });
    }

    return {
      formValid,
      commonRules,
      oldPassword,
      oldPasswordError,
      newPassword,
      confirmNewPassword,
      confirmNewPasswordError,
      closeMenu,
      changePassword,
    };
  },
});
</script>

<style>
</style>
