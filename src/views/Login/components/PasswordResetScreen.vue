<template>
    <v-col>
    <h3>Check email for code.</h3>
    <v-text-field
    label='Confirmation Code'
    v-model="user_confirmation_code"
    >
    </v-text-field>
    <v-text-field
    label="New Password"
    v-model="new_password"
    >
    </v-text-field>
    <v-card-actions>
    <v-spacer/>
    <v-btn
    color="gray"
    @click="resend_code"
    >
    Re-Send
    </v-btn>
    <v-btn
    color="primary"
    @click="code_submitted"
    :disabled="(user_confirmation_code.length === 0 || !pass_valid)"
    >
    Confirm
    </v-btn>
    </v-card-actions>
    <password-checker
    :password="new_password"
    @pass-changed="pass_changed"
    >
    </password-checker>
    </v-col>
</template>

<script lang="ts">
import { user } from '@/filemenu/admin/state';
import { defineComponent, ref } from '@vue/composition-api';
import PasswordChecker from './PasswordChecker.vue';

export default defineComponent({
  name: 'PasswordResetScreen',
  components: { PasswordChecker },
  props: { username: { type: String, required: true } },
  setup(props, ctx) {
    const user_confirmation_code = ref<string>('');
    const new_password = ref<string>('');
    const pass_valid = ref<boolean>(false);
    function pass_changed(new_val: boolean) {
      pass_valid.value = new_val;
    }
    function resend_code() {
      console.log('resending code');
      this.$emit('resend-code');
    }
    function code_submitted() {
      console.log('submitted code');
      const pl = { code: user_confirmation_code.value, password: new_password.value, username: props.username };
      this.$emit('code-submitted', pl);
    }
    return {
      user_confirmation_code,
      new_password,
      pass_valid,
      resend_code,
      code_submitted,
      pass_changed,
    };
  },
});
</script>
