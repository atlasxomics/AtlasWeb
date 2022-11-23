<template>
    <v-container>
        <v-row>
            <v-col
            cols="12"
            sm="4"            >
                <v-card-title>
                    Run Information
                </v-card-title>
                <v-text-field
                v-model="run_id"
                label="Run ID"
                >
                <template
                v-slot:append-outer
                style="width: 50px;"
                >
                  <v-btn
                  :disabled="!run_id"
                  @click="auto_populate"
                  >
                    Auto Populate
                  </v-btn>
                </template>
                </v-text-field>
                <v-text-field
                v-model="ngs_id"
                label="NGS Library ID"
                >
                </v-text-field>
                <v-text-field
                v-model="run_title"
                label="Run Title"
                >
                </v-text-field>
                <v-text-field
                v-model="run_description"
                label="Run Description"
                >
                </v-text-field>
                <v-text-field
                v-model="sample_id"
                label = "Sample ID"
                >
                </v-text-field>
                <v-text-field
                label="Date: YYYY/MM/DD"
                v-model="date_human_readable"
                >
                </v-text-field>
            </v-col>
            <v-col
            cols="12"
            sm="4"
            >
            <v-card-title
            class="justify-center"
            >
                Metadata
            </v-card-title>
            <v-select
            v-model="assay"
            label="Assay"
            :items="assay_list"
            >
            </v-select>
            <!-- <selector
            v-if="assay === 'CUT&Tag'"
            :variable="antibody"
            display_label="Epitope Name"
            :display_options="epitope_list"
            @option-added="epitope_list.push($event)"
            @changed="antibody = $event"
            >
            </selector>
            <v-select
            v-if="assay === 'CUT&Tag'"
            :items="['activation', 'repression']"
            label="Regulation"
            v-model="regulation"
            >
            </v-select> -->
            <selector
              :variable='species'
              display_label="Species"
              :display_options="species_list"
              @option-added="species_list.push($event)"
              @changed="species = $event"
            >
            </selector>
            <selector
            :variable="organ"
            :display_options="organ_list"
            display_label="Organ"
            @option-added="organ_list.push($event)"
            @changed="organ = $event"
            >
            </selector>
            <selector
            :variable="tissue_source"
            :display_options="tissue_source_list"
            display_label="Tissue Source"
            @option-added="tissue_source_list.push($event)"
            @changed="tissue_source = $event">
            </selector>
            <v-text-field
              label="Tissue Condition"
              v-model="tissue_condition"
            >
            </v-text-field>
            </v-col>
            <v-col
            cols="12"
            sm="4"
            >
                <v-card-title>
                    Web Object
                </v-card-title>
                <v-select
                :items = public_run_items
                label="Public"
                v-model="public_run"
                >
                </v-select>
                <v-select
                :items="group_list"
                label="Group"
                v-model="selected_group"
                >
                </v-select>
                <v-text-field
                v-model="web_obj_path"
                label="Path"
                >
                </v-text-field>
                <v-text-field
                label="PMID"
                v-model="pmid"
                >
                </v-text-field>
            </v-col>
        </v-row>
        <v-row>
            <v-col
            >
                <v-btn
                :disabled="!run_id"
                style="position: relative; left: 50%; bottom: 5%;"
                @click="upload_data"
                >
                  Submit
                </v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { Client } from '@/api';
import { snackbar } from '@/components/GlobalSnackbar';
import store from '@/store';
import { defineComponent, onMounted, ref, computed } from '@vue/composition-api';
import { group } from 'console';
import { List } from 'lodash';
import Selector from './Selector.vue';

