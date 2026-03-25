/**
 * types/legal.types.ts
 * Tipe untuk Modul Transaksi Legal (PPJB, Akad, BAST, Pindah Unit, Pembatalan)
 * — sesuai backend models
 */

// ── Shared sub-types (dari include) ──────────────────────────────

export interface LegalConsumer {
  id: string;
  name: string;
  nik?: string;
  phone?: string;
  email?: string;
}

export interface LegalHousingUnit {
  id: string;
  unit_code: string;
  unit_type?: string;
  luas_tanah?: number;
  luas_bangunan?: number;
  project_id?: string;
}

// ── PPJB ─────────────────────────────────────────────────────────

export type PpjbStatus = 'Draft' | 'Ditandatangani' | 'Batal';

export interface PPJB {
  id: string;
  housing_unit_id?: string;
  consumer_id?: string;
  nomor_ppjb?: string;
  tanggal_ppjb?: string;
  harga_ppjb?: number;
  status: PpjbStatus;
  dokumen_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // relasi
  consumer?: LegalConsumer;
  housingUnit?: LegalHousingUnit;
}

export type CreatePPJBPayload = Omit<PPJB, 'id' | 'created_at' | 'updated_at' | 'consumer' | 'housingUnit'>;

// ── Akad ─────────────────────────────────────────────────────────

export type AkadStatus = 'Draft' | 'Selesai' | 'Batal';

export interface Akad {
  id: string;
  housing_unit_id?: string;
  consumer_id?: string;
  ppjb_id?: string;
  nomor_akad?: string;
  tanggal_akad?: string;
  bank?: string;
  notaris?: string;
  status: AkadStatus;
  dokumen_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // relasi
  consumer?: LegalConsumer;
  housingUnit?: LegalHousingUnit;
}

export type CreateAkadPayload = Omit<Akad, 'id' | 'created_at' | 'updated_at' | 'consumer' | 'housingUnit'>;

// ── BAST ─────────────────────────────────────────────────────────

export type BastStatus = 'Draft' | 'Ditandatangani' | 'Batal';

export interface BAST {
  id: string;
  housing_unit_id?: string;
  consumer_id?: string;
  akad_id?: string;
  nomor_bast?: string;
  tanggal_bast?: string;
  status: BastStatus;
  dokumen_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // relasi
  consumer?: LegalConsumer;
  housingUnit?: LegalHousingUnit;
}

export type CreateBASTPayload = Omit<BAST, 'id' | 'created_at' | 'updated_at' | 'consumer' | 'housingUnit'>;

// ── Pindah Unit ──────────────────────────────────────────────────

export type PindahUnitStatus = 'Proses' | 'Selesai' | 'Batal';

export interface PindahUnit {
  id: string;
  consumer_id?: string;
  housing_unit_id_lama?: string;
  housing_unit_id_baru?: string;
  unit_lama?: string;
  unit_baru?: string;
  tanggal_pindah?: string;
  alasan?: string;
  selisih_harga?: number;
  status: PindahUnitStatus;
  dokumen_url?: string;
  created_at: string;
  updated_at: string;
  // relasi
  consumer?: LegalConsumer;
  housingUnitLama?: LegalHousingUnit;
  housingUnitBaru?: LegalHousingUnit;
}

export type CreatePindahUnitPayload = Omit<PindahUnit, 'id' | 'created_at' | 'updated_at' | 'consumer' | 'housingUnitLama' | 'housingUnitBaru'>;

// ── Pembatalan ───────────────────────────────────────────────────

export type PembatalanStatus = 'Proses' | 'Selesai';

export interface Pembatalan {
  id: string;
  consumer_id?: string;
  housing_unit_id?: string;
  unit_code?: string;
  tanggal_batal?: string;
  alasan?: string;
  refund_amount?: number;
  status: PembatalanStatus;
  dokumen_url?: string;
  created_at: string;
  updated_at: string;
  // relasi
  consumer?: LegalConsumer;
  housingUnit?: LegalHousingUnit;
}

export type CreatePembatalanPayload = Omit<Pembatalan, 'id' | 'created_at' | 'updated_at' | 'consumer' | 'housingUnit'>;
