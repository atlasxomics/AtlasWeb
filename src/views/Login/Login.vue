<template>
  <v-main>
    <v-container fill-height>
      <v-row
        justify="center"
        align="center"
      >
        <v-col
          xl="6"
          lg="8"
          md="10"
          sm="12"
        >
          <v-card
            class="pa-6"
            :disabled="loading"
          >
            <v-card-title class="pt-0 pl-0">
              ATX-CLOUD
            </v-card-title>
            <v-row>
              <v-col cols="6">
                <v-img src="company_logo.png" />
              </v-col>
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
                />
                <v-text-field
                  v-model="password"
                  label="Password"
                  type="password"
                  :error-messages="loginErrorMessage"
                  @input="loginErrorMessage = null"
                  @keypress.enter="loginUser"
                />
                <v-card-actions>
                  <div>
                    <a
                      href="https://atlasxomics.com"
                      target="_blank"
                      rel="noopener"
                      style="text-decoration: none;"
                    >
                      AtlasXomics
                      <v-icon small>
                        mdi-open-in-new
                      </v-icon>
                    </a>
                  </div>
                  <v-spacer />
                  <!-- <v-btn
                    color="secondary"
                    @click="LoginDialogActive = false"
                  >
                    Cancel
                  </v-btn> -->
                  <v-btn
                  color="primary"
                  @click="registrationClicked"
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
              v-model="name_user">
              </v-text-field>
              <v-text-field
              label="Username"
              v-model="username">
              </v-text-field>
              <v-text-field
              label="Email"
              v-model="email"
              >
              </v-text-field>
              <v-text-field
              label="Lab/PI Name"
              v-model="pi_name"
              >
              </v-text-field>
              <!-- <v-text-field
              label="PI Name"
              v-model="pi_name"
              >
              DOG
              </v-text-field> -->
              <v-text-field
              label="Password"
              v-model="password"
              >
              </v-text-field>
              <v-btn
              color="primary"
              :disabled="!username || !email || !password"
              @click="send_account_request"
              >
                Request Account
              </v-btn>
              <v-btn
              color="red"
              @click="loginScreenDisplayed = true"
              >
                Back
              </v-btn>
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
      <p
      class="text-center"
      >
      Account has been requested, and is currently under review.
      </p>
      <p
      class="text-center"
      >
      An email will be send to {{ email }} upon its approval.
      </p>
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
      v-model="bad_pwd_message"
      width="600"
      >
      <v-card
      width="600"
      class="mx-auto"
      >
      <p
      class="text-center"
      >
        Password must be at least 8 characters including:
      </p>
      <p
      class="text-center"
      >
        At least one lowercase letter.
      </p>
      <p
      class="text-center"
      >
        At least one uppercase letter.
      </p>
      <p
      class="text-center"
      >
        At least one number.
      </p>
      <p
      class="text-center"
      >
        At least one symbol.
      </p>
      <div
      class="text-center">
      <v-btn
      @click="bad_pwd_message = false"
      >
      Ok.
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
      console.log('dog');
    });
    // NOTE: May need to be computed ref
    const router = ctx.root.$router;
    // const client = new Client();
    // const client = computed(() => store.state.client);
    const loginScreenDisplayed = ref<boolean>(true);
    const username = ref<string>('');
    const password = ref<string>('');
    const name_user = ref<string>('');
    const pi_name = ref<string>('');
    const email = ref<string>('');
    const loading = ref<boolean>(false);
    const loginErrorMessage = ref<string | null>(null);
    const bad_pwd_message = ref<boolean>(false);
    // const email_regex = new RegExp('[a-z]{3}@')
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
      if (!val) {
        bad_pwd_message.value = true;
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
      // const resp = await temp_client.user_request_account(pl);
      // console.log(temp_client);
      // const { status } = resp;
      // if (status === 200) {
      //   show_user_creation_message.value = true;
      //   loginScreenDisplayed.value = true;
      // }
      // console.log(client);
      // const resp = client.value?.user_request_account(pl);
      // console.log(pl);
    }
    function registrationClicked() {
      show_user_creation_message.value = true;
      password.value = '';
      username.value = '';
      email.value = '';
      loginScreenDisplayed.value = false;
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
      registrationClicked,
      request_available,
      send_account_request,
      show_user_creation_message,
      bad_pwd_message,
    };
  },
});
</script>
