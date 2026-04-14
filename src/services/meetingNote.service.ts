import api from '../lib/api';
import { cleanParams } from '../lib/utils';
import type {
    ApiResponse,
    CreateMeetingNotePayload,
    MeetingNote,
    MeetingNoteListParams,
    PaginatedResponse,
    UpdateMeetingNotePayload,
} from '../types';

export const meetingNoteService = {
  async getAll(params?: MeetingNoteListParams): Promise<PaginatedResponse<MeetingNote>> {
    const res = await api.get<PaginatedResponse<MeetingNote>>('/meeting-notes', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async getById(id: string): Promise<MeetingNote> {
    const res = await api.get<ApiResponse<MeetingNote>>(`/meeting-notes/${id}`);
    return res.data.data;
  },

  async create(payload: CreateMeetingNotePayload): Promise<MeetingNote> {
    const res = await api.post<ApiResponse<MeetingNote>>('/meeting-notes', payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateMeetingNotePayload): Promise<MeetingNote> {
    const res = await api.put<ApiResponse<MeetingNote>>(`/meeting-notes/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/meeting-notes/${id}`);
  },

  async exportPdf(id: string): Promise<Blob> {
    const res = await api.get(`/meeting-notes/${id}/export-pdf`, {
      responseType: 'blob',
    });
    return res.data as Blob;
  },
};
