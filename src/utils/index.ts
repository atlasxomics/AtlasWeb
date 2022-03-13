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

export function splitarray(input: any[], spacing: number): any[] {
  const output = [];
  for (let i = 0; i < input.length; i += spacing) {
    output[output.length] = input.slice(i, i + spacing);
  }
  return output;
}

export const deepCopy = <T>(target: T): T => {
  if (target === null) {
    return target;
  }
  if (target instanceof Date) {
    return new Date(target.getTime()) as any;
  }
  if (target instanceof Array) {
    const cp = [] as any[];
    (target as any[]).forEach((v) => { cp.push(v); });
    return cp.map((n: any) => deepCopy<any>(n)) as any;
  }
  if (typeof target === 'object' && target !== {}) {
    const cp = { ...(target as { [key: string]: any }) } as { [key: string]: any };
    Object.keys(cp).forEach((k: any) => {
      cp[k] = deepCopy<any>(cp[k]);
    });
    return cp as T;
  }
  return target;
};

export const inputRules: any = {
  nonEmpty: (x: string) => {
    if (!x) return 'Must not be empty';
    return x.trim() !== '' || 'Must not be empty';
  },
  isEmail: (x: string) => {
    if (!x) return 'Email address is missing';
    const pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(x) || 'Not a proper email address';
  },
  isNumber: (x: string) => {
    const n = Number(x);
    return (!Number.isNaN(n)) || 'Numbers only';
  },
  isDate: (x: string) => {
    const pattern = new RegExp(/^\d{4}-\d{2}-\d{2}$/);
    return pattern.test(x) || 'Date should be in te format of YYYY-MM-DD';
  },
  isTime: (x: string) => {
    const pattern = new RegExp(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/);
    return pattern.test(x) || 'Time format should be HH:MM';
  },
};
