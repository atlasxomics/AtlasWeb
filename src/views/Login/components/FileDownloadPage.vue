<template>
    <v-card flat>
        <v-card-title class="justify-center"> {{ run_id }} Available Files </v-card-title>
        <div v-for="(file, index) in files" :key="file.file_id">
            <h1> {{ index }} </h1>
        </div>
    </v-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from '@vue/composition-api';
import { login, isClient, Client } from '@/api';

export default defineComponent({
  name: 'DownloadFileScreen',
  props: { run_id: { type: String || null, required: true }, files: { type: Array, required: true } },
  setup(props, ctx) {
    const file_list = ref<any[]>([]);
    const loading = ref<boolean>(false);
    return {
      file_list,
      loading,
    };
  },
});

</script>
