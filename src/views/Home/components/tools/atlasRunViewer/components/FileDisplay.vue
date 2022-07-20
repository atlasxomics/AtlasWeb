<template>
    <v-col>
        <v-img
        v-if="isImage"
        :src="imageURL"
        >
        </v-img>
    </v-col>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, watch } from '@vue/composition-api';

export default defineComponent({
  name: 'FileDisplay',
  props: {
    fileName: { type: String, required: true },
    imageURL: { type: String, required: true },
  },
  setup(props, ctxe) {
    const isImage = ref<boolean>(false);
    const currentDisplayedImage = ref<any>();
    return {
      isImage,
      currentDisplayedImage,
    };
  },
  watch: {
    fileName(newValue, oldValue) {
      const path_parts = newValue.split('.');
      const extension = path_parts[path_parts.length - 1];
      // check if the file we have been passed is an iamge
      if (extension === 'tif' || extension === 'jpg') {
        console.log('image');
        this.isImage = true;
      } else if (extension === 'json') {
        console.log('json');
      } else if (extension === 'csv') {
        console.log('csv');
      }
      console.log('the selcted file has changed');
    },
  },
});
</script>
