import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import AtlasBrowser from '@/views/Home/components/tools/atlasbrowser/AtlasBrowser.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'AtlasBrowser',
    component: AtlasBrowser,
  },
];

const router = new VueRouter({ routes, mode: 'history' });

export default router;
