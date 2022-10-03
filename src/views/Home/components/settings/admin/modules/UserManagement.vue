<template>
    <v-container>
        <v-row>
            <v-col>
                <h2> User List </h2>
                <p v-for="(user, index) in user_list" :key="index">
                    <v-btn
                    @click="user_selected(user)"
                    >
                        {{ user.username }}
                    </v-btn>
                </p>
            </v-col>
            <v-spacer/>
            <v-col
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
            <!-- <p v-for="(group, index) in selected_user.groups" :key="index">
            {{ group }}
            </p>
            <p v-for="number in (number_new_groups_options.length + 1)" :key="number">
              <v-select
              :items="groups_list"
              label="Add Group"
              >
              </v-select>
            </p> -->
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang='ts'>
import { defineComponent, ref, watchEffect, computed, onMounted, watch } from '@vue/composition-api';
import store from '@/store';
import { add } from 'lodash';

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

    function groups_list_changed() {
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
    function write_changes() {
      if (confirm_user_status.value) {
        console.log('confirming user status');
      }
      for (let i = 0; i < adding_group_lis.value.length; i += 1) {
        console.log('adding to group '.concat(adding_group_lis.value[i]));
      }
      for (let i = 0; i < removing_group_lis.value.length; i += 1) {
        console.log('removing from group '.concat(removing_group_lis.value[i]));
      }
    }
    onMounted(async () => {
      await clientReady;
      console.log('bash');
      user_list.value = await client.value?.get_user_list();
      groups_list.value = await client.value?.get_group_list();
      // client.value!.get_group_list().then((value: any) => {
      //   groups_list.value = value;
      // });
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
    };
  },
});
</script>
