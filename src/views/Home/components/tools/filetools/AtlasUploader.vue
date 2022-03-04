<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-tabs v-model="tab">
          <v-tab v-for="item in tabs" :key="item">
            {{ item }}
          </v-tab>
        </v-tabs>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card flat>
          <v-text-field
            label="Run ID (DXXX)"
            v-model="runId"/>
        </v-card>
      </v-col>
    </v-row>
    <v-tabs-items v-model="tab">
      <v-tab-item key="SourceImage">
        <v-container fluid>
          <v-row>
            <v-col cols=12 sm="4">
              <file-upload-drag-drop :disabled="!runId" :run_id="runId" datatype="image" filetype="PostB" :destination="generateSourceImageDestination(runId, 'postB.tif')"/>
            </v-col>
            <v-col cols=12 sm="4">
              <file-upload-drag-drop :disabled="!runId" :run_id="runId" datatype="image" filetype="PostB BSA"  :destination="generateSourceImageDestination(runId, 'postB_BSA.tif')"/>
            </v-col>
            <v-col cols=12 sm="4">
              <file-upload-drag-drop :disabled="!runId" :run_id="runId" datatype="image" filetype="Flow A"  :destination="generateSourceImageDestination(runId, 'flowA.tif')"/>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols=12 sm="4">
              <file-upload-drag-drop :disabled="!runId" :run_id="runId" datatype="image" filetype="Flow B"  :destination="generateSourceImageDestination(runId, 'flowB.tif')"/>
            </v-col>
            <v-col cols=12 sm="4">
              <file-upload-drag-drop :disabled="!runId" :run_id="runId" datatype="image" filetype="Fix"  :destination="generateSourceImageDestination(runId, 'fix.tif')"/>
            </v-col>
          </v-row>
        </v-container>
      </v-tab-item>
      <v-tab-item key="Cell Data Upload">
        <v-container fluid>
          <v-row>
            <v-col cols=12 sm="4">
              <file-upload-drag-drop :disabled="!runId" :run_id="runId" filetype="Gene Matrix (.h5ad)"  :destination="generateGeneMatrixDestination(runId, 'genes.h5ad')"/>
            </v-col>
          </v-row>
        </v-container>
      </v-tab-item>
      <v-tab-item key="Novogen Seq Transfer" disabled>
        <novogen-transfer/>
      </v-tab-item>
      <v-tab-item key="Illumina Seq Transfer" disabled>
        <illumina-transfer/>
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>

<script lang='ts'>
import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { generateRouteByQuery } from '@/utils';
import FileUploadDragDrop from './FileUploadDragDrop.vue';
import NovogenTransfer from './NovogenTransfer.vue';
import IlluminaTransfer from './IlluminaTransfer.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});
function generateSourceImageDestination(runid: string, filename: string): string {
  const runidUpper = runid ? runid.toUpperCase() : runid;
  return `data/${runidUpper}/images/${filename}`;
}
function generateGeneMatrixDestination(runid: string, filename: string): string {
  const runidUpper = runid ? runid.toUpperCase() : runid;
  return `data/${runidUpper}/h5/obj/${filename}`;
}

const tabs = ['Image Upload', 'Gene Matrix Upload (H5AD)', 'Transfer Seq (Novogen)', 'Transfer Seq (Illumina)'];

export default defineComponent({
  name: 'AtlasUploader',
  components: { FileUploadDragDrop, NovogenTransfer, IlluminaTransfer },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const runId = ref<string | null>();
    const tab = ref<any>(0);
    watch(runId, (v: any) => {
      if (!runId.value) return;
      runId.value = runId.value.toUpperCase();
    });
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
    });
    return {
      tab,
      tabs,
      runId,
      generateSourceImageDestination,
      generateGeneMatrixDestination,
    };
  },
});
</script>

<style>
</style>
