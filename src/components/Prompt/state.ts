import { ref, watchEffect } from '@vue/composition-api';

import store from '@/store';

interface PromptParams {
  title?: string;
  message?: string;
  positiveText?: string;
  negativeText?: string;
}

const defaultTitle = '';
const defaultMessage = '';
const defaultConfirm = null;
const defaultPositiveText = '';
const defaultNegativeText = '';

const show = ref(false);
const title = ref(defaultTitle);
const message = ref(defaultMessage);
const callback = ref<((value: boolean) => void) | null>(defaultConfirm);
const positiveText = ref(defaultPositiveText);
const negativeText = ref(defaultNegativeText);

function open(params: PromptParams) {
  title.value = params.title || defaultTitle;
  message.value = params.message || defaultMessage;
  positiveText.value = params.positiveText || defaultPositiveText;
  negativeText.value = params.negativeText || defaultNegativeText;

  show.value = true;
  return new Promise((resolve: (value: boolean) => void) => {
    // when the dialog is closed, callback will be used to return the resolved Promise
    callback.value = resolve;
  });
}

function close() {
  show.value = false;
  if (callback.value) {
    // resolve callback to return false
    callback.value(false);
  }
}

function visible() {
  return show.value;
}

export {
  PromptParams,
  show,
  title,
  message,
  callback,
  positiveText,
  negativeText,
  open,
  close,
  visible,
};
