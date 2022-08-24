import { dispatch, SnackbarParams } from './state';

interface Snackbar {
  dispatch: (params: SnackbarParams) => void;
}

export const snackbar: Snackbar = { dispatch };
