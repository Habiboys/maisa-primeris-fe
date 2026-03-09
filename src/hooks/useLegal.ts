/**
 * hooks/useLegal.ts
 * Hook untuk mengelola dokumen legal: PPJB, Akad, BAST, Pindah Unit, Pembatalan
 *
 * Cara pakai di komponen:
 *   const { ppjbList, isLoading, create, update, remove } = usePPJB();
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { USE_MOCK_DATA } from '../lib/config';
import { mockAkadList, mockBastList, mockPembatalanList, mockPindahUnitList, mockPpjbList } from '../lib/mockLegal';
import { getErrorMessage } from '../lib/utils';
import { legalService } from '../services/legal.service';
import type { Akad, BAST, Pembatalan, PindahUnit, PPJB } from '../types';

// ── Hook PPJB ─────────────────────────────────────────────────────

export function usePPJB(search?: string) {
  const [ppjbList, setPpjbList] = useState<PPJB[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPPJB = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) { setPpjbList(mockPpjbList); return; }
      const res = await legalService.getPPJBList(search ? { search } : undefined);
      setPpjbList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [search]);

  useEffect(() => { fetchPPJB(); }, [fetchPPJB]);

  const create = async (payload: Partial<PPJB>) => {
    try {
      const p = await legalService.createPPJB(payload);
      toast.success('PPJB berhasil ditambahkan');
      await fetchPPJB();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<PPJB>) => {
    try {
      const p = await legalService.updatePPJB(id, payload);
      toast.success('PPJB berhasil diperbarui');
      await fetchPPJB();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await legalService.removePPJB(id);
      toast.success('PPJB berhasil dihapus');
      await fetchPPJB();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { ppjbList, isLoading, refetch: fetchPPJB, create, update, remove };
}

// ── Hook Akad ─────────────────────────────────────────────────────

export function useAkad(search?: string) {
  const [akadList, setAkadList] = useState<Akad[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAkad = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) { setAkadList(mockAkadList); return; }
      const res = await legalService.getAkadList(search ? { search } : undefined);
      setAkadList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [search]);

  useEffect(() => { fetchAkad(); }, [fetchAkad]);

  const create = async (payload: Partial<Akad>) => {
    try {
      const a = await legalService.createAkad(payload);
      toast.success('Akad berhasil ditambahkan');
      await fetchAkad();
      return a;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<Akad>) => {
    try {
      const a = await legalService.updateAkad(id, payload);
      toast.success('Akad berhasil diperbarui');
      await fetchAkad();
      return a;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await legalService.removeAkad(id);
      toast.success('Akad berhasil dihapus');
      await fetchAkad();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { akadList, isLoading, refetch: fetchAkad, create, update, remove };
}

// ── Hook BAST ─────────────────────────────────────────────────────

export function useBAST(search?: string) {
  const [bastList, setBastList] = useState<BAST[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBAST = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) { setBastList(mockBastList); return; }
      const res = await legalService.getBASTList(search ? { search } : undefined);
      setBastList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [search]);

  useEffect(() => { fetchBAST(); }, [fetchBAST]);

  const create = async (payload: Partial<BAST>) => {
    try {
      const b = await legalService.createBAST(payload);
      toast.success('BAST berhasil ditambahkan');
      await fetchBAST();
      return b;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<BAST>) => {
    try {
      const b = await legalService.updateBAST(id, payload);
      toast.success('BAST berhasil diperbarui');
      await fetchBAST();
      return b;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await legalService.removeBAST(id);
      toast.success('BAST berhasil dihapus');
      await fetchBAST();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { bastList, isLoading, refetch: fetchBAST, create, update, remove };
}

// ── Hook Pindah Unit ──────────────────────────────────────────────

export function usePindahUnit(search?: string) {
  const [pindahList, setPindahList] = useState<PindahUnit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPindah = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) { setPindahList(mockPindahUnitList); return; }
      const res = await legalService.getPindahUnitList(search ? { search } : undefined);
      setPindahList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [search]);

  useEffect(() => { fetchPindah(); }, [fetchPindah]);

  const create = async (payload: Partial<PindahUnit>) => {
    try {
      const p = await legalService.createPindahUnit(payload);
      toast.success('Pindah unit berhasil diproses');
      await fetchPindah();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<PindahUnit>) => {
    try {
      const p = await legalService.updatePindahUnit(id, payload);
      toast.success('Pindah unit berhasil diperbarui');
      await fetchPindah();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await legalService.removePindahUnit(id);
      toast.success('Pindah unit berhasil dihapus');
      await fetchPindah();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { pindahList, isLoading, refetch: fetchPindah, create, update, remove };
}

// ── Hook Pembatalan ───────────────────────────────────────────────

export function usePembatalan(search?: string) {
  const [pembatalanList, setPembatalanList] = useState<Pembatalan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPembatalan = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) { setPembatalanList(mockPembatalanList); return; }
      const res = await legalService.getPembatalanList(search ? { search } : undefined);
      setPembatalanList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [search]);

  useEffect(() => { fetchPembatalan(); }, [fetchPembatalan]);

  const create = async (payload: Partial<Pembatalan>) => {
    try {
      const p = await legalService.createPembatalan(payload);
      toast.success('Pembatalan berhasil diproses');
      await fetchPembatalan();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<Pembatalan>) => {
    try {
      const p = await legalService.updatePembatalan(id, payload);
      toast.success('Pembatalan berhasil diperbarui');
      await fetchPembatalan();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await legalService.removePembatalan(id);
      toast.success('Pembatalan berhasil dihapus');
      await fetchPembatalan();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { pembatalanList, isLoading, refetch: fetchPembatalan, create, update, remove };
}
