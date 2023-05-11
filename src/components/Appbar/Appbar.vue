<template>
  <v-app-bar
    app
    dense
  >
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
      <template>
        <v-menu
          v-model="userMenu"
          offset-y
        >
        </v-menu>
      </template>
  </v-app-bar>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from '@vue/composition-api';
import VueFileToolbarMenu from 'vue-file-toolbar-menu';
import colors from 'vuetify/lib/util/colors';

import store from '@/store';
import { loggedIn, logout, resolveAuthGroup } from '@/utils/auth';
import { generateRouteByQuery } from '@/utils';

const filemenuStyleLight = {
  '--bar-button-hover-bkg': colors.grey.lighten2,
  '--bar-button-open-color': colors.grey.darken3,
  '--bar-button-open-bkg': colors.grey.lighten2,
  '--bar-menu-item-hover-bkg': colors.grey.lighten2,
};

export default defineComponent({
  name: 'Appbar',
  props: ['submenu'],
  components: { VueFileToolbarMenu },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const filemenuStyle = computed(() => (filemenuStyleLight));
    const component = computed(() => store.state.currentComponent);
    const userMenu = ref(false);
    const changePasswordMenu = ref(false);
    const subMenu = computed(() => props.submenu);
    return {
      filemenuStyle,
      loggedIn,
      logout,
      userMenu,
      changePasswordMenu,
      subMenu,
      component,
      resolveAuthGroup,
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
