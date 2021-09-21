<template>
  <v-main>
    <appbar />
    <component v-bind:is="component"/>
    <v-footer absolute>AtlasXomics, 2021</v-footer>
  </v-main>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, watch, watchEffect, ref } from '@vue/composition-api';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { loginExisting, loggedIn } from '@/utils/auth';
import Appbar from '@/components/Appbar/Appbar.vue';
import WaferTrace from './components/WaferTrace.vue';
import QcViewer from './components/QcViewer.vue';
import ImageViewer from './components/ImageViewer.vue';
import ChipInformationViewer from './components/ChipInformationViewer.vue';
import WaferInformationViewer from './components/WaferInformationViewer.vue';
import DbitInformationViewer from './components/DbitInformationViewer.vue';

const appReadyForDataset = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));

  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'Home',
  components: { Appbar, ImageViewer, WaferTrace, QcViewer, ChipInformationViewer, WaferInformationViewer, DbitInformationViewer },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const user = computed(() => store.state.client?.user);
    const component = computed(() => store.state.mainComponent);
    function redirectToLogin() {
      router.push('/login');
    }
    function redirectToErrorPage() {
      router.push('/Error');
    }

    // Login Existing User
    onBeforeMount(async () => {
      await loginExisting();
      if (!loggedIn.value) {
        redirectToLogin();
      }
    });

    // Display message on user login/logout
    watch(() => user.value, (newUser, oldUser) => {
      if (newUser) {
        snackbar.dispatch({ text: `Welcome ${newUser.username}`, options: { right: true } });
      } else if (oldUser) {
        snackbar.dispatch({ text: `Goodbye ${oldUser.username}`, options: { right: true } });
        redirectToLogin();
      }
    });
    return {
      component,
      user,
    };
  },
});
</script>
