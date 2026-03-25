/**
 * hooks/useFinance.ts
 * Hook untuk mengelola data keuangan, transaksi, konsumen, riwayat bayar
 *
 * Cara pakai di komponen:
 *   const { transactions, isLoading, summary } = useTransactions();
 *   const { consumers } = useConsumers();
 *   const { payments } = usePaymentHistory(consumerId);
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { financeService } from '../services/finance.service';
import type {
    Consumer,
    CreateConsumerPayload,
    CreatePaymentPayload,
    CreateTransactionPayload,
    PaymentHistory,
    Transaction,
    TransactionListParams,
    TransactionSummary,
} from '../types';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// ── Hook transaksi ────────────────────────────────────────────

export function useTransactions(initialParams?: TransactionListParams) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, total_pages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState<TransactionListParams | undefined>(initialParams);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, sum] = await Promise.all([
        financeService.getTransactions(params),
        financeService.getSummary(),
      ]);
      setTransactions(res.data);
      setPagination(res.pagination);
      setSummary(sum);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const create = async (payload: CreateTransactionPayload) => {
    try {
      const newTx = await financeService.createTransaction(payload);
      toast.success('Transaksi berhasil ditambahkan');
      await fetchTransactions();
      return newTx;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<CreateTransactionPayload>) => {
    try {
      const updated = await financeService.updateTransaction(id, payload);
      toast.success('Transaksi berhasil diperbarui');
      await fetchTransactions();
      return updated;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await financeService.removeTransaction(id);
      toast.success('Transaksi berhasil dihapus');
      await fetchTransactions();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return {
    transactions, summary, pagination, isLoading,
    refetch: fetchTransactions, setParams, create, update, remove,
    exportTransactions: financeService.exportTransactions,
    exportConsumers: financeService.exportConsumers,
  };
}

// ── Hook konsumen ─────────────────────────────────────────────

export function useConsumers(search?: string) {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConsumers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await financeService.getConsumers(search ? { search } : undefined);
      setConsumers(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [search]);

  useEffect(() => { fetchConsumers(); }, [fetchConsumers]);

  const create = async (payload: CreateConsumerPayload) => {
    try {
      const c = await financeService.createConsumer(payload);
      toast.success('Konsumen berhasil ditambahkan');
      await fetchConsumers();
      return c;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<CreateConsumerPayload>) => {
    try {
      const c = await financeService.updateConsumer(id, payload);
      toast.success('Konsumen berhasil diperbarui');
      await fetchConsumers();
      return c;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await financeService.removeConsumer(id);
      toast.success('Konsumen berhasil dihapus');
      await fetchConsumers();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { consumers, isLoading, refetch: fetchConsumers, create, update, remove };
}

// ── Hook detail konsumen (single + payments) ─────────────────

export function useConsumerDetail(consumerId: string | null) {
  const [consumer, setConsumer] = useState<Consumer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConsumer = useCallback(async () => {
    if (!consumerId) { setConsumer(null); return; }
    setIsLoading(true);
    try {
      const data = await financeService.getConsumerById(consumerId);
      setConsumer(data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [consumerId]);

  useEffect(() => { fetchConsumer(); }, [fetchConsumer]);

  return { consumer, isLoading, refetch: fetchConsumer };
}

// ── Hook riwayat bayar ────────────────────────────────────────

export function usePaymentHistory(consumerId: string) {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!consumerId) return;
    setIsLoading(true);
    try {
      const data = await financeService.getPayments(consumerId);
      setPayments(data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [consumerId]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const create = async (payload: CreatePaymentPayload) => {
    try {
      const p = await financeService.createPayment(consumerId, payload);
      toast.success('Pembayaran berhasil dicatat');
      await fetchPayments();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (paymentId: string, payload: Partial<CreatePaymentPayload>) => {
    try {
      const p = await financeService.updatePayment(consumerId, paymentId, payload);
      toast.success('Pembayaran berhasil diperbarui');
      await fetchPayments();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (paymentId: string) => {
    try {
      await financeService.removePayment(consumerId, paymentId);
      toast.success('Pembayaran berhasil dihapus');
      await fetchPayments();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { payments, isLoading, refetch: fetchPayments, create, update, remove };
}
