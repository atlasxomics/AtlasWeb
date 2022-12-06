<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="6">
        <v-card flat>
          <v-card-title>Select Path</v-card-title>
          <v-text-field
          label="Path"
          width="70%"
          hint="ex: <bucket_name>/folder with <h5ad files>/"
          />

        </v-card>
      </v-col>
      <v-col cols="12" sm="6">
        <v-card flat>
          <v-card-title>Search Bucket</v-card-title>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Client } from '@/api';
import { snackbar } from '@/components/GlobalSnackbar';
import store from '@/store';
import { defineComponent, onMounted, ref, computed, watch } from '@vue/composition-api';

export default defineComponent({
  name: 'CreateWebObject',
  setup(props, ctx) {
    const pathName = ref<string>('');

    // onMounted(() => {});
    return { pathName };
  },
});
</script>
