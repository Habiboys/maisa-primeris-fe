/**
 * types/sop.types.ts
 * Tipe untuk Modul SOP & Logistik Material
 *
 * Status enums HARUS sesuai dengan backend ENUM di migration:
 *   - PermintaanMaterial: Draft, Diajukan, Disetujui, Ditolak, Selesai
 *   - TandaTerimaGudang: Draft, Selesai
 *   - BarangKeluar:      Draft, Selesai
 *   - SuratJalan:        Draft, Dikirim, Diterima
 *   - Inventaris cond:   Baik, Rusak Ringan, Rusak Berat, Hilang
 */

export type PermintaanStatus = 'Draft' | 'Diajukan' | 'Disetujui' | 'Ditolak' | 'Selesai';
export type TTGStatus = 'Draft' | 'Selesai';
export type BarangKeluarStatus = 'Draft' | 'Selesai';
export type SuratJalanStatus = 'Draft' | 'Dikirim' | 'Diterima';
export type KondisiBarang = 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang';

// ── Permintaan Material ──────────────────────────────────────
export interface PermintaanMaterialItem {
  id?: string;
  namaBarang: string;
  qty: number;
  satuan: string;
  keterangan?: string;
}

export interface PermintaanMaterial {
  id: string;
  noForm: string;
  tanggal: string;
  divisi?: string;
  namaPeminta?: string;
  status: PermintaanStatus;
  disetujui?: string;
  diperiksa?: string;
  createdAt?: string;
  items: PermintaanMaterialItem[];
}

// ── Tanda Terima Gudang ──────────────────────────────────────
export interface TTGItem {
  id?: string;
  namaBarang: string;
  qty: number;
  satuan: string;
  kondisi: string;
}

export interface TandaTerimaGudang {
  id: string;
  noTerima: string;
  tanggal: string;
  supplier: string;
  penerima: string;
  status: TTGStatus;
  createdAt?: string;
  items: TTGItem[];
}

// ── Barang Keluar ───────────────────────────────────────────
export interface BarangKeluarItem {
  id?: string;
  namaBarang: string;
  qty: number;
  satuan: string;
  keterangan?: string;
}

export interface BarangKeluar {
  id: string;
  noForm: string;
  tanggal: string;
  tujuan?: string;
  penerima?: string;
  project?: string;
  status: BarangKeluarStatus;
  createdAt?: string;
  items: BarangKeluarItem[];
}

// ── Inventaris Lapangan ──────────────────────────────────────
export interface InventarisLapangan {
  id: string;
  kode?: string;
  namaBarang: string;
  kategori?: string;
  lokasi?: string;
  kondisi: KondisiBarang;
  qty: number;
  satuan?: string;
  tanggalCatat?: string;
  penanggungJawab?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Surat Jalan ──────────────────────────────────────────────
export interface SuratJalanItem {
  id?: string;
  namaBarang: string;
  satuan: string;
  jumlah: number;
  keterangan?: string;
}

export interface SuratJalan {
  id: string;
  nomorSurat: string;
  tanggal: string;
  nomorPO?: string;
  kepada?: string;
  dikirimDengan?: string;
  noPolisi?: string;
  namaPengemudi?: string;
  tandaTerima?: string;
  pengemudi?: string;
  mengetahui?: string;
  totalBarang: number;
  status: SuratJalanStatus;
  createdAt?: string;
  items: SuratJalanItem[];
}
