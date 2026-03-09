/**
 * context/AuthContext.tsx
 * ─────────────────────────────────────────────────────────
 * Pusat manajemen autentikasi seluruh aplikasi.
 *
 * CARA PAKAI di komponen manapun:
 *   const { user, login, logout, isLoading } = useAuth();
 *
 * ALUR LOGIN:
 *   1. Panggil login(email, password)
 *   2. Jika sukses → simpan token + user ke localStorage
 *   3. Set state user → komponen yang subscribe otomatis re-render
 *
 * ALUR LOGOUT:
 *   1. Panggil logout()
 *   2. Bersihkan localStorage
 *   3. Reset state user → App kembali tampil Login
 * ─────────────────────────────────────────────────────────
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { authService } from '../services/auth.service';
import type { AuthUser, LoginPayload } from '../types';

// ── Tipe untuk nilai yang disediakan context ─────────────────
interface AuthContextValue {
  user: AuthUser | null;         // null = belum login
  token: string | null;
  isLoading: boolean;            // proses login sedang berjalan
  isAuthenticated: boolean;      // shortcut: user !== null
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

// ── Buat context (undefined sebagai default) ─────────────────
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider: Bungkus App dengan ini di main.tsx ─────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Saat pertama kali mount → cek apakah ada sesi tersimpan
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser  = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser) as AuthUser);
      } catch {
        // Data localStorage rusak → bersihkan
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // ── Login ───────────────────────────────────────────────────
  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await authService.login(payload);
      // Simpan ke localStorage agar sesi bertahan setelah refresh
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      // Update state
      setToken(res.token);
      setUser(res.user);
      toast.success(`Selamat datang kembali, ${res.user.name}!`);
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Logout ──────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.info('Anda telah keluar dari sistem');
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook untuk menggunakan Auth Context ──────────────────────
/**
 * Gunakan hook ini di komponen manapun yang butuh data auth.
 * Akan throw error jika dipakai di luar AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  }
  return ctx;
}
