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
                  <v-checkbox :key="child" :label="child" @click="checkBoxSort(child, item.title)"></v-checkbox>
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
        <v-card v-for="data in numOfPubsHold" v-bind:key="data.id">
          <v-card-title style="pointer-events: auto" @click="runSpatial(data.meta.runId)">{{data.meta.title}}</v-card-title>
          <v-card-subtitle>{{data.meta.time}}</v-card-subtitle>
          <v-card-text>{{data.meta.description}}</v-card-text>
          <v-card-subtitle v-for="keys in data.meta.keyPhrases" v-bind:key="keys+data.id">{{keys}}</v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, onMounted, computed } from '@vue/composition-api';
import { login, isClient } from '@/api';
import lodash, { lte } from 'lodash';
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
    const groupsAndData = ref<any[]>([
      {
        action: 'mdi-ticket',
        active: true,
        items: ['Spatial Transcriptome', 'Spatial ATAC', 'Spatial Cut & Tag'],
        title: 'Data Type',
      },
    ]);
    const dataTypes = ref<any[]>([]);
    const numOfPubs = ref<any[]>([]);
    const numOfPubsHold = ref<any[]>([]);
    const checkBoxArr = ref<any[]>([]);
    const textSearch = ref<string>('');
    const loading = ref<boolean>(false);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    function checkBoxSort(ev: string, title: any) {
      loading.value = true;
      numOfPubsHold.value = [];
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
        checkBoxArr.value.forEach((elements: any) => {
          numOfPubs.value.forEach((value: any, key: any) => {
            if (elements.title === 'Groups') {
              if (elements.key === value.name && !hold.includes(value)) {
                hold.push(value);
              }
            }
            if (elements.title === 'Data Type') {
              if (value.meta.keyPhrases.includes(elements.key.toLowerCase()) && !hold.includes(value)) {
                hold.push(value);
              }
            }
          });
        });
        numOfPubsHold.value = hold;
      } else {
        numOfPubs.value.forEach((v: string, i: number) => {
          numOfPubsHold.value.push(v);
        });
      }
      loading.value = false;
    }
    function searchRuns(ev: any) {
      loading.value = true;
      if (ev.length === 0) {
        numOfPubsHold.value = [];
        numOfPubs.value.forEach((v: string, i: number) => {
          numOfPubsHold.value.push(v);
        });
      } else {
        const digpat = /\d/;
        const digit = digpat.test(ev);
        const charpat = /[.,\\/#!$%^&*;:{}=_`~()@"\r\n]/;
        const hold: any[] = [];
        const char = charpat.test(ev);
        if (char) return;
        numOfPubs.value.forEach((value: any, key: any) => {
          if (digit) {
            if (ev === value.pmid) hold.push(value);
          } else {
            value.author.forEach((auth: string, index: any) => {
              if (auth.toLowerCase().includes(ev)) hold.push(value);
            });
          }
        });
        numOfPubsHold.value = hold;
      }
      loading.value = false;
    }
    async function runSpatial(path: any) {
      const existingCookie = readCookie();
      const split = existingCookie?.token.split('JWT ')[1];
      const geneFileName = `data/${path}/gene.csv`;
      const motifFileName = `data/${path}/motif.csv`;
      const tixelFileName = `data/${path}/data.csv`;
      const motifH5ad = `data/${path}/motifs.h5ad`;
      const geneH5ad = `data/${path}/genes.h5ad`;
      const motifCsv = `data/${path}/motifs.csv`;
      const { encoded: filenameToken } = await client.value!.encodeLink({ args: [tixelFileName, geneFileName, motifFileName, geneH5ad, motifH5ad, motifCsv], meta: { run_id: path } });
      const { host } = window.location;
      const publicLink = `http://${host}/public?component=PublicGeneViewer&run_id=${filenameToken}&public=true&token=JWT%20${split}`;
      router.push(`public?component=PublicGeneViewer&run_id=${filenameToken}&public=true&token=JWT%20${split}`);
      pushByQuery({ component: 'PublicGeneViewer', run_id: filenameToken, public: 'true', token: existingCookie?.token });
    }
    async function callJson(filename: string) {
      if (filename !== null) {
        const name = filename;
        const jsonFileName = { params: { filename: name } };
        const data = await client.value!.getJsonFile(jsonFileName);
        return data;
      }
      return null;
    }
    async function getData() {
      loading.value = true;
      /* eslint-disable no-await-in-loop */
      const groupsAndPub = await callJson('database/public.json');
      groupsAndData.value.push({
        action: 'mdi-ticket',
        active: true,
        items: [...Object.keys(groupsAndPub)],
        title: 'Groups',
      });
      groupsAndData.value.reverse();
      const data: any[] = [];
      const amountOfPub = { Atlas: await callJson('database/Atlas/metadata.json') };
      lodash.each(amountOfPub, (value: any, key: any) => {
        lodash.each(value, async (info: any, pid: any) => {
          for (let i = 0; i < parseInt(info.runs, 10) - 1; i += 1) {
            data.push({ id: `database/${key}/publications/${pid}/D${i}`, name: key, pmid: info.pmid, author: [...info.author], runs: `D${i}`, meta: await callJson(`database/${key}/publications/${pid}/D${i}/metadata.json`) });
          }
        });
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
      callJson,
      numOfPubs,
      runSpatial,
      openLink,
      numOfPubsHold,
      checkBoxArr,
      searchRuns,
      textSearch,
      loading,
    };
  },
});
</script>
