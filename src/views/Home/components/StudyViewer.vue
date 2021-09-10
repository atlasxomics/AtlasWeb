<template>
    <v-container fluid>
      <v-row>
        <v-col md="3" sm="4">
          <v-card>
            <v-card-title>
              DBiT Study QCed
              <v-spacer/>
              <span v-if="loading">
                <v-progress-circular
                  :size="20"
                  indeterminate
                  color="primary"
                ></v-progress-circular>
              </span>
              <v-spacer/>
              <v-text-field
                v-model="search"
                prepens-inner-icon="mdi-magnify"
                :label="`Search`"
                single-line
                hide-details
              />
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              List of studies
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="9" sm="8">
          <v-card>
            <v-card-title>
              Details
              <v-spacer/>

            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              Something
            </v-card-text>
          </v-card>
          <v-row>
            <v-col md="6">
              <v-card>
                Something
              </v-card>
            </v-col>
            <v-col md="6">
              <v-card>
                Something
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
</template>

<script lang="ts">
import _ from 'lodash';
import { defineComponent, ref, computed, onMounted, watch } from '@vue/composition-api';
import { snackbar } from '@/components/GlobalSnackbar';
import store from '@/store';

const headers = [
  { text: 'Field', value: 'name' },
  { text: 'Value', value: 'value' },
];

export default defineComponent({
  name: 'StudyViewer',
  setup() {
    const client = computed(() => store.state.client);
    const search = ref<string>('');
    const items = ref<any[]>([]);
    const loading = ref<boolean>(false);

    return {
      search,
      items,
      loading,
    };
  },

});

</script>
<style>
</style>
