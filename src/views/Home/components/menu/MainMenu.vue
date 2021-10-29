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
        <template  v-for="group in menu" >
          <v-subheader  v-bind:key="group.name">{{ group.groupname }}</v-subheader>
            <v-list-item v-for="v in group.items" v-bind:key="v.component" @click="$emit('menuClicked',v.query)">
              <template v-if="resolveAuthGroup(v.access_control)">
                <v-list-item-icon><v-icon :color="v.color">{{ v.icon }}</v-icon></v-list-item-icon>
                <v-list-item-title>{{ v.name }}</v-list-item-title>
              </template>
            </v-list-item>
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
  {
    groupname: 'Home',
    items: [
      { name: 'Home', icon: 'mdi-home', access_control: ['admin', 'user'], color: 'primary', query: { component: null } },
    ],
  },
  {
    groupname: 'Analysis',
    items: [
      { name: 'Wafer Tree', icon: 'mdi-chart-pie', color: 'warning', access_control: ['admin', 'user'], query: { component: 'WaferTrace' } },
      { name: 'Image Viewer from Wafer', icon: 'mdi-image-filter', access_control: ['admin', 'user'], color: 'warning', query: { component: 'ImageViewer' } },
      { name: 'QC Viewer', icon: 'mdi-checkbox-multiple-marked', access_control: ['admin', 'user'], color: 'warning', query: { component: 'QcViewer' } },
    ],
  },
  {
    groupname: 'Tools',
    items: [
      { name: 'Atlas Browser', icon: 'mdi-pencil-box', access_control: ['admin', 'user'], color: 'cyan', query: { component: 'AtlasBrowser' } },
      { name: 'Atlas GX', icon: 'mdi-biohazard', access_control: ['admin', 'user'], color: 'cyan', query: { component: 'AtlasG' } },
      // { name: 'Atlas Uploader', icon: 'mdi-cloud-upload', access_control: ['admin', 'user'], color: 'cyan', query: { component: 'AtlasUploader' } },
    ],
  },
  {
    groupname: 'Metadata',
    items: [
      { name: 'Wafer Information', icon: 'mdi-texture', access_control: ['admin', 'user'], color: 'secondary', query: { component: 'WaferInformationViewer' } },
      { name: 'Chip Information', icon: 'mdi-checkbox-multiple-blank', access_control: ['admin', 'user'], color: 'secondary', query: { component: 'ChipInformationViewer' } },
      { name: 'DBiT Information', icon: 'mdi-grid', access_control: ['admin', 'user'], color: 'secondary', query: { component: 'DbitInformationViewer' } },
    ],
  },
  // {
  //   groupname: 'Settings',
  //   items: [
  //     { name: 'User settings', icon: 'mdi-settings', access_control: ['admin', 'user'], color: 'green', query: { component: 'UserSettings' } },
  //     { name: 'Admin Panel', icon: 'mdi-checkbox-multiple-blank', access_control: ['admin'], color: 'green', query: { component: 'AdminPanel' } },
  //   ],
  // },
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
