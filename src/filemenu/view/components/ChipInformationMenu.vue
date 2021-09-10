<template>
  <v-dialog
    v-model="chipInformationMenu"
  >
    <v-card>
      <v-card-title>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          :label="`Search`"
          single-line
          hide-details
        />
      </v-card-title>
      <v-data-table
        v-model="selected"
        height="60vh"
        dense
        single-select
        :items-per-page="15"
        :headers="headers"
        :items="items"
        :loading="loading"
        :search="search"
        @click:row="selectTest"
      >
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            small
            @click="selectTest(item)"
          >
            <v-icon small >mdi-table</v-icon>
          </v-btn>
          <v-btn
            icon
            small
            @click="selectTest(item)"
          >
            <v-icon small >mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            small
            @click="selectTest(item)"
          >
            <v-icon small >mdi-content-copy</v-icon>
          </v-btn>
          <v-btn
            icon
            small
            @click="selectTest(item)"
          >
            <v-icon small >mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
      <v-card-actions>
        <v-row no-gutters>
          <v-col
            cols="10"
            class="mx-1">
            <v-btn
              color="success"
              @click="selectTest"
            >
              <v-icon medium>mdi-plus</v-icon>
            </v-btn>
          </v-col>
          <v-spacer />
          <v-col
            cols="0"
            class="mx-1">
            <v-btn
              color="secondary"
              @click="closeDialog">
              Close
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from '@vue/composition-api';
import store from '@/store';
import type {
  DatasetRequest,
  DatasetListingChip,
} from '@/types';
import { chipInformationMenu } from '../state';

const headers = [
  { text: 'Chip ID', value: 'chip_id' },
  { text: 'Wafer ID', value: 'waferid' },
  { text: 'Diameter', value: 'diameter' },
  { text: 'Acquired Date', value: 'date_acquired' },
  { text: 'Actions', value: 'actions' },
];

export default defineComponent({
  name: 'ChipInformationMenu',
  setup() {
    const client = computed(() => store.state.client);
    const loading = ref(false);
    const search = ref<string | null>(null);
    const selected = ref<any>();
    const items = ref<any[]>([]);

    async function fetchData() {
      if (!client.value) {
        return;
      }
      search.value = null;
      loading.value = true;
      const payload = { params: { filter: null, options: null } };
      const dataset = await client.value.getChips(payload);
      loading.value = false;
      items.value = dataset;
    }
    async function selectTest(item: any) {
      console.log(item._id, item.date_acquired);
    }
    async function closeDialog() {
      chipInformationMenu.value = false;
    }
    watch(chipInformationMenu, async (val, new_val) => {
      // console.log(val, new_val);
      // if (!val) { return; }
    });
    onMounted(fetchData);
    return {
      headers,
      search,
      selected,
      loading,
      items,
      selectTest,
      chipInformationMenu,
      closeDialog,
    };
  },
});

</script>
