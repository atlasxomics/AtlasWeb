import { computed } from '@vue/composition-api';
import Cookies from 'js-cookie';
import lodash from 'lodash';
// eslint-disable-next-line import/no-cycle
import store from '@/store';
import { LOGIN_COOKIE } from '@/environment';
import Client from '@/api/client';

export interface ATXCookie {
  token: string;
  url: string;
}

const client = computed(() => store.state.client);
export const loggedIn = computed(() => client.value !== null);
export const user = computed(() => client.value?.user || null);
export const userHasSystemAccess = computed(
  () => user.value !== null,
);

export function saveCookie(cookie: ATXCookie) {
  const in20Minutes = 1 / 172;
  Cookies.set(LOGIN_COOKIE, JSON.stringify(cookie), { expires: in20Minutes });
}

export function readCookie(): ATXCookie | undefined {
  const cookie = Cookies.get(LOGIN_COOKIE);

  if (cookie === undefined) { return cookie; }
  return JSON.parse(cookie) as ATXCookie;
}

export function logout() {
  Cookies.remove(LOGIN_COOKIE);
  // Clear token refresh timeout, if it exists
  window.clearTimeout(store.state.client?.refreshTimeoutId);
  store.commit.setClient(null);
}

export async function loginAnonymous(url: string) {
  store.commit.setClient(await Client.Create(url, ''));
}

export function resolveAuthGroup(access_list: string[]) {
  if (!client.value) return false;
  if (!client.value.user) return false;
  let resolved = false;
  lodash.each(client.value.user.groups, (g: string) => {
    if (access_list.includes(g)) resolved = true;
  });
  return resolved;
}

export async function loginExisting() {
  const existingCookie = readCookie();
  if (!existingCookie) {
    return;
  }

  const { url, token } = existingCookie;
  try {
    // Try to create client with stored token
    // store.commit.setClient(new Client(url, token));
    store.commit.setClient(await Client.Create(url, token));
  } catch (e) {
    // Client creation failed, logout
    logout();
  }
}
