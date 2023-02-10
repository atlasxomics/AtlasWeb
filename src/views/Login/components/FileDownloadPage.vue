<template>
    <v-card
    >
        <v-card-title class="justify-center"> {{ run_id }} Available Files </v-card-title>
        <div v-for="(file, index) in computed_files" :key="file.file_id">
          <v-row>
            <v-col
            cols="3"
            >
            <v-card-text
            label="File Type"
            >
              File Type:  {{file.file_type_name}}
            </v-card-text>
            </v-col>
            <v-col
            cols="3"
            >
            Filename: {{file.filename_short}}
            </v-col>
            <v-col
            cols="3"
            >
            Description: {{file.file_description}}
            </v-col>
            <v-col
            cols="3"
            >
            <div
            v-if="file.presigned_url"
            >
            <v-text-field
            :value="file.presigned_url"
            readonly
            style="padding-top: 0px"
            append-icon="mdi-content-copy"
            @click:append="copy_url_keyboard(file.presigned_url)"
            >
            </v-text-field>
            </div>
            <v-btn
            v-else
            outlined
            @click="generate_presigned_url(index)"
            >
              Generate URL
            </v-btn>
            </v-col>
          </v-row>
        </div>
    </v-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from '@vue/composition-api';
import { login, isClient, Client } from '@/api';
import store from '@/store';

export default defineComponent({
  name: 'DownloadFileScreen',
  props: { run_id: { type: String || null, required: true }, files: { type: Array, required: true } },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const file_list = ref<any[]>([]);
    const loading = ref<boolean>(false);
    const computed_files = computed(() => props.files);
    async function generate_presigned_url(index: number) {
      if (!client.value) return;
      const file: any = props.files[index];
      const { file_path, bucket_name } = file;
      const pl = { path: file_path, bucket: bucket_name };
      console.log(pl);
      const presigned_url = await client.value.generate_presigned_url(pl);
      console.log(presigned_url);
      ctx.emit('presigned-generated', index, presigned_url);
    }
    function copy_url_keyboard(url: string) {
      navigator.clipboard.writeText(url).then();
    }
    return {
      file_list,
      loading,
      computed_files,
      generate_presigned_url,
      copy_url_keyboard,
    };
  },
});

</script>
