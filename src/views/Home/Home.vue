<template>
  <v-main>
    <appbar class="appbar" v-on:openDrawer="openDrawer"/>
    <v-sheet
      style="position: relative">
      <main-menu ref="mainmenu"  v-on:menuClicked="menuClicked"/>
      <template v-if="component.component">
        <component v-bind:is="component.component" :query="component"/>
      </template>
      <template v-if="!component.component">
        <home-page/>
      </template>
<!--       <v-footer absolute>AtlasXomics, 2021</v-footer> -->
    </v-sheet>
  </v-main>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, watch, onMounted, watchEffect, ref } from '@vue/composition-api';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { loginExisting, loggedIn } from '@/utils/auth';
import { generateRouteByQuery } from '@/utils';
import Appbar from '@/components/Appbar/Appbar.vue';
import MainMenu from './components/menu/MainMenu.vue';
import HomePage from './components/welcome/HomePage.vue';
import WaferTrace from './components/view/WaferTrace.vue';
import ImageViewer from './components/view/ImageViewer.vue';
import ChipInformationViewer from './components/edit/ChipInformationViewer.vue';
import WaferInformationViewer from './components/edit/WaferInformationViewer.vue';
import DbitInformationViewer from './components/edit/DbitInformationViewer.vue';
import AtlasBrowser from './components/tools/atlasbrowser/AtlasBrowser.vue';
import AtlasG from './components/tools/atlasgx/AtlasG.vue';
import AtlasAnalytics from './components/tools/atlasanalytics/AtlasAnalytics.vue';
import AtlasViewer from './components/tools/atlasview/AtlasViewer.vue';
import AtlasUploader from './components/tools/filetools/AtlasUploader.vue';
import AdminPanel from './components/settings/admin/AdminPanel.vue';
import UserSettings from './components/settings/users/UserSettings.vue';

const appReadyForClient = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));

  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'Home',
  components: {
    Appbar,
    MainMenu,
    HomePage,
    ImageViewer,
    WaferTrace,
    AtlasViewer,
    ChipInformationViewer,
    WaferInformationViewer,
    DbitInformationViewer,
    AtlasBrowser,
    AtlasG,
    AtlasAnalytics,
    AtlasUploader,
    AdminPanel,
    UserSettings,
  },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const user = computed(() => store.state.client?.user);
    const component = computed(() => store.state.currentComponent);
    const subMenu = computed(() => store.state.subMenu);
    function redirectToLogin() {
      router.push('/login');
    }
    function redirectToErrorPage() {
      router.push('/Error');
    }
    function openDrawer() {
      (ctx as any).refs.mainmenu.openDrawer();
    }
    function menuClicked(ev: any) {
      if (!ev) {
        if (currentRoute.value.query.component) {
          const newRoute: any = generateRouteByQuery(currentRoute.value, null);
          router.push(newRoute);
        }
      } else if (ev.component !== currentRoute.value.query.component) {
        const newRoute: any = generateRouteByQuery(currentRoute.value, ev);
        router.push(newRoute);
      }
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
    watch(currentRoute, (route) => {
      if (route.query.component) store.commit.setComponent(route.query);
      else store.commit.setComponent({ component: null });
    });
    onMounted(() => {
      const route = currentRoute.value;
      if (route.query.component) store.commit.setComponent(route.query);
      else store.commit.setComponent({ component: null });
    });
    return {
      component,
      user,
      openDrawer,
      menuClicked,
      subMenu,
    };
  },
});
</script>
