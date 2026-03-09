/**
 * services/dashboard.service.ts
 * Pemanggilan API untuk modul Dashboard
 */

import api from '../lib/api';
import type { ApiResponse } from '../types';

export interface DashboardSummary {
  total_unit: number;
  unit_terjual: number;
  unit_progres: number;
  pendapatan: number;
  target_penjualan_pct: number;
  unit_kritis: number;
}

export interface CashflowPoint {
  month: string;
  masuk: number;
  keluar: number;
}

export interface ConstructionProgressItem {
  name: string;
  progress: number;
}

export interface SalesDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface BudgetVsActualItem {
  month: string;
  pagu: number;
  realisasi: number;
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data;
  },

  async getCashflow(months = 6): Promise<CashflowPoint[]> {
    const res = await api.get<ApiResponse<CashflowPoint[]>>('/dashboard/cashflow', {
      params: { months },
    });
    return res.data.data;
  },

  async getConstructionProgress(): Promise<ConstructionProgressItem[]> {
    const res = await api.get<ApiResponse<ConstructionProgressItem[]>>('/dashboard/construction-progress');
    return res.data.data;
  },

  async getSalesDistribution(): Promise<SalesDistributionItem[]> {
    const res = await api.get<ApiResponse<SalesDistributionItem[]>>('/dashboard/sales-distribution');
    return res.data.data;
  },

  async getBudgetVsActual(): Promise<BudgetVsActualItem[]> {
    const res = await api.get<ApiResponse<BudgetVsActualItem[]>>('/dashboard/budget-vs-actual');
    return res.data.data;
  },
};
