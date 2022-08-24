<template>
  <div>
    <fresh-dialog
      v-model='waferInformationMenu'
    >
      <wafer-information-menu />
    </fresh-dialog>
    <fresh-dialog
      v-model='chipInformationMenu'
    >
      <chip-information-menu />
    </fresh-dialog>
    <fresh-dialog
      v-model='dbitInformationMenu'
    >
      <dbit-information-menu />
    </fresh-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import FreshDialog from '@/components/FreshDialog.vue';
import {
  waferInformationMenu,
  dbitInformationMenu,
  chipInformationMenu,
} from '../state';
import WaferInformationMenu from './WaferInformationMenu.vue';
import ChipInformationMenu from './ChipInformationMenu.vue';
import DbitInformationMenu from './DbitInformationMenu.vue';

export default defineComponent({
  name: 'Views',
  components: {
    FreshDialog,
    WaferInformationMenu,
    ChipInformationMenu,
    DbitInformationMenu,
  },

  setup() {
    return {
      waferInformationMenu,
      dbitInformationMenu,
      chipInformationMenu,
    };
  },
});
</script>

<style>

</style>
