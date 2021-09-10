import { computed } from '@vue/composition-api';

import { File, menu as FileMenu, state as FileState } from './file';
import { menu as EditMenu, state as EditState } from './edit';
import { menu as ToolsMenu, state as ToolsState } from './tools';
import { About, menu as AboutMenu, state as AboutState } from './about';
import { Admin, menu as AdminMenu, state as AdminState } from './admin';
import { Views, menu as ViewMenu, state as ViewState } from './view';
/**
 * Gather all menu declarations.
 */
export const filemenu = computed(() => {
  const menu: unknown[] = [
    FileMenu,
    EditMenu,
    ViewMenu,
    ToolsMenu,
    AboutMenu,
  ];

  if (AdminState.isAdmin.value) {
    menu.push(AdminMenu);
  }

  return menu;
});

/**
 * Gather all menu state.
 */
export const state = {
  file: FileState,
  edit: EditState,
  view: ViewState,
  analysis: ToolsState,
  about: AboutState,
  admin: AdminState,
};

/**
 * All menus that must render dialogs are registered here.
 * If a component is registered here, it MUST be a dialog of some sorts.
 */
export const components = {
  File,
  Views,
  About,
  Admin,
};
