/**
 * services/user.service.ts
 * Pemanggilan API untuk modul User Management & Activity Logs
 */

import api from '../lib/api';
import { cleanParams } from '../lib/utils';
import type {
    ActivityLog,
    ApiResponse,
    CreateUserPayload,
    PaginatedResponse,
    UpdateUserPayload,
    User,
    UserListParams,
} from '../types';

export const userService = {
  /** GET /users */
  async getAll(params?: UserListParams): Promise<PaginatedResponse<User>> {
    const res = await api.get<PaginatedResponse<User>>('/users', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  /** GET /users/:id */
  async getById(id: string): Promise<User> {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  /** POST /users */
  async create(payload: CreateUserPayload): Promise<User> {
    const res = await api.post<ApiResponse<User>>('/users', payload);
    return res.data.data;
  },

  /** PUT /users/:id */
  async update(id: string, payload: UpdateUserPayload): Promise<User> {
    const res = await api.put<ApiResponse<User>>(`/users/${id}`, payload);
    return res.data.data;
  },

  /** PATCH /users/:id/toggle-status */
  async toggleStatus(id: string): Promise<User> {
    const res = await api.patch<ApiResponse<User>>(`/users/${id}/toggle-status`);
    return res.data.data;
  },

  /** DELETE /users/:id */
  async remove(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  /** GET /users/activity-logs */
  async getActivityLogs(params?: { user_id?: string; date_from?: string; date_to?: string; page?: number; limit?: number }): Promise<PaginatedResponse<ActivityLog>> {
    const res = await api.get<PaginatedResponse<ActivityLog>>('/users/activity-logs', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  /** GET /users/activity-logs/export → download CSV */
  getActivityLogsExportUrl(): string {
    const token = localStorage.getItem('token');
    return `${api.defaults.baseURL}/users/activity-logs/export?token=${token}`;
  },
};
