<template>
    <v-autocomplete
      class="noScroll"
      v-model="selectedGenes"
      :items="filteredGenes"
      :outlined="false"
      multiple
      dense
      clearable
      placeholder=""
      :label="labelValue"
      :allow-overflow="false"
      chips
      :cache-items="false"
      color="blue-grey lighten-2"
      item-text="name"
      item-value="name"
      @input="acInputChanged"
      :search-input.sync="searchInput"
      :loading="autocompleteLoading"
      :menu-props="{closeOnClick: true}"
      @change="onGenelistChanged"
      @focus="focusFlag = true"
      @blur="focusFlag = false"
      width="100%"
      small-chips>
      <template v-slot:selection="data">
        <v-chip
          v-bind="data.attrs"
          :input-value="data.selected"
          close
          small
          color="warning"
          @click.stop="updateTrack(data.item.name)"
          @click:close="remove(data.item)"
        >{{ data.item.name }}
        </v-chip>
      </template>
      <template v-slot:append-outer v-if="selectedGenes.length > 0">
        <v-btn
          color="primary"
          class="mt-n1"
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
  props: ['gene_list', 'gene_button'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const selectedGenes = ref<any[]>([]);
    const filteredGenes = ref<any[]>([]);
    const searchInput = ref<string | null>(null);
    const geneList = computed(() => props.gene_list);
    const geneButton = computed(() => props.gene_button);
    const genes = ref<any[]>([]);
    const showFlag = ref<boolean>(false);
    const autocompleteLoading = ref(false);
    const labelValue = ref<string>('Enter ID');
    const focusFlag = ref<boolean>(false);
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
      // TODO to send signal to the parent
    }
    async function showGene(ev: any) {
      showFlag.value = true;
      ctx.emit('flag', ev);
    }
    async function updateTrack(ev: any) {
      ctx.emit('track', ev);
    }
    function resetScroll() {
      labelValue.value = '';
      const inputBox = document.getElementsByClassName('v-select__selections');
      inputBox[0].scrollTo(0, 0);
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
    watch(geneList.value, (v: any[]) => {
      genes.value = v;
    });
    watch(geneButton.value, (v: any[]) => {
      const gene = v[0];
      if (!selectedGenes.value.includes(v[0]) && (typeof gene === 'string')) {
        searchInput.value = gene;
        selectedGenes.value.push(gene);
        onGenelistChanged(selectedGenes.value);
      }
      if (v.length === 0) {
        searchInput.value = '';
        selectedGenes.value = [];
      }
    });
    watch(selectedGenes, (v: any[]) => {
      if (selectedGenes.value.length === 0) {
        filteredGenes.value = [];
        showFlag.value = false;
      }
    });
    watch(focusFlag, (v: any) => {
      labelValue.value = '';
      if (v) {
        resetScroll();
      } else {
        labelValue.value = 'Enter ID';
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
      labelValue,
      focusFlag,
      acInputChanged,
      querySelections,
      onGenelistChanged,
      remove,
      showGene,
      updateTrack,
      resetScroll,
    };
  },
});

</script>

<style scoped>
  .noScroll {
    margin-top: 10px;
  }
  .noScroll >>> .v-input__control {
    align-items: flex-start;
    display: flex;
    flex: 1 1 auto;
    font-size: 16px;
    letter-spacing: normal;
    max-width: 700px;
    text-align: left;
    overflow: hidden;
  }
  .noScroll >>> .v-select__slot {
    position: relative;
    align-items: center;
    display: flex;
    max-width: 100%;
    min-width: 0;
    width: 100%;
  }
  .noScroll >>> .v-select__selections {
    align-items: center;
    display: unset;
    flex: none;
    margin-bottom: -50px; /* maximum width of scrollbar */
    padding-bottom: 50px; /* maximum width of scrollbar */
    overflow-y: hidden;
    overflow-x: scroll;
    white-space: nowrap;
    -ms-overflow-style: none;
    scrollbar-width: none;
    line-height: 18px;
    width: 90%;
    max-width: 90%;
    min-width: 0;
  }
  .noScroll >>> .v-text-field .noScroll >>> .v-input__append-inner, .noScroll >>> .v-text-field .noScroll >>> .v-input__prepend-inner {
    align-self: end;
    display: grid;
    margin-top: 4px;
    line-height: 1;
    width: 5%;
    max-width: 5%;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  .noScroll >>> ::-webkit-scrollbar {
  display: none; /* for Chrome, Safari, and Opera */
  }
</style>
