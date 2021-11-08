<template>
  <v-card :disabled="disabled || uploaded">
    <v-card-title>
      {{ filetype }} <span v-if="uploaded">(Uploaded)</span>
    </v-card-title>
    <v-card-subtitle>
        <v-card flat>
          <v-file-input :disabled="disabled" multiple v-model="files" label="Browse File"/>
          <template v-if="disabled">
            Provide Run ID first
          </template>
          <template v-else>
            Drop or select file
          </template>
        </v-card>
        <file-upload
          :multiple="false"
          :drop="true"
          :drop-directory="true"
          v-model="files">
        </file-upload>
    </v-card-subtitle>
    <v-card-text>
      <v-row>
        <template v-if="files.length">
          <template v-for="file in files">
            <v-simple-table :key="file.id">
              <tbody>
                <tr>
                  <th>File Name : {{file.name}}</th>
                  <th v-if="file.error">{{file.error}}</th>
                  <th v-else-if="file.success">Success</th>
                </tr>
                <tr>
                  <th>Size : {{file.size}}</th>
                </tr>
                <tr>
                  <th>S3 Output Path : {{ destination }}</th>
                </tr>
              </tbody>
            </v-simple-table>
          </template>
            <v-form v-if="datatype=='image'">
              <v-checkbox
                v-model="metaData.vertical_flip"
                dense
                label="Vertically Flipped"
              />
              <v-checkbox
                v-model="metaData.horizontal_flip"
                dense
                label="Horizontally Flipped"
              />
              <v-text-field
                v-model.number="metaData.rotation_cw"
                dense
                label="Rotation (Clockwise)"
                type="number"
                :min="0"
                :max="360"
                :step="10"
                clearable
              />
              <v-select
                v-model="metaData.microscope"
                :items="microScopes"
                label="Microscope"
                dense
              />
            </v-form>
        </template>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn
        small
        color="secondary"
        @click="files=[]"
        :disabled="disabled"
        >Clear</v-btn>
      <v-spacer/>
      <v-btn
        small
        color="success"
        :disabled="disabled || files.length < 1"
        @click="onUpload">
        Upload
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import FileUpload from 'vue-upload-component';
import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { generateRouteByQuery } from '@/utils';
import { DatasetUploadParams } from '@/types';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});
interface MetaData {
  run_id?: string;
  horizontal_flip?: boolean;
  vertical_flip?: boolean;
  rotation_cw?: number;
  microscope?: string;
}
const microScopes = [
  { text: 'Keyence 1', value: 'keyence_1' },
  { text: 'Keyence 2', value: 'keyence_2' },
  { text: 'Evos 1', value: 'evos_1' },
];
export default defineComponent({
  name: 'FileUploadDragDrop',
  components: { FileUpload },
  props: ['disabled', 'run_id', 'datatype', 'filetype', 'extension', 'destination'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const files = ref<File[]>([]);
    const metaData = ref<MetaData>({ run_id: props.run_id, horizontal_flip: false, vertical_flip: false, rotation_cw: 0, microscope: '' });
    const uploaded = ref<boolean>(false);
    async function onUpload() {
      const rfiles: File[] = [];
      lodash.each(files.value, (v: any) => {
        if (v.file) rfiles.push(v.file as File);
        else rfiles.push(v);
      });
      metaData.value.run_id = props.run_id;
      const payload: DatasetUploadParams[] = rfiles.map((file: File) => ({ file, meta: metaData.value, bucket: 'atx-cloud-dev', output_filename: props.destination }));
      console.log(payload);
      store.dispatch.upload.uploadDatasetFiles(payload);
      store.commit.upload.setDialogOpen(true);
      uploaded.value = true;
    }
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
    });
    return {
      files,
      onUpload,
      metaData,
      uploaded,
      microScopes,
    };
  },
});

</script>
<style>

</style>
