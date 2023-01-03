<template>
  <v-data-table
    :headers="headers"
    :items="jobs"
    :search="search"
  >
  </v-data-table>
</template>

<script lang='ts'>

import { ref, defineComponent, computed, onMounted } from '@vue/composition-api';
import { Client } from '@/api';
import store from '@/store';

export default defineComponent({
  name: 'JobsTable',
  props: {
    filter_username: {
      type: Boolean,
      required: true,
    },
    filter_group: {
      type: Boolean,
      required: false,
    },
    filter_job_name: {
      type: Boolean,
      required: false,
    },
    job_name: {
      type: String,
      required: false,
    },
  },
  setup(props: any, ctx: any) {
    const headers = [
      { text: 'Job Name', value: 'job_name' },
      { text: 'Job Status', value: 'job_status' },
      { text: 'User', value: 'username' },
      { text: 'Start Time', value: 'job_start_time' },
      { text: 'Completion Time', value: 'job_completion_time' },
    ];
    const search = '';
    const jobs = ref<any[]>();
    const client = computed(() => store.state.client);
    function convert_timestamp(timestamp: string) {
      const date = new Date(timestamp);
      return date.toLocaleString();
    }
    function get_jobs() {
      if (!client.value) return;
      const params = {
        filter_username: props.filter_username,
        filter_group: props.filter_group,
        job_name: props.filter_job_name ? props.job_name : null,
      };
      client.value.getJobs(params).then((res: any) => {
        jobs.value = res;
      });
    }
    onMounted(() => {
      get_jobs();
    });
    return {
      headers,
      search,
      jobs,
    };
  },
});
</script>
