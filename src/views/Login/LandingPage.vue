<template>
  <v-container fluid>
    <v-app-bar v-if="client.user === null">
      <div>
        <v-img width="264px" src="company_logo.png"></v-img>
      </div>
      <v-spacer></v-spacer>
      <v-btn medium color="black" text @click="redirectToLogin">Sign In</v-btn>
    </v-app-bar>
    <v-row no-gutters style="margin-top:10px">
      <v-col cols="12" sm="3" style="padding-left:10px">
        <v-card :loading="loading" flat dense>
          <v-card-title>Filters</v-card-title>
          <v-divider style="width:91%"/>
          <template v-for="item in groupsAndData">
            <v-card-actions style="padding:0; max-height: 50px;" v-bind:key="item.title">
              <v-card-title>{{item.title}}</v-card-title>
              <v-spacer></v-spacer>
              <v-btn
                icon
                @click="item.active = !item.active">
                <v-icon>{{ item.active ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </v-btn>
            </v-card-actions>
            <template v-if="item.active">
              <template v-if="!item.limit">
                <template v-for="child in item.items">
                  <v-card-actions style="padding:0;max-height: 50px;" v-bind:key="child">
                    <template v-if="item.title === 'Data Type'"><v-checkbox color="black" :disabled="(countHold[child] == 0 ? true : false)" :key="child" :label="`${child} (${countHold[child]})`" @click="checkBoxSort(child, item.title)"></v-checkbox></template>
                    <template v-else-if="item.title === 'Species'"><v-checkbox color="black" :disabled="(countHold[child] == 0 ? true : false)" :key="child" :label="`${child.replace('_', ' ')} (${countHold[child]})`" @click="checkBoxSort(child, item.title)"></v-checkbox></template>
                    <template v-else-if="item.title === 'Organ'"><v-checkbox color="black" :disabled="(countHold[child] == 0 ? true : false)" :key="child" :label="`${child.replace('_', ' ')} (${countHold[child]})`" @click="checkBoxSort(child, item.title)"></v-checkbox></template>
                    <template v-else><v-checkbox color="black" :disabled="(countHold[child] == 0 ? true : false)" :key="child" :label="`${child} (${countHold[child]})`" @click="checkBoxSort(child, item.title)"></v-checkbox></template>
                  </v-card-actions>
                </template>
              </template>
              <template v-else>
                <template v-for="(place,child) in 3">
                  <v-card-actions style="padding:0;max-height: 50px;" v-bind:key="item.items[child]">
                    <template v-if="item.title === 'Data Type'"><v-checkbox  color="black" :disabled="(countHold[item.items[child]] == 0 ? true : false)" :key="item.items[child]" :label="`${child} (${countHold[item.items[child]]})`" @click="checkBoxSort(item.items[child], item.title)"></v-checkbox></template>
                    <template v-else-if="item.title === 'Species'"><v-checkbox  color="black" :disabled="(countHold[item.items[child]] == 0 ? true : false)" :key="item.items[child]" :label="`${item.items[child].replace('_', ' ')} (${countHold[item.items[child]]})`" @click="checkBoxSort(item.items[child], item.title)"></v-checkbox></template>
                    <template v-else-if="item.title === 'Organ'"><v-checkbox  color="black" :disabled="(countHold[item.items[child]] == 0 ? true : false)" :key="item.items[child]" :label="`${item.items[child].replace('_', ' ')} (${countHold[item.items[child]]})`" @click="checkBoxSort(item.items[child], item.title)"></v-checkbox></template>
                    <template v-else><v-checkbox  color="black" :disabled="(countHold[item.items[child]] == 0 ? true : false)" :key="item.items[child]" :label="`${item.items[child]} (${countHold[item.items[child]]})`" @click="checkBoxSort(item.items[child], item.title)"></v-checkbox></template>
                  </v-card-actions>
                </template>
              </template>
              <v-card-actions v-bind:key="item.title+item.active">
                <v-btn :disabled="(item.length <= 3) ? true : false" small text color="blue" @click="item.limit = !item.limit">{{(!item.limit) ? 'Show Less' : 'Show More'}}</v-btn>
              </v-card-actions>
            </template>
          </template>
        </v-card>
      </v-col>
      <v-col cols="12" sm="8" style="padding-right:10px">
        <v-row>
          <v-col cols="12" sm="7">
            <v-text-field
              :loading="loading"
              v-model="textSearch"
              @input="searchRuns(textSearch, $event.key);"
              @click:prepend="searchRuns(textSearch, '')"
              @keyup.enter="searchRuns(textSearch, '')"
              @click:clear="searchRuns('', '')"
              placeholder="Search eg. PMID, Author"
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
          <template v-for="data in numOfPubsHold[pageIteration]" >
            <template v-if="data.result_description !== null">
              <v-card :style="{'border-top': `6px solid ${labColors[data.group]}`}" v-bind:key="data.results_folder_path">
                <v-row>
                  <v-col cols="12" sm="8">
                    <v-card-title style="cursor: pointer;" @click="runSpatial(data)">{{data.result_title}}</v-card-title>
                    <v-card-subtitle>{{data.date}} <v-icon v-if="data.link !== null" small color="blue">mdi-paperclip</v-icon><a v-if="data.link !== null" style="color:#2196f3;text-decoration: none;" target="_blank" :href="data.link">Publication </a><b v-if="data.link !== null">({{data.journal}})</b> </v-card-subtitle>
                    <v-card-text>{{data.result_description}}</v-card-text>
                    <v-card-text>{{`Experimental Condition: ${data.experimental_condition}${(data.epitope !== null) ? `; Antibody: ${data.epitope}` : ''}`}}</v-card-text>
                    <v-card-subtitle v-for="keys in data.assay" v-bind:key="keys"><v-chip small dark :color="labColors[data.group]">{{keys}}</v-chip></v-card-subtitle>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <div style="height:inherit; width: 100%;">
                      <img style="position: absolute;right: 0;height: 200px;width: 200px; max-width: 200px;max-height:200px;margin-top:5px" :src="data.imageLink"/>
                    </div>
                  </v-col>
                </v-row>
              </v-card>
            </template>
            <template v-else>
              <v-card :style="{'border-top': `6px solid ${labColors[data.group]}`}" v-bind:key="data.results_folder_path+data.run_id">
                <v-row>
                  <v-col cols="12" sm="8">
                    <v-card-title style="cursor: pointer;" @click="runSpatial(data)">{{`Spatial ${data.assay.join('/')} data of ${data.species.split('_').join(' ')} ${(!data.organ.includes('_') ? data.organ : data.organ.split('_').join(' '))}`}}</v-card-title>
                    <v-card-subtitle>{{data.date}}</v-card-subtitle>
                    <v-card-text>{{`Experimental Condition: ${data.experimental_condition} ${(data.epitope !== null) ? `Epitope: ${data.epitope}/ Regulation: ${data.regulation}` : ''}`}}</v-card-text>
                    <v-card-subtitle v-for="keys in data.assay" v-bind:key="data.results_id+keys"><v-chip small dark :color="labColors[data.group]">{{keys}}</v-chip></v-card-subtitle>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <div style="height:inherit; width: 100%;">
                      <v-img style="position: absolute;right: 0;height: 200px;width: 200px; max-width: 200px;max-height:200px;margin-top: 5px;" :src="data.imageLink"/>
                    </div>
                  </v-col>
                </v-row>
              </v-card>
            </template>
            <div style="width:100%; height:20px" v-bind:key="data.results_id"></div>
          </template>`
        </template>
        <template v-else>
          <v-list two-line>
          <v-list-item-group
            multiple>
            <template v-for="data in numOfPubsHold[pageIteration]">
              <template v-if="data.run_id === null">
                <v-list-item  @click="runSpatial(data)" v-bind:key="data.results_folder_path+data.run_id">
                    <v-list-item-content>
                      <v-list-item-title>{{data.result_title}}</v-list-item-title>
                      <v-list-item-subtitle
                        v-text="data.date"
                      ></v-list-item-subtitle>
                      <v-list-item-subtitle class="text--primary" v-text="data.result_description"></v-list-item-subtitle>
                      <v-list-item-subtitle v-for="keys in data.assay" v-bind:key="keys"><v-chip small dark :color="labColors[data.group]">{{keys}}</v-chip></v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
              </template>
              <template v-else>
                <v-list-item  @click="runSpatial(data)" v-bind:key="data.results_folder_path">
                    <v-list-item-content>
                      <v-list-item-title>{{`NGSID: ${data.ngs_id} / DbitID: ${data.run_id}`}}</v-list-item-title>
                      <v-list-item-subtitle
                        v-text="data.date"
                      ></v-list-item-subtitle>
                      <v-list-item-subtitle class="text--primary" v-text="`Experimental Condition: ${data.experimental_condition}`"></v-list-item-subtitle>
                      <v-list-item-subtitle v-for="keys in data.assay" v-bind:key="keys"><v-chip small dark :color="labColors[data.group]">{{keys}}</v-chip></v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
              </template>
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
import { login, isClient, Client } from '@/api';
import lodash, { lte, update } from 'lodash';
import { loggedIn, saveCookie, readCookie, logout } from '@/utils/auth';
import { generateRouteByQuery } from '@/utils';
import store from '@/store';
import { SERVER_URL, TEST_SERVER_URL, PROD_SERVER_URL } from '@/environment';
import colormap from 'colormap';

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
  props: ['query'],
  setup(props, ctx) {
    // NOTE: May need to be computed ref
    const router = ctx.root.$router;
    const currentRoute = computed(() => ctx.root.$route);
    const user = computed(() => (store.state.client === null ? '' : store.state.client?.user));
    const client = computed(() => ((store.state.client === null) ? new Client(PROD_SERVER_URL, '') : store.state.client));
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
    const labColors = ref<any>({});
    const menuListFlag = ref<boolean>(false);
    const pageIteration = ref<number>(1);
    const numOfIt = ref<number>(0);
    const arrayOfAllRuns = ref<any[]>([]);
    const jwtToken = ref<string>('');
    const showMoreFlag = ref<number>(-1);
    const indexOfRuns = ref<any>({});
    function redirectToLogin() {
      router.push('/login');
    }
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
              if (elements.key.trim() === value.group.trim()) bool.push(true);
              else bool.push(false);
            }
            if (elements.title === 'Data Type') {
              if (value.assay.includes(elements.key.trim())) bool.push(true);
              else bool.push(false);
            }
            if (elements.title === 'Organ') {
              if (elements.key.trim() === value.organ.trim()) bool.push(true);
              else bool.push(false);
            }
            if (elements.title === 'Species') {
              if (elements.key.trim() === value.species.trim()) bool.push(true);
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
          countHold.value[value.group] += 1;
          value.assay.forEach((v: any, k: any) => {
            countHold.value[v.trim()] += 1;
          });
          countHold.value[value.species] += 1;
          countHold.value[value.organ] += 1;
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
    async function searchRuns(event: string, from: any) {
      /* eslint-disable no-lonely-if */
      console.log(from);
      if (event === null || event.length === 0 || from === undefined) {
        console.log('e,mpty');
        numOfIt.value = Object.keys(numOfPubs.value).length - 1;
        lodash.each(numOfPubs.value, (value: any, index: any) => {
          numOfPubsHold.value[index] = value;
        });
        lodash.each(count.value, (v: any, i: any) => {
          countHold.value[i] = count.value[i];
        });
      } else {
        pageIteration.value = 1;
        const ev = event.toLowerCase();
        loading.value = true;
        let key = '1';
        let split = 0;
        const countKeys = Object.keys(countHold.value);
        countKeys.forEach((v: any, k: any) => {
          countHold.value[v] = 0;
        });
        const digpat = /\d/;
        const digit = digpat.test(ev);
        const hold: any = {};
        let modCount = -1;
        if (digit) {
          const lab = await client.value.searchPMID(ev);
          lab.forEach((value: any, i: any) => {
            const correctRun = indexOfRuns.value[value.results_id];
            modCount += 1;
            if (modCount % 8 === 0 && Object.keys(hold).length > 0) {
              key = (parseInt(key, 10) + 1).toString();
              split += 1;
            }
            if (!Object.keys(hold).includes(key)) hold[key] = [];
            hold[key].push(correctRun);
            countHold.value[correctRun.group] += 1;
            correctRun.assay.forEach((v: any, k: any) => {
              countHold.value[v.trim()] += 1;
            });
            countHold.value[correctRun.species] += 1;
            countHold.value[correctRun.organ] += 1;
          });
          numOfIt.value = split;
          numOfPubsHold.value = hold;
        } else {
          const lab = await client.value.searchAuthors(ev);
          const foundIds: any[] = [];
          lab.forEach((value: any, i: any) => {
            const correctRun = indexOfRuns.value[value.results_id];
            if (!foundIds.includes(correctRun.results_id)) {
              foundIds.push(correctRun.results_id);
              modCount += 1;
              if (modCount % 8 === 0 && Object.keys(hold).length > 0) {
                key = (parseInt(key, 10) + 1).toString();
                split += 1;
              }
              if (!Object.keys(hold).includes(key)) hold[key] = [];
              hold[key].push(correctRun);
              countHold.value[correctRun.group] += 1;
              correctRun.assay.forEach((v: any, k: any) => {
                countHold.value[v.trim()] += 1;
              });
              countHold.value[correctRun.species] += 1;
              countHold.value[correctRun.organ] += 1;
            }
          });
          numOfIt.value = split;
          numOfPubsHold.value = hold;
        }
      }
      loading.value = false;
    }
    function nextPageIteration(ev: any) {
      pageIteration.value = ev;
      // kmdnkasndk
    }
    async function runSpatial(runObject: any) {
      const matchPath = runObject.results_folder_path.match(/(data\/)(.+)(\/)/);
      const xploreId = matchPath[2];
      if (client.value!.user === null) {
        const geneFileName = `data/${xploreId}/h5/geneNames.txt`;
        const motifFileName = `data/${xploreId}/h5/motifNames.txt`;
        const tixelFileName = `data/${xploreId}/h5/data.csv`;
        const motifH5ad = `data/${xploreId}/h5/obj/motifs.h5ad`;
        const geneH5ad = `data/${xploreId}/h5/obj/genes.h5ad`;
        const motifCsv = `data/${xploreId}/h5/obj/motifs.csv`;
        const { encoded: filenameToken } = await client!.value!.encodeLink({ args: [tixelFileName, geneFileName, motifFileName, geneH5ad, motifH5ad, motifCsv], meta: { run_id: xploreId, species: runObject.species, tissue: runObject.organ, assay: runObject.assay } });
        store.commit.setXploreData(runObject);
        router.push(`public?component=PublicGeneViewer&run_id=${filenameToken.trim()}&public=true&token=${jwtToken.value.trim()}`);
        // pushByQuery({ component: 'PublicGeneViewer', run_id: filenameToken, public: 'true', token: `JWT ${jwtToken.value}` });
      } else {
        store.commit.setXploreData(runObject);
        pushByQuery({ component: 'AtlasXplore', run_id: xploreId });
      }
    }
    function grabImages(path: string, pub: number, group: string) {
      let imageLink = '';
      const matchPath = path.match(/(data\/)(.+)(\/)/);
      const xploreId = matchPath![2];
      if (pub !== 1) imageLink = `${group}/frontPage_${xploreId}.png`;
      else imageLink = `frontPage_${xploreId}.png`;
      return imageLink;
    }
    async function getData() {
      loading.value = true;
      /* eslint-disable no-await-in-loop */
      const allRuns = await client?.value!.getPublicRuns();
      numOfIt.value = (Math.ceil(allRuns.length / 8) - 1);
      const split = makearray(0, allRuns.length, (Math.ceil(allRuns.length / 8) + 1));
      const data: any = {};
      const labs: any[] = [];
      const type: any[] = [];
      const species: any[] = [];
      const organ: any[] = [];
      const precount: any = {};
      const raw_group: any = [];
      const indexingRuns: any = {};
      let key = '1';
      for (let index = 0; index < allRuns.length; index += 1) {
        const json = allRuns[index];
        if (split.includes(index)) key = (parseInt(key, 10) + 1).toString();
        if (!Object.keys(data).includes(key)) data[key] = [];
        if (!raw_group.includes(json.group)) raw_group.push(json.group);
        if (!labs.includes(json.group)) labs.push(json.group);
        if (!organ.includes(json.organ)) organ.push(json.organ);
        if (!species.includes(json.species)) species.push(json.species);
        if (!type.includes(json.assay)) type.push(json.assay);
        if (!Object.keys(precount).includes(json.group)) precount[json.group] = 1;
        else precount[json.group] += 1;
        if (!Object.keys(precount).includes(json.assay)) precount[json.assay] = 1;
        else precount[json.assay] += 1;
        if (!Object.keys(precount).includes(json.organ)) precount[json.organ] = 1;
        else precount[json.organ] += 1;
        if (!Object.keys(precount).includes(json.species)) precount[json.species] = 1;
        else precount[json.species] += 1;
        const updateJson = json;
        const convertedTime = new Date(json.date);
        updateJson.date = convertedTime.toDateString();
        indexingRuns[updateJson.results_id] = updateJson;
        updateJson.imageLink = grabImages(json.results_folder_path, json.public, json.group);
        updateJson.assay = [...updateJson.assay.split(',')];
        if (updateJson.result_description !== null && updateJson.result_description.match(/\d+\s+um/)) {
          const findUM = updateJson.result_description.match(/\d+\s+um/)[0].replace('u', '\xB5');
          const newText = updateJson.result_description.replace(/\d+\s+um/, findUM);
          updateJson.result_description = newText;
        }
        arrayOfAllRuns.value.push(updateJson);
        data[key].push(updateJson);
      }
      labs.sort();
      type.sort();
      organ.sort();
      species.sort();
      groupsAndData.value.push({
        action: 'mdi-ticket',
        active: true,
        limit: labs.length > 3,
        length: labs.length,
        items: [...labs],
        title: 'Groups',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        active: true,
        limit: type.length > 3,
        length: type.length,
        items: [...type],
        title: 'Data Type',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        active: true,
        limit: species.length > 3,
        length: species.length,
        items: [...species],
        title: 'Species',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        active: true,
        limit: organ.length > 3,
        length: organ.length,
        items: [...organ],
        title: 'Organ',
      });
      lodash.each(precount, (v: any, i: any) => {
        countHold.value[i] = v;
        count.value[i] = v;
      });
      const mult = (labs.length < 9) ? 9 : labs.length;
      const colors_raw = colormap({ colormap: 'phase', nshades: mult * 3, format: 'hex', alpha: 1 });
      raw_group.forEach((v: string, i: any) => {
        const correct = (i === 0) ? 0 : (i + 1) * 3;
        labColors.value[v] = colors_raw[correct];
      });
      indexOfRuns.value = indexingRuns;
      numOfPubs.value = data;
      numOfPubsHold.value = data;
      loading.value = false;
    }
    async function getSecureData() {
      loading.value = true;
      const allRuns = await client?.value!.getPublicRuns();
      numOfIt.value = (Math.ceil(allRuns.length / 8) - 1);
      const split = makearray(0, allRuns.length, (Math.ceil(allRuns.length / 8) + 1));
      const data: any = {};
      const labs: any[] = [];
      const type: any[] = [];
      const organ: any[] = [];
      const species: any[] = [];
      const precount: any = {};
      const raw_group: any = [];
      const indexingRuns: any = {};
      let key = '1';
      for (let index = 0; index < allRuns.length; index += 1) {
        const json = allRuns[index];
        if (split.includes(index)) key = (parseInt(key, 10) + 1).toString();
        if (!Object.keys(data).includes(key)) data[key] = [];
        if (Object.keys(json).includes('group')) {
          if (!raw_group.includes(json.group)) raw_group.push(json.group);
          if (!labs.includes(json.group)) labs.push(json.group);
          if (!organ.includes(json.organ)) organ.push(json.organ);
          if (!species.includes(json.species)) species.push(json.species);
          if (!type.includes(json.assay)) type.push(json.assay);
          if (!Object.keys(precount).includes(json.group)) precount[json.group] = 1;
          else precount[json.group] += 1;
          if (!Object.keys(precount).includes(json.assay)) precount[json.assay] = 1;
          else precount[json.assay] += 1;
          if (!Object.keys(precount).includes(json.organ)) precount[json.organ] = 1;
          else precount[json.organ] += 1;
          if (!Object.keys(precount).includes(json.species)) precount[json.species] = 1;
          else precount[json.species] += 1;
          const updateJson = json;
          const convertedTime = new Date(json.date);
          updateJson.date = convertedTime.toDateString();
          updateJson.assay = [...updateJson.assay.split(',')];
          indexingRuns[updateJson.results_id] = updateJson;
          updateJson.imageLink = grabImages(json.results_folder_path, json.public, json.group);
          if (updateJson.result_description !== null && updateJson.result_description.match(/\d+\s+um/)) {
            const findUM = updateJson.result_description.match(/\d+\s+um/)[0].replace('u', '\xB5');
            const newText = updateJson.result_description.replace(/\d+\s+um/, findUM);
            updateJson.result_description = newText;
          }
          arrayOfAllRuns.value.push(updateJson);
          data[key].push(updateJson);
        }
      }
      labs.sort();
      type.sort();
      organ.sort();
      species.sort();
      groupsAndData.value.push({
        action: 'mdi-ticket',
        active: true,
        limit: labs.length > 3,
        length: labs.length,
        items: [...labs],
        title: 'Groups',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        active: true,
        limit: type.length > 3,
        length: type.length,
        items: [...type],
        title: 'Data Type',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        active: true,
        limit: species.length > 3,
        length: species.length,
        items: [...species],
        title: 'Species',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        active: true,
        limit: organ.length > 3,
        length: organ.length,
        items: [...organ],
        title: 'Organ',
      });
      lodash.each(precount, (v: any, i: any) => {
        countHold.value[i] = v;
        count.value[i] = v;
      });
      const mult = (labs.length < 9) ? 9 : labs.length;
      const colors_raw = colormap({ colormap: 'phase', nshades: mult * 3, format: 'hex', alpha: 1 });
      raw_group.forEach((v: string, i: any) => {
        const correct = (i === 0) ? 0 : (i + 1) * 3;
        labColors.value[v] = colors_raw[correct];
      });
      indexOfRuns.value = indexingRuns;
      numOfPubs.value = data;
      numOfPubsHold.value = data;
      loading.value = false;
    }
    onMounted(async () => {
      if (client.value!.user === null) {
        if (client.value.authorizationToken.length === 0) {
          const go = await client.value!.logIntoPublic();
          store.commit.setClient(await Client.CreatePublic(PROD_SERVER_URL, `JWT ${go.token}`));
          jwtToken.value = `JWT%20${go.token}`;
        } else jwtToken.value = client.value.authorizationToken;
        store.commit.setXploreData(null);
        getData();
      } else getSecureData();
    });

    return {
      SERVER_URL,
      getData,
      getSecureData,
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
      numOfPubsHold,
      checkBoxArr,
      searchRuns,
      textSearch,
      loading,
      count,
      countHold,
      menuListFlag,
      pageIteration,
      nextPageIteration,
      numOfIt,
      arrayOfAllRuns,
      labColors,
      redirectToLogin,
      jwtToken,
      user,
      showMoreFlag,
      indexOfRuns,
      grabImages,
    };
  },
});
</script>

<style scoped>
  #resize-butt {
    min-width: 44px !important;
  }
</style>
