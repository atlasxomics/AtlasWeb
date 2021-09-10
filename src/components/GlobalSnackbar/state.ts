import { ref, watch } from '@vue/composition-api';

export type Callback = () => unknown;
export interface SnackbarParams {
  text: string;
  button?: string;
  buttonIcon?: string;
  callback?: Callback;
  timeout?: number;
  immediate?: boolean;
  options?: Record<string, unknown>;
}

export const show = ref(false);

export const text = ref('');

const defaultButton = '';
export const button = ref(defaultButton);

const defaultButtonIcon = '';
export const buttonIcon = ref(defaultButtonIcon);

const defaultCallback = null;
export const callback = ref<Callback | null>(defaultCallback);

const defaultTimeout = 2000;
export const timeout = ref(defaultTimeout);

// Default to be reset to after each use
export const defaultOptions: Record<string, unknown> = { color: 'secondary' };

export const options = ref(defaultOptions);

export function dispatch(params: SnackbarParams) {
  text.value = params.text;
  button.value = params.button || defaultButton;
  buttonIcon.value = params.buttonIcon || defaultButtonIcon;
  callback.value = params.callback || defaultCallback;
  timeout.value = params.timeout || defaultTimeout;
  options.value = { ...defaultOptions, ...params.options };

  show.value = true;
}

/**
 * Reset options after snackbar is finished.
 *
 * A timeout is used to account for the snackbar's
 * fade-out transition when closed.
 */
watch(show, (val) => {
  if (val === false) {
    setTimeout(() => {
      options.value = defaultOptions;
    }, 150);
  }
});
