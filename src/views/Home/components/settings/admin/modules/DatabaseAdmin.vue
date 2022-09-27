<template>
    <v-row>
        <v-col>
            <v-btn
            color="primary"
            @click="repopulate_db"
            outlined
            >
                Repopulate Database
            </v-btn>
        </v-col>
    </v-row>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { generateRouteByQuery } from '@/utils';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'DatabaseAdmin',
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const button_loading = ref<boolean>(false);
    async function repopulate_db() {
      console.log('repopulating DB');
      const value = await client.value?.repopulateDB();
      button_loading.value = true;
    }
    onMounted(async () => {
      await clientReady;
    });
    return {
      button_loading,
      repopulate_db,
    };
  },
});

</script>

<style>

</style>
