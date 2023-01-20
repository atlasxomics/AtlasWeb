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
            @edit-study-id="edit_study_id"
            @close-edit-study-id="close_edit_study_id"
            @new-study-id="new_study"
            ref = "study_selector"
            >
          </study-selector>
          <v-text-field
          label="Study Description"
          v-model="study.study_description"
          :error="study_selected_bool && !study.study_description"
          >
          </v-text-field>
          <v-btn
          :disabled="!changes_made || !study_selected_bool || !study.study_description"
          @click="save_changes"
          style="margin: 14px"
          >
            Submit
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
          style="margin: 14px;"
          >
          <v-btn color="primary"
          v-if="!selecting_run_id && study_selected_bool"
            @click="selecting_run_id = true;"
            >
          <v-icon
          >
            mdi-plus
          </v-icon>
          </v-btn>
          <v-card
          flat
          v-if="selecting_run_id"
          >
            <v-card-title class="justify-center"> Add Run Id
              <v-icon
              color="error"
              @click="selecting_run_id = false;"
              style="position: relative; left: 10px;"
              >
                mdi-cancel
              </v-icon>
            </v-card-title>
          <run-id-selector
          style="position: relative; bottom: 30px;"
          v-if="selecting_run_id"
          :new_available="false"
          @run-selected="add_run"
          >
          </run-id-selector>
          </v-card>
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
    const original_run_ids = ref<Set<string>>(new Set());

    const runs_to_add = ref<Set<string>>(new Set());
    const runs_to_remove = ref<Set<string>>(new Set());
    const run_id_tissue_id = ref<Record<string, any>>({});
    const selecting_run_id = ref<boolean>(false);
    const study_selected_bool = ref<boolean>(false);
    const original_description = ref<string>('');
    const changes_made = computed(() => {
      if (original_run_ids.value.size !== run_id_list.value.length) {
        return true;
      }
      if (original_description.value !== study.value.study_description) {
        return true;
      }
      let changed = false;
      run_id_list.value.forEach((item) => {
        if (!original_run_ids.value.has(item.run_id)) {
          changed = true;
        }
      });
      return changed;
    });
    function new_study(study_name: string) {
      study.value.study_name = study_name;
      study.value.study_id = null;
      study_selected_bool.value = true;
      run_id_list.value = [];
      original_run_ids.value = new Set();
      runs_to_add.value = new Set();
      runs_to_remove.value = new Set();
    }
    function get_study_runs(study_id: string) {
      const runs = client.value?.get_study_runs(study_id);
      console.log(runs);
      runs!.then((res: any) => {
        run_id_list.value = res;
        res.forEach((item: any) => {
          run_id_tissue_id.value[item.run_id] = item.tissue_id;
          original_run_ids.value.add(item.run_id);
        });
      });
    }
    function check_run_id_selected(run_id: string) {
      return run_id_list.value.some((item) => item.run_id === run_id);
    }
    function delete_run(index: number, obj: any) {
      run_id_tissue_id.value[obj.run_id] = obj.tissue_id;
      run_id_list.value.splice(index, 1);
      if (runs_to_add.value.has(obj.run_id)) {
        runs_to_add.value.delete(obj.run_id);
      } else {
        runs_to_remove.value.add(obj.run_id);
      }
    }
    function add_run(run_obj: any) {
      // adding run
      console.log(run_obj);
      selecting_run_id.value = false;
      run_id_tissue_id.value[run_obj.run_id] = run_obj.tissue_id;
      if (check_run_id_selected(run_obj.run_id)) {
        snackbar.dispatch({
          text: 'Run Id already selected',
          options: { color: 'error', timeout: 3000 },
        });
        return;
      }
      run_id_list.value.push({
        run_id: run_obj.run_id,
        tissue_id: run_obj.tissue_id,
      });
      if (runs_to_remove.value.has(run_obj.run_id)) {
        runs_to_remove.value.delete(run_obj.run_id);
      } else {
        runs_to_add.value.add(run_obj.run_id);
      }
    }
    function study_selected(ev: any) {
      study.value = ev;
      original_description.value = study.value.study_description;
      get_study_runs(study.value.study_id);
      study_selected_bool.value = true;
    }
    function reset_fields() {
      run_id_list.value = [];
      study.value = {};
      original_run_ids.value = new Set();
      runs_to_add.value = new Set();
      runs_to_remove.value = new Set();
      run_id_tissue_id.value = {};
      selecting_run_id.value = false;
      study_selected_bool.value = false;
      const selector = ctx.refs.study_selector as any;
      selector.reset_fields();
    }
    async function save_changes() {
      const adding_list: any = [];
      runs_to_add.value.forEach((run_id) => {
        adding_list.push({
          run_id,
          tissue_id: run_id_tissue_id.value[run_id],
        });
      });
      const removing_list: any = [];
      runs_to_remove.value.forEach((run_id) => {
        removing_list.push({
          run_id,
          tissue_id: run_id_tissue_id.value[run_id],
        });
      });
      const { study_description: description, study_id: id, study_name } = study.value;
      const pl = {
        id,
        study_name,
        description,
        adding_list,
        removing_list,
      };
      const result = await client.value?.update_study_table(pl);
      if (result === 'Success') {
        snackbar.dispatch({
          text: 'Study updated',
          options: { color: 'success', timeout: 3000 },
        });
        reset_fields();
      } else {
        snackbar.dispatch({
          text: 'Error updating study',
          options: { color: 'error', timeout: 3000 },
        });
      }
    }
    function edit_study_id() {
      study_selected_bool.value = false;
    }
    function close_edit_study_id() {
      study_selected_bool.value = true;
    }
    return {
      study,
      run_id_list,
      study_selected,
      delete_run,
      save_changes,
      changes_made,
      runs_to_add,
      runs_to_remove,
      run_id_tissue_id,
      add_run,
      selecting_run_id,
      study_selected_bool,
      edit_study_id,
      close_edit_study_id,
      original_run_ids,
      new_study,
      original_description,
    };
  },
});
</script>
