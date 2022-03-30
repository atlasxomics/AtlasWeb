<template>
    <v-autocomplete
      v-model="selectedGenes"
      :items="filteredGenes"
      :outlined="false"
      multiple
      dense
      clearable
      placeholder=""
      label="Enter gene ID:"
      :allow-overflow="false"
      chips
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
      <template v-slot:append-outer v-if="selectedGenes.length > 0">
        <v-btn
          color="primary"
          medium
          text
          @click="showGene"
          >Show</v-btn>
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
  props: ['gene_list', 'geneButton'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const selectedGenes = ref<any[]>([]);
    const filteredGenes = ref<any[]>([]);
    const searchInput = ref<string | null>(null);
    const geneList = computed(() => props.gene_list);
    const geneButton = computed(() => props.geneButton);
    const genes = ref<any[]>([]);
    const showFlag = ref<boolean>(false);
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
    async function showGene(ev: any) {
      showFlag.value = true;
      ctx.emit('flag', showFlag.value);
    }
    function remove(item: any) {
      const newArr = selectedGenes.value.filter((x: any) => x !== item.name);
      selectedGenes.value = newArr;
      searchInput.value = '';
      onGenelistChanged(selectedGenes.value);
    }
    watch(searchInput, (v: any) => {
      if (v) {
        querySelections(v);
      }
    });
    watch(props.gene_list, (v: any[]) => {
      genes.value = v;
    });
    watch(props.geneButton, (v: any[]) => {
      const gene = v[0];
      if (!selectedGenes.value.includes(v[0]) && (typeof gene === 'string')) {
        searchInput.value = gene;
        selectedGenes.value.push(gene);
        onGenelistChanged(selectedGenes.value);
      }
    });
    watch(selectedGenes, (v: any[]) => {
      if (selectedGenes.value.length === 0) {
        filteredGenes.value = [];
        showFlag.value = false;
      }
    });
    onMounted(async () => {
      await clientReady;
    });
    return {
      selectedGenes,
      filteredGenes,
      searchInput,
      autocompleteLoading,
      showFlag,
      acInputChanged,
      querySelections,
      onGenelistChanged,
      remove,
      showGene,
    };
  },
});

</script>

<style>

</style>
