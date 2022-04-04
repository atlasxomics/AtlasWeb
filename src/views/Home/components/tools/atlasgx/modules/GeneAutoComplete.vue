<template>
    <v-autocomplete
      v-model="selectedGenes"
      :items="filteredGenes"
      :outlined="false"
      multiple
      dense
      clearable
      :allow-overflow="false"
      chips
      label="Search Gene Expressions"
      :cache-items="false"
      color="blue-grey lighten-2"
      item-text="name"
      item-value="name"
      @input="acInputChanged"
      :search-input.sync="searchInput"
      :loading="autocompleteLoading"
      @change="onGenelistChanged"
      width="100%"
      small-chips>
      <template v-slot:selection="data">
        <v-chip
          v-bind="data.attrs"
          :input-value="data.selected"
          close
          small
          color="warning"
          @click="data.select"
          @click:close="remove(data.item)"
        >{{ data.item.name }}
        </v-chip>
      </template>
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
  name: 'GeneAutoComplete',
  props: ['gene_list'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const selectedGenes = ref<any[]>([]);
    const filteredGenes = ref<any[]>([]);
    const searchInput = ref<string | null>(null);
    const geneList = computed(() => props.gene_list);
    const genes = ref<any[]>([]);
    const autocompleteLoading = ref(false);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    async function acInputChanged() { // autocomplete input event handler;
      filteredGenes.value = filteredGenes.value.filter((v: any) => selectedGenes.value.includes(v.name));
      searchInput.value = null;
    }
    async function querySelections(v: string) {
      if (!v) return;
      autocompleteLoading.value = true;
      setTimeout(() => {
        filteredGenes.value = genes.value.filter((g: any) => g.name.toLowerCase().startsWith(v.toLowerCase()) || selectedGenes.value.includes(g.name));
        autocompleteLoading.value = false;
      }, 500);
    }
    async function onGenelistChanged(ev: any) {
      ctx.emit('changed', ev);
      // console.log('emit changed');
      // TODO to send signal to the parent
    }
    function remove(item: any) {
      const newArr = selectedGenes.value.filter((x: any) => x !== item.name);
      selectedGenes.value = newArr;
      onGenelistChanged(selectedGenes.value);
    }
    watch(searchInput, (v: any) => {
      if (v) {
        querySelections(v);
      }
    });
    watch(geneList, (v: any[]) => {
      // console.log('gene list changed');
      selectedGenes.value = [];
      filteredGenes.value = [];
      genes.value = v;
    });
    onMounted(async () => {
      await clientReady;
    });
    return {
      selectedGenes,
      filteredGenes,
      searchInput,
      autocompleteLoading,
      acInputChanged,
      querySelections,
      onGenelistChanged,
      remove,
    };
  },
});

</script>

<style>

</style>
