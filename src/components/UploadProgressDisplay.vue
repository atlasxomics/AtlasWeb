<template>
  <v-card
    v-if="dialogOpen"
    class="progress-card mr-5 mb-5"
    min-width="20vw"
  >
    <v-card-title>
      <template v-if="!inProgress">
        <v-icon
          v-if="allSuccessful"
          left
          color="success"
        >
          mdi-check
        </v-icon>
        <v-icon
          v-else
          left
          color="warning"
        >
          mdi-alert-circle
        </v-icon>
      </template>
      <span v-if="inProgress">
        Uploading {{ uploads.length }} Files
      </span>
      <span v-else>
        Uploads Finished
      </span>
      <v-spacer />
      <v-btn
        v-if="!minimized"
        icon
        @click="minimized = true"
      >
        <v-icon>mdi-chevron-down</v-icon>
      </v-btn>
      <v-btn
        v-else
        icon
        @click="minimized = false"
      >
        <v-icon>mdi-chevron-up</v-icon>
      </v-btn>
      <v-btn
        icon
        @click="handleClickClose"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>

      <v-dialog
        v-model="closeDialogDialog"
        width="30vw"
      >
        <v-card>
          <v-card-title>Cancel Uploads?</v-card-title>
          <v-card-subtitle>
            Are you sure you want to cancel all uploads?
          </v-card-subtitle>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="cancelAllUploads">
              Cancel Uploads
            </v-btn>
            <v-btn
              color="primary"
              @click="closeDialogDialog = false"
            >
              Continue
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card-title>
    <v-progress-linear
      v-if="inProgress"
      :value="totalProgress"
    />
    <v-card-text
      v-if="!minimized"
      class="pa-0"
    >
      <v-list>
        <v-list-item
          v-for="(upload, i) in uploads"
          :key="i"
        >
          <v-list-item-avatar>
            <v-icon>mdi-folder-upload</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              {{ upload.file.name }}
            </v-list-item-title>
            <v-list-item-subtitle
              v-if="upload.error"
              class="red--text"
            >
              {{ upload.error }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-icon
              v-if="upload.cancelled"
              color="error"
            >
              mdi-cancel
            </v-icon>
            <v-icon
              v-else-if="upload.error"
              color="error"
            >
              mdi-close
            </v-icon>
            <v-hover
              v-else
              v-slot="{ hover }"
            >
              <v-btn
                v-if="hover && !upload.finished"
                icon
                small
                @click="cancelUpload(i)"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
              <v-icon
                v-else-if="upload.finished"
                color="success"
              >
                mdi-check
              </v-icon>
              <v-progress-circular
                v-else
                color="primary"
                width="2"
                size="24"
                :value=50
              />
            </v-hover>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';

export default defineComponent({
  name: 'UploadProgressDisplay',
  setup() {
    const uploads = computed(() => store.state.upload.uploads);
    const allSuccessful = computed(() => store.getters.upload.allSuccessful);
    const inProgress = computed(() => store.state.upload.inProgress);
    const dialogOpen = computed(() => store.state.upload.dialogOpen);
    const totalProgress = computed(() => store.getters.upload.totalProgress);
    const minimized = ref(true);
    const closeDialogDialog = ref(false);

    function closeDialog() {
      store.commit.upload.setDialogOpen(false);
      closeDialogDialog.value = false;
    }

    function cancelUpload(index: number) {
      store.dispatch.upload.cancelUpload(index);
    }

    async function cancelAllUploads() {
      await store.dispatch.upload.cancelAllUploads();
      snackbar.dispatch({ text: 'Uploads Cancelled.' });

      closeDialog();
    }

    function handleClickClose() {
      if (!inProgress.value) {
        closeDialog();
      } else {
        closeDialogDialog.value = true;
      }
    }

    return {
      uploads,
      allSuccessful,
      inProgress,
      totalProgress,
      dialogOpen,
      closeDialog,
      closeDialogDialog,
      handleClickClose,
      cancelUpload,
      cancelAllUploads,
      minimized,
    };
  },
});
</script>

<style scoped>
  .progress-card {
    position: fixed;
    bottom: 0;
    right: 0;
  }
</style>
