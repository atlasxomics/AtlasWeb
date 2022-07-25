<template>
      <v-row>
        <v-col cols="12" sm="4">
            <AvailableFileList :fileList="availableFiles" :runID="selectedRunID" @file-selected=handleFileSelection> </AvailableFileList>
        </v-col>
        <v-col cols="12" sm="8" align-self="center">
            <FileDisplay
            :fileName="file_selected"
            :imageURL="selectedImageURL_array"
            :jsonStringContents="jsonString_array"
            :jsonContents="jsonPackage"
            :csvStringContents="csvPretty_array"
            > </FileDisplay>
        </v-col>
      </v-row>
</template>

<script lang='ts'>
import { defineComponent, computed, ref, onMounted } from '@vue/composition-api';
import AvailableFileList from '@/views/Home/components/tools/atlasRunViewer/components/AvailableFileList.vue';
import FileDisplay from '@/views/Home/components/tools/atlasRunViewer/components/FileDisplay.vue';
import store from '@/store';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
});
export default defineComponent({
  name: 'SpatialFolderViewer',
  props: {
    selectedRunID: { required: true, type: String },
    getFiles: { required: true, type: Boolean },
  },
  components: {
    AvailableFileList,
    FileDisplay,
  },
  setup(props, ctxe) {
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
    // method to obtain all the files associated with a particular run from aws
    async function getRunFiles() {
      if (!client.value) {
        console.log('no client');
        return;
      }
      const folder_path = 'data/'.concat(props.selectedRunID).concat('/images');
      const file_payload = { params: { path: folder_path } };
      const run_files = await client.value.getFileList(file_payload);
      availableFiles.value = run_files;
      if (availableFiles.value.length === 0) {
        availableFiles.value.push('Run '.concat(props.selectedRunID).concat(' has no associated files.'));
      }
      console.log(run_files);
    }
    async function loadDisplayImage(filename: string) {
      try {
        image_selected.value = true;
        const image = await client.value?.getImageAsJPG({ params: { filename } });
        if (image) {
          selectedImageURL.value = URL.createObjectURL(image);
          selectedImageURL_array.value = [selectedImageURL.value];
        }
      } catch (error) {
        console.log(error);
      }
    }
    async function loadCSVFile(input_filename: string) {
      const payload = { params: { filename: input_filename } };
      const resp = await client.value?.getCsvFile(payload);
      console.log(resp);
      csvPretty.value = JSON.stringify(resp, null, 4);
      csvPretty_array.value = [csvPretty.value];
      console.log(csvPretty);
    }
    // method called to load a json file into compotnent
    async function loadJSONFile(input_filename: string) {
      const payload = { params: { filename: input_filename } };
      const resp = await client.value?.getJsonFile(payload);
      jsonPackage.value = resp;
      jsonString.value = JSON.stringify(resp, null, 8);
      jsonString_array.value = [jsonString.value];
    }
    // method to handle a user request to get a file
    function loadFile(filename: string) {
      const file_array = filename.split('.');
      const suffix = file_array[file_array.length - 1];
      console.log(suffix);
      if (suffix === 'tif' || suffix === 'png') {
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
    onMounted(() => {
      getRunFiles();
    });
    // method to obtain a list of all unique run Ids with data present in AWS
    return {
      getRunFiles,
      availableFiles,
      loadFile,
      loadDisplayImage,
      selectedImageURL,
      selectedImageURL_array,
      availableRuns,
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
    };
  },
  // watch: {
  //   getFiles() {
  //     console.log('watched');
  //     this.getRunFiles();
  //   },
  // },
});
</script>
