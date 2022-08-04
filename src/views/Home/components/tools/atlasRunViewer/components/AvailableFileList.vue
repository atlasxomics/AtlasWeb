<template>
    <v-col>
        <h1> {{ runID }} </h1>
        <p v-for="file in fileList" :key="file.id">
            <v-btn
            ref="key"
            class="ma-2"
            :loading="loading && indexClicked === file.id"
            @click="buttonLoading(file.id); $emit('file-selected', file.file)"
            >
                {{ file.file }}
            </v-btn>
        </p>
    </v-col>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import { loadavg } from 'os';

export default defineComponent({
  name: 'AvailableFileList',
  props: {
    fileList: { required: true, type: Array },
    runID: { required: true, type: String },
    flipLoading: { required: true, type: Boolean },
  },
  setup(props, ctxe) {
    const loading = ref<boolean>(false);
    const indexClicked = ref<number>(-1);
    function buttonLoading(id: number) {
      indexClicked.value = id;
      loading.value = true;
    }
    return {
      loading,
      buttonLoading,
      indexClicked,
    };
  },
  watch: {
    flipLoading(newValue) {
      this.loading = false;
    },
  },
});
</script>
