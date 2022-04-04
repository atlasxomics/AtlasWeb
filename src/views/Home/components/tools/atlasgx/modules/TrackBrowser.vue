<template>
    <v-container fluid>
<!--       <div ref="canvas" v-html="rawHtml"/> -->
      <v-card flat>
        <v-card-title>
          {{ run_id }}
          <v-select
            :items="species">
          </v-select>
          <v-spacer/>
<!--           <v-btn
            @click="onClick"
            color="primary"
            >Load</v-btn> -->
        </v-card-title>
        <v-card-text>
          <div :id="pageId"></div>
        </v-card-text>
      </v-card>
    </v-container>
</template>
<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { generateRouteByQuery, get_uuid } from '@/utils';
// import Browser from 'dalliance';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'TrackBrowser',
  // props: ['run_id', 'params', 'colormap'],
  props: {
    value: {
      type: String,
      required: false,
      default: null,
    },
    run_id: {
      type: String,
      required: false,
      default: null,
    },
    params: {
      type: Object,
      required: false,
      default: null,
    },
    colormap: {
      type: Object,
      required: false,
      default: null,
    },
  },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const trackBrowser = ref<any>();
    const sourceLinks = ref<any[]>([]);
    const trackSources = ref<any[]>([]);
    const runId = computed(() => props.run_id);
    const colorMap = computed(() => props.colormap);
    const pageId = `svgHolder-${get_uuid()}`;
    const species = ['Human', 'Mouse', 'XXX'];
    const brParams = {
      chr: '1',
      viewStart: 0,
      viewEnd: 10000000,
      pageName: pageId,
      coordSystem: {
        speciesName: 'Human',
        taxon: 9606,
        auth: 'GRCh',
        version: '37',
        ucscName: 'hg19',
      },
    };
    const trackBrowserParams = ref<any>(brParams);
    // const trackBrowser = ref<any>(new Browser.Browser({}));
    function generateTrackSources(srcLink: any[]) {
      const srcs: any[] = [];
      lodash.each(srcLink, (v: any) => {
        if (v.key.includes('.2bit')) {
          const alid = v.key.split('/').reverse()[0].split('.')[0];
          const s = {
            id: alid,
            name: alid,
            desc: v.key,
            twoBitURI: v.href,
            tier_type: 'sequence',
          };
          srcs.push(s);
        }
      });
      lodash.each(srcLink, (v: any, i: number) => {
        if (v.key.includes('.bw')) {
          const alid = v.key.split('/').reverse()[0].split('.')[0];
          const s = {
            id: alid,
            name: alid,
            desc: v.key,
            bwgURI: v.href,
            style: [{ type: 'default', style: { glyph: 'HISTOGRAM', FGCOLOR: props.colormap[alid], BGCOLOR: props.colormap[alid], HEIGHT: 30, id: 'style1' } }],
            noDownsample: true,
            tier_type: 'bw',
          };
          srcs.push(s);
        }
      });
      lodash.each(srcLink, (v: any) => {
        if (v.key.includes('.bb')) {
          const alid = v.key.split('/').reverse()[0].split('.')[0];
          const s = {
            id: alid,
            name: alid,
            desc: v.key,
            bwgURI: v.href,
            stylesheet_uri: '//www.biodalliance.org/stylesheets/bb-repeats.xml',
            tier_type: 'bb',
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
        // console.log('Done');
      });
      // console.log(proms);
      sourceLinks.value = proms;
      generateTrackSources(sourceLinks.value);
    }
    function mapColors(cmap: any) {
      trackBrowserParams.value.sources.forEach((v: any, i: number) => {
        if (v.tier_type === 'bw') {
          trackBrowserParams.value.sources[i].style = [{ type: 'default', style: { glyph: 'HISTOGRAM', FGCOLOR: cmap[v.id], BGCOLOR: cmap[v.id], HEIGHT: 30, id: 'style1' } }];
        }
      });
    }
    watch(runId, async (v: string) => {
      await fetchFileList(props.run_id);
      trackBrowser.value = new (window as any).Browser(trackBrowserParams.value);
    });
    watch(colorMap, async (v: any) => {
      mapColors(v);
      await fetchFileList(props.run_id);
      trackBrowser.value = new (window as any).Browser(trackBrowserParams.value);
    });
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(null);
    });
    return {
      currentRoute,
      species,
      pageId,
    };
  },
});

</script>
<style>

</style>
