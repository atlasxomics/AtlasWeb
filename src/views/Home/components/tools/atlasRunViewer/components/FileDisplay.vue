<template>
    <v-stage
      :config="konvaConfiguration"
      >
    <v-layer
    v-if="isImage"
    >
        <v-image
        ref="image"
        :config="displayedImage"
        >
        </v-image>
    </v-layer>
    <v-layer
    v-if="jsonDisplay"
    :config="textLayerConfig"
    >
    <v-text
    :config="textConfig"
    >
    </v-text>
    </v-layer>
 </v-stage>
    <!-- <pre id='formattedJSON'>
        {{ jsonStringContents }}
    </pre> -->
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, watch } from '@vue/composition-api';
import Konva from 'konva';

export default defineComponent({
  name: 'FileDisplay',
  props: {
    fileName: { type: String, required: true },
    imageURL: { type: String, required: true },
    // displayedImage: { type: HTMLImageElement, required: true },
    jsonContents: { type: Object, required: true },
    jsonStringContents: { type: String, required: true },
    csvStringContents: { type: String, required: true },
  },
  //   filters: {
  //     // pretty(jsonStr: string) {
  //     // //   return JSON.stringify(this.jsonContents);
  //     // },
  //   },
  setup(props, ctxe) {
    const isImage = ref<boolean>(false);
    const currentDisplayedImage = ref<any>();
    // const jsonStringContents = ref<string>();
    const jsonDisplay = ref<boolean>(false);
    const displayedImage = ref<any>();
    const localImageURL = ref<string>('');
    const konvaConfiguration = ref<any>({
      width: 400,
      height: 1000,
      x: 0,
      y: 100,
    });
    const textConfig = ref<any>({ text: '' });
    const textLayerConfig = ref<any>({
      width: 1000,
      height: 1000,
    });
    // convert the image url passed to the component into konva compatible format
    function configureImage() {
      console.log(localImageURL.value);
      const imgObj = new window.Image();
      imgObj.src = localImageURL.value;
      if (imgObj) {
        imgObj.onload = (ev: any) => {
          displayedImage.value = {
            x: 0,
            y: 0,
            draggable: false,
            image: imgObj,
            src: imgObj.src,
            width: 300,
            height: 300,
          };
        };
      }
    }
    return {
      isImage,
      currentDisplayedImage,
      jsonDisplay,
      displayedImage,
      configureImage,
      localImageURL,
      konvaConfiguration,
      textConfig,
      textLayerConfig,
    };
  },
  watch: {
    fileName(newValue, oldValue) {
      const path_parts = newValue.split('.');
      const extension = path_parts[path_parts.length - 1];
      // check if the file we have been passed is an iamge
      if (extension === 'tif' || extension === 'png') {
        console.log('image');
        this.isImage = true;
        this.jsonDisplay = false;
        // this.configureImage();
      } else {
        this.isImage = false;
      } if (extension === 'json') {
        this.jsonDisplay = true;
      } else if (extension === 'csv') {
        this.jsonDisplay = true;
        console.log('csv');
      }
      console.log('the selcted file has changed');
    },
    imageURL(newValue) {
      console.log(newValue);
      this.localImageURL = newValue;
      this.configureImage();
    },
    jsonStringContents(newValue) {
      console.log(newValue);
      this.textConfig = {
        text: newValue,
        wrap: 'word',
      };
    },
    csvStringContents(newValue) {
      this.textConfig = { text: newValue };
    },
  },
});
</script>
