/**
 * hooks/useLegal.ts
 * Hook untuk mengelola dokumen legal: PPJB, Akad, BAST, Pindah Unit, Pembatalan
 *
 * Cara pakai di komponen:
 *   const { ppjbList, isLoading, create, update, remove } = usePPJB();
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { legalService } from '../services/legal.service';
import type { Akad, BAST, Pembatalan, PindahUnit, PPJB } from '../types';

export type LegalListParams = { search?: string; page?: number; limit?: number };

const defaultPagination = { page: 1, limit: 10, total: 0, total_pages: 0 };

// ── Hook PPJB ─────────────────────────────────────────────────────

export function usePPJB(params?: LegalListParams) {
  const [ppjbList, setPpjbList] = useState<PPJB[]>([]);
  const [pagination, setPagination] = useState<typeof defaultPagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchParams, setFetchParams] = useState(params);
  useEffect(() => {
    if (params !== undefined) setFetchParams(params);
  }, [params?.search, params?.page, params?.limit]);

  const fetchPPJB = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await legalService.getPPJBList(fetchParams);
      setPpjbList(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [fetchParams?.search, fetchParams?.page, fetchParams?.limit]);

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

  return { ppjbList, pagination, isLoading, refetch: fetchPPJB, create, update, remove };
}

// ── Hook Akad ─────────────────────────────────────────────────────

export function useAkad(params?: LegalListParams) {
  const [akadList, setAkadList] = useState<Akad[]>([]);
  const [pagination, setPagination] = useState<typeof defaultPagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchParams, setFetchParams] = useState(params);
  useEffect(() => {
    if (params !== undefined) setFetchParams(params);
  }, [params?.search, params?.page, params?.limit]);

  const fetchAkad = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await legalService.getAkadList(fetchParams);
      setAkadList(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [fetchParams?.search, fetchParams?.page, fetchParams?.limit]);

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

  return { akadList, pagination, isLoading, refetch: fetchAkad, create, update, remove };
}

// ── Hook BAST ─────────────────────────────────────────────────────

export function useBAST(params?: LegalListParams) {
  const [bastList, setBastList] = useState<BAST[]>([]);
  const [pagination, setPagination] = useState<typeof defaultPagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchParams, setFetchParams] = useState(params);
  useEffect(() => {
    if (params !== undefined) setFetchParams(params);
  }, [params?.search, params?.page, params?.limit]);

  const fetchBAST = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await legalService.getBASTList(fetchParams);
      setBastList(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [fetchParams?.search, fetchParams?.page, fetchParams?.limit]);

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

  return { bastList, pagination, isLoading, refetch: fetchBAST, create, update, remove };
}

// ── Hook Pindah Unit ──────────────────────────────────────────────

export function usePindahUnit(params?: LegalListParams) {
  const [pindahList, setPindahList] = useState<PindahUnit[]>([]);
  const [pagination, setPagination] = useState<typeof defaultPagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchParams, setFetchParams] = useState(params);
  useEffect(() => {
    if (params !== undefined) setFetchParams(params);
  }, [params?.search, params?.page, params?.limit]);

  const fetchPindah = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await legalService.getPindahUnitList(fetchParams);
      setPindahList(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [fetchParams?.search, fetchParams?.page, fetchParams?.limit]);

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

  return { pindahList, pagination, isLoading, refetch: fetchPindah, create, update, remove };
}

// ── Hook Pembatalan ───────────────────────────────────────────────

export function usePembatalan(params?: LegalListParams) {
  const [pembatalanList, setPembatalanList] = useState<Pembatalan[]>([]);
  const [pagination, setPagination] = useState<typeof defaultPagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchParams, setFetchParams] = useState(params);
  useEffect(() => {
    if (params !== undefined) setFetchParams(params);
  }, [params?.search, params?.page, params?.limit]);

  const fetchPembatalan = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await legalService.getPembatalanList(fetchParams);
      setPembatalanList(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [fetchParams?.search, fetchParams?.page, fetchParams?.limit]);

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

  return { pembatalanList, pagination, isLoading, refetch: fetchPembatalan, create, update, remove };
}
