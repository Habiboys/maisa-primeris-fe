/**
 * services/auth.service.ts
 * ─────────────────────────────────────────────────────────
 * Semua pemanggilan API untuk modul Auth.
 * Tidak ada state React di sini — murni fungsi async.
 * ─────────────────────────────────────────────────────────
 */

import api from '../lib/api';
import type {
  ApiResponse,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  ResetPasswordPayload,
} from '../types';

export const authService = {
  /** POST /auth/login → dapat token + data user */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', payload);
    return res.data.data;
  },

  /** POST /auth/logout */
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  /** GET /auth/me → ambil profil user yang sedang login */
  async getProfile(): Promise<AuthUser> {
    const res = await api.get<ApiResponse<AuthUser>>('/auth/me');
    return res.data.data;
  },

  /** PUT /auth/change-password */
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.put('/auth/change-password', payload);
  },

  /** POST /auth/forgot-password */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await api.post('/auth/forgot-password', payload);
  },

  /** GET /auth/verify-reset-token?token=xxx */
  async verifyResetToken(token: string): Promise<{ valid: boolean; email: string }> {
    const res = await api.get<ApiResponse<{ valid: boolean; email: string }>>('/auth/verify-reset-token', {
      params: { token },
    });
    return res.data.data;
  },

  /** POST /auth/reset-password */
  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await api.post('/auth/reset-password', payload);
  },
};
