/**
 * types/auth.types.ts
 * Tipe-tipe untuk modul Auth & User Management
 */

export type UserRole = 'Platform Owner' | 'Super Admin' | 'Finance' | 'Project Management';
export type UserStatus = 'Aktif' | 'Nonaktif';

export interface CompanyBranding {
  app_name: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

export interface CompanySummary {
  id: string;
  name: string;
  code: string;
  is_active?: boolean;
  settings?: CompanyBranding | null;
}

// Data user yang disimpan di localStorage & context
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  company_id?: string | null;
  company?: CompanySummary | null;
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

// Payload PUT /auth/change-password (backend expects old_password)
export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

// Payload POST /auth/forgot-password
export interface ForgotPasswordPayload {
  email: string;
}

// Payload POST /auth/reset-password
export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}
