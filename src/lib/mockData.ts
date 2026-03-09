/**
 * lib/mockData.ts
 * ─────────────────────────────────────────────────────────
 * Data dummy terpusat untuk seluruh modul aplikasi.
 *
 * CARA PAKAI:
 *   import { MOCK } from '../lib/mockData';
 *   const users = MOCK.users;
 *
 * Untuk MENONAKTIFKAN data dummy dan memakai API asli, ubah di:
 *   .env → VITE_USE_MOCK_DATA=false
 *   atau import { USE_MOCK_DATA } from './config'
 * ─────────────────────────────────────────────────────────
 */

import { mockConstructionProjects } from './mockConstruction';

// ────────────────────────────────────────────────────────────
// 1. USER MANAGEMENT
// ────────────────────────────────────────────────────────────

export const mockUsers = [
  { id: '1', name: 'Ahmad Faisal', email: 'ahmad@maisaprimeris.com', role: 'Super Admin' as const, status: 'Aktif' as const, lastActivity: '2 menit yang lalu' },
  { id: '2', name: 'Sari Wijaya', email: 'sari@maisaprimeris.com', role: 'Finance' as const, status: 'Aktif' as const, lastActivity: '1 jam yang lalu' },
  { id: '3', name: 'Bambang Hero', email: 'bambang@maisaprimeris.com', role: 'Project Management' as const, status: 'Aktif' as const, lastActivity: '3 jam yang lalu' },
  { id: '4', name: 'Indra Kusuma', email: 'indra@maisaprimeris.com', role: 'Project Management' as const, status: 'Nonaktif' as const, lastActivity: '1 hari yang lalu' },
  { id: '5', name: 'Dian Permata', email: 'dian@maisaprimeris.com', role: 'Finance' as const, status: 'Aktif' as const, lastActivity: 'Baru saja' },
];

export const mockActivityLogs = [
  { id: 'LOG-001', user: 'Ahmad Faisal', action: 'Update Progres Konstruksi', target: 'Cluster A: Emerald Heights', time: '05 Feb 2026, 14:20', ip: '192.168.1.45', device: 'Chrome - Windows 11' },
  { id: 'LOG-002', user: 'Sari Wijaya', action: 'Input Pembayaran Unit', target: 'Kavling B-02', time: '05 Feb 2026, 11:05', ip: '192.168.1.22', device: 'Safari - macOS' },
  { id: 'LOG-003', user: 'Ahmad Faisal', action: 'Tambah User Baru', target: 'Dian Permata', time: '05 Feb 2026, 09:15', ip: '192.168.1.45', device: 'Chrome - Windows 11' },
  { id: 'LOG-004', user: 'Bambang Hero', action: 'Update Status Kavling', target: 'Kavling A-03', time: '04 Feb 2026, 16:45', ip: '112.45.67.12', device: 'Chrome - Android' },
  { id: 'LOG-005', user: 'Dian Permata', action: 'Export Laporan Keuangan', target: 'Laporan Jan 2026', time: '04 Feb 2026, 10:30', ip: '192.168.1.56', device: 'Edge - Windows 10' },
];

// ────────────────────────────────────────────────────────────
// 2. DASHBOARD
// ────────────────────────────────────────────────────────────

export const mockCashflowData = [
  { month: 'Jan', masuk: 450, keluar: 320 },
  { month: 'Feb', masuk: 520, keluar: 380 },
  { month: 'Mar', masuk: 480, keluar: 410 },
  { month: 'Apr', masuk: 610, keluar: 450 },
  { month: 'May', masuk: 590, keluar: 480 },
  { month: 'Jun', masuk: 720, keluar: 520 },
];

export const mockBudgetVsActualData = [
  { month: 'Jan', pagu: 400, realisasi: 380 },
  { month: 'Feb', pagu: 450, realisasi: 420 },
  { month: 'Mar', pagu: 500, realisasi: 510 },
  { month: 'Apr', pagu: 480, realisasi: 450 },
  { month: 'May', pagu: 550, realisasi: 530 },
  { month: 'Jun', pagu: 600, realisasi: 580 },
];

export const mockConstructionProgress = [
  { name: 'Pondasi', progress: 100 },
  { name: 'Struktur', progress: 85 },
  { name: 'Finishing', progress: 40 },
  { name: 'Landscape', progress: 15 },
];

export const mockSalesStatus = [
  { name: 'Tersedia', value: 45, color: '#e2e8f0' },
  { name: 'Booking', value: 25, color: '#b7860f' },
  { name: 'Terjual', value: 30, color: '#22c55e' },
];

export const mockDashboardKpi = {
  totalUnit: 120,
  unitTerjual: 84,
  unitProgres: 36,
  pendapatan: 12400000000,
};

export const mockRecentActivities = [
  { user: 'Budi Santoso', action: 'Melakukan update progres unit', target: 'Kavling A-12', time: '10 Menit yang lalu' },
  { user: 'Siti Aminah', action: 'Input pembayaran DP', target: 'Unit B-05', time: '2 Jam yang lalu' },
  { user: 'Finance Team', action: 'Export laporan keuangan bulanan', target: 'Laporan Mei 2024', time: '4 Jam yang lalu' },
  { user: 'System', action: 'Update status unit otomatis', target: 'Unit C-02 (Sold)', time: '1 Hari yang lalu' },
];

// ────────────────────────────────────────────────────────────
// 3. FINANCE
// ────────────────────────────────────────────────────────────

