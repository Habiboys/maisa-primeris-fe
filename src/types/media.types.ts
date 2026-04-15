import type { PaginationParams } from './api.types';

export interface MediaAsset {
  id: string;
  company_id: string | null;
  uploaded_by: string | null;
  category: string;
  original_name: string | null;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  file_path: string;
  created_at: string;
  updated_at: string;
}

export interface MediaListParams extends PaginationParams {
  category?: string;
}

export interface UploadMediaPayload {
  file: File;
  category?: string;
}
