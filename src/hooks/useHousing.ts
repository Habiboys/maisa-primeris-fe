/**
 * hooks/useHousing.ts
 * Hook untuk mengelola data unit perumahan & riwayat pembayaran
 *
 * Cara pakai di komponen:
 *   const { units, isLoading } = useHousingUnits();
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { housingService } from '../services/housing.service';
import type { CreateHousingPaymentPayload, CreateHousingUnitPayload, HousingPaymentHistory, HousingUnit } from '../types';

// ── Hook housing units ────────────────────────────────────────────

export function useHousingUnits(search?: string, options?: { limit?: number; page?: number; project_id?: string }) {
  const [units, setUnits] = useState<HousingUnit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; total_pages: number } | null>(null);

  const fetchUnits = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await housingService.getAll({
        ...(search ? { search } : {}),
        ...(options?.project_id ? { project_id: options.project_id } : {}),
        limit: options?.limit ?? 20,
        page: options?.page ?? 1,
      });
      setUnits(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [search, options?.limit, options?.page, options?.project_id]);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  const create = async (payload: CreateHousingUnitPayload | FormData) => {
    try {
      const u = await housingService.create(payload);
      toast.success('Unit perumahan berhasil ditambahkan');
      await fetchUnits();
      return u;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<CreateHousingUnitPayload> | FormData) => {
    try {
      const u = await housingService.update(id, payload);
      toast.success('Unit perumahan berhasil diperbarui');
      await fetchUnits();
      return u;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await housingService.remove(id);
      toast.success('Unit perumahan berhasil dihapus');
      await fetchUnits();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { units, isLoading, pagination, refetch: fetchUnits, create, update, remove };
}

// ── Hook riwayat bayar unit ───────────────────────────────────────

export function useHousingPayments(unitId: string) {
  const [payments, setPayments] = useState<HousingPaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!unitId) return;
    setIsLoading(true);
    try {
      const data = await housingService.getPayments(unitId);
      setPayments(data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [unitId]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const create = async (payload: CreateHousingPaymentPayload) => {
    try {
      const p = await housingService.createPayment(unitId, payload);
      toast.success('Pembayaran berhasil dicatat');
      await fetchPayments();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (paymentId: string, payload: Partial<CreateHousingPaymentPayload>) => {
    try {
      const p = await housingService.updatePayment(unitId, paymentId, payload);
      toast.success('Pembayaran berhasil diperbarui');
      await fetchPayments();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (paymentId: string) => {
    try {
      await housingService.removePayment(unitId, paymentId);
      toast.success('Pembayaran berhasil dihapus');
      await fetchPayments();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { payments, isLoading, refetch: fetchPayments, create, update, remove };
}
