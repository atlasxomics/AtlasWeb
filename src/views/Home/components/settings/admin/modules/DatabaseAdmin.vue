<template>
  <v-container>
    <v-row>
        <v-col>
            <v-btn
            color="primary"
            :loading="button_loading"
            @click="repopulate_db"
            outlined
            >
                Repopulate Database
            </v-btn>
        </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { generateRouteByQuery } from '@/utils';
import { SnackbarParams } from '@/components/GlobalSnackbar/state';

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
      button_loading.value = true;
      console.log('repopulating DB');
      const value = await client.value?.repopulateDB();
      if (value === 'Success') {
        console.log('Success');
        snackbar.dispatch({ text: 'Database Successfully Updated', options: { right: true, color: 'success', timeout: 10000 } });
      } else {
        snackbar.dispatch({ text: 'Database Updating Failed', options: { right: true, color: 'error', timeout: 10000 } });
      }
      console.log(value);
      button_loading.value = false;
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

.repopulate_btn {
  left: 5px;
}

</style>
