<template>
  <v-card>
    <v-card-title class="text-capitalize">
      Upload Wafer Information File (.csv)
    </v-card-title>
    <v-card-text>
      <v-file-input
        v-model="files"
        :multiple="true"
        outlined
        show-size
        label="Select File(s)"
        :rules="[nonEmptyArrayRule, datasetTypesRule]"
        :accept="acceptedFileTypes"
        prepend-icon=""
        prepend-inner-icon="mdi-paperclip"
      />

      <v-stepper
        v-if="files.length"
        v-model="step"
      >
        <v-stepper-header>
          <template v-for="(file, i) in files">
            <v-stepper-step
              v-if="files[i]"
              :key="`${i}-step`"
              :complete="formsValidation[i]"
              :step="i"
            >
              {{ truncateFileName(file.name) }}
            </v-stepper-step>
            <v-divider
              v-if="i !== files.length - 1"
              :key="`${i}-divider`"
            />
          </template>
        </v-stepper-header>
        <v-stepper-items>
          <template v-for="(_, i) in files">
            <v-stepper-content
              :key="`${i}-content`"
              :step="i"
            >
              <v-form
                v-if="meta[i]"
                v-model="formsValidation[i]"
              >
                <v-text-field
                  v-model="meta[i].remarks"
                  label="Remarks"
                  hide-details
                />
              </v-form>
            </v-stepper-content>
          </template>
        </v-stepper-items>
      </v-stepper>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        v-if="step !== 0"
        color="secondary"
        @click="step -= 1"
      >
        Back
      </v-btn>
      <v-btn
        v-else
        color="secondary"
        @click="closeDialog"
      >
        Close
      </v-btn>
      <template v-if="files.length">
        <v-btn
          v-if="step !== files.length - 1"
          color="primary"
          @click="step += 1"
        >
          Next
        </v-btn>
        <v-btn
          v-else
          color="success"
          :disabled="!allFormsValid"
          @click="uploadDatasets"
        >
          Upload
        </v-btn>
      </template>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, reactive } from '@vue/composition-api';
import store from '@/store';

import { DatasetUploadParams, DatasetUploadMetadata, UploadMeta, MetadataUploadParams } from '@/types';
import { userHasSystemAccess } from '@/utils/auth';
import { uploadWaferInformationMenu } from '../state';
import { files } from '../../state';

export default defineComponent({
  name: 'WaferInformationUpload',
  setup() {
    const client = computed(() => store.state.client);
    const metaType = ref<string>('wafers');
    const formsValidation = ref([]);
    const allFormsValid = computed(() => formsValidation.value.every((val) => val));

    const step = ref(0);
    const meta = ref<DatasetUploadMetadata[]>([]);

    // If files change, reset metadata
    watch(files, (val) => {
      meta.value = val.map(() => reactive({ remarks: '' }));
    });

    function truncateFileName(filename: string): string {
      const maxLength = 15;
      const [main, ...exts] = filename.split('.');
      const ext = exts[exts.length - 1];

      if (filename.length > maxLength) {
        return `${main.substring(0, maxLength)}...${ext}`;
      }

      return filename;
    }

    const emptyMessage = 'Field cannot be empty.';
    const nonEmptyRule = (val: string) => (!!val || emptyMessage);
    const nonEmptyArrayRule = (val: unknown[]) => (val.length > 0 || emptyMessage);

    // const acceptedFileTypes = 'application/zip';

    const acceptedFileTypes = ref<string>('.csv');
    const datasetTypesRule = (inputFiles: File[]) => (
      inputFiles.every((file) => true) || 'Only CSV files are supported.'
    );

    function closeDialog() {
      uploadWaferInformationMenu.value = false;
      files.value = [];
    }
    function uploadDatasets() {
      const datasetMeta = meta.value;
      if (!client.value || !files.value || !datasetMeta) { return; }

      // Combine params
      const datasets: MetadataUploadParams[] = files.value.map((file, i) => ({
        user: false,
        file,
        output_filename: file.name,
        bucket: null,
        meta: datasetMeta[i],
        meta_type: metaType.value,
      }));

      store.dispatch.upload.uploadMetadataFile(datasets);
      store.commit.upload.setDialogOpen(true);
      closeDialog();
    }

    return {
      formsValidation,
      allFormsValid,
      step,
      files,
      meta,
      truncateFileName,
      closeDialog,
      uploadDatasets,
      nonEmptyRule,
      nonEmptyArrayRule,
      acceptedFileTypes,
      datasetTypesRule,
    };
  },
});
</script>
