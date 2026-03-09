/**
 * hooks/useSOP.ts
 * Hook untuk mengelola alur SOP logistik:
 * Permintaan Material → TTG → Barang Keluar → Inventaris → Surat Jalan
 *
 * Cara pakai di komponen:
 *   const { permintaanList, isLoading, create, remove } = usePermintaanMaterial();
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { USE_MOCK_DATA } from '../lib/config';
import {
    mockBarangKeluar,
    mockInventarisLapangan,
    mockPermintaanMaterial,
    mockSuratJalan,
    mockTandaTerimaGudang,
} from '../lib/mockSOP';
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
      if (USE_MOCK_DATA) {
        setPermintaanList(mockPermintaanMaterial);
        return;
      }
      const res = await sopService.getPermintaan(status ? { status } : undefined);
      setPermintaanList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (payload: Partial<PermintaanMaterial>) => {
    if (USE_MOCK_DATA) {
      const newItem: PermintaanMaterial = {
        id: String(Date.now()),
        noForm: payload.noForm || `PM-${Date.now()}`,
        tanggal: payload.tanggal || new Date().toISOString().slice(0, 10),
        divisi: payload.divisi,
        namaPeminta: payload.namaPeminta,
        status: 'Diajukan',
        disetujui: payload.disetujui,
        diperiksa: payload.diperiksa,
        items: payload.items ?? [],
      };
      setPermintaanList(prev => [newItem, ...prev]);
      toast.success('Permintaan material berhasil dibuat');
      return newItem;
    }
    try {
      const p = await sopService.createPermintaan(payload);
      toast.success('Permintaan material berhasil dibuat');
      await fetchData();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const approve = async (id: string) => {
    if (USE_MOCK_DATA) {
      setPermintaanList(prev => prev.map(i => i.id === id ? { ...i, status: 'Disetujui' as const } : i));
      toast.success('Permintaan material disetujui');
      return;
    }
    try {
      await sopService.approvePermintaan(id);
      toast.success('Permintaan material disetujui');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const reject = async (id: string) => {
    if (USE_MOCK_DATA) {
      setPermintaanList(prev => prev.map(i => i.id === id ? { ...i, status: 'Ditolak' as const } : i));
      toast.success('Permintaan material ditolak');
      return;
    }
    try {
      await sopService.rejectPermintaan(id);
      toast.success('Permintaan material ditolak');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setPermintaanList(prev => prev.filter(i => i.id !== id));
      toast.success('Permintaan material berhasil dihapus');
      return;
    }
    try {
      await sopService.removePermintaan(id);
      toast.success('Permintaan material berhasil dihapus');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { permintaanList, setPermintaanList, isLoading, refetch: fetchData, create, approve, reject, remove };
}

// ── Hook Tanda Terima Gudang ──────────────────────────────────────

export function useTandaTerimaGudang() {
  const [ttgList, setTtgList] = useState<TandaTerimaGudang[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) {
        setTtgList(mockTandaTerimaGudang);
        return;
      }
      const res = await sopService.getTTG();
      setTtgList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (payload: Partial<TandaTerimaGudang>) => {
    if (USE_MOCK_DATA) {
      const newItem: TandaTerimaGudang = {
        id: String(Date.now()),
        noTerima: payload.noTerima || `TTG-${Date.now()}`,
        tanggal: payload.tanggal || new Date().toISOString().slice(0, 10),
        supplier: payload.supplier || '',
        penerima: payload.penerima || '',
        status: 'Draft',
        items: payload.items ?? [],
      };
      setTtgList(prev => [newItem, ...prev]);
      toast.success('TTG berhasil dibuat');
      return newItem;
    }
    try {
      const t = await sopService.createTTG(payload);
      toast.success('TTG berhasil dibuat');
      await fetchData();
      return t;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const verify = async (id: string) => {
    if (USE_MOCK_DATA) {
      setTtgList(prev => prev.map(i => i.id === id ? { ...i, status: 'Selesai' as const } : i));
      toast.success('TTG berhasil diverifikasi');
      return;
    }
    try {
      await sopService.verifyTTG(id);
      toast.success('TTG berhasil diverifikasi');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setTtgList(prev => prev.filter(i => i.id !== id));
      toast.success('TTG berhasil dihapus');
      return;
    }
    try {
      await sopService.removeTTG(id);
      toast.success('TTG berhasil dihapus');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { ttgList, setTtgList, isLoading, refetch: fetchData, create, verify, remove };
}

// ── Hook Barang Keluar ────────────────────────────────────────────

export function useBarangKeluar() {
  const [barangKeluarList, setBarangKeluarList] = useState<BarangKeluar[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) {
        setBarangKeluarList(mockBarangKeluar);
        return;
      }
      const res = await sopService.getBarangKeluar();
      setBarangKeluarList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (payload: Partial<BarangKeluar>) => {
    if (USE_MOCK_DATA) {
      const newItem: BarangKeluar = {
        id: String(Date.now()),
        noForm: payload.noForm || `BK-${Date.now()}`,
        tanggal: payload.tanggal || new Date().toISOString().slice(0, 10),
        tujuan: payload.tujuan,
        penerima: payload.penerima,
        project: payload.project,
        status: 'Draft',
        items: payload.items ?? [],
      };
      setBarangKeluarList(prev => [newItem, ...prev]);
      toast.success('Barang keluar berhasil dicatat');
      return newItem;
    }
    try {
      const b = await sopService.createBarangKeluar(payload);
      toast.success('Barang keluar berhasil dicatat');
      await fetchData();
      return b;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setBarangKeluarList(prev => prev.filter(i => i.id !== id));
      toast.success('Barang keluar berhasil dihapus');
      return;
    }
    try {
      await sopService.removeBarangKeluar(id);
      toast.success('Barang keluar berhasil dihapus');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { barangKeluarList, setBarangKeluarList, isLoading, refetch: fetchData, create, remove };
}

// ── Hook Inventaris Lapangan ──────────────────────────────────────

export function useInventarisLapangan(search?: string) {
  const [inventarisList, setInventarisList] = useState<InventarisLapangan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) {
        setInventarisList(mockInventarisLapangan);
        return;
      }
      const res = await sopService.getInventaris(search ? { search } : undefined);
      setInventarisList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (payload: Partial<InventarisLapangan>) => {
    if (USE_MOCK_DATA) {
      const newItem: InventarisLapangan = {
        id: String(Date.now()),
        kode: payload.kode || `INV-${Date.now()}`,
        namaBarang: payload.namaBarang || '',
        kategori: payload.kategori,
        lokasi: payload.lokasi,
        kondisi: payload.kondisi || 'Baik',
        qty: payload.qty || 0,
        satuan: payload.satuan,
        tanggalCatat: payload.tanggalCatat,
        penanggungJawab: payload.penanggungJawab,
      };
      setInventarisList(prev => [newItem, ...prev]);
      toast.success('Inventaris berhasil ditambahkan');
      return newItem;
    }
    try {
      const i = await sopService.createInventaris(payload);
      toast.success('Inventaris berhasil ditambahkan');
      await fetchData();
      return i;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<InventarisLapangan>) => {
    if (USE_MOCK_DATA) {
      setInventarisList(prev => prev.map(i => i.id === id ? { ...i, ...payload } as InventarisLapangan : i));
      toast.success('Inventaris berhasil diperbarui');
      return;
    }
    try {
      await sopService.updateInventaris(id, payload);
      toast.success('Inventaris berhasil diperbarui');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setInventarisList(prev => prev.filter(i => i.id !== id));
      toast.success('Inventaris berhasil dihapus');
      return;
    }
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
      if (USE_MOCK_DATA) {
        setSuratJalanList(mockSuratJalan);
        return;
      }
      const res = await sopService.getSuratJalan();
      setSuratJalanList(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (payload: Partial<SuratJalan>) => {
    if (USE_MOCK_DATA) {
      const newItem: SuratJalan = {
        id: String(Date.now()),
        nomorSurat: payload.nomorSurat || `SJ-${Date.now()}`,
        tanggal: payload.tanggal || new Date().toISOString().slice(0, 10),
        nomorPO: payload.nomorPO,
        kepada: payload.kepada,
        dikirimDengan: payload.dikirimDengan,
        noPolisi: payload.noPolisi,
        namaPengemudi: payload.namaPengemudi,
        tandaTerima: payload.tandaTerima,
        pengemudi: payload.pengemudi,
        mengetahui: payload.mengetahui,
        totalBarang: payload.totalBarang ?? 0,
        status: 'Draft',
        items: payload.items ?? [],
      };
      setSuratJalanList(prev => [newItem, ...prev]);
      toast.success('Surat jalan berhasil dibuat');
      return newItem;
    }
    try {
      const s = await sopService.createSuratJalan(payload);
      toast.success('Surat jalan berhasil dibuat');
      await fetchData();
      return s;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setSuratJalanList(prev => prev.filter(i => i.id !== id));
      toast.success('Surat jalan berhasil dihapus');
      return;
    }
    try {
      await sopService.removeSuratJalan(id);
      toast.success('Surat jalan berhasil dihapus');
      await fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { suratJalanList, setSuratJalanList, isLoading, refetch: fetchData, create, remove };
}
