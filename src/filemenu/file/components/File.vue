<template>
  <div>
    <fresh-dialog
      v-model="uploadDatasetFileMenu"
      :width="uploadDialogWidth"
    >
      <upload-dataset-file-menu />
    </fresh-dialog>
    <fresh-dialog
      v-model="uploadDirectoryMenu"
    >
      <upload-directory-menu />
    </fresh-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import FreshDialog from '@/components/FreshDialog.vue';
import {
  uploadDatasetFileMenu,
  uploadDialogWidth,
  uploadDirectoryMenu,
  uploadDirectoryDialogWidth,
} from '../state';
import UploadDatasetFileMenu from './UploadDatasetFileMenu.vue';
import UploadDirectoryMenu from './UploadDirectoryMenu.vue';

export default defineComponent({
  name: 'File',
  components: {
    FreshDialog,
    UploadDatasetFileMenu,
    UploadDirectoryMenu,
  },

  setup() {
    return {
      uploadDatasetFileMenu,
      uploadDialogWidth,
      uploadDirectoryMenu,
      uploadDirectoryDialogWidth,
    };
  },
});
</script>

<style>

</style>
