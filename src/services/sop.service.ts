/**
 * services/sop.service.ts
 * Pemanggilan API untuk modul SOP & Logistik Material
 *
 * Service ini bertanggung jawab melakukan mapping antara format API
 * (snake_case, sesuai Sequelize model) dan format UI (camelCase).
 */

import api from '../lib/api';
import { cleanParams } from '../lib/utils';
import type {
    ApiResponse,
    BarangKeluar,
    BarangKeluarItem,
    InventarisLapangan,
    PaginatedResponse,
    PermintaanMaterial,
    PermintaanMaterialItem,
    SuratJalan,
    SuratJalanItem,
    TandaTerimaGudang,
    TTGItem,
} from '../types';

// ── Mapping helpers: API → UI ──────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapPermintaanItem(i: any): PermintaanMaterialItem {
  return {
    id: i.id,
    namaBarang: i.item_name ?? i.namaBarang ?? '',
    qty: Number(i.qty_requested ?? i.qty ?? 0),
    satuan: i.unit ?? i.satuan ?? '',
    keterangan: i.notes ?? i.keterangan ?? '',
  };
}

function mapPermintaan(r: any): PermintaanMaterial {
  return {
    id: String(r.id),
    noForm: r.nomor ?? r.noForm ?? '',
    tanggal: r.request_date ?? r.tanggal ?? '',
    divisi: r.divisi ?? '',
    namaPeminta: r.requester?.name ?? r.namaPeminta ?? '',
    status: r.status ?? 'Draft',
    disetujui: r.disetujui ?? '',
    diperiksa: r.diperiksa ?? '',
    createdAt: r.created_at ?? r.createdAt ?? '',
    items: (r.items ?? []).map(mapPermintaanItem),
  };
}

function mapTTGItem(i: any): TTGItem {
  return {
    id: i.id,
    namaBarang: i.item_name ?? i.namaBarang ?? '',
    qty: Number(i.qty_received ?? i.qty ?? 0),
    satuan: i.unit ?? i.satuan ?? '',
    kondisi: i.condition ?? i.kondisi ?? 'Baik',
  };
}

function mapTTG(r: any): TandaTerimaGudang {
  return {
    id: String(r.id),
    noTerima: r.nomor ?? r.noTerima ?? '',
    tanggal: r.receive_date ?? r.tanggal ?? '',
    supplier: r.supplier ?? '',
    penerima: r.receiver?.name ?? r.penerima ?? '',
    status: r.status ?? 'Draft',
    createdAt: r.created_at ?? r.createdAt ?? '',
    items: (r.items ?? []).map(mapTTGItem),
  };
}

function mapBKItem(i: any): BarangKeluarItem {
  return {
    id: i.id,
    namaBarang: i.item_name ?? i.namaBarang ?? '',
    qty: Number(i.qty ?? 0),
    satuan: i.unit ?? i.satuan ?? '',
    keterangan: i.notes ?? i.keterangan ?? '',
  };
}

function mapBK(r: any): BarangKeluar {
  return {
    id: String(r.id),
    noForm: r.nomor ?? r.noForm ?? '',
    tanggal: r.issue_date ?? r.tanggal ?? '',
    tujuan: r.received_by ?? r.tujuan ?? '',
    penerima: r.received_by ?? r.penerima ?? '',
    project: r.project ?? '',
    status: r.status ?? 'Draft',
    createdAt: r.created_at ?? r.createdAt ?? '',
    items: (r.items ?? []).map(mapBKItem),
  };
}

function mapInventaris(r: any): InventarisLapangan {
  return {
    id: String(r.id),
    kode: r.kode ?? '',
    namaBarang: r.item_name ?? r.namaBarang ?? '',
    kategori: r.category ?? r.kategori ?? '',
    lokasi: r.location ?? r.lokasi ?? '',
    kondisi: r.condition ?? r.kondisi ?? 'Baik',
    qty: Number(r.qty ?? 0),
    satuan: r.unit ?? r.satuan ?? '',
    tanggalCatat: r.last_check ?? r.tanggalCatat ?? '',
    penanggungJawab: r.penanggungJawab ?? '',
    createdAt: r.created_at ?? r.createdAt ?? '',
    updatedAt: r.updated_at ?? r.updatedAt ?? '',
  };
}

