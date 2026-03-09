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
  amount: number;
  payment_method?: string;
  notes?: string;
  receipt_file?: string;
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
}

export interface CreateConsumerPayload {
  name: string;
  nik?: string;
  phone?: string;
  email?: string;
  address?: string;
  unit_code?: string;
  project_id?: string;
  total_price: number;
  payment_scheme?: string;
}

export interface CreatePaymentPayload {
  payment_date: string;
  amount: number;
  payment_method?: string;
  notes?: string;
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
