<template>
    <v-container>
        <v-row>
            <RunIdList :availableRunsPassed="availableRuns" @run-selected=getRunFiles> </RunIdList>
          <v-col>
            <AvailableFileList :fileList="availableFiles" @file-selected=loadFile> </AvailableFileList>
          </v-col>
          <v-col>
            <v-img
            v-if="image_selected"
            :src="currentDisplayedImage"
            width="300"
            height="300"
            >
            </v-img>

          </v-col>
        </v-row>
    </v-container>
</template>

<script lang='ts'>
import { defineComponent, computed, ref, onMounted } from '@vue/composition-api';
import Vue from 'vue';
import store from '../../../../../store';
import RunIdList from './components/RunIdList.vue';
import AvailableFileList from './components/AvailableFileList.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
});
export default defineComponent({
  name: 'AtlasRunViewer',
  props: ['query'],
  components: {
    RunIdList,
    AvailableFileList,
  },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const availableFiles = ref<any[]>([]);
    const currentDisplayedImage = ref<any>();
    const availableRuns = ref<any[]>([]);
    const image_selected = ref<boolean>(false);
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
        image_selected.value = true;
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
      image_selected,
    };
  },
});
</script>
