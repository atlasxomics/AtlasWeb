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
            <v-row>
              <v-container
              >
                <v-img
                max-width="1000"
                max-height="1000"
                :src="require('./atlasbg.png')"/>
              </v-container>
              <!-- Sign In Page -->
              <v-overlay
              opacity="0"
              :absolute="true"
              :dark="false"
              >
              <v-card
              width="700"
              class="pa-6"
              :disabled="loading"
              >
              <v-img
                max-width="500"
                src="company_logo.png" />
              <sign-in-page
              v-if="loginScreenDisplayed"
              :loading="loading"
              :loginErrorMessage_prop="loginErrorMessage"
              @login-selected="loginUser"
              @registration-selected="loginScreenDisplayed = false; registrationScreenDisplayed = true;"
              @forgot-password="loginScreenDisplayed = false; forgotPasswordScreenDisplayed = true;"
              >
              </sign-in-page>
              <!-- Sign Up / Registration Page -->
              <user-registration-page
              v-if="registrationScreenDisplayed"
              @back-selected="loginScreenDisplayed = true; registrationScreenDisplayed = false"
              @account-requested="send_account_request"
              >
              </user-registration-page>
              <user-confirmation-screen
              v-if="confirmationScreenDisplayed"
              @resend-code="resend_verification"
              @verification-code-submitted="check_registration_code_signup"
              :username="username_from_child"
              >
              </user-confirmation-screen>
              <!-- forgot password screen -->
              <forgot-password-screen
              v-if="forgotPasswordScreenDisplayed"
              @back="loginScreenDisplayed = true; forgotPasswordScreenDisplayed = false;"
              @forgot-password="forgot_password_request"
              >
              </forgot-password-screen>
              <!-- password reset screen -->
              <password-reset-screen
              v-if="resetPassScreenDisplayed"
              @resend-code="send_forgot_password_code(username_from_child)"
              @code-submitted="reset_password"
              :username="username_from_child"
              >
              </password-reset-screen>
              </v-card>
              </v-overlay>
            </v-row>
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
      {{ from_confirmation_to_password_reset? 'Email verified! Check email for a new code to be used to reset account password.' : 'An email will be sent to '.concat(email).concat( 'once you are authorized to access your data.') }}
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
      <v-dialog
      v-model="show_email_never_verified_message"
      width="600"
      >
      <v-card
      width="600"
      class="mx-auto"
      >
      <v-card-title
      class="text-h5 grey lighten-2 justify-center"
      >
      Error! Account has never verified email.
      </v-card-title>
      <v-card-text
      class="text-center"
      >
      As the account never verified it's associated email. Cannot use forget password functionality.
      </v-card-text>
      <v-card-text
      class="text-center">
      Please contact support at help@atlasxomics.com for assistance or create another free account.
      </v-card-text>
      <div
      class="text-center">
      <v-btn
      @click="show_email_never_verified_message = false"
      >
      Ok
      </v-btn>
      </div>
      </v-card>
      </v-dialog>
      <v-dialog
      v-model="show_account_requires_verification_message"
      width="600"
      >
      <v-card
      width="600"
      class="mx-auto"
      >
      <v-card-title
      class="text-h5 grey lighten-2 justify-center"
      >
      Account has never verified email.
      </v-card-title>
      <v-card-text
      class="text-center"
      >
      Prior to resetting password first verify email used in registration.
      </v-card-text>
      <v-card-text
      class="text-center">
      Email sent to address associated with {{ username_from_child }}.
      </v-card-text>
      <div
      class="text-center">
      <v-btn
      @click="show_account_requires_verification_message = false"
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
import SignInPage from '@/views/Login/components/SignInPage.vue';
import ForgotPasswordScreen from '@/views/Login/components/ForgotPasswordScreen.vue';
import PasswordResetScreen from '@/views/Login/components/PasswordResetScreen.vue';
import UserConfirmationScreen from '@/views/Login/components/UserConfirmationScreen.vue';

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
  components: {
    UserRegistrationPage,
    SignInPage,
    ForgotPasswordScreen,
    PasswordResetScreen,
    UserConfirmationScreen,
  },
  setup(props, ctx) {
    // NOTE: May need to be computed ref
    const icon_var = ref<any>();
    const router = ctx.root.$router;
    const loginScreenDisplayed = ref<boolean>(true);
    const registrationScreenDisplayed = ref<boolean>(false);
    const confirmationScreenDisplayed = ref<boolean>(false);
    const forgotPasswordScreenDisplayed = ref<boolean>(false);
    const show_user_creation_message = ref<boolean>(false);
    const show_email_never_verified_message = ref<boolean>(false);
    const show_pass = ref<boolean>(false);
    const showAdvanced = ref(false);
    const show_account_requires_verification_message = ref<boolean>(false);
    const from_confirmation_to_password_reset = ref<boolean>(false);
    const resetPassScreenDisplayed = ref<boolean>(false);
    const password_clicked = ref<boolean>(false);
    const loading = ref<boolean>(false);
    const username_from_child = ref<string>('');
    const name_user = ref<string>('');
    const pi_name = ref<string>('');
    const email = ref<string>('');
    const loginErrorMessage = ref<string>('');
    const useTestServer = ref(SERVER_URL === TEST_SERVER_URL);
    // calls login function from index.ts which calls api to verify user.
    // If successful, returns a connected client
    async function loginUser(pl: any) {
      const { username, password } = pl;
      loading.value = true;
      const serverUrl = PROD_SERVER_URL;
      const resp = await login(serverUrl, username, password);
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
    }
    // calls api to create account and sends verification email
    async function send_account_request(pl: any) {
      const temp_client = new Client(
        PROD_SERVER_URL,
        '',
      );
      try {
        // const resp = { data: 'Success', status: 'bar' };
        const resp = await temp_client.user_request_account(pl);
        const { data, status } = resp;
        if (data !== 'exists') {
          confirmationScreenDisplayed.value = true;
          registrationScreenDisplayed.value = false;
          const { username } = pl;
          username_from_child.value = username;
        } else {
          snackbar.dispatch({ text: 'Username already exists. Please choose another.', options: { color: 'red' } });
        }
      } catch (e) {
        console.log('error');
        snackbar.dispatch({ text: 'There was an error when requesting an account.', options: { color: 'red' } });
      }
    }
    // calls api to resend the verification code to the user when verifying their email
    async function resend_verification() {
      try {
        const temp_client = new Client(
          PROD_SERVER_URL,
          '',
        );
        const resp = temp_client.resend_registration_code(username_from_child.value);
      } catch (e) {
        console.log('error');
      }
    }
    // calls api and sends a code to user's email when they forget password
    async function send_forgot_password_code(username: string) {
      console.log('sending forgot pw request');
      try {
        const temp_client = new Client(
          PROD_SERVER_URL,
          '',
        );
        const resp = await temp_client.forgotPasswordRequest(username);
        console.log(resp);
        return resp;
      } catch (e) {
        snackbar.dispatch({ text: 'Error when sending password reset code.', options: { color: 'red' } });
        return 'Error';
      }
    }
    // calls api and checks if user exists. If so then a code is sent to their email
    async function forgot_password_request(username: string) {
      try {
        const resp = await send_forgot_password_code(username);
        console.log(resp);
        username_from_child.value = username;
        if (resp.state === 'Success' && resp.CodeDeliveryDetails.DeliveryMedium.toLowerCase() === 'email') {
          forgotPasswordScreenDisplayed.value = false;
          resetPassScreenDisplayed.value = true;
          username_from_child.value = username;
        } else if (resp.state === 'Success' && resp.CodeDeliveryDetails.DeliveryMedium.toLowerCase() === 'sms') {
          snackbar.dispatch({ text: 'Error! Contact support for further help.' });
        } else if (resp.state.toLowerCase() === 'user_na') {
          snackbar.dispatch({ text: 'Username does not exist.' });
        } else if (resp.state.toLowerCase() === 'email_unconfirmed') {
          show_email_never_verified_message.value = true;
          loginScreenDisplayed.value = true;
          forgotPasswordScreenDisplayed.value = false;
        } else if (resp.state.toLowerCase() === 'needs_confirmation') {
          show_account_requires_verification_message.value = true;
          forgotPasswordScreenDisplayed.value = false;
          confirmationScreenDisplayed.value = true;
          username_from_child.value = username;
          from_confirmation_to_password_reset.value = true;
          resend_verification();
        } else if (resp.state === 'Failure' && resp.msg.includes('Attempt limit exceeded')) {
          snackbar.dispatch({ text: 'Must wait before resetting password again.' });
        }
      } catch (e) {
        console.log('error');
      }
    }
    // calls api to check whether code entered by user matches one sent to email.
    // used when validating user
    async function check_registration_code_signup(code: string) {
      try {
        const temp_client = new Client(
          PROD_SERVER_URL,
          '',
        );
        // const resp = 'Success';
        const resp = await temp_client.confirm_user_status_via_email(username_from_child.value, code);
        if (resp === 'Success') {
          confirmationScreenDisplayed.value = false;
          show_user_creation_message.value = true;
          if (from_confirmation_to_password_reset.value) {
            forgot_password_request(username_from_child.value);
            resetPassScreenDisplayed.value = true;
          } else {
            loginScreenDisplayed.value = true;
          }
        } else {
          snackbar.dispatch({ text: 'Wrong confirmation code entered. Try again.', options: { color: 'red' } });
          // user_confirmation_code.value = '';
        }
      } catch (e) {
        console.log('error');
        snackbar.dispatch({ text: 'There was an error when attempting to confirm user.' });
      }
    }
    // calls api to verify verification code entered by user. If valid, password is changed
    async function reset_password(pl: any) {
      try {
        const { code, password, username } = pl;
        const temp_client = new Client(
          PROD_SERVER_URL,
          '',
        );
        // const resp = 'Success';
        const resp = await temp_client.resetPassword(username, password, code);
        if (resp === 'Success') {
          snackbar.dispatch({ text: 'Password has been reset.', options: { color: 'green' } });
          loginScreenDisplayed.value = true;
          resetPassScreenDisplayed.value = false;
        } else if (resp === 'wrong_code') {
          snackbar.dispatch({ text: 'Wrong Code. Please try again.' });
        }
      } catch (e) {
        console.log('error');
      }
    }

    // function clearCreds() {
    //   password.value = '';
    //   username.value = '';
    //   email.value = '';
    //   pi_name.value = '';
    //   name_user.value = '';
    //   password_clicked.value = false;
    // }
    // function request_available() {
    //   if (username && password && email) {
    //     return false;
    //   }
    //   return true;
    // }
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
      username_from_child,
      email,
      showAdvanced,
      useTestServer,
      loading,
      show_user_creation_message,
      show_account_requires_verification_message,
      show_pass,
      password_clicked,
      forgotPasswordScreenDisplayed,
      loginScreenDisplayed,
      registrationScreenDisplayed,
      confirmationScreenDisplayed,
      resetPassScreenDisplayed,
      from_confirmation_to_password_reset,
      show_email_never_verified_message,
      send_forgot_password_code,
      send_account_request,
      resend_verification,
      forgot_password_request,
      check_registration_code_signup,
      reset_password,
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
