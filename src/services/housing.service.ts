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
  async getAll(params?: { status?: string; tipe?: string; search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<HousingUnit>> {
    const res = await api.get<PaginatedResponse<HousingUnit>>('/housing', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async getById(id: string): Promise<HousingUnit> {
    const res = await api.get<ApiResponse<HousingUnit>>(`/housing/${id}`);
    return res.data.data;
  },

  async create(payload: CreateHousingUnitPayload): Promise<HousingUnit> {
    const res = await api.post<ApiResponse<HousingUnit>>('/housing', payload);
    return res.data.data;
  },

  async update(id: string, payload: Partial<CreateHousingUnitPayload>): Promise<HousingUnit> {
    const res = await api.put<ApiResponse<HousingUnit>>(`/housing/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/housing/${id}`);
  },

  // ── Housing Payment Histories ────────────────────────────────
  async getPayments(housingId: string): Promise<HousingPaymentHistory[]> {
    const res = await api.get<ApiResponse<HousingPaymentHistory[]>>(`/housing/${housingId}/payments`);
    return res.data.data;
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
