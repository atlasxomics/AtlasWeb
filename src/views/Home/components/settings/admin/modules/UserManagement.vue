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
             Status: {{ confirmation_status }}
             <v-btn
             v-if="confirmation_status === 'UNCONFIRMED'"
             @click="confirm_user"
             >
             Confirm User
              </v-btn>
            </p>
            <v-select
            v-model="users_groups"
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
            </v-col>
            <v-col
            cols="3"
            >
            <h2> Create Group </h2>
            <v-text-field
            class="add-group"
            label="New Group Name"
            v-model="new_group_name"
            >
            </v-text-field>
            <v-btn
            @click="add_group_clicked"
            :disabled="!new_group_name || groups_list.includes(new_group_name)"
            >
            Add Group
            </v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang='ts'>
import { defineComponent, ref, watchEffect, computed, onMounted, watch } from '@vue/composition-api';
import store from '@/store';
import { UpdatingGroupsRequest } from '@/types';

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
    const users_groups = ref<any[]>([]);
    const groups_list = ref<any[]>([]);
    const client = computed(() => store.state.client);
    const selected_user = ref<any>(null);
    const number_new_groups_options = ref<number>(1);
    const selected_groups = ref<any[]>([]);
    const changes_made = ref<boolean>(false);
    const confirmation_status = ref<string>('');
    const confirm_user_status = ref<boolean>(false);
    const removing_group_lis = ref<string[]>([]);
    const adding_group_lis = ref<string[]>([]);
    // const group_changes = new Map<string, boolean>();
    const original_group_lis = ref<string[]>([]);
    const display_group_addition = ref<boolean>(false);
    const new_group_name = ref<string | null>(null);
    function add_group_clicked() {
      if (!new_group_name) return;
      console.log('creating group'.concat(new_group_name.value));
      groups_list.value.push(new_group_name.value);
    }

    function groups_list_changed() {
      console.log(original_group_lis.value);
      adding_group_lis.value = users_groups.value.filter(
        (val) => !original_group_lis.value.includes(val),
      );
      removing_group_lis.value = original_group_lis.value.filter(
        (val) => !users_groups.value.includes(val),
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
      users_groups.value = user.groups;
      confirmation_status.value = user.status;
      original_group_lis.value = users_groups.value;
    }
    function confirm_user() {
      console.log('confirming user');
      confirmation_status.value = 'CONFIRMED';
      confirm_user_status.value = true;
      changes_made.value = true;
    }
    async function write_changes() {
      if (confirm_user_status.value) {
        console.log('confirming user status');
        // client.value!.confirmUser(selected_user.name);
      }
      for (let i = 0; i < adding_group_lis.value.length; i += 1) {
        console.log('adding to group '.concat(adding_group_lis.value[i]));
      }
      for (let i = 0; i < removing_group_lis.value.length; i += 1) {
        console.log('removing from group '.concat(removing_group_lis.value[i]));
      }
      if (adding_group_lis.value.length > 0 || removing_group_lis.value.length > 0) {
        const payload: UpdatingGroupsRequest = {
          groups_adding: adding_group_lis.value,
          groups_removing: removing_group_lis.value,
          username: selected_user.value.username,
        };
        const resp = await client.value?.modify_group_list(payload);
        if (resp === 'Success') {
          changes_made.value = false;
        }
      }
      user_list.value = await client.value?.get_user_list();
      original_group_lis.value = user_list.value[selected_user.value.username].groups;
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
      selected_groups,
      users_groups,
      changes_made,
      groups_list_changed,
      confirm_user,
      confirmation_status,
      confirm_user_status,
      original_group_lis,
      removing_group_lis,
      adding_group_lis,
      write_changes,
      add_group_clicked,
      new_group_name,
      display_group_addition,
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
</style>
