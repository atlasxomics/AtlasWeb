<template>
    <v-container>
            <v-card
            width="600"
            class="mx-auto my-12"
            >
              <v-card-title
              class="justify-center"
              >
                Modify Available Groups
              </v-card-title>
            <v-col
            cols="12"
            >
            <v-text-field
            class="add-group"
            label="Group Name"
            v-model="entered_group_name"
            >
            </v-text-field>
            <v-text-field
            class="add-group"
            label="Description"
            v-model="entered_group_description"
            >
            </v-text-field>
            </v-col>
            <v-card-actions
            class="justify-center"
            >
            <v-btn
            @click="add_group_clicked"
            color="green"
            outlined
            :disabled="(entered_group_description === '' || entered_group_name === '' || groups_list.includes(entered_group_name))"
            >
            Create Group
            </v-btn>
            <v-btn
            @click="remove_group"
            color="red"
            :disabled="!(groups_list.includes(entered_group_name))"
            outlined
            >
            Delete Group
            </v-btn>
            </v-card-actions>
            </v-card>
    </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watchEffect } from '@vue/composition-api';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

export default defineComponent({
  name: 'GroupManagment',
  setup(props, ctx) {
    const client = computed(() => store.state.client);
    const groups_list = ref<string[]>([]);
    const entered_group_name = ref<string>('');
    const entered_group_description = ref<string>('');
    function reset_fields() {
      entered_group_name.value = '';
      entered_group_description.value = '';
    }
    function change_made() {
      reset_fields();
      ctx.emit('update-groups');
    }
    async function add_group_clicked() {
      if (!entered_group_name.value) return;
      if (!entered_group_description.value) return;
      const resp = await client.value?.create_group(entered_group_name.value, entered_group_description.value);
      const status = resp?.status;
      if (status === 200) {
        snackbar.dispatch({ text: 'Successfully created group: '.concat(entered_group_name.value).concat('.') });
        groups_list.value.push(entered_group_name.value);
        change_made();
      } else {
        snackbar.dispatch({ text: 'Error when creating group: '.concat(entered_group_name.value).concat('.') });
      }
    }
    async function remove_group() {
      const resp = await client.value?.delete_group(entered_group_name.value);
      const status = resp?.status;
      if (status === 200) {
        snackbar.dispatch({ text: 'Successfully Deleted '.concat(entered_group_name.value).concat('.') });
        const inx = groups_list.value.indexOf(entered_group_name.value);
        groups_list.value.splice(inx, 1);
        change_made();
      } else {
        snackbar.dispatch({ text: 'Error when deleting '.concat(entered_group_name.value).concat('.') });
      }
    }
    onMounted(async () => {
      await clientReady;
      groups_list.value = await client.value?.get_group_list();
    });
    return {
      groups_list,
      entered_group_name,
      entered_group_description,
      add_group_clicked,
      remove_group,
    };
  },
});

</script>
