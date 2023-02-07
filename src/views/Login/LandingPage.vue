<template>
  <v-container fluid>
    <v-app-bar v-if="client.user === null">
      <div>
        <v-img width="264px" src="https://web.atlasxomics.com/company_logo.png"></v-img>
      </div>
      <v-spacer></v-spacer>
      <v-btn medium color="black" text @click="redirectToLogin">Sign In</v-btn>
    </v-app-bar>
    <!-- Filtering side bar menu -->
    <v-row no-gutters style="margin-top:10px">
      <v-col cols="12" sm="3" style="padding-left:10px">
        <v-card :loading="loading" flat dense>
          <v-card-title>Filters</v-card-title>
          <v-divider style="width:91%"/>
          <v-list>
            <v-list-group
              style="padding:0"
              v-for="item in groupsAndData"
              :key="item.title"
              v-model="item.active"
              sub-group>
              <template v-slot:activator>
                <v-list-item-content style="padding:0; max-height: 50px;">
                  <v-list-item-title v-text="item.title"></v-list-item-title>
                </v-list-item-content>
              </template>
              <div>
                <template v-for="(place,child) in item.palceHolder" >
                  <template v-if="item.title === 'Species'"><v-checkbox color="black" :disabled="(countHold[item.items[child]] == 0 ? true : false)" :key="item.items[child]" :label="`${item.items[child].replace('_', ' ')} (${countHold[item.items[child]]})`" @click="checkBoxSort(item.items[child], item.title)"></v-checkbox></template>
                  <template v-else-if="item.title === 'Organ'"><v-checkbox color="black" :disabled="(countHold[item.items[child]] == 0 ? true : false)" :key="item.items[child]" :label="`${item.items[child].replace('_', ' ')} (${countHold[item.items[child]]})`" @click="checkBoxSort(item.items[child], item.title)"></v-checkbox></template>
                  <template v-else><v-checkbox :input-value="item.items[child] == group_from_url" color="black" :disabled="(countHold[item.items[child]] == 0 ? true : false)" :key="item.items[child]" :label="`${item.items[child]} (${countHold[item.items[child]]})`" @click="checkBoxSort(item.items[child], item.title)"></v-checkbox></template>
                </template>
                <span v-show="!item.limit"></span>
                <span v-show="item.limit">
                  <template v-for="child in Array.from({length:item.length - 3},(v,k)=>k+3)" >
                    <template v-if="item.title === 'Species'"><v-checkbox color="black" :disabled="(countHold[item.items[child]] == 0 ? true : false)" :key="item.items[child]" :label="`${item.items[child].replace('_', ' ')} (${countHold[item.items[child]]})`" @click="checkBoxSort(item.items[child], item.title)"></v-checkbox></template>
                    <template v-else-if="item.title === 'Organ'"><v-checkbox color="black" :disabled="(countHold[item.items[child]] == 0 ? true : false)" :key="item.items[child]" :label="`${item.items[child].replace('_', ' ')} (${countHold[item.items[child]]})`" @click="checkBoxSort(item.items[child], item.title)"></v-checkbox></template>
                    <template v-else><v-checkbox :input-value="item.items[child] == group_from_url" color="black" :disabled="(countHold[item.items[child]] == 0 ? true : false)" :key="item.items[child]" :label="`${item.items[child]} (${countHold[item.items[child]]})`" @click="checkBoxSort(item.items[child], item.title)"></v-checkbox></template>
                  </template>
                </span>
              </div>
              <v-list-item v-if="(item.length > 3)"><v-btn :disabled="(item.length <= 3) ? true : false" small text color="blue" @click="item.limit = !item.limit">{{(!item.limit) ? 'Show More' : 'Show Less'}}</v-btn></v-list-item>
            </v-list-group>
          </v-list>
        </v-card>
      </v-col>
      <!-- Search box  -->
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
          <!-- private public toggle-->
          <v-col cols="12" sm="3" class="d-flex justify-center align-center mt-4">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  :disabled="(client.user === null) ? true : false"
                  :color="(pubPrivFlag) ? 'green' : ''"
                  icon
                  x-large
                  depressed
                  plain
                  retain-focus-on-click
                  @click="publicPrivateView">
                  <v-icon>{{ pubPrivFlag ? 'mdi-toggle-switch-off' : 'mdi-toggle-switch' }}</v-icon>
                </v-btn>
              </template>
              <span>{{`${(!pubPrivFlag) ? 'Show Public' : 'Show Private'}`}}</span>
            </v-tooltip>
          </v-col>
          <!-- toggle of full cards or list of runs -->
          <v-col cols="12" sm="2" class="mt-4">
            <v-row>
              <v-col cols="6" sm="3">
                <v-btn :ripple="false" plain depressed large :color="(menuListFlag) ? 'blue' : 'black'" icon @click="menuListFlag = !menuListFlag"><v-icon>mdi-menu</v-icon></v-btn>
              </v-col>
              <v-col cols="6" sm="3">
                <v-btn :ripple="false" plain depressed large :color="(!menuListFlag) ? 'blue' : 'black'" icon @click="menuListFlag = !menuListFlag"><v-icon>mdi-picture-in-picture-top-right-outline</v-icon></v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <!-- view where each run has a card -->
        <template v-if="!menuListFlag">
          <template v-for="data in numOfPubsHold[pageIteration]" >
            <v-card :style="{'border-top': `6px solid ${labColors[data.group]}`}" v-bind:key="data.results_folder_path" height="245px">
              <v-row>
                <v-col cols="12" sm="8">
                  <v-card-title style="cursor: pointer;" @click="runSpatial(data)">{{data.result_title}}</v-card-title>
                  <v-card-subtitle>{{data.date}} <v-icon v-if="data.link !== null" small color="blue">mdi-paperclip</v-icon><a v-if="data.link !== null" style="color:#2196f3;text-decoration: none;" target="_blank" :href="data.link">Publication </a><b v-if="data.link !== null">({{data.journal}})</b> </v-card-subtitle>
                  <v-card-text>{{`${data.result_description}, Experimental Condition: ${data.experimental_condition}${(data.epitope !== null) ? `; Antibody: ${data.epitope}` : ''}`}}</v-card-text>
                  <v-card-actions> <v-icon
                  @click="download_option_clicked(data)"
                  > mdi-download </v-icon> </v-card-actions>
                </v-col>
                <!-- section of card with image -->
                <v-col cols="12" sm="4">
                  <div style="height:inherit; width: 100%;" @click="edit_result(data.run_id)">
                    <img style="position: absolute;right: 0;height: 200px; max-width: 200px;max-height:200px;margin-top:10px;margin-right:7px;" :src="data.imageLink"/>
                  </div>
                </v-col>
              </v-row>
            </v-card>
            <div style="width:100%; height:20px" v-bind:key="data.results_id"></div>
          </template>`
        </template>
        <template v-else>
          <v-list two-line>
          <v-list-item-group
            multiple>
            <template v-for="data in numOfPubsHold[pageIteration]">
              <v-list-item  @click="runSpatial(data)" v-bind:key="data.results_folder_path+data.run_id">
                  <v-list-item-content>
                    <v-list-item-title>{{data.result_title}}</v-list-item-title>
                    <v-list-item-subtitle
                      v-text="data.date"
                    ></v-list-item-subtitle>
                    <v-list-item-subtitle class="text--primary">{{`${data.result_description}, Experimental Condition: ${data.experimental_condition}${(data.epitope !== null) ? `; Antibody: ${data.epitope}` : ''}`}}</v-list-item-subtitle>
                    <v-list-item-subtitle><v-chip small dark :color="labColors[data.group]">{{data.assay}}</v-chip></v-list-item-subtitle>
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
import { login, isClient, Client } from '@/api';
import lodash, { lte, update } from 'lodash';
import { loggedIn, saveCookie, readCookie, logout, resolveAuthGroup } from '@/utils/auth';
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
    const jwtToken = ref<string>('');
    const showMoreFlag = ref<number>(-1);
    const indexOfRuns = ref<any>({});
    const pubPrivFlag = ref<boolean>(false);
    const allTheRuns = ref<any[]>([]);
    const privateRuns = ref<any[]>([]);
    const group_from_url = ref<string>('');
    function image_clicked() {
      console.log('image clicked');
    }
    function redirectToLogin() {
      router.push('/login');
    }
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    function edit_result(run_id: string) {
      if (resolveAuthGroup(['admin']) === false) return;
      const query = { component: 'AdminPanel', params: { action: 'edit', run_id } };
      const newRoute = generateRouteByQuery(currentRoute.value, query);
      router.push(newRoute);
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
              if (elements.key.trim() === value.assay.trim()) bool.push(true);
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
          countHold.value[value.assay] += 1;
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
    async function download_option_clicked(object: any) {
      console.log(object);
      const res = await client.value.get_file_info_run_id(object);
      console.log(res);
    }
    async function searchRuns(event: string, from: any) {
      /* eslint-disable no-lonely-if */
      if (event === null || event.length === 0 || from === undefined) {
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
          const availableIndex = Object.keys(indexOfRuns.value);
          lab.forEach((value: any, i: any) => {
            if (availableIndex.includes(value.results_id.toString())) {
              const correctRun = indexOfRuns.value[value.results_id];
              modCount += 1;
              if (modCount % 8 === 0 && Object.keys(hold).length > 0) {
                key = (parseInt(key, 10) + 1).toString();
                split += 1;
              }
              if (!Object.keys(hold).includes(key)) hold[key] = [];
              hold[key].push(correctRun);
              countHold.value[correctRun.group] += 1;
              countHold.value[correctRun.assay] += 1;
              countHold.value[correctRun.species] += 1;
              countHold.value[correctRun.organ] += 1;
            }
          });
          numOfIt.value = split;
          numOfPubsHold.value = hold;
        } else {
          const lab = await client.value.searchAuthors(ev);
          const foundIds: any[] = [];
          const availableIndex = Object.keys(indexOfRuns.value);
          lab.forEach((value: any, i: any) => {
            if (availableIndex.includes(value.results_id.toString())) {
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
                countHold.value[correctRun.assay] += 1;
                countHold.value[correctRun.species] += 1;
                countHold.value[correctRun.organ] += 1;
              }
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
        const geneFileName = `data/${xploreId}/h5/geneNames.txt.gz`;
        const motifFileName = `data/${xploreId}/h5/motifNames.txt.gz`;
        const tixelFileName = `data/${xploreId}/h5/data.csv.gz`;
        const motifH5ad = `data/${xploreId}/h5/obj/motifs.h5ad`;
        const geneH5ad = `data/${xploreId}/h5/obj/genes.h5ad`;
        const motifCsv = `data/${xploreId}/h5/obj/motifs.csv`;
        const { encoded: filenameToken } = await client!.value!.encodeLink({ args: [tixelFileName, geneFileName, motifFileName, geneH5ad, motifH5ad, motifCsv], meta: { run_id: xploreId, species: runObject.species, tissue: runObject.organ, assay: runObject.assay } });
        store.commit.setXploreData(runObject);
        router.push({ path: `/public?component=PublicGeneViewer&run_id=${filenameToken.trim()}&public=true&token=${jwtToken.value.trim()}`, replace: true });
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
      imageLink = `https://web.atlasxomics.com/frontpage_images/frontPage_${xploreId}.png`;
      return imageLink;
    }
    function get_display_date(date: any) {
      if ((typeof date) === 'string') {
        return date;
      }
      const convertedTime = new Date(0);
      convertedTime.setUTCMilliseconds(date);
      const date_readable = convertedTime.toUTCString();
      const [week_day, day_of_month, month, year, time, zone] = date_readable.split(' ');
      const final_string = week_day.concat(' '.concat(month.concat(' '.concat(day_of_month).concat(' '.concat(year)))));
      return final_string;
    }
    async function getData() {
      loading.value = true;
      /* eslint-disable no-await-in-loop */
      const allRuns = allTheRuns.value;
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
      allRuns.sort((a: any, b: any) => {
        const date1 = a.date;
        const date2 = b.date;
        if (date1 > date2) return -1;
        if (date1 < date2) return 1;
        return 0;
      });
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
        updateJson.date = get_display_date(updateJson.date);
        indexingRuns[updateJson.results_id] = updateJson;
        updateJson.imageLink = grabImages(json.results_folder_path, json.public, json.group);
        if (updateJson.result_description !== null && updateJson.result_description.match(/\d+\s+um/)) {
          const findUM = updateJson.result_description.match(/\d+\s+um/)[0].replace('u', '\xB5');
          const newText = updateJson.result_description.replace(/\d+\s+um/, findUM);
          updateJson.result_description = newText;
        }
        data[key].push(updateJson);
      }
      labs.sort();
      type.sort();
      organ.sort();
      species.sort();
      groupsAndData.value.push({
        action: 'mdi-ticket',
        palceHolder: (labs.length > 3) ? 3 : labs.length,
        active: true,
        limit: false,
        length: labs.length,
        items: [...labs],
        title: 'Groups',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        palceHolder: (type.length > 3) ? 3 : type.length,
        active: true,
        limit: false,
        length: type.length,
        items: [...type],
        title: 'Data Type',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        palceHolder: (species.length > 3) ? 3 : species.length,
        active: true,
        limit: false,
        length: species.length,
        items: [...species],
        title: 'Species',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        palceHolder: (organ.length > 3) ? 3 : organ.length,
        active: true,
        limit: false,
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
      if (group_from_url.value.length > 0) checkBoxSort(group_from_url.value, 'Groups');
      loading.value = false;
    }
    async function getSecureData(pubPriv: boolean) {
      loading.value = true;
      let allRuns = [];
      let split = [];
      groupsAndData.value = [];
      if (pubPriv) {
        allRuns = privateRuns.value;
        numOfIt.value = (Math.ceil(allRuns.length / 8) - 1);
        split = makearray(0, allRuns.length, (Math.ceil(allRuns.length / 8) + 1));
      } else {
        allRuns = allTheRuns.value;
        numOfIt.value = (Math.ceil(allRuns.length / 8) - 1);
        split = makearray(0, allRuns.length, (Math.ceil(allRuns.length / 8) + 1));
      }
      const data: any = {};
      const labs: any[] = [];
      const type: any[] = [];
      const organ: any[] = [];
      const species: any[] = [];
      const precount: any = {};
      const raw_group: any = [];
      const indexingRuns: any = {};
      let key = '1';
      allRuns.sort((a: any, b: any) => {
        const matchPath = a.results_folder_path.match(/(data\/)(.+)(\/)/);
        const matchPath2 = b.results_folder_path.match(/(data\/)(.+)(\/)/);
        const xploreId = matchPath[2];
        const xploreId2 = matchPath2[2];
        if (xploreId < xploreId2) return -1;
        if (xploreId > xploreId2) return 1;
        return 0;
      });
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
        updateJson.date = get_display_date(updateJson.date);
        indexingRuns[updateJson.results_id] = updateJson;
        updateJson.imageLink = grabImages(json.results_folder_path, json.public, json.group);
        if (updateJson.result_description !== null && updateJson.result_description.match(/\d+\s+um/)) {
          const findUM = updateJson.result_description.match(/\d+\s+um/)[0].replace('u', '\xB5');
          const newText = updateJson.result_description.replace(/\d+\s+um/, findUM);
          updateJson.result_description = newText;
        }
        data[key].push(updateJson);
      }
      labs.sort();
      type.sort();
      organ.sort();
      species.sort();
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
      const checkBoxArrCopy = checkBoxArr.value.map((v: any) => v);
      const groupsAndDataTitle = checkBoxArr.value.map((v: any) => v.title);
      checkBoxArr.value = [];
      if (checkBoxArrCopy.length > 0) {
        checkBoxArrCopy.forEach((arr: any, index: any) => {
          checkBoxSort(arr.key, arr.title);
        });
      }
      groupsAndData.value.push({
        action: 'mdi-ticket',
        palceHolder: (labs.length > 3) ? 3 : labs.length,
        active: true,
        limit: (groupsAndDataTitle.includes('Groups') && checkBoxArrCopy.length > 0),
        length: labs.length,
        items: [...labs],
        title: 'Groups',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        palceHolder: (type.length > 3) ? 3 : type.length,
        active: true,
        limit: (groupsAndDataTitle.includes('Data Type') && checkBoxArrCopy.length > 0),
        length: type.length,
        items: [...type],
        title: 'Data Type',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        palceHolder: (species.length > 3) ? 3 : species.length,
        active: true,
        limit: (groupsAndDataTitle.includes('Species') && checkBoxArrCopy.length > 0),
        length: species.length,
        items: [...species],
        title: 'Species',
      });
      groupsAndData.value.push({
        action: 'mdi-ticket',
        palceHolder: (organ.length > 3) ? 3 : organ.length,
        active: true,
        limit: (groupsAndDataTitle.includes('Organ') && checkBoxArrCopy.length > 0),
        length: organ.length,
        items: [...organ],
        title: 'Organ',
      });
      loading.value = false;
    }
    function publicPrivateView() {
      pubPrivFlag.value = !pubPrivFlag.value;
      if (!pubPrivFlag.value) getSecureData(true);
      if (pubPrivFlag.value) getSecureData(false);
    }
    onMounted(async () => {
      if (client.value!.user === null) {
        if (currentRoute.value.params.group) group_from_url.value = currentRoute.value.params.group;
        if (client.value.authorizationToken.length === 0) {
          const go = await client.value!.logIntoPublic();
          store.commit.setClient(await Client.CreatePublic(PROD_SERVER_URL, `JWT ${go.token}`));
          jwtToken.value = `JWT%20${go.token}`;
        } else jwtToken.value = client.value.authorizationToken;
        store.commit.setXploreData(null);
        allTheRuns.value = await client?.value!.getPublicRuns();
        privateRuns.value = allTheRuns.value.filter((v: any) => v.public !== 1);
        getData();
      } else {
        allTheRuns.value = await client?.value!.getPublicRuns();
        privateRuns.value = allTheRuns.value.filter((v: any) => v.public !== 1);
        if (privateRuns.value.length === 0) {
          pubPrivFlag.value = true;
          getSecureData(false);
        } else {
          getSecureData(true);
        }
      }
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
      download_option_clicked,
      loading,
      count,
      countHold,
      menuListFlag,
      pageIteration,
      nextPageIteration,
      numOfIt,
      labColors,
      redirectToLogin,
      jwtToken,
      user,
      showMoreFlag,
      indexOfRuns,
      grabImages,
      pubPrivFlag,
      allTheRuns,
      privateRuns,
      publicPrivateView,
      resolveAuthGroup,
      edit_result,
      group_from_url,
      image_clicked,
    };
  },
});
</script>

<style scoped>
  #resize-butt {
    min-width: 44px !important;
  }
</style>
