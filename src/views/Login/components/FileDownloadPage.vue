<template>
    <v-container>
        <v-row v-for="(file, index) in file_list" :key="file.file_id">
            <h1> {{ index }} </h1>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from '@vue/composition-api';
import { login, isClient, Client } from '@/api';

export default defineComponent({
  name: 'DownloadFileScreen',
  props: { run_id: { type: String, required: true } },
  setup(props, ctx) {
    const file_list = ref<any[]>([]);
    const loading = ref<boolean>(false);
    onMounted(() => {
      console.log(props.run_id);
    });
    return {
      file_list,
      loading,
    };
  },
});

</script>
