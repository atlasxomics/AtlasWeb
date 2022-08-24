<template>
  <v-dialog
    v-model="active"
    width="80vw"
  >
    <v-card class="pa-2">
      <VueShowdown :markdown="helpguidetext" />
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import VueShowdown from 'vue-showdown';
import { defineComponent } from '@vue/composition-api';

import helpguidetext from '@/assets/helpguide.md';
import { helpDialog as active } from '../state';

Vue.use(VueShowdown, { options: { disableForced4SpacesIndentedSublists: true } });
export default defineComponent({
  name: 'HelpMenu',
  setup() {
    return { active, helpguidetext };
  },
});
</script>

<style>
.v-data-table tbody tr :hover {
  cursor: pointer;
}
</style>
