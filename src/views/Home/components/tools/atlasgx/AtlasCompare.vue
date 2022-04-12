<template>
    <v-container fluid>
      <v-row no-gutters>
        <v-col cols="12" sm="12">
          <v-row>
            <template v-for="v in dualGVIndex">
              <v-col vols="12" sm="4" :key="v">
                <v-card>
                 <atx-dual-gene-viewer :query="query"/>
                </v-card>
              </v-col>
            </template>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
</template>

<script lang='ts'>
import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUnmounted } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { get_uuid, generateRouteByQuery, splitarray, deepCopy } from '@/utils';
import AtxDualGeneViewer from './modules/AtxDualGeneViewer.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'AtlasCompare',
  components: { AtxDualGeneViewer },
  props: ['query'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const dualGVIndex = ref<string[]>([get_uuid()]);
    const submenu = [
      {
        text: 'Add Viewer',
        icon: 'mdi-plus',
        tooltip: 'Add Viewer',
        color: 'primary',
        click: () => {
          dualGVIndex.value.push(get_uuid());
        },
      },
    ];
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(submenu);
    });
    onUnmounted(() => {
      store.commit.setSubmenu(null);
    });
    return { dualGVIndex };
  },
});
</script>

<style>
</style>
