<template>
  <div>
    <user />
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import { User } from '../user';

export default defineComponent({
  name: 'Admin',
  components: { User },
});
</script>

<style>

</style>
