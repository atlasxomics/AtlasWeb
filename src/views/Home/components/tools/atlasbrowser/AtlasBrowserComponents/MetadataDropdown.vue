<template>
    <v-card
    >
    <v-system-bar flat class="pt-4" color="white">
      <v-spacer></v-spacer>
      <v-btn @click="pageRefresh()" icon><v-icon color="primary">mdi-close</v-icon></v-btn>
    </v-system-bar>
    <v-card-title
    class="justify-center">
        Run ID: {{run_id}}
    </v-card-title>
    <v-card-text>
        <v-select
        v-model="metadata.barcode_filename"
        outlined
        dense
        label="Barcode File"
        :items="barcode_filename_list"
        :disabled="metadata_confirmed_bool"
        >
        </v-select>
        <selector
        v-model="metadata.species"
        display_label="Species"
        :display_options="drop_down_manager.species_list"
        @option-added="drop_down_manager.species_list.push($event)"
        >
        </selector>
        <selector
        v-model="metadata.organ"
        display_label="Organ"
        :display_options="drop_down_manager.organ_list"
        @option-added="drop_down_manager.organ_list.push($event)"
        >
        </selector>
        <selector
        v-model="metadata.tissue_source"
        display_label="Tissue Source"
        :display_options="drop_down_manager.tissue_source_list"
        @option-added="drop_down_manager.tissue_source_list.push($event)"
        >
        </selector>
        <selector
        v-model="metadata.tissue_type"
        display_label="Tissue Type"
        :display_options="drop_down_manager.tissue_type_list"
        @option-added="drop_down_manager.tissue_type_list.push($event)">
        </selector>
        <v-select
        :items="drop_down_manager.assay_list"
        v-model="metadata.assay"
        label="Assay"
        >
        </v-select>
        <selector
        v-show="metadata.assay === 'CUT&Tag'"
        v-model="metadata.antibody"
        display_label="Epitope Name"
        :display_options="drop_down_manager.epitope_list"
        @option-added="drop_down_manager.epitope_list.push($event)"
        >
        </selector>
        <v-text-field
        v-if="lims_available"
        outlined
        dense
        label="Tissue Experimental Condition"
        v-model="metadata.tissueBlockExperiment"
        >
        </v-text-field>
        <v-text-field
        v-model="metadata.chip_resolution"
        outlined
        dense
        label="Chip Resolution"
        >
        </v-text-field>
    </v-card-text>
    <v-card-actions
    class="justify-center"
    >
    <v-btn
    :disabled="!metadata.barcode_filename"
    @click="metadata_confirmed"
    outlined
    >
      Confirm
    </v-btn>
    </v-card-actions>
    </v-card>
</template>

<script>

import { defineComponent, ref } from '@vue/composition-api';
import Selector from '@/views/Home/components/settings/admin/modules/submodules/Selector.vue';

export default defineComponent({
  name: 'MetadataDropdown',
  components: { Selector },
  props: {
    metadata: { type: Object, required: true },
    run_id: { type: String, required: true },
    drop_down_manager: { type: Object, required: true },
    lims_available: { type: Boolean, required: true },
    updating_existing: { type: Boolean, required: true },
    barcode_filename_list: { type: Array, required: true },
    metadata_confirmed_bool: { type: Boolean, required: true },
  },
  setup(props, ctx) {
    function metadata_confirmed() {
      ctx.emit('confirmed');
    }
    function barcode_file_selected() {
      ctx.emit('barcode-file-selected');
    }
    function pageRefresh() {
      ctx.emit('refresh');
    }
    return { metadata_confirmed, barcode_file_selected, pageRefresh };
  },
});
</script>
