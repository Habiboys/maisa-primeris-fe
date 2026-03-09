/**
 * types/marketing.types.ts
 * Tipe untuk Modul Marketing & Penjualan
 *
 * Status Lead selaras dengan backend ENUM:
 *   'Baru' | 'Follow-up' | 'Survey' | 'Negoisasi' | 'Deal' | 'Batal'
 */

// ── Enums ────────────────────────────────────────────────────

export type LeadStatus = 'Baru' | 'Follow-up' | 'Survey' | 'Negoisasi' | 'Deal' | 'Batal';
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
  interest?: string;
  status: LeadStatus;
  notes?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
  // relasi
  marketingPerson?: MarketingPerson;
}

export interface CreateLeadPayload {
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  marketing_id?: string;
  project_id?: string;
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
