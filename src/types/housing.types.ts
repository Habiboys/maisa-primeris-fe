/**
 * types/housing.types.ts
 * Tipe untuk Modul Housing (Kavling/Unit)
 *
 * Status selaras dengan backend ENUM: 'Tersedia' | 'Proses' | 'Sold'
 */

export type HousingUnitStatus = 'Tersedia' | 'Proses' | 'Sold';

export interface HousingUnit {
  id: string;
  unit_code: string;
  project_id?: string;
  unit_type?: string;
  luas_tanah?: number;
  luas_bangunan?: number;
  harga_jual?: number;
  consumer_id?: string;
  status: HousingUnitStatus;
  akad_date?: string;
  serah_terima_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // relasi
  consumer?: { id: string; name: string; phone?: string; email?: string };
  payments?: HousingPaymentHistory[];
}

export interface HousingPaymentHistory {
  id: string;
  housing_unit_id: string;
  payment_date: string;
  amount: number;
  type?: string;
  description?: string;
  receipt_file?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateHousingUnitPayload {
  unit_code: string;
  project_id?: string;
  unit_type?: string;
  luas_tanah?: number;
  luas_bangunan?: number;
  harga_jual?: number;
  consumer_id?: string;
  status?: HousingUnitStatus;
  akad_date?: string;
  serah_terima_date?: string;
  notes?: string;
}

export interface CreateHousingPaymentPayload {
  payment_date: string;
  amount: number;
  type?: string;
  description?: string;
}
