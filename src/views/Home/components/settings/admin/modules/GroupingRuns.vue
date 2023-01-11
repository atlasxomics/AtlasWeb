<template>
    <v-container>
        <aws-searcher
        :path="'Images'"
        :only_files="true"
        >
        </aws-searcher>
    </v-container>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import AwsSearcher from './AwsSearcher.vue';

export default defineComponent({
  components: { AwsSearcher },
  setup(props, ctx) {
    const foo = 'bar';
    const buzz = 'bazz';
  },
});
</script>
