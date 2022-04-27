/* eslint-disable import/no-cycle */
import Vue from 'vue';
import Vuex from 'vuex';
import { createDirectStore } from 'direct-vuex';

import { Client } from '@/api';
import upload from './upload';

Vue.use(Vuex);

const {
  store,
  rootActionContext,
  moduleActionContext,
  rootGetterContext,
  moduleGetterContext,
} = createDirectStore({
  state: {
    client: null as Client | null,
    currentComponent: { component: null } as any | null,
    serverStatus: null as any | null,
    subMenu: null as any[] | null,
    slimsData: null as any[] | null,
  },
  getters: {},
  mutations: {
    setClient(state, client: Client | null) {
      state.client = client;
    },
    setComponent(state, query: any) {
      state.currentComponent = query;
    },
    setServerStatus(state, status: any | null) {
      state.serverStatus = status;
    },
    setSubmenu(state, submenu: any[] | null) {
      state.subMenu = submenu;
    },
    setSlimsData(state, data: any[] | null) {
      state.slimsData = data;
    },
  },
  actions: {},
  modules: { upload },
});

// Export the direct-store instead of the classic Vuex store.
export default store;

// The following exports will be used to enable types in the
// implementation of actions and getters.
export {
  rootActionContext,
  moduleActionContext,
  rootGetterContext,
  moduleGetterContext,
};

// The following lines enable types in the injected store '$store'.
export type AppStore = typeof store;
declare module 'vuex' {
  interface Store<S> {
    direct: AppStore;
  }
}
