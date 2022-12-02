<template>
    <v-container>
          <v-dialog
          :value="show_result_selection"
          width="600px"
          >
            <v-card
            >
              <v-card-title> Multiple results found for same Run ID.</v-card-title>
              <v-data-table
              hide-default-footer
              single-select
              dense
              :items="results_selection_list"
              :headers="results_selection_headers"
              @click:row="results_id_selected"
              >
              </v-data-table>
            </v-card>
          </v-dialog>
        <div
        >
        <v-row>
            <v-col
            cols="12"
            sm="4">
              <v-card-title>
                    Run Information
                </v-card-title>
                <v-row>
                  <v-text-field
                  :disabled="run_id_selected"
                  label="Select Run ID"
                  v-model="search_input"
                  @input="search_runs"
                  @click="run_id_search_clicked = true;"
                  v-click-outside="outside_search"
                  >
                  </v-text-field>
                    <v-icon
                    v-if="unique_run_id && search_input && !run_id_selected"
                    color="green"
                    @click="user_entered_run_id"
                    >
                    mdi-plus
                    </v-icon>
                    <v-icon
                    v-if="run_id_selected"
                    @click="edit_run_id"
                    color="red"
                    >
                      mdi-pencil
                    </v-icon>
                    <v-icon
                    v-if="editing_run_id_selection"
                    color="red"
                    @click="close_edit_run_id"
                    >
                    mdi-close
                    </v-icon>
                </v-row>
                  <v-data-table
                  v-if="!run_id_selected"
                  dense
                  single-select
                  :items-per-page="4"
                  :headers="headers"
                  :items="available_run_ids"
                  @click:row="run_selected"
                  >
                  </v-data-table>
                <v-text-field
                v-model="run_title"
                label="Run Title"
                :disabled="!run_id_selected"
                >
                </v-text-field>
                <v-text-field
                v-model="run_description"
                label="Run Description"
                :disabled="!run_id_selected"
                >
                </v-text-field>
                <v-text-field
                v-model="sample_id"
                label = "Sample ID"
                :disabled="!run_id_selected"
                >
                </v-text-field>
                <v-text-field
                label="Date: MM/DD/YYYY"
                v-model="date_human_readable"
                :disabled="!run_id_selected"
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
            :disabled="!run_id_selected"
            >
            </v-select>
            <selector
            v-show="assay == 'CUT&Tag'"
            :disabled="!run_id_selected"
            :variable="antibody"
            display_label="Epitope Name"
            :display_options="db_connection.epitope_list"
            @option-added="db_connection.epitope_list.push($event)"
            @changed="antibody = $event"
            >
            </selector>
            <selector
              :disabled="!run_id_selected"
              :variable='species'
              display_label="Species"
              :display_options="db_connection.species_list"
              @option-added="db_connection.species_list.push($event)"
              @changed="species = $event"
            >
            </selector>
            <selector
            :disabled="!run_id_selected"
            :variable="organ"
            :display_options="db_connection.organ_list"
            display_label="Organ"
            @option-added="db_connection.organ_list.push($event)"
            @changed="organ = $event"
            >
            </selector>
            <selector
            :disabled="!run_id_selected"
            :variable="tissue_type"
            :display_options="db_connection.tissue_type_list"
            display_label="Tissue Type"
            @option-added="db_connection.tissue_type_list.push($event)"
            @changed="tissue_type = $event"
            >
            </selector>
            <selector
            :disabled="!run_id_selected"
            :variable="tissue_source"
            :display_options="db_connection.tissue_source_list"
            display_label="Tissue Source"
            @option-added="db_connection.tissue_source_list.push($event)"
            @changed="tissue_source = $event">
            </selector>
            <v-text-field
              :disabled="!run_id_selected"
              label="Tissue Condition"
              v-model="tissue_condition"
            >
            </v-text-field>
            <v-select
            :disabled="!run_id_selected"
            label="Channel Width µm"
            v-model="channel_width"
            :items="[10, 20, 25, 50]"
            >
            </v-select>
            <v-select
            :disabled="!run_id_selected"
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
                :disabled="!run_id_selected"
                label="NGS ID"
                v-model="ngs_id"
                >
                </v-text-field>
                <v-select
                :disabled="!run_id_selected"
                :items = public_run_items
                label="Public"
                v-model="public_run"
                >
                </v-select>
                <v-select
                :disabled="!run_id_selected"
                :items="db_connection.group_list"
                label="Group"
                v-model="selected_group"
                >
                </v-select>
                <v-text-field
                :disabled="!run_id_selected"
                v-model="web_obj_path"
                label="Path"
                >
                </v-text-field>
                <v-select
                :disabled="!run_id_selected"
                label="PMID"
                :items="db_connection.pmid_list"
                v-model="pmid"
                >
                </v-select>
            </v-col>
        </v-row>
        <v-row>
            <v-col
            >
                <v-btn
                :disabled="!run_id_selected"
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