function mapSJItem(i: any): SuratJalanItem {
  return {
    id: i.id,
    namaBarang: i.item_name ?? i.namaBarang ?? '',
    satuan: i.unit ?? i.satuan ?? '',
    jumlah: Number(i.qty ?? i.jumlah ?? 0),
    keterangan: i.notes ?? i.keterangan ?? '',
  };
}

function mapSJ(r: any): SuratJalan {
  return {
    id: String(r.id),
    nomorSurat: r.nomor ?? r.nomorSurat ?? '',
    tanggal: r.send_date ?? r.tanggal ?? '',
    nomorPO: r.nomorPO ?? '',
    kepada: r.destination ?? r.kepada ?? '',
    dikirimDengan: r.dikirimDengan ?? '',
    noPolisi: r.vehicle_no ?? r.noPolisi ?? '',
    namaPengemudi: r.driver_name ?? r.namaPengemudi ?? '',
    tandaTerima: r.tandaTerima ?? '',
    pengemudi: r.driver_name ?? r.pengemudi ?? '',
    mengetahui: r.issuer?.name ?? r.mengetahui ?? '',
    totalBarang: (r.items ?? []).reduce((s: number, i: any) => s + Number(i.qty ?? i.jumlah ?? 0), 0),
    status: r.status ?? 'Draft',
    createdAt: r.created_at ?? r.createdAt ?? '',
    items: (r.items ?? []).map(mapSJItem),
  };
}

// ── Mapping helpers: UI → API payload ──────────────────────────

function permintaanToApi(p: Partial<PermintaanMaterial>): Record<string, unknown> {
  return {
    nomor: p.noForm,
    request_date: p.tanggal,
    notes: '',
    items: (p.items ?? []).map(i => ({
      item_name: i.namaBarang,
      unit: i.satuan,
      qty_requested: i.qty,
      notes: i.keterangan ?? '',
    })),
  };
}

function ttgToApi(t: Partial<TandaTerimaGudang>): Record<string, unknown> {
  return {
    nomor: t.noTerima,
    receive_date: t.tanggal,
    supplier: t.supplier,
    notes: '',
    items: (t.items ?? []).map(i => ({
      item_name: i.namaBarang,
      unit: i.satuan,
      qty_received: i.qty,
      qty_ordered: i.qty,
      condition: i.kondisi ?? 'Baik',
      notes: '',
    })),
  };
}

function bkToApi(b: Partial<BarangKeluar>): Record<string, unknown> {
  return {
    nomor: b.noForm,
    issue_date: b.tanggal,
    received_by: b.penerima ?? b.tujuan,
    notes: '',
    items: (b.items ?? []).map(i => ({
      item_name: i.namaBarang,
      unit: i.satuan,
      qty: i.qty,
      notes: i.keterangan ?? '',
    })),
  };
}

function inventarisToApi(inv: Partial<InventarisLapangan>): Record<string, unknown> {
  return {
    item_name: inv.namaBarang,
    category: inv.kategori,
    unit: inv.satuan,
    qty: inv.qty,
    condition: inv.kondisi ?? 'Baik',
    location: inv.lokasi,
    last_check: inv.tanggalCatat,
    notes: '',
  };
}

