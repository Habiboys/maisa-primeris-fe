import api from '../lib/api';
import { cleanParams } from '../lib/utils';
import type { ApiResponse, PaginatedResponse } from '../types';
import type { MediaAsset, MediaListParams, UploadMediaPayload } from '../types/media.types';

export const mediaService = {
  async getAll(params?: MediaListParams): Promise<PaginatedResponse<MediaAsset>> {
    const res = await api.get<PaginatedResponse<MediaAsset>>('/media', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async upload(payload: UploadMediaPayload): Promise<MediaAsset> {
    const fd = new FormData();
    fd.append('file', payload.file);
    if (payload.category) fd.append('category', payload.category);

    const res = await api.post<ApiResponse<MediaAsset>>('/media/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/media/${id}`);
  },
};
