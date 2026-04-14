import api from '../lib/api';
import { cleanParams } from '../lib/utils';
import type {
    ApiResponse,
    CreateLogbookPayload,
    JobCategory,
    Logbook,
    LogbookFile,
    LogbookListParams,
    PaginatedResponse,
    UpdateLogbookPayload,
} from '../types';

const toFormData = (payload: CreateLogbookPayload): FormData => {
  const fd = new FormData();
  fd.append('date', payload.date);
  fd.append('job_category_id', payload.job_category_id);
  fd.append('description', payload.description);
  if (payload.progress !== undefined) fd.append('progress', String(payload.progress));
  if (payload.status) fd.append('status', payload.status);
  (payload.files ?? []).forEach((file) => fd.append('files', file));
  return fd;
};

export const logbookService = {
  async getJobCategories(): Promise<JobCategory[]> {
    const res = await api.get<ApiResponse<JobCategory[]>>('/job-categories');
    return res.data.data;
  },

  async getById(id: string): Promise<Logbook> {
    const res = await api.get<ApiResponse<Logbook>>(`/logbooks/${id}`);
    return res.data.data;
  },

  async getLogbooks(params?: LogbookListParams): Promise<PaginatedResponse<Logbook>> {
    const res = await api.get<PaginatedResponse<Logbook>>('/logbooks', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async createLogbook(payload: CreateLogbookPayload): Promise<Logbook> {
    const fd = toFormData(payload);
    const res = await api.post<ApiResponse<Logbook>>('/logbooks', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async updateLogbook(id: string, payload: UpdateLogbookPayload): Promise<Logbook> {
    const res = await api.put<ApiResponse<Logbook>>(`/logbooks/${id}`, payload);
    return res.data.data;
  },

  async deleteLogbook(id: string): Promise<void> {
    await api.delete(`/logbooks/${id}`);
  },

  async addFiles(id: string, files: File[]): Promise<LogbookFile[]> {
    const fd = new FormData();
    files.forEach((file) => fd.append('files', file));
    const res = await api.post<ApiResponse<LogbookFile[]>>(`/logbooks/${id}/files`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async deleteFile(id: string, fileId: string): Promise<void> {
    await api.delete(`/logbooks/${id}/files/${fileId}`);
  },
};
