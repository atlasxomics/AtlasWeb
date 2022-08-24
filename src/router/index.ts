import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import Home from '../views/Home/Home.vue';
import Login from '../views/Login/Login.vue';
import PublicMain from '../views/Public/PublicMain.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/public',
    name: 'PublicMain',
    component: PublicMain,
  },
];

const router = new VueRouter({ routes, mode: 'history' });

export default router;
