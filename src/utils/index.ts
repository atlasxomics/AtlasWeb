import { snackbar } from '@/components/GlobalSnackbar';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const dummyFunction = () => {};
export const randomString = () => Math.random().toString(36).substring(2, 15);
export const mod = (n: number, m: number): number => ((n % m) + m) % m;

export async function copyToClipboard(content: string) {
  await navigator.clipboard.writeText(content);
  snackbar.dispatch({ text: 'Copied to Clipboard!', buttonIcon: 'mdi-close', options: { color: 'success' } });
}
