/**
 * types/user.types.ts
 * Tipe untuk User Management & Activity Logs
 */
import type { CompanySummary, UserRole, UserStatus } from './auth.types';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  company_id?: string | null;
  company?: CompanySummary | null;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name?: string; // join dari users
  action: string;
  target?: string;
  ip_address?: string;
  device_info?: string;
  created_at: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  company_id?: string | null;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole;
  company_id?: string | null;
  /** Isi untuk mengubah password user (oleh admin) */
  password?: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}
