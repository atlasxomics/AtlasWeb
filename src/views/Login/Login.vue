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
                  <!-- <v-btn
                    color="secondary"
                    @click="LoginDialogActive = false"
                  >
                    Cancel
                  </v-btn> -->
                  <v-btn
                  color="primary"
                  @click="toggle_login_signup"
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
              <v-col
              v-if="!loginScreenDisplayed">
              <v-text-field
              label="Name"
              v-model="name_user"
              prepend-icon="mdi-account"
              >
              </v-text-field>
              <v-text-field
              label="Username"
              v-model="username"
              prepend-icon="mdi-account-circle"
              >
              </v-text-field>
              <v-text-field
              label="Email"
              v-model="email"
              prepend-icon="mdi-email"
              >
              </v-text-field>
              <v-text-field
              label="Group/PI Name"
              v-model="pi_name"
              prepend-icon="mdi-account-group"
              >
              </v-text-field>
              <v-text-field
              prepend-icon="mdi-lock"
              :append-icon="show_pass ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append="show_pass = !show_pass"
              label="Password"
              v-model="password"
              :type="show_pass?'text': 'password'"
              @mousedown="password_clicked = true"
              >
              </v-text-field>
              <v-card
              v-if="password.length > 0 & password_clicked"
              color="#E8E8E8"
              >
                <v-card-title>
                  {{ (atleast_8_chars && lowercase_char_present && uppercase_char_present && special_character_present) ? 'Strong Password' : 'Password Must Have' }}
                </v-card-title>
                <p
                class="password-text"
                >
                  • At least 8 characters.
                <v-icon
                  :inline="true"
                  v-if="!atleast_8_chars"
                  color="red"
                  >
                  {{'mdi-file-excel-box'}}
                  </v-icon>
                <v-icon
                  :inline="true"
                  v-if="atleast_8_chars"
                  color="green"
                  >
                  {{'mdi-check'}}
                  </v-icon>
                </p>
                <p
                class="password-text"
                >
                  • At least 1 lowercase character
                  <v-icon
                  :inline="true"
                  color="red"
                  v-if="!lowercase_char_present"
                  >
                  {{'mdi-file-excel-box'}}
                  </v-icon>
                  <v-icon
                  :inline="true"
                  color="green"
                  v-if="lowercase_char_present"
                  >
                  {{'mdi-check'}}
                  </v-icon>
                </p>
                <p
                class="password-text"
                >
                  • At least 1 uppercase character
                <v-icon
                  :inline="true"
                  color="green"
                  v-if="uppercase_char_present"
                >
                  {{'mdi-check'}}
                  </v-icon>
                <v-icon
                  :inline="true"
                  color="red"
                  v-if="!uppercase_char_present"
                >
                  {{'mdi-file-excel-box'}}
                  </v-icon>
                </p>
                <p
                class="password-text">
                • At least 1 number present
                <v-icon
                  :inline="true"
                  v-if="number_present"
                  color="green">
                  {{'mdi-check'}}
                </v-icon>
                <v-icon
                  :inline="true"
                  v-if="!number_present"
                  color="red">
                  {{'mdi-file-excel-box'}}
                </v-icon>
                </p>
                <p
                class="password-text"
                >
                  • At least 1 symbol
                  <v-icon
                  :inline="true"
                  v-if="!special_character_present"
                  color="red"
                  >
                  {{'mdi-file-excel-box'}}
                  </v-icon>
                  <v-icon
                  :inline="true"
                  v-if="special_character_present"
                  color="green"
                  >
                  {{'mdi-check'}}
                  </v-icon>
                </p>
              </v-card>
              <v-card-actions>
              <v-spacer />
              <v-btn
              class="request-button"
              color="primary"
              :disabled="!username || !email || !password || !name_user || !pi_name || !atleast_8_chars || !special_character_present || !lowercase_char_present || !uppercase_char_present || !number_present"
              @click="send_account_request"
              >
                Request Account
              </v-btn>
              <v-btn
              color="red"
              @click="toggle_login_signup"
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
      Account Request Successful!
      </v-card-title>
      <v-card-text
      class="text-center"
      >
      An email will be send to {{ email }} upon approval.
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
      <!-- <v-dialog
      v-model="bad_pwd_message"
      width="600"
      >
      <v-card
      width="600"
      class="mx-auto"
      >
      <v-card-title class="text-h5 grey lighten-2 justify-center">
        Invalid Password
      </v-card-title>
      <v-card-text
      class="text-center"
      >
      <h2>
        Password must:
      </h2>
      </v-card-text>
      <v-card-text
      class="text-center"
      >
       Be at least 8 characters long.
      </v-card-text>
      <v-card-text
      class="text-center"
      >
        Contain at least one lowercase letter.
      </v-card-text>
      <v-card-text
      class="text-center"
      >
        Contain at least one uppercase letter.
      </v-card-text>
      <v-card-text
      class="text-center"
      >
        Contain at least one number.
      </v-card-text>
      <v-card-text
      class="text-center"
      >
        Contain at least one symbol.
      </v-card-text>
      <div
      class="text-center">
      <v-btn
      @click="bad_pwd_message = false"
      >
      Ok.
      </v-btn>
      </div>
      </v-card>
      </v-dialog> -->
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
  setup(props, ctx) {
    onMounted(async () => {
      console.log('');
    });
    // NOTE: May need to be computed ref
    const icon_var = ref<any>();
    const router = ctx.root.$router;
    const loginScreenDisplayed = ref<boolean>(true);
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
    async function send_account_request() {
      // const rExp = new RegExp('^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[]:;<>,.?/~_+-=|]).{8,32}$');
      // eslint-disable-next-line
      const rExp = new RegExp('^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[:;<>]).{8,32}');
      const val = rExp.test(password.value);
      // if (!val) {
      //   bad_pwd_message.value = true;
      //   return;
      // }
      // eslint-disable-next-line
      const rExp_email = new RegExp(/^\S+@\S+\.\S+$/);
      const val_email_test = rExp_email.test(email.value);
      if (!val_email_test) {
        snackbar.dispatch({ text: 'Must enter a valid email.', options: { color: 'red' } });
        return;
      }
      const pl = {
        username: username.value,
        password: password.value,
        email: email.value,
        name: name_user.value,
        groups: ['collab'],
        pi_name: pi_name.value,
      };
      const temp_client = new Client(
        PROD_SERVER_URL,
        '',
      );
      try {
        const resp = await temp_client.user_request_account(pl);
        const { data, status } = resp;
        if (data !== 'exists') {
          show_user_creation_message.value = true;
          loginScreenDisplayed.value = true;
        } else {
          snackbar.dispatch({ text: 'Username already exists. Please choose another.', options: { color: 'red' } });
        }
      } catch (e) {
        console.log('error');
        snackbar.dispatch({ text: 'There was an error when requesting an account.', options: { color: 'red' } });
      }
      // console.log(client);
      // // const resp = client.value?.user_request_account(pl);
      // console.log(pl);
    }
    function toggle_login_signup() {
      password.value = '';
      username.value = '';
      email.value = '';
      pi_name.value = '';
      name_user.value = '';
      password_clicked.value = false;
      loginScreenDisplayed.value = !loginScreenDisplayed.value;
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
      loginScreenDisplayed,
      toggle_login_signup,
      request_available,
      send_account_request,
      show_user_creation_message,
      // bad_pwd_message,
      show_pass,
      special_character_present,
      atleast_8_chars,
      lowercase_char_present,
      uppercase_char_present,
      number_present,
      password_clicked,
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
