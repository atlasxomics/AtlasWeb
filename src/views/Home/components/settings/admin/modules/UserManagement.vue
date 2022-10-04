<template>
    <v-container>
        <v-row
        >
            <v-col
            cols="2"
            >
                <h2> User List </h2>
                <p v-for="(user, index) in user_list" :key="index">
                    <v-btn
                    @click="user_selected(user)"
                    >
                        {{ user.username }}
                    </v-btn>
                </p>
            </v-col>
            <v-col
            cols="3"
            v-if="selected_user"
            >
            <h2> Account Information </h2>
            <v-text-field
            label="Name"
            readonly
            v-model="selected_user.name"
            >
            </v-text-field>
            <v-text-field
            readonly
            label="Email"
            v-model="selected_user.email"
            >
            </v-text-field>
            <p>
             Status: {{ displayed_user_status }}
             <v-btn
             v-if="displayed_user_status === 'UNCONFIRMED' || displayed_user_status === 'DISABLED'"
             @click="confirm_user"
             color="green"
             >
             Confirm
            </v-btn>
            </p>
            <v-select
            v-model="selected_user.groups"
            :items="groups_list"
            label="User's Groups"
            @change="groups_list_changed()"
            multiple
            >
            </v-select>
            <v-btn
            :disabled="!changes_made"
            @click="write_changes"
            color="primary"
            >
              Confirm Changes
            </v-btn>
            <v-btn
            :class="['ma-2','delete-btn']"
            @click="delete_user_dialog = true"
            color="red">
            Delete User
            </v-btn>
            <v-dialog
            v-model="delete_user_dialog"
            >
              <v-btn
              @click="delete_user"
              >
                Delete User
              </v-btn>
              <v-btn>
                Cancel
              </v-btn>
            </v-dialog>
            </v-col>
            <v-col
            cols="3"
            >
            <h2> Modify Groups </h2>
            <v-text-field
            class="add-group"
            label="New Group Name"
            v-model="entered_group_name"
            >
            </v-text-field>
            <v-text-field
            class="add-group"
            label="Description"
            v-model="entered_group_description"
            >
            </v-text-field>
            <v-btn
            class="ma-2"
            @click="add_group_clicked"
            color="green"
            :disabled="(entered_group_description === '' || entered_group_name === '' || groups_list.includes(entered_group_name))"
            >
            Create Group
            </v-btn>
            <v-btn
            class="ma-2"
            @click="remove_group"
            color="red"
            :disabled="!(groups_list.includes(entered_group_name))"
            >
            Delete Group
            </v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang='ts'>
