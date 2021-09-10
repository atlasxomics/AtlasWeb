import { registerNewUserMenu, resetUserPasswordMenu, changeUserLevelMenu } from './state';

const menu = {
  text: 'User',
  menu_width: 200,
  menu: [
    {
      text: 'Register New User',
      click: () => { registerNewUserMenu.value = true; },
    },
    {
      text: 'Reset User Password',
      click: () => { resetUserPasswordMenu.value = true; },
    },
  ],
};

export { menu };
