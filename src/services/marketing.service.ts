/**
 * services/marketing.service.ts
 * Pemanggilan API untuk modul Marketing & Penjualan
 */

import api from '../lib/api';
import { cleanParams } from '../lib/utils';
import type {
    ApiResponse,
    CreateLeadPayload,
    CreateMarketingPersonPayload,
    Lead,
    LeadListParams,
    LeadStats,
    MarketingPerson,
    PaginatedResponse,
    UnitStatus,
} from '../types';

export const marketingService = {
  // ── Leads ────────────────────────────────────────────────────
  async getLeads(params?: LeadListParams): Promise<PaginatedResponse<Lead>> {
    const res = await api.get<PaginatedResponse<Lead>>('/leads', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async getLeadById(id: string): Promise<Lead> {
    const res = await api.get<ApiResponse<Lead>>(`/leads/${id}`);
    return res.data.data;
  },

  async createLead(payload: CreateLeadPayload): Promise<Lead> {
    const res = await api.post<ApiResponse<Lead>>('/leads', payload);
    return res.data.data;
  },

  async updateLead(id: string, payload: Partial<CreateLeadPayload>): Promise<Lead> {
    const res = await api.put<ApiResponse<Lead>>(`/leads/${id}`, payload);
    return res.data.data;
  },

  async removeLead(id: string): Promise<void> {
    await api.delete(`/leads/${id}`);
  },

  async getLeadStats(): Promise<LeadStats> {
    const res = await api.get<ApiResponse<LeadStats>>('/leads/stats');
    const body = res.data as { data?: LeadStats };
    return (body?.data ?? body) as LeadStats;
  },

  // ── Marketing Persons ────────────────────────────────────────
  async getMarketingPersons(params?: { is_active?: string; page?: number; limit?: number }): Promise<PaginatedResponse<MarketingPerson>> {
    const res = await api.get<PaginatedResponse<MarketingPerson>>('/marketing-persons', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async getMarketingPersonById(id: string): Promise<MarketingPerson> {
    const res = await api.get<ApiResponse<MarketingPerson>>(`/marketing-persons/${id}`);
    return res.data.data;
  },

  async createMarketingPerson(payload: CreateMarketingPersonPayload): Promise<MarketingPerson> {
    const res = await api.post<ApiResponse<MarketingPerson>>('/marketing-persons', payload);
    return res.data.data;
  },

  async updateMarketingPerson(id: string, payload: Partial<CreateMarketingPersonPayload>): Promise<MarketingPerson> {
    const res = await api.put<ApiResponse<MarketingPerson>>(`/marketing-persons/${id}`, payload);
    return res.data.data;
  },

  async removeMarketingPerson(id: string): Promise<void> {
    await api.delete(`/marketing-persons/${id}`);
  },

  // ── Unit Statuses (Siteplan) ─────────────────────────────────
  async getUnitStatuses(): Promise<UnitStatus[]> {
    const res = await api.get<ApiResponse<UnitStatus[]>>('/unit-statuses');
    const body = res.data as { data?: UnitStatus[] };
    const raw = body?.data ?? body;
    return Array.isArray(raw) ? raw : [];
  },

  async updateUnitStatus(unitCode: string, payload: Partial<UnitStatus>): Promise<UnitStatus> {
    const res = await api.put<ApiResponse<UnitStatus>>(`/unit-statuses/${unitCode}`, payload);
    return res.data.data;
  },
};
