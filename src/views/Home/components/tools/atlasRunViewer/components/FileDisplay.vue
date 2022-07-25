<template>
  <v-col>
    <!-- <div
    ref="imgLens"
    class="img-lens"
    >
    </div> -->
    <v-img
    v-if="isImage"
    :src="localImageURL"
    ref="image"
    :height="displayedHeight"
    :width="displayedWidth"
    >
    </v-img>
    <!-- <div ref="zoomBox" class="zoomed-in-image">
    </div> -->
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
    // const cX = ref<number>(0);
    // const cY = ref<number>(0);
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
    // function imageZoom() {
    //   const elements = this.$refs;
    //   console.log(elements);
    //   const img = elements.image;
    //   const zoomedBox = elements.zoomBox;
    //   const lens = elements.imgLens;
    //   cX.value = zoomedBox.offsetWidth / lens.offsetWidth;
    //   cY.value = zoomedBox.offsetHeight / lens.offsetHeight;
    //   console.log(cX);
    //   console.log(cY);
    //   zoomedBox.style.backgroundImage = 'url('.concat(currentDisplayedImage.value).concat(')');
    //   zoomedBox.style.backgroundSize = (1000 * cX.value).toString().concat('px').concat((1000 * cY.value).toString()).concat('px');
    //   lens.addEventListener('mousemove', this.moveLens);
    //   img.addEventListener('mousemove', this.moveLens);
    // }
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
      // imageZoom,
      // cX,
      // cY,
      // moveLens,
      // getCursorPos,
    };
  },
  watch: {
    imageURL(newValue) {
      // this.imageZoom();
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
    imageSize(newValue) {
      this.modifyImageSize(newValue);
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
