<template>
  <v-dialog
    v-model="active"
    width="80vw"
  >
    <v-card class="pa-2">
      <VueShowdown :markdown="about" />
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import VueShowdown from 'vue-showdown';
import { defineComponent } from '@vue/composition-api';

import about from '@/assets/about.md';
import { aboutDialog as active } from '../state';

Vue.use(VueShowdown, { options: { disableForced4SpacesIndentedSublists: true } });
export default defineComponent({
  name: 'AboutMenu',
  setup() {
    return { active, about };
  },
});
</script>

<style>
.v-data-table tbody tr :hover {
  cursor: pointer;
}
</style>
