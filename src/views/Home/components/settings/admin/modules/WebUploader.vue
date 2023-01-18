<template>
    <v-container>
        <div
        >
        <v-row>

            <v-col
            cols="12"
            sm="4">
              <v-card-title>
                    Run Information
                </v-card-title>
                <run-id-selector
                 :new_available="false"
                 @clear-fields="clear_fields"
                 @run-selected="run_selected"
                 @edit-run-id="run_id_confirmed = false;"
                 @custom-run-id="custom_run_id"
                 @close-edit-run-id="run_id_confirmed = true;"
                 :label="run_id_confirmed ? 'Run ID' : 'New Run ID'"
                 ref="run_id_selector"
                >
                </run-id-selector>
                <v-text-field
                v-model="run_title"
                label="Run Title"
                :disabled="!run_id_confirmed"
                >
                </v-text-field>
                <v-text-field
                v-model="run_description"
                label="Run Description"
                :disabled="!run_id_confirmed"
                >
                </v-text-field>
                <v-text-field
                v-model="sample_id"
                label = "Sample ID"
                :disabled="!run_id_confirmed"
                >
                </v-text-field>
                <v-text-field
                label="Date: MM/DD/YYYY"
                v-model="date_human_readable"
                :disabled="!run_id_confirmed"
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
            :items="db_connection.assay_list"
            :disabled="!run_id_confirmed"
            >
            </v-select>
            <selector
            v-show="assay == 'CUT&Tag'"
            :disabled="!run_id_confirmed"
            v-model="antibody"
            display_label="Epitope Name"
            :display_options="db_connection.epitope_list"
            @option-added="db_connection.epitope_list.push($event)"
            >
            </selector>
            <selector
              :disabled="!run_id_confirmed"
              v-model="species"
              display_label="Species"
              :display_options="db_connection.species_list"
              @option-added="db_connection.species_list.push($event)"
            >
            </selector>
            <selector
            :disabled="!run_id_confirmed"
            v-model="organ"
            :display_options="db_connection.organ_list"
            display_label="Organ"
            @option-added="db_connection.organ_list.push($event)"
            >
            </selector>
            <selector
            :disabled="!run_id_confirmed"
            v-model="tissue_type"
            :display_options="db_connection.tissue_type_list"
            display_label="Tissue Type"
            @option-added="db_connection.tissue_type_list.push($event)"
            >
            </selector>
            <selector
            :disabled="!run_id_confirmed"
            v-model="tissue_source"
            :display_options="db_connection.tissue_source_list"
            display_label="Tissue Source"
            @option-added="db_connection.tissue_source_list.push($event)"
            >
            </selector>
            <v-text-field
              :disabled="!run_id_confirmed"
              label="Tissue Condition"
              v-model="tissue_condition"
            >
            </v-text-field>
            <v-select
            :disabled="!run_id_confirmed"
            label="Channel Width µm"
            v-model="channel_width"
            :items="[10, 20, 25, 50]"
            >
            </v-select>
            <v-select
            :disabled="!run_id_confirmed"
            label="Number of Channels"
            v-model="number_channels"
            :items="[50, 100]"
            >
            </v-select>
            </v-col>
            <v-col
            cols="12"
            sm="4"
            >
                <v-card-title>
                    Web Object
                </v-card-title>
                <v-text-field
                :disabled="!run_id_confirmed"
                label="NGS ID"
                v-model="ngs_id"
                >
                </v-text-field>
                <v-select
                :disabled="!run_id_confirmed"
                :items = public_run_items
                label="Public"
                v-model="public_run"
                >
                </v-select>
                <v-select
                :disabled="!run_id_confirmed"
                :items="db_connection.group_list"
                label="Group"
                v-model="selected_group"
                >
                </v-select>
                <v-select
                :disabled="!run_id_confirmed"
                label="PMID"
                :items="db_connection.pmid_list"
                v-model="pmid"
                >
                </v-select>
                <v-text-field
                v-if="web_obj_created"
                :disabled="!run_id_confirmed"
                v-model="web_obj_path"
                label="Path"
                readonly
                >
                </v-text-field>
                <v-card
                v-if="!web_obj_path && run_id_confirmed && data_loaded"
                class="ma-2 warning-card">
                  <v-card-title class="warning-card__title">
                    <v-icon class="warning-card__icon" color="warning">mdi-alert-circle</v-icon>
                    <span class="warning-card__text">Web Object Not Created</span>
                  </v-card-title>
                  <v-card-text class="warning-card__message">
                    <p>
                      Navigate to the "Create a Run" tab to create a web object for this run.
                    </p>
                    <p>
                      Web Objects are required to view data in AtlasXplore.
                    </p>
                  </v-card-text>
                </v-card>
                <v-card
                v-if="web_obj_created && run_id_confirmed && data_loaded"
                class="ma-2 success-card">
                  <v-card-title class="success-card__title">
                    <v-icon class="success-card__icon" color="success">mdi-check-circle</v-icon>
                    <span class="success-card__text">Web Object Uploaded.</span>
                  </v-card-title>
                  <v-card-text class="success-card__message">
                    <p>
                    The run is successfully uploaded using the path above.
                    </p>
                    <p>
                    To change the web object used for this run, navigate to the "Create a Run" tab.
                    </p>
                  </v-card-text>
                </v-card>
                <v-card
                v-if="!web_obj_created && web_obj_path && run_id_confirmed && data_loaded"
                class="ma-2 path-no-created-card">
                  <v-card-title class="path-no-created-card__title">
                    <v-icon class="path-no-created-card__icon" color="#FFC300">mdi-minus-circle</v-icon>
                    <span class="path-no-created-card__text">Web Object Available.</span>
                  </v-card-title>
                  <v-card-text class="path-no-created-card__message">
                    <p>
                    The run has been generated but not yet uploaded.
                    </p>
                    <p>
                    Fill out the form and click submit to upload the run.
                    </p>
                  </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col
            >
                <v-btn
                :disabled="!run_id_confirmed"
                style="position: relative; left: 50%; bottom: 5%;"
                @click="upload_data"
                >
                  Submit
                </v-btn>
            </v-col>
        </v-row>
        </div>
    </v-container>
