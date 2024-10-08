<template>
    <v-container>
        <v-col>
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
              @click="deletion_button_selected(item.id)"
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
              <v-card-title
              >
                Edit User Information
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
                <v-card-actions
                class="justify-center"
                >
                  <v-checkbox
                    style="position: relative; left: 5px;"
                    v-model="email_user"
                    :label="`Email User`"
                  >
                  </v-checkbox>
                  <v-btn
                  style="position: relative; left: 25px;"
                  :disabled="!changes_made"
                  @click="write_changes"
                  color="primary"
                  >
                  Submit Changes
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
            <v-dialog
            width="800px"
            v-model="delete_user_dialog"
            >
            <v-card>
              <v-card-title
              class="justify-center"
              >
                Are you sure you want to delete user: {{selected_user.username}}
              </v-card-title>
              <v-card-actions
              class="justify-center"
              >
                  <v-btn
                    outlined
                    large
                    fab
                    @click="delete_user"
                    color="red"
                  >
                    <v-icon> mdi-delete </v-icon>
                  </v-btn>
                  <v-btn
                  @click="delete_user_dialog = false"
                  outlined
                  >
                  Cancel
                  </v-btn>
              </v-card-actions>
            </v-card>
            </v-dialog>

        </v-col>
    </v-container>
</template>

<script lang='ts'>
import { defineComponent, ref, watchEffect, computed, onMounted, watch } from '@vue/composition-api';
import store from '@/store';
import { CreateGroupRequest, GroupRequest, UpdatingGroupsRequest, UserGroupAssignmentInform } from '@/types';
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
    function deletion_button_selected(id: number) {
      selected_user.value = user_list.value[id];
      delete_user_dialog.value = true;
    }
    async function delete_user() {
      const resp = await client.value?.deleteUser(selected_user.value.username);
      const sc = resp?.status;
      if (sc === 200) {
        delete_user_dialog.value = false;
        snackbar.dispatch({ text: 'User: '.concat(selected_user.value.username).concat(' has been successfully deleted.') });
        // remove the item with the value selected_user.value.username from the user_list
        user_list.value = user_list.value.filter((val) => val.username !== selected_user.value.username);
        for (let i = 0; i < user_list.value.length; i += 1) {
          user_list.value[i].id = i;
        }
        delete_user_dialog.value = false;
      } else {
        snackbar.dispatch({ text: 'Error when attempting to delete user: '.concat(selected_user.value.username).concat('.') });
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
            name: selected_user.value.name,
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
    async function update_groups_list() {
      groups_list.value = await client.value?.get_group_list();
    }
    onMounted(async () => {
      await clientReady;
      user_list.value = await client.value?.get_user_list();
      user_list.value.forEach((element: any, index: number) => {
        const groups = element.groups.toString();
        user_list.value[index].group_names = groups;
      });
      await update_groups_list();
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
      display_group_addition,
      deletion_button_selected,
      // disable_user,
      original_user_status,
      delete_user_dialog,
      delete_user,
      displayed_email_status,
      confirm_user_email,
      confirm_user_email_bool,
      headers,
      edit,
      editing,
      popup_close,
      update_groups_list,
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
