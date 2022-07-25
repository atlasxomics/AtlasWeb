<template>
    <v-stage
      :config="konvaConfiguration"
      >
    <v-layer
    v-if="isImage"
    :src="localImageURL"
    ref="image"
    :height="displayedHeight"
    :width="displayedWidth"
    >
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
import Konva from 'konva';

export default defineComponent({
  name: 'FileDisplay',
  props: {
    fileName: { type: String, required: true },
    imageURL: { type: Array, required: true },
    jsonContents: { type: Object, required: true },
    jsonStringContents: { type: Array, required: true },
    csvStringContents: { type: Array, required: true },
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
    // convert the image url passed to the component into konva compatible format
    function configureImage() {
      console.log(localImageURL.value);
    }
    return {
      isImage,
      getImageDimensions,
      currentDisplayedImage,
      jsonDisplay,
      displayedImage,
      configureImage,
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
    };
  },
  watch: {
    imageURL(newValue) {
      this.imageZoom();
      const img = new Image();
      img.src = newValue;
      // const val = await this.getImageDimensions(newValue);
      this.naturalHeight = 1000;
      this.naturalWidth = 1000;
      const [temp] = newValue;
      this.localImageURL = temp;
      this.modifyImageSize(80);
      this.isImage = true;
      this.jsonDisplay = false;
    },
    jsonStringContents(newValue) {
      console.log('json changed');
      const [temp] = newValue;
      this.dispText = temp;
      console.log(temp);
      this.textConfig = {
        text: temp,
        fontSize: 24,
      };
      this.isImage = false;
      this.jsonDisplay = true;
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
    },
  },
});
</script>
