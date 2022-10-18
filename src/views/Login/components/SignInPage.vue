<template>
    <v-col>
        <v-text-field
            v-model="username"
            label="Username"
            :loading="loading"
            :error="!!loginErrorMessage"
            @keypress.enter="loginUser"
            prepend-icon="mdi-account-circle"
        />
        <v-text-field
            v-model="password"
            label="Password"
            :error-messages="loginErrorMessage"
            @keypress.enter="loginUser"
            :append-icon="show_pass ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="show_pass = !show_pass"
            prepend-icon="mdi-lock"
            :type="show_pass?'text': 'password'"
        />
        <v-card-actions>
            <v-spacer />
            <v-btn
            @click="forgot_password"
            >
            Forgot Password
            </v-btn>
            <v-btn
            @click="register_user"
            color="primary"
            >
            Register
            </v-btn>
            <v-btn
            color="success"
            :disabled="!(username && password)"
            @click="loginUser"
            >
            Sign In
            </v-btn>
        </v-card-actions>
    </v-col>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';

export default defineComponent({
  name: 'SignInPage',
  props: { loading: { type: Boolean, required: true }, loginErrorMessage_prop: { type: String, required: true } },
  setup(props, ctx) {
    const username = ref<string>('');
    const password = ref<string>('');
    const show_pass = ref<boolean>(false);
    const loginErrorMessage = computed(() => props.loginErrorMessage_prop);
    function loginUser() {
      const pl = { username: username.value, password: password.value };
      console.log('login selected');
      this.$emit('login-selected', pl);
    }
    function register_user() {
      console.log('registration selected');
      this.$emit('registration-selected');
    }
    function forgot_password() {
      console.log('forgot password selected');
      this.$emit('forgot-password');
    }
    return {
      username,
      password,
      show_pass,
      loginErrorMessage,
      loginUser,
      register_user,
      forgot_password,
    };
  },
});
</script>
