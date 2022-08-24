import { computed, ref } from '@vue/composition-api';
import store from '@/store';
import { state as user } from './user';

const isAdmin = computed(() => store.state.client?.user?.groups.includes('admin'));

export { isAdmin, user };
