import { ArrowRightLeft, Calendar, Edit2, FileCheck, FileText, Plus, Search, Trash2, User, XCircle, XOctagon } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useAkad, useBAST, useConfirmDialog, useHousingUnits, usePembatalan, usePindahUnit, usePPJB, useProjects } from '../../hooks';
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
const emptyPindah = { consumer_id: '', housing_unit_id_lama: '', housing_unit_id_baru: '', tanggal_pindah: '', alasan: '', selisih_harga: '', status: 'Proses' as const };
const emptyPembatalan = { consumer_id: '', housing_unit_id: '', tanggal_batal: '', alasan: '', refund_amount: '', status: 'Proses' as const };

// ── Pagination bar (reusable) ─────────────────────────────────────
function PaginationBar(
  { page, totalPages, total, perPage, onPageChange, onPerPageChange }:
  { page: number; totalPages: number; total: number; perPage: number; onPageChange: (p: number) => void; onPerPageChange: (n: number) => void }
) {
  if (totalPages <= 0) return null;
  return (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-4">
        <span className="text-gray-600 font-medium">Halaman {page} dari {totalPages} ({total} data)</span>
        <select value={perPage} onChange={(e) => onPerPageChange(Number(e.target.value))} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 focus:ring-2 focus:ring-primary outline-none">
          <option value={10}>10 per halaman</option>
          <option value={20}>20 per halaman</option>
          <option value={50}>50 per halaman</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))} className="px-4 py-2 rounded-lg font-bold border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Sebelumnya</button>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))} className="px-4 py-2 rounded-lg font-bold border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Selanjutnya</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
