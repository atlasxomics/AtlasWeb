<template>
      <v-row>
        <v-col cols="12" sm="4">
            <AvailableFileList
            :fileList="availableFiles"
            :runID="selectedRunID"
            :flipLoading="flipBool"
            @file-selected=handleFileSelection>
            </AvailableFileList>
        </v-col>
        <v-col cols="12" sm="8" align-self="center">
            <FileDisplay
            :fileName="file_selected"
            :imageURL="selectedImageURL_array"
            :jsonStringContents="jsonString_array"
            :jsonContents="jsonPackage"
            :csvStringContents="csvPretty_array"
            @file-displayed="stopLoading"
            > </FileDisplay>
        </v-col>
      </v-row>
</template>

<script lang='ts'>
import { defineComponent, computed, ref, onMounted } from '@vue/composition-api';
import AvailableFileList from '@/views/Home/components/tools/atlasRunViewer/components/AvailableFileList.vue';
import FileDisplay from '@/views/Home/components/tools/atlasRunViewer/components/FileDisplay.vue';
import store from '@/store';
import { flip } from 'lodash';

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
    bucket_name: { required: true, type: String },
    root: { required: true, type: String },
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
    const flipBool = ref<boolean>(false);
    // method to obtain all the files associated with a particular run from aws
    async function getRunFiles() {
      if (!client.value) {
        console.log('no client');
        return;
      }
      const folder_path = props.root.concat('/').concat(props.selectedRunID).concat('/');
      const file_payload = { params: { bucket_name: props.bucket_name, path: folder_path } };
      const run_files = await client.value.getFileList(file_payload);
      for (let i = 0; i < run_files.length; i += 1) {
        if (run_files[i] !== folder_path) {
          const temp_obj = { id: i, file: run_files[i] };
          availableFiles.value.push(temp_obj);
        }
      }
      // availableFiles.value = run_files;
      if (availableFiles.value.length === 0) {
        availableFiles.value.push({ id: 0, file: 'Run '.concat(props.selectedRunID).concat(' has no associated files.') });
      }
    }
    async function loadDisplayImage(filename: string) {
      try {
        image_selected.value = true;
        const pl = { params: { bucket_name: props.bucket_name, filename, use_cache: 'false' } };
        const image = await client.value?.getImageAsJPG(pl);
        if (image) {
          selectedImageURL.value = URL.createObjectURL(image);
          selectedImageURL_array.value = [selectedImageURL.value];
        }
      } catch (error) {
        console.log(error);
      }
    }
    async function loadCSVFile(input_filename: string) {
      const payload = { params: { bucket_name: props.bucket_name, filename: input_filename } };
      const resp = await client.value?.getCsvFile(payload);
      csvPretty.value = JSON.stringify(resp, null, 4);
      csvPretty_array.value = [csvPretty.value];
    }
    // method called to load a json file into compotnent
    async function loadJSONFile(input_filename: string) {
      const payload = { params: { bucket_name: props.bucket_name, filename: input_filename } };
      const resp = await client.value?.getJsonFile(payload);
      jsonPackage.value = resp;
      jsonString.value = JSON.stringify(resp, null, 8);
      jsonString_array.value = [jsonString.value];
    }
    // method to handle a user request to get a file
    function loadFile(filename: string) {
      const file_array = filename.split('.');
      const suffix = file_array[file_array.length - 1];
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
    function stopLoading() {
      flipBool.value = !flipBool.value;
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
      stopLoading,
      flipBool,
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
