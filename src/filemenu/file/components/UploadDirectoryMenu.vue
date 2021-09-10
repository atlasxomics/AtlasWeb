<template>
  <v-card>
    <v-card-title class="text-capitalize">
      Upload Directory
    </v-card-title>
    <v-card-text>
      <v-text-field
          v-model="search"
          prepens-inner-icon="mdi-magnify"
          :label="`Search`"
          single-line
          hide-details
      />
      <v-data-table
        v-model="selected"
        height="60vh"
        dense
        single-select
        :items-per-page="15"
        :headers="headers"
        :items="items"
        :search="search"
        @click:row="selectTest"
      >
      </v-data-table>
      <v-card-actions>
        <v-row no-gutters>
          <v-col
            cols="6"
            class="mx-1">
            <file-upload
              v-model="filesInDirectory"
              ref="upload"
              :multiple="multiple"
              :directory="directory"
              :drop-directory="dropDirectory"
              :add-index=true
              >
              <v-btn
                color="primary"
                @click="selectTest"
                :disables="false"
              >
                Add Directory
              </v-btn>
            </file-upload>
          </v-col>
          <v-col
            cols="0"
            class="mx-1"
          >
            <v-text-field
              v-model="targetDirectory"
              disabled
            >
              data
            </v-text-field>
          </v-col>
          <v-spacer />
          <v-col
            cols="0"
            class="mx-1">
            <v-btn
              color="secondary"
              @click="closeDialog">
              Cancel
            </v-btn>
          </v-col>
          <v-col
            cols="0"
            class="mx-1">
            <v-btn
              color="success"
              @click="uploadDirectory">
              Upload
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import FileUpload from 'vue-upload-component';
import { defineComponent, ref, computed, watch, reactive } from '@vue/composition-api';
import store from '@/store';
import { DatasetUploadParams, DatasetUploadMetadata } from '@/types';
import { userHasSystemAccess } from '@/utils/auth';
import { uploadDirectoryMenu, files } from '../state';

const headers = [
  { text: 'Filename', value: 'name' },
  { text: 'Size', value: 'size' },
];

export default defineComponent({
  name: 'UploadDirectoryMenu',
  components: { FileUpload },
  setup() {
    const client = computed(() => store.state.client);
    const step = ref(0);
    const meta = ref<DatasetUploadMetadata[]>([]);

    const search = ref<string | null>(null);
    const selected = ref<any>();
    const multiple = ref(true);
    const addIndex = ref(true);
    const directory = ref(true);
    const dropDirectory = ref(false);
    const targetDirectory = ref<string>('data');
    const filesInDirectory = ref<any[]>([]);
    const items = ref<any[]>([]);

    // If files change, reset metadata
    watch(filesInDirectory, (val) => {
      items.value = [];
      filesInDirectory.value.forEach((f, i) => items.value.push({ name: f.name, size: f.size }));
    });

    async function selectTest(item: any) {
      console.log(item.name);
    }

    function closeDialog() {
      uploadDirectoryMenu.value = false;
      filesInDirectory.value = [];
    }
    function uploadDirectory() {
      const datasetMeta = meta.value;
      if (!client.value || !items.value) { return; }

      // Combine params
      const datasets: DatasetUploadParams[] = filesInDirectory.value.map((file, i) => ({
        user: false,
        file: file.file,
        output_filename: `${targetDirectory.value}/${file.file.webkitRelativePath}`,
        bucket: null,
        meta: datasetMeta[i],
      }));
      store.dispatch.upload.uploadDatasetFiles(datasets);
      store.commit.upload.setDialogOpen(true);
      closeDialog();
    }

    return {
      closeDialog,
      uploadDirectory,
      directory,
      dropDirectory,
      filesInDirectory,
      multiple,
      addIndex,
      headers,
      items,
      selectTest,
      selected,
      search,
      targetDirectory,
    };
  },
});
</script>
