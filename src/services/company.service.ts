import api from '../lib/api';
import type { ApiResponse, Company, CompanyPayload, CompanySettingsPayload } from '../types';

export const companyService = {
  async getAll(params?: { search?: string; is_active?: boolean }): Promise<Company[]> {
    const res = await api.get<ApiResponse<Company[]>>('/companies', { params });
    return res.data.data;
  },

  async getById(id: string): Promise<Company> {
    const res = await api.get<ApiResponse<Company>>(`/companies/${id}`);
    return res.data.data;
  },

  async create(payload: CompanyPayload): Promise<Company> {
    const res = await api.post<ApiResponse<Company>>('/companies', payload);
    return res.data.data;
  },

  async update(id: string, payload: CompanyPayload): Promise<Company> {
    const res = await api.put<ApiResponse<Company>>(`/companies/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/companies/${id}`);
  },

  async getMySettings() {
    const res = await api.get<ApiResponse<Company['settings']>>('/company-settings/me');
    return res.data.data;
  },

  async getSettingsByCompany(companyId: string) {
    const res = await api.get<ApiResponse<Company['settings']>>(`/company-settings/company/${companyId}`);
    return res.data.data;
  },

  async updateMySettings(payload: CompanySettingsPayload): Promise<Company['settings']> {
    const res = await api.put<ApiResponse<Company['settings']>>('/company-settings/me', payload);
    return res.data.data;
  },

  async updateSettingsByCompany(companyId: string, payload: CompanySettingsPayload): Promise<Company['settings']> {
    const res = await api.put<ApiResponse<Company['settings']>>(`/company-settings/company/${companyId}`, payload);
    return res.data.data;
  },

  async updateMySettingsWithLogo(payload: CompanySettingsPayload, logo?: File | null): Promise<Company['settings']> {
    const form = new FormData();
    if (payload.app_name !== undefined) form.append('app_name', payload.app_name);
    if (payload.logo_url !== undefined && payload.logo_url !== null) form.append('logo_url', payload.logo_url);
    if (payload.primary_color !== undefined) form.append('primary_color', payload.primary_color);
    if (payload.secondary_color !== undefined) form.append('secondary_color', payload.secondary_color);
    if (payload.accent_color !== undefined) form.append('accent_color', payload.accent_color);
    if (logo) form.append('logo', logo);

    const res = await api.put<ApiResponse<Company['settings']>>('/company-settings/me', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async updateSettingsByCompanyWithLogo(companyId: string, payload: CompanySettingsPayload, logo?: File | null): Promise<Company['settings']> {
    const form = new FormData();
    if (payload.app_name !== undefined) form.append('app_name', payload.app_name);
    if (payload.logo_url !== undefined && payload.logo_url !== null) form.append('logo_url', payload.logo_url);
    if (payload.primary_color !== undefined) form.append('primary_color', payload.primary_color);
    if (payload.secondary_color !== undefined) form.append('secondary_color', payload.secondary_color);
    if (payload.accent_color !== undefined) form.append('accent_color', payload.accent_color);
    if (logo) form.append('logo', logo);

    const res = await api.put<ApiResponse<Company['settings']>>(`/company-settings/company/${companyId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
