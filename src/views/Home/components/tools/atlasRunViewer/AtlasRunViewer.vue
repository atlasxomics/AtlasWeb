<template>
    <v-container>
        <v-row>
          <v-col>
            <h1> Run IDs </h1>
            <v-spacer></v-spacer>
            <p v-for="run in availableRuns" :key="run">
              <v-btn @click="getRunFiles(run)">
                {{run}}
              </v-btn>
            </p>
            <!-- <button v-for="run in availableRuns" :key="run" @click="getRunFiles(run)"> -->
            {{run}}
            <v-spacer></v-spacer>
          </v-col>
          <v-col>
            <h1>
              Options
            </h1>
            <button v-for="file in availableFiles" :key="file"
            @click="loadFile(file)"
            >
            {{file}}
            </button>
          </v-col>
          <v-col>
            <v-img
            :src="currentDisplayedImage"
            >
            </v-img>
          </v-col>
        </v-row>
    </v-container>
</template>

<script lang='ts'>
import { defineComponent, computed, ref, onMounted } from '@vue/composition-api';
import store from '../../../../../store';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
});
export default defineComponent({
  name: 'AtlasRunViewer',
  props: ['query'],
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const availableFiles = ref<any[]>([]);
    const currentDisplayedImage = ref<any>();
    const availableRuns = ref<any[]>([]);
    async function getRunFiles(runID: string) {
      if (!client.value) {
        return;
      }
      console.log(runID);
      const folder_path = 'data/'.concat(runID);
      const file_payload = { params: { path: folder_path } };

      const run_files = await client.value.getFileList(file_payload);
      availableFiles.value = run_files;
      if (availableFiles.value.length === 0) {
        availableFiles.value.push('Run '.concat(runID).concat(' has no associated files.'));
      }
      console.log(availableFiles);
    }
    async function loadDisplayImage(filename: string) {
      try {
        const image = await client.value?.getImageAsJPG({ params: { filename } });
        console.log(image);
        if (image) {
          currentDisplayedImage.value = URL.createObjectURL(image);
          console.log(currentDisplayedImage.value);
        }
      } catch (error) {
        console.log(error);
      }
    }
    function loadFile(filename: string) {
      const file_array = filename.split('.');
      const suffix = file_array[file_array.length - 1];
      console.log(suffix);
      if (suffix === 'tif' || suffix === 'png') {
        console.log('image');
        loadDisplayImage(filename);
      }
    }
    async function loadRunIds() {
      console.log('fetching available runs');
      const uniqueRuns = new Set();
      const payload = { params: { path: 'data/' } };
      const allData = await client.value?.getFileList(payload);
      try {
        allData.forEach((file: any) => {
          const current_id = file.split('/')[1];
          if (!uniqueRuns.has(current_id)) {
            uniqueRuns.add(current_id);
            console.log(current_id);
            availableRuns.value.push(current_id);
          }
        });
      } catch (error) {
        console.log(error);
      }
    }
    onMounted(() => {
      console.log('mounted');
      loadRunIds();
    });
    return {
      getRunFiles,
      availableFiles,
      loadFile,
      loadDisplayImage,
      currentDisplayedImage,
      availableRuns,
      loadRunIds,
    };
  },
});
</script>
