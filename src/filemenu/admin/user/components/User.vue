<template>
  <div>
    <fresh-dialog
      v-model="registerNewUserMenu"
      width="30vw"
    >
      <register-new-user-menu />
    </fresh-dialog>
    <fresh-dialog
      v-model="resetUserPasswordMenu"
      width="30vw"
    >
      <reset-user-password-menu />
    </fresh-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import FreshDialog from '@/components/FreshDialog.vue';
import RegisterNewUserMenu from './RegisterNewUserMenu.vue';
import ResetUserPasswordMenu from './ResetUserPasswordMenu.vue';

import { registerNewUserMenu, resetUserPasswordMenu } from '../state';

export default defineComponent({
  name: 'User',
  components: { FreshDialog, RegisterNewUserMenu, ResetUserPasswordMenu },
  setup() {
    return { registerNewUserMenu, resetUserPasswordMenu };
  },
});
</script>

<style>
</style>
