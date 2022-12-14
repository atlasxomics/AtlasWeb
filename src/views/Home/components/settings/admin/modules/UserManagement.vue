<template>
    <v-container>
            <v-data-table
            :headers="headers"
            :items="user_list"
            >
            <template v-slot:[`item.actions`]="{ item }">
              <v-icon
                @click="edit(item.id)"
                small>
                mdi-pencil
              </v-icon>
              <v-icon
              small>
              mdi-delete
              </v-icon>
            </template>
            </v-data-table>
            <v-dialog
            v-model="editing"
            width="800px"
            @click:outside="popup_close"
            >
              <v-card>
                <v-card-title>
                  <span class="text-h5"> Edit User Information </span>
                </v-card-title>
                <v-row>
                  <v-col
                  style="padding-left: 20px"
                  cols="6"
                  >
                    <v-text-field
                    :value="selected_user.username"
                    label="Username"
                    readonly
                    >
                    <template slot="append-outer">
                      <v-btn  v-if="displayed_user_status === 'UNCONFIRMED'">
                      <v-icon
                      @click="confirm_user_display"
                      color="green"
                      >
                        mdi-check
                      </v-icon>
                      </v-btn>
                      <h5 v-else> Confirmed </h5>
                    </template>
                    </v-text-field>

                    <v-text-field
                    :value="selected_user.name"
                    label="Full Name"
                    readonly
                    >
                    </v-text-field>
                    <v-text-field
                    :value="selected_user.piname"
                    label="PI Name"
                    readonly
                    >
                    </v-text-field>
                  </v-col>
                  <v-col
                  cols="5"
                  >
                    <v-select
                    v-model="selected_user.groups"
                    :items="groups_list"
                    label="User's Groups"
                    @change="groups_list_changed()"
                    multiple
                  >
                  </v-select>
                    <v-text-field
                      :value="selected_user.email"
                      label="Email"
                      readonly
                      >
                    </v-text-field>
                  <v-text-field
                    :value="selected_user.organization"
                    label="Organization"
                    readonly
                    >
                  </v-text-field>
                  </v-col>
                </v-row>
                <v-flex text-xs-center>
                  <v-btn
                  style="justify-content: center;"
                  :disabled="!changes_made"
                  @click="write_changes"
                  color="primary"
                  >
                  Submit Changes
                  </v-btn>
                </v-flex>
              </v-card>
            </v-dialog>
                <!-- <h2> User List </h2>
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
             Email Confirmed: {{ displayed_email_status }}
             <v-btn
             v-if="displayed_email_status === 'false'"
             @click="confirm_user_email"
             color="green"
             >
             Confirm Email
            </v-btn>
            </p>
            <v-text-field
            v-model="selected_user.piname"
            label="PI Name"
            readonly
            >
            </v-text-field>
            <v-text-field
            v-model="selected_user.organization"
            label="Organization"
            readonly
            >
            </v-text-field>
            <p>
             Status: {{ displayed_user_status }}
             <v-btn
             v-if="displayed_user_status === 'UNCONFIRMED' || displayed_user_status === 'DISABLED'"
             @click="confirm_user_display"
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
            <input
            type="checkbox"
            id = "email_checkbox"
            v-model="email_user">
            <label for="email_checkbox">
              Email User
            </label>
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
              <v-btn
              @click="delete_user_dialog = false"
              >
                Cancel
              </v-btn>
            </v-dialog>
            </v-col>
            <v-col
            cols="3"
            > -->
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
    </v-container>
</template>