function sjToApi(sj: Partial<SuratJalan>): Record<string, unknown> {
  return {
    nomor: sj.nomorSurat,
    send_date: sj.tanggal,
    driver_name: sj.namaPengemudi ?? sj.pengemudi,
    vehicle_no: sj.noPolisi,
    destination: sj.kepada,
    notes: '',
    items: (sj.items ?? []).map(i => ({
      item_name: i.namaBarang,
      unit: i.satuan,
      qty: i.jumlah,
      notes: i.keterangan ?? '',
    })),
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Service ────────────────────────────────────────────────────

export const sopService = {
  // ── Permintaan Material ──────────────────────────────────────
  async getPermintaan(params?: { status?: string; page?: number }): Promise<PaginatedResponse<PermintaanMaterial>> {
    const res = await api.get('/material-requests', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    const body = res.data;
    return { ...body, data: (body.data ?? []).map(mapPermintaan) };
  },

  async getPermintaanById(id: string): Promise<PermintaanMaterial> {
    const res = await api.get<ApiResponse<unknown>>(`/material-requests/${id}`);
    return mapPermintaan(res.data.data);
  },

  async createPermintaan(payload: Partial<PermintaanMaterial>): Promise<PermintaanMaterial> {
    const res = await api.post<ApiResponse<unknown>>('/material-requests', permintaanToApi(payload));
    return mapPermintaan(res.data.data);
  },

  async approvePermintaan(id: string): Promise<PermintaanMaterial> {
    const res = await api.patch<ApiResponse<unknown>>(`/material-requests/${id}/approve`);
    return mapPermintaan(res.data.data);
  },

  async rejectPermintaan(id: string): Promise<PermintaanMaterial> {
    const res = await api.patch<ApiResponse<unknown>>(`/material-requests/${id}/reject`);
    return mapPermintaan(res.data.data);
  },

  async removePermintaan(id: string): Promise<void> {
    await api.delete(`/material-requests/${id}`);
  },

  // ── Tanda Terima Gudang ──────────────────────────────────────
  async getTTG(params?: { status?: string; page?: number }): Promise<PaginatedResponse<TandaTerimaGudang>> {
    const res = await api.get('/warehouse-receipts', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    const body = res.data;
    return { ...body, data: (body.data ?? []).map(mapTTG) };
  },

  async createTTG(payload: Partial<TandaTerimaGudang>): Promise<TandaTerimaGudang> {
    const res = await api.post<ApiResponse<unknown>>('/warehouse-receipts', ttgToApi(payload));
    return mapTTG(res.data.data);
  },

  async verifyTTG(id: string): Promise<TandaTerimaGudang> {
    const res = await api.patch<ApiResponse<unknown>>(`/warehouse-receipts/${id}/verify`);
    return mapTTG(res.data.data);
  },

  async removeTTG(id: string): Promise<void> {
    await api.delete(`/warehouse-receipts/${id}`);
  },

  // ── Barang Keluar ────────────────────────────────────────────
  async getBarangKeluar(params?: { status?: string; page?: number }): Promise<PaginatedResponse<BarangKeluar>> {
    const res = await api.get('/goods-out', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    const body = res.data;
    return { ...body, data: (body.data ?? []).map(mapBK) };
  },

  async createBarangKeluar(payload: Partial<BarangKeluar>): Promise<BarangKeluar> {
    const res = await api.post<ApiResponse<unknown>>('/goods-out', bkToApi(payload));
    return mapBK(res.data.data);
  },

  async removeBarangKeluar(id: string): Promise<void> {
    await api.delete(`/goods-out/${id}`);
  },

  // ── Inventaris Lapangan ──────────────────────────────────────
  async getInventaris(params?: { kategori?: string; kondisi?: string; search?: string; page?: number }): Promise<PaginatedResponse<InventarisLapangan>> {
    const res = await api.get('/inventory', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    const body = res.data;
    return { ...body, data: (body.data ?? []).map(mapInventaris) };
  },

  async createInventaris(payload: Partial<InventarisLapangan>): Promise<InventarisLapangan> {
    const res = await api.post<ApiResponse<unknown>>('/inventory', inventarisToApi(payload));
    return mapInventaris(res.data.data);
  },

  async updateInventaris(id: string, payload: Partial<InventarisLapangan>): Promise<InventarisLapangan> {
    const res = await api.put<ApiResponse<unknown>>(`/inventory/${id}`, inventarisToApi(payload));
    return mapInventaris(res.data.data);
  },

  async removeInventaris(id: string): Promise<void> {
    await api.delete(`/inventory/${id}`);
  },

  // ── Surat Jalan ──────────────────────────────────────────────
  async getSuratJalan(params?: { status?: string; page?: number }): Promise<PaginatedResponse<SuratJalan>> {
    const res = await api.get('/delivery-orders', {
      params: params ? cleanParams(params as Record<string, unknown>) : undefined,
    });
    const body = res.data;
    return { ...body, data: (body.data ?? []).map(mapSJ) };
  },

  async createSuratJalan(payload: Partial<SuratJalan>): Promise<SuratJalan> {
    const res = await api.post<ApiResponse<unknown>>('/delivery-orders', sjToApi(payload));
    return mapSJ(res.data.data);
  },

  async updateSuratJalanStatus(id: string, status: string): Promise<SuratJalan> {
    const res = await api.patch<ApiResponse<unknown>>(`/delivery-orders/${id}/status`, { status });
    return mapSJ(res.data.data);
  },

  async removeSuratJalan(id: string): Promise<void> {
    await api.delete(`/delivery-orders/${id}`);
  },
};
