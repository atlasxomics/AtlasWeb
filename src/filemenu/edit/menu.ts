import { computed, reactive, watchEffect } from '@vue/composition-api';
import store from '@/store';

export const menu = reactive({
  text: 'Edit',
  menu_width: 200,
  menu: [
    {
      text: 'Wafer Information',
      click: () => { store.commit.changeMainView('WaferInformationViewer'); },
      disabled: true,
    },
    {
      text: 'Chip Information',
      click: () => { store.commit.changeMainView('ChipInformationViewer'); },
    },
    {
      text: 'DBiT Information',
      click: () => { store.commit.changeMainView('DbitInformationViewer'); },
      disabled: true,
    },
  ],
});
