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
  project_unit_id?: string;
  unit_type?: string;
  id_rumah?: string;
  no_sertifikat?: string;
  panjang_kanan?: number;
  panjang_kiri?: number;
  lebar_depan?: number;
  lebar_belakang?: number;
  luas_tanah?: number;
  luas_bangunan?: number;
  harga_per_meter?: number;
  harga_jual?: number;
  daya_listrik?: number;
  consumer_id?: string;
  /** Lead yang mengunci unit (booking/reserved). Null jika Tersedia. */
  reserved_lead_id?: string | null;
  status: HousingUnitStatus;
  akad_date?: string;
  serah_terima_date?: string;
  notes?: string;
  photo_url?: string;
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
  project_unit_id?: string;
  unit_type?: string;
  id_rumah?: string;
  no_sertifikat?: string;
  panjang_kanan?: number;
  panjang_kiri?: number;
  lebar_depan?: number;
  lebar_belakang?: number;
  luas_tanah?: number;
  luas_bangunan?: number;
  harga_per_meter?: number;
  harga_jual?: number;
  daya_listrik?: number;
  consumer_id?: string;
  status?: HousingUnitStatus;
  akad_date?: string;
  serah_terima_date?: string;
  notes?: string;
  photo_url?: string;
}

export interface CreateHousingPaymentPayload {
  payment_date: string;
  amount: number;
  type?: string;
  description?: string;
}
