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
                  <v-checkbox color="black" :disabled="(countHold[child] == 0 ? true : false)" :key="child" :label="`${child} (${countHold[child]})`" @click="checkBoxSort(child, item.title)"></v-checkbox>
                </v-card-actions>
              </template>
            </template>
          </template>
        </v-card>
      </v-col>
      <v-col cols="12" sm="9" style="padding-right:10px">
        <v-row>
          <v-col cols="12" sm="7">
            <v-text-field
              :loading="loading"
              v-model="textSearch"
              @click:prepend="searchRuns(textSearch)"
              @input="searchRuns(textSearch)"
              @click:clear="searchRuns('')"
              placeholder="Search eg. PMID, Author, Disease Type"
              clearable
              prepend-icon="mdi-magnify"/>
          </v-col>
          <v-col cols="12" sm="3" class="d-flex justify-center align-center mt-4">
            <p>Sort By:</p>
          </v-col>
          <v-col cols="12" sm="2" class="mt-4">
            <v-row>
              <v-col cols="6" sm="3">
                <v-btn :ripple="false" plain depressed large :color="(!menuListFlag) ? 'blue' : 'black'" icon @click="menuListFlag = !menuListFlag"><v-icon>mdi-menu</v-icon></v-btn>
              </v-col>
              <v-col cols="6" sm="3">
                <v-btn :ripple="false" plain depressed large :color="(menuListFlag) ? 'blue' : 'black'" icon @click="menuListFlag = !menuListFlag"><v-icon>mdi-format-list-bulleted</v-icon></v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <template v-if="!menuListFlag">
`         <template v-for="data in numOfPubsHold[pageIteration]" >
            <v-card :style="{'border-top': `6px solid ${labColors[data.Group_Name]}`}" v-bind:key="data.Run_id">
              <v-card-title style="cursor: pointer;" @click="runSpatial(data)">{{data.Run_Title}}</v-card-title>
              <v-card-subtitle>{{data.Date}}</v-card-subtitle>
              <v-card-text>{{data.Description}}</v-card-text>
              <v-card-subtitle v-for="keys in data.Assay_Type" v-bind:key="keys+data.Pub_ID"><v-chip small dark :color="labColors[data.Group_Name]">{{decodeDTTwo[decodeDT.indexOf(keys)]}}</v-chip></v-card-subtitle>
            </v-card>
            <div style="width:100%; height:20px" v-bind:key="data.Run_id"></div>
          </template>`
        </template>
        <template v-else>
          <v-list two-line>
          <v-list-item-group
            multiple>
            <template v-for="data in numOfPubsHold[pageIteration]">
              <v-list-item  @click="runSpatial(data)" v-bind:key="data.Run_id">
                  <v-list-item-content>
                    <v-list-item-title v-text="data.Run_Title"></v-list-item-title>
                    <v-list-item-subtitle
                      v-text="data.Date"
                    ></v-list-item-subtitle>
                    <v-list-item-subtitle class="text--primary" v-text="data.Description"></v-list-item-subtitle>
                    <v-list-item-subtitle v-for="keys in data.Assay_Type" v-bind:key="keys+data.Pub_ID"><v-chip dark x-small>{{decodeDTTwo[decodeDT.indexOf(keys)]}}</v-chip></v-list-item-subtitle>
                  </v-list-item-content>
              </v-list-item>
            </template>
          </v-list-item-group>
          </v-list>
        </template>
        <div>
          <ul style="list-style: none; display: flex; justify-content: center;">
            <li>
              <v-btn
                icon
                @click="(pageIteration === 1) ? pageIteration = 1 : pageIteration -= 1">
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
            </li>
            <template v-for="number in (numOfIt + 1)">
              <li v-bind:key="number" style="padding: 0px" @click="nextPageIteration(number)"><v-btn id="resize-butt" :ripple="false" plain depressed text :color="(pageIteration === number) ? 'blue' : 'black'">{{number}}</v-btn></li>
            </template>
            <li>
              <v-btn
                icon
                @click="(pageIteration === numOfIt+1) ? pageIteration = numOfIt+1 : pageIteration += 1">
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </li>
          </ul>
        </div>
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

