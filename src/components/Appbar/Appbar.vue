<template>
  <v-app-bar
    app
    dense
  >
<!--       <vue-file-toolbar-menu
        :content="filemenu"
        :style="filemenuStyle"
      />
      <template v-for="(component, key) in components">
        <component
          :is="component"
          :key="key"
        />
      </template> -->
      <v-app-bar-nav-icon @click="$emit('openDrawer')"></v-app-bar-nav-icon>
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
              {{ user }}
            </v-btn>
          </template>
          <v-list>
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
import { defineComponent, computed, ref } from '@vue/composition-api';
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
    const user = computed(() => store.state.client?.user?.username);
    const filemenuStyle = computed(() => (filemenuStyleLight));
    const currentRoute = computed(() => ctx.root.$route);
    const userMenu = ref(false);
    const changePasswordMenu = ref(false);

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
</style>
