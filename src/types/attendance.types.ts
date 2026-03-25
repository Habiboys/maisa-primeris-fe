/**
 * types/attendance.types.ts
 * Tipe untuk Modul Absensi & Pengajuan Izin — sesuai backend models
 */

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | 'Terlambat';
export type LeaveType   = 'Cuti' | 'Izin' | 'Sakit';
export type LeaveStatus = 'Menunggu' | 'Disetujui' | 'Ditolak';

export interface WorkLocation {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius_m?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLocationAssignment {
  id: string;
  user_id: string;
  work_location_id: string;
  // relasi
  user?: { id: string; name: string; email: string; role?: string };
  location?: { id: string; name: string; address?: string };
}

export interface Attendance {
  id: string;
  user_id: string;
  work_location_id?: string;
  attendance_date: string;
  clock_in?: string;
  clock_out?: string;
  clock_in_lat?: number;
  clock_in_lng?: number;
  clock_out_lat?: number;
  clock_out_lng?: number;
  clock_in_photo?: string;
  clock_out_photo?: string;
  status: AttendanceStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // relasi
  user?: { id: string; name: string; email?: string };
  location?: { id: string; name: string };
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string;
  attachment?: string;
  status: LeaveStatus;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at?: string;
  // relasi
  user?: { id: string; name: string; email?: string };
  approver?: { id: string; name: string };
}

export interface ClockInPayload {
  lat: number;
  lng: number;
  photo?: File;
}

export interface CreateLeaveRequestPayload {
  type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string;
  user_id?: string;
}

export interface AttendanceSetting {
  id: string;
  work_start_time: string;
  work_end_time: string;
  late_grace_minutes: number;
  created_at?: string;
  updated_at?: string;
}

// ── Rekap (frontend-only helper) ──────────────────────────────────

export interface AttendanceRecap {
  name: string;
  days: number;
  present: number;
  late: number;
  cuti: number;
  permit: number;
  alpha: number;
  score: number;
}
