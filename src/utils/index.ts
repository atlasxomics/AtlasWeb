import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { snackbar } from '@/components/GlobalSnackbar';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const dummyFunction = () => {};
export const randomString = () => Math.random().toString(36).substring(2, 15);
export const mod = (n: number, m: number): number => ((n % m) + m) % m;

export async function copyToClipboard(content: string) {
  await navigator.clipboard.writeText(content);
  snackbar.dispatch({ text: 'Copied to Clipboard!', buttonIcon: 'mdi-close', options: { color: 'success' } });
}

export function get_uuid() {
  return uuidv4();
}

export function objectToArray(obj: any) {
  const outArray: any[] = [];
  _.forIn(obj, (v, k) => {
    const s = {
      key: k,
      value: v,
    };
    outArray.push(s);
  });
  return outArray;
}
export function arrayToObject(arr: any[]) {
  const outObject: any = {};
  _.each(arr, (v) => {
    outObject[v.key] = v.value;
  });
  return outObject;
}
export function generateRouteByQuery(currentRoute: any, query: any) {
  const route = currentRoute;
  const newroute = {
    name: route.name || undefined,
    path: route.path,
    params: route.params,
    query,
  };
  return newroute;
}
