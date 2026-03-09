/**
 * services/auth.service.ts
 * ─────────────────────────────────────────────────────────
 * Semua pemanggilan API untuk modul Auth.
 * Tidak ada state React di sini — murni fungsi async.
 * ─────────────────────────────────────────────────────────
 */

import api from '../lib/api';
import type { ApiResponse, AuthUser, ChangePasswordPayload, LoginPayload, LoginResponse } from '../types';

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
};
