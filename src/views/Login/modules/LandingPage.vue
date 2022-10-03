<template>
  <v-container fluid>
    <v-row no-gutters>
      <v-col cols="12" sm="3" style="padding-left:10px">
        <v-card :loading="loading" flat>
          <v-card-title>Filters</v-card-title>
          <v-divider style="width:91%"/>
          <template v-for="item in groupsAndData">
            <v-card-actions v-bind:key="item.title">
              <v-card-title>{{item.title}}</v-card-title>
              <v-spacer></v-spacer>
              <v-btn
                icon
                @click="item.active = !item.active">
                <v-icon>{{ item.active ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </v-btn>
            </v-card-actions>
            <template v-if="item.active">
              <template v-for="child in item.items">
                <v-card-actions v-bind:key="child">
                  <v-checkbox :disabled="(countHold[child] == 0 ? true : false)" :key="child" :label="`${child} (${countHold[child]})`" @click="checkBoxSort(child, item.title)"></v-checkbox>
                </v-card-actions>
              </template>
            </template>
          </template>
        </v-card>
      </v-col>
      <v-col cols="12" sm="9" style="padding-right:10px">
        <v-text-field
          :loading="loading"
          v-model="textSearch"
          @click:prepend="searchRuns(textSearch)"
          @click:clear="searchRuns('')"
          placeholder="Search eg. PMID, Author, Disease Type"
          clearable
          prepend-icon="mdi-magnify"/>
        <v-card v-for="data in numOfPubsHold" v-bind:key="data.run_id">
          <v-card-title style="pointer-events: auto" @click="runSpatial(data)">{{data.run_title}}</v-card-title>
          <v-card-subtitle>{{data.date}}</v-card-subtitle>
          <v-card-text>{{data.description}}</v-card-text>
          <v-card-subtitle v-for="keys in data.type" v-bind:key="keys+data.id">{{decodeDTTwo[decodeDT.indexOf(keys)]}}</v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, onMounted, computed } from '@vue/composition-api';
import { login, isClient } from '@/api';
import lodash, { lte, update } from 'lodash';
import { loggedIn, saveCookie, readCookie, logout } from '@/utils/auth';
import { generateRouteByQuery } from '@/utils';
import store from '@/store';
import { SERVER_URL, TEST_SERVER_URL, PROD_SERVER_URL } from '@/environment';

export default defineComponent({
  name: 'LandingPage',
  setup(props, ctx) {
    // NOTE: May need to be computed ref
    const router = ctx.root.$router;
    const currentRoute = computed(() => ctx.root.$route);
    const client = computed(() => store.state.client);
    const loginErrorMessage = ref<string | null>(null);

    const showAdvanced = ref(false);
    const useTestServer = ref(SERVER_URL === TEST_SERVER_URL);
    const signFlag = ref(false);
    const show = ref(false);
    const groupsAndData = ref<any[]>([]);
    const dataTypes = ref<any[]>([]);
    const numOfPubs = ref<any[]>([]);
    const numOfPubsHold = ref<any[]>([]);
    const checkBoxArr = ref<any[]>([]);
    const textSearch = ref<string>('');
    const loading = ref<boolean>(false);
    const count = ref<any>({});
    const countHold = ref<any>({});
    const decodeDT = ref<any>(['Transcriptome', 'ATAC', 'Cut&Tag', 'Atlas', 'Rong', 'Hurd']);
    const decodeDTTwo = ref<any[]>(['Spatial Transcriptome', 'Spatial ATAC', 'Spatial Cut & Tag', 'Atlas', 'Rong Lab', 'Hurd Lab']);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    function checkBoxSort(ev: string, title: any) {
      loading.value = true;
      numOfPubsHold.value = [];
      const countKeys = Object.keys(countHold.value);
      countKeys.forEach((v: any, k: any) => {
        countHold.value[v] = 0;
      });
      const val = { key: ev, title };
      if (checkBoxArr.value.length === 0) {
        checkBoxArr.value.push(val);
      } else {
        const index = checkBoxArr.value.findIndex((rank: any) => lodash.isEqual(rank, val));
        if (index > -1) checkBoxArr.value.splice(index, 1);
        else checkBoxArr.value.push(val);
      }
      const hold: any[] = [];
      if (checkBoxArr.value.length > 0) {
        numOfPubs.value.forEach((value: any, key: any) => {
          const bool: boolean[] = [];
          checkBoxArr.value.forEach((elements: any) => {
            if (elements.title === 'Groups') {
              if (decodeDT.value[decodeDTTwo.value.indexOf(elements.key.trim())] === value.groupName.trim()) bool.push(true);
              else bool.push(false);
            }
            if (elements.title === 'Data Type') {
              if (value.type.includes(decodeDT.value[decodeDTTwo.value.indexOf(elements.key.trim())])) bool.push(true);
              else bool.push(false);
            }
          });
          if (!bool.includes(false)) hold.push(value);
        });
        hold.forEach((value: any, key: any) => {
          countHold.value[decodeDTTwo.value[decodeDT.value.indexOf(value.groupName)]] += 1;
          value.type.forEach((v: any, k: any) => {
            // decodeDTTwo.value[decodeDT.value.indexOf(elements.key.toLowerCase().replaceAll(' ', ''))]
            countHold.value[decodeDTTwo.value[decodeDT.value.indexOf(v.trim())]] += 1;
          });
        });
        numOfPubsHold.value = hold;
      } else {
        numOfPubs.value.forEach((v: string, i: number) => {
          numOfPubsHold.value.push(v);
        });
        lodash.each(count.value, (v: any, i: any) => {
          countHold.value[i] = count.value[i];
        });
      }
      loading.value = false;
    }
    function searchRuns(event: string) {
      const ev = event.toLowerCase();
      loading.value = true;
      if (ev.length === 0) {
        numOfPubsHold.value = [];
        numOfPubs.value.forEach((v: string, i: number) => {
          numOfPubsHold.value.push(v);
        });
      } else {
        const digpat = /\d/;
        const digit = digpat.test(ev);
        const hold: any[] = [];
        numOfPubs.value.forEach((value: any, key: any) => {
          if (digit) {
            if (ev === value.pmid) hold.push(value);
          } else {
            value.authors.forEach((auth: string, index: any) => {
              if (auth.toLowerCase().startsWith(ev)) hold.push(value);
            });
          }
        });
        numOfPubsHold.value = hold;
      }
      loading.value = false;
    }
    async function runSpatial(runObject: any) {
      const path = runObject.run_id;
      const existingCookie = readCookie();
      const split = existingCookie?.token.split('JWT ')[1];
      const geneFileName = `data/${path}/h5/obj/gene.csv`;
      const motifFileName = `data/${path}/h5/obj/motif.csv`;
      const tixelFileName = `data/${path}/h5/obj/data.csv`;
      const motifH5ad = `data/${path}/h5/obj/motifs.h5ad`;
      const geneH5ad = `data/${path}/h5/obj/genes.h5ad`;
      const motifCsv = `data/${path}/h5/obj/motifs.csv`;
      const { encoded: filenameToken } = await client.value!.encodeLink({ args: [tixelFileName, geneFileName, motifFileName, geneH5ad, motifH5ad, motifCsv], meta: { run_id: path, species: runObject.species, tissue: runObject.tissue } });
      const { host } = window.location;
      const publicLink = `http://${host}/public?component=PublicGeneViewer&run_id=${filenameToken}&public=true&token=JWT%20${split}`;
      router.push(`public?component=PublicGeneViewer&run_id=${filenameToken}&public=true&token=JWT%20${split}`);
      pushByQuery({ component: 'PublicGeneViewer', run_id: filenameToken, public: 'true', token: existingCookie?.token });
    }
    async function getData() {
      loading.value = true;
      /* eslint-disable no-await-in-loop */
      const allRuns = await client.value?.getPublicRuns();
      const data: any[] = [];
      const labs: any[] = [];
      const type: any[] = [];
      const precount: any = {};
      allRuns.forEach((json: any, index: any) => {
        if (!labs.includes(decodeDTTwo.value[decodeDT.value.indexOf(json.groupName)])) labs.push(decodeDTTwo.value[decodeDT.value.indexOf(json.groupName)]);
        if (!type.includes(decodeDTTwo.value[decodeDT.value.indexOf(json.type)])) type.push(decodeDTTwo.value[decodeDT.value.indexOf(json.type)]);
        if (!Object.keys(precount).includes(decodeDTTwo.value[decodeDT.value.indexOf(json.groupName)])) precount[decodeDTTwo.value[decodeDT.value.indexOf(json.groupName)]] = 1;
        else precount[decodeDTTwo.value[decodeDT.value.indexOf(json.groupName)]] += 1;
        if (!Object.keys(precount).includes(decodeDTTwo.value[decodeDT.value.indexOf(json.type)])) precount[decodeDTTwo.value[decodeDT.value.indexOf(json.type)]] = 1;
        else precount[decodeDTTwo.value[decodeDT.value.indexOf(json.type)]] += 1;
        const updateJson = json;
        updateJson.authors = [...updateJson.authors.split(',')];
        updateJson.type = [...updateJson.type.split(',')];
        data.push(updateJson);
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        active: true,
        items: [...labs],
        title: 'Groups',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        active: true,
        items: [...type],
        title: 'Data Type',
      });
      lodash.each(precount, (v: any, i: any) => {
        countHold.value[i] = v;
        count.value[i] = v;
      });
      numOfPubs.value = data;
      numOfPubsHold.value = data;
      loading.value = false;
    }
    async function openLink(ev: any) {
      pushByQuery({ component: 'AtlasXplore', run_id: ev });
    }
    onMounted(async () => {
      getData();
    });

    return {
      SERVER_URL,
      getData,
      loginErrorMessage,
      showAdvanced,
      useTestServer,
      signFlag,
      groupsAndData,
      dataTypes,
      show,
      client,
      checkBoxSort,
      numOfPubs,
      runSpatial,
      openLink,
      numOfPubsHold,
      checkBoxArr,
      searchRuns,
      textSearch,
      loading,
      count,
      countHold,
      decodeDT,
      decodeDTTwo,
    };
  },
});
</script>

<style scoped>
</style>
