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
            {{ selected_user.status }}
            {{ selected_user.groups }}
            {{ selected_user.email }}
            {{ selected_user.name }}
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang='ts'>
import { defineComponent, ref, watchEffect, computed, onMounted } from '@vue/composition-api';
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
    const groups_list = ref<any[]>([]);
    const client = computed(() => store.state.client);
    const selected_user = ref<any>(null);
    function user_selected(user: any) {
      selected_user.value = user;
    }
    onMounted(async () => {
      await clientReady;
      console.log('bash');
      user_list.value = await client.value?.get_user_list();
      client.value!.get_group_list().then((value: any) => {
        groups_list.value = value;
      });
      console.log(user_list);
    });
    return {
      user_list,
      groups_list,
      selected_user,
      user_selected,
    };
  },
});
</script>
