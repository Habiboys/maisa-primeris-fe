/**
 * services/project.service.ts
 * Pemanggilan API untuk modul Project & Konstruksi
 */

import api from '../lib/api';
import { cleanParams } from '../lib/utils';
import type {
  ApiResponse,
  ConstructionStatus,
  InventoryLog,
  PaginatedResponse,
  Project,
  ProjectUnit,
  TimeScheduleItem,
  UnitBlockRange,
  WorkLog,
} from '../types';

export const projectService = {
  // ── Projects ────────────────────────────────────────────────
  async getAll(params?: { search?: string; type?: string; status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Project>> {
    const res = await api.get<PaginatedResponse<Project>>('/projects', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async getById(id: string): Promise<Project> {
    const res = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return res.data.data;
  },

  async create(payload: Partial<Project>): Promise<Project> {
    const res = await api.post<ApiResponse<Project>>('/projects', payload);
    return res.data.data;
  },

  async update(id: string, payload: Partial<Project>): Promise<Project> {
    const res = await api.put<ApiResponse<Project>>(`/projects/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  async updateLayoutSvg(id: string, formData: FormData): Promise<Project> {
    const res = await api.patch<ApiResponse<Project>>(`/projects/${id}/layout-svg`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // ── Project Units ────────────────────────────────────────────
  async getUnits(projectId: string): Promise<ProjectUnit[]> {
    const res = await api.get<ApiResponse<ProjectUnit[]>>(`/projects/${projectId}/units`);
    return res.data.data;
  },

  async createUnit(projectId: string, payload: Partial<ProjectUnit>): Promise<ProjectUnit> {
    const res = await api.post<ApiResponse<ProjectUnit>>(`/projects/${projectId}/units`, payload);
    return res.data.data;
  },

  async updateUnit(projectId: string, unitNo: string, payload: Partial<ProjectUnit>): Promise<ProjectUnit> {
    const res = await api.put<ApiResponse<ProjectUnit>>(`/projects/${projectId}/units/${unitNo}`, payload);
    return res.data.data;
  },

  async removeUnit(projectId: string, unitNo: string): Promise<void> {
    await api.delete(`/projects/${projectId}/units/${unitNo}`);
  },

  async bulkCreateUnits(
    projectId: string,
    payload: ({ blocks: UnitBlockRange[] } | { count: number; prefix: string }) & { tipe?: string },
  ): Promise<ProjectUnit[]> {
    const res = await api.post<ApiResponse<ProjectUnit[]>>(`/projects/${projectId}/bulk-units`, payload);
    return res.data.data;
  },

  // ── Construction Statuses ────────────────────────────────────
  async getConstructionStatuses(): Promise<ConstructionStatus[]> {
    const res = await api.get<ApiResponse<ConstructionStatus[]>>('/construction-statuses');
    return res.data.data;
  },

  async createConstructionStatus(payload: Partial<ConstructionStatus>): Promise<ConstructionStatus> {
    const res = await api.post<ApiResponse<ConstructionStatus>>('/construction-statuses', payload);
    return res.data.data;
  },

  async updateConstructionStatus(id: string, payload: Partial<ConstructionStatus>): Promise<ConstructionStatus> {
    const res = await api.put<ApiResponse<ConstructionStatus>>(`/construction-statuses/${id}`, payload);
    return res.data.data;
  },

  async removeConstructionStatus(id: string): Promise<void> {
    await api.delete(`/construction-statuses/${id}`);
  },

  // ── Time Schedule ────────────────────────────────────────────
  async getTimeSchedule(projectId: string, unitNo?: string): Promise<TimeScheduleItem[]> {
    const url = unitNo
      ? `/projects/${projectId}/units/${unitNo}/time-schedule`
      : `/projects/${projectId}/time-schedule`;
    const res = await api.get<ApiResponse<TimeScheduleItem[]>>(url);
    return res.data.data;
  },

  async createTimeScheduleItem(projectId: string, payload: Partial<TimeScheduleItem>, unitNo?: string): Promise<TimeScheduleItem> {
    const url = unitNo
      ? `/projects/${projectId}/units/${unitNo}/time-schedule`
      : `/projects/${projectId}/time-schedule`;
    const res = await api.post<ApiResponse<TimeScheduleItem>>(url, payload);
    return res.data.data;
  },

  async updateTimeScheduleItem(projectId: string, itemId: string, payload: Partial<TimeScheduleItem>, unitNo?: string): Promise<TimeScheduleItem> {
    const url = unitNo
      ? `/projects/${projectId}/units/${unitNo}/time-schedule/${itemId}`
      : `/projects/${projectId}/time-schedule/${itemId}`;
    const res = await api.put<ApiResponse<TimeScheduleItem>>(url, payload);
    return res.data.data;
  },

  // ── Inventory Logs ───────────────────────────────────────────
  async getInventoryLogs(projectId: string): Promise<InventoryLog[]> {
    const res = await api.get<ApiResponse<InventoryLog[]>>(`/projects/${projectId}/inventory`);
    return res.data.data;
  },

  async createInventoryLog(projectId: string, payload: Partial<InventoryLog>): Promise<InventoryLog> {
    const res = await api.post<ApiResponse<InventoryLog>>(`/projects/${projectId}/inventory`, payload);
    return res.data.data;
  },

  // ── Work Logs ────────────────────────────────────────────────
  async getWorkLogs(projectId: string, params?: { unit_no?: string }): Promise<WorkLog[]> {
    const res = await api.get<ApiResponse<WorkLog[]>>(`/projects/${projectId}/work-logs`, {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data.data;
  },

  async createWorkLog(projectId: string, formData: FormData): Promise<WorkLog> {
    const res = await api.post<ApiResponse<WorkLog>>(
      `/projects/${projectId}/work-logs`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data.data;
  },

  async updateWorkLog(projectId: string, logId: string, payload: Partial<WorkLog>): Promise<WorkLog> {
    const res = await api.put<ApiResponse<WorkLog>>(`/projects/${projectId}/work-logs/${logId}`, payload);
    return res.data.data;
  },

  async deleteWorkLog(projectId: string, logId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/work-logs/${logId}`);
  },

  async deleteWorkLogPhoto(projectId: string, logId: string, photoId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/work-logs/${logId}/photos/${photoId}`);
  },

  async addWorkLogPhotos(projectId: string, logId: string, formData: FormData): Promise<unknown> {
    const res = await api.post(`/projects/${projectId}/work-logs/${logId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
