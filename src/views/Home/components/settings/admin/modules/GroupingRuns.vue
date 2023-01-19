<template>
    <v-container>
      <v-row
      style="position: relative; top: 10px;"
      >
        <v-col
          cols="6"
          >
          <study-selector
            @study-selected="study_selected"
            >
          </study-selector>
          <v-text-field
          label="Study Description"
          v-model="study.study_description"
          >
          </v-text-field>
          <v-btn
          :disabled="!changes_made"
          @click="save_changes"
          >
            Save Changes
          </v-btn>
        </v-col>
        <v-col
          cols="6"
          >
          <v-col v-for="(item, index) in run_id_list" :key="item.run_id">
            <v-card
             style="transform: scale(0.7);"
            >
              <v-card-title class="justify-center"> Run Id: {{ item.run_id }}</v-card-title>
              <v-card-actions
              class="justify-center"
              >
                <v-btn style="position: relative; bottom: 4px;" color="error" @click="delete_run(index, item)">
                  <v-icon> mdi-delete </v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-row
          class="justify-center"
          style="margin: 12px;"
          >
          <v-btn color="primary"
          v-if="run_id_list.length > 0"
            @click="add_run"
            >
          <v-icon
          >
            mdi-plus
          </v-icon>
          </v-btn>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { Client } from '@/api';
import store from '@/store';
import StudySelector from '@/views/Home/components/settings/admin/modules/StudySelector.vue';
import RunIdSelector from '@/views/Home/components/settings/admin/modules/RunIdSelector.vue';
import { snackbar } from '@/components/GlobalSnackbar';

export default defineComponent({
  components: { StudySelector, RunIdSelector },
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const run_id_list = ref<Array<Record<string, any>>>([]);
    const study = ref<any>({});
    const study_description = ref<string>('');
    const changes_made = ref<boolean>(true);
    const runs_to_add = ref<Set<string>>(new Set());
    const runs_to_remove = ref<Set<string>>(new Set());
    const run_id_tissue_id = ref<Record<string, any>>({});
    function get_study_runs(study_id: string) {
      const runs = client.value?.get_study_runs(study_id);
      runs!.then((res: any) => {
        run_id_list.value = res;
      });
    }
    function check_run_id_selected(run_id: string) {
      return run_id_list.value.some((item) => item.run_id === run_id);
    }
    function delete_run(index: number, obj: any) {
      console.log(index);
      run_id_tissue_id.value[obj.run_id] = obj.tissue_id;
      run_id_list.value.splice(index, 1);
      if (obj.run_id in runs_to_add.value) {
        runs_to_add.value.delete(obj.run_id);
      }
      runs_to_remove.value.add(obj.run_id);
    }
    function add_run(run_obj: any) {
      // adding run
      run_id_tissue_id.value[run_obj.run_id] = run_obj.tissue_id;
      if (check_run_id_selected(run_obj.run_id)) {
        snackbar.dispatch({
          text: 'Run Id already selected',
          options: { color: 'error', timeout: 3000 },
        });
        return;
      }
      console.log('not present');
    }
    function study_selected(ev: any) {
      study.value = ev;
      get_study_runs(study.value.study_id);
    }
    function save_changes() {
      const { study_description: description, study_id: id } = study.value;
      const pl = {
        id,
        description,
      };
      console.log(pl);
      const study_promise = client.value?.update_study_table(pl);
      study_promise!.then((res: any) => {
        console.log(res);
      });
    }
    return {
      study,
      run_id_list,
      study_selected,
      study_description,
      delete_run,
      save_changes,
      changes_made,
      runs_to_add,
      runs_to_remove,
      run_id_tissue_id,
      add_run,
    };
  },
});
</script>
