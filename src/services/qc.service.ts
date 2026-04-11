/**
 * services/qc.service.ts
 * Pemanggilan API untuk modul Quality Control
 */

import api from '../lib/api';
import { cleanParams } from '../lib/utils';
import type { ApiResponse, QcSubmission, QcSubmissionInput, QcTemplate, QcTemplateItem, QcTemplateSection } from '../types';

export const qcService = {
  // ── Templates ─────────────────────────────────────────────
  async getTemplates(): Promise<QcTemplate[]> {
    const res = await api.get<ApiResponse<QcTemplate[]>>('/qc-templates');
    return res.data.data;
  },

  async getTemplate(id: string): Promise<QcTemplate> {
    const res = await api.get<ApiResponse<QcTemplate>>(`/qc-templates/${id}`);
    return res.data.data;
  },

  async createTemplate(payload: Partial<QcTemplate>): Promise<QcTemplate> {
    const res = await api.post<ApiResponse<QcTemplate>>('/qc-templates', payload);
    return res.data.data;
  },

  async updateTemplate(id: string, payload: Partial<QcTemplate>): Promise<QcTemplate> {
    const res = await api.put<ApiResponse<QcTemplate>>(`/qc-templates/${id}`, payload);
    return res.data.data;
  },

  async duplicateTemplate(id: string): Promise<QcTemplate> {
    const res = await api.post<ApiResponse<QcTemplate>>(`/qc-templates/${id}/duplicate`);
    return res.data.data;
  },

  async removeTemplate(id: string): Promise<void> {
    await api.delete(`/qc-templates/${id}`);
  },

  async createSection(templateId: string, payload: Partial<QcTemplateSection>): Promise<QcTemplateSection> {
    const res = await api.post<ApiResponse<QcTemplateSection>>(`/qc-templates/${templateId}/sections`, payload);
    return res.data.data;
  },

  async updateSection(templateId: string, sectionId: string, payload: Partial<QcTemplateSection>): Promise<QcTemplateSection> {
    const res = await api.put<ApiResponse<QcTemplateSection>>(`/qc-templates/${templateId}/sections/${sectionId}`, payload);
    return res.data.data;
  },

  async removeSection(templateId: string, sectionId: string): Promise<void> {
    await api.delete(`/qc-templates/${templateId}/sections/${sectionId}`);
  },

  async createItem(templateId: string, sectionId: string, payload: Partial<QcTemplateItem>): Promise<QcTemplateItem> {
    const res = await api.post<ApiResponse<QcTemplateItem>>(`/qc-templates/${templateId}/sections/${sectionId}/items`, payload);
    return res.data.data;
  },

  async updateItem(templateId: string, sectionId: string, itemId: string, payload: Partial<QcTemplateItem>): Promise<QcTemplateItem> {
    const res = await api.put<ApiResponse<QcTemplateItem>>(`/qc-templates/${templateId}/sections/${sectionId}/items/${itemId}`, payload);
    return res.data.data;
  },

  async removeItem(templateId: string, sectionId: string, itemId: string): Promise<void> {
    await api.delete(`/qc-templates/${templateId}/sections/${sectionId}/items/${itemId}`);
  },

  // ── Submissions ───────────────────────────────────────────
  async getSubmissions(params?: { project_id?: string; unit_no?: string; unit_id?: string; status?: string; start_date?: string; end_date?: string }): Promise<QcSubmission[]> {
    const res = await api.get<ApiResponse<QcSubmission[]>>('/qc-submissions', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data.data;
  },

  async getSubmission(id: string): Promise<QcSubmission> {
    const res = await api.get<ApiResponse<QcSubmission>>(`/qc-submissions/${id}`);
    return res.data.data;
  },

  async createSubmission(payload: QcSubmissionInput): Promise<QcSubmission> {
    const res = await api.post<ApiResponse<QcSubmission>>('/qc-submissions', payload);
    return res.data.data;
  },

  async updateSubmission(id: string, payload: Partial<QcSubmissionInput>): Promise<QcSubmission> {
    const res = await api.put<ApiResponse<QcSubmission>>(`/qc-submissions/${id}`, payload);
    return res.data.data;
  },

  async submitSubmission(id: string): Promise<QcSubmission> {
    const res = await api.patch<ApiResponse<QcSubmission>>(`/qc-submissions/${id}/submit`);
    return res.data.data;
  },

  async removeSubmission(id: string): Promise<void> {
    await api.delete(`/qc-submissions/${id}`);
  },

  async exportSubmission(id: string): Promise<Blob> {
    const res = await api.get(`/qc-submissions/${id}/export`, { responseType: 'blob' });
    return res.data as Blob;
  },

  async exportProjectSubmissions(projectId: string, params?: { unit_no?: string }): Promise<Blob> {
    const res = await api.get(`/qc-submissions-export/project/${projectId}`, {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
      responseType: 'blob',
    });
    return res.data as Blob;
  },
};
