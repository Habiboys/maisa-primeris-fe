/**
 * lib/mockMarketing.ts
 * ─────────────────────────────────────────────────────────
 * Data dummy untuk modul Marketing & Housing.
 * Tipe-tipe selaras dengan backend model.
 *
 * CARA PAKAI:
 *   import { mockLeadsData, mockMarketingPersons, ... } from '../lib/mockMarketing';
 * ─────────────────────────────────────────────────────────
 */

import type {
    HousingUnit,
    Lead,
    LeadStats,
    MarketingPerson,
    UnitStatus
} from '../types';

// ── Marketing Persons ────────────────────────────────────────

export const mockMarketingPersons: MarketingPerson[] = [
  {
    id: 'mock-mp-1',
    user_id: undefined,
    name: 'Ahmad Fauzi',
    phone: '081234567890',
    email: 'ahmad.fauzi@maisaprimeris.com',
    target: 20,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'mock-mp-2',
    user_id: undefined,
    name: 'Siti Nurhaliza',
    phone: '085678901234',
    email: 'siti.nur@maisaprimeris.com',
    target: 15,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'mock-mp-3',
    user_id: undefined,
    name: 'Budi Santoso',
    phone: '082345678901',
    email: 'budi.s@maisaprimeris.com',
    target: 10,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'mock-mp-4',
    user_id: undefined,
    name: 'Dewi Anggraini',
    phone: '087654321098',
    email: 'dewi.a@maisaprimeris.com',
    target: 10,
    is_active: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-02-01T00:00:00.000Z',
  },
];

// ── Leads ────────────────────────────────────────────────────

export const mockLeadsData: Lead[] = [
  {
    id: 'mock-ld-1',
    name: 'Slamet Riyadi',
    phone: '081234567890',
    email: 'slamet@email.com',
    status: 'Negoisasi',
    interest: 'A-12',
    source: 'Facebook Ads',
    marketing_id: 'mock-mp-1',
    notes: 'Tertarik ambil Cluster A, sudah tanya tenor 15 tahun.',
    follow_up_date: '2026-02-10',
    created_at: '2026-02-05T08:00:00.000Z',
    updated_at: '2026-02-05T08:00:00.000Z',
    marketingPerson: mockMarketingPersons[0],
  },
  {
    id: 'mock-ld-2',
    name: 'Dewi Lestari',
    phone: '085711223344',
    email: 'dewi.l@email.com',
    status: 'Survey',
    interest: 'B-05',
    source: 'Walk-in',
    marketing_id: 'mock-mp-2',
    notes: 'Baru visit lokasi, masih bandingkan dengan kompetitor.',
    follow_up_date: '2026-02-08',
    created_at: '2026-02-04T10:00:00.000Z',
    updated_at: '2026-02-04T10:00:00.000Z',
    marketingPerson: mockMarketingPersons[1],
  },
  {
    id: 'mock-ld-3',
    name: 'Andi Wijaya',
    phone: '081399887766',
    email: 'andi@email.com',
    status: 'Baru',
    interest: 'Belum Spesifik',
    source: 'Referral',
    marketing_id: 'mock-mp-3',
    notes: 'Hanya tanya price list lewat WA.',
    created_at: '2026-02-03T09:00:00.000Z',
    updated_at: '2026-02-03T09:00:00.000Z',
    marketingPerson: mockMarketingPersons[2],
  },
  {
    id: 'mock-ld-4',
    name: 'Budi Darmawan',
    phone: '081122334455',
    email: 'budi@email.com',
    status: 'Deal',
    interest: 'A-01',
    source: 'Instagram',
    marketing_id: 'mock-mp-1',
    notes: 'Sudah bayar booking fee, proses berkas KPR.',
    created_at: '2026-02-02T11:00:00.000Z',
    updated_at: '2026-02-02T11:00:00.000Z',
    marketingPerson: mockMarketingPersons[0],
  },
  {
    id: 'mock-ld-5',
    name: 'Ani Suryani',
    phone: '082144556677',
    email: 'ani.s@email.com',
    status: 'Follow-up',
    interest: 'C-08',
    source: 'Website',
    marketing_id: 'mock-mp-2',
    notes: 'Minta dikirimkan brosur via email.',
    follow_up_date: '2026-02-12',
    created_at: '2026-02-01T14:00:00.000Z',
    updated_at: '2026-02-01T14:00:00.000Z',
    marketingPerson: mockMarketingPersons[1],
  },
  {
    id: 'mock-ld-6',
    name: 'Hendra Saputra',
    phone: '082299887766',
    email: 'hendra@email.com',
    status: 'Batal',
    interest: 'B-03',
    source: 'Facebook Ads',
    marketing_id: 'mock-mp-3',
    notes: 'Tidak jadi karena budget tidak cukup.',
    created_at: '2026-01-28T09:00:00.000Z',
    updated_at: '2026-01-30T10:00:00.000Z',
    marketingPerson: mockMarketingPersons[2],
  },
];

