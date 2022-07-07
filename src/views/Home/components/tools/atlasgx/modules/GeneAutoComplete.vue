<template>
    <v-autocomplete
      class="noScroll"
      id ="noScrollId"
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
      :menu-props="{closeOnClick: false}"
      @change="onGenelistChanged"
      width="100%"
      small-chips>
      <template v-slot:selection="data">
      <v-chip-group column>
        <v-chip
          :key="data.item.name"
          v-bind="data.attrs"
          :input-value="active"
          close
          small
          color="warning"
          outlined
          @click.stop="updateTrack(data.item.name)"
          @click:close="remove(data.item)"
        >{{ data.item.name }}
        </v-chip>
        </v-chip-group>
      </template>
      <template v-slot:append-outer v-if="selectedGenes.length > 0">
        <v-btn
          color="primary"
          class="mt-n1"
          medium
          text
          @click="showGene"
          >Show</v-btn>
        <div class="customCheck">
          <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-simple-checkbox v-bind="attrs" v-on="on" v-model="de_select" label="" color="secondary" hide-details dense />
          </template>
          <span>(De)Select All</span>
          </v-tooltip>
        </div>
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
    const de_select = ref<boolean>(false);
    const clicked = ref<boolean>(false);
    const paddingValue = ref<number>(32);
    const newRowCounter = ref<number>(0);
    const active = ref<boolean>(false);
    const autoGenes = ref<any[]>([]);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    async function acInputChanged() { // autocomplete input event handler;
      filteredGenes.value = genes.value;
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
      if (ev.length > 0) {
        const clientHeighte = document.querySelector('.noScroll') as HTMLElement;
        const childElementInner = clientHeighte.querySelector('.v-select__slot') as HTMLElement;
        const childElementOuter = clientHeighte.querySelector('.v-input__append-outer') as HTMLElement;
        let holder = childElementInner?.clientHeight || 0;
        if (holder > paddingValue.value) {
          newRowCounter.value += 1;
          childElementInner.style.paddingTop = `${25 * newRowCounter.value}px`;
          childElementOuter.style.paddingTop = `${25 * newRowCounter.value}px`;
          holder = childElementInner?.clientHeight || 0;
          paddingValue.value = holder;
        }
      } else {
        const clientHeighte = document.querySelector('.noScroll') as HTMLElement;
        const childElementInner = clientHeighte.querySelector('.v-select__slot') as HTMLElement;
        const childElementOuter = clientHeighte.querySelector('.v-input__append-outer') as HTMLElement;
        childElementOuter.style.paddingTop = '0';
        childElementInner.style.paddingTop = '0';
        paddingValue.value = 32;
      }
    }
    async function showGene(ev: any) {
      showFlag.value = true;
      ctx.emit('sentgenes', autoGenes.value);
    }
    async function updateTrack(ev: any) {
      if (!autoGenes.value.includes(ev)) {
        autoGenes.value.push(ev);
      } else {
        const index = autoGenes.value.indexOf(ev);
        if (index > -1) autoGenes.value.splice(index, 1);
      }
    }
    function resetScroll() {
      labelValue.value = '';
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
    watch(de_select, (v: any) => {
      active.value = v;
      if (v) {
        autoGenes.value = selectedGenes.value;
      } else autoGenes.value = [];
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
        autoGenes.value = [];
        showFlag.value = false;
        labelValue.value = 'Enter ID';
      } else labelValue.value = '';
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
      de_select,
      clicked,
      paddingValue,
      newRowCounter,
      active,
      autoGenes,
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
    margin-top: 18px;
  }
  .noScroll >>> .v-input__slot {
    background-color: #f5f5f5;
  }
  .customCheck {
    color: white;
  }
  .customCheck >>> .input__slot {
    color: none;
  }
  .customCheck >>> .theme--light.v-icon {
    color: rgba(0,0,0,1);
  }
  .customCheck >>> .theme--light.v-input, .customCheck >>> .theme--light.v-input input, .customCheck >>> .theme--light.v-input textarea {
    color: white;
  }
  .customCheck .v-simple-checkbox {
    padding-top: 3px;
  }
</style>
