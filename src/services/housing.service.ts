/**
 * services/housing.service.ts
 * Pemanggilan API untuk modul Housing (Kavling)
 */

import api from '../lib/api';
import { cleanParams } from '../lib/utils';
import type {
    ApiResponse,
    CreateHousingPaymentPayload,
    CreateHousingUnitPayload,
    HousingPaymentHistory,
    HousingUnit,
    PaginatedResponse,
} from '../types';

export const housingService = {
  // ── Housing Units ─────────────────────────────────────────────
  async getAll(params?: { status?: string; tipe?: string; search?: string; project_id?: string; page?: number; limit?: number }): Promise<PaginatedResponse<HousingUnit>> {
    const res = await api.get<PaginatedResponse<HousingUnit> & { data?: HousingUnit[] }>('/housing', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    const body = res.data as Record<string, unknown>;
    const data = Array.isArray(body?.data) ? body.data : [];
    const pagination = (body?.pagination as PaginatedResponse<HousingUnit>['pagination']) ?? { page: 1, limit: 20, total: 0, total_pages: 1 };
    return { data, pagination };
  },

  async getById(id: string): Promise<HousingUnit> {
    const res = await api.get<ApiResponse<HousingUnit>>(`/housing/${id}`);
    const raw = res.data as { data?: HousingUnit };
    return raw?.data ?? (res.data as HousingUnit);
  },

  async create(payload: CreateHousingUnitPayload | FormData): Promise<HousingUnit> {
    const res = await api.post<ApiResponse<HousingUnit>>('/housing', payload, payload instanceof FormData ? {} : undefined);
    const data = (res.data as { data?: HousingUnit })?.data;
    return data as HousingUnit;
  },

  async update(id: string, payload: Partial<CreateHousingUnitPayload> | FormData): Promise<HousingUnit> {
    const res = await api.put<ApiResponse<HousingUnit>>(`/housing/${id}`, payload, payload instanceof FormData ? {} : undefined);
    const data = (res.data as { data?: HousingUnit })?.data;
    return data as HousingUnit;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/housing/${id}`);
  },

  // ── Housing Payment Histories ────────────────────────────────
  async getPayments(housingId: string): Promise<HousingPaymentHistory[]> {
    const res = await api.get<ApiResponse<HousingPaymentHistory[]>>(`/housing/${housingId}/payments`);
    const raw = res.data as { data?: HousingPaymentHistory[] } | HousingPaymentHistory[];
    return Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
  },

  async createPayment(housingId: string, payload: CreateHousingPaymentPayload): Promise<HousingPaymentHistory> {
    const res = await api.post<ApiResponse<HousingPaymentHistory>>(`/housing/${housingId}/payments`, payload);
    return res.data.data;
  },

  async updatePayment(housingId: string, paymentId: string, payload: Partial<CreateHousingPaymentPayload>): Promise<HousingPaymentHistory> {
    const res = await api.put<ApiResponse<HousingPaymentHistory>>(`/housing/${housingId}/payments/${paymentId}`, payload);
    return res.data.data;
  },

  async removePayment(housingId: string, paymentId: string): Promise<void> {
    await api.delete(`/housing/${housingId}/payments/${paymentId}`);
  },
};