</template>

<script lang="ts">
import { Client } from '@/api';
import { snackbar } from '@/components/GlobalSnackbar';
import store from '@/store';
import { defineComponent, onMounted, ref, computed, watch } from '@vue/composition-api';
import Selector from './Selector.vue';
import { DropDownFieldManager } from './DropDownFieldManager';
import RunIdSelector from './RunIdSelector.vue';

export default defineComponent({
  name: 'WebUploader',
  components: { Selector, RunIdSelector },
  setup(props, ctx) {
    const date_human_readable = ref<string>('');
    function date_human_to_epoch(date_human: string) {
      const lis = date_human.split('/');
      const [month, day, year] = lis;
      const year_int = Number.parseInt(year, 10);
      const month_int = Number.parseInt(month, 10) - 1;
      const day_int = Number.parseInt(day, 10);
      const epoch = Date.UTC(year_int, month_int, day_int);
      return epoch;
    }
    const results_selection_headers: any[] = [{ text: 'NGS ID', value: 'ngs_id' }, { text: 'Results ID', value: 'results_id' }];
    const date_epoch = computed(() => date_human_to_epoch(date_human_readable.value));
    const month_dict: Record<string, any> = {
      Jan: '1',
      Feb: '2',
      Mar: '3',
      Apr: '4',
      May: '5',
      Jun: '6',
      Jul: '7',
      Aug: '8',
      Sep: '9',
      Oct: '10',
      Nov: '11',
      Dec: '12',
    };
    const client = computed(() => store.state.client);
    const db_connection = new DropDownFieldManager();
    const data_loaded = ref<boolean>(false);
    const assay = ref<string>('');
    const web_obj_path = ref<string>('');
    const organ = ref<string>('');
    const species = ref<string>('');
    const sample_id = ref<string>('');
    const tissue_type = ref<string>('');
    const antibody = ref<string>('');
    const tissue_condition = ref<string>('');
    const pmid = ref<string>('');
    const tissue_source = ref<string>('');
    const channel_width = ref<string>('');
    const number_channels = ref<string>('');
    const available_run_ids = ref<Array<Record<string, any>>>([]);
    const results_selection_list = ref<any[]>([]);
    const run_id = ref<string>('');
    const ngs_id = ref<string>('');
    const results_id = ref<number|null>(null);
    const multiple_run_information = ref<Record<string, any>>({});
    const run_description = ref<string>('');
    const run_title = ref<string>('');
    const regulation = ref<string>('');
    const public_run = ref<boolean>(false);
    const selected_group = ref<string>('');
    const run_id_confirmed = ref<boolean>(false);
    const web_obj_created = ref<boolean>(true);
    const public_run_items: any[] = [
      {
        text: 'True',
        value: true,
      },
      {
        text: 'False',
        value: false,
      },
    ];
    function custom_run_id(new_run_id: string) {
      run_id_confirmed.value = true;
      run_id.value = new_run_id;
      web_obj_created.value = false;
    }
    function assign_fields(db_obj: any) {
      run_id.value = db_obj.run_id;
      assay.value = db_obj.assay;
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
      channel_width.value = db_obj.channel_width;
      number_channels.value = db_obj.number_channels;
      tissue_source.value = db_obj.tissue_source;
      results_id.value = db_obj.results_id;
      antibody.value = db_obj.epitope;
      tissue_type.value = db_obj.tissue_type;
      pmid.value = db_obj.pmid;
      if (db_obj.public === 1) {
        public_run.value = true;
      } else {
        public_run.value = false;
      }
      if (db_obj.web_object_available === 1) {
        web_obj_created.value = true;
      } else {
        web_obj_created.value = false;
      }
      if (db_obj.date) {
        const human_date = new Date(0);
        human_date.setUTCMilliseconds(db_obj.date);
        const utc_string = human_date.toUTCString();
        const utc_lis = utc_string.split(' ');
        const day = utc_lis[1];
        const human_month: string = utc_lis[2];
        const year = utc_lis[3];
        console.log(human_month);
        const number_month = month_dict[human_month];
        console.log(number_month);
        date_human_readable.value = number_month.concat('/'.concat(day.concat('/'.concat(year))));
      }
    }
    function clear_fields() {
      run_id.value = '';
      channel_width.value = '';
      number_channels.value = '';
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
      tissue_type.value = '';
      public_run.value = false;
      ngs_id.value = '';
      results_id.value = null;
    }
    async function auto_populate_from_run_id(user_specified_run_id: string | null) {
      try {
        let run_id_to_use = run_id.value;
        if (user_specified_run_id) {
          run_id_to_use = user_specified_run_id;
          const run_id_selector = ctx.refs.run_id_selector as any;
          run_id_selector.set_run_id(run_id_to_use);
        }
        const resp: any[] = await client.value?.get_info_from_run_id(run_id_to_use);
        if (resp[0] === 'Not-Found') {
          snackbar.dispatch({ text: 'Run ID Not Present in Database.', options: { color: 'red' } });
          clear_fields();
        } else {
          snackbar.dispatch({ text: 'Run Information Successfully Loaded.', options: { color: 'green' } });
          assign_fields(resp[0]);
          run_id_confirmed.value = true;
          data_loaded.value = true;
        }
      } catch (e) {
        snackbar.dispatch({ text: 'Error during search.', options: { color: 'red' } });
      }
    }
    function run_selected(ele: any) {
      data_loaded.value = false;
      run_id.value = ele;
      auto_populate_from_run_id(null);
      run_id_confirmed.value = true;
    }
    function results_id_selected(ele: any) {
      const { inx: index } = ele;
      const data = results_selection_list.value[index];
      assign_fields(data);
    }
    async function upload_data() {
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
          channel_width: channel_width.value,
          number_channels: number_channels.value,
          ngs_id: ngs_id.value,
          results_id: results_id.value,
          tissue_type: tissue_type.value,
        };
        const resp = await client.value?.upload_metadata_from_page(data_obj);
        if (resp === 'Success') {
          snackbar.dispatch({ text: 'Successful Upload!', options: { color: 'green' } });
          clear_fields();
          run_id_confirmed.value = false;
          const comp = ctx.refs.run_id_selector as any;
          console.log(comp);
          comp.run_successfully_uploaded();
          // set available run_ids to be all run ids
        }
      } catch (e) {
        snackbar.dispatch({ text: 'Error! Unsuccessful Upload.', options: { color: 'red' } });
        console.log(e);
      }
    }
    return {
      assay,
      web_obj_path,
      organ,
      species,
      tissue_condition,
      channel_width,
      run_id,
      run_description,
      run_title,
      pmid,
      sample_id,
      ngs_id,
      regulation,
      antibody,
      public_run,
      public_run_items,
      selected_group,
      date_human_readable,
      date_epoch,
      tissue_source,
      number_channels,
      available_run_ids,
      results_selection_headers,
      multiple_run_information,
      tissue_type,
      db_connection,
      results_selection_list,
      run_id_confirmed,
      web_obj_created,
      data_loaded,
      results_id_selected,
      date_human_to_epoch,
      assign_fields,
      auto_populate_from_run_id,
      upload_data,
      clear_fields,
      run_selected,
      custom_run_id,
    };
  },
});
</script>

