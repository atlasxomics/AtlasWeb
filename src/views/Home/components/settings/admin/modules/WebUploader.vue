<template>
    <v-container>
        <v-row>
            <v-col
            style="position: relative; right: 15%;"
            cols="12"
            sm="4"
            >
            <v-card-title
            class="justify-center"
            >
                Metadata
            </v-card-title>
            <selector
            :variable="assay"
            :display_label="'Assay'"
            :display_options="assay_list"
            @custom-field="assay_list.splice(assay_list.length - 2, 0, $event);"
            @changed="assay = $event"
            >
            </selector>
            <!-- <selector
              var_name='species'
              :display_label="'Species'"
              :display_options="species_list"
              @custom-field="create_new_option">
            </selector> -->
                <!-- <v-select
                label="Organ"
                v-model="organ"
                :items="organ_list"
                >
                </v-select>
                <v-select
                label="ROI Channel Width (µm)"
                v-model="channel_width"
                :items="channel_width_list"
                >
                </v-select>
                <v-text-field
                label="Tissue Condition"
                v-model="tissue_condition"
                >
                </v-text-field> -->
            </v-col>
            <v-col
            cols="12"
            sm="4"            >
                <v-card-title>
                    Run Information
                </v-card-title>
                <v-text-field
                label="Run ID"
                >
                </v-text-field>
                <v-text-field
                label="Run Title"
                >
                </v-text-field>
                <v-text-field
                label="Run Description"
                >
                </v-text-field>
            </v-col>
            <v-col
            cols="12"
            sm="4"
            style="position: relative; left: 80px"
            >
                <v-card-title>
                    Web Object Path
                </v-card-title>
                <v-text-field
                label="Path"
                >
                </v-text-field>
            </v-col>
        </v-row>
        <v-row>
            <v-col
            style="position: relative; left: 45%;"
            >
                <v-btn
                style="position: relative; bottom: 5%;"
                >
                   Upload
                </v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { Client } from '@/api';
import store from '@/store';
import { defineComponent, onMounted, ref, computed } from '@vue/composition-api';
import Selector from './Selector.vue';

export default defineComponent({
  components: { Selector },
  name: 'WebUploader',
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const assay = ref<string>('');
    const web_obj_path = ref<string>('');
    const organ = ref<string>('');
    const species = ref<string>('');
    const tissue_condition = ref<string>('');
    const channel_width = ref<string>('');
    const assay_list = ref<Array<string>>([]);
    const organ_list = ref<Array<string>>([]);
    const species_list = ref<Array<string>>([]);
    const channel_width_list = ref<Array<string>>([]);
    function assign_possible_fields(fields_from_db: any) {
      assay_list.value = fields_from_db.assay_list;
      species_list.value = fields_from_db.species_list;
      organ_list.value = fields_from_db.organ_list;
      channel_width_list.value = fields_from_db.channel_width_list;
    }
    function create_new_option(var_name: string, var_value: string) {
      console.log('dog');
    }
    onMounted(() => {
      const res = client.value?.get_available_fields();
      res!.then((result: any) => {
        console.log(result);
        assign_possible_fields(result);
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
      create_new_option,
      assign_possible_fields,
    };
  },
});
</script>