export const mockLeadStats: LeadStats = {
  total: mockLeadsData.length,
  hot: mockLeadsData.filter(l => l.status === 'Negoisasi').length,
  closing_rate: Math.round((mockLeadsData.filter(l => l.status === 'Deal').length / mockLeadsData.length) * 100),
  batal: mockLeadsData.filter(l => l.status === 'Batal').length,
};

// ── Unit Statuses (Siteplan) ─────────────────────────────────

export const mockUnitStatuses: UnitStatus[] = Array.from({ length: 40 }).map((_, i) => {
  const block = i < 20 ? 'A' : 'B';
  const num = String((i % 20) + 1).padStart(2, '0');
  const code = `${block}-${num}`;

  let status: UnitStatus['status'] = 'Tersedia';
  if (i === 0 || i === 12 || i === 24) status = 'Sold';
  else if (i === 5 || i === 18 || i === 30) status = 'Booking';
  else if (i === 3) status = 'Indent';

  return {
    id: `mock-us-${i + 1}`,
    unit_code: code,
    project_id: undefined,
    status,
    consumer_id: status !== 'Tersedia' ? `mock-consumer-${i}` : undefined,
    price: 750000000,
    notes: undefined,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-02-01T00:00:00.000Z',
  } as UnitStatus;
});

// ── Analytics Chart Data ─────────────────────────────────────

export const mockConversionChartData = [
  { name: 'Jan', leads: 40, closing: 5 },
  { name: 'Feb', leads: 65, closing: 8 },
  { name: 'Mar', leads: 50, closing: 6 },
  { name: 'Apr', leads: 80, closing: 12 },
  { name: 'May', leads: 55, closing: 7 },
  { name: 'Jun', leads: 70, closing: 10 },
];

export const mockSourceChartData = [
  { name: 'FB Ads', value: 45 },
  { name: 'Instagram', value: 30 },
  { name: 'Website', value: 20 },
  { name: 'Walk-in', value: 15 },
  { name: 'Referral', value: 10 },
];

// ── Housing Units ────────────────────────────────────────────

export const mockHousingUnits: HousingUnit[] = [
  {
    id: 'mock-hu-1',
    unit_code: 'A-01',
    unit_type: 'Emerald (36/60)',
    luas_tanah: 60,
    luas_bangunan: 36,
    harga_jual: 450000000,
    status: 'Sold',
    notes: 'Unit sudah terjual, pembayaran lunas.',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-02-01T00:00:00.000Z',
    consumer: { id: 'mock-c-1', name: 'Budi Darmawan', phone: '081122334455' },
    payments: [
      { id: 'mock-hp-1', housing_unit_id: 'mock-hu-1', payment_date: '2026-02-01', amount: 5000000, type: 'Booking Fee', description: 'Pembayaran booking fee' },
      { id: 'mock-hp-2', housing_unit_id: 'mock-hu-1', payment_date: '2026-01-15', amount: 45000000, type: 'DP 1', description: 'Down payment pertama' },
    ],
  },
  {
    id: 'mock-hu-2',
    unit_code: 'A-02',
    unit_type: 'Emerald (36/60)',
    luas_tanah: 60,
    luas_bangunan: 36,
    harga_jual: 450000000,
    status: 'Proses',
    notes: 'Unit dalam proses booking.',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-02-04T00:00:00.000Z',
    consumer: { id: 'mock-c-2', name: 'Slamet Riyadi', phone: '081234567890' },
    payments: [
      { id: 'mock-hp-3', housing_unit_id: 'mock-hu-2', payment_date: '2026-02-04', amount: 5000000, type: 'Booking Fee', description: 'Pembayaran booking fee' },
    ],
  },
  {
    id: 'mock-hu-3',
    unit_code: 'A-03',
    unit_type: 'Ruby (45/72)',
    luas_tanah: 72,
    luas_bangunan: 45,
    harga_jual: 580000000,
    status: 'Tersedia',
    notes: 'Unit ready stock, siap huni.',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    payments: [],
  },
  {
    id: 'mock-hu-4',
    unit_code: 'B-01',
    unit_type: 'Diamond (60/90)',
    luas_tanah: 90,
    luas_bangunan: 60,
    harga_jual: 850000000,
    status: 'Tersedia',
    notes: 'Unit premium di blok B.',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    payments: [],
  },
  {
    id: 'mock-hu-5',
    unit_code: 'B-02',
    unit_type: 'Diamond (60/90)',
    luas_tanah: 90,
    luas_bangunan: 60,
    harga_jual: 850000000,
    status: 'Sold',
    notes: 'Pembayaran cash keras, unit sudah diserahterimakan.',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z',
    consumer: { id: 'mock-c-3', name: 'Agung Pratama', phone: '081567890123' },
    payments: [
      { id: 'mock-hp-4', housing_unit_id: 'mock-hu-5', payment_date: '2026-01-10', amount: 850000000, type: 'Cash Keras', description: 'Pelunasan cash keras' },
    ],
  },
];
