/**
 * types/auth.types.ts
 * Tipe-tipe untuk modul Auth & User Management
 */

export type UserRole = 'Super Admin' | 'Finance' | 'Project Management';
export type UserStatus = 'Aktif' | 'Nonaktif';

// Data user yang disimpan di localStorage & context
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  last_login?: string;
}

// Payload body POST /auth/login
export interface LoginPayload {
  email: string;
  password: string;
}

// Response sukses POST /auth/login
export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// Payload PUT /auth/change-password
export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}
