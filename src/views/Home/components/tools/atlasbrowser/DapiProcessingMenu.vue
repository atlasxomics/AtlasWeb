<template>
    <v-card>
        <v-slider
        v-model="scaleFactor"
        class="pl-2"
        dense
        height="20"
        label="Zoom"
        type="number"
        min="0.15"
        max="1.5"
        step="0.01"
        @change="changeScaleFactor"
        >
        </v-slider>
        <v-slider
        dense
        label="Threshold"
        type="number"
        min="20"
        max="200"
        step="1"
        v-model="threshold"
        >
        </v-slider>
        Threshold: {{ threshold }}
        <v-btn
        @click="countNuclei"
        >
            Count Nuclei
        </v-btn>
    </v-card>
</template>

<script lang="ts">
import { ref, defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'DapiProcessingMenu',
  setup(props, ctxe) {
    const scaleFactor = ref<number>(0.15);
    const threshold = ref<number>(90);
    function changeScaleFactor(value: number) {
      this.$emit('changed-scale', this.$event, scaleFactor);
    }
    function countNuclei() {
      this.$emit('count-nuclei', this.$event, threshold);
    }
    return {
      changeScaleFactor,
      scaleFactor,
      threshold,
      countNuclei,
    };
  },
});
</script>
