<template>
  <v-main>
    <v-container fill-height>
      <v-row
        justify="center"
        align="center"
      >
        <v-col
          xl="5"
          lg="7"
          md="9"
          sm="11"
        >
          <v-card
            class="pa-6"
            :disabled="loading"
          >
            <v-row>
              <v-container
              >
                <v-img
                max-width="500"
                src="company_logo.png" />
              </v-container>
              <!-- Sign In Page -->
              <v-col
              v-if="loginScreenDisplayed"
              >
                <v-text-field
                  v-model="username"
                  label="Username"
                  :loading="loading"
                  :error="!!loginErrorMessage"
                  @input="loginErrorMessage = null"
                  @keypress.enter="loginUser"
                  prepend-icon="mdi-account-circle"
                />
                <v-text-field
                  v-model="password"
                  label="Password"
                  :error-messages="loginErrorMessage"
                  @input="loginErrorMessage = null"
                  @keypress.enter="loginUser"
                  :append-icon="show_pass ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append="show_pass = !show_pass"
                  prepend-icon="mdi-lock"
                  :type="show_pass?'text': 'password'"
                />
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                  @click="forgotPasswordScreenDisplayed=true;loginScreenDisplayed=false;"
                  >
                    Forgot Password
                  </v-btn>
                  <v-btn
                  color="primary"
                  @click="clearCreds(); loginScreenDisplayed = false; registrationScreenDisplayed = true"
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
              <!-- Sign Up / Registration Page -->
              <user-registration-page
              v-if="registrationScreenDisplayed"
              @back-selected="loginScreenDisplayed = true; registrationScreenDisplayed = false"
              @account-requested="send_account_request"
              >
              </user-registration-page>
              <v-col
              v-if="confirmationScreenDisplayed"
              >
              <h3>Code sent to: {{ email }}</h3>
              <v-text-field
              label='Confirmation Code'
              v-model="user_confirmation_code"
              >
              </v-text-field>
              <v-card-actions>
                <v-spacer/>
              <v-btn
              color="gray"
              @click="resend_registration_code"
              >
                Re-Send
              </v-btn>
              <v-btn
              color="primary"
              @click="check_registration_code"
              :disabled="user_confirmation_code.length === 0"
              >
                Confirm
              </v-btn>
              </v-card-actions>
              </v-col>
              <v-col
              v-if="forgotPasswordScreenDisplayed">
              Enter username for password reset:
              <v-text-field
              label="Username"
              v-model="username"
              >
              </v-text-field>
              <v-card-actions>
                <v-btn
                @click="forgot_password_request"
                >
                  Submit
                </v-btn>
                <v-btn
                @click="loginScreenDisplayed = true; forgotPasswordScreenDisplayed = false"
                >
                  Back
                </v-btn>
              </v-card-actions>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
      <v-dialog
      v-model="show_user_creation_message"
      width="600"
      >
      <v-card
      width="600"
      class="mx-auto"
      >
      <v-card-title
      class="text-h5 grey lighten-2 justify-center"
      >
      Account Successfully Confirmed
      </v-card-title>
      <v-card-text
      class="text-center"
      >
      An email will be sent to {{ email.value }} once you are given access to the site.
      </v-card-text>
      <div
      class="text-center">
      <v-btn
      @click="show_user_creation_message = false"
      >
      Ok
      </v-btn>
      </div>
      </v-card>
      </v-dialog>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watchEffect } from '@vue/composition-api';

