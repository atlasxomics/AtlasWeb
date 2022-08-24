<template>
  <div>
    <fresh-dialog
      v-model="uploadWaferInformationMenu"
      width="30vw"
    >
      <wafer-information-upload/>
    </fresh-dialog>
    <fresh-dialog
      v-model="uploadChipInformationMenu"
      width="30vw"
    >
      <chip-information-upload/>
    </fresh-dialog>
    <fresh-dialog
      v-model="uploadDbitInformationMenu"
      width="30vw"
    >
      <dbit-information-upload/>
    </fresh-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import FreshDialog from '@/components/FreshDialog.vue';
import ChipInformationUpload from './ChipInformationUpload.vue';
import WaferInformationUpload from './WaferInformationUpload.vue';
import DbitInformationUpload from './DbitInformationUpload.vue';

import { uploadChipInformationMenu, uploadWaferInformationMenu, uploadDbitInformationMenu } from '../state';

export default defineComponent({
  name: 'MetadataUpload',
  components: { FreshDialog, ChipInformationUpload, WaferInformationUpload, DbitInformationUpload },
  setup() {
    return { uploadChipInformationMenu, uploadWaferInformationMenu, uploadDbitInformationMenu };
  },
});
</script>

<style>
</style>
