<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-form
          v-model="validForm">
          <v-text-field
            label="Username"
            />
          <v-text-field
            label="Groups"
            />
          <v-btn
            color="primary"
            @click="onSave"
          >Save</v-btn>
        </v-form>
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

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'AddRemoveGroup',
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const userInfo = ref<any | null>();
    const validForm = ref(false);
    const overview = ref<any>({ editable: false });
    async function getUserInfo() {
      if (!client.value) return;
      userInfo.value = await client.value.user;
    }
    async function onGroupCreated(ev: any) {
      if (!client.value) return;
      if (validForm.value) {
        try {
          // const resp = await client.value.resetUserPassword(payload);
          snackbar.dispatch({ text: 'Group created successfully', options: { color: 'success', right: true } });
        } catch (e) {
          snackbar.dispatch({ text: `Group creation failed ${e}`, options: { color: 'error', right: true } });
        }
      } else {
        snackbar.dispatch({ text: 'Form is not valid', options: { color: 'error', right: true } });
      }
    }
    async function onSave(ev: any) {
      console.log('Save button clicked');
    }
    onMounted(async () => {
      await clientReady;
      await getUserInfo();
    });
    return {
      userInfo,
      overview,
      validForm,
      onGroupCreated,
      onSave,
    };
  },
});

</script>

<style>

</style>
