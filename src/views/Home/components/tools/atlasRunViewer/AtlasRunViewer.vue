<template>
    <v-container>
        <v-row>
            <RunIdList :availableRunsPassed="availableRuns" @run-selected=getRunFiles> </RunIdList>
            <AvailableFileList :fileList="availableFiles" @file-selected=handleFileSelection> </AvailableFileList>
            <FileDisplay
            :fileName="file_selected"
            :imageURL="selectedImageURL"
            :jsonContents="jsonPackage"
            > </FileDisplay>
        </v-row>
    </v-container>
</template>

<script lang='ts'>
import { defineComponent, computed, ref, onMounted } from '@vue/composition-api';
import store from '../../../../../store';
import RunIdList from './components/RunIdList.vue';
import AvailableFileList from './components/AvailableFileList.vue';
import FileDisplay from './components/FileDisplay.vue';

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
    FileDisplay,
  },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const availableFiles = ref<any[]>([]);
    const selectedImageURL = ref<string>('');
    const availableRuns = ref<any[]>([]);
    const image_selected = ref<boolean>(false);
    const file_selected = ref<string>('');
    const jsonPackage = ref<Record<string, any>>({});
    // method to obtain all the files associated with a particular run from aws
    async function getRunFiles(runID: string) {
      if (!client.value) {
        return;
      }
      const folder_path = 'data/'.concat(runID);
      const file_payload = { params: { path: folder_path } };

      const run_files = await client.value.getFileList(file_payload);
      availableFiles.value = run_files;
      if (availableFiles.value.length === 0) {
        availableFiles.value.push('Run '.concat(runID).concat(' has no associated files.'));
      }
    }
    // method
    async function loadDisplayImage(filename: string) {
      try {
        image_selected.value = true;
        const image = await client.value?.getImageAsJPG({ params: { filename } });
        if (image) {
          selectedImageURL.value = URL.createObjectURL(image);
        }
      } catch (error) {
        console.log(error);
      }
    }
    async function loadJSONFile(input_filename: string) {
      const payload = { params: { filename: input_filename } };
      const resp = await client.value?.getJsonFile(payload);
      jsonPackage.value = resp;
    }
    // method
    function loadFile(filename: string) {
      const file_array = filename.split('.');
      const suffix = file_array[file_array.length - 1];
      console.log(suffix);
      if (suffix === 'tif' || suffix === 'png') {
        loadDisplayImage(filename);
      } else if (suffix === 'json') {
        loadJSONFile(filename);
      }
    }
    function handleFileSelection(filename: string) {
      file_selected.value = filename;
      loadFile(filename);
    }
    // method to obtain a list of all unique run Ids with data present in AWS
    async function loadRunIds() {
      const uniqueRuns = new Set();
      const payload = { params: { path: 'data/' } };
      const allData = await client.value?.getFileList(payload);
      try {
        allData.forEach((file: any) => {
          const current_id = file.split('/')[1];
          if (!uniqueRuns.has(current_id)) {
            uniqueRuns.add(current_id);
            availableRuns.value.push(current_id);
          }
        });
      } catch (error) {
        console.log(error);
      }
    }
    onMounted(() => {
      loadRunIds();
    });
    return {
      getRunFiles,
      availableFiles,
      loadFile,
      loadDisplayImage,
      selectedImageURL,
      availableRuns,
      loadRunIds,
      image_selected,
      handleFileSelection,
      file_selected,
      jsonPackage,
    };
  },
});
</script>
