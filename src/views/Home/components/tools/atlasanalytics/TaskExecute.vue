<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card flat>
          <v-select
              v-model="currentTask"
              v-if="workers"
              :items="workers.filter((x) => x.params && x.params.target == 'general')"
              item-text="task"
              item-value="task"
              label="Choose Task"
              :loading="loading"
              return-object
              :disabled="loading"
              :messages="taskPayload.progress"
              @change="selectActionTask"/>
          <template v-if="currentTask">
            <v-text-field
                v-model="currentTask.worker"
                disabled
                label="Worker"/>
            <v-text-field
                v-model="currentTask.queues"
                disabled
                label="Queue"/>
          </template>
          <template v-if="taskParams">
            Parameters
            <task-params :meta="taskParams" v-on:changed="OnParamsChanged"/>
          </template>
          <v-card-actions>
            <v-spacer/>
            <v-btn
              v-if="currentTask"
              color="primary"
              :disabled="loading"
              @click="runTask">
                Run Task</v-btn>
          </v-card-actions>
        </v-card>
        <v-card v-if="taskPayload.result" flat>
          {{ taskPayload.result }}
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { generateRouteByQuery } from '@/utils';
import TaskParams from './TaskParams.vue';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

interface Task {
  task: string | null;
  queue: string | null;
  args: any[] | null;
  kwargs: any | null;
  progress: any | null;
  result: any | null;
}

export default defineComponent({
  name: 'TaskExecute',
  props: ['query'],
  components: { TaskParams },
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const loading = ref(false);
    const taskPayload = ref<Task | null>({ task: null, queue: null, args: [], kwargs: {}, progress: null, result: null });
    const workers = computed(() => store.state.client?.workers);
    const currentTask = ref<any | null>(null);
    const taskStatus = ref<any>();
    const taskTimeout = ref<number | null>(null);
    const taskParams = ref<any | null>(null);
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    function initialize() {
      taskPayload.value = { task: null, queue: null, args: [], kwargs: {}, progress: null, result: null };
      taskParams.value = null;
    }
    function OnParamsChanged(ev: any) {
      if (!taskPayload.value) return;
      // console.log(ev);
      taskPayload.value.args = ev.args.map((x: any) => x.value);
      taskPayload.value.kwargs = ev.kwargs;
    }
    async function getTaskMeta(taskinfo: any) {
      if (!client.value) return;
      const [ns] = taskinfo.task.split('.');
      const t = `${ns}.task_list`;
      const [q] = taskinfo.queues;
      const result = await client.value.postTaskSync(t, [], {}, q);
      try {
        const params = result.tasks[taskinfo.task];
        taskParams.value = params;
        if (taskPayload.value) taskPayload.value.progress = params.description;
        // taskPayload.value.args = taskParams.value.args.map((x: any) => x.value);
        // taskPayload.value.kwargs = taskParams.value.kwargs;
      } catch (e) {
        snackbar.dispatch({ text: 'Metadata has not been found', options: { color: 'warning', right: true } });
      }
    }
    async function selectActionTask(ev: any) {
      // console.log(ev);
      currentTask.value = ev;
      initialize();
      await getTaskMeta(currentTask.value);
    }
    async function refresh() {
      if (!client.value) return;
      loading.value = true;
      await client.value.updateWorkers();
      snackbar.dispatch({ text: 'Workers are loaded', options: { color: 'success', right: true } });
      loading.value = false;
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
    };
    async function runTask() {
      if (!client.value || !taskPayload.value) return;
      try {
        loading.value = true;
        taskPayload.value.result = null;
        taskPayload.value.task = currentTask.value.task;
        [taskPayload.value.queue] = currentTask.value.queues;
        // console.log(taskPayload.value);
        const taskObject = await client.value.postTask(taskPayload.value.task, taskPayload.value.args, taskPayload.value.kwargs, taskPayload.value.queue);
        await checkTaskStatus(taskObject._id);

        /* eslint-disable no-await-in-loop */
        while (taskStatus.value.status !== 'SUCCESS' && taskStatus.value.status !== 'FAILURE') {
          if (taskStatus.value.status === 'PROGRESS') {
            taskPayload.value.progress = `${taskStatus.value.status} : ${taskStatus.value.progress}% - ${taskStatus.value.position}`;
          }
          await new Promise((r) => {
            taskTimeout.value = window.setTimeout(r, 1000);
          });
          taskTimeout.value = null;
          await checkTaskStatus(taskObject._id);
        }
        /* eslint-disable no-await-in-loop */
        if (taskStatus.value.status !== 'SUCCESS') {
          snackbar.dispatch({ text: 'Worker failed', options: { right: true, color: 'error' } });
          taskPayload.value.progress = taskStatus.value.status;
          loading.value = false;
          return;
        }
        snackbar.dispatch({ text: 'Worker finished the job', options: { right: true, color: 'success' } });
        const resp = taskStatus.value.result;
        taskPayload.value.result = resp;
        loading.value = false;
      } catch (error) {
        loading.value = false;
        taskPayload.value.progress = `${error}`;
        snackbar.dispatch({ text: error, options: { right: true, color: 'error' } });
      }
    }
    const submenu = [
      {
        text: 'Refresh',
        icon: 'mdi-refresh',
        color: 'primary',
        tooltip: 'Refresh',
        click: async () => {
          await refresh();
        },
      },
    ];
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(submenu);
    });
    return {
      loading,
      taskPayload,
      workers,
      currentTask,
      selectActionTask,
      taskParams,
      OnParamsChanged,
      runTask,
      refresh,
      // progressMessage,
    };
  },
});

</script>

<style>

</style>
