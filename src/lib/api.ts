/**
 * lib/api.ts
 * ─────────────────────────────────────────────────────────
 * Instance axios terpusat untuk seluruh aplikasi.
 *
 * CARA KERJA:
 *  1. Semua request otomatis pakai base URL dari .env
 *  2. Request interceptor → tempelkan token JWT ke header
 *  3. Response interceptor → jika 401, logout + redirect login
 *
 * CARA PAKAI (di service files):
 *   import api from '@/lib/api'
 *   const res = await api.get('/users')
 * ─────────────────────────────────────────────────────────
 */

import axios, { AxiosError } from 'axios';

// ── Baca base URL dari environment variable ─────────────────
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

// ── Buat instance axios ──────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000, // 15 detik timeout
});

// ── Request Interceptor ──────────────────────────────────────
// Setiap request keluar → otomatis tempelkan Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Jika body adalah FormData, hapus Content-Type agar browser
    // otomatis set multipart/form-data beserta boundary-nya.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ─────────────────────────────────────
// Handle error global: 401 → paksa logout
// Pengecualian: endpoint /auth/login → biarkan error naik ke AuthContext
//               supaya toast "Email atau password salah" bisa ditampilkan.
api.interceptors.response.use(
  (response) => response, // response sukses → langsung return
  (error: AxiosError) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginEndpoint) {
      // Token expired / tidak valid → bersihkan storage & reload
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  },
);

export default api;
