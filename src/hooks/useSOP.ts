/**
 * hooks/useSOP.ts
 * Hook untuk mengelola alur SOP logistik:
 * Permintaan Material → TTG → Barang Keluar → Inventaris → Surat Jalan
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { sopService } from '../services/sop.service';
import type { BarangKeluar, InventarisLapangan, PermintaanMaterial, SuratJalan, TandaTerimaGudang } from '../types';

// ── Hook Permintaan Material ──────────────────────────────────────

export function usePermintaanMaterial(status?: string) {
  const [permintaanList, setPermintaanList] = useState<PermintaanMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await sopService.getPermintaan(status ? { status } : undefined);
      setPermintaanList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (payload: Partial<PermintaanMaterial>) => {
    try {
      const p = await sopService.createPermintaan(payload);
      toast.success('Permintaan material berhasil dibuat');
      await fetchData();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const approve = async (id: string) => {
    try {
      await sopService.approvePermintaan(id);
      toast.success('Permintaan material disetujui');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<PermintaanMaterial>) => {
    try {
      const p = await sopService.updatePermintaan(id, payload);
      toast.success('Permintaan material diperbarui');
      await fetchData();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const reject = async (id: string) => {
    try {
      await sopService.rejectPermintaan(id);
      toast.success('Permintaan material ditolak');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await sopService.removePermintaan(id);
      toast.success('Permintaan material berhasil dihapus');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { permintaanList, setPermintaanList, isLoading, refetch: fetchData, create, update, approve, reject, remove };
}

// ── Hook Tanda Terima Gudang ──────────────────────────────────────

export function useTandaTerimaGudang() {
  const [ttgList, setTtgList] = useState<TandaTerimaGudang[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await sopService.getTTG();
      setTtgList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (payload: Partial<TandaTerimaGudang>) => {
    try {
      const t = await sopService.createTTG(payload);
      toast.success('TTG berhasil dibuat');
      await fetchData();
      return t;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const verify = async (id: string) => {
    try {
      await sopService.verifyTTG(id);
      toast.success('TTG berhasil diverifikasi');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<TandaTerimaGudang>) => {
    try {
      const t = await sopService.updateTTG(id, payload);
      toast.success('TTG berhasil diperbarui');
      await fetchData();
      return t;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await sopService.removeTTG(id);
      toast.success('TTG berhasil dihapus');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { ttgList, setTtgList, isLoading, refetch: fetchData, create, update, verify, remove };
}

// ── Hook Barang Keluar ────────────────────────────────────────────

export function useBarangKeluar() {
  const [barangKeluarList, setBarangKeluarList] = useState<BarangKeluar[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await sopService.getBarangKeluar();
      setBarangKeluarList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (payload: Partial<BarangKeluar>) => {
    try {
      const b = await sopService.createBarangKeluar(payload);
      toast.success('Barang keluar berhasil dicatat');
      await fetchData();
      return b;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const verify = async (id: string) => {
    try {
      await sopService.verifyBarangKeluar(id);
      toast.success('Barang keluar berhasil diselesaikan');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<BarangKeluar>) => {
    try {
      const b = await sopService.updateBarangKeluar(id, payload);
      toast.success('Barang keluar diperbarui');
      await fetchData();
      return b;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await sopService.removeBarangKeluar(id);
      toast.success('Barang keluar berhasil dihapus');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { barangKeluarList, setBarangKeluarList, isLoading, refetch: fetchData, create, update, verify, remove };
}

// ── Hook Inventaris Lapangan ──────────────────────────────────────

export function useInventarisLapangan(search?: string) {
  const [inventarisList, setInventarisList] = useState<InventarisLapangan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await sopService.getInventaris(search ? { search } : undefined);
      setInventarisList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (payload: Partial<InventarisLapangan>) => {
    try {
      const i = await sopService.createInventaris(payload);
      toast.success('Inventaris berhasil ditambahkan');
      await fetchData();
      return i;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<InventarisLapangan>) => {
    try {
      await sopService.updateInventaris(id, payload);
      toast.success('Inventaris berhasil diperbarui');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await sopService.removeInventaris(id);
      toast.success('Inventaris berhasil dihapus');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { inventarisList, setInventarisList, isLoading, refetch: fetchData, create, update, remove };
}

// ── Hook Surat Jalan ──────────────────────────────────────────────

export function useSuratJalan() {
  const [suratJalanList, setSuratJalanList] = useState<SuratJalan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await sopService.getSuratJalan();
      setSuratJalanList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (payload: Partial<SuratJalan>) => {
    try {
      const s = await sopService.createSuratJalan(payload);
      toast.success('Surat jalan berhasil dibuat');
      await fetchData();
      return s;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<SuratJalan>) => {
    try {
      const s = await sopService.updateSuratJalan(id, payload);
      toast.success('Surat jalan diperbarui');
      await fetchData();
      return s;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await sopService.removeSuratJalan(id);
      toast.success('Surat jalan berhasil dihapus');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await sopService.updateSuratJalanStatus(id, status);
      toast.success('Status surat jalan diperbarui');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { suratJalanList, setSuratJalanList, isLoading, refetch: fetchData, create, update, remove, updateStatus };
}
