<template>
    <v-dialog>
        <v-card-title
        class="justify-center">
            Run ID: {{run_id}}
        </v-card-title>
        <v-card-text>
            <v-text-field
            v-model="metadata.species"
            outlined
            dense
            label="Species"
            readonly
            >
            </v-text-field>
        </v-card-text>
    </v-dialog>
</template>

<script>
import { ref, defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'ViewingTixel',
  setup(props, ctxe) {
    const current_number = ref<number>(0);
    const editied = ref<number>(2);
  },
});
</script>
