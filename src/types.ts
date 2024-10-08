import { CancelTokenSource } from 'axios';

export interface ApplicationData {
  lists: {
    user_types: string[];
  };
}

export interface DatasetUploadMetadata {
  remarks?: string;
}

export interface DatasetUploadParams {
  file: File;
  meta?: any;
  user?: boolean;
  bucket: string | null;
  output_filename: string;
}

export interface Upload extends DatasetUploadParams {
  progress: number;
  error: string | null;
  finished: boolean;
  cancelled: boolean;
  cancelToken: CancelTokenSource;
  onProgress: (val: ProgressEvent) => unknown;
}

export interface MetadataUploadParams extends DatasetUploadParams {
  meta_type: string;
}

export interface UploadMeta extends MetadataUploadParams {
  progress: number;
  error: string | null;
  finished: boolean;
  cancelled: boolean;
  cancelToken: CancelTokenSource;
  onProgress: (val: ProgressEvent) => unknown;
}

export interface User {
  username: string;
  email: string;
  name: string;
  groups: string[];
}

// This is for an admin to change other user passwords
export interface ResetUserPasswordPayload {
  username: string;
  password: string;
}

// This is for a user to change their own password
export interface ResetPasswordPayload {
  old_password: string;
  new_password: string;
}

export interface RegisterUserPayload extends ResetUserPasswordPayload {
  email: string;
  name: string;
  groups: string[];
}

export interface UserRequestPayload extends RegisterUserPayload {
  pi_name: string;
}

// Dataset Payloads
export interface DatasetListingWafer {
  wafer_id: string;
  generation: string;
  date_acquired: string;
}

// Dataset Payloads
export interface DatasetListingChip {
  chip_id: string;
  wafer_id: string;
  date_acquired: string;
}

// Dataset Payloads
export interface DatasetListingDbit {
  run_id: string;
  study_id: string;
  chip_a_id: string;
  chip_b_id: string;
}

export interface DatasetRequest {
  params: {
    filter: any | null;
    options?: any | null;
  }
} 

export interface FileRequest {
  params: {
    filename: string;
    bucket?: string | null;
    type?: string | null;
  }
}

export interface ImageFileRequest {
  params: {
    filename: string;
    bucket?: string | null;
    hflip?: boolean;
    vflip?: boolean;
    rotation?: number;
  }
}

export interface FileListRequest {
  params: {
    path: string;
    bucket?: string | null;
    filter?: string | null;
  }
}

export interface QcEntryGenerationRequest {
  params: {
    qc_dir: string;
    bucket_name?: string;
  }
}

export interface UpdatingGroupsRequest {
    groups_adding: string[],
    groups_removing: string[],
    username: string,
}

export interface GroupRequest {
  params: {
    group_name: string,
  }
}

export interface CreateGroupRequest {
  params: {
    group_name: string,
    description: string,
  }
}

export interface UserGroupAssignmentInform {
  group: string,
  username: string,
  email: string,
  name: string,
}

export interface FlaskResponse {
  data: any;
}

export interface RunFileObject {
  data: {
    file_path: string;
    file_type_id: number;
    file_type: string;
    file_id: number;
    file_description: string;
  }
}