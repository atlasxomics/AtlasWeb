<template>
  <v-container fluid>
    <div style="padding:0;display: flex; background-color: #182c3c; height: 80px;">
      <div style="width: 50%;">
      <ul style="list-style: none; ">
        <li>
          <v-img width="80px" height="80px" src="favicon-nobg.png"></v-img>
        </li>
      </ul></div>
      <div style="width: 50%;">
      <ul style="list-style: none; display: flex; justify-content: right; ">
        <li>
          <v-btn x-large color="white" text @click="signFlag = !signFlag">Sign In</v-btn>
        </li>
      </ul></div>
    </div>
    <v-dialog
      v-if="signFlag"
      :value="signFlag"
      @click:outside="signFlag = false">
      <v-card style="width:500px; position: absolute; left: 50%; top: 20%; transform: translate(-50%, -50%);z-index: 999; height: 19vh;padding: 5px;">
        <v-row>
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
    </v-dialog>
    <landing-page v-if="client"/>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, onMounted, computed } from '@vue/composition-api';
import { login, isClient } from '@/api';
import { loggedIn, saveCookie, readCookie, logout } from '@/utils/auth';
import store from '@/store';
import { SERVER_URL, TEST_SERVER_URL, PROD_SERVER_URL } from '@/environment';
import LandingPage from './modules/LandingPage.vue';

export default defineComponent({
  name: 'Login',
  components: { LandingPage },
  setup(props, ctx) {
    // NOTE: May need to be computed ref
    const router = ctx.root.$router;

    const username = ref<string | null>(null);
    const password = ref<string | null>(null);
    const loading = ref<boolean>(false);
    const loginErrorMessage = ref<string | null>(null);

    const showAdvanced = ref(false);
    const useTestServer = ref(SERVER_URL === TEST_SERVER_URL);
    const signFlag = ref(false);
    const show = ref(false);
    const client = ref<any>();
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
        if (loggedIn.value && !loading.value) {
          store.commit.setComponent({ component: null });
          router.push('/');
        }
      }
    }
    async function openPublic() {
      const resp = await login(PROD_SERVER_URL, 'public', 'Public1!');
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
      client.value = computed(() => store.state.client);
    }
    onMounted(async () => {
      openPublic();
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
      signFlag,
      show,
      client,
      openPublic,
    };
  },
});
</script>
