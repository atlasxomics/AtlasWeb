import { computed, reactive, watchEffect } from '@vue/composition-api';
import store from '@/store';
import {
  waferInformationMenu,
  chipInformationMenu,
  dbitInformationMenu,
} from './state';

export const menu = reactive({
  text: 'View',
  menu_width: 200,
  menu: [
    // {
    //   text: 'Wafer Trace',
    //   click: () => { waferTraceMenu.value = true; },
    // },
    // {
    //   text: 'Wafer Information - Dialog',
    //   click: () => { waferInformationMenu.value = true; },
    //   disabled: false,
    // },
    // {
    //   text: 'Chip Information - Dialog',
    //   click: () => { chipInformationMenu.value = true; },
    //   disabled: false,
    // },
    // {
    //   text: 'Chip Information',
    //   click: () => { store.commit.changeMainView('ChipInformationViewer'); },
    // },
    // {
    //   text: 'DBit Information - Dialog',
    //   click: () => { dbitInformationMenu.value = true; },
    //   disabled: false,
    // },
    {
      text: 'DBiT Runs',
      click: () => { console.log('DBiT Runs click'); },
      disabled: true,
    },
    {
      text: 'Wafer Trace',
      click: () => { store.commit.changeMainView('WaferTrace'); },
    },
    {
      text: 'Image Viewer',
      click: () => { store.commit.changeMainView('ImageViewer'); },
    },
    {
      text: 'QC Viewer',
      click: () => { store.commit.changeMainView('QcViewer'); },
      disabled: false,
    },
    // {
    //   text: 'Image Viewer',
    //   click: () => { store.commit.changeMainView('ImageViewer'); },
    // },
  ],
});
