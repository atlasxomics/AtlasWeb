<template>
  <v-col>
    <v-img
    v-if="isImage"
    :src="localImageURL"
    ref="image"
    :height="displayedHeight"
    :width="displayedWidth"
    >
    </v-img>
    <v-slider
    :min="40"
    :max="100"
    v-if="isImage"
    v-model="imageSize"
    >
    </v-slider>
    <pre
    v-if="jsonDisplay"
    >
      {{ dispText }}
    </pre>
  </v-col>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, watch } from '@vue/composition-api';

export default defineComponent({
  name: 'FileDisplay',
  props: {
    fileName: { type: String, required: true },
    imageURL: { type: Array, required: true },
    jsonContents: { type: Object, required: true },
    jsonStringContents: { type: Array, required: true },
    csvStringContents: { type: Array, required: true },
    clearFileBoolean: { type: Boolean, required: false },
  },
  setup(props, ctxe) {
    const isImage = ref<boolean>(false);
    const currentDisplayedImage = ref<any>();
    const jsonDisplay = ref<boolean>(false);
    const displayedImage = ref<any>();
    const localImageURL = ref<string>('');
    const dispText = ref<string>('');
    const imageSize = ref<number>(80);
    const naturalHeight = ref<number>(500);
    const naturalWidth = ref<number>(500);
    const displayedHeight = ref<number>(0);
    const displayedWidth = ref<number>(0);
    const konvaConfiguration = ref<any>({
      width: 400,
      height: 1000,
      x: 0,
      y: 100,
    });
    const textConfig = ref<any>({ text: '' });
    function modifyImageSize(factor: number) {
      console.log('changing image size');
      this.displayedHeight = (factor * this.naturalHeight) / 100;
      this.displayedWidth = (factor * this.naturalWidth) / 100;
    }
    function fileDisplayed() {
      this.$emit('file-displayed');
    }
    // convert the image url passed to the component into konva compatible format
    // function getCursorPos(ev: any) {
    //   const x = 0;
    //   const y = 0;
    // }
    // function moveLens(ev: any) {
    //   const pos = getCursorPos(ev);
    // }
    function getImageDimensions(url: string) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({
          width: img.width,
          height: img.height,
        });
        img.onerror = (error) => reject(error);
        img.src = url;
      });
    }
    function clearScreen() {
      jsonDisplay.value = false;
      isImage.value = false;
    }
    return {
      isImage,
      getImageDimensions,
      currentDisplayedImage,
      jsonDisplay,
      displayedImage,
      localImageURL,
      konvaConfiguration,
      textConfig,
      dispText,
      imageSize,
      naturalHeight,
      naturalWidth,
      displayedHeight,
      displayedWidth,
      modifyImageSize,
      fileDisplayed,
      clearScreen,
    };
  },
  watch: {
    imageURL(newValue) {
      const img = new Image();
      img.src = newValue;
      img.onload = (() => {
        this.naturalHeight = 1000;
        this.naturalWidth = 1000;
        const [temp] = newValue;
        this.localImageURL = temp;
        this.modifyImageSize(this.imageSize);
        this.isImage = true;
        this.jsonDisplay = false;
        this.fileDisplayed();
      });
    },
    jsonStringContents(newValue) {
      console.log('json changed');
      const [temp] = newValue;
      this.dispText = temp;
      this.textConfig = {
        text: temp,
        fontSize: 24,
      };
      this.isImage = false;
      this.jsonDisplay = true;
      this.fileDisplayed();
    },
    csvStringContents(newValue) {
      console.log('csv changed');
      const [temp] = newValue;
      this.dispText = temp;
      this.textConfig = {
        fontSize: 12,
        text: temp,
      };
      this.isImage = false;
      this.jsonDisplay = true;
      this.fileDisplayed();
    },
    imageSize(newValue) {
      this.modifyImageSize(newValue);
    },
    clearFileBoolean(newValue) {
      console.log(newValue);
      this.clearScreen();
    },
  },
});
</script>

<style>
.outer-container {
  position: relative;
}

.img-lens {
  position: absolute;
  border: 1px solid #d4d4d4;
  width: 40px;
  height: 40px;
}

.zoomed-in-image {
  border: 1px solid #d4d4d4;
  width: 400px;
  height: 400px;
}
</style>
