<template>
    <v-autocomplete
      v-bind="dProps"
      v-model="model"
      :items="filteredOnes"
      :outlined="false"
      dense
      clearable
      :allow-overflow="false"
      chips
      :multiple="false"
      :cache-items="false"
      color="blue-grey lighten-2"
      item-text="id"
      item-value="id"
      @input="acInputChanged"
      :search-input.sync="searchInput"
      :loading="autocompleteLoading"
      @change="onChanged"
      width="100%"
      small-chips>
    </v-autocomplete>
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
  name: 'RunIdAutoComplete',
  props: {
    value: {
      type: String,
      required: false,
      default: null,
    },
    filter: {
      type: String,
      required: true,
      default: 'data',
    },
  },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const model = computed({
      get: () => props.value,
      set: (val) => ctx.emit('input', val),
    });
    const dProps = computed(() => ctx.attrs);
    const selectedOnes = ref<string | null>();
    const filteredOnes = ref<any[]>([]);
    const candidates = ref<any[]>([]);
    const searchInput = ref<string | null>(null);
    const autocompleteLoading = ref(false);
    async function acInputChanged() { // autocomplete input event handler;
      // if (!filteredOnes.value) return;
      // filteredOnes.value = filteredOnes.value.filter((v: any) => selectedOnes.value === v.name);
      // searchInput.value = null;
    }
    async function fetchFileList(fltr: string) {
      if (!client.value) {
        return;
      }
      const fl_payload = { params: { path: 'data', filter: props.filter } };
      const filelist = await client.value.getFileList(fl_payload);
      candidates.value = filelist.map((v: string) => ({ id: `${v.split('/')[1]}`, name: v }));
      candidates.value = lodash.uniqBy(candidates.value, (x: any) => x.id);
    }
    async function querySelections(v: string) {
      if (!v) return;
      autocompleteLoading.value = true;
      setTimeout(async () => {
        await fetchFileList(v);
        filteredOnes.value = candidates.value.filter((g: any) => g.id.toLowerCase().includes(v.toLowerCase()) || selectedOnes.value === g.id);
        autocompleteLoading.value = false;
      }, 500);
    }
    async function onChanged(ev: any) {
      model.value = ev;
      selectedOnes.value = ev;
      ctx.emit('changed', ev);
    }
    function remove(item: any) {
      // const newArr = selectedOnes.value.filter((x: any) => x !== item.name);
      selectedOnes.value = null;
      onChanged(selectedOnes.value);
    }
    watch(searchInput, (v: any) => {
      if (v) {
        querySelections(v);
      }
    });
    onMounted(async () => {
      await clientReady;
    });
    return {
      model,
      dProps,
      autocompleteLoading,
      searchInput,
      acInputChanged,
      selectedOnes,
      filteredOnes,
      onChanged,
      remove,
    };
  },
});

</script>

<style>

</style>
