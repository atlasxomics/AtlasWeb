<template>
    <v-col>
    Enter username for password reset:
    <v-text-field
    label="Username"
    v-model="username"
    >
    </v-text-field>
    <v-card-actions>
    <v-btn
    @click="forgot_password_request"
    color="primary"
    :disabled="username.length === 0"
    >
        Submit
    </v-btn>
    <v-btn
    @click="back_selected"
    >
        Back
    </v-btn>
    </v-card-actions>
    </v-col>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';

export default defineComponent({
  name: 'ForgotPasswordScreen',
  setup() {
    const username = ref<string>('');
    function back_selected() {
      this.$emit('back');
    }
    function forgot_password_request() {
      this.$emit('forgot-password', username.value);
    }
    return {
      username,
      back_selected,
      forgot_password_request,
    };
  },
});
</script>
