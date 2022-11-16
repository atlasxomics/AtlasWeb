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
                <v-select
                label="Assay"
                v-model="assay"
                >
                </v-select>
                <v-select
                label="Species"
                v-model="species"
                >
                </v-select>
                <v-select
                label="Organ"
                v-model="organ"
                >
                </v-select>
                <v-select
                label="Tissue Condition"
                v-model="tissue_condition"
                >
                </v-select>
                <v-select
                label="ROI Channel Width"
                v-model="channel_width"
                >
                </v-select>
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
    </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  name: 'WebUploader',
  setup(props, ctx) {
    const assay = ref<string>('');
    const web_obj_path = ref<string>('');
    const organ = ref<string>('');
    const species = ref<string>('');
    const tissue_condition = ref<string>('');
    const channel_width = ref<string>('');
    return {
      assay,
      web_obj_path,
      organ,
      species,
      tissue_condition,
    };
  },
});
</script>
