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
                  cols="0"
                  class="mx-1">
                  <v-btn
                    color="success"
                    @click="addNew"
                  >
                    <v-icon medium>mdi-plus</v-icon>
                  </v-btn>
                </v-col>
                <v-spacer />
                <v-col>
                  <v-btn
                    color="primary"
                    @click="fetchData"
                  >
                    Refresh
                  </v-btn>
                </v-col>
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
              DBiT Details - {{ detail[0].value }}
            </v-card-title>
            <v-card-actions>
              <v-row no-gutters>
                <v-col>
                  <v-btn
                    color="primary"
                    width="15vh"
                    :disabled="!hasChanged || !validate(detail)"
                    @click="saveAction"
                  >
                    Save
                  </v-btn>
                </v-col>
                <v-col>
                  <v-btn
                    color="error"
                    width="15vh"
                    @click="deleteAction"
                  >
                    Delete
                  </v-btn>
                </v-col>
                <v-col>
                  <v-btn
                    color="primary"
                    width="15vh"
                    :disabled="!readOnly"
                    @click="duplicateAction"
                  >
                    Duplicate
                  </v-btn>
                </v-col>
                <v-col>
                  <v-btn
                    color="secondary"
                    width="15vh"
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
                  <template v-for="( val, index ) in detail">
                    <!-- <tr v-for="(val, key) in detail" v-bind:key="key"> -->
                    <tr v-if="val.key !== '_id'" v-bind:key="val.key">
                      <td width="20%">{{val.key}}</td>
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
                          :value="val.value"
                          @change="inputChanged($event,index)"
                        />
                      </td>
                    </tr>
                  </template>
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
import { snackbar } from '@/components/GlobalSnackbar';
import store from '@/store';
import type {
  DatasetRequest,
  DatasetListingDbit,
} from '@/types';
import { objectToArray, arrayToObject } from '@/utils';

const headers = [
  { text: 'RUN ID', value: 'run_id' },
  { text: 'Chip A', value: 'chip_a_id' },
  { text: 'Chip B', value: 'chip_b_id' },
];

export default defineComponent({
  name: 'DbitInformationViewer',
  setup() {
    const client = computed(() => store.state.client);
    const loading = ref(false);
    const search = ref<string | null>(null);
    const selected = ref<any>();
    const items = ref<any[]>([]);
    const detail = ref<any>();
    const readOnly = ref<boolean>(true);
    const hasChanged = ref<boolean>(false);
    const mainKeys = ref<string[]>(['run_id']);
    async function fetchData() {
      if (!client.value) {
        return;
      }
      items.value = [];
      search.value = null;
      loading.value = true;
      const payload = { params: { filter: null, options: null } };
      const dataset = await client.value.getDbits(payload);
      loading.value = false;
      items.value = dataset;
    }
    async function selectAction(item: any) {
      if (!client.value) return;
      loading.value = true;
      // console.log(item._id, item.date_acquired);
      const fltr = { _id: item._id };
      const payload = { params: { filter: JSON.stringify(fltr), options: null } };
      const [data] = await client.value.getDbits(payload);
      const keys = mainKeys.value;
      const unsorted = objectToArray(data);
      detail.value = _.sortBy(unsorted, (x) => !keys.includes(x.key));
      loading.value = false;
      hasChanged.value = false;
      readOnly.value = true;
    }
    function addNew() {
      const newDoc: any = {};
      let obj: any[] = [];
      if (!detail.value) [obj] = items.value;
      else obj = arrayToObject(detail.value);
      _.forIn(obj, (v: any | null, k) => {
        newDoc[k] = null;
      });
      detail.value = objectToArray(newDoc);
      readOnly.value = false;
      hasChanged.value = false;
    }
    async function duplicateAction(ev: any) {
      const obj = arrayToObject(detail.value);
      obj.run_id = null;
      obj._id = null;
      detail.value = objectToArray(obj);
      hasChanged.value = true;
      readOnly.value = false;
    }
    async function saveAction(ev: any) {
      // console.log(detail.value);
      if (!client.value) return;
      const obj = arrayToObject(detail.value);
      const exist = await client.value.checkDbit(obj.run_id);
      let hasWritten = false;
      if (exist) {
        const payload = [obj];
        const resp = await client.value.putDbits(payload);
        hasWritten = true;
        // if entry exists, ask with popup dialog to overwrite
        // snackbar.dispatch({ text: `Dbit id ${obj.run_id} exists in the database`, options: { right: true, color: 'error' } });
      } else {
        // just upsert
        const payload = [obj];
        const resp = await client.value.putDbits(payload);
        hasWritten = true;
      }
      if (hasWritten) {
        await fetchData();
        hasChanged.value = false;
        readOnly.value = true;
        snackbar.dispatch({ text: 'Item has been successfully saved.', options: { right: true, color: 'success' } });
      }
    }
    async function deleteAction(ev: any) {
      if (!client.value) return;
      const obj = arrayToObject(detail.value);
      const resp = await client.value.deleteDbit(obj.run_id);
      await fetchData();
      detail.value = null;
      snackbar.dispatch({ text: 'Item has been successfully deleted.', options: { right: true, color: 'success' } });
    }
    async function inputChanged(val: any, index: any) {
      detail.value[index].value = val;
      hasChanged.value = true;
    }
    function isEmpty(str: string) {
      return (!str || str.length === 0);
    }
    function validate(data: any) {
      const obj = arrayToObject(detail.value);
      return !isEmpty(obj.run_id);
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
      deleteAction,
      addNew,
      fetchData,
      validate,
      mainKeys,
    };
  },
});

</script>
<style>
.overflow {
  overflow-y: auto;
}
</style>
