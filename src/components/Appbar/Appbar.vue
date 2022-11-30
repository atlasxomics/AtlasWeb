<template>
  <v-app-bar
    app
    dense
  >
      <div style="cursor: pointer;">
      <v-img @click="redirectToVisual" width="40px" src="favicon-nobg.png"></v-img>
      </div>
      <v-app-bar-nav-icon @click="$emit('openDrawer')"></v-app-bar-nav-icon>
      <v-tooltip
        v-for="menu in subMenu"
        v-bind:key="menu.text"
        bottom>
        <template v-slot:activator="{ on, attrs }" >
          <template v-if="!menu.type">
            <v-btn
              :class ="!menu.enabled ? 'hidden': 'visible'"
              :id="menu.ref ? menu.ref : ''"
              text
              @click="menu.click"
              :icon="menu.icon ? true : false"
              v-bind="attrs"
              v-on="on"
              >
              <template v-if="menu.icon">
                <v-icon :color="menu.color">{{ menu.icon }}</v-icon>
              </template>
              <template v-if="!menu.icon">
                {{ menu.text }}
              </template>
            </v-btn>
          </template>
          <template
          v-if="menu.type == 'component'"
          >
            <div
            :id="menu.id"
            />
          </template>
        </template>
        <span v-bind:key="`${menu.text}-span`">{{ menu.tooltip }}</span>
      </v-tooltip>
      <v-spacer />
      <template v-if="loggedIn">
        <v-menu
          v-model="userMenu"
          offset-y
        >
          <template v-slot:activator="{ on }">
            <v-btn
              text
              v-on="on"
            >
              {{ user }}  <span v-if="urlPostfix !== 'production'">({{ urlPostfix }})</span>
            </v-btn>
          </template>
          <v-list>
            <v-list-item>
              <v-btn>
                Add a Run
              </v-btn>
            </v-list-item>
            <v-list-item>
              <v-dialog
                v-model="changePasswordMenu"
                width="40vw"
              >
                <template v-slot:activator="{ on }">
                  <v-btn
                    text
                    block
                    v-on="on"
                  >
                    Change Password
                  </v-btn>
                </template>
                <change-password-menu @close="changePasswordMenu = false; userMenu = false;" />
              </v-dialog>
            </v-list-item>
            <v-list-item>
              <v-btn
                text
                block
                color="error"
                @click="logout"
              >
                Logout
              </v-btn>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
  </v-app-bar>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from '@vue/composition-api';
import VueFileToolbarMenu from 'vue-file-toolbar-menu';
import colors from 'vuetify/lib/util/colors';

import store from '@/store';
import { loggedIn, logout } from '@/utils/auth';
import { filemenu, components } from '@/filemenu';
import ChangePasswordMenu from './ChangePasswordMenu.vue';

const filemenuStyleLight = {
  '--bar-button-hover-bkg': colors.grey.lighten2,
  '--bar-button-open-color': colors.grey.darken3,
  '--bar-button-open-bkg': colors.grey.lighten2,
  '--bar-menu-item-hover-bkg': colors.grey.lighten2,
};

export default defineComponent({
  name: 'Appbar',
  components: { VueFileToolbarMenu, ...components, ChangePasswordMenu },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const user = computed(() => store.state.client?.user?.username);
    const urlPostfix = computed(() => store.state.client?.urlPostfix);
    const filemenuStyle = computed(() => (filemenuStyleLight));
    const currentRoute = computed(() => ctx.root.$route);
    const component = computed(() => store.state.currentComponent);
    const userMenu = ref(false);
    const changePasswordMenu = ref(false);
    const subMenu = computed(() => store.state.subMenu);
    function redirectToVisual() {
      if (currentRoute.value.fullPath !== '/') router.push('/');
    }
    return {
      filemenu,
      filemenuStyle,
      components,
      loggedIn,
      logout,
      user,
      currentRoute,
      userMenu,
      changePasswordMenu,
      subMenu,
      urlPostfix,
      redirectToVisual,
      component,
    };
  },
});
</script>

<style lang="scss">
.rotate {
  animation: rotation 1.5s infinite linear;
}

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}

// https://github.com/vuetifyjs/vuetify/issues/11149#issuecomment-852394927
.v-btn--active::before, .v-btn:focus::before {
  opacity: 0 !important;
}
.hidden {
  visibility: hidden;
}
</style>
