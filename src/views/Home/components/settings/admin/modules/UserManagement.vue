<template>
    <v-container>
        <v-row>
            <v-col>
                <h2> User List </h2>
                <p v-for="user in user_list" :key="user.id">
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
             Status: {{ selected_user.status }}
             <v-btn
             v-if="selected_user.status === 'UNCONFIRMED'"
             >
             Confirm User
              </v-btn>
            </p>
            <v-select
            v-model="users_groups"
            :items="groups_list"
            label="User's Groups"
            @change="groups_list_changed"
            multiple
            >
            </v-select>
            <v-btn
            v-if="changes_made"
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
    function groups_list_changed() {
      console.log('groups list');
    }
    function user_selected(user: any) {
      selected_user.value = user;
      users_groups.value = user.groups;
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
    };
  },
});
</script>
