<template>
    <v-card
    >
        <v-card-title class="justify-center"> {{ run_id }} Available Files </v-card-title>
        <v-row
        class="ma-0"
        >
          <v-col
          cols="3"
          class="d-flex justify-center"
          >
          <h3>File Type </h3>
          </v-col>
          <v-col
          cols="3"
          class="d-flex justify-center"
          >
         <h3> Filename </h3>
          </v-col>
          <v-col
          cols="3"
          class="d-flex justify-center"
          >
          <h3> Description </h3>
          </v-col>
        </v-row>
        <v-row v-for="(file, index) in computed_files" :key="file.file_id" class="ma-0">
            <v-col
            cols="3"
            class="d-flex justify-center"
            >
            {{file.file_type_name}}
            </v-col>
            <v-col
            cols="3"
            class="d-flex justify-center"
            >
            {{file.filename_short}}
            </v-col>
            <v-col
            cols="3"
            class="d-flex justify-center"
            >
            {{file.file_description}}
            </v-col>
            <v-col
            cols="3"
            class="d-flex justify-center"
            >
            <div
            style="margin-right: 30px;"
            >
              <v-progress-circular
              v-if="false"
              color="primary"
              indeterminate
              >
              </v-progress-circular>
            <v-icon
            v-else
            @click="download_local(index)"
            >
              mdi-download
            </v-icon>
            </div>
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
    </v-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, watch } from '@vue/composition-api';
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
    // const loading_download = ref<boolean>(false);
    const loading_downloads = ref<Array<boolean>>([]);
    async function get_presigned(index: number): Promise<any> {
      if (!client.value) return {};
      const file: any = computed_files.value[index];
      const { file_path, bucket_name } = file;
      const pl = { path: file_path, bucket: bucket_name };
      const presigned_url: any = await client.value.generate_presigned_url(pl);
      return presigned_url;
    }
    async function download_local(index: number) {
      const presigned_url = await get_presigned(index);
      const file: any = computed_files.value[index];
      const link = document.createElement('a');
      link.href = presigned_url;
      link.download = file.filename_short;
      document.body.appendChild(link);
      link.click();
    }
    async function generate_presigned_url(index: number) {
      const presigned_url = await get_presigned(index);
      ctx.emit('presigned-generated', index, presigned_url);
    }
    function copy_url_keyboard(url: string) {
      navigator.clipboard.writeText(url).then();
    }
    watch(computed_files, (val: any) => {
      loading_downloads.value = Array(computed_files.value.length).fill(false);
    });
    return {
      file_list,
      loading,
      computed_files,
      loading_downloads,
      download_local,
      generate_presigned_url,
      copy_url_keyboard,
    };
  },
});

</script>
