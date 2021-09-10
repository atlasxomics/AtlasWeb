import { helpDialog, aboutDialog } from './state';

export const menu = {
  text: 'About',
  menu: [
    { text: 'Help', click: () => { helpDialog.value = true; }, hotkey: 'F1' },
    { text: 'About', click: () => { aboutDialog.value = true; } },
  ],
};

export default menu;
