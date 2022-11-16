import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import Home from '../views/Home/Home.vue';
import Login from '../views/Login/Login.vue';
import PublicMain from '../views/Public/PublicMain.vue';
import LandingPage from '../views/Login/LandingPage.vue';

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
  {
    path: '/visualization',
    name: 'LandingPage',
    component: LandingPage,
  },
];

const router = new VueRouter({ routes, mode: 'history' });

export default router;
