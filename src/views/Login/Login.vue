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
              <v-col>
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
                  <v-btn
                    color="secondary"
                    @click="LoginDialogActive = false"
                  >
                    Cancel
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
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from '@vue/composition-api';

import { login, isClient } from '@/api';
import { loggedIn, saveCookie, readCookie, logout } from '@/utils/auth';
import store from '@/store';
import { SERVER_URL, TEST_SERVER_URL, PROD_SERVER_URL } from '@/environment';

export default defineComponent({
  name: 'Login',
  setup(props, ctx) {
    // NOTE: May need to be computed ref
    const router = ctx.root.$router;

    const username = ref<string | null>(null);
    const password = ref<string | null>(null);
    const loading = ref<boolean>(false);
    const loginErrorMessage = ref<string | null>(null);

    const showAdvanced = ref(false);
    const useTestServer = ref(SERVER_URL === TEST_SERVER_URL);

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
        username.value = null;
        password.value = null;
      }
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
      username,
      password,
      showAdvanced,
      useTestServer,
      loading,
    };
  },
});
</script>
