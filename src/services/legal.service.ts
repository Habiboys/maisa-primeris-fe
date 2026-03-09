/**
 * services/legal.service.ts
 * Pemanggilan API untuk modul Transaksi Legal
 */

import api from '../lib/api';
import { cleanParams } from '../lib/utils';
import type { Akad, ApiResponse, BAST, PaginatedResponse, Pembatalan, PindahUnit, PPJB } from '../types';

export const legalService = {
  // ── PPJB ─────────────────────────────────────────────────────
  async getPPJBList(params?: { search?: string; page?: number }): Promise<PaginatedResponse<PPJB>> {
    const res = await api.get<PaginatedResponse<PPJB>>('/ppjb', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async createPPJB(payload: Partial<PPJB>): Promise<PPJB> {
    const res = await api.post<ApiResponse<PPJB>>('/ppjb', payload);
    return res.data.data;
  },

  async updatePPJB(id: string, payload: Partial<PPJB>): Promise<PPJB> {
    const res = await api.put<ApiResponse<PPJB>>(`/ppjb/${id}`, payload);
    return res.data.data;
  },

  async removePPJB(id: string): Promise<void> {
    await api.delete(`/ppjb/${id}`);
  },

  // ── Akad ──────────────────────────────────────────────────────
  async getAkadList(params?: { search?: string; page?: number }): Promise<PaginatedResponse<Akad>> {
    const res = await api.get<PaginatedResponse<Akad>>('/akad', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async createAkad(payload: Partial<Akad>): Promise<Akad> {
    const res = await api.post<ApiResponse<Akad>>('/akad', payload);
    return res.data.data;
  },

  async updateAkad(id: string, payload: Partial<Akad>): Promise<Akad> {
    const res = await api.put<ApiResponse<Akad>>(`/akad/${id}`, payload);
    return res.data.data;
  },

  async removeAkad(id: string): Promise<void> {
    await api.delete(`/akad/${id}`);
  },

  // ── BAST ──────────────────────────────────────────────────────
  async getBASTList(params?: { search?: string; page?: number }): Promise<PaginatedResponse<BAST>> {
    const res = await api.get<PaginatedResponse<BAST>>('/bast', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async createBAST(payload: Partial<BAST>): Promise<BAST> {
    const res = await api.post<ApiResponse<BAST>>('/bast', payload);
    return res.data.data;
  },

  async updateBAST(id: string, payload: Partial<BAST>): Promise<BAST> {
    const res = await api.put<ApiResponse<BAST>>(`/bast/${id}`, payload);
    return res.data.data;
  },

  async removeBAST(id: string): Promise<void> {
    await api.delete(`/bast/${id}`);
  },

  // ── Pindah Unit ──────────────────────────────────────────────
  async getPindahUnitList(params?: { search?: string; page?: number }): Promise<PaginatedResponse<PindahUnit>> {
    const res = await api.get<PaginatedResponse<PindahUnit>>('/pindah-unit', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async createPindahUnit(payload: Partial<PindahUnit>): Promise<PindahUnit> {
    const res = await api.post<ApiResponse<PindahUnit>>('/pindah-unit', payload);
    return res.data.data;
  },

  async updatePindahUnit(id: string, payload: Partial<PindahUnit>): Promise<PindahUnit> {
    const res = await api.put<ApiResponse<PindahUnit>>(`/pindah-unit/${id}`, payload);
    return res.data.data;
  },

  async removePindahUnit(id: string): Promise<void> {
    await api.delete(`/pindah-unit/${id}`);
  },

  // ── Pembatalan ───────────────────────────────────────────────
  async getPembatalanList(params?: { search?: string; page?: number }): Promise<PaginatedResponse<Pembatalan>> {
    const res = await api.get<PaginatedResponse<Pembatalan>>('/pembatalan', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async createPembatalan(payload: Partial<Pembatalan>): Promise<Pembatalan> {
    const res = await api.post<ApiResponse<Pembatalan>>('/pembatalan', payload);
    return res.data.data;
  },

  async updatePembatalan(id: string, payload: Partial<Pembatalan>): Promise<Pembatalan> {
    const res = await api.put<ApiResponse<Pembatalan>>(`/pembatalan/${id}`, payload);
    return res.data.data;
  },

  async removePembatalan(id: string): Promise<void> {
    await api.delete(`/pembatalan/${id}`);
  },
};
