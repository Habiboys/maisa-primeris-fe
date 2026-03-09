/**
 * lib/mockSOP.ts
 * ─────────────────────────────────────────────────────────
 * Data dummy untuk modul SOP & Logistik Material.
 *
 * Dipanggil oleh hooks/useSOP.ts saat USE_MOCK_DATA = true.
 * Tipe field menggunakan camelCase sesuai sop.types.ts.
 * Status ENUM sesuai backend migration.
 * ─────────────────────────────────────────────────────────
 */

import type {
    BarangKeluar,
    InventarisLapangan,
    PermintaanMaterial,
    SuratJalan,
    TandaTerimaGudang,
} from '../types';

export const mockPermintaanMaterial: PermintaanMaterial[] = [
  {
    id: '1',
    noForm: 'PM-2026-001',
    tanggal: '2026-02-10',
    divisi: 'Project Construction',
    namaPeminta: 'Agus Wirawan',
    items: [
      { namaBarang: 'Semen Gresik 40kg', qty: 50, satuan: 'Sak', keterangan: 'Untuk cor lantai unit A1-A5' },
      { namaBarang: 'Pasir Pasang', qty: 5, satuan: 'M3' },
      { namaBarang: 'Besi Beton 10mm', qty: 200, satuan: 'Batang' },
    ],
    status: 'Disetujui',
  },
  {
    id: '2',
    noForm: 'PM-2026-002',
    tanggal: '2026-02-12',
    divisi: 'Finishing',
    namaPeminta: 'Siti Nurhaliza',
    items: [
      { namaBarang: 'Cat Tembok Putih', qty: 20, satuan: 'Kaleng 5kg' },
      { namaBarang: 'Kuas Cat 3 inch', qty: 10, satuan: 'Pcs' },
    ],
    status: 'Diajukan',
  },
];

export const mockTandaTerimaGudang: TandaTerimaGudang[] = [
  {
    id: '1',
    noTerima: 'TTG-2026-001',
    tanggal: '2026-02-11',
    supplier: 'CV Sumber Rejeki',
    penerima: 'Ahmad Fauzi',
    items: [
      { namaBarang: 'Semen Gresik 40kg', qty: 100, satuan: 'Sak', kondisi: 'Baik' },
      { namaBarang: 'Pasir Pasang', qty: 10, satuan: 'M3', kondisi: 'Baik' },
    ],
    status: 'Selesai',
  },
];

export const mockBarangKeluar: BarangKeluar[] = [
  {
    id: '1',
    noForm: 'BK-2026-001',
    tanggal: '2026-02-12',
    tujuan: 'Site Cluster Alamanda',
    penerima: 'Bambang Sutejo',
    project: 'Cluster Alamanda',
    items: [
      { namaBarang: 'Semen Gresik 40kg', qty: 30, satuan: 'Sak', keterangan: 'Unit A3-A5' },
      { namaBarang: 'Besi Beton 10mm', qty: 80, satuan: 'Batang' },
    ],
    status: 'Selesai',
  },
];

export const mockInventarisLapangan: InventarisLapangan[] = [
  { id: '1', kode: 'INV-001', namaBarang: 'Concrete Mixer Molen', kategori: 'Alat Berat', lokasi: 'Site Cluster Alamanda', kondisi: 'Baik', qty: 1, satuan: 'Unit', tanggalCatat: '2026-02-05', penanggungJawab: 'Agus Wirawan' },
  { id: '2', kode: 'INV-002', namaBarang: 'Scaffolding Set', kategori: 'Alat Bantu', lokasi: 'Site Cluster Bougenville', kondisi: 'Baik', qty: 5, satuan: 'Set', tanggalCatat: '2026-02-08', penanggungJawab: 'Joko Susilo' },
  { id: '3', kode: 'INV-003', namaBarang: 'Generator 5000W', kategori: 'Alat Listrik', lokasi: 'Site Cluster Alamanda', kondisi: 'Rusak Ringan', qty: 1, satuan: 'Unit', tanggalCatat: '2026-02-10', penanggungJawab: 'Agus Wirawan' },
];

export const mockSuratJalan: SuratJalan[] = [
  {
    id: '1',
    nomorSurat: 'SJ-2026-001',
    tanggal: '2026-02-13',
    nomorPO: 'PO-2026-001',
    kepada: 'Site Cluster Alamanda',
    dikirimDengan: 'Truk',
    noPolisi: 'L 1234 AB',
    namaPengemudi: 'Eko Prasetyo',
    tandaTerima: 'Bambang Sutejo',
    pengemudi: 'Eko Prasetyo',
    mengetahui: 'Ahmad Fauzi',
    items: [
      { namaBarang: 'Semen Gresik 40kg', satuan: 'Sak', jumlah: 50, keterangan: 'Unit A3-A5' },
      { namaBarang: 'Pasir Pasang', satuan: 'M3', jumlah: 3, keterangan: 'Unit A3-A5' },
    ],
    totalBarang: 53,
    status: 'Diterima',
  },
];
