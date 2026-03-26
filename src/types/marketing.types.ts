/**
 * types/marketing.types.ts
 * Tipe untuk Modul Marketing & Penjualan
 *
 * Status lead: lihat `frontend/src/constants/leadStatus.ts` (selaras ENUM backend).
 */

import type { LeadStatus } from '../constants/leadStatus';

export type { LeadStatus };
export type LeadSource = 'Facebook Ads' | 'Walk-in' | 'Referral' | 'Instagram' | 'Website';
export type UnitSitePlanStatus = 'Tersedia' | 'Indent' | 'Booking' | 'Sold' | 'Batal';

// ── Lead ─────────────────────────────────────────────────────

export interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  marketing_id?: string;
  project_id?: string;
  housing_unit_id?: string;
  interest?: string;
  status: LeadStatus;
  /** Terisi setelah piutang dibuat dari lead Deal */
  consumer_id?: string | null;
  notes?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
  marketingPerson?: MarketingPerson;
  housingUnit?: { id: string; unit_code: string; unit_type?: string; project_id?: string; harga_jual?: number };
}

export interface CreateLeadPayload {
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  marketing_id?: string;
  project_id?: string;
  housing_unit_id?: string;
  interest?: string;
  status?: LeadStatus;
  notes?: string;
  follow_up_date?: string;
}

export interface LeadListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  source?: string;
  marketing_id?: string;
  project_id?: string;
  /** true: hanya Deal yang belum punya piutang (untuk dropdown Finance) */
  unconverted_finance?: boolean;
}

export interface LeadStats {
  total: number;
  hot: number;
  closing_rate: number;
  batal: number;
}

// ── Marketing Person ─────────────────────────────────────────

export interface MarketingPerson {
  id: string;
  user_id?: string;
  name: string;
  phone?: string;
  email?: string;
  target: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // relasi
  user?: { id: string; name: string; email: string };
  leads?: Lead[];
}

export interface CreateMarketingPersonPayload {
  name: string;
  phone?: string;
  email?: string;
  user_id?: string;
  target?: number;
  is_active?: boolean;
}

// ── Unit Status (Siteplan) ───────────────────────────────────

export interface UnitStatus {
  id: string;
  unit_code: string;
  project_id?: string;
  status: UnitSitePlanStatus;
  consumer_id?: string;
  price?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}
