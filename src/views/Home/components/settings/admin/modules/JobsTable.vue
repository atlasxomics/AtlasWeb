<template>
  <v-col>
  <v-row
  class="justify-center"
  style="margin-bottom: 10px;"
  >
    <b> Refresh Jobs Table </b>
  <v-icon
  size="30"
  style="position: relative; bottom: 5px; left: 5px;"
  @click="get_jobs"
  > mdi-refresh </v-icon>
  </v-row>
  <v-data-table
    :headers="headers"
    :items="jobs"
    :search="search"
    sort-by="job_start_time"
    sort-desc
    :loading="loading"
  >
  </v-data-table>
  </v-col>
</template>

<script lang='ts'>

import { ref, defineComponent, computed, onMounted } from '@vue/composition-api';
import { Client } from '@/api';
import store from '@/store';
import About from '@/filemenu/about/components/About.vue';

export default defineComponent({
  components: { About },
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
    filter_run_id: {
      type: Boolean,
      required: false,
    },
    run_id: {
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
    const loading = ref(false);
    function convert_timestamp(timestamp: string) {
      const date = new Date(timestamp);
      return date.toLocaleString();
    }
    async function get_jobs() {
      if (!client.value) return;
      loading.value = true;
      const params = {
        filter_username: props.filter_username,
        filter_group: props.filter_group,
        job_name: props.filter_job_name ? props.job_name : null,
        run_id: props.filter_run_id ? props.run_id : null,
      };
      const res = await client.value.getJobs(params);
      jobs.value = res;
      loading.value = false;
    }
    onMounted(() => {
      get_jobs();
    });
    return {
      headers,
      search,
      loading,
      jobs,
      get_jobs,
    };
  },
});
</script>
