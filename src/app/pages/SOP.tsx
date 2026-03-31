import {
    Calendar,
    Check,
    ClipboardList,
    Edit2,
    FileText,
    Filter,
    Package,
    PackageCheck,
    PackageX,
    Plus,
    Printer,
    Search,
    Trash2,
    Truck,
    User,
    X
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useBarangKeluar, useConfirmDialog, useInventarisLapangan, usePermintaanMaterial, useSuratJalan, useTandaTerimaGudang } from '../../hooks';
import { sopService } from '../../services/sop.service';
import type { BarangKeluar, InventarisLapangan, PermintaanMaterial, SuratJalan, TandaTerimaGudang } from '../../types';
import { FormBarangKeluar } from '../components/FormBarangKeluar';
import { FormInventarisLapangan } from '../components/FormInventarisLapangan';
import { FormPermintaanMaterial } from '../components/FormPermintaanMaterial';
import { FormSuratJalan } from '../components/FormSuratJalan';
import { FormTandaTerimaGudang } from '../components/FormTandaTerimaGudang';
import { Modal } from '../components/ui/Modal';

type TabId = 'permintaan' | 'terima' | 'keluar' | 'inventaris' | 'surat-jalan';

export const SOP: React.FC = () => {
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<TabId>('permintaan');
  const [searchQuery, setSearchQuery] = useState('');

  // Hooks — sumber data dari API + operasi CRUD
  const {
    permintaanList, setPermintaanList,
    create: createPermintaan, update: updatePermintaan, remove: removePermintaan, approve: approvePermintaan, reject: rejectPermintaan,
  } = usePermintaanMaterial();
  const {
    ttgList, setTtgList,
    create: createTTG, update: updateTTG, remove: removeTTG, verify: verifyTTG,
  } = useTandaTerimaGudang();
  const {
    barangKeluarList, setBarangKeluarList,
    create: createBK, update: updateBK, remove: removeBK, verify: verifyBK
  } = useBarangKeluar();
  const {
    inventarisList, setInventarisList,
    create: createInventaris, update: updateInventaris, remove: removeInventaris,
  } = useInventarisLapangan();
  const {
    suratJalanList, setSuratJalanList,
    create: createSJ, update: updateSJ, remove: removeSJ, updateStatus: updateStatusSuratJalan,
  } = useSuratJalan();

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<TabId>('permintaan');
  const [showFormPermintaan, setShowFormPermintaan] = useState(false);
  const [editPermintaanData, setEditPermintaanData] = useState<PermintaanMaterial | null>(null);
  const [showFormTerima, setShowFormTerima] = useState(false);
  const [editTerimaData, setEditTerimaData] = useState<TandaTerimaGudang | null>(null);
  const [showFormKeluar, setShowFormKeluar] = useState(false);
  const [editKeluarData, setEditKeluarData] = useState<BarangKeluar | null>(null);
  const [showFormInventaris, setShowFormInventaris] = useState(false);
  const [editInventarisData, setEditInventarisData] = useState<InventarisLapangan | null>(null);
  const [showFormSuratJalan, setShowFormSuratJalan] = useState(false);
  const [editSuratJalanData, setEditSuratJalanData] = useState<SuratJalan | null>(null);

  const tabs = [
    { id: 'permintaan', label: 'Permintaan Material', icon: FileText },
    { id: 'terima', label: 'Terima Gudang', icon: PackageCheck },
    { id: 'keluar', label: 'Barang Keluar', icon: PackageX },
    { id: 'inventaris', label: 'Inventaris Lapangan', icon: ClipboardList },
    { id: 'surat-jalan', label: 'Surat Jalan', icon: Truck },
  ] as const;

  const handleOpenModal = (type: TabId) => {
    if (type === 'permintaan') {
      setEditPermintaanData(null);
      setShowFormPermintaan(true);
    } else if (type === 'terima') {
      setEditTerimaData(null);
      setShowFormTerima(true);
    } else if (type === 'keluar') {
      setEditKeluarData(null);
      setShowFormKeluar(true);
    } else if (type === 'inventaris') {
      setEditInventarisData(null);
      setShowFormInventaris(true);
    } else if (type === 'surat-jalan') {
      setEditSuratJalanData(null);
      setShowFormSuratJalan(true);
    } else {
      setModalType(type);
      setShowModal(true);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSavePermintaan = async (data: any) => {
    if (editPermintaanData) {
      await updatePermintaan(editPermintaanData.id, {
        noForm: data.noForm,
        tanggal: data.tanggal,
        divisi: data.divisi,
        namaPeminta: data.namaPeminta,
        items: data.items,
        disetujui: data.disetujui,
        diperiksa: data.diperiksa,
      });
    } else {
      await createPermintaan({
        noForm: data.noForm,
        tanggal: data.tanggal,
        divisi: data.divisi,
        namaPeminta: data.namaPeminta,
        items: data.items,
        disetujui: data.disetujui,
        diperiksa: data.diperiksa,
      });
    }
    setEditPermintaanData(null);
    setShowFormPermintaan(false);
  };

  const handleEditPermintaan = (item: PermintaanMaterial) => {
    setEditPermintaanData(item);
    setShowFormPermintaan(true);
  };

  const handleDeletePermintaan = async (id: string) => {
    if (await showConfirm({ title: 'Hapus Permintaan', description: 'Apakah Anda yakin ingin menghapus form permintaan ini?' })) {
      await removePermintaan(id);
    }
  };

  const handleApprovePermintaan = async (id: string) => {
    if (await showConfirm({ title: 'Setujui Permintaan', description: 'Permintaan material ini akan disetujui.', confirmText: 'Setujui' })) {
      await approvePermintaan(id);
    }
  };

  const handleRejectPermintaan = async (id: string) => {
    if (await showConfirm({ title: 'Tolak Permintaan', description: 'Permintaan material ini akan ditolak.', confirmText: 'Tolak', variant: 'danger' })) {
      await rejectPermintaan(id);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveTerima = async (data: any) => {
    const payload = {
      noTerima: data.noTerima,
      tanggal: data.tanggal,
      supplier: data.supplier,
      penerima: data.penerima,
      pengirim: data.pengirim,
      mengetahui: data.mengetahui,
      items: data.items.map((i: any) => ({ ...i, kondisi: i.kondisi || 'Baik' })), // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    if (editTerimaData) {
      await updateTTG(editTerimaData.id, payload);
    } else {
      await createTTG(payload);
    }
    setEditTerimaData(null);
    setShowFormTerima(false);
  };

  const handleEditTerima = (item: TandaTerimaGudang) => {
    setEditTerimaData(item);
    setShowFormTerima(true);
  };

  const handleDeleteTerima = async (id: string) => {
    if (await showConfirm({ title: 'Hapus Tanda Terima', description: 'Apakah Anda yakin ingin menghapus tanda terima ini?' })) {
      await removeTTG(id);
    }
  };

  const handleVerifyTerima = async (id: string) => {
    if (await showConfirm({ title: 'Verifikasi Tanda Terima Gudang', description: 'Selesaikan dan kunci dokumen TTG?', confirmText: 'Verifikasi' })) {
      await verifyTTG(id);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveKeluar = async (data: any) => {
    const payload = {
      noForm: data.noForm,
      tanggal: data.tanggal,
      tujuan: data.tujuan,
      penerima: data.penerima,
      project: data.project,
      projectId: data.projectId,
      disetujui: data.disetujui,
      diperiksa: data.diperiksa,
      items: data.items,
    };
    if (editKeluarData) {
      await updateBK(editKeluarData.id, payload);
    } else {
      await createBK(payload);
    }
    setEditKeluarData(null);
    setShowFormKeluar(false);
  };

  const handleEditKeluar = (item: BarangKeluar) => {
    setEditKeluarData(item);
    setShowFormKeluar(true);
  };

  const handleDeleteKeluar = async (id: string) => {
    if (await showConfirm({
      title: 'Hapus Tanda Bukti?',
      description: 'Apakah Anda yakin ingin menghapus data bukti barang keluar ini? Data yang dihapus tidak dapat direcovery.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    })) {
      try { await removeBK(id); } catch(err){}
    }
  };

  const handleVerifyKeluar = async (id: string) => {
    if (await showConfirm({
      title: 'Selesaikan Dokumen?',
      description: 'Status Barang Keluar akan diubah menjadi Selesai dan tidak dapat diedit lagi.',
      confirmText: 'Ya, Selesaikan',
      cancelText: 'Batal',
      variant: 'default',
    })) {
      try { await verifyBK(id); } catch (err) {}
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveInventaris = async (data: any) => {
    if (editInventarisData) {
      await updateInventaris(editInventarisData.id, {
        namaBarang: data.namaBarang,
        kategori: data.kategori,
        lokasi: data.lokasi,
        kondisi: data.kondisi,
        qty: data.qty,
        satuan: data.satuan,
        tanggalCatat: data.tanggalCatat,
        penanggungJawab: data.penanggungJawab,
        kode: data.kode,
        disetujui: data.disetujui,
        diperiksa: data.diperiksa,
        logistik: data.logistik,
      });
    } else if (data.items) {
      // Batch create from form table
      for (const item of data.items) {
        await createInventaris({
          namaBarang: item.uraian || item.namaBarang,
          kategori: 'Alat Kerja',
          lokasi: item.lokasi || 'Lapangan',
          kondisi: item.kondisi || 'Baik',
          qty: item.volume || item.qty || 0,
          satuan: item.satuan || 'Unit',
          tanggalCatat: item.tanggalPeminjaman || new Date().toISOString().slice(0, 10),
          penanggungJawab: data.penanggungJawab || 'Admin',
          disetujui: data.disetujui,
          diperiksa: data.diperiksa,
          logistik: data.logistik,
        });
      }
    } else {
      await createInventaris({
        namaBarang: data.namaBarang,
        kategori: data.kategori,
        lokasi: data.lokasi,
        kondisi: data.kondisi,
        qty: data.qty,
        satuan: data.satuan,
        tanggalCatat: data.tanggalCatat,
        penanggungJawab: data.penanggungJawab,
        kode: data.kode,
        disetujui: data.disetujui,
        diperiksa: data.diperiksa,
        logistik: data.logistik,
      });
    }
    setEditInventarisData(null);
    setShowFormInventaris(false);
  };

  const handleEditInventaris = (item: InventarisLapangan) => {
    setEditInventarisData(item);
    setShowFormInventaris(true);
  };

  const handleDeleteInventaris = async (id: string) => {
    if (await showConfirm({ title: 'Hapus Inventaris', description: 'Apakah Anda yakin ingin menghapus inventaris ini?' })) {
      await removeInventaris(id);
    }
  };

  const handleUpdateStatusSuratJalan = async (id: string, newStatus: string) => {
    if (await showConfirm({ title: `Tandai sebagai ${newStatus}?`, description: `Apakah Anda yakin ingin mengubah status surat jalan menjadi ${newStatus}?`, confirmText: 'Perbarui Status' })) {
      await updateStatusSuratJalan(id, newStatus);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveSuratJalan = async (data: any) => {
    if (editSuratJalanData) {
      await updateSJ(editSuratJalanData.id, {
        nomorSurat: data.nomorSurat,
        tanggal: data.tanggal,
        nomorPO: data.nomorPO,
        kepada: data.kepada,
        dikirimDengan: data.dikirimDengan,
        noPolisi: data.noPolisi,
        namaPengemudi: data.namaPengemudi,
        tandaTerima: data.tandaTerima,
        pengemudi: data.pengemudi,
        mengetahui: data.mengetahui,
        items: data.items,
        totalBarang: data.totalBarang,
      });
    } else {
      await createSJ({
        nomorSurat: data.nomorSurat,
        tanggal: data.tanggal,
        nomorPO: data.nomorPO,
        kepada: data.kepada,
        dikirimDengan: data.dikirimDengan,
        noPolisi: data.noPolisi,
        namaPengemudi: data.namaPengemudi,
        tandaTerima: data.tandaTerima,
        pengemudi: data.pengemudi,
        mengetahui: data.mengetahui,
        items: data.items,
        totalBarang: data.totalBarang,
      });
    }
    setEditSuratJalanData(null);
    setShowFormSuratJalan(false);
  };

  const handleEditSuratJalan = (item: SuratJalan) => {
    setEditSuratJalanData(item);
    setShowFormSuratJalan(true);
  };

  const handleDeleteSuratJalan = async (id: string) => {
    if (await showConfirm({ title: 'Hapus Surat Jalan', description: 'Apakah Anda yakin ingin menghapus surat jalan ini?' })) {
      await removeSJ(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'Pending': 'bg-yellow-50 text-yellow-600',
      'Disetujui': 'bg-green-50 text-green-600',
      'Ditolak': 'bg-red-50 text-red-600',
      'Selesai': 'bg-blue-50 text-blue-600',
      'Draft': 'bg-gray-50 text-gray-600',
      'Verified': 'bg-blue-50 text-blue-600',
      'Completed': 'bg-green-50 text-green-600',
      'Diproses': 'bg-yellow-50 text-yellow-600',
      'Dikirim': 'bg-blue-50 text-blue-600',
      'Diajukan': 'bg-yellow-50 text-yellow-600',
      'Diterima': 'bg-green-50 text-green-600',
      'Baik': 'bg-green-50 text-green-600',
      'Rusak Ringan': 'bg-yellow-50 text-yellow-600',
      'Rusak Berat': 'bg-red-50 text-red-600',
      'Hilang': 'bg-red-50 text-red-600',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-50 text-gray-600';
  };

  // ── Print Handlers ──────────────────────────────────────────
  const handleDownloadPdf = async (id: string, fileName: string, fetcher: (id: string) => Promise<Blob>) => {
    try {
      const toastId = toast.loading('Memproses PDF...');
      const blob = await fetcher(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF berhasil diunduh', { id: toastId });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal mengunduh PDF');
      console.error(e);
    }
  };

  const handlePrintPermintaan = (item: PermintaanMaterial) => {
    handleDownloadPdf(item.id, `PermintaanMaterial-${item.noForm}.pdf`, sopService.getPermintaanPdfBlobById);
  };

  const handlePrintTerima = (item: TandaTerimaGudang) => {
    handleDownloadPdf(item.id, `TTG-${item.noTerima}.pdf`, sopService.getTTGPdfBlobById);
  };

  const handlePrintKeluar = (item: BarangKeluar) => {
    handleDownloadPdf(item.id, `BarangKeluar-${item.noForm}.pdf`, sopService.getBarangKeluarPdfBlobById);
  };

  const handlePrintSuratJalan = (item: SuratJalan) => {
    handleDownloadPdf(item.id, `SuratJalan-${item.nomorSurat}.pdf`, sopService.getSuratJalanPdfBlobById);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'permintaan':
        return (
          <div className="space-y-4">
            {permintaanList.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{item.noForm}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {item.tanggal}</span>
                        <span className="flex items-center gap-1"><User size={12} /> {item.namaPeminta}</span>
                        <span className="font-bold text-primary">{item.divisi}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'Diajukan' && (
                        <>
                          <button className="p-2 hover:bg-green-50 rounded-lg transition-colors" title="Setujui" onClick={() => handleApprovePermintaan(item.id)}>
                            <Check size={16} className="text-green-600" />
                          </button>
                          <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Tolak" onClick={() => handleRejectPermintaan(item.id)}>
                            <X size={16} className="text-red-500" />
                          </button>
                        </>
                      )}
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Print" onClick={() => handlePrintPermintaan(item)}>
                        <Printer size={16} className="text-gray-500" />
                      </button>
                      {item.status !== 'Selesai' && item.status !== 'Disetujui' && item.status !== 'Ditolak' && (
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit" onClick={() => handleEditPermintaan(item)}>
                          <Edit2 size={16} className="text-gray-500" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Hapus" onClick={() => handleDeletePermintaan(item.id)}>
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-bold text-gray-500 uppercase w-[45%]">Nama Barang</th>
                          <th className="text-center py-2 font-bold text-gray-500 uppercase w-[15%]">Qty</th>
                          <th className="text-left py-2 font-bold text-gray-500 uppercase w-[40%]">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.items.map((material, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 font-medium text-gray-900">{material.namaBarang}</td>
                            <td className="py-2 text-center font-bold text-primary whitespace-nowrap">{material.qty} {material.satuan}</td>
                            <td className="py-2 text-gray-500">{material.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'terima':
        return (
          <div className="space-y-4">
            {ttgList.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{item.noTerima}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {item.tanggal}</span>
                        <span className="flex items-center gap-1"><Package size={12} /> {item.supplier}</span>
                        <span className="font-bold text-primary">Penerima: {item.penerima}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'Draft' && (
                        <button className="p-2 hover:bg-green-50 rounded-lg transition-colors" title="Verifikasi TTG" onClick={() => handleVerifyTerima(item.id)}>
                          <Check size={16} className="text-green-600" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Print" onClick={() => handlePrintTerima(item)}>
                        <Printer size={16} className="text-gray-500" />
                      </button>
                      {item.status !== 'Selesai' && (
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit" onClick={() => handleEditTerima(item)}>
                          <Edit2 size={16} className="text-gray-500" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Hapus" onClick={() => handleDeleteTerima(item.id)}>
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-bold text-gray-500 uppercase">Nama Barang</th>
                          <th className="text-center py-2 font-bold text-gray-500 uppercase">Qty</th>
                          <th className="text-center py-2 font-bold text-gray-500 uppercase">Kondisi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.items.map((material, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 font-medium text-gray-900">{material.namaBarang}</td>
                            <td className="py-2 text-center font-bold text-primary">{material.qty} {material.satuan}</td>
                            <td className="py-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(material.kondisi)}`}>
                                {material.kondisi}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'keluar':
        return (
          <div className="space-y-4">
            {barangKeluarList.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{item.noForm}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {item.tanggal}</span>
                        <span className="flex items-center gap-1"><Truck size={12} /> {item.tujuan}</span>
                      </div>
                      <div className="mt-1 text-xs">
                        <span className="text-gray-500">Penerima: </span>
                        <span className="font-bold text-primary">{item.penerima}</span>
                        <span className="text-gray-400 mx-2">•</span>
                        <span className="text-gray-500">Project: </span>
                        <span className="font-bold text-gray-900">{item.project}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'Draft' && (
                        <button className="p-2 hover:bg-green-50 rounded-lg transition-colors" title="Selesaikan" onClick={() => handleVerifyKeluar(item.id)}>
                          <Check size={16} className="text-green-600" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Print" onClick={() => handlePrintKeluar(item)}>
                        <Printer size={16} className="text-gray-500" />
                      </button>
                      {item.status !== 'Selesai' && (
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit" onClick={() => handleEditKeluar(item)}>
                          <Edit2 size={16} className="text-gray-500" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Hapus" onClick={() => handleDeleteKeluar(item.id)}>
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-bold text-gray-500 uppercase w-[45%]">Nama Barang</th>
                          <th className="text-center py-2 font-bold text-gray-500 uppercase w-[15%]">Qty</th>
                          <th className="text-left py-2 font-bold text-gray-500 uppercase w-[40%]">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.items.map((material, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 font-medium text-gray-900">{material.namaBarang}</td>
                            <td className="py-2 text-center font-bold text-primary whitespace-nowrap">{material.qty} {material.satuan}</td>
                            <td className="py-2 text-gray-500">{material.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'inventaris':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Kode</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Nama Barang</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Kategori</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Lokasi</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Qty</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Kondisi</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">PJ</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inventarisList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-primary text-sm">{item.kode}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 text-sm">{item.namaBarang}</div>
                          <div className="text-xs text-gray-500">{item.tanggalCatat}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{item.kategori}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 font-medium">{item.lokasi}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-primary">{item.qty} {item.satuan}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(item.kondisi)}`}>
                            {item.kondisi}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{item.penanggungJawab}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEditInventaris(item)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" 
                              title="Edit"
                            >
                              <Edit2 size={14} className="text-blue-600" />
                            </button>
                            <button 
                              onClick={() => handleDeleteInventaris(item.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" 
                              title="Hapus"
                            >
                              <Trash2 size={14} className="text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'surat-jalan':
        return (
          <div className="space-y-4">
            {suratJalanList.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{item.nomorSurat}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {item.tanggal}</span>
                        <span className="flex items-center gap-1"><Truck size={12} /> {item.noPolisi}</span>
                        <span className="font-bold text-primary">Driver: {item.namaPengemudi}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                        <div><span className="text-gray-500">Kepada:</span> <span className="font-bold text-gray-900">{item.kepada}</span></div>
                        <div><span className="text-gray-500">No. PO:</span> <span className="font-medium text-gray-700">{item.nomorPO}</span></div>
                        <div><span className="text-gray-500">Dikirim Dengan:</span> <span className="font-bold text-gray-900">{item.dikirimDengan}</span></div>
                        <div><span className="text-gray-500">Total Barang:</span> <span className="font-bold text-primary">{item.totalBarang}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'Draft' && (
                        <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Tandai Dikirim" onClick={() => handleUpdateStatusSuratJalan(item.id, 'Dikirim')}>
                          <Truck size={16} className="text-blue-600" />
                        </button>
                      )}
                      {item.status === 'Dikirim' && (
                        <button className="p-2 hover:bg-green-50 rounded-lg transition-colors" title="Tandai Diterima" onClick={() => handleUpdateStatusSuratJalan(item.id, 'Diterima')}>
                          <Check size={16} className="text-green-600" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Print" onClick={() => handlePrintSuratJalan(item)}>
                        <Printer size={16} className="text-gray-500" />
                      </button>
                      {item.status === 'Draft' && (
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit" onClick={() => handleEditSuratJalan(item)}>
                          <Edit2 size={16} className="text-gray-500" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Hapus" onClick={() => handleDeleteSuratJalan(item.id)}>
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-bold text-gray-500 uppercase">Nama Barang</th>
                          <th className="text-center py-2 font-bold text-gray-500 uppercase">Qty</th>
                          <th className="text-left py-2 font-bold text-gray-500 uppercase">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.items.map((material, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 font-medium text-gray-900">{material.namaBarang}</td>
                            <td className="py-2 text-center font-bold text-primary">{material.jumlah} {material.satuan}</td>
                            <td className="py-2 text-gray-500">{material.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {ConfirmDialogElement}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Standar Operasional Prosedur (SOP)</h2>
          <p className="text-gray-500">Kelola dokumen SOP operasional material, logistik, dan inventaris lapangan.</p>
        </div>
        <button 
          onClick={() => handleOpenModal(activeTab)}
          className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          <span>Buat {tabs.find(t => t.id === activeTab)?.label}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={`Cari ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium">
              <option>Semua Status</option>
              <option>Pending</option>
              <option>Disetujui</option>
              <option>Selesai</option>
            </select>
            <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* Modal placeholder - would contain forms for creating new entries */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={`Buat ${tabs.find(t => t.id === modalType)?.label}`}
        wide
      >
        <div className="text-center py-12 text-gray-500">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p>Form {tabs.find(t => t.id === modalType)?.label} akan ditampilkan di sini</p>
        </div>
      </Modal>

      {/* Form Permintaan Material */}
      <FormPermintaanMaterial 
        isOpen={showFormPermintaan} 
        onClose={() => setShowFormPermintaan(false)} 
        onSave={handleSavePermintaan}
        data={editPermintaanData}
      />

      {/* Form Tanda Terima Gudang */}
      <FormTandaTerimaGudang 
        isOpen={showFormTerima} 
        onClose={() => setShowFormTerima(false)} 
        onSave={handleSaveTerima}
        data={editTerimaData}
      />

      {/* Form Barang Keluar */}
      <FormBarangKeluar 
        isOpen={showFormKeluar} 
        onClose={() => setShowFormKeluar(false)} 
        onSave={handleSaveKeluar}
        data={editKeluarData}
      />

      {/* Form Inventaris Lapangan */}
      <FormInventarisLapangan 
        isOpen={showFormInventaris} 
        onClose={() => setShowFormInventaris(false)} 
        onSave={handleSaveInventaris}
        data={editInventarisData}
      />

      {/* Form Surat Jalan */}
      <FormSuratJalan 
        isOpen={showFormSuratJalan} 
        onClose={() => setShowFormSuratJalan(false)} 
        onSave={handleSaveSuratJalan}
        data={editSuratJalanData}
      />
    </div>
  );
};