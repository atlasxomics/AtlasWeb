import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import AtlasXplore from '../views/Home/components/tools/atlasgx/AtlasXplore.vue';
import AtlasBrowser from '../views/Home/components/tools/atlasbrowser/AtlasBrowser.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'AtlasXplore',
    component: AtlasXplore,
  },
  {
    path: '/AtlasXplore',
    name: 'AtlasXplore',
    component: AtlasXplore,
  },
  {
    path: '/AtlasXBrowser',
    name: 'AtlasBrowser',
    component: AtlasBrowser,
  },
];

const router = new VueRouter({ routes, mode: 'history' });

export default router;