import { login, isClient, Client } from '@/api';
import { loggedIn, saveCookie, readCookie, logout } from '@/utils/auth';
import store from '@/store';
import { SERVER_URL, TEST_SERVER_URL, PROD_SERVER_URL } from '@/environment';
import { UserRequestPayload } from '@/types';
import { snackbar } from '@/components/GlobalSnackbar';
import UserRegistrationPage from '@/views/Login/components/UserRegistrationPage.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    console.log(ready);
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'Login',
  components: { UserRegistrationPage },
  setup(props, ctx) {
    onMounted(async () => {
      console.log('');
    });
    // NOTE: May need to be computed ref
    const icon_var = ref<any>();
    const router = ctx.root.$router;
    const loginScreenDisplayed = ref<boolean>(true);
    const registrationScreenDisplayed = ref<boolean>(false);
    const confirmationScreenDisplayed = ref<boolean>(false);
    const forgotPasswordScreenDisplayed = ref<boolean>(false);
    const forgotPassConfirmationScreenDisplayed = ref<boolean>(false);
    const resetting_password = ref<boolean>(false);
    const user_confirmation_code = ref<string>('');
    const username = ref<string>('');
    const password = ref<string>('');
    const password_clicked = ref<boolean>(false);
    const name_user = ref<string>('');
    const pi_name = ref<string>('');
    const email = ref<string>('');
    const loading = ref<boolean>(false);
    const special_character_present = computed(() => /.*[!@#$%^&&*()<>?/[{}].*/.test(password.value));
    const atleast_8_chars = computed(() => password.value.length >= 8);
    const lowercase_char_present = computed(() => /.*[a-z].*/.test(password.value));
    const uppercase_char_present = computed(() => /.*[A-Z].*/.test(password.value));
    const number_present = computed(() => /.*[0-9].*/.test(password.value));
    const loginErrorMessage = ref<string | null>(null);
    // const bad_pwd_message = ref<boolean>(false);
    const show_pass = ref<boolean>(false);
    const showAdvanced = ref(false);
    const useTestServer = ref(SERVER_URL === TEST_SERVER_URL);
    const show_user_creation_message = ref<boolean>(false);
    // calls login function from index.ts which calls api to verify user.
    // If successful, returns a connected client
    async function loginUser() {
      if (username.value && password.value) {
        loading.value = true;
        const serverUrl = PROD_SERVER_URL;
        const resp = await login(serverUrl, username.value, password.value);
        if (isClient(resp)) {
          const existingCookie = readCookie();
          if (existingCookie) {
            logout();
          }
          saveCookie({ token: resp.authorizationToken, url: resp.serverURL });
          store.commit.setClient(resp);
        } else {
          loginErrorMessage.value = resp;
        }
        loading.value = false;
        username.value = '';
        password.value = '';
      }
    }
    async function send_account_request(pl: any) {
      console.log(pl);
      const temp_client = new Client(
        PROD_SERVER_URL,
        '',
      );
      try {
        // const resp = { data: 'Success', status: 'bar' };
        const resp = await temp_client.user_request_account(pl);
        const { data, status } = resp;
        if (data !== 'exists') {
          snackbar.dispatch({ text: 'Account Signup Successful.', options: { color: 'green' } });
          confirmationScreenDisplayed.value = true;
          registrationScreenDisplayed.value = false;
        } else {
          snackbar.dispatch({ text: 'Username already exists. Please choose another.', options: { color: 'red' } });
        }
      } catch (e) {
        console.log('error');
        snackbar.dispatch({ text: 'There was an error when requesting an account.', options: { color: 'red' } });
      }
    }
    async function forgot_password_request() {
      const temp_client = new Client(
        PROD_SERVER_URL,
        '',
      );
      try {
        const resp = await temp_client.forgotPasswordRequest(username.value);
        if (resp === 'Success') {
          forgotPasswordScreenDisplayed.value = false;
          confirmationScreenDisplayed.value = true;
          resetting_password.value = true;
        } else if (resp === 'user_na') {
          console.log('user does not exist');
          snackbar.dispatch({ text: 'Username does not exist.' });
        }
      } catch (e) {
        console.log('error');
      }
    }
    async function check_registration_code_signup() {
      try {
        const temp_client = new Client(
          PROD_SERVER_URL,
          '',
        );
        const resp = await temp_client.confirm_user_status_via_email(username.value, user_confirmation_code.value);
        if (resp === 'Success') {
          console.log('Successfully confirmed users email');
          loginScreenDisplayed.value = true;
          confirmationScreenDisplayed.value = false;
          show_user_creation_message.value = true;
        } else {
          snackbar.dispatch({ text: 'Wrong confirmation code entered. Try again.', options: { color: 'red' } });
          user_confirmation_code.value = '';
        }
      } catch (e) {
        console.log('error');
        snackbar.dispatch({ text: 'There was an error when attempting to confirm user.' });
      }
    }
    async function check_registration_code_forgot_password() {
      try {
        const temp_client = new Client(
          PROD_SERVER_URL,
          '',
        );
        const resp = await temp_client.forgot_password_code_confirmation(username.value, user_confirmation_code.value);
        if (resp === 'Success') {
          console.log('Success');
        } else if (resp === 'wrong_code') {
          snackbar.dispatch({ text: 'Wrong Code. Please try again.' });
        }
      } catch (e) {
        console.log('error');
      }
    }
    async function check_registration_code() {
      if (resetting_password.value) {
        check_registration_code_forgot_password();
      } else {
        check_registration_code_signup();
      }
    }
    async function resend_registration_code() {
      try {
        const temp_client = new Client(
          PROD_SERVER_URL,
          '',
        );
        const resp = temp_client.resend_registration_code(username.value);
      } catch (e) {
        console.log('error');
      }
    }
    function clearCreds() {
      password.value = '';
      username.value = '';
      email.value = '';
      pi_name.value = '';
      name_user.value = '';
      password_clicked.value = false;
    }
    function request_available() {
      if (username && password && email) {
        return false;
      }
      return true;
    }
    // Will re-route as soon as user is logged in
    watchEffect(() => {
      if (loggedIn.value && !loading.value) {
        store.commit.setComponent({ component: null });
        router.push('/');
      }
    });
    return {
      SERVER_URL,
      loginUser,
      loginErrorMessage,
      name_user,
      pi_name,
      username,
      password,
      email,
      showAdvanced,
      useTestServer,
      loading,
      resetting_password,
      show_user_creation_message,
      // bad_pwd_message,
      show_pass,
      special_character_present,
      atleast_8_chars,
      lowercase_char_present,
      uppercase_char_present,
      number_present,
      password_clicked,
      forgotPasswordScreenDisplayed,
      loginScreenDisplayed,
      registrationScreenDisplayed,
      confirmationScreenDisplayed,
      forgotPassConfirmationScreenDisplayed,
      user_confirmation_code,
      request_available,
      send_account_request,
      clearCreds,
      check_registration_code,
      resend_registration_code,
      forgot_password_request,
      check_registration_code_signup,
      check_registration_code_forgot_password,
    };
  },
});
</script>

<style scoped>
.password-text {
  /* padding-top: -10rem; */
  margin-left: 2rem;
}
</style>
