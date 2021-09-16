import { reactive, watchEffect } from '@vue/composition-api';
import { loggedIn } from '@/utils/auth';
import store from '@/store';
import {
  loadDatasetMenu,
  uploadDatasetFileMenu,
  uploadQcDirectoryMenu,
} from './state';

export const menu = reactive({
  text: 'File',
  menu_width: 200,
  menu: [
    {
      text: 'Upload Dataset',
      click: () => { uploadDatasetFileMenu.value = true; },
      disabled: false,
      color: 'white',
    },
    {
      text: 'Upload Directory',
      click: () => { uploadQcDirectoryMenu.value = true; },
      disabled: true,
      color: 'white',
    },
    {
      text: 'Upload QCed',
      click: () => { uploadQcDirectoryMenu.value = true; },
      disabled: false,
      color: 'white',
    },
    {
      text: 'Manage Dataset Files',
      click: () => { console.log('Manage dataset files clicked'); },
      disabled: false,
    },
  ],
});
