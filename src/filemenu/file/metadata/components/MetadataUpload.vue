<template>
  <div>
    <fresh-dialog
      v-model="uploadChipInformationMenu"
      width="30vw"
    >
      <chip-information-upload/>
    </fresh-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import FreshDialog from '@/components/FreshDialog.vue';
import ChipInformationUpload from './ChipInformationUpload.vue';
import { uploadChipInformationMenu } from '../state';

export default defineComponent({
  name: 'MetadataUpload',
  components: { ChipInformationUpload },
  setup() {
    return { uploadChipInformationMenu };
  },
});
</script>

<style>
</style>
