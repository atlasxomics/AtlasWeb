import { computed, reactive, watchEffect } from '@vue/composition-api';
import store from '@/store';

export const menu = reactive({
  text: 'Edit',
  menu_width: 200,
  menu: [
    {
      text: 'Test',
      click: () => { console.log('Edit click'); },
    },
  ],
});