export function Transaksi() {
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  const { projects } = useProjects();

  // Per-tab list params (search, page, perPage)
  const [ppjbSearch, setPpjbSearch] = useState('');
  const [ppjbPage, setPpjbPage] = useState(1);
  const [ppjbPerPage, setPpjbPerPage] = useState(10);
  const ppjbParams = useMemo(() => ({ search: ppjbSearch || undefined, page: ppjbPage, limit: ppjbPerPage }), [ppjbSearch, ppjbPage, ppjbPerPage]);
  const [akadSearch, setAkadSearch] = useState('');
  const [akadPage, setAkadPage] = useState(1);
  const [akadPerPage, setAkadPerPage] = useState(10);
  const akadParams = useMemo(() => ({ search: akadSearch || undefined, page: akadPage, limit: akadPerPage }), [akadSearch, akadPage, akadPerPage]);
  const [bastSearch, setBastSearch] = useState('');
  const [bastPage, setBastPage] = useState(1);
  const [bastPerPage, setBastPerPage] = useState(10);
  const bastParams = useMemo(() => ({ search: bastSearch || undefined, page: bastPage, limit: bastPerPage }), [bastSearch, bastPage, bastPerPage]);
  const [pindahSearch, setPindahSearch] = useState('');
  const [pindahPage, setPindahPage] = useState(1);
  const [pindahPerPage, setPindahPerPage] = useState(10);
  const pindahParams = useMemo(() => ({ search: pindahSearch || undefined, page: pindahPage, limit: pindahPerPage }), [pindahSearch, pindahPage, pindahPerPage]);
  const [pembatalanSearch, setPembatalanSearch] = useState('');
  const [pembatalanPage, setPembatalanPage] = useState(1);
  const [pembatalanPerPage, setPembatalanPerPage] = useState(10);
  const pembatalanParams = useMemo(() => ({ search: pembatalanSearch || undefined, page: pembatalanPage, limit: pembatalanPerPage }), [pembatalanSearch, pembatalanPage, pembatalanPerPage]);

  const { ppjbList, pagination: ppjbPagination, isLoading: ppjbLoading, create: createPPJB, update: updatePPJB, remove: removePPJB } = usePPJB(ppjbParams);
  const { akadList, pagination: akadPagination, isLoading: akadLoading, create: createAkad, update: updateAkad, remove: removeAkad } = useAkad(akadParams);
  const { bastList, pagination: bastPagination, isLoading: bastLoading, create: createBAST, update: updateBAST, remove: removeBAST } = useBAST(bastParams);
  const { pindahList, pagination: pindahPagination, isLoading: pindahLoading, create: createPindah, update: updatePindah, remove: removePindah } = usePindahUnit(pindahParams);
  const { pembatalanList, pagination: pembatalanPagination, isLoading: pembatalanLoading, create: createPembatalan, update: updatePembatalan, remove: removePembatalan } = usePembatalan(pembatalanParams);

  // UI-only state
  const [activeTab, setActiveTab] = useState<'ppjb' | 'akad' | 'bast' | 'pindah' | 'pembatalan'>('ppjb');

  // Form unit selection: project + unit (per form)
  const [ppjbProjectId, setPpjbProjectId] = useState('');
  const [ppjbUnitId, setPpjbUnitId] = useState('');
  const ppjbUnits = useHousingUnits(undefined, { limit: 500, project_id: ppjbProjectId || undefined });
  const [akadProjectId, setAkadProjectId] = useState('');
  const [akadUnitId, setAkadUnitId] = useState('');
  const akadUnits = useHousingUnits(undefined, { limit: 500, project_id: akadProjectId || undefined });
  const [bastProjectId, setBastProjectId] = useState('');
  const [bastUnitId, setBastUnitId] = useState('');
  const bastUnits = useHousingUnits(undefined, { limit: 500, project_id: bastProjectId || undefined });
  const [pindahProjectLama, setPindahProjectLama] = useState('');
  const [pindahUnitLama, setPindahUnitLama] = useState('');
  const [pindahProjectBaru, setPindahProjectBaru] = useState('');
  const [pindahUnitBaru, setPindahUnitBaru] = useState('');
  const pindahUnitsLama = useHousingUnits(undefined, { limit: 500, project_id: pindahProjectLama || undefined });
  const pindahUnitsBaru = useHousingUnits(undefined, { limit: 500, project_id: pindahProjectBaru || undefined });
  const [pembatalanProjectId, setPembatalanProjectId] = useState('');
  const [pembatalanUnitId, setPembatalanUnitId] = useState('');
  const pembatalanUnits = useHousingUnits(undefined, { limit: 500, project_id: pembatalanProjectId || undefined });

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
        housing_unit_id: ppjbUnitId || undefined,
        tanggal_ppjb: newPPJB.tanggal_ppjb,
        harga_ppjb: newPPJB.harga_ppjb ? Number(newPPJB.harga_ppjb) : undefined,
        status: newPPJB.status,
        notes: newPPJB.notes || undefined,
      });
      setNewPPJB({ ...emptyPPJB });
      setPpjbProjectId(''); setPpjbUnitId('');
      setIsAddPPJBOpen(false);
    } catch { /* hook shows toast */ }
  };

  const handleUpdatePPJB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPPJB?.id) return;
    try {
      await updatePPJB(editingPPJB.id, { ...editingPPJB, housing_unit_id: ppjbUnitId || undefined });
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
        housing_unit_id: akadUnitId || undefined,
        tanggal_akad: newAkad.tanggal_akad,
        bank: newAkad.bank || undefined,
        notaris: newAkad.notaris || undefined,
        status: newAkad.status,
        notes: newAkad.notes || undefined,
      });
      setNewAkad({ ...emptyAkad });
      setAkadProjectId(''); setAkadUnitId('');
      setIsAddAkadOpen(false);
    } catch { /* hook shows toast */ }
  };

  const handleUpdateAkad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAkad?.id) return;
    try {
      await updateAkad(editingAkad.id, { ...editingAkad, housing_unit_id: akadUnitId || undefined });
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
        housing_unit_id: bastUnitId || undefined,
        tanggal_bast: newBAST.tanggal_bast,
        status: newBAST.status,
        notes: newBAST.notes || undefined,
      });
      setNewBAST({ ...emptyBAST });
      setBastProjectId(''); setBastUnitId('');
      setIsAddBASTOpen(false);
    } catch { /* hook shows toast */ }
  };

  const handleUpdateBAST = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBAST?.id) return;
    try {
      await updateBAST(editingBAST.id, { ...editingBAST, housing_unit_id: bastUnitId || undefined });
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
        housing_unit_id_lama: pindahUnitLama || undefined,
        housing_unit_id_baru: pindahUnitBaru || undefined,
        tanggal_pindah: newPindah.tanggal_pindah,
        alasan: newPindah.alasan || undefined,
        selisih_harga: newPindah.selisih_harga ? Number(newPindah.selisih_harga) : undefined,
        status: newPindah.status,
      });
      setNewPindah({ ...emptyPindah });
      setPindahProjectLama(''); setPindahUnitLama(''); setPindahProjectBaru(''); setPindahUnitBaru('');
      setIsAddPindahOpen(false);
    } catch { /* hook shows toast */ }
  };

  const handleUpdatePindah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPindah?.id) return;
    try {
      await updatePindah(editingPindah.id, {
        ...editingPindah,
        housing_unit_id_lama: pindahUnitLama || undefined,
        housing_unit_id_baru: pindahUnitBaru || undefined,
      });
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
        housing_unit_id: pembatalanUnitId || undefined,
        tanggal_batal: newPembatalan.tanggal_batal,
        alasan: newPembatalan.alasan,
        refund_amount: newPembatalan.refund_amount ? Number(newPembatalan.refund_amount) : undefined,
        status: newPembatalan.status,
      });
      setNewPembatalan({ ...emptyPembatalan });
      setPembatalanProjectId(''); setPembatalanUnitId('');
      setIsAddPembatalanOpen(false);
    } catch { /* hook shows toast */ }
  };

  const handleUpdatePembatalan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPembatalan?.id) return;
    try {
      await updatePembatalan(editingPembatalan.id, { ...editingPembatalan, housing_unit_id: pembatalanUnitId || undefined });
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
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-gray-900">Data PPJB</h2>
                  <p className="text-xs text-gray-500 mt-1">Total {ppjbPagination?.total ?? ppjbList.length} data PPJB</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Cari nomor PPJB..." value={ppjbSearch} onChange={(e) => { setPpjbSearch(e.target.value); setPpjbPage(1); }} className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <button onClick={() => setIsAddPPJBOpen(true)} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 text-sm">
                    <Plus size={18} /> Tambah PPJB
                  </button>
                </div>
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
                              <button onClick={() => { setEditingPPJB(item); setPpjbProjectId(item.housingUnit?.project_id ?? ''); setPpjbUnitId(item.housing_unit_id ?? ''); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={18} /></button>
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
                {ppjbPagination && ppjbPagination.total_pages > 0 && (
                  <PaginationBar page={ppjbPagination.page} totalPages={ppjbPagination.total_pages} total={ppjbPagination.total} perPage={ppjbPerPage} onPageChange={setPpjbPage} onPerPageChange={(n) => { setPpjbPerPage(n); setPpjbPage(1); }} />
                )}
              </div>
            </div>
          )}

          {/* ── Akad Tab ─────────────────────────────────────────── */}
          {activeTab === 'akad' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-gray-900">Data Akad</h2>
                  <p className="text-xs text-gray-500 mt-1">Total {akadPagination?.total ?? akadList.length} data akad</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Cari nomor akad..." value={akadSearch} onChange={(e) => { setAkadSearch(e.target.value); setAkadPage(1); }} className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <button onClick={() => setIsAddAkadOpen(true)} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 text-sm">
                    <Plus size={18} /> Tambah Akad
                  </button>
                </div>
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
                              <button onClick={() => { setEditingAkad(item); setAkadProjectId(item.housingUnit?.project_id ?? ''); setAkadUnitId(item.housing_unit_id ?? ''); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={18} /></button>
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
                {akadPagination && akadPagination.total_pages > 0 && (
                  <PaginationBar page={akadPagination.page} totalPages={akadPagination.total_pages} total={akadPagination.total} perPage={akadPerPage} onPageChange={setAkadPage} onPerPageChange={(n) => { setAkadPerPage(n); setAkadPage(1); }} />
                )}
              </div>
            </div>
          )}

          {/* ── BAST Tab ─────────────────────────────────────────── */}
          {activeTab === 'bast' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-gray-900">Berita Acara Serah Terima (BAST)</h2>
                  <p className="text-xs text-gray-500 mt-1">Total {bastPagination?.total ?? bastList.length} data BAST</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Cari nomor BAST..." value={bastSearch} onChange={(e) => { setBastSearch(e.target.value); setBastPage(1); }} className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <button onClick={() => setIsAddBASTOpen(true)} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 text-sm">
                    <Plus size={18} /> Tambah BAST
                  </button>
                </div>
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
                              <button onClick={() => { setEditingBAST(item); setBastProjectId(item.housingUnit?.project_id ?? ''); setBastUnitId(item.housing_unit_id ?? ''); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={18} /></button>
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
                {bastPagination && bastPagination.total_pages > 0 && (
                  <PaginationBar page={bastPagination.page} totalPages={bastPagination.total_pages} total={bastPagination.total} perPage={bastPerPage} onPageChange={setBastPage} onPerPageChange={(n) => { setBastPerPage(n); setBastPage(1); }} />
                )}
              </div>
            </div>
          )}

          {/* ── Pindah Unit Tab ──────────────────────────────────── */}
          {activeTab === 'pindah' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-gray-900">Data Pindah Unit</h2>
                  <p className="text-xs text-gray-500 mt-1">Total {pindahPagination?.total ?? pindahList.length} data pindah unit</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Cari unit lama/baru..." value={pindahSearch} onChange={(e) => { setPindahSearch(e.target.value); setPindahPage(1); }} className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <button onClick={() => setIsAddPindahOpen(true)} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 text-sm">
                    <Plus size={18} /> Tambah Pindah Unit
                  </button>
                </div>
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
                          <td className="px-6 py-4 text-sm text-gray-600">{item.housingUnitLama?.unit_code ?? item.unit_lama ?? '-'}</td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.housingUnitBaru?.unit_code ?? item.unit_baru ?? '-'}</td>
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
                              <button onClick={() => { setEditingPindah(item); setPindahProjectLama(item.housingUnitLama?.project_id ?? ''); setPindahUnitLama(item.housing_unit_id_lama ?? ''); setPindahProjectBaru(item.housingUnitBaru?.project_id ?? ''); setPindahUnitBaru(item.housing_unit_id_baru ?? ''); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={18} /></button>
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
                {pindahPagination && pindahPagination.total_pages > 0 && (
                  <PaginationBar page={pindahPagination.page} totalPages={pindahPagination.total_pages} total={pindahPagination.total} perPage={pindahPerPage} onPageChange={setPindahPage} onPerPageChange={(n) => { setPindahPerPage(n); setPindahPage(1); }} />
                )}
              </div>
            </div>
          )}

          {/* ── Pembatalan Tab ───────────────────────────────────── */}
          {activeTab === 'pembatalan' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-gray-900">Data Pembatalan</h2>
                  <p className="text-xs text-gray-500 mt-1">Total {pembatalanPagination?.total ?? pembatalanList.length} data pembatalan</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Cari unit..." value={pembatalanSearch} onChange={(e) => { setPembatalanSearch(e.target.value); setPembatalanPage(1); }} className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <button onClick={() => setIsAddPembatalanOpen(true)} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 text-sm">
                    <Plus size={18} /> Tambah Pembatalan
                  </button>
                </div>
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
                          <td className="px-6 py-4 text-sm text-gray-600">{item.housingUnit?.unit_code ?? item.unit_code ?? '-'}</td>
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
                              <button onClick={() => { setEditingPembatalan(item); setPembatalanProjectId(item.housingUnit?.project_id ?? ''); setPembatalanUnitId(item.housing_unit_id ?? ''); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={18} /></button>
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
                {pembatalanPagination && pembatalanPagination.total_pages > 0 && (
                  <PaginationBar page={pembatalanPagination.page} totalPages={pembatalanPagination.total_pages} total={pembatalanPagination.total} perPage={pembatalanPerPage} onPageChange={setPembatalanPage} onPerPageChange={(n) => { setPembatalanPerPage(n); setPembatalanPage(1); }} />
                )}
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
            <Field label="Consumer ID">
              <input value={newPPJB.consumer_id} onChange={(e) => setNewPPJB({ ...newPPJB, consumer_id: e.target.value })} className={inputCls} placeholder="ID konsumen" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Proyek">
                <select value={ppjbProjectId} onChange={(e) => { setPpjbProjectId(e.target.value); setPpjbUnitId(''); }} className={inputCls}>
                  <option value="">Pilih Proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Unit">
                <select value={ppjbUnitId} onChange={(e) => setPpjbUnitId(e.target.value)} disabled={!ppjbProjectId} className={inputCls}>
                  <option value="">Pilih Unit...</option>
                  {ppjbUnits.units.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
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
            <Field label="Consumer ID">
              <input value={editingPPJB.consumer_id ?? ''} onChange={(e) => setEditingPPJB({ ...editingPPJB, consumer_id: e.target.value })} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Proyek">
                <select value={ppjbProjectId} onChange={(e) => { setPpjbProjectId(e.target.value); setPpjbUnitId(''); }} className={inputCls}>
                  <option value="">Pilih Proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Unit">
                <select value={ppjbUnitId} onChange={(e) => setPpjbUnitId(e.target.value)} disabled={!ppjbProjectId} className={inputCls}>
                  <option value="">Pilih Unit...</option>
                  {ppjbUnits.units.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
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
            <Field label="Consumer ID">
              <input value={newAkad.consumer_id} onChange={(e) => setNewAkad({ ...newAkad, consumer_id: e.target.value })} className={inputCls} placeholder="ID konsumen" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Proyek">
                <select value={akadProjectId} onChange={(e) => { setAkadProjectId(e.target.value); setAkadUnitId(''); }} className={inputCls}>
                  <option value="">Pilih Proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Unit">
                <select value={akadUnitId} onChange={(e) => setAkadUnitId(e.target.value)} disabled={!akadProjectId} className={inputCls}>
                  <option value="">Pilih Unit...</option>
                  {akadUnits.units.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
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
            <Field label="Consumer ID">
              <input value={editingAkad.consumer_id ?? ''} onChange={(e) => setEditingAkad({ ...editingAkad, consumer_id: e.target.value })} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Proyek">
                <select value={akadProjectId} onChange={(e) => { setAkadProjectId(e.target.value); setAkadUnitId(''); }} className={inputCls}>
                  <option value="">Pilih Proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Unit">
                <select value={akadUnitId} onChange={(e) => setAkadUnitId(e.target.value)} disabled={!akadProjectId} className={inputCls}>
                  <option value="">Pilih Unit...</option>
                  {akadUnits.units.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
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
            <Field label="Consumer ID">
              <input value={newBAST.consumer_id} onChange={(e) => setNewBAST({ ...newBAST, consumer_id: e.target.value })} className={inputCls} placeholder="ID konsumen" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Proyek">
                <select value={bastProjectId} onChange={(e) => { setBastProjectId(e.target.value); setBastUnitId(''); }} className={inputCls}>
                  <option value="">Pilih Proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Unit">
                <select value={bastUnitId} onChange={(e) => setBastUnitId(e.target.value)} disabled={!bastProjectId} className={inputCls}>
                  <option value="">Pilih Unit...</option>
                  {bastUnits.units.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
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
            <Field label="Consumer ID">
              <input value={editingBAST.consumer_id ?? ''} onChange={(e) => setEditingBAST({ ...editingBAST, consumer_id: e.target.value })} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Proyek">
                <select value={bastProjectId} onChange={(e) => { setBastProjectId(e.target.value); setBastUnitId(''); }} className={inputCls}>
                  <option value="">Pilih Proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Unit">
                <select value={bastUnitId} onChange={(e) => setBastUnitId(e.target.value)} disabled={!bastProjectId} className={inputCls}>
                  <option value="">Pilih Unit...</option>
                  {bastUnits.units.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
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
              <Field label="Proyek (Unit Lama)">
                <select value={pindahProjectLama} onChange={(e) => { setPindahProjectLama(e.target.value); setPindahUnitLama(''); }} className={inputCls}>
                  <option value="">Pilih Proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Unit Lama">
                <select value={pindahUnitLama} onChange={(e) => setPindahUnitLama(e.target.value)} disabled={!pindahProjectLama} className={inputCls}>
                  <option value="">Pilih Unit...</option>
                  {pindahUnitsLama.units.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Proyek (Unit Baru)">
                <select value={pindahProjectBaru} onChange={(e) => { setPindahProjectBaru(e.target.value); setPindahUnitBaru(''); }} className={inputCls}>
                  <option value="">Pilih Proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Unit Baru">
                <select value={pindahUnitBaru} onChange={(e) => setPindahUnitBaru(e.target.value)} disabled={!pindahProjectBaru} className={inputCls}>
                  <option value="">Pilih Unit...</option>
                  {pindahUnitsBaru.units.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
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
              <Field label="Proyek (Unit Lama)">
                <select value={pindahProjectLama} onChange={(e) => { setPindahProjectLama(e.target.value); setPindahUnitLama(''); }} className={inputCls}>
                  <option value="">Pilih Proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Unit Lama">
                <select value={pindahUnitLama} onChange={(e) => setPindahUnitLama(e.target.value)} disabled={!pindahProjectLama} className={inputCls}>
                  <option value="">Pilih Unit...</option>
                  {pindahUnitsLama.units.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Proyek (Unit Baru)">
                <select value={pindahProjectBaru} onChange={(e) => { setPindahProjectBaru(e.target.value); setPindahUnitBaru(''); }} className={inputCls}>
                  <option value="">Pilih Proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Unit Baru">
                <select value={pindahUnitBaru} onChange={(e) => setPindahUnitBaru(e.target.value)} disabled={!pindahProjectBaru} className={inputCls}>
                  <option value="">Pilih Unit...</option>
                  {pindahUnitsBaru.units.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
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
            <Field label="Consumer ID">
              <input value={newPembatalan.consumer_id} onChange={(e) => setNewPembatalan({ ...newPembatalan, consumer_id: e.target.value })} className={inputCls} placeholder="ID konsumen" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Proyek">
                <select value={pembatalanProjectId} onChange={(e) => { setPembatalanProjectId(e.target.value); setPembatalanUnitId(''); }} className={inputCls}>
                  <option value="">Pilih Proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Unit">
                <select value={pembatalanUnitId} onChange={(e) => setPembatalanUnitId(e.target.value)} disabled={!pembatalanProjectId} className={inputCls}>
                  <option value="">Pilih Unit...</option>
                  {pembatalanUnits.units.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
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
            <Field label="Consumer ID">
              <input value={editingPembatalan.consumer_id ?? ''} onChange={(e) => setEditingPembatalan({ ...editingPembatalan, consumer_id: e.target.value })} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Proyek">
                <select value={pembatalanProjectId} onChange={(e) => { setPembatalanProjectId(e.target.value); setPembatalanUnitId(''); }} className={inputCls}>
                  <option value="">Pilih Proyek...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Unit">
                <select value={pembatalanUnitId} onChange={(e) => setPembatalanUnitId(e.target.value)} disabled={!pembatalanProjectId} className={inputCls}>
                  <option value="">Pilih Unit...</option>
                  {pembatalanUnits.units.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                </select>
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
