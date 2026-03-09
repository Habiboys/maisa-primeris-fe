/**
 * hooks/useHousing.ts
 * Hook untuk mengelola data unit perumahan & riwayat pembayaran
 *
 * Cara pakai di komponen:
 *   const { units, isLoading } = useHousingUnits();
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { USE_MOCK_DATA } from '../lib/config';
import { mockHousingUnits } from '../lib/mockMarketing';
import { getErrorMessage } from '../lib/utils';
import { housingService } from '../services/housing.service';
import type { CreateHousingPaymentPayload, CreateHousingUnitPayload, HousingPaymentHistory, HousingUnit } from '../types';

// ── Hook housing units ────────────────────────────────────────────

export function useHousingUnits(search?: string) {
  const [units, setUnits] = useState<HousingUnit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnits = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) {
        let data = [...mockHousingUnits];
        if (search) {
          const q = search.toLowerCase();
          data = data.filter(u => u.unit_code.toLowerCase().includes(q) || (u.unit_type ?? '').toLowerCase().includes(q));
        }
        setUnits(data);
        return;
      }
      const res = await housingService.getAll(search ? { search } : undefined);
      setUnits(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [search]);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  const create = async (payload: CreateHousingUnitPayload) => {
    if (USE_MOCK_DATA) {
      const u: HousingUnit = {
        id: crypto.randomUUID(),
        ...payload,
        status: 'Tersedia',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUnits(prev => [u, ...prev]);
      toast.success('Unit perumahan berhasil ditambahkan');
      return u;
    }
    try {
      const u = await housingService.create(payload);
      toast.success('Unit perumahan berhasil ditambahkan');
      await fetchUnits();
      return u;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<CreateHousingUnitPayload>) => {
    if (USE_MOCK_DATA) {
      setUnits(prev => prev.map(u => u.id === id ? { ...u, ...payload, updated_at: new Date().toISOString() } : u));
      toast.success('Unit perumahan berhasil diperbarui');
      return;
    }
    try {
      const u = await housingService.update(id, payload);
      toast.success('Unit perumahan berhasil diperbarui');
      await fetchUnits();
      return u;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setUnits(prev => prev.filter(u => u.id !== id));
      toast.success('Unit perumahan berhasil dihapus');
      return;
    }
    try {
      await housingService.remove(id);
      toast.success('Unit perumahan berhasil dihapus');
      await fetchUnits();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { units, isLoading, refetch: fetchUnits, create, update, remove };
}

// ── Hook riwayat bayar unit ───────────────────────────────────────

export function useHousingPayments(unitId: string) {
  const [payments, setPayments] = useState<HousingPaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!unitId) return;
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) {
        const unit = mockHousingUnits.find(u => u.id === unitId);
        setPayments(unit?.payments ?? []);
        return;
      }
      const data = await housingService.getPayments(unitId);
      setPayments(data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [unitId]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const create = async (payload: CreateHousingPaymentPayload) => {
    if (USE_MOCK_DATA) {
      const p: HousingPaymentHistory = {
        id: crypto.randomUUID(),
        housing_unit_id: unitId,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPayments(prev => [...prev, p]);
      toast.success('Pembayaran berhasil dicatat');
      return p;
    }
    try {
      const p = await housingService.createPayment(unitId, payload);
      toast.success('Pembayaran berhasil dicatat');
      await fetchPayments();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (paymentId: string, payload: Partial<CreateHousingPaymentPayload>) => {
    if (USE_MOCK_DATA) {
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, ...payload, updated_at: new Date().toISOString() } : p));
      toast.success('Pembayaran berhasil diperbarui');
      return;
    }
    try {
      const p = await housingService.updatePayment(unitId, paymentId, payload);
      toast.success('Pembayaran berhasil diperbarui');
      await fetchPayments();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (paymentId: string) => {
    if (USE_MOCK_DATA) {
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      toast.success('Pembayaran berhasil dihapus');
      return;
    }
    try {
      await housingService.removePayment(unitId, paymentId);
      toast.success('Pembayaran berhasil dihapus');
      await fetchPayments();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { payments, isLoading, refetch: fetchPayments, create, update, remove };
}
