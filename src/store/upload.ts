/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable import/no-cycle */
import Vue from 'vue';
import axios from 'axios';
import { defineModule } from 'direct-vuex';
import * as lodash from 'lodash';
import { moduleGetterContext, moduleActionContext } from '@/store';
import { DatasetUploadParams, Upload, QcEntryGenerationRequest, MetadataUploadParams, UploadMeta } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const uploadActionContext = ((context: any) => moduleActionContext(context, uploadModule));
const uploadGetterContext = (
  (args: [unknown, unknown, unknown, unknown]) => moduleGetterContext(args, uploadModule)
);

const uploadModule = defineModule({
  namespaced: true,
  state: {
    inProgress: false,
    dialogOpen: false,
    uploads: [] as Upload[],
  },
  getters: {
    totalProgress(...args): number {
      const { state } = uploadGetterContext(args);
      const validUploads = state.uploads.filter((upload) => !upload.cancelled);

      return Math.round(validUploads.reduce((total, upload) => total + upload.progress, 0) / validUploads.length);
    },
    allSuccessful(...args): boolean {
      const { state } = uploadGetterContext(args);
      return state.uploads.filter((upload) => !upload.error && !upload.cancelled).length === state.uploads.length;
    },
  },
  mutations: {
    setInProgress(state, val: boolean) {
      state.inProgress = val;
    },
    setDialogOpen(state, val: boolean) {
      state.dialogOpen = val;
    },
    setUploads(state, uploads: Upload[]) {
      state.uploads = uploads;
    },
    setUploadAtIndex(state, { upload, index }: { upload: Upload; index: number }) {
      Vue.set(state.uploads, index, upload);
    },
  },
  actions: {
    cancelUpload(context, index: number) {
      const { state, commit } = uploadActionContext(context);

      const currentUpload = state.uploads[index];

      currentUpload.cancelToken.cancel();

      const upload = { ...currentUpload, cancelled: true };
      commit.setUploadAtIndex({ index, upload });
    },
    cancelAllUploads(context) {
      const { state, dispatch } = uploadActionContext(context);

      state.uploads.forEach((_, i) => {
        dispatch.cancelUpload(i);
      });
    },
    async uploadDatasetFiles(context, datasetfile: DatasetUploadParams[]) {
      const { state, commit, rootState: { client } } = uploadActionContext(context);
      if (client === null) {
        return;
      }

      commit.setInProgress(true);
      function setUploadProgress(val: ProgressEvent, index: number) {
        const progress = (val.loaded / val.total) * 100;
        const currentUpload = state.uploads[index];
        const upload = { ...currentUpload, progress };
        commit.setUploadAtIndex({ upload, index });
      }

      const uploads: Upload[] = datasetfile.map((file, index) => ({
        ...file,
        progress: 0,
        error: null,
        cancelled: false,
        finished: false,
        cancelToken: axios.CancelToken.source(),
        onProgress: (val: ProgressEvent) => { setUploadProgress(val, index); },
      }));

      commit.setUploads(uploads);
      const promises = uploads.map(async (upload, index) => {
        const error = await client.uploadDatasetFile(upload);

        // Must access this way due to upload being updated async
        const currentUpload = state.uploads[index];
        commit.setUploadAtIndex({
          index,
          upload: {
            ...currentUpload,
            error,
            finished: true,
          },
        });
      });

      await Promise.all(promises);
      commit.setInProgress(false);
    },
    async uploadMetadataFile(context, datasetfile: MetadataUploadParams[]) {
      const { state, commit, rootState: { client } } = uploadActionContext(context);
      if (client === null) {
        return;
      }

      commit.setInProgress(true);
      function setUploadProgress(val: ProgressEvent, index: number) {
        const progress = (val.loaded / val.total) * 100;
        const currentUpload = state.uploads[index];
        const upload = { ...currentUpload, progress };
        commit.setUploadAtIndex({ upload, index });
      }

      const uploads: UploadMeta[] = datasetfile.map((file, index) => ({
        ...file,
        progress: 0,
        error: null,
        cancelled: false,
        finished: false,
        cancelToken: axios.CancelToken.source(),
        onProgress: (val: ProgressEvent) => { setUploadProgress(val, index); },
      }));

      commit.setUploads(uploads);
      const promises = uploads.map(async (upload, index) => {
        const error = await client.uploadMetadataFile(upload);

        // Must access this way due to upload being updated async
        const currentUpload = state.uploads[index];
        commit.setUploadAtIndex({
          index,
          upload: {
            ...currentUpload,
            error,
            finished: true,
          },
        });
      });
      await Promise.all(promises);
      commit.setInProgress(false);
    },
    async uploadQcDatasetFiles(context, datasetfile: DatasetUploadParams[]) {
      const { state, commit, rootState: { client } } = uploadActionContext(context);
      if (client === null) {
        return;
      }

      commit.setInProgress(true);
      function setUploadProgress(val: ProgressEvent, index: number) {
        const progress = (val.loaded / val.total) * 100;
        const currentUpload = state.uploads[index];
        const upload = { ...currentUpload, progress };
        commit.setUploadAtIndex({ upload, index });
      }

      const uploads: Upload[] = datasetfile.map((file, index) => ({
        ...file,
        progress: 0,
        error: null,
        cancelled: false,
        finished: false,
        cancelToken: axios.CancelToken.source(),
        onProgress: (val: ProgressEvent) => { setUploadProgress(val, index); },
      }));

      commit.setUploads(uploads);
      const promises = uploads.map(async (upload, index) => {
        const error = await client.uploadDatasetFile(upload);

        // Must access this way due to upload being updated async
        const currentUpload = state.uploads[index];
        commit.setUploadAtIndex({
          index,
          upload: {
            ...currentUpload,
            error,
            finished: true,
          },
        });
      });

      await Promise.all(promises);
      // register Qc entries
      const root_dir = datasetfile[0].output_filename.split('/')[0];
      const unique_ids = lodash.uniq(datasetfile.map((x: any) => x.output_filename.split('/')[1]));
      const qc_promises = unique_ids.map((k) => {
        const output_directory = `${root_dir}/${k}`;
        const payload = { params: { qc_dir: output_directory } };
        const resp = client.generateQcEntry(payload);
        return resp;
      });
      await Promise.all(qc_promises).then((resps) => {
        lodash.each(resps, (rs) => {
          // console.log(rs);
        });
      });
      commit.setInProgress(false);
    },
    resetUploadState(context) {
      const { commit } = uploadActionContext(context);
      commit.setInProgress(false);
      commit.setUploads([]);
    },
  },
});

export default uploadModule;
