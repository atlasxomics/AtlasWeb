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
            <v-btn
            color="success"
            :disabled="!(username && password)"
            @click="loginUser"
            style="position: relative; width: 100px; left: 500px; bottom:15px;"
            >
            Sign In
            </v-btn>
            <div
            @click="forgot_password"
            style="position: relative; left: 160px; top: 60px;"
            >
            <a href="#!">
            Forgot Password?
            </a>
            </div>
            <div
            @click="register_user"
            style="position: relative; left: 310px; top: 35px;"
            >
            No Account?
            <a href="#!">
              Register
            </a>
            </div>

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
      this.$emit('login-selected', pl);
    }
    function register_user() {
      this.$emit('registration-selected');
    }
    function forgot_password() {
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

<style scoped>

.sign_in_right {
  margin-left: 190px;
}

</style>