function makearray(stopValue: number, startValue: number, steps: number): any[] {
  const arr = [];
  const step = (stopValue - startValue) / (steps - 1);
  for (let i = 0; i < steps; i += 1) {
    arr.push(Math.ceil(startValue + (step * i)));
  }
  arr.shift();
  arr.pop();
  return arr;
}

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
    const numOfPubs = ref<any>({});
    const numOfPubsHold = ref<any>({});
    const checkBoxArr = ref<any[]>([]);
    const textSearch = ref<string>('');
    const loading = ref<boolean>(false);
    const count = ref<any>({});
    const countHold = ref<any>({});
    const decodeDT = ref<any>(['Transcriptome', 'ATAC', 'Cut&Tag', 'Atlas', 'Rong', 'Hurd']);
    const decodeDTTwo = ref<any[]>(['Spatial Transcriptome', 'Spatial ATAC', 'Spatial Cut & Tag', 'Atlas', 'Rong Lab', 'Hurd Lab']);
    const labColors = ref<any>({ Atlas: '#ac2c34', Rong: '#182c3c', Hurd: '#5D2C2C' });
    const menuListFlag = ref<boolean>(false);
    const pageIteration = ref<number>(1);
    const numOfIt = ref<number>(0);
    const arrayOfAllRuns = ref<any[]>([]);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    function checkBoxSort(ev: string, title: any) {
      pageIteration.value = 1;
      loading.value = true;
      let pubsValues = [...Object.values(numOfPubs.value)];
      let allData: any[] = [];
      let key = '1';
      let labs = allData.concat.apply([], pubsValues);
      let split = 0;
      numOfPubsHold.value = {};
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
      const hold: any = {};
      let modCount = -1;
      if (checkBoxArr.value.length > 0) {
        labs.forEach((value: any, index: any) => {
          const bool: boolean[] = [];
          checkBoxArr.value.forEach((elements: any) => {
            if (elements.title === 'Groups') {
              if (decodeDT.value[decodeDTTwo.value.indexOf(elements.key.trim())] === value.Group_Name.trim()) bool.push(true);
              else bool.push(false);
            }
            if (elements.title === 'Data Type') {
              if (value.Assay_Type.includes(decodeDT.value[decodeDTTwo.value.indexOf(elements.key.trim())])) bool.push(true);
              else bool.push(false);
            }
          });
          if (!bool.includes(false)) {
            modCount += 1;
            if (modCount % 8 === 0 && Object.keys(hold).length > 0) {
              key = (parseInt(key, 10) + 1).toString();
              split += 1;
            }
            if (!Object.keys(hold).includes(key)) hold[key] = [];
            hold[key].push(value);
          }
        });
        pubsValues = [...Object.values(hold)];
        allData = [];
        labs = allData.concat.apply([], pubsValues);
        labs.forEach((value: any, i: any) => {
          countHold.value[decodeDTTwo.value[decodeDT.value.indexOf(value.Group_Name)]] += 1;
          value.Assay_Type.forEach((v: any, k: any) => {
            countHold.value[decodeDTTwo.value[decodeDT.value.indexOf(v.trim())]] += 1;
          });
        });
        numOfIt.value = split;
        numOfPubsHold.value = hold;
      } else {
        numOfIt.value = Object.keys(numOfPubs.value).length - 1;
        lodash.each(numOfPubs.value, (value: any, index: any) => {
          numOfPubsHold.value[index] = value;
        });
        lodash.each(count.value, (v: any, i: any) => {
          countHold.value[i] = count.value[i];
        });
      }
      loading.value = false;
    }
    function searchRuns(event: string) {
      pageIteration.value = 1;
      const ev = event.toLowerCase();
      loading.value = true;
      let pubsValues = [...Object.values(numOfPubs.value)];
      let allData: any[] = [];
      let key = '1';
      let labs = allData.concat.apply([], pubsValues);
      let split = 0;
      const countKeys = Object.keys(countHold.value);
      countKeys.forEach((v: any, k: any) => {
        countHold.value[v] = 0;
      });
      if (ev.length === 0) {
        numOfIt.value = Object.keys(numOfPubs.value).length - 1;
        lodash.each(numOfPubs.value, (value: any, index: any) => {
          numOfPubsHold.value[index] = value;
        });
        lodash.each(count.value, (v: any, i: any) => {
          countHold.value[i] = count.value[i];
        });
      } else {
        const digpat = /\d/;
        const digit = digpat.test(ev);
        const hold: any = {};
        let modCount = -1;
        labs.forEach((value: any, index: any) => {
          if (digit) {
            if (ev === value.Pmid) {
              modCount += 1;
              if (modCount % 8 === 0 && Object.keys(hold).length > 0) {
                key = (parseInt(key, 10) + 1).toString();
                split += 1;
              }
              if (!Object.keys(hold).includes(key)) hold[key] = [];
              hold[key].push(value);
            }
          } else {
            value.Authors.forEach((auth: string, inde: any) => {
              if (auth.toLowerCase().trim().startsWith(ev)) {
                if (modCount % 8 === 0 && Object.keys(hold).length > 0) {
                  key = (parseInt(key, 10) + 1).toString();
                  split += 1;
                }
                if (!Object.keys(hold).includes(key)) hold[key] = [];
                if (!hold[key].includes(value)) hold[key].push(value);
              }
            });
          }
        });
        modCount += hold.length;
        pubsValues = [...Object.values(hold)];
        allData = [];
        labs = allData.concat.apply([], pubsValues);
        numOfPubsHold.value = hold;
        numOfIt.value = split;
        labs.forEach((value: any, i: any) => {
          countHold.value[decodeDTTwo.value[decodeDT.value.indexOf(value.Group_Name)]] += 1;
          value.Assay_Type.forEach((v: any, k: any) => {
            countHold.value[decodeDTTwo.value[decodeDT.value.indexOf(v.trim())]] += 1;
          });
        });
      }
      loading.value = false;
    }
    function nextPageIteration(ev: any) {
      pageIteration.value = ev;
      // kmdnkasndk
    }
    async function runSpatial(runObject: any) {
      const path = runObject.Run_ID;
      const existingCookie = readCookie();
      const split = existingCookie?.token.split('JWT ')[1];
      const geneFileName = `data/${path}/h5/obj/gene.csv`;
      const motifFileName = `data/${path}/h5/obj/motif.csv`;
      const tixelFileName = `data/${path}/h5/obj/data.csv`;
      const motifH5ad = `data/${path}/h5/obj/motifs.h5ad`;
      const geneH5ad = `data/${path}/h5/obj/genes.h5ad`;
      const motifCsv = `data/${path}/h5/obj/motifs.csv`;
      const { encoded: filenameToken } = await client.value!.encodeLink({ args: [tixelFileName, geneFileName, motifFileName, geneH5ad, motifH5ad, motifCsv], meta: { run_id: path, species: runObject.Species, tissue: runObject.Tissue } });
      const { host } = window.location;
      const publicLink = `http://${host}/public?component=PublicGeneViewer&run_id=${filenameToken}&public=true&token=JWT%20${split}`;
      router.push(`public?component=PublicGeneViewer&run_id=${filenameToken}&public=true&token=JWT%20${split}`);
      pushByQuery({ component: 'PublicGeneViewer', run_id: filenameToken, public: 'true', token: existingCookie?.token });
    }
    async function getData() {
      loading.value = true;
      /* eslint-disable no-await-in-loop */
      const allRuns = await client.value?.getPublicRuns();
      numOfIt.value = (Math.ceil(allRuns.length / 8) - 1);
      const split = makearray(0, allRuns.length, (Math.ceil(allRuns.length / 8) + 1));
      const data: any = {};
      const labs: any[] = [];
      const type: any[] = [];
      const precount: any = {};
      let key = '1';
      allRuns.forEach((json: any, index: any) => {
        if (split.includes(index)) key = (parseInt(key, 10) + 1).toString();
        if (!Object.keys(data).includes(key)) data[key] = [];
        if (!labs.includes(decodeDTTwo.value[decodeDT.value.indexOf(json.Group_Name)])) labs.push(decodeDTTwo.value[decodeDT.value.indexOf(json.Group_Name)]);
        if (!type.includes(decodeDTTwo.value[decodeDT.value.indexOf(json.Assay_Type)])) type.push(decodeDTTwo.value[decodeDT.value.indexOf(json.Assay_Type)]);
        if (!Object.keys(precount).includes(decodeDTTwo.value[decodeDT.value.indexOf(json.Group_Name)])) precount[decodeDTTwo.value[decodeDT.value.indexOf(json.Group_Name)]] = 1;
        else precount[decodeDTTwo.value[decodeDT.value.indexOf(json.Group_Name)]] += 1;
        if (!Object.keys(precount).includes(decodeDTTwo.value[decodeDT.value.indexOf(json.Assay_Type)])) precount[decodeDTTwo.value[decodeDT.value.indexOf(json.Assay_Type)]] = 1;
        else precount[decodeDTTwo.value[decodeDT.value.indexOf(json.Assay_Type)]] += 1;
        const updateJson = json;
        updateJson.Authors = [...updateJson.Authors.split(',')];
        updateJson.Assay_Type = [...updateJson.Assay_Type.split(',')];
        if (updateJson.Description.match(/\d+\s+um/)) {
          const findUM = updateJson.Description.match(/\d+\s+um/)[0].replace('u', '\xB5');
          const newText = updateJson.Description.replace(/\d+\s+um/, findUM);
          updateJson.Description = newText;
        }
        arrayOfAllRuns.value.push(updateJson);
        data[key].push(updateJson);
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
      menuListFlag,
      pageIteration,
      nextPageIteration,
      numOfIt,
      arrayOfAllRuns,
      labColors,
    };
  },
});
</script>

<style scoped>
  #resize-butt {
    min-width: 44px !important;
  }
</style>
