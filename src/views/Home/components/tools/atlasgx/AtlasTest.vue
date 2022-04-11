<template>
  <v-container fluid>
    <run-id-auto-complete v-model="runId" :filter="'tracks'" :multiple="false" label="Search Run ID" v-on:changed="onRunIdChanged"/>
    <track-browser :run_id="runId" :params="trackBrowserParams" :colormap="colorMap" :search_key="'Pex2'"/>
<!--     <fresh-dialog v-model="dialog" width="30%" height="30%">
      <v-card flat height="20vh" class="d-flex flex-column">
        <v-card-title>
          <run-id-auto-complete :filter="'/D'" :multiple="false" v-on:changed="onFilesChanged"/>
        </v-card-title>
        <v-spacer horizontal/>
        <v-card-actions>
          <v-spacer/>
          <v-btn color="success" @click="onSelect(selectedFiles)">Select</v-btn>
          <v-btn color="error" @click="dialog=false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </fresh-dialog> -->
    <v-btn
      @click="onClicked">
      Click
    </v-btn>
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { generateRouteByQuery } from '@/utils';
import FreshDialog from '@/components/FreshDialog.vue';
import TrackBrowser from './modules/TrackBrowser.vue';
import FileAutoComplete from './modules/FileAutoComplete.vue';
import RunIdAutoComplete from './modules/RunIdAutoComplete.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

const brParams = {
  chr: '22',
  viewStart: 30700000,
  viewEnd: 30900000,
  pageName: 'svgHolder',
  coordSystem: {
    speciesName: 'Human',
    taxon: 9606,
    auth: 'GRCh',
    version: '37',
    ucscName: 'hg19',
  },
  // sources: [
  //   {
  //     name: 'Genome',
  //     twoBitURI: '//www.biodalliance.org/datasets/hg19.2bit',
  //     tier_type: 'sequence',
  //   },
  //   {
  //     name: 'Genes',
  //     desc: 'Gene structures from GENCODE 19',
  //     bwgURI: '//www.biodalliance.org/datasets/gencode.bb',
  //     stylesheet_uri: '//www.biodalliance.org/stylesheets/gencode.xml',
  //     collapseSuperGroups: true,
  //     trixURI: '//www.biodalliance.org/datasets/geneIndex.ix',
  //   },
  //   {
  //     name: 'Repeats',
  //     desc: 'Repeat annotation from Ensembl',
  //     bwgURI: '//www.biodalliance.org/datasets/repeats.bb',
  //     stylesheet_uri: '//www.biodalliance.org/stylesheets/bb-repeats.xml',
  //   },
  //   {
  //     name: 'Conservation',
  //     desc: 'Conservation',
  //     bwgURI: '//www.biodalliance.org/datasets/phastCons46way.bw',
  //     style: [{ type: 'default', style: { glyph: 'HISTOGRAM', FGCOLOR: 'red', BGCOLOR: 'rgb(166,71,71)', HEIGHT: 30, id: 'style1' } }],
  //     noDownsample: true,
  //   },
  // ],
};

export default defineComponent({
  name: 'AtlasTest',
  props: ['query'],
  components: { TrackBrowser, FileAutoComplete, RunIdAutoComplete, FreshDialog },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const dialog = ref<boolean>(false);
    const selectedFiles = ref<any[]>([]);
    const currentRoute = computed(() => ctx.root.$route);
    const trackBrowserParams = ref<any>();
    const sourceLinks = ref<any[]>([]);
    const runId = ref<string>();
    const colorMap = ref<any>({ C1: 'blue', C2: 'red', C3: 'green', C4: 'yellow' });
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    function generateTrackSources(srcLink: any[]) {
      const srcs: any[] = [];
      lodash.each(srcLink, (v: any) => {
        if (v.key.includes('.2bit')) {
          const s = {
            name: v.key.split('/').reverse()[0],
            desc: v.key,
            twoBitURI: v.href,
            tier_type: 'sequence',
          };
          srcs.push(s);
        }
      });
      lodash.each(srcLink, (v: any) => {
        if (v.key.includes('.bw')) {
          const s = {
            name: v.key.split('/').reverse()[0],
            desc: v.key,
            bwgURI: v.href,
            style: [{ type: 'default', style: { glyph: 'HISTOGRAM', FGCOLOR: 'red', BGCOLOR: 'rgb(166,71,71)', HEIGHT: 30, id: 'style1' } }],
            noDownsample: true,
          };
          srcs.push(s);
        } else if (v.key.includes('.bb')) {
          const s = {
            name: v.key.split('/').reverse()[0],
            desc: v.key,
            bwgURI: v.href,
            stylesheet_uri: '//www.biodalliance.org/stylesheets/bb-repeats.xml',
          };
          srcs.push(s);
        }
      });
      // console.log(srcs);
      trackBrowserParams.value.sources = srcs;
    }
    async function fetchFileList(rid: string) {
      if (!client.value) {
        return;
      }
      const fl_payload = { params: { path: 'data', filter: `${rid}/tracks` } };
      const resp = await client.value.getFileList(fl_payload);
      const filelist = resp.filter((x: string) => x.includes('.bw') || x.includes('.bb') || x.includes('.2bit'));
      const proms = filelist.map((x: any) => {
        let href: Promise<any> | null = null;
        if (client.value) href = client.value.downloadByLink(x, 3600);
        const elm: any = {
          key: x,
          href,
        };
        return elm;
      });
      await Promise.allSettled(proms.map((x: any) => x.href)).then((resps: any) => {
        lodash.each(resps, (v: any, i: number) => {
          proms[i].href = v.value.msg;
        });
      }).finally(() => {
        console.log('Done');
      });
      // console.log(proms);
      sourceLinks.value = proms;
      generateTrackSources(sourceLinks.value);
    }
    function onRunIdChanged(ev: any) {
      // selectedFiles.value = ev;
      if (ev !== '') runId.value = ev;
      // console.log(runId.value);
    }
    function onClicked(ev: any) {
      dialog.value = !dialog.value;
    }
    function onSelect(ev: any) {
      // console.log(selectedFiles.value);
      dialog.value = false;
    }
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
      // console.log('Mounted');
    });
    return {
      dialog,
      currentRoute,
      onRunIdChanged,
      selectedFiles,
      onClicked,
      onSelect,
      runId,
      trackBrowserParams,
      colorMap,
    };
  },
});

</script>

<style>

</style>