export default defineComponent({
  name: 'WebUploader',
  components: { Selector },
  setup(props, ctx) {
    const date_human_readable = ref<string>('');
    function date_human_to_epoch(date_human: string) {
      const lis = date_human.split('/');
      const [year, month, day] = lis;
      const year_int = Number.parseInt(year, 10);
      const month_int = Number.parseInt(month, 10) - 1;
      const day_int = Number.parseInt(day, 10);
      console.log(day_int);
      console.log(month_int);
      console.log(year_int);
      const epoch = Date.UTC(year_int, month_int, day_int);
      return epoch;
    }
    const date_epoch = computed(() => date_human_to_epoch(date_human_readable.value));
    const client = computed(() => store.state.client);
    const assay = ref<string>('');
    const web_obj_path = ref<string>('');
    const organ = ref<string>('');
    const species = ref<string>('');
    const sample_id = ref<string>('');
    const antibody = ref<string>('');
    const tissue_condition = ref<string>('');
    const pmid = ref<string>('');
    const tissue_source = ref<string>('');
    const channel_width = ref<string>('');
    const assay_list = ref<Array<string>>([]);
    const organ_list = ref<Array<string>>([]);
    const species_list = ref<Array<string>>([]);
    const epitope_list = ref<Array<string>>([]);
    const group_list = ref<Array<string>>([]);
    const tissue_source_list = ref<Array<string>>([]);
    const channel_width_list = ref<Array<string>>([]);
    const run_id = ref<string>('');
    const ngs_id = ref<string>('');
    const run_description = ref<string>('');
    const run_title = ref<string>('');
    const regulation = ref<string>('');
    const public_run = ref<boolean>(false);
    const selected_group = ref<string>('');
    const public_run_items: List<any> = [
      {
        text: 'True',
        value: true,
      },
      {
        text: 'False',
        value: false,
      },
    ];

    function assign_possible_fields_list(fields_from_db: any) {
      console.log(fields_from_db);
      assay_list.value = fields_from_db.assay_list;
      species_list.value = fields_from_db.species_list;
      organ_list.value = fields_from_db.organ_list;
      channel_width_list.value = fields_from_db.channel_width_list;
      epitope_list.value = fields_from_db.antibody_list;
      group_list.value = fields_from_db.group_list;
      tissue_source_list.value = fields_from_db.tissue_source_list;
    }
    function assign_fields(db_obj: any) {
      if (db_obj.assay) {
        assay.value = db_obj.assay;
      }
      species.value = db_obj.species;
      organ.value = db_obj.organ;
      public_run.value = db_obj.public;
      tissue_condition.value = db_obj.experimental_condition;
      selected_group.value = db_obj.group;
      run_title.value = db_obj.result_title;
      run_description.value = db_obj.result_description;
      web_obj_path.value = db_obj.results_folder_path;
      sample_id.value = db_obj.sample_id;
      ngs_id.value = db_obj.ngs_id;
      if (db_obj.public === 1) {
        public_run.value = true;
      } else {
        public_run.value = false;
      }
    }
    async function auto_populate() {
      try {
        const resp = await client.value?.get_info_from_run_id(run_id.value);
        if (resp === 'Not-Found') {
          snackbar.dispatch({ text: 'Run ID Not Present in Database.', options: { color: 'red' } });
        } else {
          assign_fields(resp);
        }
      } catch (e) {
        snackbar.dispatch({ text: 'Error during search.', options: { color: 'red' } });
      }
    }
    function clear_fields() {
      assay.value = '';
      species.value = '';
      organ.value = '';
      date_human_readable.value = '';
      run_id.value = '';
      run_description.value = '';
      run_title.value = '';
      web_obj_path.value = '';
      antibody.value = '';
      regulation.value = '';
      tissue_source.value = '';
      sample_id.value = '';
      tissue_condition.value = '';
      pmid.value = '';
      selected_group.value = '';
      public_run.value = false;
    }
    async function upload_data() {
      console.log('uploading data');
      try {
        const data_obj = {
          assay: assay.value,
          species: species.value,
          organ: organ.value,
          run_id: run_id.value,
          run_description: run_description.value,
          run_title: run_title.value,
          web_obj_path: web_obj_path.value,
          epitope: antibody.value,
          regulation: regulation.value,
          tissue_source: tissue_source.value,
          sample_id: sample_id.value,
          experimental_condition: tissue_condition.value,
          pmid: pmid.value,
          group: selected_group.value,
          public: public_run.value,
          date: date_epoch.value,
        };
        const resp = await client.value?.upload_metadata_from_page(data_obj);
        if (resp === 'Success') {
          snackbar.dispatch({ text: 'Successful Upload!', options: { color: 'green' } });
          clear_fields();
        }
      } catch (e) {
        snackbar.dispatch({ text: 'Error! Unsuccessful Upload.', options: { color: 'red' } });
        console.log(e);
      }
    }
    onMounted(() => {
      const res = client.value?.get_available_fields();
      res!.then((result: any) => {
        console.log(result);
        assign_possible_fields_list(result);
      });
      console.log(res);
    });
    return {
      assay,
      web_obj_path,
      organ,
      species,
      tissue_condition,
      channel_width,
      assay_list,
      organ_list,
      species_list,
      channel_width_list,
      run_id,
      run_description,
      run_title,
      pmid,
      sample_id,
      ngs_id,
      regulation,
      antibody,
      epitope_list,
      public_run,
      public_run_items,
      selected_group,
      group_list,
      date_human_readable,
      date_epoch,
      tissue_source,
      tissue_source_list,
      date_human_to_epoch,
      assign_fields,
      auto_populate,
      assign_possible_fields_list,
      upload_data,
    };
  },
});
</script>
