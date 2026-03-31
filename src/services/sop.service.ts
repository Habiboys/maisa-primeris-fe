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
    disetujui: r.signature_disetujui ?? r.disetujui ?? '',
    diperiksa: r.signature_diperiksa ?? r.diperiksa ?? '',
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
    penerima: r.signature_penerima ?? r.receiver?.name ?? r.penerima ?? '',
    pengirim: r.signature_pengirim ?? r.pengirim ?? '',
    mengetahui: r.signature_mengetahui ?? r.mengetahui ?? '',
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
    project: r.projectModel?.name ?? r.project ?? '',
    projectId: r.project_id ?? '',
    status: r.status ?? 'Draft',
    disetujui: r.signature_disetujui ?? r.disetujui ?? '',
    diperiksa: r.signature_diperiksa ?? r.diperiksa ?? '',
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
    disetujui: r.signature_disetujui ?? r.disetujui ?? '',
    diperiksa: r.signature_diperiksa ?? r.diperiksa ?? '',
    logistik: r.signature_logistik ?? r.logistik ?? '',
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
    dikirimDengan: r.dikirim_dengan ?? r.dikirimDengan ?? '',
    noPolisi: r.vehicle_no ?? r.noPolisi ?? '',
    namaPengemudi: r.driver_name ?? r.namaPengemudi ?? '',
    tandaTerima: r.tandaTerima ?? '',
    pengemudi: r.signature_pengemudi ?? r.driver_name ?? r.pengemudi ?? '',
    mengetahui: r.signature_mengetahui ?? r.issuer?.name ?? r.mengetahui ?? '',
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
    divisi: p.divisi,
    signature_disetujui: p.disetujui,
    signature_diperiksa: p.diperiksa,
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
    signature_pengirim: t.pengirim,
    signature_penerima: t.penerima,
    signature_mengetahui: t.mengetahui,
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
    project_id: b.projectId,
    signature_disetujui: b.disetujui,
    signature_diperiksa: b.diperiksa,
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
    kode: inv.kode,
    item_name: inv.namaBarang,
    category: inv.kategori,
    unit: inv.satuan,
    qty: inv.qty,
    condition: inv.kondisi ?? 'Baik',
    location: inv.lokasi,
    last_check: inv.tanggalCatat,
    signature_disetujui: inv.disetujui,
    signature_diperiksa: inv.diperiksa,
    signature_logistik: inv.logistik,
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
    dikirim_dengan: sj.dikirimDengan,
    signature_pengemudi: sj.pengemudi,
    signature_mengetahui: sj.mengetahui,
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

  async updatePermintaan(id: string, payload: Partial<PermintaanMaterial>): Promise<PermintaanMaterial> {
    const res = await api.put<ApiResponse<unknown>>(`/material-requests/${id}`, permintaanToApi(payload));
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

  async getPermintaanPreviewHtml(payload: Record<string, unknown>): Promise<string> {
    const res = await api.post('/sop/preview/permintaan', payload, { responseType: 'text' });
    return res.data as string;
  },

  async getPermintaanPdfBlob(payload: Record<string, unknown>): Promise<Blob> {
    const res = await api.post('/sop/pdf/permintaan', payload, { responseType: 'blob' });
    return res.data as Blob;
  },

  async getPermintaanPdfBlobById(id: string): Promise<Blob> {
    const res = await api.get(`/material-requests/${id}/pdf`, { responseType: 'blob' });
    return res.data as Blob;
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

  async updateTTG(id: string, payload: Partial<TandaTerimaGudang>): Promise<TandaTerimaGudang> {
    const res = await api.put<ApiResponse<unknown>>(`/warehouse-receipts/${id}`, ttgToApi(payload));
    return mapTTG(res.data.data);
  },

  async verifyTTG(id: string): Promise<TandaTerimaGudang> {
    const res = await api.patch<ApiResponse<unknown>>(`/warehouse-receipts/${id}/verify`);
    return mapTTG(res.data.data);
  },

  async removeTTG(id: string): Promise<void> {
    await api.delete(`/warehouse-receipts/${id}`);
  },

  async getTTGPreviewHtml(payload: Record<string, unknown>): Promise<string> {
    const res = await api.post('/sop/preview/ttg', payload, { responseType: 'text' });
    return res.data as string;
  },

  async getTTGPdfBlob(payload: Record<string, unknown>): Promise<Blob> {
    const res = await api.post('/sop/pdf/ttg', payload, { responseType: 'blob' });
    return res.data as Blob;
  },

  async getTTGPdfBlobById(id: string): Promise<Blob> {
    const res = await api.get(`/warehouse-receipts/${id}/pdf`, { responseType: 'blob' });
    return res.data as Blob;
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

  async updateBarangKeluar(id: string, payload: Partial<BarangKeluar>): Promise<BarangKeluar> {
    const res = await api.put<ApiResponse<unknown>>(`/goods-out/${id}`, bkToApi(payload));
    return mapBK(res.data.data);
  },

  async verifyBarangKeluar(id: string): Promise<BarangKeluar> {
    const res = await api.patch<ApiResponse<unknown>>(`/goods-out/${id}/verify`);
    return mapBK(res.data.data);
  },

  async removeBarangKeluar(id: string): Promise<void> {
    await api.delete(`/goods-out/${id}`);
  },

  async getBarangKeluarPreviewHtml(payload: Record<string, unknown>): Promise<string> {
    const res = await api.post('/sop/preview/barang-keluar', payload, { responseType: 'text' });
    return res.data as string;
  },

  async getBarangKeluarPdfBlob(payload: Record<string, unknown>): Promise<Blob> {
    const res = await api.post('/sop/pdf/barang-keluar', payload, { responseType: 'blob' });
    return res.data as Blob;
  },

  async getBarangKeluarPdfBlobById(id: string): Promise<Blob> {
    const res = await api.get(`/goods-out/${id}/pdf`, { responseType: 'blob' });
    return res.data as Blob;
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

  async getInventarisPreviewHtml(payload: Record<string, unknown>): Promise<string> {
    const res = await api.post('/sop/preview/inventaris', payload, { responseType: 'text' });
    return res.data as string;
  },

  async getInventarisPdfBlob(payload: Record<string, unknown>): Promise<Blob> {
    const res = await api.post('/sop/pdf/inventaris', payload, { responseType: 'blob' });
    return res.data as Blob;
  },

  async getInventarisPdfBlobById(id: string): Promise<Blob> {
    const res = await api.get(`/inventory/${id}/pdf`, { responseType: 'blob' });
    return res.data as Blob;
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

  async updateSuratJalan(id: string, payload: Partial<SuratJalan>): Promise<SuratJalan> {
    const res = await api.put<ApiResponse<unknown>>(`/delivery-orders/${id}`, sjToApi(payload));
    return mapSJ(res.data.data);
  },

  async updateSuratJalanStatus(id: string, status: string): Promise<SuratJalan> {
    const res = await api.patch<ApiResponse<unknown>>(`/delivery-orders/${id}/status`, { status });
    return mapSJ(res.data.data);
  },

  async removeSuratJalan(id: string): Promise<void> {
    await api.delete(`/delivery-orders/${id}`);
  },

  async getSuratJalanPreviewHtml(payload: Record<string, unknown>): Promise<string> {
    const res = await api.post('/sop/preview/surat-jalan', payload, { responseType: 'text' });
    return res.data as string;
  },

  async getSuratJalanPdfBlob(payload: Record<string, unknown>): Promise<Blob> {
    const res = await api.post('/sop/pdf/surat-jalan', payload, { responseType: 'blob' });
    return res.data as Blob;
  },

  async getSuratJalanPdfBlobById(id: string): Promise<Blob> {
    const res = await api.get(`/delivery-orders/${id}/pdf`, { responseType: 'blob' });
    return res.data as Blob;
  },
};
