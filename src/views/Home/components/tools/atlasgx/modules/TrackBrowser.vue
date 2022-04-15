<template>
    <v-container fluid>
      <v-card flat>
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
    search_key: {
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
    const search = ref<string | null>(props.search_key);
    const searchKeyFromParents = computed(() => props.search_key);
    const sourceLinks = ref<any[]>([]);
    const trackSources = ref<any[]>([]);
    const runId = computed(() => props.run_id);
    const colorMap = ref<any>();
    const colorMapFromParents = computed(() => props.colormap);
    const pageId = `svgHolder-${get_uuid()}`;
    const selectedSpecies = ref<any | null>();
    const trackBrowserParams = ref<any>();
    const speciesMap: any = { human: 'h19', 'Rattus norvegicus': 'rn6' };
    const species: string[] = [];
    lodash.forIn(speciesMap, (v: string, k: string) => {
      species.push(k);
    });
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
      lodash.each(srcLink, (v: any) => {
        if (v.key.includes('.bed')) {
          const alid = v.key.split('/').reverse()[0].split('.')[0];
          const s = {
            id: alid,
            name: alid,
            desc: v.key,
            uri: v.href,
            tier_type: 'memstore',
            payload: 'bed',
          };
          srcs.push(s);
        }
      });
      lodash.each(srcLink, (v: any) => {
        if (v.key.includes('.bb')) {
          const [{ href: indexFileURI }] = srcLink.filter((x: any) => x.key.endsWith('.ix'));
          const alid = v.key.split('/').reverse()[0].split('.')[0];
          const s = {
            id: alid,
            name: alid,
            desc: v.key,
            bwgURI: v.href,
            // stylesheet_uri: '//www.biodalliance.org/stylesheets/bb-repeats.xml',
            stylesheet_uri: '//www.biodalliance.org/stylesheets/gencode.xml',
            tier_type: 'bb',
            collapseSuperGroups: true,
            trixURI: indexFileURI,
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
      // console.log(srcs);
      trackBrowserParams.value.sources = srcs;
    }
    async function generateTrackParams(rid: string) {
      if (!client.value) {
        return;
      }
      const metadata = await client.value.getMetadataFromRunId(rid);
      selectedSpecies.value = metadata.Species;
      trackBrowserParams.value = {
        chr: '1',
        viewStart: 0,
        viewEnd: 1000000,
        maxViewWidth: 10000000,
        pageName: pageId,
        coordSystem: {
          speciesName: selectedSpecies.value,
          // taxon: 9606,
          auth: '',
          // version: '37',
          ucscName: speciesMap[selectedSpecies.value],
        },
        onFirstRender: () => {
          console.log('Rendered');
        },
      };
      const ref_bucket = 'atx-track-host';
      const fl_payload = { params: { path: 'data', filter: `${rid}/tracks` } };
      const fl_payload_ref = { params: { bucket: ref_bucket, path: 'ref', filter: `${speciesMap[selectedSpecies.value]}` } };
      const resp = await client.value.getFileList(fl_payload);
      const resp_ref = await client.value.getFileList(fl_payload_ref);
      const merged_list = resp.concat(...resp_ref);
      const filelist = merged_list.filter((x: string) => x.includes('.bw') || x.includes('.bb') || x.includes('.2bit') || x.includes('.bed') || x.endsWith('.ix') || x.endsWith('.ixx'));
      const proms = filelist.map((x: any) => {
        let href: Promise<any> | null = null;
        if (client.value) {
          if (x.endsWith('.ixx') || x.endsWith('.2bit') || x.endsWith('.ix') || x.endsWith('.bb')) {
            href = client.value.downloadByLinkPublic(ref_bucket, x);
          } else href = client.value.downloadByLink(x, 3600);
        }
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
    function onClickSearch(ev: any) {
      // console.log(search.value);
      // console.log(trackBrowser.value);
      trackBrowser.value.search(search.value, (x: any) => {
        if (!x) {
          snackbar.dispatch({ text: `Expression ${search.value} found`, options: { right: true, color: 'success' } });
        } else {
          // snackbar.dispatch({ text: `Expression ${search.value} NOT found`, options: { right: true, color: 'error' } });
        }
      }, {});
    }
    async function reload(rid = props.run_id, cmap = colorMapFromParents.value) {
      await generateTrackParams(rid);
      mapColors(cmap);
      trackBrowser.value = await new (window as any).Browser(trackBrowserParams.value);
      // if (search.value) onClickSearch(null);
    }
    watch(searchKeyFromParents, (v: string) => {
      search.value = v;
      onClickSearch(null);
    });
    watch(runId, async (v: string) => {
      if (v) reload(v);
    });
    watch(colorMapFromParents, async (v: any) => {
      mapColors(v);
      if (trackBrowser.value) trackBrowser.value.drawOverlays();
    });
    onMounted(async () => {
      await clientReady;
    });
    return {
      currentRoute,
      species,
      selectedSpecies,
      pageId,
      search,
      onClickSearch,
      reload,
    };
  },
});
</script>

<style>
</style>
