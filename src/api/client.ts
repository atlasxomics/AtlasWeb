/* eslint-disable lines-between-class-members */
/* eslint-disable no-underscore-dangle */
import axios, { AxiosInstance, AxiosResponse } from 'axios';

import {
  User,
  RegisterUserPayload,
  ResetUserPasswordPayload,
  ResetPasswordPayload,
  DatasetRequest,
  ImageFileRequest,
  FileListRequest,
  DatasetListingWafer,
  Upload,
  QcEntryGenerationRequest,
} from '@/types';

// The time (10 minutes in ms) before the token expires to refresh it
const REFRESH_BUFFER = 10 * 60 * 1000;
function getTimeout(token: string): number | undefined {
  const splitAccessToken = token.split('.');
  if (splitAccessToken.length === 3) {
    const jwt = JSON.parse(atob(splitAccessToken[1]));
    if (jwt.exp) {
      // Must multiply by 1000 since Date.now() uses ms
      return jwt.exp * 1000 - REFRESH_BUFFER - Date.now();
    }
  }

  return undefined;
}

const baseApiUrl = (user: boolean) => (user ? '/api/v1/user' : '/api/v1');

export default class Client {
  public axios: AxiosInstance;

  serverURL: string;
  user: User | null;
  authorizationToken: string;
  refreshTimeoutId?: number;

  /**
   * Create and return a client instance. This is done in a helper function
   * to allow for asynchronous construction.
   * @param serverURL The base URL of the API server to use
   * @param token The access token (JWT) to use for each request
   * @returns The instantiated client.
   */
  static async Create(serverURL: string, token: string): Promise<Client> {
    const client = new Client(serverURL, token);
    await client.initAsync();

    return client;
  }

  constructor(serverURL: string, token: string) {
    this.axios = axios.create({
      baseURL: serverURL,
      headers: { common: { Authorization: token } },
    });

    this.serverURL = serverURL;
    this.authorizationToken = token;
    this.user = null;
  }

  async initAsync() {
    await this.fetchUser();
    this.refreshTimeoutId = window.setTimeout(this.refreshToken.bind(this), getTimeout(this.authorizationToken));
  }

  async getApplicationInfo(): Promise<any> {
    try {
      const resp = await this.axios.get('/api/v1/app');
      return resp.data;
    } catch (error) {
      return null;
    }
  }
  private async refreshToken() {
    const resp = await this.axios.post('/api/v1/auth/refreshtoken');
    const { access_token: accessToken } = resp.data;

    this.authorizationToken = `JWT ${accessToken}`;
    this.refreshTimeoutId = window.setTimeout(this.refreshToken.bind(this), getTimeout(accessToken));
  }

  private async fetchUser() {
    const { data } = await this.axios.get('/api/v1/auth/whoami');
    const userdata = { username: data.Username, user_level: 0, name: 'None', email: '', groups: data.groups };
    this.user = userdata;
  }

  async uploadDatasetFile(upload: Upload): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', upload.file, upload.file.name);
    formData.append('meta', JSON.stringify(upload.meta));
    formData.append('output_filename', upload.output_filename);

    const endpoint = upload.user ? 'api/v1/storage/upload' : '/api/v1/storage/upload';
    try {
      await this.axios.post(
        endpoint,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: upload.onProgress,
          cancelToken: upload.cancelToken.token,
        },
      );

      return null;
    } catch (error) {
      if (axios.isCancel(error)) {
        return 'Upload Cancelled.';
      }

      return 'Dataset File Already Exists.';
    }
  }

  // User Operations
  async changePassword(payload: ResetPasswordPayload): Promise<true | false> {
    const endpoint = '/api/v1/auth/changepassword';
    const successRegex = /Success : (.+)/;
    let resp: AxiosResponse;

    try {
      resp = await this.axios.put(endpoint, payload);
    } catch (error) {
      // If failed, user already exists
      return false;
    }
    // const match = successRegex.exec(resp.data);
    // const stringUser = match?.[1];

    if (resp.data) {
      // Let parsing errors bubble up, as they shouldn't happen
      return true;
    }

    // This should never be reached
    throw new Error(`Unknown Response Received from ${endpoint}.`);
  }

  // Requires Admin
  async registerUser(user: RegisterUserPayload): Promise<boolean> {
    try {
      await this.axios.post('/api/v1/auth/user', user);
    } catch (error) {
      // If failed, user already exists
      return false;
    }

    return true;
  }

  // Requires Admin
  async resetUserPassword(user: ResetUserPasswordPayload): Promise<void> {
    // This endpoint doesn't return anything useful, so nothing returned
    await this.axios.put('/api/v1/auth/resetpassword', user);
  }
  // storage
  async getFileList(payload: FileListRequest): Promise<any> {
    try {
      const resp = await this.axios.get('api/v1/storage/list', payload);
      return resp.data;
    } catch (error) {
      return false;
    }
  }
  async getImage(payload: ImageFileRequest): Promise<File> {
    const resp = await this.axios.get('/api/v1/storage', { params: { filename: payload.params.filename }, responseType: 'blob' });
    return new File([resp.data], payload.params.filename, { type: 'image/png' });
  }
  async generateQcEntry(payload: QcEntryGenerationRequest): Promise<any> {
    const resp = await this.axios.post('/api/v1/storage/qc_entry', null, payload);
    return resp.data;
  }
  // Dataset
  async getWafers(payload: DatasetRequest): Promise<any> {
    const resp = await this.axios.get('/api/v1/dataset/wafers', payload);
    return resp.data;
  }
  async getChips(payload: DatasetRequest): Promise<any> {
    const resp = await this.axios.get('/api/v1/dataset/chips', payload);
    return resp.data;
  }
  async getDbits(payload: DatasetRequest): Promise<any> {
    const resp = await this.axios.get('/api/v1/dataset/dbits', payload);
    return resp.data;
  }
  async getStudies(payload: DatasetRequest): Promise<any> {
    const resp = await this.axios.get('/api/v1/dataset/studies', payload);
    return resp.data;
  }
  async getWaferTrace(payload: DatasetRequest): Promise<any> {
    const resp = await this.axios.get('/api/v1/dataset/wafertrace', payload);
    return resp.data;
  }
}
