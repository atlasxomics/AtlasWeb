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
            <v-list-item v-bind:key="v.component" v-if="resolveAuthGroup(v.access_control)" @click="$emit('menuClicked',v.query)">
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
    ],
  },
  {
    groupname: 'Tools',
    items: [
      { name: 'AtlasXbrowser', icon: 'mdi-grid', access_control: ['admin', 'user'], color: 'cyan', query: { component: 'AtlasBrowser' } },
      { name: 'Atlas Viewer', icon: 'mdi-checkbox-multiple-marked', access_control: ['admin'], color: 'cyan', query: { component: 'AtlasViewer' } },
      { name: 'AtlasXplore', icon: 'mdi-magnify', access_control: ['admin', 'user', 'collab'], color: 'cyan', query: { component: 'AtlasXplore' } },
      { name: 'Atlas Compare', icon: 'mdi-compare', access_control: ['admin'], color: 'red', query: { component: 'AtlasCompare' } },
      // { name: 'Atlas Test', icon: 'mdi-test-tube', access_control: ['admin'], color: 'red', query: { component: 'AtlasTest' } },
      { name: 'Atlas Analytics', icon: 'mdi-sigma', access_control: ['admin'], color: 'cyan', query: { component: 'AtlasAnalytics' } },
      { name: 'Atlas Uploader', icon: 'mdi-cloud-upload', access_control: ['admin'], color: 'cyan', query: { component: 'AtlasUploader' } },
      { name: 'Atlas Run Viewer', icon: 'mdi-file-cloud', access_control: ['admin', 'user'], color: 'cyan', query: { component: 'AtlasRunViewer' } },
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
  {
    groupname: 'Settings',
    items: [
      { name: 'User settings', icon: 'mdi-settings', access_control: ['admin', 'user'], color: 'green', query: { component: 'UserSettings' } },
      { name: 'Admin Panel', icon: 'mdi-checkbox-multiple-blank', access_control: ['admin'], color: 'green', query: { component: 'AdminPanel' } },
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
