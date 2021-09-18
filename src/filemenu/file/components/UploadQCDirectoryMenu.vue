<template>
  <v-card>
    <v-card-title class="text-capitalize">
      Upload QCed Directory
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
        :loading="loading"
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
                :disabled="false"
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
              color="primary"
              @click="clearItems">
              Clear
            </v-btn>
          </v-col>
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
              :disabled="upload_disabled"
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
import _ from 'lodash';
import { defineComponent, ref, computed, watch, reactive } from '@vue/composition-api';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { DatasetUploadParams, DatasetUploadMetadata } from '@/types';
import { userHasSystemAccess } from '@/utils/auth';
import { uploadQcDirectoryMenu, files } from '../state';

const headers = [
  { text: 'Filename', value: 'name' },
  { text: 'Size', value: 'size' },
];

export default defineComponent({
  name: 'UploadQcDirectoryMenu',
  components: { FileUpload },
  setup() {
    const client = computed(() => store.state.client);
    const step = ref(0);
    const meta = ref<DatasetUploadMetadata[]>([]);

    const search = ref<string | null>(null);
    const loading = ref<boolean>(false);
    const selected = ref<any>();
    const multiple = ref(true);
    const addIndex = ref(true);
    const directory = ref(true);
    const dropDirectory = ref(false);
    const targetDirectory = ref<string>('data');
    const filesInDirectory = ref<any[]>([]);
    const items = ref<any[]>([]);
    const upload_ids = ref<string[]>([]);
    // UI
    const upload_disabled = ref<boolean>(true);
    // If files change, reset metadata
    watch(filesInDirectory, (val) => {
      items.value = [];
      filesInDirectory.value.forEach((f, i) => items.value.push({ name: f.name, size: f.size }));
    });

    async function selectTest(item: any) {
      console.log(item.name);
    }

    function closeDialog() {
      uploadQcDirectoryMenu.value = false;
      filesInDirectory.value = [];
    }
    async function clearItems() {
      items.value = [];
      upload_disabled.value = true;
    }
    async function uploadDirectory() {
      const datasetMeta = meta.value;
      if (!client.value) { return; }
      if (!items.value) { return; }
      if (upload_disabled.value) { return; }
      if (upload_ids.value.length < 1 || !upload_ids.value) { return; }
      // Combine params
      const datasets: DatasetUploadParams[] = filesInDirectory.value.map((file, i) => ({
        user: false,
        file: file.file,
        output_filename: `${targetDirectory.value}/${file.file.webkitRelativePath}`,
        bucket: null,
        meta: datasetMeta[i],
      }));
      loading.value = true;
      const promises: any[] = [];
      _.each(upload_ids.value, (x) => {
        if (client.value) {
          // console.log(x);
          const p: Promise<any> = client.value.getQc({ params: { filter: JSON.stringify({ id: x.split('.')[0] }) } });
          promises.push(p);
        }
      });
      let upload_flag = true;
      await Promise.all(promises).then((resps) => {
        // console.log(resps);
        _.each(resps, (rs) => {
          if (rs.length > 0) {
            upload_flag = false;
          }
        });
      });
      loading.value = false;
      if (upload_flag) {
        store.dispatch.upload.uploadQcDatasetFiles(datasets);
        store.commit.upload.setDialogOpen(true);
        closeDialog();
      } else {
        snackbar.dispatch({ text: 'Some entries already exist in the database', options: { right: true } });
        upload_disabled.value = true;
      }
    }
    function extractIds(data: any[]) {
      const unique_ids = _.uniq(data.map((x: any) => x.name.split('/')[0]));
      // console.log(unique_ids);
      return unique_ids;
    }
    function validateIds() {
      upload_disabled.value = false;
      _.each(upload_ids.value, (x: string) => {
        const fl = items.value.filter((f: any) => f.name.includes(x)).map((z) => z.name);
        // check metadata.json
        const validated = fl.filter((c: string) => c.includes('metadata.json')).length > 0;
        // if (validated) console.log(`${x} validated`);
        // else console.log(`${x} failed to be validated`);
        if (!validated) upload_disabled.value = true;
      });
      if (items.value.length < 1) upload_disabled.value = true;
    }
    watch(items, (val) => {
      const unique_ids = extractIds(items.value);
      upload_ids.value = unique_ids;
      validateIds();
    });
    return {
      closeDialog,
      uploadDirectory,
      clearItems,
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
      loading,
      targetDirectory,
      upload_disabled,
    };
  },
});
</script>