<script lang='ts'>
import { defineComponent, ref, watchEffect, computed, onMounted, watch } from '@vue/composition-api';
import store from '@/store';
import { CreateGroupRequest, GroupRequest, UpdatingGroupsRequest, UserGroupAssignmentInform } from '@/types';
import { snackbar } from '@/components/GlobalSnackbar';
import Template from '../../../_empty/template.vue';

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
    const headers = [
      { value: 'username', text: 'Username', sortable: false },
      { value: 'status', text: 'User Status' },
      { value: 'group_names', text: 'Groups' },
      { value: 'email', text: 'Email', sortable: false },
      { value: 'email_verified', text: 'Email Verified' },
      { value: 'name', text: 'Full Name', sortable: false },
      { value: 'organization', text: 'Organization' },
      { value: 'piname', text: 'PI Name' },
      { value: 'actions', text: 'Actions' },
    ];
    const selected_user = ref<any>({});
    const number_new_groups_options = ref<number>(1);
    const changes_made = ref<boolean>(false);
    const displayed_user_status = ref<string>('');
    const confirm_user_status = ref<boolean>(false);
    const displayed_email_status = ref<string>('');
    const confirm_user_email_bool = ref<boolean>(false);
    const email_user = ref<boolean>(true);
    const original_user_status = ref<string>('');
    const removing_group_lis = ref<string[]>([]);
    const adding_group_lis = ref<string[]>([]);
    // const group_changes = new Map<string, boolean>();
    const original_group_lis = ref<string[]>([]);
    const display_group_addition = ref<boolean>(false);
    const entered_group_name = ref<string>('');
    const entered_group_description = ref<string>('');
    const delete_user_dialog = ref<boolean>(false);
    const editing = ref<boolean>(false);
    function popup_close() {
      editing.value = false;
      selected_user.value.groups = selected_user.value.group_names.split(',');
    }
    function edit(id: number) {
      changes_made.value = false;
      confirm_user_email_bool.value = false;
      editing.value = true;
      selected_user.value = user_list.value[id];
      original_group_lis.value = selected_user.value.groups;
      displayed_user_status.value = selected_user.value.status;
      original_user_status.value = selected_user.value.status;
      displayed_email_status.value = selected_user.value.email_verified;
    }
    function confirm_user_email() {
      changes_made.value = true;
      displayed_email_status.value = 'true';
      confirm_user_email_bool.value = true;
    }
    async function delete_user() {
      const resp = await client.value?.deleteUser(selected_user.value.username);
      const sc = resp?.status;
      if (sc === 200) {
        delete_user_dialog.value = false;
        snackbar.dispatch({ text: 'User: '.concat(selected_user.value.username).concat(' has been successfully deleted.') });
        delete user_list.value[selected_user.value.username];
        selected_user.value = null;
      }
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
        const inx = groups_list.value.indexOf(entered_group_name.value);
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
    }

    function groups_list_changed() {
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
    function confirm_user_display() {
      displayed_user_status.value = 'CONFIRMED';
      confirm_user_status.value = true;
      changes_made.value = true;
    }
    async function confirm_user_write(username: any) {
      changes_made.value = true;
      try {
        const resp = await client.value!.confirmUser(selected_user.value.username);
        const confirm_status_sc = resp.status;
        if (confirm_status_sc === 200) {
          snackbar.dispatch({ text: 'Successfully confirmed user: '.concat(username).concat('.') });
          user_list.value[username].status = 'CONFIRMED';
          changes_made.value = false;
        } else {
          snackbar.dispatch({ text: 'Error. Unable to confirm user: '.concat(selected_user.value).concat('.') });
        }
      } catch (e) {
        console.log('error in confirming user');
      }
    }
    async function add_user_groups() {
      const payload: UpdatingGroupsRequest = {
        groups_adding: adding_group_lis.value,
        groups_removing: removing_group_lis.value,
        username: selected_user.value.username,
      };
      try {
        const resp = await client.value?.modify_group_list(payload);
        const group_list_sc = resp?.status;
        snackbar.dispatch({ text: 'Successfully modified user`s groups.' });
        if (adding_group_lis.value.length > 0 && email_user.value) {
          const assignment_pl: UserGroupAssignmentInform = {
            group: adding_group_lis.value[0],
            username: selected_user.value.username,
            email: selected_user.value.email,
          };
          client.value!.notify_user_group_assignment(assignment_pl);
        }
        adding_group_lis.value = [];
        removing_group_lis.value = [];
        original_group_lis.value = selected_user.value.groups;
        for (let i = 0; i < removing_group_lis.value.length; i += 1) {
          const group = adding_group_lis.value[i];
          const inx = selected_user.value.groups.indexOf(group);
          selected_user.value.groups.splice(inx, 1);
        }
        for (let i = 0; i < adding_group_lis.value.length; i += 1) {
          const group = removing_group_lis.value[i];
          selected_user.value.groups.push(group);
        }
        changes_made.value = false;
      } catch (e) {
        snackbar.dispatch({ text: 'Error when modifying user`s groups.', options: { color: 'red' } });
        console.log('error modifying groups');
      }
    }
    async function admin_confirm_email(username: any) {
      if (user_list.value[username].status === 'CONFIRMED') {
        try {
          const email_confirm = await client.value!.confirm_user_email_admin(username);
          changes_made.value = false;
          snackbar.dispatch({ text: 'Successfully confirmed user`s email', options: { color: 'green' } });
        } catch (e) {
          snackbar.dispatch({ text: 'Error! Unable to confirm user`s email', options: { color: 'red' } });
        }
      } else {
        snackbar.dispatch({ text: 'Unable to confirm email of an unconfirmed user.', options: { color: 'red' } });
      }
    }
    async function write_changes() {
      const { username } = selected_user.value;
      selected_user.value.group_names = selected_user.value.groups.toString();
      // confirms user status
      if (original_user_status.value !== displayed_user_status.value) {
        changes_made.value = true;
        await confirm_user_write(username);
      }
      // adds user to user groups
      if (adding_group_lis.value.length > 0 || removing_group_lis.value.length > 0) {
        changes_made.value = true;
        await add_user_groups();
      }
      // verifies user's email
      if (confirm_user_email_bool.value) {
        changes_made.value = true;
        await admin_confirm_email(username);
      }
      if (email_user.value && changes_made.value === false) {
        console.log('email user their settings have been updated.');
      }
    }
    onMounted(async () => {
      await clientReady;
      user_list.value = await client.value?.get_user_list();
      user_list.value.forEach((element: any, index: number) => {
        const groups = element.groups.toString();
        user_list.value[index].group_names = groups;
      });
      groups_list.value = await client.value?.get_group_list();
    });
    return {
      user_list,
      groups_list,
      selected_user,
      number_new_groups_options,
      email_user,
      // users_groups,
      changes_made,
      groups_list_changed,
      confirm_user_display,
      confirm_user_write,
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
      displayed_email_status,
      confirm_user_email,
      confirm_user_email_bool,
      headers,
      edit,
      editing,
      popup_close,
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