export const mockTransactions = [
  { id: 'TRX001', transaction_date: '2026-02-05', description: 'Pembayaran DP Unit A-12', category: 'Sales', amount: 45000000, type: 'Pemasukan' as const, payment_method: 'Transfer Bank', reference_no: 'A-12', created_at: '2026-02-05', updated_at: '2026-02-05' },
  { id: 'TRX002', transaction_date: '2026-02-04', description: 'Pembelian Semen 500 Sak', category: 'Material', amount: 32500000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-02-04', updated_at: '2026-02-04' },
  { id: 'TRX003', transaction_date: '2026-02-04', description: 'Gaji Tukang Cluster B', category: 'Labor', amount: 15000000, type: 'Pengeluaran' as const, payment_method: 'Cash', reference_no: '', created_at: '2026-02-04', updated_at: '2026-02-04' },
  { id: 'TRX004', transaction_date: '2026-02-03', description: 'Angsuran KPR Unit B-05', category: 'Sales', amount: 8500000, type: 'Pemasukan' as const, payment_method: 'Transfer Bank', reference_no: 'B-05', created_at: '2026-02-03', updated_at: '2026-02-03' },
  { id: 'TRX005', transaction_date: '2026-02-02', description: 'Sewa Alat Berat Excavator', category: 'Operation', amount: 12000000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-02-02', updated_at: '2026-02-02' },
  { id: 'TRX006', transaction_date: '2026-02-01', description: 'Pelunasan Unit C-08', category: 'Sales', amount: 250000000, type: 'Pemasukan' as const, payment_method: 'Transfer Bank', reference_no: 'C-08', created_at: '2026-02-01', updated_at: '2026-02-01' },
  { id: 'TRX007', transaction_date: '2026-01-31', description: 'Biaya Iklan Facebook Ads', category: 'Marketing', amount: 5000000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-31', updated_at: '2026-01-31' },
  { id: 'TRX008', transaction_date: '2026-01-30', description: 'Pembelian Besi Beton 10mm', category: 'Material', amount: 45000000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-30', updated_at: '2026-01-30' },
  { id: 'TRX009', transaction_date: '2026-01-29', description: 'Booking Fee Unit A-01', category: 'Sales', amount: 5000000, type: 'Pemasukan' as const, payment_method: 'Cash', reference_no: 'A-01', created_at: '2026-01-29', updated_at: '2026-01-29' },
  { id: 'TRX010', transaction_date: '2026-01-28', description: 'Biaya Notaris & AJB', category: 'Operation', amount: 7500000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-28', updated_at: '2026-01-28' },
  { id: 'TRX011', transaction_date: '2026-01-27', description: 'Gaji Karyawan Kantor Jan', category: 'Labor', amount: 65000000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-27', updated_at: '2026-01-27' },
  { id: 'TRX012', transaction_date: '2026-01-26', description: 'Pembayaran Listrik & Air', category: 'Operation', amount: 1200000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-26', updated_at: '2026-01-26' },
  { id: 'TRX013', transaction_date: '2026-01-25', description: 'Refund Pembatalan Unit B-10', category: 'Sales', amount: 10000000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: 'B-10', created_at: '2026-01-25', updated_at: '2026-01-25' },
  { id: 'TRX014', transaction_date: '2026-01-24', description: 'Pembelian Pasir 10 Truk', category: 'Material', amount: 18000000, type: 'Pengeluaran' as const, payment_method: 'Cash', reference_no: '', created_at: '2026-01-24', updated_at: '2026-01-24' },
  { id: 'TRX015', transaction_date: '2026-01-23', description: 'Bonus Sales Target Jan', category: 'Marketing', amount: 12000000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-23', updated_at: '2026-01-23' },
  { id: 'TRX016', transaction_date: '2026-01-22', description: 'Sponsorship Event Lokal', category: 'Marketing', amount: 3500000, type: 'Pengeluaran' as const, payment_method: 'Cash', reference_no: '', created_at: '2026-01-22', updated_at: '2026-01-22' },
  { id: 'TRX017', transaction_date: '2026-01-21', description: 'Pencairan KPR Bank Mandiri', category: 'Sales', amount: 560000000, type: 'Pemasukan' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-21', updated_at: '2026-01-21' },
  { id: 'TRX018', transaction_date: '2026-01-20', description: 'Service Kendaraan Operasional', category: 'Operation', amount: 2500000, type: 'Pengeluaran' as const, payment_method: 'Cash', reference_no: '', created_at: '2026-01-20', updated_at: '2026-01-20' },
  { id: 'TRX019', transaction_date: '2026-01-19', description: 'Pembelian Cat Tembok 50 Pail', category: 'Material', amount: 22000000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-19', updated_at: '2026-01-19' },
  { id: 'TRX020', transaction_date: '2026-01-18', description: 'Termin 2 Penjualan Unit D-01', category: 'Sales', amount: 125000000, type: 'Pemasukan' as const, payment_method: 'Transfer Bank', reference_no: 'D-01', created_at: '2026-01-18', updated_at: '2026-01-18' },
  { id: 'TRX021', transaction_date: '2026-01-17', description: 'Instalasi Jaringan Listrik Site', category: 'Operation', amount: 45000000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-17', updated_at: '2026-01-17' },
  { id: 'TRX022', transaction_date: '2026-01-16', description: 'Sewa Gudang Logistik', category: 'Operation', amount: 8000000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-16', updated_at: '2026-01-16' },
  { id: 'TRX023', transaction_date: '2026-01-15', description: 'Pelunasan Bertahap Unit A-05', category: 'Sales', amount: 85000000, type: 'Pemasukan' as const, payment_method: 'Transfer Bank', reference_no: 'A-05', created_at: '2026-01-15', updated_at: '2026-01-15' },
  { id: 'TRX024', transaction_date: '2026-01-14', description: 'Biaya Pemeliharaan Taman', category: 'Operation', amount: 3500000, type: 'Pengeluaran' as const, payment_method: 'Cash', reference_no: '', created_at: '2026-01-14', updated_at: '2026-01-14' },
  { id: 'TRX025', transaction_date: '2026-01-13', description: 'Pembelian Keramik Lantai 40x40', category: 'Material', amount: 55000000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-13', updated_at: '2026-01-13' },
  { id: 'TRX026', transaction_date: '2026-01-12', description: 'Fee Agen Properti (External)', category: 'Marketing', amount: 15000000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-12', updated_at: '2026-01-12' },
  { id: 'TRX027', transaction_date: '2026-01-11', description: 'Setoran Modal Investor', category: 'Sales', amount: 1500000000, type: 'Pemasukan' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-11', updated_at: '2026-01-11' },
  { id: 'TRX028', transaction_date: '2026-01-10', description: 'Update Interior Kantor Pemasaran', category: 'Operation', amount: 28000000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-10', updated_at: '2026-01-10' },
  { id: 'TRX029', transaction_date: '2026-01-09', description: 'Pembayaran PBB Lahan Proyek', category: 'Operation', amount: 12500000, type: 'Pengeluaran' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-09', updated_at: '2026-01-09' },
  { id: 'TRX030', transaction_date: '2026-01-08', description: 'Penerimaan Biaya Balik Nama', category: 'Sales', amount: 15000000, type: 'Pemasukan' as const, payment_method: 'Transfer Bank', reference_no: '', created_at: '2026-01-08', updated_at: '2026-01-08' },
];

export const mockDanaMasuk = [
  { no: 1, blok: 'A-01', tanggal: '2026-02-05', keterangan: 'Pembayaran DP Unit', jumlah: 50000000, noRek: 'BCA 123456789' },
  { no: 2, blok: 'B-12', tanggal: '2026-02-04', keterangan: 'Angsuran KPR Termin 1', jumlah: 8500000, noRek: 'Mandiri 987654321' },
  { no: 3, blok: 'C-05', tanggal: '2026-02-03', keterangan: 'Pelunasan Cash Bertahap', jumlah: 125000000, noRek: 'BCA 123456789' },
];

export const mockDanaKeluar = [
  { no: 1, tanggal: '2026-02-05', keterangan: 'Pembelian Semen 500 Sak', jumlah: 32500000 },
  { no: 2, tanggal: '2026-02-04', keterangan: 'Gaji Tukang Cluster B (Minggu 1)', jumlah: 15000000 },
];

export const mockPiutang = [
  {
    id: '1',
    name: 'Agung Pratama Nugraha',
    nik: '1371012345670001',
    phone: '081234567890',
    email: 'agung@email.com',
    address: 'Jl. Sudirman No. 10, Padang',
    unit_code: 'Block D3',
    total_price: 850000000,
    paid_amount: 850000000,
    payment_scheme: 'Cash Bertahap',
    status: 'Lunas' as const,
    created_at: '2024-06-13',
    updated_at: '2025-08-05',
    payments: [
      { id: 'ph-1', consumer_id: '1', payment_date: '2024-06-13', amount: 5000000, payment_method: 'Cash', notes: 'Booking', created_at: '2024-06-13', updated_at: '2024-06-13' },
      { id: 'ph-2', consumer_id: '1', payment_date: '2024-06-14', amount: 85000000, payment_method: 'Transfer Bank', notes: 'Down Payment', created_at: '2024-06-14', updated_at: '2024-06-14' },
      { id: 'ph-3', consumer_id: '1', payment_date: '2024-10-16', amount: 150000000, payment_method: 'Transfer Bank', notes: 'Angsuran Pembayaran Pertama', created_at: '2024-10-16', updated_at: '2024-10-16' },
      { id: 'ph-4', consumer_id: '1', payment_date: '2025-07-17', amount: 150000000, payment_method: 'Transfer Bank', notes: 'Angsuran Pembayaran Kedua', created_at: '2025-07-17', updated_at: '2025-07-17' },
      { id: 'ph-5', consumer_id: '1', payment_date: '2025-08-05', amount: 460000000, payment_method: 'Transfer Bank', notes: 'Pelunasan Pembayaran', created_at: '2025-08-05', updated_at: '2025-08-05' },
    ],
  },
  {
    id: '2',
    name: 'Siti Wahyuni',
    nik: '1371015678900002',
    phone: '081298765432',
    email: 'siti.w@email.com',
    address: 'Jl. Proklamasi No. 25, Padang',
    unit_code: 'Block A1',
    total_price: 450000000,
    paid_amount: 405000000,
    payment_scheme: 'KPR Bank',
    status: 'Aktif' as const,
    created_at: '2026-02-01',
    updated_at: '2026-02-10',
    payments: [
      { id: 'ph-6', consumer_id: '2', payment_date: '2026-02-01', amount: 5000000, payment_method: 'Cash', notes: 'Booking Fee', created_at: '2026-02-01', updated_at: '2026-02-01' },
      { id: 'ph-7', consumer_id: '2', payment_date: '2026-02-10', amount: 400000000, payment_method: 'Transfer Bank', notes: 'Pencairan KPR', created_at: '2026-02-10', updated_at: '2026-02-10' },
    ],
  },
];

export const mockMonitoring = [
  {
    id: '1',
    no: 1,
    name: 'DESI MILIA',
    phone: '0813 6309 4049',
    payment_scheme: 'KPR BANK',
    unit_code: 'A-11',
    items: [
      { id: 'i1', label: 'Harga Rumah tipe 40/104 Semanggi Residence Blok A-11', amount: 450000000, type: 'base' as const },
      { id: 'i2', label: 'Biaya ADM KPR & Notaris', amount: 10000000, type: 'additional' as const },
      { id: 'i3', label: 'Pembayaran 1 Perumahan Semanggi Residence Blok A-11', amount: 20000000, type: 'payment' as const },
    ],
    status: 'HOLD' as const,
    total_price: 460000000,
    paid_amount: 20000000,
    sisa: 440000000,
  },
  {
    id: '2',
    no: 2,
    name: 'AHMAD SUBARJO',
    phone: '0812 3456 7890',
    payment_scheme: 'CASH KERAS',
    unit_code: 'B-05',
    items: [
      { id: 'i4', label: 'Harga Rumah tipe 36/72 Graha Indah Blok B-05', amount: 350000000, type: 'base' as const },
      { id: 'i5', label: 'Biaya Strategis & Hook', amount: 5000000, type: 'additional' as const },
      { id: 'i6', label: 'Booking Fee & DP Pertama', amount: 100000000, type: 'payment' as const },
      { id: 'i7', label: 'Angsuran Konstruksi 1', amount: 50000000, type: 'payment' as const },
    ],
    status: 'PROCESS' as const,
    total_price: 355000000,
    paid_amount: 150000000,
    sisa: 205000000,
  },
  {
    id: '3',
    no: 3,
    name: 'SITI NURHALIZA',
    phone: '0811 2233 4455',
    payment_scheme: 'KPR BANK',
    unit_code: 'C-02',
    items: [
      { id: 'i8', label: 'Harga Rumah tipe 45/90 Semanggi Residence Blok C-02', amount: 550000000, type: 'base' as const },
      { id: 'i9', label: 'Penambahan Mutu & Luas', amount: 12000000, type: 'additional' as const },
      { id: 'i10', label: 'Booking Fee Unit', amount: 5000000, type: 'payment' as const },
      { id: 'i11', label: 'Pencairan Termin 1 Bank', amount: 55000000, type: 'payment' as const },
    ],
    status: 'VERIFIED' as const,
    total_price: 562000000,
    paid_amount: 60000000,
    sisa: 502000000,
  },
  {
    id: '4',
    no: 4,
    name: 'BUDI SANTOSO',
    phone: '0855 6677 8899',
    payment_scheme: 'CASH BERTAHAP',
    unit_code: 'A-01',
    items: [
      { id: 'i12', label: 'Harga Rumah tipe 60/120 Graha Indah Blok A-01', amount: 750000000, type: 'base' as const },
      { id: 'i13', label: 'Kelebihan Tanah 10m2', amount: 25000000, type: 'additional' as const },
      { id: 'i14', label: 'Pelunasan Unit Lunas', amount: 775000000, type: 'payment' as const },
    ],
    status: 'LUNAS' as const,
    total_price: 775000000,
    paid_amount: 775000000,
    sisa: 0,
  },
];

// ────────────────────────────────────────────────────────────
// 4. MARKETING
// ────────────────────────────────────────────────────────────

export const mockMarketingTeam = [
  {
    id: 'MKT-001',
    name: 'Ahmad Fauzi',
    address: 'Jl. Mawar No. 12, Surabaya',
    gender: 'Laki-laki' as const,
    job: 'Marketing Manager',
    phone: '081234567890',
    status: 'Aktif' as const,
    type: 'Marketing Offline' as const,
    bankName: 'BCA',
    bankAccount: '1234567890',
    accountName: 'Ahmad Fauzi',
    leadsCount: 25,
    closedDeals: 5,
  },
  {
    id: 'MKT-002',
    name: 'Siti Nurhaliza',
    address: 'Jl. Kenanga No. 45, Surabaya',
    gender: 'Perempuan' as const,
    job: 'Sales Executive',
    phone: '085678901234',
    status: 'Aktif' as const,
    type: 'Marketing Offline' as const,
    bankName: 'Mandiri',
    bankAccount: '9876543210',
    accountName: 'Siti Nurhaliza',
    leadsCount: 18,
    closedDeals: 3,
  },
  {
    id: 'MKT-003',
    name: 'Budi Santoso',
    address: 'Jl. Melati No. 78, Sidoarjo',
    gender: 'Laki-laki' as const,
    job: 'Freelance Agent',
    phone: '082345678901',
    status: 'Aktif' as const,
    type: 'Marketing Freelance' as const,
    bankName: 'BRI',
    bankAccount: '5555666677',
    accountName: 'Budi Santoso',
    leadsCount: 12,
    closedDeals: 2,
  },
  {
    id: 'MKT-004',
    name: 'Dewi Anggraini',
    address: 'Jl. Anggrek No. 23, Gresik',
    gender: 'Perempuan' as const,
    job: 'Digital Marketing',
    phone: '087654321098',
    status: 'Tidak Aktif' as const,
    type: 'Marketing Freelance' as const,
    bankName: 'BNI',
    bankAccount: '8888999900',
    accountName: 'Dewi Anggraini',
    leadsCount: 8,
    closedDeals: 1,
  },
];

export const mockLeads = [
  { id: 'LD-001', name: 'Slamet Riyadi', phone: '081234567890', email: 'slamet@email.com', status: 'Hot' as const, interest: 'A-12', source: 'Facebook Ads', date: '2026-02-05', notes: 'Tertarik ambil Cluster A, sudah tanya tenor 15 tahun.', marketingPerson: 'MKT-001' },
  { id: 'LD-002', name: 'Dewi Lestari', phone: '085711223344', email: 'dewi.l@email.com', status: 'Warm' as const, interest: 'B-05', source: 'Walk-in', date: '2026-02-04', notes: 'Baru visit lokasi, masih bandingkan dengan kompetitor.', marketingPerson: 'MKT-002' },
  { id: 'LD-003', name: 'Andi Wijaya', phone: '081399887766', email: 'andi@email.com', status: 'Cold' as const, interest: 'Belum Spesifik', source: 'Referral', date: '2026-02-03', notes: 'Hanya tanya price list lewat WA.', marketingPerson: 'MKT-003' },
  { id: 'LD-004', name: 'Budi Darmawan', phone: '081122334455', email: 'budi@email.com', status: 'Closed' as const, interest: 'A-01', source: 'Instagram', date: '2026-02-02', notes: 'Sudah bayar booking fee, proses berkas KPR.', marketingPerson: 'MKT-001' },
  { id: 'LD-005', name: 'Ani Suryani', phone: '082144556677', email: 'ani.s@email.com', status: 'Warm' as const, interest: 'C-08', source: 'Website', date: '2026-02-01', notes: 'Minta dikirimkan brosur via email.', marketingPerson: 'MKT-002' },
];

export const mockMarketingSourceData = [
  { name: 'FB Ads', value: 45 },
  { name: 'Instagram', value: 30 },
  { name: 'Website', value: 20 },
  { name: 'Walk-in', value: 15 },
  { name: 'Referral', value: 10 },
];

export const mockConversionData = [
  { name: 'Jan', leads: 40, closing: 5 },
  { name: 'Feb', leads: 65, closing: 8 },
  { name: 'Mar', leads: 50, closing: 6 },
  { name: 'Apr', leads: 80, closing: 12 },
  { name: 'May', leads: 55, closing: 7 },
  { name: 'Jun', leads: 70, closing: 10 },
];

// ────────────────────────────────────────────────────────────
// 5. ABSENSI
// ────────────────────────────────────────────────────────────

export const mockWorkLocations = [
  { id: 1, name: 'Kantor Pusat Maisa', address: 'Jl. Raya Properti No. 123, Jakarta Selatan', radius: 50, lat: -6.2088, lng: 106.8456 },
  { id: 2, name: 'Site Proyek Cluster Alamanda', address: 'Kec. Nanggalo, Kota Padang', radius: 100, lat: -0.9067, lng: 100.3684 },
  { id: 3, name: 'Site Proyek Cluster Bougenville', address: 'Kec. Koto Tangah, Kota Padang', radius: 100, lat: -0.8441, lng: 100.3700 },
  { id: 4, name: 'Site Proyek Cluster Cendana', address: 'Kec. Lubuk Kilangan, Kota Padang', radius: 100, lat: -0.9416, lng: 100.4172 },
];

export const mockUserLocationMapping = [
  { userName: 'Ahmad Faisal', locationId: 1 },
  { userName: 'Sari Wijaya', locationId: 1 },
  { userName: 'Bambang Hero', locationId: 2 },
  { userName: 'Maya Sari', locationId: 3 },
  { userName: 'Agus Santoso', locationId: 2 },
  { userName: 'Indra Kusuma', locationId: 4 },
  { userName: 'Rizky Pratama', locationId: 1 },
  { userName: 'Lia Ananda', locationId: 1 },
  { userName: 'Dian Permata', locationId: 1 },
  { userName: 'Hendra Wijaya', locationId: 1 },
];

export const mockAttendanceData = [
  { id: 1, name: 'Ahmad Faisal', role: 'Super Admin', time: '07:55', location: 'Kantor Pusat Maisa', status: 'Hadir', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
  { id: 2, name: 'Sari Wijaya', role: 'Finance', time: '08:05', location: 'Kantor Pusat Maisa', status: 'Terlambat', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { id: 3, name: 'Bambang Hero', role: 'Project Manager', time: '07:45', location: 'Site Proyek Cluster Alamanda', status: 'Hadir', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
  { id: 4, name: 'Indra Kusuma', role: 'Project', time: '-', location: '-', status: 'Izin', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { id: 5, name: 'Dian Permata', role: 'Finance', time: '08:00', location: 'Kantor Pusat Maisa', status: 'Hadir', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  { id: 6, name: 'Rizky Pratama', role: 'Marketing', time: '08:15', location: 'Kantor Pusat Maisa', status: 'Terlambat', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop' },
  { id: 7, name: 'Maya Sari', role: 'Project', time: '07:30', location: 'Site Proyek Cluster Bougenville', status: 'Hadir', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
  { id: 8, name: 'Hendra Wijaya', role: 'Finance', time: '-', location: '-', status: 'Sakit', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
  { id: 9, name: 'Lia Ananda', role: 'Marketing', time: '07:58', location: 'Kantor Pusat Maisa', status: 'Hadir', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
  { id: 10, name: 'Agus Santoso', role: 'Project', time: '08:10', location: 'Site Proyek Cluster Alamanda', status: 'Terlambat', image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop' },
];

export const mockRecapData = [
  { name: 'Ahmad Faisal', days: 22, present: 22, late: 0, permit: 0, alpha: 0, score: 100 },
  { name: 'Sari Wijaya', days: 22, present: 18, late: 3, permit: 1, alpha: 0, score: 85 },
  { name: 'Bambang Hero', days: 22, present: 21, late: 1, permit: 0, alpha: 0, score: 98 },
  { name: 'Indra Kusuma', days: 22, present: 15, late: 0, permit: 5, alpha: 2, score: 68 },
  { name: 'Dian Permata', days: 22, present: 22, late: 0, permit: 0, alpha: 0, score: 100 },
  { name: 'Rizky Pratama', days: 22, present: 19, late: 2, permit: 1, alpha: 0, score: 90 },
  { name: 'Maya Sari', days: 22, present: 22, late: 0, permit: 0, alpha: 0, score: 100 },
  { name: 'Hendra Wijaya', days: 22, present: 20, late: 0, permit: 2, alpha: 0, score: 91 },
  { name: 'Lia Ananda', days: 22, present: 21, late: 1, permit: 0, alpha: 0, score: 96 },
  { name: 'Agus Santoso', days: 22, present: 17, late: 4, permit: 1, alpha: 0, score: 82 },
];

export const mockLeaveRequests = [
  { id: 1, name: 'Rizky Pratama', role: 'Marketing', type: 'Sakit', duration: '2 Hari', date: '10-12 Feb 2026', note: 'Demam tinggi, perlu istirahat', status: 'Pending', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop' },
  { id: 2, name: 'Indra Kusuma', role: 'Project', type: 'Cuti', duration: '3 Hari', date: '13-15 Feb 2026', note: 'Liburan keluarga ke Bali', status: 'Pending', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { id: 3, name: 'Dian Permata', role: 'Finance', type: 'Izin Khusus', duration: '1 Hari', date: '05 Feb 2026', note: 'Pernikahan saudara', status: 'Approved', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
];

// ────────────────────────────────────────────────────────────
// 6. SOP LOGISTIK — dipindah ke lib/mockSOP.ts
// ────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
// 7. TRANSAKSI (PPJB, AKAD, BAST, PINDAH UNIT, PEMBATALAN)
// ────────────────────────────────────────────────────────────

export const mockPPJB = [
  {
    id: '1', no: 'PPJB/ONV-MAI/01/2026', date: '2024-01-15',
    customerName: 'Ahmad Rizki Pratama', noKTP: '3275081234567890',
    jenisKelamin: 'Laki-laki', tempatLahir: 'Jakarta', tanggalLahir: '1990-05-15',
    domisili: 'Jakarta Selatan', alamatKTP: 'Jl. Sudirman No. 123, Jakarta Selatan',
    pekerjaan: 'Wiraswasta', wargaNegara: 'Indonesia', noTelp: '081234567890',
    email: 'ahmad.rizki@email.com', lokasiRumah: 'Unit A-01', klusterBlok: 'Blok Melati',
    tipeRumah: 'Type 45', luasTanah: '90', luasBangunan: '45', dayaListrik: '2200',
    hargaJual: '650000000', nominalLPJ: '15000000', downPayment: '100000000',
    sisaPembayaran: '550000000', nomorSertifikat: 'SHM-001/2024',
    ppjbFile: 'PPJB_A01_Ahmad_Rizki.pdf', tatibFile: 'Tatib_A01.pdf',
  },
  {
    id: '2', no: 'PPJB/ONV-MAI/02/2026', date: '2024-01-20',
    customerName: 'Siti Nurhaliza', noKTP: '3273051987654321',
    jenisKelamin: 'Perempuan', tempatLahir: 'Bandung', tanggalLahir: '1988-08-20',
    domisili: 'Bandung', alamatKTP: 'Jl. Dago No. 456, Bandung',
    pekerjaan: 'Pegawai Swasta', wargaNegara: 'Indonesia', noTelp: '081298765432',
    email: 'siti.nurhaliza@email.com', lokasiRumah: 'Unit B-12', klusterBlok: 'Blok Kenanga',
    tipeRumah: 'Type 60', luasTanah: '120', luasBangunan: '60', dayaListrik: '3500',
    hargaJual: '850000000', nominalLPJ: '20000000', downPayment: '150000000',
    sisaPembayaran: '700000000', nomorSertifikat: 'SHM-002/2024',
    ppjbFile: 'PPJB_B12_Siti_Nurhaliza.pdf', tatibFile: 'Tatib_B12.pdf',
  },
];

export const mockAkad = [
  {
    id: '1', no: 'AKD/001/2026', date: '2024-02-15', hari: 'Senin',
    customerName: 'Ahmad Rizki Pratama', noKTP: '3275081234567890',
    alamatKTP: 'Jl. Sudirman No. 123, Jakarta Selatan', klusterBlok: 'Blok Melati',
    tipeRumah: 'Type 45', luasTanah: '90', luasBangunan: '45',
    notaris: 'Notaris Hadi Wijaya, S.H., M.Kn', catatan: 'Akad berjalan lancar, semua dokumen lengkap',
  },
  {
    id: '2', no: 'AKD/002/2026', date: '2024-02-18', hari: 'Kamis',
    customerName: 'Siti Nurhaliza', noKTP: '3273051987654321',
    alamatKTP: 'Jl. Dago No. 456, Bandung', klusterBlok: 'Blok Kenanga',
    tipeRumah: 'Type 60', luasTanah: '120', luasBangunan: '60',
    notaris: 'Notaris Rina Kusuma, S.H.', catatan: 'Proses akad selesai tepat waktu',
  },
];

export const mockBAST = [
  {
    id: '1', no: '001/BAST/OFM-M/2026', date: '2024-03-01', hari: 'Jumat',
    customerName: 'Ahmad Rizki Pratama', noKTP: '3275081234567890',
    jenisKelamin: 'Laki-laki', tempatLahir: 'Jakarta', tanggalLahir: '1990-05-15',
    domisili: 'Jakarta Selatan', alamatKTP: 'Jl. Sudirman No. 123, Jakarta Selatan',
    pekerjaan: 'Wiraswasta', noTelp: '081234567890', email: 'ahmad.rizki@email.com',
    noNPWP: '12.345.678.9-012.000', lokasiRumah: 'Unit A-01', klusterBlok: 'Blok Melati',
    tipeRumah: 'Type 45', luasTanah: '90', luasBangunan: '45', dayaListrik: '2200',
    nomorSertifikat: 'SHM-001/2024', idSikumbang: 'SKB-2024-001', bastFile: 'BAST_A01_Ahmad.pdf',
  },
  {
    id: '2', no: '002/BAST/OFM-M/2026', date: '2024-03-05', hari: 'Selasa',
    customerName: 'Siti Nurhaliza', noKTP: '3273051987654321',
    jenisKelamin: 'Perempuan', tempatLahir: 'Bandung', tanggalLahir: '1988-08-20',
    domisili: 'Bandung', alamatKTP: 'Jl. Dago No. 456, Bandung',
    pekerjaan: 'Pegawai Swasta', noTelp: '081298765432', email: 'siti.nurhaliza@email.com',
    noNPWP: '98.765.432.1-098.000', lokasiRumah: 'Unit B-12', klusterBlok: 'Blok Kenanga',
    tipeRumah: 'Type 60', luasTanah: '120', luasBangunan: '60', dayaListrik: '3500',
    nomorSertifikat: 'SHM-002/2024', idSikumbang: 'SKB-2024-002', bastFile: 'BAST_B12_Siti.pdf',
  },
];

export const mockPindahUnit = [
  {
    id: '1', no: 'PU-001/2026', date: '2024-01-25',
    customerName: 'Ahmad Rizki Pratama', nik: '3275081234567890',
    alamat: 'Jl. Sudirman No. 123, Jakarta Selatan',
    lokasiKavLama: 'Unit A-01, Blok Melati', nominalUTJ: '50000000',
    lokasiKavBaru: 'Unit B-08, Blok Kenanga',
    keterangan: 'Permintaan customer untuk unit yang lebih besar',
  },
  {
    id: '2', no: 'PU-002/2026', date: '2024-02-12',
    customerName: 'Siti Nurhaliza', nik: '3273051987654321',
    alamat: 'Jl. Dago No. 456, Bandung',
    lokasiKavLama: 'Unit B-12, Blok Kenanga', nominalUTJ: '30000000',
    lokasiKavBaru: 'Unit C-15, Blok Anggrek',
    keterangan: 'Pindah ke unit dengan view lebih bagus',
  },
];

export const mockPembatalan = [
  {
    id: '1', no: 'BTL-001/2026', date: '2024-01-18',
    customerName: 'Ahmad Rizki Pratama', nik: '3275081234567890',
    alamat: 'Jl. Sudirman No. 123, Jakarta Selatan',
    lokasiKavLama: 'Unit A-01, Blok Melati', nominalUTJ: '50000000',
    keterangan: 'Kendala finansial, tidak dapat melanjutkan pembayaran',
    namaBank: 'BCA', noRekening: '1234567890', atasNama: 'Ahmad Rizki Pratama',
  },
  {
    id: '2', no: 'BTL-002/2026', date: '2024-02-05',
    customerName: 'Siti Nurhaliza', nik: '3273051987654321',
    alamat: 'Jl. Dago No. 456, Bandung',
    lokasiKavLama: 'Unit B-12, Blok Kenanga', nominalUTJ: '30000000',
    keterangan: 'Pindah tugas ke luar kota',
    namaBank: 'Mandiri', noRekening: '9876543210', atasNama: 'Siti Nurhaliza',
  },
];

// ────────────────────────────────────────────────────────────
// 8. QUALITY CONTROL (QC)
// ────────────────────────────────────────────────────────────

export const mockQCTemplates = [
  {
    id: 'tpl-tipe36',
    name: 'Template QC Tipe 36',
    description: 'Checklist quality control untuk rumah tipe 36',
    is_active: true,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    sections: [
      {
        id: 'sec-prep-36',
        template_id: 'tpl-tipe36',
        name: 'A. PEKERJAAN PERSIAPAN',
        order_index: 0,
        items: [
          { id: 'A1', section_id: 'sec-prep-36', description: 'Pembersihan Lapangan', order_index: 0 },
          { id: 'A2', section_id: 'sec-prep-36', description: 'Pengukuran / Bowplank', order_index: 1 },
        ],
      },
      {
        id: 'sec-struct-36',
        template_id: 'tpl-tipe36',
        name: 'B. PEKERJAAN STRUKTUR',
        order_index: 1,
        items: [
          { id: 'B1', section_id: 'sec-struct-36', description: 'Pondasi (Telapak & Batu Kali)', order_index: 0 },
          { id: 'B2', section_id: 'sec-struct-36', description: 'Sloof Beton Bertulang', order_index: 1 },
          { id: 'B3', section_id: 'sec-struct-36', description: 'Struktur Kolom Lantai 1', order_index: 2 },
          { id: 'B4', section_id: 'sec-struct-36', description: 'Struktur Balok & Plat Lantai 2', order_index: 3 },
          { id: 'B5', section_id: 'sec-struct-36', description: 'Struktur Rangka Atap', order_index: 4 },
        ],
      },
      {
        id: 'sec-arch-36',
        template_id: 'tpl-tipe36',
        name: 'C. PEKERJAAN ARSITEKTUR',
        order_index: 2,
        items: [
          { id: 'C1', section_id: 'sec-arch-36', description: 'Pasangan Dinding Bata', order_index: 0 },
          { id: 'C2', section_id: 'sec-arch-36', description: 'Kusen, Pintu & Jendela', order_index: 1 },
          { id: 'C3', section_id: 'sec-arch-36', description: 'Plafond & Rangka', order_index: 2 },
          { id: 'C4', section_id: 'sec-arch-36', description: 'Penutup Atap Genteng', order_index: 3 },
          { id: 'C5', section_id: 'sec-arch-36', description: 'Lantai Keramik', order_index: 4 },
          { id: 'C6', section_id: 'sec-arch-36', description: 'Plesteran & Acian', order_index: 5 },
          { id: 'C7', section_id: 'sec-arch-36', description: 'Pengecatan', order_index: 6 },
          { id: 'C8', section_id: 'sec-arch-36', description: 'Sanitary Fixtures', order_index: 7 },
        ],
      },
      {
        id: 'sec-septic-36',
        template_id: 'tpl-tipe36',
        name: 'D. PEKERJAAN SEPTIC TANK',
        order_index: 3,
        items: [
          { id: 'D1', section_id: 'sec-septic-36', description: 'Galian & Pasangan Dinding Septic Tank', order_index: 0 },
          { id: 'D2', section_id: 'sec-septic-36', description: 'Pipa Saluran & Ventilasi', order_index: 1 },
          { id: 'D3', section_id: 'sec-septic-36', description: 'Penutup & Finishing', order_index: 2 },
        ],
      },
      {
        id: 'sec-mep-36',
        template_id: 'tpl-tipe36',
        name: 'E. PEKERJAAN ELEKTRIKAL & MEKANIKAL',
        order_index: 4,
        items: [
          { id: 'E1', section_id: 'sec-mep-36', description: 'Instalasi Titik Lampu & Saklar', order_index: 0 },
          { id: 'E2', section_id: 'sec-mep-36', description: 'Instalasi Stop Kontak', order_index: 1 },
          { id: 'E3', section_id: 'sec-mep-36', description: 'Instalasi Pipa Air Bersih', order_index: 2 },
          { id: 'E4', section_id: 'sec-mep-36', description: 'Instalasi Pipa Air Kotor', order_index: 3 },
          { id: 'E5', section_id: 'sec-mep-36', description: 'Panel Listrik & MCB', order_index: 4 },
        ],
      },
      {
        id: 'sec-finish-36',
        template_id: 'tpl-tipe36',
        name: 'F. PEKERJAAN FINISHING',
        order_index: 5,
        items: [
          { id: 'F1', section_id: 'sec-finish-36', description: 'Cleaning & Pembersihan Akhir', order_index: 0 },
          { id: 'F2', section_id: 'sec-finish-36', description: 'Kitchen Set', order_index: 1 },
          { id: 'F3', section_id: 'sec-finish-36', description: 'Closet & Wastafel', order_index: 2 },
          { id: 'F4', section_id: 'sec-finish-36', description: 'Testing Instalasi', order_index: 3 },
        ],
      },
    ],
  },
  {
    id: 'tpl-tipe45',
    name: 'Template QC Tipe 45',
    description: 'Checklist quality control untuk rumah tipe 45',
    is_active: true,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    sections: [
      {
        id: 'sec-prep-45',
        template_id: 'tpl-tipe45',
        name: 'A. PEKERJAAN PERSIAPAN',
        order_index: 0,
        items: [
          { id: 'A1', section_id: 'sec-prep-45', description: 'Pembersihan Lapangan', order_index: 0 },
          { id: 'A2', section_id: 'sec-prep-45', description: 'Pengukuran / Bowplank', order_index: 1 },
          { id: 'A3', section_id: 'sec-prep-45', description: 'Patok & Marking Area', order_index: 2 },
        ],
      },
      {
        id: 'sec-struct-45',
        template_id: 'tpl-tipe45',
        name: 'B. PEKERJAAN STRUKTUR',
        order_index: 1,
        items: [
          { id: 'B1', section_id: 'sec-struct-45', description: 'Pondasi (Telapak & Batu Kali)', order_index: 0 },
          { id: 'B2', section_id: 'sec-struct-45', description: 'Sloof Beton Bertulang', order_index: 1 },
          { id: 'B3', section_id: 'sec-struct-45', description: 'Struktur Kolom Lantai 1', order_index: 2 },
          { id: 'B4', section_id: 'sec-struct-45', description: 'Struktur Balok & Plat Lantai 2', order_index: 3 },
          { id: 'B5', section_id: 'sec-struct-45', description: 'Struktur Kolom Lantai 2', order_index: 4 },
          { id: 'B6', section_id: 'sec-struct-45', description: 'Struktur Rangka Atap', order_index: 5 },
          { id: 'B7', section_id: 'sec-struct-45', description: 'Struktur Canopy Carport', order_index: 6 },
        ],
      },
      {
        id: 'sec-arch-45',
        template_id: 'tpl-tipe45',
        name: 'C. PEKERJAAN ARSITEKTUR',
        order_index: 2,
        items: [
          { id: 'C1', section_id: 'sec-arch-45', description: 'Pasangan Dinding Bata Lantai 1', order_index: 0 },
          { id: 'C2', section_id: 'sec-arch-45', description: 'Pasangan Dinding Bata Lantai 2', order_index: 1 },
          { id: 'C3', section_id: 'sec-arch-45', description: 'Kusen Aluminium & UPVC', order_index: 2 },
          { id: 'C4', section_id: 'sec-arch-45', description: 'Pintu & Jendela', order_index: 3 },
          { id: 'C5', section_id: 'sec-arch-45', description: 'Plafond Gypsum', order_index: 4 },
          { id: 'C6', section_id: 'sec-arch-45', description: 'Penutup Atap Genteng', order_index: 5 },
          { id: 'C7', section_id: 'sec-arch-45', description: 'Lantai Keramik 40x40', order_index: 6 },
          { id: 'C8', section_id: 'sec-arch-45', description: 'Plesteran & Acian', order_index: 7 },
          { id: 'C9', section_id: 'sec-arch-45', description: 'Pengecatan Interior', order_index: 8 },
          { id: 'C10', section_id: 'sec-arch-45', description: 'Pengecatan Eksterior', order_index: 9 },
          { id: 'C11', section_id: 'sec-arch-45', description: 'Sanitary Fixtures Premium', order_index: 10 },
        ],
      },
      {
        id: 'sec-septic-45',
        template_id: 'tpl-tipe45',
        name: 'D. PEKERJAAN SEPTIC TANK',
        order_index: 3,
        items: [
          { id: 'D1', section_id: 'sec-septic-45', description: 'Galian Septic Tank Bio', order_index: 0 },
          { id: 'D2', section_id: 'sec-septic-45', description: 'Pasangan Dinding & Plesteran', order_index: 1 },
          { id: 'D3', section_id: 'sec-septic-45', description: 'Pipa Saluran & Ventilasi', order_index: 2 },
          { id: 'D4', section_id: 'sec-septic-45', description: 'Penutup & Manhole', order_index: 3 },
        ],
      },
      {
        id: 'sec-mep-45',
        template_id: 'tpl-tipe45',
        name: 'E. PEKERJAAN ELEKTRIKAL & MEKANIKAL',
        order_index: 4,
        items: [
          { id: 'E1', section_id: 'sec-mep-45', description: 'Instalasi Titik Lampu Downlight', order_index: 0 },
          { id: 'E2', section_id: 'sec-mep-45', description: 'Instalasi Saklar & Dimmer', order_index: 1 },
          { id: 'E3', section_id: 'sec-mep-45', description: 'Instalasi Stop Kontak', order_index: 2 },
          { id: 'E4', section_id: 'sec-mep-45', description: 'Instalasi Pipa Air Bersih', order_index: 3 },
          { id: 'E5', section_id: 'sec-mep-45', description: 'Instalasi Pipa Air Kotor', order_index: 4 },
          { id: 'E6', section_id: 'sec-mep-45', description: 'Panel Listrik 2200 VA', order_index: 5 },
          { id: 'E7', section_id: 'sec-mep-45', description: 'Water Heater Point', order_index: 6 },
          { id: 'E8', section_id: 'sec-mep-45', description: 'AC Point (3 titik)', order_index: 7 },
        ],
      },
      {
        id: 'sec-finish-45',
        template_id: 'tpl-tipe45',
        name: 'F. PEKERJAAN FINISHING',
        order_index: 5,
        items: [
          { id: 'F1', section_id: 'sec-finish-45', description: 'Cleaning & Pembersihan Akhir', order_index: 0 },
          { id: 'F2', section_id: 'sec-finish-45', description: 'Kitchen Set Premium', order_index: 1 },
          { id: 'F3', section_id: 'sec-finish-45', description: 'Lemari Pakaian Built-in', order_index: 2 },
          { id: 'F4', section_id: 'sec-finish-45', description: 'Closet, Wastafel & Shower', order_index: 3 },
          { id: 'F5', section_id: 'sec-finish-45', description: 'Testing Instalasi Listrik', order_index: 4 },
          { id: 'F6', section_id: 'sec-finish-45', description: 'Testing Instalasi Air', order_index: 5 },
        ],
      },
    ],
  },
];

export const mockQCSubmissions = [
  {
    id: 'QC-2026-001',
    project_id: 'proj-emerald',
    unit_id: 'unit-a-01',
    template_id: 'tpl-tipe36',
    submission_date: '2026-02-05',
    status: 'Submitted',
    notes: 'Check list final sebelum serah terima.',
    project: { id: 'proj-emerald', name: 'Emerald Heights' },
    unit: { id: 'unit-a-01', no: 'A-01', tipe: '36/72', project_id: 'proj-emerald' },
    template: mockQCTemplates[0],
    results: [
      { id: 'res-1', submission_id: 'QC-2026-001', item_id: 'A1', result: 'OK', notes: null, photo_url: null },
      { id: 'res-2', submission_id: 'QC-2026-001', item_id: 'A2', result: 'OK', notes: null, photo_url: null },
      { id: 'res-3', submission_id: 'QC-2026-001', item_id: 'B1', result: 'OK', notes: null, photo_url: null },
    ],
  },
  {
    id: 'QC-2026-002',
    project_id: 'proj-emerald',
    unit_id: 'unit-b-12',
    template_id: 'tpl-tipe45',
    submission_date: '2026-02-04',
    status: 'Draft',
    notes: 'Masih ada revisi dinding kamar 2.',
    project: { id: 'proj-emerald', name: 'Emerald Heights' },
    unit: { id: 'unit-b-12', no: 'B-12', tipe: '45/90', project_id: 'proj-emerald' },
    template: mockQCTemplates[1],
    results: [
      { id: 'res-4', submission_id: 'QC-2026-002', item_id: 'A1', result: 'OK', notes: null, photo_url: null },
      { id: 'res-5', submission_id: 'QC-2026-002', item_id: 'B2', result: 'Not OK', notes: 'Retak rambut, perlu perbaikan', photo_url: null },
    ],
  },
];

// ────────────────────────────────────────────────────────────
// DEFAULT EXPORT — semua data dummy dalam satu objek
// ────────────────────────────────────────────────────────────

export const MOCK = {
  // User Management
  users: mockUsers,
  activityLogs: mockActivityLogs,

  // Dashboard
  cashflowData: mockCashflowData,
  budgetVsActualData: mockBudgetVsActualData,
  constructionProgress: mockConstructionProgress,
  salesStatus: mockSalesStatus,
  dashboardKpi: mockDashboardKpi,
  recentActivities: mockRecentActivities,

  // Finance
  transactions: mockTransactions,
  danaMasuk: mockDanaMasuk,
  danaKeluar: mockDanaKeluar,
  piutang: mockPiutang,
  monitoring: mockMonitoring,

  // Marketing
  marketingTeam: mockMarketingTeam,
  leads: mockLeads,
  marketingSourceData: mockMarketingSourceData,
  conversionData: mockConversionData,

  // Absensi
  workLocations: mockWorkLocations,
  userLocationMapping: mockUserLocationMapping,
  attendanceData: mockAttendanceData,
  recapData: mockRecapData,
  leaveRequests: mockLeaveRequests,

  // Project & Construction
  constructionProjects: mockConstructionProjects,
  qcTemplates: mockQCTemplates,
  qcSubmissions: mockQCSubmissions,

  // Transaksi / Legal
  ppjb: mockPPJB,
  akad: mockAkad,
  bast: mockBAST,
  pindahUnit: mockPindahUnit,
  pembatalan: mockPembatalan,
};
