<template v-if="geneList">
    <v-autocomplete
      :loading="(genes.length == 0) ? true : false"
      :disabled="(genes.length == 0) ? true : false"
      class="noScroll"
      id ="noScrollId"
      @paste="handlePaste"
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
      :search-input.sync="searchInput"
      :menu-props="{closeOnContentClick: true}"
      @change="onGenelistChanged"
      @focus="cleanAuto"
      @blur="cleanInput"
      width="100%"
      small-chips>
      <template v-slot:item="{ item }">
        {{item.name}}
      </template>
      <template v-slot:selection="data">
        <v-chip
          :ref="data.item.name"
          :id="data.item.name"
          close
          small
          color="warning"
          @click.stop="updateTrack(data.item.name)"
          @click:close="remove(data.item)"
        >{{ data.item.name }}
        </v-chip>
      </template>
      <template v-slot:prepend>
        <input type="file" ref="filegac" style="display: none" @change="readFile()" @click="resetFile" />
        <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            v-on="on"
            id="no-background-hover"
            style="min-width: 0"
            elevation="0"
            color="transparent"
            class="mt-n2"
            medium
            @click="$refs.filegac.click()"><v-icon>mdi-upload</v-icon></v-btn>
        </template>
        <span>Upload gene IDs</span>
        </v-tooltip>
      </template>
      <template v-slot:append-outer v-if="selectedGenes.length > 0">
        <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            v-on="on"
            id="no-background-hover"
            style="padding: 0; min-width: 0"
            elevation="0"
            color="transparent"
            class="mt-n1"
            medium
            @click="collapseGene"><v-icon>mdi-menu</v-icon></v-btn>
        </template>
        <span>Open/Collapse</span>
        </v-tooltip>
        <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
            <v-btn
            v-bind="attrs"
            v-on="on"
            class="mt-n1"
            medium
            text
            id='averageIndButton'
            @click="avgInd = !avgInd">{{(avgInd) ? 'Ind':'Avg'}}
            </v-btn>
        </template>
        <span>Average&lt;-&gt;Individual</span>
        </v-tooltip>
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
  props: ['gene_list', 'gene_button', 'search_bar_enabled'],
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
    const avgInd = ref<boolean>(false);
    const clicked = ref<boolean>(false);
    const paddingValue = ref<number>(32);
    const newRowCounter = ref<number>(0);
    const autoGenes = ref<any[]>([]);
    const valueCollapse = ref<boolean>(false);
    const fileContent = ref<any[]>([]);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    async function cleanAuto(ev: any) {
      if (selectedGenes.value.length > 0) {
        filteredGenes.value = genes.value.filter((g: any) => selectedGenes.value.includes(g.name));
      }
    }
    async function cleanInput(ev: any) {
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
    }
    async function handlePaste(ev: any) {
      const pasteElement = await navigator.clipboard.readText();
      const splitPaste = pasteElement.split(/[,\s]+/);
      const stripString = splitPaste.map((s: any) => s.replace(/[,\\/#!$%^&*;:{}=_`~()@'"\r\n\s]/g, ''));
      stripString.forEach((v: string, i: number) => {
        const theGene = v;
        const lower = v.toLowerCase();
        const cleanGene = lower.charAt(0).toUpperCase() + lower.slice(1);
        let stringFormat: any;
        if (genes.value.filter((g: any) => g.name === theGene).length === 1) {
          stringFormat = theGene;
        } else if (genes.value.filter((g: any) => g.name === cleanGene).length === 1) {
          stringFormat = cleanGene;
        } else stringFormat = null;
        if (!selectedGenes.value.includes(stringFormat) && stringFormat !== null) {
          searchInput.value = stringFormat;
          selectedGenes.value.push(stringFormat);
        }
      });
      onGenelistChanged(selectedGenes.value);
      searchInput.value = null;
    }
    async function updateTrack(ev: any) {
      if (!autoGenes.value.includes(ev)) {
        autoGenes.value.push(ev);
      } else {
        const index = autoGenes.value.indexOf(ev);
        if (index > -1) autoGenes.value.splice(index, 1);
      }
    }
    function remove(item: any) {
      if (autoGenes.value.includes(item.name)) {
        const index = autoGenes.value.indexOf(item.name);
        if (index > -1) autoGenes.value.splice(index, 1);
      }
      const newArr = selectedGenes.value.filter((x: any) => x !== item.name);
      selectedGenes.value = newArr;
      searchInput.value = '';
      onGenelistChanged(selectedGenes.value);
    }
    function collapseGene() {
      valueCollapse.value = !valueCollapse.value;
      const clientHeighte = document.querySelector('.noScroll') as HTMLElement;
      const childElementInner = clientHeighte.querySelector('.v-select__selections') as HTMLElement;
      if (valueCollapse.value) {
        childElementInner.style.height = '32px';
        childElementInner.style.overflow = 'auto';
      } else {
        childElementInner.style.height = 'auto';
        childElementInner.style.overflow = 'none';
      }
    }
    function readFile() {
      const theFile = (ctx as any).refs.filegac.files[0];
      const reader = new FileReader();
      if (theFile.type.includes('csv')) {
        reader.onload = (res) => {
          fileContent.value = [res.target!.result];
        };
        reader.onerror = (err) => console.log(err);
        reader.readAsText(theFile);
      } else {
        snackbar.dispatch({ text: 'Wrong file type must be csv', options: { right: true, color: 'error' } });
      }
    }
    function resetFile(ev: any) {
      const element = ev.target as HTMLInputElement;
      element.value = '';
    }
    watch(searchInput, (v: any) => {
      if (v) {
        querySelections(v);
      }
    });
    watch(avgInd, (v: any) => {
      ctx.emit('avgind', avgInd.value);
    });
    watch(geneList.value, (v: any[]) => {
      genes.value = v;
    });
    watch(geneButton.value, (v: any[]) => {
      const gene = v[0];
      if (!selectedGenes.value.includes(gene) && (typeof gene === 'string')) {
        searchInput.value = gene;
        selectedGenes.value.push(gene);
      }
      if (v.length === 0) {
        searchInput.value = '';
        selectedGenes.value = [];
      }
    });
    watch(selectedGenes, (v: any[]) => {
      if (selectedGenes.value.length === 0) {
        filteredGenes.value = genes.value;
        autoGenes.value = [];
        labelValue.value = 'Enter ID';
      } else labelValue.value = '';
    });
    watch(fileContent, (value: any) => {
      const array = value[0].split(',');
      const cleaned = array.map((s: any) => s.replace(/[.,\\/#!$%^&*;:{}=_`~()@'"\s]/g, ''));
      cleaned.forEach((v: string, i: number) => {
        const theGene = v;
        const lower = v.toLowerCase();
        const cleanGene = lower.charAt(0).toUpperCase() + lower.slice(1);
        let stringFormat: any;
        if (genes.value.filter((g: any) => g.name === theGene).length === 1) {
          stringFormat = theGene;
        } else if (genes.value.filter((g: any) => g.name === cleanGene).length === 1) {
          stringFormat = cleanGene;
        } else stringFormat = null;
        if (!selectedGenes.value.includes(stringFormat) && stringFormat !== null) {
          searchInput.value = stringFormat;
          selectedGenes.value.push(stringFormat);
        }
      });
      onGenelistChanged(selectedGenes.value);
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
      clicked,
      paddingValue,
      newRowCounter,
      autoGenes,
      valueCollapse,
      fileContent,
      avgInd,
      genes,
      querySelections,
      onGenelistChanged,
      remove,
      updateTrack,
      collapseGene,
      readFile,
      resetFile,
      handlePaste,
      cleanAuto,
      cleanInput,
    };
  },
});

</script>

<style scoped>
  .noScroll {
    margin-top: 2px;
    height: 24px;
  }
  .noScroll >>> .v-select__slot {
    background-color: #f5f5f5;
  }
  .collapse {
    height: 1px;
    overflow: auto;
  }
  .show {
    height: 0;
    overflow: none;
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
  #no-background-hover::before {
   background-color: transparent !important;
  }
  #averageIndButton #no-background-hover::before {
   background-color: transparent !important;
  }
</style>
