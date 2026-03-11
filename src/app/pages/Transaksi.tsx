import { ArrowRightLeft, Calendar, Edit2, FileCheck, FileText, Plus, Trash2, User, XCircle, XOctagon } from 'lucide-react';
import React, { useState } from 'react';
import { useAkad, useBAST, useConfirmDialog, usePembatalan, usePindahUnit, usePPJB } from '../../hooks';
import { formatRupiah } from '../../lib/utils';
import type { Akad, BAST, Pembatalan, PindahUnit, PPJB } from '../../types';

// ── Status Badge ──────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Draft: 'bg-yellow-100 text-yellow-700',
    Ditandatangani: 'bg-green-100 text-green-700',
    Selesai: 'bg-green-100 text-green-700',
    Batal: 'bg-red-100 text-red-700',
    Proses: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ── Format tanggal ────────────────────────────────────────────────
function fmtDate(d?: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Input helpers ─────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm';
const labelCls = 'text-xs font-bold text-gray-400 uppercase tracking-widest';

// ── Initial form states ───────────────────────────────────────────
const emptyPPJB = { nomor_ppjb: '', consumer_id: '', housing_unit_id: '', tanggal_ppjb: '', harga_ppjb: '', status: 'Draft' as const, notes: '' };
const emptyAkad = { nomor_akad: '', consumer_id: '', housing_unit_id: '', tanggal_akad: '', bank: '', notaris: '', status: 'Draft' as const, notes: '' };
const emptyBAST = { nomor_bast: '', consumer_id: '', housing_unit_id: '', tanggal_bast: '', status: 'Draft' as const, notes: '' };
const emptyPindah = { consumer_id: '', unit_lama: '', unit_baru: '', tanggal_pindah: '', alasan: '', selisih_harga: '', status: 'Proses' as const };
const emptyPembatalan = { consumer_id: '', unit_code: '', tanggal_batal: '', alasan: '', refund_amount: '', status: 'Proses' as const };

// ══════════════════════════════════════════════════════════════════
export function Transaksi() {
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();

  // Data & CRUD from hooks — NO local data arrays
  const { ppjbList, isLoading: ppjbLoading, create: createPPJB, update: updatePPJB, remove: removePPJB } = usePPJB();
  const { akadList, isLoading: akadLoading, create: createAkad, update: updateAkad, remove: removeAkad } = useAkad();
  const { bastList, isLoading: bastLoading, create: createBAST, update: updateBAST, remove: removeBAST } = useBAST();
  const { pindahList, isLoading: pindahLoading, create: createPindah, update: updatePindah, remove: removePindah } = usePindahUnit();
  const { pembatalanList, isLoading: pembatalanLoading, create: createPembatalan, update: updatePembatalan, remove: removePembatalan } = usePembatalan();

  // UI-only state
  const [activeTab, setActiveTab] = useState<'ppjb' | 'akad' | 'bast' | 'pindah' | 'pembatalan'>('ppjb');

  // PPJB modals
  const [isAddPPJBOpen, setIsAddPPJBOpen] = useState(false);
  const [editingPPJB, setEditingPPJB] = useState<Partial<PPJB> | null>(null);
  const [newPPJB, setNewPPJB] = useState({ ...emptyPPJB });

  // Akad modals
  const [isAddAkadOpen, setIsAddAkadOpen] = useState(false);
  const [editingAkad, setEditingAkad] = useState<Partial<Akad> | null>(null);
  const [newAkad, setNewAkad] = useState({ ...emptyAkad });

  // BAST modals
  const [isAddBASTOpen, setIsAddBASTOpen] = useState(false);
  const [editingBAST, setEditingBAST] = useState<Partial<BAST> | null>(null);
  const [newBAST, setNewBAST] = useState({ ...emptyBAST });

  // Pindah Unit modals
  const [isAddPindahOpen, setIsAddPindahOpen] = useState(false);
  const [editingPindah, setEditingPindah] = useState<Partial<PindahUnit> | null>(null);
  const [newPindah, setNewPindah] = useState({ ...emptyPindah });

  // Pembatalan modals
  const [isAddPembatalanOpen, setIsAddPembatalanOpen] = useState(false);
  const [editingPembatalan, setEditingPembatalan] = useState<Partial<Pembatalan> | null>(null);
  const [newPembatalan, setNewPembatalan] = useState({ ...emptyPembatalan });

  // ── PPJB handlers ───────────────────────────────────────────────
  const handleAddPPJB = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPPJB({
        nomor_ppjb: newPPJB.nomor_ppjb,
        consumer_id: newPPJB.consumer_id || undefined,
        housing_unit_id: newPPJB.housing_unit_id || undefined,
        tanggal_ppjb: newPPJB.tanggal_ppjb,
        harga_ppjb: newPPJB.harga_ppjb ? Number(newPPJB.harga_ppjb) : undefined,
        status: newPPJB.status,
        notes: newPPJB.notes || undefined,
      });
      setNewPPJB({ ...emptyPPJB });
      setIsAddPPJBOpen(false);
    } catch { /* hook shows toast */ }
  };

  const handleUpdatePPJB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPPJB?.id) return;
    try {
      await updatePPJB(editingPPJB.id, editingPPJB);
      setEditingPPJB(null);
    } catch { /* hook shows toast */ }
  };

  const handleDeletePPJB = async (id: string) => {
    if (await showConfirm({ title: 'Hapus PPJB', description: 'Apakah Anda yakin ingin menghapus data PPJB ini?' })) {
      try { await removePPJB(id); } catch { /* hook shows toast */ }
    }
  };

  // ── Akad handlers ───────────────────────────────────────────────
  const handleAddAkad = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAkad({
        nomor_akad: newAkad.nomor_akad,
        consumer_id: newAkad.consumer_id || undefined,
        housing_unit_id: newAkad.housing_unit_id || undefined,
        tanggal_akad: newAkad.tanggal_akad,
        bank: newAkad.bank || undefined,
        notaris: newAkad.notaris || undefined,
        status: newAkad.status,
        notes: newAkad.notes || undefined,
      });
      setNewAkad({ ...emptyAkad });
      setIsAddAkadOpen(false);
    } catch { /* hook shows toast */ }
  };

  const handleUpdateAkad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAkad?.id) return;
    try {
      await updateAkad(editingAkad.id, editingAkad);
      setEditingAkad(null);
    } catch { /* hook shows toast */ }
  };

  const handleDeleteAkad = async (id: string) => {
    if (await showConfirm({ title: 'Hapus Akad', description: 'Apakah Anda yakin ingin menghapus data Akad ini?' })) {
      try { await removeAkad(id); } catch { /* hook shows toast */ }
    }
  };

  // ── BAST handlers ──────────────────────────────────────────────
  const handleAddBAST = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBAST({
        nomor_bast: newBAST.nomor_bast,
        consumer_id: newBAST.consumer_id || undefined,
        housing_unit_id: newBAST.housing_unit_id || undefined,
        tanggal_bast: newBAST.tanggal_bast,
        status: newBAST.status,
        notes: newBAST.notes || undefined,
      });
      setNewBAST({ ...emptyBAST });
      setIsAddBASTOpen(false);
    } catch { /* hook shows toast */ }
  };

  const handleUpdateBAST = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBAST?.id) return;
    try {
      await updateBAST(editingBAST.id, editingBAST);
      setEditingBAST(null);
    } catch { /* hook shows toast */ }
  };

  const handleDeleteBAST = async (id: string) => {
    if (await showConfirm({ title: 'Hapus BAST', description: 'Apakah Anda yakin ingin menghapus data BAST ini?' })) {
      try { await removeBAST(id); } catch { /* hook shows toast */ }
    }
  };

  // ── Pindah Unit handlers ────────────────────────────────────────
  const handleAddPindah = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPindah({
        consumer_id: newPindah.consumer_id || undefined,
        unit_lama: newPindah.unit_lama,
        unit_baru: newPindah.unit_baru,
        tanggal_pindah: newPindah.tanggal_pindah,
        alasan: newPindah.alasan || undefined,
        selisih_harga: newPindah.selisih_harga ? Number(newPindah.selisih_harga) : undefined,
        status: newPindah.status,
      });
      setNewPindah({ ...emptyPindah });
      setIsAddPindahOpen(false);
    } catch { /* hook shows toast */ }
  };

  const handleUpdatePindah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPindah?.id) return;
    try {
      await updatePindah(editingPindah.id, editingPindah);
      setEditingPindah(null);
    } catch { /* hook shows toast */ }
  };

  const handleDeletePindah = async (id: string) => {
    if (await showConfirm({ title: 'Hapus Pindah Unit', description: 'Apakah Anda yakin ingin menghapus data Pindah Unit ini?' })) {
      try { await removePindah(id); } catch { /* hook shows toast */ }
    }
  };

  // ── Pembatalan handlers ─────────────────────────────────────────
  const handleAddPembatalan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPembatalan({
        consumer_id: newPembatalan.consumer_id || undefined,
        unit_code: newPembatalan.unit_code,
        tanggal_batal: newPembatalan.tanggal_batal,
        alasan: newPembatalan.alasan,
        refund_amount: newPembatalan.refund_amount ? Number(newPembatalan.refund_amount) : undefined,
        status: newPembatalan.status,
      });
      setNewPembatalan({ ...emptyPembatalan });
      setIsAddPembatalanOpen(false);
    } catch { /* hook shows toast */ }
  };

  const handleUpdatePembatalan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPembatalan?.id) return;
    try {
      await updatePembatalan(editingPembatalan.id, editingPembatalan);
      setEditingPembatalan(null);
    } catch { /* hook shows toast */ }
  };

  const handleDeletePembatalan = async (id: string) => {
    if (await showConfirm({ title: 'Hapus Pembatalan', description: 'Apakah Anda yakin ingin menghapus data Pembatalan ini?' })) {
      try { await removePembatalan(id); } catch { /* hook shows toast */ }
    }
  };

  // ── Tabs config ─────────────────────────────────────────────────
  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'ppjb', label: 'PPJB' },
    { key: 'akad', label: 'Akad' },
    { key: 'bast', label: 'Serah Terima (BAST)' },
    { key: 'pindah', label: 'Pindah Unit' },
    { key: 'pembatalan', label: 'Pembatalan' },
  ];

  return (
    <div className="space-y-6 text-left">
      {ConfirmDialogElement}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Transaksi</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data transaksi perumahan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-6 py-4 font-bold text-sm transition-all relative whitespace-nowrap ${
                activeTab === t.key ? 'text-primary bg-primary/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t.label}
              {activeTab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── PPJB Tab ─────────────────────────────────────────── */}
          {activeTab === 'ppjb' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Data PPJB</h2>
                  <p className="text-xs text-gray-500 mt-1">Total {ppjbList.length} data PPJB</p>
                </div>
                <button onClick={() => setIsAddPPJBOpen(true)} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 text-sm">
                  <Plus size={18} /> Tambah PPJB
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="px-6 py-4">No. PPJB</th>
                        <th className="px-6 py-4">Konsumen</th>
                        <th className="px-6 py-4">Unit</th>
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4">Harga</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ppjbList.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><FileText size={18} className="text-primary" /></div>
                              <p className="font-bold text-gray-900">{item.nomor_ppjb || '-'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-400" />
                              <span className="font-bold text-gray-900">{item.consumer?.name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.housingUnit?.unit_code || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-600">{fmtDate(item.tanggal_ppjb)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.harga_ppjb ? formatRupiah(item.harga_ppjb) : '-'}</td>
                          <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setEditingPPJB(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={18} /></button>
                              <button onClick={() => handleDeletePPJB(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ppjbLoading && <div className="text-center py-12 text-gray-400">Memuat data...</div>}
                  {!ppjbLoading && ppjbList.length === 0 && (
                    <div className="text-center py-12">
                      <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-bold">Belum ada data PPJB</p>
                      <p className="text-sm text-gray-400 mt-1">Klik tombol "Tambah PPJB" untuk memulai</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Akad Tab ─────────────────────────────────────────── */}
          {activeTab === 'akad' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Data Akad</h2>
                  <p className="text-xs text-gray-500 mt-1">Total {akadList.length} data akad</p>
                </div>
                <button onClick={() => setIsAddAkadOpen(true)} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 text-sm">
                  <Plus size={18} /> Tambah Akad
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="px-6 py-4">No. Akad</th>
                        <th className="px-6 py-4">Konsumen</th>
                        <th className="px-6 py-4">Unit</th>
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4">Bank</th>
                        <th className="px-6 py-4">Notaris</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {akadList.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><FileCheck size={18} className="text-primary" /></div>
                              <p className="font-bold text-gray-900">{item.nomor_akad || '-'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-400" />
                              <span className="font-bold text-gray-900">{item.consumer?.name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.housingUnit?.unit_code || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-600">{fmtDate(item.tanggal_akad)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.bank || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.notaris || '-'}</td>
                          <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setEditingAkad(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={18} /></button>
                              <button onClick={() => handleDeleteAkad(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {akadLoading && <div className="text-center py-12 text-gray-400">Memuat data...</div>}
                  {!akadLoading && akadList.length === 0 && (
                    <div className="text-center py-12">
                      <FileCheck size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-bold">Belum ada data Akad</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── BAST Tab ─────────────────────────────────────────── */}
          {activeTab === 'bast' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Berita Acara Serah Terima (BAST)</h2>
                  <p className="text-xs text-gray-500 mt-1">Total {bastList.length} data BAST</p>
                </div>
                <button onClick={() => setIsAddBASTOpen(true)} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 text-sm">
                  <Plus size={18} /> Tambah BAST
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="px-6 py-4">No. BAST</th>
                        <th className="px-6 py-4">Konsumen</th>
                        <th className="px-6 py-4">Unit</th>
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bastList.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><FileCheck size={18} className="text-green-600" /></div>
                              <p className="font-bold text-gray-900">{item.nomor_bast || '-'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-400" />
                              <span className="font-bold text-gray-900">{item.consumer?.name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.housingUnit?.unit_code || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-600">{fmtDate(item.tanggal_bast)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setEditingBAST(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={18} /></button>
                              <button onClick={() => handleDeleteBAST(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bastLoading && <div className="text-center py-12 text-gray-400">Memuat data...</div>}
                  {!bastLoading && bastList.length === 0 && (
                    <div className="text-center py-12">
                      <FileCheck size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-bold">Belum ada data BAST</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Pindah Unit Tab ──────────────────────────────────── */}
          {activeTab === 'pindah' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Data Pindah Unit</h2>
                  <p className="text-xs text-gray-500 mt-1">Total {pindahList.length} data pindah unit</p>
                </div>
                <button onClick={() => setIsAddPindahOpen(true)} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 text-sm">
                  <Plus size={18} /> Tambah Pindah Unit
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="px-6 py-4">Konsumen</th>
                        <th className="px-6 py-4">Unit Lama</th>
                        <th className="px-6 py-4">Unit Baru</th>
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4">Selisih Harga</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pindahList.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><ArrowRightLeft size={18} className="text-orange-600" /></div>
                              <span className="font-bold text-gray-900">{item.consumer?.name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.unit_lama || '-'}</td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.unit_baru || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-600">{fmtDate(item.tanggal_pindah)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.selisih_harga != null ? formatRupiah(item.selisih_harga) : '-'}</td>
                          <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setEditingPindah(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={18} /></button>
                              <button onClick={() => handleDeletePindah(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pindahLoading && <div className="text-center py-12 text-gray-400">Memuat data...</div>}
                  {!pindahLoading && pindahList.length === 0 && (
                    <div className="text-center py-12">
                      <ArrowRightLeft size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-bold">Belum ada data pindah unit</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Pembatalan Tab ───────────────────────────────────── */}
          {activeTab === 'pembatalan' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Data Pembatalan</h2>
                  <p className="text-xs text-gray-500 mt-1">Total {pembatalanList.length} data pembatalan</p>
                </div>
                <button onClick={() => setIsAddPembatalanOpen(true)} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 text-sm">
                  <Plus size={18} /> Tambah Pembatalan
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="px-6 py-4">Konsumen</th>
                        <th className="px-6 py-4">Unit</th>
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4">Alasan</th>
                        <th className="px-6 py-4">Refund</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pembatalanList.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><XOctagon size={18} className="text-red-600" /></div>
                              <span className="font-bold text-gray-900">{item.consumer?.name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.unit_code || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-600">{fmtDate(item.tanggal_batal)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate">{item.alasan || '-'}</td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.refund_amount != null ? formatRupiah(item.refund_amount) : '-'}</td>
                          <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setEditingPembatalan(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={18} /></button>
                              <button onClick={() => handleDeletePembatalan(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pembatalanLoading && <div className="text-center py-12 text-gray-400">Memuat data...</div>}
                  {!pembatalanLoading && pembatalanList.length === 0 && (
                    <div className="text-center py-12">
                      <XOctagon size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-bold">Belum ada data pembatalan</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                      */}
      {/* ════════════════════════════════════════════════════════════ */}

      {/* ── Add PPJB Modal ─────────────────────────────────────────── */}
      {isAddPPJBOpen && (
        <ModalWrapper title="Tambah PPJB Baru" onClose={() => setIsAddPPJBOpen(false)}>
          <form onSubmit={handleAddPPJB} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="No. PPJB" required>
                <input required value={newPPJB.nomor_ppjb} onChange={(e) => setNewPPJB({ ...newPPJB, nomor_ppjb: e.target.value })} className={inputCls} placeholder="PPJB/001/2026" />
              </Field>
              <Field label="Tanggal PPJB" required>
                <input required type="date" value={newPPJB.tanggal_ppjb} onChange={(e) => setNewPPJB({ ...newPPJB, tanggal_ppjb: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Consumer ID">
                <input value={newPPJB.consumer_id} onChange={(e) => setNewPPJB({ ...newPPJB, consumer_id: e.target.value })} className={inputCls} placeholder="ID konsumen" />
              </Field>
              <Field label="Housing Unit ID">
                <input value={newPPJB.housing_unit_id} onChange={(e) => setNewPPJB({ ...newPPJB, housing_unit_id: e.target.value })} className={inputCls} placeholder="ID unit" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Harga PPJB">
                <input type="number" value={newPPJB.harga_ppjb} onChange={(e) => setNewPPJB({ ...newPPJB, harga_ppjb: e.target.value })} className={inputCls} placeholder="0" />
              </Field>
              <Field label="Status">
                <select value={newPPJB.status} onChange={(e) => setNewPPJB({ ...newPPJB, status: e.target.value as typeof newPPJB.status })} className={inputCls}>
                  <option value="Draft">Draft</option>
                  <option value="Ditandatangani">Ditandatangani</option>
                  <option value="Batal">Batal</option>
                </select>
              </Field>
            </div>
            <Field label="Catatan">
              <textarea value={newPPJB.notes} onChange={(e) => setNewPPJB({ ...newPPJB, notes: e.target.value })} className={inputCls} rows={3} placeholder="Catatan tambahan..." />
            </Field>
            <ModalFooter onCancel={() => setIsAddPPJBOpen(false)} />
          </form>
        </ModalWrapper>
      )}

      {/* ── Edit PPJB Modal ────────────────────────────────────────── */}
      {editingPPJB && (
        <ModalWrapper title="Edit PPJB" onClose={() => setEditingPPJB(null)}>
          <form onSubmit={handleUpdatePPJB} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="No. PPJB" required>
                <input required value={editingPPJB.nomor_ppjb ?? ''} onChange={(e) => setEditingPPJB({ ...editingPPJB, nomor_ppjb: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Tanggal PPJB" required>
                <input required type="date" value={editingPPJB.tanggal_ppjb ?? ''} onChange={(e) => setEditingPPJB({ ...editingPPJB, tanggal_ppjb: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Consumer ID">
                <input value={editingPPJB.consumer_id ?? ''} onChange={(e) => setEditingPPJB({ ...editingPPJB, consumer_id: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Housing Unit ID">
                <input value={editingPPJB.housing_unit_id ?? ''} onChange={(e) => setEditingPPJB({ ...editingPPJB, housing_unit_id: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Harga PPJB">
                <input type="number" value={editingPPJB.harga_ppjb ?? ''} onChange={(e) => setEditingPPJB({ ...editingPPJB, harga_ppjb: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} />
              </Field>
              <Field label="Status">
                <select value={editingPPJB.status ?? 'Draft'} onChange={(e) => setEditingPPJB({ ...editingPPJB, status: e.target.value as PPJB['status'] })} className={inputCls}>
                  <option value="Draft">Draft</option>
                  <option value="Ditandatangani">Ditandatangani</option>
                  <option value="Batal">Batal</option>
                </select>
              </Field>
            </div>
            <Field label="Catatan">
              <textarea value={editingPPJB.notes ?? ''} onChange={(e) => setEditingPPJB({ ...editingPPJB, notes: e.target.value })} className={inputCls} rows={3} />
            </Field>
            <ModalFooter onCancel={() => setEditingPPJB(null)} submitLabel="Simpan Perubahan" />
          </form>
        </ModalWrapper>
      )}

      {/* ── Add Akad Modal ─────────────────────────────────────────── */}
      {isAddAkadOpen && (
        <ModalWrapper title="Tambah Akad Baru" onClose={() => setIsAddAkadOpen(false)}>
          <form onSubmit={handleAddAkad} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="No. Akad" required>
                <input required value={newAkad.nomor_akad} onChange={(e) => setNewAkad({ ...newAkad, nomor_akad: e.target.value })} className={inputCls} placeholder="AKD/001/2026" />
              </Field>
              <Field label="Tanggal Akad" required>
                <input required type="date" value={newAkad.tanggal_akad} onChange={(e) => setNewAkad({ ...newAkad, tanggal_akad: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Consumer ID">
                <input value={newAkad.consumer_id} onChange={(e) => setNewAkad({ ...newAkad, consumer_id: e.target.value })} className={inputCls} placeholder="ID konsumen" />
              </Field>
              <Field label="Housing Unit ID">
                <input value={newAkad.housing_unit_id} onChange={(e) => setNewAkad({ ...newAkad, housing_unit_id: e.target.value })} className={inputCls} placeholder="ID unit" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bank">
                <input value={newAkad.bank} onChange={(e) => setNewAkad({ ...newAkad, bank: e.target.value })} className={inputCls} placeholder="Nama bank" />
              </Field>
              <Field label="Notaris">
                <input value={newAkad.notaris} onChange={(e) => setNewAkad({ ...newAkad, notaris: e.target.value })} className={inputCls} placeholder="Nama notaris" />
              </Field>
            </div>
            <Field label="Status">
              <select value={newAkad.status} onChange={(e) => setNewAkad({ ...newAkad, status: e.target.value as typeof newAkad.status })} className={inputCls}>
                <option value="Draft">Draft</option>
                <option value="Selesai">Selesai</option>
                <option value="Batal">Batal</option>
              </select>
            </Field>
            <Field label="Catatan">
              <textarea value={newAkad.notes} onChange={(e) => setNewAkad({ ...newAkad, notes: e.target.value })} className={inputCls} rows={3} placeholder="Catatan tambahan..." />
            </Field>
            <ModalFooter onCancel={() => setIsAddAkadOpen(false)} />
          </form>
        </ModalWrapper>
      )}

      {/* ── Edit Akad Modal ────────────────────────────────────────── */}
      {editingAkad && (
        <ModalWrapper title="Edit Akad" onClose={() => setEditingAkad(null)}>
          <form onSubmit={handleUpdateAkad} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="No. Akad" required>
                <input required value={editingAkad.nomor_akad ?? ''} onChange={(e) => setEditingAkad({ ...editingAkad, nomor_akad: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Tanggal Akad" required>
                <input required type="date" value={editingAkad.tanggal_akad ?? ''} onChange={(e) => setEditingAkad({ ...editingAkad, tanggal_akad: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Consumer ID">
                <input value={editingAkad.consumer_id ?? ''} onChange={(e) => setEditingAkad({ ...editingAkad, consumer_id: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Housing Unit ID">
                <input value={editingAkad.housing_unit_id ?? ''} onChange={(e) => setEditingAkad({ ...editingAkad, housing_unit_id: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bank">
                <input value={editingAkad.bank ?? ''} onChange={(e) => setEditingAkad({ ...editingAkad, bank: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Notaris">
                <input value={editingAkad.notaris ?? ''} onChange={(e) => setEditingAkad({ ...editingAkad, notaris: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <Field label="Status">
              <select value={editingAkad.status ?? 'Draft'} onChange={(e) => setEditingAkad({ ...editingAkad, status: e.target.value as Akad['status'] })} className={inputCls}>
                <option value="Draft">Draft</option>
                <option value="Selesai">Selesai</option>
                <option value="Batal">Batal</option>
              </select>
            </Field>
            <Field label="Catatan">
              <textarea value={editingAkad.notes ?? ''} onChange={(e) => setEditingAkad({ ...editingAkad, notes: e.target.value })} className={inputCls} rows={3} />
            </Field>
            <ModalFooter onCancel={() => setEditingAkad(null)} submitLabel="Simpan Perubahan" />
          </form>
        </ModalWrapper>
      )}

      {/* ── Add BAST Modal ─────────────────────────────────────────── */}
      {isAddBASTOpen && (
        <ModalWrapper title="Tambah BAST Baru" onClose={() => setIsAddBASTOpen(false)}>
          <form onSubmit={handleAddBAST} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="No. BAST" required>
                <input required value={newBAST.nomor_bast} onChange={(e) => setNewBAST({ ...newBAST, nomor_bast: e.target.value })} className={inputCls} placeholder="BAST/001/2026" />
              </Field>
              <Field label="Tanggal BAST" required>
                <input required type="date" value={newBAST.tanggal_bast} onChange={(e) => setNewBAST({ ...newBAST, tanggal_bast: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Consumer ID">
                <input value={newBAST.consumer_id} onChange={(e) => setNewBAST({ ...newBAST, consumer_id: e.target.value })} className={inputCls} placeholder="ID konsumen" />
              </Field>
              <Field label="Housing Unit ID">
                <input value={newBAST.housing_unit_id} onChange={(e) => setNewBAST({ ...newBAST, housing_unit_id: e.target.value })} className={inputCls} placeholder="ID unit" />
              </Field>
            </div>
            <Field label="Status">
              <select value={newBAST.status} onChange={(e) => setNewBAST({ ...newBAST, status: e.target.value as typeof newBAST.status })} className={inputCls}>
                <option value="Draft">Draft</option>
                <option value="Ditandatangani">Ditandatangani</option>
                <option value="Batal">Batal</option>
              </select>
            </Field>
            <Field label="Catatan">
              <textarea value={newBAST.notes} onChange={(e) => setNewBAST({ ...newBAST, notes: e.target.value })} className={inputCls} rows={3} placeholder="Catatan tambahan..." />
            </Field>
            <ModalFooter onCancel={() => setIsAddBASTOpen(false)} />
          </form>
        </ModalWrapper>
      )}

      {/* ── Edit BAST Modal ────────────────────────────────────────── */}
      {editingBAST && (
        <ModalWrapper title="Edit BAST" onClose={() => setEditingBAST(null)}>
          <form onSubmit={handleUpdateBAST} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="No. BAST" required>
                <input required value={editingBAST.nomor_bast ?? ''} onChange={(e) => setEditingBAST({ ...editingBAST, nomor_bast: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Tanggal BAST" required>
                <input required type="date" value={editingBAST.tanggal_bast ?? ''} onChange={(e) => setEditingBAST({ ...editingBAST, tanggal_bast: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Consumer ID">
                <input value={editingBAST.consumer_id ?? ''} onChange={(e) => setEditingBAST({ ...editingBAST, consumer_id: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Housing Unit ID">
                <input value={editingBAST.housing_unit_id ?? ''} onChange={(e) => setEditingBAST({ ...editingBAST, housing_unit_id: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <Field label="Status">
              <select value={editingBAST.status ?? 'Draft'} onChange={(e) => setEditingBAST({ ...editingBAST, status: e.target.value as BAST['status'] })} className={inputCls}>
                <option value="Draft">Draft</option>
                <option value="Ditandatangani">Ditandatangani</option>
                <option value="Batal">Batal</option>
              </select>
            </Field>
            <Field label="Catatan">
              <textarea value={editingBAST.notes ?? ''} onChange={(e) => setEditingBAST({ ...editingBAST, notes: e.target.value })} className={inputCls} rows={3} />
            </Field>
            <ModalFooter onCancel={() => setEditingBAST(null)} submitLabel="Simpan Perubahan" />
          </form>
        </ModalWrapper>
      )}

      {/* ── Add Pindah Unit Modal ──────────────────────────────────── */}
      {isAddPindahOpen && (
        <ModalWrapper title="Tambah Pindah Unit" onClose={() => setIsAddPindahOpen(false)}>
          <form onSubmit={handleAddPindah} className="p-6 space-y-4">
            <Field label="Consumer ID">
              <input value={newPindah.consumer_id} onChange={(e) => setNewPindah({ ...newPindah, consumer_id: e.target.value })} className={inputCls} placeholder="ID konsumen" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Unit Lama" required>
                <input required value={newPindah.unit_lama} onChange={(e) => setNewPindah({ ...newPindah, unit_lama: e.target.value })} className={inputCls} placeholder="Kode unit lama" />
              </Field>
              <Field label="Unit Baru" required>
                <input required value={newPindah.unit_baru} onChange={(e) => setNewPindah({ ...newPindah, unit_baru: e.target.value })} className={inputCls} placeholder="Kode unit baru" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tanggal Pindah" required>
                <input required type="date" value={newPindah.tanggal_pindah} onChange={(e) => setNewPindah({ ...newPindah, tanggal_pindah: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Selisih Harga">
                <input type="number" value={newPindah.selisih_harga} onChange={(e) => setNewPindah({ ...newPindah, selisih_harga: e.target.value })} className={inputCls} placeholder="0" />
              </Field>
            </div>
            <Field label="Status">
              <select value={newPindah.status} onChange={(e) => setNewPindah({ ...newPindah, status: e.target.value as typeof newPindah.status })} className={inputCls}>
                <option value="Proses">Proses</option>
                <option value="Selesai">Selesai</option>
                <option value="Batal">Batal</option>
              </select>
            </Field>
            <Field label="Alasan">
              <textarea value={newPindah.alasan} onChange={(e) => setNewPindah({ ...newPindah, alasan: e.target.value })} className={inputCls} rows={3} placeholder="Alasan pindah unit..." />
            </Field>
            <ModalFooter onCancel={() => setIsAddPindahOpen(false)} />
          </form>
        </ModalWrapper>
      )}

      {/* ── Edit Pindah Unit Modal ─────────────────────────────────── */}
      {editingPindah && (
        <ModalWrapper title="Edit Pindah Unit" onClose={() => setEditingPindah(null)}>
          <form onSubmit={handleUpdatePindah} className="p-6 space-y-4">
            <Field label="Consumer ID">
              <input value={editingPindah.consumer_id ?? ''} onChange={(e) => setEditingPindah({ ...editingPindah, consumer_id: e.target.value })} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Unit Lama" required>
                <input required value={editingPindah.unit_lama ?? ''} onChange={(e) => setEditingPindah({ ...editingPindah, unit_lama: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Unit Baru" required>
                <input required value={editingPindah.unit_baru ?? ''} onChange={(e) => setEditingPindah({ ...editingPindah, unit_baru: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tanggal Pindah" required>
                <input required type="date" value={editingPindah.tanggal_pindah ?? ''} onChange={(e) => setEditingPindah({ ...editingPindah, tanggal_pindah: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Selisih Harga">
                <input type="number" value={editingPindah.selisih_harga ?? ''} onChange={(e) => setEditingPindah({ ...editingPindah, selisih_harga: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} />
              </Field>
            </div>
            <Field label="Status">
              <select value={editingPindah.status ?? 'Proses'} onChange={(e) => setEditingPindah({ ...editingPindah, status: e.target.value as PindahUnit['status'] })} className={inputCls}>
                <option value="Proses">Proses</option>
                <option value="Selesai">Selesai</option>
                <option value="Batal">Batal</option>
              </select>
            </Field>
            <Field label="Alasan">
              <textarea value={editingPindah.alasan ?? ''} onChange={(e) => setEditingPindah({ ...editingPindah, alasan: e.target.value })} className={inputCls} rows={3} />
            </Field>
            <ModalFooter onCancel={() => setEditingPindah(null)} submitLabel="Simpan Perubahan" />
          </form>
        </ModalWrapper>
      )}

      {/* ── Add Pembatalan Modal ───────────────────────────────────── */}
      {isAddPembatalanOpen && (
        <ModalWrapper title="Tambah Pembatalan" onClose={() => setIsAddPembatalanOpen(false)}>
          <form onSubmit={handleAddPembatalan} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Consumer ID">
                <input value={newPembatalan.consumer_id} onChange={(e) => setNewPembatalan({ ...newPembatalan, consumer_id: e.target.value })} className={inputCls} placeholder="ID konsumen" />
              </Field>
              <Field label="Unit Code" required>
                <input required value={newPembatalan.unit_code} onChange={(e) => setNewPembatalan({ ...newPembatalan, unit_code: e.target.value })} className={inputCls} placeholder="Kode unit" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tanggal Batal" required>
                <input required type="date" value={newPembatalan.tanggal_batal} onChange={(e) => setNewPembatalan({ ...newPembatalan, tanggal_batal: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Refund Amount">
                <input type="number" value={newPembatalan.refund_amount} onChange={(e) => setNewPembatalan({ ...newPembatalan, refund_amount: e.target.value })} className={inputCls} placeholder="0" />
              </Field>
            </div>
            <Field label="Status">
              <select value={newPembatalan.status} onChange={(e) => setNewPembatalan({ ...newPembatalan, status: e.target.value as typeof newPembatalan.status })} className={inputCls}>
                <option value="Proses">Proses</option>
                <option value="Selesai">Selesai</option>
              </select>
            </Field>
            <Field label="Alasan" required>
              <textarea required value={newPembatalan.alasan} onChange={(e) => setNewPembatalan({ ...newPembatalan, alasan: e.target.value })} className={inputCls} rows={3} placeholder="Alasan pembatalan..." />
            </Field>
            <ModalFooter onCancel={() => setIsAddPembatalanOpen(false)} />
          </form>
        </ModalWrapper>
      )}

      {/* ── Edit Pembatalan Modal ──────────────────────────────────── */}
      {editingPembatalan && (
        <ModalWrapper title="Edit Pembatalan" onClose={() => setEditingPembatalan(null)}>
          <form onSubmit={handleUpdatePembatalan} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Consumer ID">
                <input value={editingPembatalan.consumer_id ?? ''} onChange={(e) => setEditingPembatalan({ ...editingPembatalan, consumer_id: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Unit Code" required>
                <input required value={editingPembatalan.unit_code ?? ''} onChange={(e) => setEditingPembatalan({ ...editingPembatalan, unit_code: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tanggal Batal" required>
                <input required type="date" value={editingPembatalan.tanggal_batal ?? ''} onChange={(e) => setEditingPembatalan({ ...editingPembatalan, tanggal_batal: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Refund Amount">
                <input type="number" value={editingPembatalan.refund_amount ?? ''} onChange={(e) => setEditingPembatalan({ ...editingPembatalan, refund_amount: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} />
              </Field>
            </div>
            <Field label="Status">
              <select value={editingPembatalan.status ?? 'Proses'} onChange={(e) => setEditingPembatalan({ ...editingPembatalan, status: e.target.value as Pembatalan['status'] })} className={inputCls}>
                <option value="Proses">Proses</option>
                <option value="Selesai">Selesai</option>
              </select>
            </Field>
            <Field label="Alasan" required>
              <textarea required value={editingPembatalan.alasan ?? ''} onChange={(e) => setEditingPembatalan({ ...editingPembatalan, alasan: e.target.value })} className={inputCls} rows={3} />
            </Field>
            <ModalFooter onCancel={() => setEditingPembatalan(null)} submitLabel="Simpan Perubahan" />
          </form>
        </ModalWrapper>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Shared sub-components (local to this file)
// ══════════════════════════════════════════════════════════════════

function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-left max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XCircle size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function ModalFooter({ onCancel, submitLabel = 'Simpan' }: { onCancel: () => void; submitLabel?: string }) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
      <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm">
        Batal
      </button>
      <button type="submit" className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm">
        {submitLabel}
      </button>
    </div>
  );
}
