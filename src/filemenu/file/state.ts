import { ref, computed, watch } from '@vue/composition-api';

export const loadDatasetMenu = ref(false);
export const waferInformationMenu = ref(false);
export const chipInformationMenu = ref(false);
export const dbitInformationMenu = ref(false);

// Upload File Dialog
export const uploadDatasetFileMenu = ref(false);
export const files = ref<File[]>([]);
export const uploadDialogWidth = computed(() => (files.value.length >= 3 ? 'unset' : '35vw'));

// Upload directory
export const uploadDirectoryMenu = ref(false);
export const filesInDirectory = ref<File[]>([]);
export const uploadDirectoryDialogWidth = null;

// Reset on change
watch(uploadDatasetFileMenu, () => { files.value = []; });

// Manage Video Dialog
export const manageDatasetFilesMenu = ref(false);
