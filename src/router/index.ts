import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import AtlasXplore from '../views/Home/components/tools/atlasgx/AtlasXplore.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'AtlasXplore',
    component: AtlasXplore,
  },
];

const router = new VueRouter({ routes, mode: 'history' });

export default router;
