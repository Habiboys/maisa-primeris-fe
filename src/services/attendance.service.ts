/**
 * services/attendance.service.ts
 * Pemanggilan API untuk modul Absensi & Pengajuan Izin
 */

import api from '../lib/api';
import { cleanParams } from '../lib/utils';
import type {
    ApiResponse,
    Attendance,
    ClockInPayload,
    CreateLeaveRequestPayload,
    LeaveRequest,
    PaginatedResponse,
    UserLocationAssignment,
    WorkLocation,
} from '../types';

export const attendanceService = {
  // ── Work Locations ───────────────────────────────────────────
  async getWorkLocations(): Promise<WorkLocation[]> {
    const res = await api.get<ApiResponse<WorkLocation[]>>('/work-locations');
    return res.data.data;
  },

  async createWorkLocation(payload: Partial<WorkLocation>): Promise<WorkLocation> {
    const res = await api.post<ApiResponse<WorkLocation>>('/work-locations', payload);
    return res.data.data;
  },

  async updateWorkLocation(id: string, payload: Partial<WorkLocation>): Promise<WorkLocation> {
    const res = await api.put<ApiResponse<WorkLocation>>(`/work-locations/${id}`, payload);
    return res.data.data;
  },

  async removeWorkLocation(id: string): Promise<void> {
    await api.delete(`/work-locations/${id}`);
  },

  // ── User-Location Assignments ────────────────────────────────
  async getAssignments(): Promise<UserLocationAssignment[]> {
    const res = await api.get<ApiResponse<UserLocationAssignment[]>>('/user-location-assignments');
    return res.data.data;
  },

  async createAssignment(payload: { user_id: string; work_location_id: string }): Promise<UserLocationAssignment> {
    const res = await api.post<ApiResponse<UserLocationAssignment>>('/user-location-assignments', payload);
    return res.data.data;
  },

  async removeAssignment(id: string): Promise<void> {
    await api.delete(`/user-location-assignments/${id}`);
  },

  // ── Attendances ──────────────────────────────────────────────
  async getAll(params?: {
    user_id?: string;
    date?: string;
    month?: number;
    year?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Attendance>> {
    const res = await api.get<PaginatedResponse<Attendance>>('/attendances', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async getMy(): Promise<Attendance[]> {
    const res = await api.get<ApiResponse<Attendance[]>>('/attendances/my');
    return res.data.data;
  },

  async clockIn(payload: ClockInPayload): Promise<Attendance> {
    const res = await api.post<ApiResponse<Attendance>>('/attendances/clock-in', payload);
    return res.data.data;
  },

  async clockOut(payload: ClockInPayload): Promise<Attendance> {
    const res = await api.post<ApiResponse<Attendance>>('/attendances/clock-out', payload);
    return res.data.data;
  },

  // ── Leave Requests ───────────────────────────────────────────
  async getLeaveRequests(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<LeaveRequest>> {
    const res = await api.get<PaginatedResponse<LeaveRequest>>('/leave-requests', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async getMyLeaveRequests(): Promise<LeaveRequest[]> {
    const res = await api.get<ApiResponse<LeaveRequest[]>>('/leave-requests/my');
    return res.data.data;
  },

  async createLeaveRequest(payload: CreateLeaveRequestPayload): Promise<LeaveRequest> {
    const res = await api.post<ApiResponse<LeaveRequest>>('/leave-requests', payload);
    return res.data.data;
  },

  async approveLeaveRequest(id: string): Promise<LeaveRequest> {
    const res = await api.patch<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/approve`);
    return res.data.data;
  },

  async rejectLeaveRequest(id: string): Promise<LeaveRequest> {
    const res = await api.patch<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/reject`);
    return res.data.data;
  },

  async removeLeaveRequest(id: string): Promise<void> {
    await api.delete(`/leave-requests/${id}`);
  },
};
