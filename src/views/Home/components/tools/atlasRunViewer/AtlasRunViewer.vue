<template>
    <v-container v-if="resolveAuthGroup(['admin','user'])">
        <v-row>
            <RunIdList :availableRunsPassed="availableRuns" @run-selected=handleRunSelection> </RunIdList>
            <AvailableFileList :fileList="availableFiles" :runID="selectedRunID" :flipLoading="flippingBoolean" @file-selected=handleFileSelection> </AvailableFileList>
            <FileDisplay
            :fileName="file_selected"
            :imageURL="selectedImageURL_array"
            :jsonStringContents="jsonString_array"
            :jsonContents="jsonPackage"
            :csvStringContents="csvPretty_array"
            :clearFileBoolean="switchRunBoolean"
            @file-displayed="flippingBoolean = !flippingBoolean"
            > </FileDisplay>
        </v-row>
    </v-container>
</template>

<script lang='ts'>
import { defineComponent, computed, ref, onMounted } from '@vue/composition-api';
import { resolveAuthGroup } from '@/utils/auth';
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
    const selectedImageURL_array = ref<any[]>([]);
    const availableRuns = ref<any[]>([]);
    const image_selected = ref<boolean>(false);
    const file_selected = ref<string>('');
    const jsonPackage = ref<Record<string, any>>({});
    const jsonString = ref<string>('');
    const jsonString_array = ref<any[]>([]);
    const selectedImage = ref<any>({});
    const csvPretty = ref<string>('');
    const csvPretty_array = ref<any[]>([]);
    const selectedRunID = ref<string>('');
    const flippingBoolean = ref<boolean>(false);
    const switchRunBoolean = ref<boolean>(false);
    const bucket_name = 'atx-illumina';
    const root = 'Images';
    // method to obtain all the files associated with a particular run from aws
    async function getRunFiles(runID: string) {
      if (!client.value) {
        return;
      }
      switchRunBoolean.value = !switchRunBoolean.value;
      availableFiles.value = [];
      // const folder_path = 'data/'.concat(runID);
      const folder_path = root.concat('/').concat(selectedRunID.value);
      const file_payload = { bucket: bucket_name, path: folder_path, filter: [''] };
      const run_files = await client.value.getFileList(file_payload);
      for (let i = 0; i < run_files.length; i += 1) {
        const tempObj = { id: i, file: run_files[i] };
        availableFiles.value.push(tempObj);
      }
      if (availableFiles.value.length === 0) {
        availableFiles.value.push({ id: 0, file: 'Run '.concat(runID).concat(' has no associated files.') });
      }
    }
    function handleRunSelection(runID: string) {
      selectedRunID.value = runID;
      getRunFiles(runID);
    }
    // method
    async function loadDisplayImage(filename: string) {
      try {
        image_selected.value = true;
        const pl = { bucket_name, filename };
        const image = await client.value?.getImageAsJPG({ params: pl });
        if (image) {
          selectedImageURL.value = URL.createObjectURL(image);
          selectedImageURL_array.value = [selectedImageURL.value];
        }
      } catch (error) {
        console.log(error);
      }
    }
    async function loadCSVFile(input_filename: string) {
      const payload = { params: { bucket_name, filename: input_filename } };
      const resp = await client.value?.getCsvFile(payload);
      csvPretty.value = JSON.stringify(resp, null, 4);
      csvPretty_array.value = [csvPretty.value];
    }
    // method called to load a json file into compotnent
    async function loadJSONFile(input_filename: string) {
      const payload = { params: { bucket_name, filename: input_filename } };
      const resp = await client.value?.getJsonFile(payload);
      jsonPackage.value = resp;
      jsonString.value = JSON.stringify(resp, null, 4);
      jsonString_array.value = [jsonString.value];
    }
    // method to handle a user request to get a file
    function loadFile(filename: string) {
      const file_array = filename.split('.');
      const suffix = file_array[file_array.length - 1];
      if (suffix.toLowerCase() === 'tif' || suffix.toLowerCase() === 'png' || suffix.toLowerCase() === 'jpg' || suffix.toLowerCase() === 'jpeg') {
        loadDisplayImage(filename);
      } else if (suffix === 'json') {
        loadJSONFile(filename);
      } else if (suffix === 'csv') {
        loadCSVFile(filename);
      }
    }
    function handleFileSelection(filename: string) {
      loadFile(filename);
      file_selected.value = filename;
    }
    // method to obtain a list of all unique run Ids with data present in AWS
    async function loadRunIds() {
      const uniqueRuns = new Set();
      // const payload = { params: { path: 'data/' } };
      const payload = { bucket: bucket_name, path: root.concat('/'), filter: ['postB_BSA.tif'] };
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
      selectedImageURL_array,
      availableRuns,
      loadRunIds,
      image_selected,
      handleFileSelection,
      file_selected,
      jsonPackage,
      jsonString,
      jsonString_array,
      loadCSVFile,
      selectedImage,
      csvPretty,
      csvPretty_array,
      selectedRunID,
      handleRunSelection,
      flippingBoolean,
      switchRunBoolean,
      resolveAuthGroup,
      root,
      bucket_name,
    };
  },
});
</script>
