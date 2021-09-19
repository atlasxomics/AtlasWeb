<template>
  <div>
    <fresh-dialog
      v-model="uploadDatasetFileMenu"
      :width="uploadDialogWidth"
    >
      <upload-dataset-file-menu />
    </fresh-dialog>
    <fresh-dialog
      v-model="uploadQcDirectoryMenu"
    >
      <upload-qc-directory-menu />
    </fresh-dialog>
    <div>
      <metadata-upload/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import FreshDialog from '@/components/FreshDialog.vue';
import {
  uploadDatasetFileMenu,
  uploadDialogWidth,
  uploadQcDirectoryMenu,
  uploadDirectoryDialogWidth,
} from '../state';
import UploadDatasetFileMenu from './UploadDatasetFileMenu.vue';
import UploadQcDirectoryMenu from './UploadQCDirectoryMenu.vue';
import { MetadataUpload } from '../metadata';

export default defineComponent({
  name: 'File',
  components: {
    FreshDialog,
    UploadDatasetFileMenu,
    UploadQcDirectoryMenu,
    MetadataUpload,
  },

  setup() {
    return {
      uploadDatasetFileMenu,
      uploadDialogWidth,
      uploadQcDirectoryMenu,
      uploadDirectoryDialogWidth,
    };
  },
});
</script>

<style>

</style>
