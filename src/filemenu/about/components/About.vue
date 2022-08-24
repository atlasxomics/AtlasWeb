<template>
  <div>
    <help-menu />
    <about-menu />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import HelpMenu from './HelpMenu.vue';
import AboutMenu from './AboutMenu.vue';

export default defineComponent({
  name: 'About',
  components: { HelpMenu, AboutMenu },
  setup() {
    return {};
  },
});
</script>

<style>

</style>
