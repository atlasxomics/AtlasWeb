<template>
  <v-navigation-drawer
    width="300"
    v-model="drawer"
    fixed
    temporary
  >
    <v-list
      nav
      dense
    >
      <v-list-item-group
          active-class="deep-purple--text text--accent-4"
        >
        <template v-for="group in menu" >
          <v-subheader v-bind:key="group.groupname">{{ group.groupname }}</v-subheader>
          <template v-for="v in group.items">
            <v-list-item v-bind:key="v.component" @click="$emit('menuClicked',v.query)">
              <v-list-item-icon><v-icon :color="v.color">{{ v.icon }}</v-icon></v-list-item-icon>
              <v-list-item-title>{{ v.name }}</v-list-item-title>
            </v-list-item>
          </template>
        </template>
      </v-list-item-group>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang='ts'>

import { ref, defineComponent } from '@vue/composition-api';
import store from '@/store';
import { resolveAuthGroup } from '@/utils/auth';

const menu = [
  // {
  //   groupname: 'Home',
  //   // items: [
  //   //   { name: 'Home', icon: 'mdi-home', access_control: ['any'], color: 'primary', query: { component: null } },
  //   // ],
  // },
  {
    groupname: 'Tools',
    items: [
      { name: 'AtlasXBrowser', icon: 'mdi-grid', access_control: ['admin', 'user'], color: 'cyan', query: { component: 'AtlasXBrowser' } },
      { name: 'AtlasXplore', icon: 'mdi-magnify', access_control: ['admin', 'user'], color: 'cyan', query: { component: 'AtlasXplore' } },
    ],
  },
];

export default defineComponent({
  name: 'MainMenu',
  setup(props, ctx) {
    const drawer = ref<boolean>(false);
    function openDrawer() {
      drawer.value = true;
    }
    store.commit.setSubmenu(null);
    return { menu, drawer, openDrawer, resolveAuthGroup };
  },
});
</script>
