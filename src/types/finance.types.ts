/**
 * types/finance.types.ts
 * Tipe untuk Modul Finance & Accounting
 *
 * Diselaraskan dengan backend models:
 *   - Transaction    → backend/src/models/transaction.model.js
 *   - Consumer       → backend/src/models/consumer.model.js
 *   - PaymentHistory → backend/src/models/paymentHistory.model.js
 */

// ── Enum Types ─────────────────────────────────────────────

export type TransactionType = 'Pemasukan' | 'Pengeluaran';
export type ConsumerStatus  = 'Aktif' | 'Lunas' | 'Dibatalkan';

// ── Transaction ────────────────────────────────────────────

export interface Transaction {
  id: string;
  transaction_date: string;            // DATEONLY → 'YYYY-MM-DD'
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  payment_method?: string;
  reference_no?: string;
  attachment?: string;
  project_id?: string;
  housing_unit_id?: string;
  created_by?: string;
  creator?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface TransactionSummary {
  kas_masuk: number;
  kas_keluar: number;
  saldo: number;
}

// ── Consumer ───────────────────────────────────────────────

export interface Consumer {
  id: string;
  name: string;
  nik?: string;
  phone?: string;
  email?: string;
  address?: string;
  unit_code?: string;
  project_id?: string;
  /** Lead Deal sumber data (bila dibuat lewat marketing) */
  lead_id?: string | null;
  total_price: number;
  paid_amount: number;
  payment_scheme?: string;
  status: ConsumerStatus;
  created_at: string;
  updated_at: string;
  // relasi (hanya saat getConsumerById)
  payments?: PaymentHistory[];
}

// ── Payment History ────────────────────────────────────────

export interface PaymentHistory {
  id: string;
  consumer_id: string;
  payment_date: string;               // DATEONLY → 'YYYY-MM-DD'
  amount: number;                      // net: debit - credit
  debit?: number;                      // pembayaran (masuk)
  credit?: number;                    // pengembalian (keluar)
  payment_method?: string;
  notes?: string;
  receipt_file?: string;
  estimasi_date?: string;             // DATEONLY, optional
  status?: string;                   // e.g. LUNAS
  transaction_name?: string;          // nama transaksi (e.g. DP 1 / Angsuran)
  transaction_category?: string;     // 'Debit' | 'Kredit' — kategori transaksi
  category?: string;                 // Booking Fee, Angsuran, Pelunasan, Refund, Lainnya/custom
  created_at: string;
  updated_at: string;
}

// ── Payloads ───────────────────────────────────────────────

export interface CreateTransactionPayload {
  transaction_date: string;
  type: TransactionType;
  category?: string;
  description?: string;
  amount: number;
  payment_method?: string;
  reference_no?: string;
  project_id?: string;
  housing_unit_id?: string;
}

/** Payload pembuatan konsumen piutang — identitas & unit diisi server dari lead Deal */
export interface CreateConsumerPayload {
  lead_id: string;
  nik?: string;
  address?: string;
  payment_scheme?: string;
}

export interface CreatePaymentPayload {
  payment_date: string;
  amount?: number;                    // legacy: jika debit/credit tidak diisi
  debit?: number;                     // pembayaran (masuk)
  credit?: number;                   // pengembalian (keluar)
  payment_method?: string;
  notes?: string;
  transaction_name?: string;
  estimasi_date?: string;
  category?: string;  // Booking Fee, Angsuran, Pelunasan, Refund, or custom when Lainnya
}

// ── Params ─────────────────────────────────────────────────

export interface TransactionListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: TransactionType;
  category?: string;
  date_from?: string;
  date_to?: string;
}
