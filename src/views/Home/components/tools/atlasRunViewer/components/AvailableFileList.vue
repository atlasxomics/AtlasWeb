<template>
    <v-col>
        <p> {{ runID }} </p>
        <p v-for="file in fileList" :key="file">
            <v-btn @click="$emit('file-selected', file)">
                {{ file }}
            </v-btn>
        </p>
    </v-col>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'AvailableFileList',
  props: {
    fileList: { required: true, type: Array },
    runID: String,
  },
});
</script>