<style scoped>
  .warning-card {
    background-color: #fff3e0;
    border: 1px solid #ff9800;
  }
  .warning-card__title {
    align-items: center;
    display: flex;
  }
  .warning-card__icon {
    font-size: 2em;
    margin-right: 0.5em;
  }
  .warning-card__text {
    font-size: 1.1em;
    font-weight: bold;
  }
  .warning-card__message {
    font-size: 1em;
    margin-top: 1em;
  }

  .success-card {
    background-color: #e0f7fa;
    border: 1px solid #00bcd4;
  }
  .success-card__title {
    align-items: center;
    display: flex;
  }
  .success-card__icon {
    font-size: 2em;
    margin-right: 0.5em;
  }
  .success-card__text {
    font-size: 1.25em;
    font-weight: bold;
  }
  .success-card__message {
    font-size: 1em;
    margin-top: 1em;
  }
  .path-no-created-card {
    background-color: #ffffe0;
    border: 1px solid #00bcd4;
  }
  .path-no-created-card__title {
    align-items: center;
    display: flex;
  }
  .path-no-created-card__icon {
    font-size: 2em;
    margin-right: 0.5em;
  }
  .path-no-created-card__text {
    font-size: 1.25em;
    font-weight: bold;
  }
  .path-no-created-card__message {
    font-size: 1em;
    margin-top: 1em;
  }
</style>
