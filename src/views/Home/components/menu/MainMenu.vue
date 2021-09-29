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
              <v-list-item-icon><v-icon :color="v.color">{{ v.icon }}</v-icon></v-list-item-icon>
              <v-list-item-title>{{ v.name }}</v-list-item-title>
            </v-list-item>
        </template>
      </v-list-item-group>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang='ts'>

import { ref, defineComponent } from '@vue/composition-api';
import store from '@/store';

const menu = [
  {
    groupname: 'Home',
    items: [
      { name: 'Home', icon: 'mdi-home', color: 'primary', query: { component: null } },
    ],
  },
  {
    groupname: 'Analysis',
    items: [
      { name: 'Wafer Tree', icon: 'mdi-chart-pie', color: 'warning', query: { component: 'WaferTrace' } },
      { name: 'Image Viewer from Wafer', icon: 'mdi-image-filter', color: 'warning', query: { component: 'ImageViewer' } },
      { name: 'QC Viewer', icon: 'mdi-checkbox-multiple-marked', color: 'warning', query: { component: 'QcViewer' } },
    ],
  },
  {
    groupname: 'Tools',
    items: [
      { name: 'X-SPOT', icon: 'mdi-pencil-box', color: 'cyan', query: { component: 'QcTools' } },
    ],
  },
  {
    groupname: 'Metadata',
    items: [
      { name: 'Wafer Information', icon: 'mdi-texture', color: 'secondary', query: { component: 'WaferInformationViewer' } },
      { name: 'Chip Information', icon: 'mdi-checkbox-multiple-blank', color: 'secondary', query: { component: 'ChipInformationViewer' } },
      { name: 'DBiT Information', icon: 'mdi-grid', color: 'secondary', query: { component: 'DbitInformationViewer' } },
    ],
  },
  {
    groupname: 'Settings',
    items: [
      { name: 'User settings', icon: 'mdi-texture', color: 'green', query: { component: 'UserSettings' } },
      { name: 'Admin Panel', icon: 'mdi-checkbox-multiple-blank', color: 'green', query: { component: 'AdminPanel' } },
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
    return { menu, drawer, openDrawer };
  },
});
</script>
