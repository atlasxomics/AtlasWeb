<template>
    <v-container>
        <v-row>
            <v-col>
                <v-card flat width="500px">
                    <v-card-title> Select Run Id </v-card-title>
                    <v-card-actions>
                        <run-id-selector
                        :new_available="false"
                        @edit-run-id="edit_run_id"
                        @close-edit-run-id="close_edit_run_id"
                        @custom-run-id="user_entered_run_id"
                        @run-selected="run_id_selected"
                        >
                        </run-id-selector>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang='ts'>

import { ref, defineComponent, computed, onMounted } from '@vue/composition-api';
import { Client } from '@/api';
import store from '@/store';
import RunIdSelector from './submodules/RunIdSelector.vue';

export default defineComponent({
  name: 'AddFiles',
  components: { RunIdSelector },
  setup(props: any, ctx: any) {
    const client = computed(() => store.state.client);
    function run_id_selected(ev: any) {
      console.log('run_id_selected', ev);
    }
    function edit_run_id() {
      console.log('edit_run_id');
    }
    function close_edit_run_id() {
      console.log('close_edit_run_id');
    }
    function user_entered_run_id(ev: any) {
      console.log('user_entered_run_id', ev);
    }
    return {
      run_id_selected,
      edit_run_id,
      close_edit_run_id,
      user_entered_run_id,
    };
  },
});
</script>
