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
    {
      text: 'Wafer Information',
      click: () => { waferInformationMenu.value = true; },
      disabled: false,
    },
    {
      text: 'Chip Information',
      click: () => { chipInformationMenu.value = true; },
      disabled: false,
    },
    {
      text: 'DBit Information',
      click: () => { dbitInformationMenu.value = true; },
      disabled: false,
    },
    {
      text: 'DBiT Runs',
      click: () => { console.log('DBiT Runs click'); },
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
      text: 'Study Viewer',
      click: () => { store.commit.changeMainView('StudyViewer'); },
    },
    // {
    //   text: 'Image Viewer',
    //   click: () => { store.commit.changeMainView('ImageViewer'); },
    // },
  ],
});
