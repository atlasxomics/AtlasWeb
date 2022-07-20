<template>
    <v-container>
        <v-row>
          <v-col>
            <h1> Run IDs </h1>
            <v-spacer></v-spacer>
            <button @click="getRunFiles">D223</button>
          </v-col>
          <v-col>
            <h1>
              Options
            </h1>
          </v-col>
        </v-row>
    </v-container>
</template>

<script lang='ts'>
import { defineComponent, computed } from '@vue/composition-api';
import store from '../../../../../store';

const client_Ready = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
});
export default defineComponent({
  name: 'AtlasRunViewer',
  props: ['query'],
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    async function getRunFiles() {
      if (!client.value) {
        return;
      }
      const runID = 'D223';
      const folder_path = 'data/'.concat(runID);
      const file_payload = { params: { path: folder_path } };
      console.log(file_payload);
      const files = await client.value.getFileList(file_payload);
      console.log(files);
      console.log('Getting files for '.concat(runID));
    }
    return { getRunFiles };
  },
});
</script>
