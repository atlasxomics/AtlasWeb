import Vue from 'vue';
import VueKonva from 'vue-konva';
import '@babel/polyfill';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';

// Must come first
import '@/plugins/composition';
import './plugins/mousetrap';
import './plugins/clipboard2';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';

Vue.use(VueKonva);
Vue.config.productionTip = false;
new Vue({
  router,
  store: store.original,
  vuetify,
  provide: { vuetify },
  render: (h) => h(App),
}).$mount('#app');