import { defineComponent, ref, watchEffect, computed, onMounted, watch } from '@vue/composition-api';
import store from '@/store';
import { CreateGroupRequest, GroupRequest, UpdatingGroupsRequest } from '@/types';
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
  name: 'UserManagement',
  setup(props, ctx) {
    const user_list = ref<any[]>([]);
    // const users_groups = ref<any[]>([]);
    const groups_list = ref<any[]>([]);
    const client = computed(() => store.state.client);
    const selected_user = ref<any>(null);
    const number_new_groups_options = ref<number>(1);
    const changes_made = ref<boolean>(false);
    const displayed_user_status = ref<string>('');
    const confirm_user_status = ref<boolean>(false);
    const original_user_status = ref<string>('');
    const removing_group_lis = ref<string[]>([]);
    const adding_group_lis = ref<string[]>([]);
    // const group_changes = new Map<string, boolean>();
    const original_group_lis = ref<string[]>([]);
    const display_group_addition = ref<boolean>(false);
    const entered_group_name = ref<string>('');
    const entered_group_description = ref<string>('');
    const delete_user_dialog = ref<boolean>(false);

    async function delete_user() {
      console.log('deleting user');
      const resp = await client.value?.deleteUser(selected_user.value.username);
      const sc = resp?.status;
      if (sc === 200) {
        delete_user_dialog.value = false;
        snackbar.dispatch({ text: 'User: '.concat(selected_user.value.username).concat(' has been successfully deleted.') });
        delete user_list.value[selected_user.value.username];
        selected_user.value = null;
      }
      console.log(resp);
    }

    function reset_fields() {
      entered_group_name.value = '';
      entered_group_description.value = '';
    }
    async function remove_group() {
      const resp = await client.value?.delete_group(entered_group_name.value);
      const status = resp?.status;
      if (status === 200) {
        snackbar.dispatch({ text: 'Successfully Deleted '.concat(entered_group_name.value).concat('.') });
        const inx = user_list.value.indexOf(entered_group_name.value);
        groups_list.value.splice(inx, 1);
        reset_fields();
      } else {
        snackbar.dispatch({ text: 'Error when deleting '.concat(entered_group_name.value).concat('.') });
      }
    }
    async function add_group_clicked() {
      if (!entered_group_name.value) return;
      if (!entered_group_description.value) return;
      const resp = await client.value?.create_group(entered_group_name.value, entered_group_description.value);
      const status = resp?.status;
      if (status === 200) {
        snackbar.dispatch({ text: 'Successfully created group: '.concat(entered_group_name.value).concat('.') });
        groups_list.value.push(entered_group_name.value);
        reset_fields();
      } else {
        snackbar.dispatch({ text: 'Error when creating group: '.concat(entered_group_name.value).concat('.') });
      }
      console.log(resp?.status);
    }

    function groups_list_changed() {
      console.log(original_group_lis.value);
      adding_group_lis.value = selected_user.value.groups.filter(
        (val: any) => !original_group_lis.value.includes(val),
      );
      removing_group_lis.value = original_group_lis.value.filter(
        (val) => !selected_user.value.groups.includes(val),
      );
      if (removing_group_lis.value.length > 0 || adding_group_lis.value.length > 0 || confirm_user_status.value) {
        changes_made.value = true;
      } else {
        changes_made.value = false;
      }
    }
    function user_selected(user: any) {
      changes_made.value = false;
      selected_user.value = user;
      // users_groups.value = user.groups;
      displayed_user_status.value = user.status;
      original_group_lis.value = user.groups;
      // original_group_lis.value = users_groups.value;
      original_user_status.value = user.status;
    }
    function confirm_user() {
      console.log('confirming user');
      displayed_user_status.value = 'CONFIRMED';
      confirm_user_status.value = true;
      changes_made.value = true;
    }
    async function write_changes() {
      let error = false;
      if (original_user_status.value !== displayed_user_status.value) {
        if (displayed_user_status.value === 'CONFIRMED') {
          console.log('confirming user');
          const resp = await client.value!.confirmUser(selected_user.value.username);
          const confirm_status_sc = resp.status;
          if (confirm_status_sc === 200) {
            const { username } = selected_user.value;
            console.log(username);
            snackbar.dispatch({ text: 'Successfully confirmed user: '.concat(entered_group_name.value).concat('.') });
            user_list.value[username].status = 'CONFIRMED';
            changes_made.value = false;
          } else {
            error = true;
            snackbar.dispatch({ text: 'Error. Unable to confirm user: '.concat(entered_group_name.value).concat('.') });
          }
        }
      }
      if (adding_group_lis.value.length > 0 || removing_group_lis.value.length > 0) {
        const payload: UpdatingGroupsRequest = {
          groups_adding: adding_group_lis.value,
          groups_removing: removing_group_lis.value,
          username: selected_user.value.username,
        };
        const resp = await client.value?.modify_group_list(payload);
        const group_list_sc = resp?.status;
        if (group_list_sc === 200) {
          snackbar.dispatch({ text: 'Successfully modified user`s groups.' });
          adding_group_lis.value = [];
          removing_group_lis.value = [];
          original_group_lis.value = selected_user.value.groups;
        } else {
          error = true;
          snackbar.dispatch({ text: 'Error when modifying user`s groups.' });
        }
        if (error === false) {
          changes_made.value = false;
          // user_list.value = await client.value?.get_user_list();
        }
      }
      for (let i = 0; i < removing_group_lis.value.length; i += 1) {
        const group = adding_group_lis.value[i];
        const inx = selected_user.value.groups.indexOf(group);
        selected_user.value.groups.splice(inx, 1);
        console.log('adding to group '.concat(adding_group_lis.value[i]));
      }
      for (let i = 0; i < adding_group_lis.value.length; i += 1) {
        const group = removing_group_lis.value[i];
        selected_user.value.groups.push(group);
        console.log('removing from group '.concat(removing_group_lis.value[i]));
      }
    }
    onMounted(async () => {
      await clientReady;
      user_list.value = await client.value?.get_user_list();
      groups_list.value = await client.value?.get_group_list();
      console.log(user_list);
    });
    return {
      user_list,
      groups_list,
      selected_user,
      user_selected,
      number_new_groups_options,
      // users_groups,
      changes_made,
      groups_list_changed,
      confirm_user,
      displayed_user_status,
      confirm_user_status,
      original_group_lis,
      removing_group_lis,
      adding_group_lis,
      write_changes,
      add_group_clicked,
      entered_group_name,
      display_group_addition,
      entered_group_description,
      remove_group,
      // disable_user,
      original_user_status,
      reset_fields,
      delete_user_dialog,
      delete_user,
    };
  },
});
</script>

<style>
.aligned {
  text-align: center;
}
.add-group {
  position: relative;
  top: 15px;
}
.delete-btn {
  position: relative;
  top: 30px;
}
</style>
