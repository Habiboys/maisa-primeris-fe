/**
 * services/finance.service.ts
 * Pemanggilan API untuk modul Finance & Accounting
 */

import api from '../lib/api';
import { cleanParams } from '../lib/utils';
import type {
    ApiResponse,
    Consumer,
    CreateConsumerPayload,
    CreatePaymentPayload,
    CreateTransactionPayload,
    PaginatedResponse,
    PaymentHistory,
    Transaction,
    TransactionListParams,
    TransactionSummary,
} from '../types';

export const financeService = {
  // ── Transactions ─────────────────────────────────────────────
  async getTransactions(params?: TransactionListParams): Promise<PaginatedResponse<Transaction>> {
    const res = await api.get<PaginatedResponse<Transaction> & { data?: Transaction[] }>('/transactions', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    const body = res.data as Record<string, unknown>;
    const data = Array.isArray(body?.data) ? body.data : (body?.data as Record<string, unknown>)?.data ?? [];
    const pagination = (body?.pagination as PaginatedResponse<Transaction>['pagination']) ?? { page: 1, limit: 20, total: 0, total_pages: 1 };
    return { data: data as Transaction[], pagination };
  },

  async getTransactionById(id: string): Promise<Transaction> {
    const res = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return res.data.data;
  },

  async createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
    const res = await api.post<ApiResponse<Transaction>>('/transactions', payload);
    return res.data.data;
  },

  async updateTransaction(id: string, payload: Partial<CreateTransactionPayload>): Promise<Transaction> {
    const res = await api.put<ApiResponse<Transaction>>(`/transactions/${id}`, payload);
    return res.data.data;
  },

  async removeTransaction(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  async getSummary(): Promise<TransactionSummary> {
    const res = await api.get<ApiResponse<TransactionSummary>>('/transactions/summary');
    const body = res.data as { data?: TransactionSummary };
    return (body?.data ?? body) as TransactionSummary;
  },

  async exportTransactions(params?: TransactionListParams): Promise<Blob> {
    const res = await api.get('/transactions/export', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
      responseType: 'blob',
    });
    return res.data as Blob;
  },

  async exportConsumers(params?: { search?: string; blok?: string }): Promise<Blob> {
    const res = await api.get('/consumers/export', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
      responseType: 'blob',
    });
    return res.data as Blob;
  },

  // ── Consumers (Piutang) ──────────────────────────────────────
  async getConsumers(params?: { search?: string; blok?: string; page?: number }): Promise<PaginatedResponse<Consumer>> {
    const res = await api.get<PaginatedResponse<Consumer>>('/consumers', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    return res.data;
  },

  async getConsumerById(id: string): Promise<Consumer> {
    const res = await api.get<ApiResponse<Consumer>>(`/consumers/${id}`);
    return res.data.data;
  },

  async createConsumer(payload: CreateConsumerPayload): Promise<Consumer> {
    const res = await api.post<ApiResponse<Consumer>>('/consumers', payload);
    return res.data.data;
  },

  async updateConsumer(id: string, payload: Partial<CreateConsumerPayload>): Promise<Consumer> {
    const res = await api.put<ApiResponse<Consumer>>(`/consumers/${id}`, payload);
    return res.data.data;
  },

  async removeConsumer(id: string): Promise<void> {
    await api.delete(`/consumers/${id}`);
  },

  // ── Payment Histories ────────────────────────────────────────
  async getPayments(consumerId: string): Promise<PaymentHistory[]> {
    const res = await api.get<ApiResponse<PaymentHistory[]>>(`/consumers/${consumerId}/payments`);
    const raw = res.data as { data?: PaymentHistory[] } | PaymentHistory[];
    return Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
  },

  async createPayment(consumerId: string, payload: CreatePaymentPayload): Promise<PaymentHistory> {
    const res = await api.post<ApiResponse<PaymentHistory>>(`/consumers/${consumerId}/payments`, payload);
    return res.data.data;
  },

  async updatePayment(consumerId: string, paymentId: string, payload: Partial<CreatePaymentPayload>): Promise<PaymentHistory> {
    const res = await api.put<ApiResponse<PaymentHistory>>(`/consumers/${consumerId}/payments/${paymentId}`, payload);
    return res.data.data;
  },

  async removePayment(consumerId: string, paymentId: string): Promise<void> {
    await api.delete(`/consumers/${consumerId}/payments/${paymentId}`);
  },
};
