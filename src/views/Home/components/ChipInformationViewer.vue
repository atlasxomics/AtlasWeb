<template>
    <v-container fluid>
      <v-row no-futters>
        <v-col cols="12" sm="5">
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
            <v-card-actions>
              <v-row no-gutters>
                <v-col
                  cols="10"
                  class="mx-1">
                  <v-btn
                    color="success"
                    @click="addNew"
                  >
                    <v-icon medium>mdi-plus</v-icon>
                  </v-btn>
                </v-col>
                <v-spacer />
              </v-row>
            </v-card-actions>
            <v-data-table
              v-model="selected"
              height="65vh"
              dense
              single-select
              :items-per-page="15"
              :headers="headers"
              :items="items"
              :loading="loading"
              :search="search"
              @click:row="selectAction"
            >
            </v-data-table>
          </v-card>
        </v-col>
        <v-col>
          <v-card height="87vh" class="overflow" v-if="detail">
            <v-card-title>
              Chip Details - {{ detail.chip_id }}
            </v-card-title>
            <v-card-actions>
              <v-row no-gutters>
                <v-col>
                  <v-btn
                    color="primary"
                    :disabled="!hasChanged || !validate(detail)"
                    @click="saveAction"
                  >
                    Save
                  </v-btn>
                </v-col>
                <v-col>
                  <v-btn
                    color="primary"
                    :disabled="!readOnly"
                    @click="duplicateAction"
                  >
                    Duplicate
                  </v-btn>
                </v-col>
                <v-col>
                  <v-btn
                    color="secondary"
                    @click="readOnly = !readOnly"
                  >
                    {{ readOnly ? 'Edit' : 'Freeze'}}
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-actions>
            <v-card-text>
              <v-simple-table
                dense
              >
                <tbody>
                  <tr v-for="(val, key) in detail" v-bind:key="key">
                    <td width="20%">{{key}}</td>
                    <td>
                      <v-text-field
                        single-line
                        :readonly="readOnly"
                        :filled="!readOnly"
                        hide-details
                        dense
                        flat
                        :clearable="!readOnly"
                        clear-icon="mdi-close-circle"
                        :value="val"
                        @change="inputChanged($event,key)"
                      />
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from '@vue/composition-api';
import _ from 'lodash';
import store from '@/store';
import type {
  DatasetRequest,
  DatasetListingChip,
} from '@/types';

const headers = [
  { text: 'Chip ID', value: 'chip_id' },
  { text: 'Wafer ID', value: 'waferid' },
];

export default defineComponent({
  name: 'ChipInformationViewer',
  setup() {
    const client = computed(() => store.state.client);
    const loading = ref(false);
    const search = ref<string | null>(null);
    const selected = ref<any>();
    const items = ref<any[]>([]);
    const detail = ref<any>();
    const readOnly = ref<boolean>(true);
    const hasChanged = ref<boolean>(false);
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
    async function selectAction(item: any) {
      if (!client.value) return;
      loading.value = true;
      // console.log(item._id, item.date_acquired);
      const fltr = { _id: item._id };
      const payload = { params: { filter: JSON.stringify(fltr), options: null } };
      [detail.value] = await client.value.getChips(payload);
      loading.value = false;
      hasChanged.value = false;
      readOnly.value = true;
    }
    async function addNew() {
      const newDoc: any = {};
      if (!detail.value) [detail.value] = items.value;
      _.forIn(detail.value, (v, k) => {
        newDoc[k] = null;
      });
      detail.value = newDoc;
      readOnly.value = false;
      hasChanged.value = false;
    }
    async function duplicateAction(ev: any) {
      detail.value.chip_id = null;
      detail.value._id = null;
      hasChanged.value = true;
      readOnly.value = false;
    }
    async function saveAction(ev: any) {
      console.log(detail.value);
      hasChanged.value = false;
    }
    async function inputChanged(val: any, key: any) {
      detail.value[key] = Number(val) || val;
      hasChanged.value = true;
    }
    function isEmpty(str: string) {
      return (!str || str.length === 0);
    }
    function validate(data: any) {
      return !isEmpty(data._id) && !isEmpty(data.chip_id);
    }
    onMounted(fetchData);
    return {
      headers,
      search,
      selected,
      loading,
      items,
      detail,
      hasChanged,
      readOnly,
      selectAction,
      inputChanged,
      saveAction,
      duplicateAction,
      addNew,
      validate,
    };
  },
});

</script>
<style>
.overflow {
  overflow-y: auto;
}
</style>
