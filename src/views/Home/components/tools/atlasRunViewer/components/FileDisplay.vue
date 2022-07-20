<template>
    <v-col>
        <v-img
        v-if="isImage"
        :src="imageURL"
        width="400"
        height="400"
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
    jsonContents: { type: Object, required: true },
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
      if (extension === 'tif' || extension === 'png') {
        console.log('image');
        this.isImage = true;
      } else {
        this.isImage = false;
      } if (extension === 'json') {
        console.log('json');
        console.log(this.jsonContents);
      } else if (extension === 'csv') {
        console.log('csv');
      }
      console.log('the selcted file has changed');
    },
  },
});
</script>