export default defineComponent({
  name: 'WebUploader',
  components: { Selector },
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
    const headers = [{ text: 'Run ID', value: 'run_id', sortable: false }];
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
    const assay = ref<string>('');
    const web_obj_path = ref<string>('');
    const organ = ref<string>('');
    const species = ref<string>('');
    const sample_id = ref<string>('');
    const tissue_type = ref<string>('');
    // const tissue_type_list = ref<string[]>([]);
    const antibody = ref<string>('');
    const tissue_condition = ref<string>('');
    const pmid = ref<string>('');
    // const pmid_list = ref<string[]>([]);
    const tissue_source = ref<string>('');
    const channel_width = ref<string>('');
    const number_channels = ref<string>('');
    const search_input = ref<string>('');
    // const assay_list = ref<Array<string>>([]);
    // const assay_list = computed(() => db_connection.field_options.assay_list);
    // const organ_list = ref<Array<string>>([]);
    // const species_list = ref<Array<string>>([]);
    // const epitope_list = ref<Array<string>>([]);
    // const group_list = ref<Array<string>>([]);
    const available_run_ids = ref<Array<Record<string, any>>>([]);
    // const tissue_source_list = ref<Array<string>>([]);
    // const channel_width_list = ref<Array<string>>([]);
    const results_selection_list = ref<any[]>([]);
    const run_id = ref<string>('');
    const ngs_id = ref<string>('');
    const results_id = ref<number|null>(null);
    const run_id_search_clicked = ref<boolean>(false);
    const multiple_run_information = ref<Record<string, any>>({});
    const run_id_selected = ref<boolean>(false);
    const run_description = ref<string>('');
    const run_title = ref<string>('');
    const regulation = ref<string>('');
    const public_run = ref<boolean>(false);
    const show_result_selection = ref<boolean>(false);
    const selected_group = ref<string>('');
    const editing_run_id_selection = ref<boolean>(false);
    const run_ids = ref<Record<string, any>[]>([]);
    const unique_run_id = computed(() => {
      let res = true;
      available_run_ids.value.forEach((element: any) => {
        if (element.run_id === search_input.value) {
          res = false;
        }
      });
      return res;
    });
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
    function search_runs() {
      const regexString = search_input.value;
      const matches: Array<Record<string, any>> = [];
      const regex = new RegExp(`.*${regexString}.*`);
      run_ids.value.forEach((element: any) => {
        if (regex.test(element.run_id)) {
          matches.push({ run_id: element.run_id });
        }
      });
      available_run_ids.value = matches;
    }
    function edit_run_id() {
      run_id_selected.value = false;
      editing_run_id_selection.value = true;
      search_runs();
    }
    function assign_fields(db_obj: any) {
      console.log(db_obj);
      run_id.value = db_obj.run_id;
      search_input.value = run_id.value;
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
    async function auto_populate_from_results_id(id: number) {
      try {
        const resp = await client.value?.get_info_from_results_id(id);
        assign_fields(resp);
        run_id_selected.value = true;
      } catch (e) {
        console.log(e);
      }
    }
    async function auto_populate_from_run_id() {
      try {
        const resp: any[] = await client.value?.get_info_from_run_id(run_id.value);
        if (resp[0] === 'Not-Found') {
          snackbar.dispatch({ text: 'Run ID Not Present in Database.', options: { color: 'red' } });
          clear_fields();
        } else {
          snackbar.dispatch({ text: 'Run Information Successfully Loaded.', options: { color: 'green' } });
          if (resp.length > 1) {
          // handle multiple runs
            results_selection_list.value = [];
            resp.forEach((element: any, index: number) => {
              const cop = { ...element };
              cop.inx = index;
              results_selection_list.value.push(cop);
            });
            show_result_selection.value = true;
          } else {
            assign_fields(resp[0]);
          }
        }
      } catch (e) {
        snackbar.dispatch({ text: 'Error during search.', options: { color: 'red' } });
      }
    }
    function outside_search() {
      run_id_search_clicked.value = false;
    }
    function user_entered_run_id() {
      clear_fields();
      const temp_ele = { run_id: search_input.value };
      editing_run_id_selection.value = false;
      run_ids.value.push(temp_ele);
      available_run_ids.value.push(temp_ele);
      run_id.value = search_input.value;
      run_id_selected.value = true;
    }
    function results_id_selected(ele: any) {
      const { inx: index } = ele;
      const data = results_selection_list.value[index];
      assign_fields(data);
      show_result_selection.value = false;
    }
    function run_selected(ele: any) {
      search_input.value = ele.run_id;
      run_id_selected.value = true;
      run_id.value = ele.run_id;
      editing_run_id_selection.value = false;
      auto_populate_from_run_id();
    }
    function close_edit_run_id() {
      editing_run_id_selection.value = false;
      run_id_selected.value = true;
      search_input.value = run_id.value;
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
          search_input.value = '';
          run_id_selected.value = false;
          available_run_ids.value = run_ids.value;
        }
      } catch (e) {
        snackbar.dispatch({ text: 'Error! Unsuccessful Upload.', options: { color: 'red' } });
        console.log(e);
      }
    }
    onMounted(() => {
      console.log(db_connection.group_list);
      const run_ids_promise = client.value?.get_run_ids();
      run_ids_promise!.then((value: any[]) => {
        run_ids.value = value;
        available_run_ids.value = value;
      });
    });
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
      run_ids,
      run_id_search_clicked,
      available_run_ids,
      search_input,
      headers,
      unique_run_id,
      run_id_selected,
      editing_run_id_selection,
      show_result_selection,
      results_selection_headers,
      multiple_run_information,
      tissue_type,
      db_connection,
      results_selection_list,
      auto_populate_from_results_id,
      results_id_selected,
      close_edit_run_id,
      edit_run_id,
      user_entered_run_id,
      search_runs,
      outside_search,
      date_human_to_epoch,
      assign_fields,
      auto_populate_from_run_id,
      upload_data,
      run_selected,
    };
  },
});
</script>
