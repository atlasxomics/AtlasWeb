<template>
  <v-main>
    <appbar class="appbar"/>
    <v-sheet
      style="position: relative;">
      <main-menu ref="mainmenu"  v-on:menuClicked="menuClicked" style="z-index: 99999;"/>
      <template v-if="component.component">
        <component v-bind:is="component.component" :query="component"/>
      </template>
      <template v-if="(user !== null && user !== undefined) && currentRoute.fullPath === '/'">
        <landing-page/>
      </template>
<!--       <v-footer absolute>AtlasXomics, 2021</v-footer> -->
    </v-sheet>
  </v-main>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, watch, onMounted, watchEffect, ref } from '@vue/composition-api';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { loginExisting, loggedIn, readCookie } from '@/utils/auth';
import { generateRouteByQuery } from '@/utils';
import Appbar from '@/components/Appbar/Appbar.vue';
import MainMenu from './components/menu/MainMenu.vue';
import AtlasXplore from './components/tools/atlasgx/AtlasXplore.vue';

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
    AtlasXplore,
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
    function redirectToVisual() {
      router.push('/visualization');
    }
    function redirectToPublic() {
      router.push('/public');
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

    // Display message on user login/logout
    watch(() => user.value, (newUser, oldUser) => {
      if (newUser) {
        snackbar.dispatch({ text: `Welcome ${newUser.username}`, options: { right: true } });
      } else if (oldUser) {
        snackbar.dispatch({ text: `Goodbye ${oldUser.username}`, options: { right: true } });
        redirectToVisual();
      }
    });
    watch(currentRoute, (route) => {
      if (route.query.component) store.commit.setComponent(route.query);
      else store.commit.setComponent({ component: null });
    });
    onMounted(async () => {
      await loginExisting();
      const route = currentRoute.value;
      if (currentRoute.value.fullPath !== '/' && loggedIn.value) {
        store.commit.setComponent(route.query);
      } else {
        if ((user.value === null || user.value === undefined) && !loggedIn.value) redirectToVisual();
        else if ((user.value !== null && user.value !== undefined) && !loggedIn.value) redirectToLogin();
        store.commit.setComponent({ component: null });
      }
    });
    return {
      component,
      user,
      openDrawer,
      menuClicked,
      subMenu,
      currentRoute,
    };
  },
});
</script>

<style>
html {
  overflow-x: scroll;
}
</style>
