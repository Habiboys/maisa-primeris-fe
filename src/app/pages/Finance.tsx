import {
    ArrowDownRight,
    ArrowUpRight,
    CheckCircle,
    ChevronDown,
    Edit2,
    FileSpreadsheet,
    FileText,
    Plus,
    Trash2,
    User,
    Wallet,
    X
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useConfirmDialog, useConsumers, useHousingUnits, useTransactions } from '../../hooks';
import { formatRupiah, getErrorMessage } from '../../lib/utils';
import { financeService } from '../../services';
import type { CreateConsumerPayload, CreateTransactionPayload } from '../../types';
import { FinanceDetail } from '../components/FinanceDetail';
import { FinanceMonitoring } from '../components/FinanceMonitoring';
import { FinanceTablePagination, FinanceTableToolbar, SortableHeader } from '../components/FinanceTableControls';

export function Finance() {
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<'in' | 'out' | 'receivables' | 'monitoring'>('monitoring');
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [receivableStatusFilter, setReceivableStatusFilter] = useState<'all' | 'lunas' | 'belum'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'income' | 'expense' | 'receivable'>('income');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortIn, setSortIn] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'tanggal', direction: 'desc' });
  const [sortOut, setSortOut] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'tanggal', direction: 'desc' });
  const [sortReceivable, setSortReceivable] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [exporting, setExporting] = useState(false);
  const [receivableSelectedUnitId, setReceivableSelectedUnitId] = useState<string | null>(null);
  const [receivableUnitCode, setReceivableUnitCode] = useState('');
  const [receivableTotalPrice, setReceivableTotalPrice] = useState<number>(0);
  /** Modal Tambah Transaksi (pembayaran piutang) dari dropdown piutang */
  const [addTransactionConsumerId, setAddTransactionConsumerId] = useState<string | null>(null);
  const [addTransactionConsumerName, setAddTransactionConsumerName] = useState('');
  const CATEGORY_OPTIONS = ['Booking Fee', 'Angsuran', 'Pelunasan', 'Refund', 'Lainnya'] as const;
  const [addTransactionForm, setAddTransactionForm] = useState({
    payment_date: '',
    transaction_name: '',
    category: '' as string,
    categoryLainnya: '',
    debit: '',
    credit: '',
    estimasi_date: '',
    notes: '',
    payment_method: '',
  });
  const [addTransactionSubmitting, setAddTransactionSubmitting] = useState(false);
  const [editingPayment, setEditingPayment] = useState<{ consumerId: string; consumerName: string; payment: any } | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { units: housingUnits } = useHousingUnits(undefined, { limit: 500 });
  const selectedHousingUnit = useMemo(() => housingUnits.find((u: { id: string }) => u.id === receivableSelectedUnitId), [housingUnits, receivableSelectedUnitId]);

  // Dari Housing: buka detail piutang atau modal tambah piutang dengan unit terpilih
  useEffect(() => {
    const state = location.state as { openDetailId?: string; openReceivable?: boolean; preselectedUnitId?: string; preselectedUnitCode?: string; preselectedTotalPrice?: number } | null;
    if (!state) return;
    if (state.openDetailId) {
      setSelectedDetailId(state.openDetailId);
      setActiveTab('receivables');
      navigate(location.pathname, { replace: true, state: {} });
    } else if (state.openReceivable) {
      setActiveTab('receivables');
      setReceivableSelectedUnitId(state.preselectedUnitId ?? null);
      setReceivableUnitCode(state.preselectedUnitCode ?? '');
      setReceivableTotalPrice(state.preselectedTotalPrice ?? 0);
      setShowModal(true);
      setModalType('receivable');
      setEditingItem(null);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // Saat pilih unit kavling dari dropdown, isi unit_code & total_price
  useEffect(() => {
    if (selectedHousingUnit && !editingItem) {
      setReceivableUnitCode(selectedHousingUnit.unit_code ?? '');
      setReceivableTotalPrice(selectedHousingUnit.harga_jual ?? 0);
    }
  }, [selectedHousingUnit?.id, editingItem]);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // ── Hooks ──────────────────────────────────────────────
  const {
    transactions, summary,
    create: createTransaction, update: updateTransaction, remove: removeTransaction,
  } = useTransactions();

  const {
    consumers,
    refetch: refetchConsumers,
    create: createConsumer, update: updateConsumer, remove: removeConsumer,
  } = useConsumers();

  // ── Derived data ──────────────────────────────────────────
  const danaMasuk = transactions
    .filter((t) => t.type === 'Pemasukan')
    .map((t, i) => ({
      no: i + 1,
      id: t.id,
      blok: t.reference_no || '-',
      tanggal: t.transaction_date,
      keterangan: t.description,
      jumlah: t.amount,
      noRek: t.payment_method || '-',
    }));

  const danaKeluar = transactions
    .filter((t) => t.type === 'Pengeluaran')
    .map((t, i) => ({
      no: i + 1,
      id: t.id,
      tanggal: t.transaction_date,
      keterangan: t.description,
      jumlah: t.amount,
    }));

  const piutangList = consumers;

  const piutangRows = useMemo(() => piutangList.map((c: any) => {
    const sisaPiutang = Math.max((c.total_price ?? 0) - (c.paid_amount ?? 0), 0);
    const statusLunas = c.status === 'Lunas' || sisaPiutang <= 0;
    return {
      ...c,
      sisaPiutang,
      statusLunas,
      payments: c.payments || [],
    };
  }), [piutangList]);

  const compareValues = (a: unknown, b: unknown, direction: 'asc' | 'desc') => {
    const order = direction === 'asc' ? 1 : -1;

    if (typeof a === 'number' && typeof b === 'number') {
      return (a - b) * order;
    }

    const aStr = String(a ?? '').toLowerCase();
    const bStr = String(b ?? '').toLowerCase();
    return aStr.localeCompare(bStr) * order;
  };

  const applySort = <T,>(items: T[], sort: { key: string; direction: 'asc' | 'desc' }, map: Record<string, (item: T) => unknown>) => {
    const getter = map[sort.key];
    if (!getter) return items;
    return [...items].sort((a, b) => compareValues(getter(a), getter(b), sort.direction));
  };

  const filteredDanaMasuk = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? danaMasuk.filter((item) =>
          String(item.blok ?? '').toLowerCase().includes(q)
          || String(item.tanggal ?? '').toLowerCase().includes(q)
          || String(item.keterangan ?? '').toLowerCase().includes(q)
          || String(item.noRek ?? '').toLowerCase().includes(q),
        )
      : danaMasuk;

    return applySort(filtered, sortIn, {
      blok: (item) => item.blok,
      tanggal: (item) => item.tanggal,
      keterangan: (item) => item.keterangan,
      jumlah: (item) => item.jumlah,
      noRek: (item) => item.noRek,
    });
  }, [danaMasuk, searchQuery, sortIn]);

  const filteredDanaKeluar = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? danaKeluar.filter((item) =>
          String(item.tanggal ?? '').toLowerCase().includes(q)
          || String(item.keterangan ?? '').toLowerCase().includes(q)
          || String(item.jumlah ?? '').toLowerCase().includes(q),
        )
      : danaKeluar;

    return applySort(filtered, sortOut, {
      tanggal: (item) => item.tanggal,
      keterangan: (item) => item.keterangan,
      jumlah: (item) => item.jumlah,
    });
  }, [danaKeluar, searchQuery, sortOut]);

  const filteredPiutang = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const bySearch = q
      ? piutangRows.filter((item) =>
          String(item.name ?? '').toLowerCase().includes(q)
          || String(item.unit_code ?? '').toLowerCase().includes(q)
          || String(item.payment_scheme ?? '').toLowerCase().includes(q),
        )
      : piutangRows;

    const byStatus = receivableStatusFilter === 'all'
      ? bySearch
      : bySearch.filter((item) => (receivableStatusFilter === 'lunas' ? item.statusLunas : !item.statusLunas));

    return applySort(byStatus, sortReceivable, {
      name: (item) => item.name,
      total_price: (item) => item.total_price,
      sisa: (item) => item.sisaPiutang,
      status: (item) => (item.statusLunas ? 'Lunas' : 'Belum Lunas'),
    });
  }, [piutangRows, searchQuery, receivableStatusFilter, sortReceivable]);

  const pagedDanaMasuk = useMemo(
    () => filteredDanaMasuk.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredDanaMasuk, currentPage, perPage],
  );
  const pagedDanaKeluar = useMemo(
    () => filteredDanaKeluar.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredDanaKeluar, currentPage, perPage],
  );
  const pagedPiutang = useMemo(
    () => filteredPiutang.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredPiutang, currentPage, perPage],
  );

  const totalRowsByTab = activeTab === 'in'
    ? filteredDanaMasuk.length
    : activeTab === 'out'
      ? filteredDanaKeluar.length
      : activeTab === 'receivables'
        ? filteredPiutang.length
        : 0;

  const totalPages = Math.max(1, Math.ceil(totalRowsByTab / perPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, perPage, receivableStatusFilter]);

  const toggleSort = (
    setter: React.Dispatch<React.SetStateAction<{ key: string; direction: 'asc' | 'desc' }>>,
    key: string,
  ) => {
    setter((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const totalMasuk  = summary?.kas_masuk  ?? danaMasuk.reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalKeluar = summary?.kas_keluar ?? danaKeluar.reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalPiutang = piutangList.reduce((acc: number, c: any) => {
    const sisa = (c.total_price ?? 0) - (c.paid_amount ?? 0);
    return acc + Math.max(sisa, 0);
  }, 0);

  // ── Event handlers ──────────────────────────────────────
  const handleEditConsumer = (consumer: any) => {
    setModalType('receivable');
    setEditingItem(consumer);
    setShowModal(true);
  };

  const handleDeleteConsumer = async (id: string) => {
    if (!await showConfirm({ title: 'Hapus Konsumen', description: 'Hapus data konsumen ini dan seluruh riwayat transaksinya?' })) return;
    try {
      await removeConsumer(id);
    } catch { /* error handled in hook */ }
  };

  const handleExport = async () => {
    if (activeTab === 'monitoring') {
      toast.info('Pilih tab Dana Masuk, Dana Keluar, atau Piutang untuk export.');
      return;
    }

    try {
      setExporting(true);

      const blob = activeTab === 'receivables'
        ? await financeService.exportConsumers({ search: searchQuery || undefined })
        : await financeService.exportTransactions({
            type: activeTab === 'in' ? 'Pemasukan' : 'Pengeluaran',
            search: searchQuery || undefined,
          });

      const now = new Date().toISOString().slice(0, 10);
      const filename = activeTab === 'in'
        ? `laporan-dana-masuk-${now}.csv`
        : activeTab === 'out'
          ? `laporan-dana-keluar-${now}.csv`
          : `laporan-piutang-${now}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(`Laporan ${activeTab === 'in' ? 'Dana Masuk' : activeTab === 'out' ? 'Dana Keluar' : 'Piutang'} berhasil diekspor.`);
    } catch {
      toast.error('Gagal export laporan. Coba lagi.');
    } finally {
      setExporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    if (modalType === 'receivable') {
      const payload: CreateConsumerPayload = {
        name: formData.get('name') as string,
        unit_code: (formData.get('unit_code') as string) || receivableUnitCode,
        total_price: Number(formData.get('total_price')) || receivableTotalPrice,
        payment_scheme: formData.get('payment_scheme') as string,
        nik: (formData.get('nik') as string) || undefined,
        phone: (formData.get('phone') as string) || undefined,
        housing_unit_id: editingItem ? undefined : (receivableSelectedUnitId || undefined),
      };

      try {
        if (editingItem?.id) {
          await updateConsumer(editingItem.id, payload);
        } else {
          await createConsumer(payload);
        }
        setReceivableSelectedUnitId(null);
        setReceivableUnitCode('');
        setReceivableTotalPrice(0);
      } catch { /* error handled in hook */ }
    } else if (modalType === 'income') {
      const payload: CreateTransactionPayload = {
        transaction_date: formData.get('transaction_date') as string,
        type: 'Pemasukan',
        category: 'Sales',
        description: formData.get('description') as string,
        amount: Number(formData.get('amount')),
        payment_method: formData.get('payment_method') as string,
        reference_no: formData.get('reference_no') as string,
      };

      try {
        if (editingItem) {
          await updateTransaction(editingItem.id, payload);
        } else {
          await createTransaction(payload);
        }
      } catch { /* error handled in hook */ }
    } else if (modalType === 'expense') {
      const payload: CreateTransactionPayload = {
        transaction_date: formData.get('transaction_date') as string,
        type: 'Pengeluaran',
        category: (formData.get('category') as string) || 'Operation',
        description: formData.get('description') as string,
        amount: Number(formData.get('amount')),
        payment_method: (formData.get('payment_method') as string) || undefined,
      };

      try {
        if (editingItem) {
          await updateTransaction(editingItem.id, payload);
        } else {
          await createTransaction(payload);
        }
      } catch { /* error handled in hook */ }
    }

    setShowModal(false);
    setEditingItem(null);
  };

  const handleAddTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const consumerId = editingPayment?.consumerId ?? addTransactionConsumerId;
    if (!consumerId) return;
    const debit = Number(addTransactionForm.debit) || 0;
    const credit = Number(addTransactionForm.credit) || 0;
    if (!addTransactionForm.payment_date || (debit === 0 && credit === 0)) {
      toast.error('Isi Tanggal dan minimal Debit atau Kredit.');
      return;
    }
    setAddTransactionSubmitting(true);
    try {
      const categoryValue = addTransactionForm.category === 'Lainnya' ? addTransactionForm.categoryLainnya : addTransactionForm.category;
      const payload = {
        payment_date: addTransactionForm.payment_date,
        debit,
        credit,
        transaction_name: addTransactionForm.transaction_name || undefined,
        category: categoryValue || undefined,
        estimasi_date: addTransactionForm.estimasi_date || undefined,
        notes: addTransactionForm.notes || undefined,
        payment_method: addTransactionForm.payment_method || undefined,
      };
      const consumerId = editingPayment?.consumerId ?? addTransactionConsumerId;
      if (editingPayment) {
        await financeService.updatePayment(consumerId, editingPayment.payment.id, payload);
        toast.success('Riwayat transaksi berhasil diperbarui');
      } else {
        await financeService.createPayment(consumerId!, payload);
        toast.success('Riwayat transaksi berhasil ditambahkan');
      }
      await refetchConsumers();
      setAddTransactionConsumerId(null);
      setEditingPayment(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddTransactionSubmitting(false);
    }
  };

  const handleDeleteDanaMasuk = async (item: any) => {
    if (!await showConfirm({ title: 'Hapus Dana Masuk', description: 'Hapus data dana masuk ini?' })) return;
    if (item.id) {
      try { await removeTransaction(item.id); } catch { /* handled */ }
    }
  };

  const handleDeleteDanaKeluar = async (item: any) => {
    if (!await showConfirm({ title: 'Hapus Dana Keluar', description: 'Hapus data dana keluar ini?' })) return;
    if (item.id) {
      try { await removeTransaction(item.id); } catch { /* handled */ }
    }
  };

  if (selectedDetailId) {
    return (
      <div className="space-y-8">
        {ConfirmDialogElement}
        <div>
          <h2 className="text-2xl font-bold">Detail Keuangan Konsumen</h2>
          <p className="text-gray-500">Informasi mendalam mengenai rincian tagihan dan riwayat pembayaran.</p>
        </div>
        <FinanceDetail id={selectedDetailId} onBack={() => setSelectedDetailId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {ConfirmDialogElement}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Finance & Accounting</h2>
          <p className="text-gray-500">Manajemen arus kas dan pemantauan piutang konsumen.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={18} className="text-green-600" />
            <span>{exporting ? 'Mengekspor...' : 'Export Laporan'}</span>
          </button>
        </div>
      </div>

      {/* Finance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinanceStatCard 
          title="Total Dana Masuk" 
          value={formatRupiah(totalMasuk)} 
          change="+12.5%" 
          type="up"
          icon={<ArrowUpRight className="text-green-600" size={24} />}
        />
        <FinanceStatCard 
          title="Total Dana Keluar" 
          value={formatRupiah(totalKeluar)} 
          change="-4.2%" 
          type="down"
          icon={<ArrowDownRight className="text-red-600" size={24} />}
        />
        <FinanceStatCard 
          title="Total Piutang" 
          value={formatRupiah(totalPiutang)} 
          change="Outstanding" 
          type="neutral"
          icon={<Wallet className="text-primary" size={24} />}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('in')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${activeTab === 'in' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Dana Masuk
          {activeTab === 'in' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('out')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${activeTab === 'out' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Dana Keluar
          {activeTab === 'out' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('receivables')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${activeTab === 'receivables' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Piutang
          {activeTab === 'receivables' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('monitoring')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${activeTab === 'monitoring' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Monitoring
          {activeTab === 'monitoring' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            {activeTab === 'in' ? 'Laporan Dana Masuk' : activeTab === 'out' ? 'Laporan Dana Keluar' : activeTab === 'receivables' ? 'Data Piutang Konsumen' : 'Tabel Monitoring Keuangan'}
          </h3>
        </div>

        {activeTab !== 'monitoring' && (
          <FinanceTableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            perPage={perPage}
            onPerPageChange={setPerPage}
            addLabel={`Tambah ${activeTab === 'in' ? 'Dana Masuk' : activeTab === 'out' ? 'Dana Keluar' : 'Piutang'}`}
            onAdd={() => {
              setModalType(activeTab === 'in' ? 'income' : activeTab === 'out' ? 'expense' : 'receivable');
              setEditingItem(null);
              setShowModal(true);
            }}
            extraFilters={activeTab === 'receivables' ? (
              <select
                value={receivableStatusFilter}
                onChange={(e) => setReceivableStatusFilter(e.target.value as 'all' | 'lunas' | 'belum')}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="lunas">Lunas</option>
                <option value="belum">Belum Lunas</option>
              </select>
            ) : undefined}
          />
        )}

        <div className="overflow-x-auto">
          {activeTab === 'in' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">No</th>
                  <SortableHeader label="Blok" sortKey="blok" activeSort={sortIn} onSort={(key) => toggleSort(setSortIn, key)} />
                  <SortableHeader label="Tanggal" sortKey="tanggal" activeSort={sortIn} onSort={(key) => toggleSort(setSortIn, key)} />
                  <SortableHeader label="Keterangan" sortKey="keterangan" activeSort={sortIn} onSort={(key) => toggleSort(setSortIn, key)} />
                  <SortableHeader label="Jumlah" sortKey="jumlah" align="right" activeSort={sortIn} onSort={(key) => toggleSort(setSortIn, key)} />
                  <SortableHeader label="No Rek" sortKey="noRek" activeSort={sortIn} onSort={(key) => toggleSort(setSortIn, key)} />
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedDanaMasuk.map((item, idx) => (
                  <tr key={item.id ?? `${item.no}-${item.tanggal}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{(currentPage - 1) * perPage + idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">{item.blok}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.tanggal}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.keterangan}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">{formatRupiah(item.jumlah)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.noRek}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => {
                            setModalType('income');
                            setEditingItem(item);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-primary transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteDanaMasuk(item)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedDanaMasuk.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Tidak ada data dana masuk.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'out' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">No</th>
                  <SortableHeader label="Tanggal" sortKey="tanggal" activeSort={sortOut} onSort={(key) => toggleSort(setSortOut, key)} />
                  <SortableHeader label="Keterangan" sortKey="keterangan" activeSort={sortOut} onSort={(key) => toggleSort(setSortOut, key)} />
                  <SortableHeader label="Jumlah" sortKey="jumlah" align="right" activeSort={sortOut} onSort={(key) => toggleSort(setSortOut, key)} />
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedDanaKeluar.map((item, idx) => (
                  <tr key={item.id ?? `${item.no}-${item.tanggal}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{(currentPage - 1) * perPage + idx + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.tanggal}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.keterangan}</td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">{formatRupiah(item.jumlah)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => {
                            setModalType('expense');
                            setEditingItem(item);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-primary transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteDanaKeluar(item)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedDanaKeluar.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Tidak ada data dana keluar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'receivables' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-4 w-8"></th>
                  <SortableHeader label="Konsumen" sortKey="name" activeSort={sortReceivable} onSort={(key) => toggleSort(setSortReceivable, key)} />
                  <SortableHeader label="Harga Rumah" sortKey="total_price" align="right" activeSort={sortReceivable} onSort={(key) => toggleSort(setSortReceivable, key)} />
                  <SortableHeader label="Sisa Piutang" sortKey="sisa" align="right" activeSort={sortReceivable} onSort={(key) => toggleSort(setSortReceivable, key)} />
                  <SortableHeader label="Status" sortKey="status" activeSort={sortReceivable} onSort={(key) => toggleSort(setSortReceivable, key)} />
                  <th className="px-4 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPiutang.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <User size={64} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="font-bold text-gray-900 mb-2">Belum Ada Data Piutang</h3>
                      <p className="text-gray-500 mb-6">Tambahkan konsumen untuk mulai tracking piutang</p>
                      <button 
                        onClick={() => {
                          setModalType('receivable');
                          setEditingItem(null);
                          setShowModal(true);
                        }}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all inline-flex items-center gap-2"
                      >
                        <Plus size={20} />
                        Tambah Konsumen Pertama
                      </button>
                    </td>
                  </tr>
                ) : (
                  pagedPiutang.flatMap((consumer: any) => {
                    const isExpanded = expandedRows.has(consumer.id);
                    const sisaPiutang = consumer.sisaPiutang;
                    const statusLunas = consumer.statusLunas;
                    const payments = consumer.payments || [];
                    
                    const rows: React.ReactNode[] = [];
                    
                    // Main Consumer Row
                    rows.push(
                      <tr key={`${consumer.id}-main`} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-4 py-4">
                            <button
                              onClick={() => toggleRow(consumer.id)}
                              className="p-1 hover:bg-gray-200 rounded transition-all"
                            >
                              <ChevronDown 
                                size={18} 
                                className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <User size={18} className="text-primary" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">{consumer.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                  <span className="font-bold text-primary">{consumer.unit_code || '-'}</span>
                                  <span>•</span>
                                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{consumer.payment_scheme || '-'}</span>
                                  <span>•</span>
                                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">{payments.length} transaksi</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="font-bold text-gray-900 text-sm">
                              {formatRupiah(consumer.total_price ?? 0)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={`font-bold text-sm ${statusLunas ? 'text-green-600' : 'text-orange-600'}`}>
                              {formatRupiah(Math.max(sisaPiutang, 0))}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {statusLunas ? (
                              <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                <CheckCircle size={14} />
                                LUNAS
                              </span>
                            ) : (
                              <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                                BELUM LUNAS
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => setSelectedDetailId(consumer.id)}
                                className="p-2 text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                                title="Lihat Detail"
                              >
                                <FileText size={16} />
                              </button>
                              <button 
                                onClick={() => handleEditConsumer(consumer)}
                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Edit Konsumen"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteConsumer(consumer.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus Konsumen"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                    );
                    
                    // Expanded Payment Details
                    if (isExpanded) {
                      rows.push(
                        <tr key={`${consumer.id}-detail`}>
                            <td colSpan={10} className="bg-gray-50/50 px-4 py-4 border-t border-gray-200">
                              <div className="ml-14">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                                    <FileText size={16} className="text-primary" />
                                    Riwayat Transaksi Pembayaran
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPayment(null);
                                      setAddTransactionConsumerId(consumer.id);
                                      setAddTransactionConsumerName(consumer.name ?? '');
                                      setAddTransactionForm({
                                        payment_date: new Date().toISOString().slice(0, 10),
                                        transaction_name: '',
                                        category: '',
                                        categoryLainnya: '',
                                        debit: '',
                                        credit: '',
                                        estimasi_date: '',
                                        notes: '',
                                        payment_method: '',
                                      });
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                                  >
                                    <Plus size={16} />
                                    Tambah Transaksi
                                  </button>
                                </div>
                                
                                {payments.length === 0 ? (
                                  <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
                                    <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-500">Belum ada riwayat pembayaran</p>
                                  </div>
                                ) : (
                                  (() => {
                                    const totalPrice = consumer.total_price ?? 0;
                                    const asc = [...payments].sort((a: any, b: any) => (a.payment_date || '').localeCompare(b.payment_date || ''));
                                    let running = totalPrice;
                                    const sisaAfter: Record<string, number> = {};
                                    asc.forEach((p: any) => {
                                      const net = (p.debit ?? p.amount ?? 0) - (p.credit ?? 0);
                                      running -= net;
                                      sisaAfter[p.id] = running;
                                    });
                                    const formatDdMmYyyy = (d: string) => {
                                      if (!d) return '-';
                                      const [y, m, day] = d.split('-');
                                      return day && m && y ? `${day}/${m}/${y}` : d;
                                    };
                                    return (
                                      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                          <thead>
                                            <tr className="bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                                              <th className="px-3 py-2.5 w-8">#</th>
                                              <th className="px-3 py-2.5 whitespace-nowrap">Tanggal</th>
                                              <th className="px-3 py-2.5">Nama Transaksi</th>
                                              <th className="px-3 py-2.5 whitespace-nowrap">Kategori Transaksi</th>
                                              <th className="px-3 py-2.5 text-right">Pembayaran</th>
                                              <th className="px-3 py-2.5 text-right">Pengembalian</th>
                                              <th className="px-3 py-2.5 text-right">Sisa Piutang</th>
                                              <th className="px-3 py-2.5 whitespace-nowrap">Estimasi</th>
                                              <th className="px-3 py-2.5">Status</th>
                                              <th className="px-3 py-2.5 w-20 text-center">Aksi</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                            {asc.map((p: any, idx: number) => (
                                              <tr key={p.id || idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-3 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                                                <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{formatDdMmYyyy(p.payment_date)}</td>
                                                <td className="px-3 py-2.5 font-medium text-gray-900">{p.transaction_name || p.notes || '-'}</td>
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${(p.transaction_category || ((p.debit ?? 0) > 0 ? 'Debit' : 'Kredit')) === 'Debit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {p.transaction_category || ((p.debit ?? 0) > 0 ? 'Debit' : 'Kredit')}
                                                  </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-medium text-green-600 whitespace-nowrap">
                                                  {(p.debit ?? 0) > 0 ? formatRupiah(p.debit) : '-'}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-medium text-red-600 whitespace-nowrap">
                                                  {(p.credit ?? 0) > 0 ? formatRupiah(p.credit) : '-'}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-bold text-gray-900 whitespace-nowrap">
                                                  {formatRupiah(sisaAfter[p.id] ?? 0)}
                                                </td>
                                                <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{p.estimasi_date ? formatDdMmYyyy(p.estimasi_date) : '-'}</td>
                                                <td className="px-3 py-2.5 text-gray-600 text-xs">{p.status || '-'}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                  <div className="flex items-center justify-center gap-1">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const cat = p.category || '';
                                                        const isLainnya = cat && !['Booking Fee', 'Angsuran', 'Pelunasan', 'Refund'].includes(cat);
                                                        setEditingPayment({ consumerId: consumer.id, consumerName: consumer.name ?? '', payment: p });
                                                        setAddTransactionForm({
                                                          payment_date: (p.payment_date || '').toString().slice(0, 10),
                                                          transaction_name: p.transaction_name || p.notes || '',
                                                          category: isLainnya ? 'Lainnya' : (cat || ''),
                                                          categoryLainnya: isLainnya ? cat : '',
                                                          debit: p.debit != null ? String(p.debit) : '',
                                                          credit: p.credit != null ? String(p.credit) : '',
                                                          estimasi_date: (p.estimasi_date || '').toString().slice(0, 10),
                                                          notes: p.notes || '',
                                                          payment_method: p.payment_method || '',
                                                        });
                                                      }}
                                                      className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded"
                                                      title="Edit"
                                                    >
                                                      <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={async () => {
                                                        if (!await showConfirm({ title: 'Hapus Transaksi', description: 'Hapus riwayat transaksi ini?' })) return;
                                                        try {
                                                          await financeService.removePayment(consumer.id, p.id);
                                                          toast.success('Transaksi dihapus');
                                                          await refetchConsumers();
                                                        } catch (err) {
                                                          toast.error(getErrorMessage(err));
                                                        }
                                                      }}
                                                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                      title="Hapus"
                                                    >
                                                      <Trash2 size={14} />
                                                    </button>
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    );
                                  })()
                                )}
                              </div>
                            </td>
                          </tr>
                      );
                    }
                    
                    return rows;
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'monitoring' && <FinanceMonitoring onDetail={setSelectedDetailId} />}
        </div>

        {activeTab !== 'monitoring' && (
          <FinanceTablePagination
            currentPage={Math.min(currentPage, totalPages)}
            totalPages={totalPages}
            totalItems={totalRowsByTab}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modal Input Dinamis */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {editingItem ? <Edit2 size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                {editingItem ? 'Edit' : 'Tambah'} {
                  modalType === 'income' ? 'Dana Masuk' : 
                  modalType === 'expense' ? 'Dana Keluar' : 'Data Konsumen'
                }
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {modalType === 'income' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Referensi / Blok</label>
                      <input name="reference_no" defaultValue={editingItem?.reference_no} type="text" placeholder="Contoh: A-01" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Tanggal</label>
                      <input name="transaction_date" defaultValue={editingItem?.transaction_date} required type="date" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Keterangan</label>
                      <input name="description" defaultValue={editingItem?.description} required type="text" placeholder="Deskripsi pembayaran" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Jumlah (IDR)</label>
                      <input name="amount" defaultValue={editingItem?.amount} required type="number" placeholder="0" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Metode Pembayaran</label>
                      <input name="payment_method" defaultValue={editingItem?.payment_method} type="text" placeholder="BCA / Mandiri / Cash" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                )}

                {modalType === 'expense' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Tanggal</label>
                      <input name="transaction_date" defaultValue={editingItem?.transaction_date} required type="date" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Kategori</label>
                      <input name="category" defaultValue={editingItem?.category} type="text" placeholder="Contoh: Material / Operasional" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Keterangan</label>
                      <input name="description" defaultValue={editingItem?.description} required type="text" placeholder="Deskripsi pengeluaran" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Jumlah (IDR)</label>
                      <input name="amount" defaultValue={editingItem?.amount} required type="number" placeholder="0" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Metode Pembayaran</label>
                      <input name="payment_method" defaultValue={editingItem?.payment_method} type="text" placeholder="Cash / Transfer" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                )}

                {modalType === 'receivable' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Nama Konsumen</label>
                      <input name="name" defaultValue={editingItem?.name} required type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">NIK</label>
                      <input name="nik" defaultValue={editingItem?.nik} type="text" placeholder="Nomor KTP" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">No. Telepon</label>
                      <input name="phone" defaultValue={editingItem?.phone} type="text" placeholder="08xxxxxxxxxx" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Unit / Kavling</label>
                      <select
                        value={receivableSelectedUnitId ?? ''}
                        onChange={(e) => setReceivableSelectedUnitId(e.target.value || null)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Pilih unit kavling...</option>
                        {housingUnits.map((u: { id: string; unit_code: string; unit_type?: string; harga_jual?: number }) => (
                          <option key={u.id} value={u.id}>
                            {u.unit_code} {u.unit_type ? ` — ${u.unit_type}` : ''} {u.harga_jual != null ? ` (${formatRupiah(u.harga_jual)})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">No. Kavling (terisi otomatis bila pilih unit di atas)</label>
                      <input name="unit_code" value={editingItem ? undefined : receivableUnitCode} defaultValue={editingItem?.unit_code} onChange={e => !editingItem && setReceivableUnitCode(e.target.value)} required type="text" placeholder="Contoh: A-01" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Harga Rumah</label>
                      <input name="total_price" value={editingItem ? undefined : receivableTotalPrice} defaultValue={editingItem?.total_price} onChange={e => !editingItem && setReceivableTotalPrice(Number(e.target.value) || 0)} required type="number" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Skema Pembayaran</label>
                      <input name="payment_scheme" defaultValue={editingItem?.payment_scheme} required type="text" placeholder="Contoh: Cash Bertahap / KPR" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setReceivableSelectedUnitId(null);
                    setReceivableUnitCode('');
                    setReceivableTotalPrice(0);
                  }}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit Riwayat Transaksi (piutang) — debit/kredit pisah, sisa otomatis */}
      {(addTransactionConsumerId || editingPayment) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Wallet size={20} className="text-primary" />
                {editingPayment ? 'Edit' : 'Tambah'} Riwayat Transaksi
              </h3>
              <button
                type="button"
                onClick={() => { setAddTransactionConsumerId(null); setEditingPayment(null); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
            <p className="px-6 pt-2 text-sm text-gray-500">Konsumen: <strong>{editingPayment?.consumerName ?? addTransactionConsumerName}</strong></p>
            <form onSubmit={handleAddTransactionSubmit}>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Tanggal *</label>
                    <input
                      required
                      type="date"
                      value={addTransactionForm.payment_date}
                      onChange={(e) => setAddTransactionForm((f) => ({ ...f, payment_date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Kategori</label>
                    <select
                      value={addTransactionForm.category}
                      onChange={(e) => setAddTransactionForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                    >
                      <option value="">Pilih kategori...</option>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  {addTransactionForm.category === 'Lainnya' && (
                    <div className="col-span-2 space-y-1">
                      <label className="text-sm font-bold text-gray-700">Kategori (ketik sendiri)</label>
                      <input
                        type="text"
                        value={addTransactionForm.categoryLainnya}
                        onChange={(e) => setAddTransactionForm((f) => ({ ...f, categoryLainnya: e.target.value }))}
                        placeholder="Tulis kategori transaksi"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  )}
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-bold text-gray-700">Nama Transaksi</label>
                    <input
                      type="text"
                      value={addTransactionForm.transaction_name}
                      onChange={(e) => setAddTransactionForm((f) => ({ ...f, transaction_name: e.target.value }))}
                      placeholder="Contoh: DP 1 / Angsuran"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Debit (Pembayaran)</label>
                    <input
                      type="number"
                      min={0}
                      value={addTransactionForm.debit}
                      onChange={(e) => setAddTransactionForm((f) => ({ ...f, debit: e.target.value }))}
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Kredit (Pengembalian)</label>
                    <input
                      type="number"
                      min={0}
                      value={addTransactionForm.credit}
                      onChange={(e) => setAddTransactionForm((f) => ({ ...f, credit: e.target.value }))}
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Estimasi (tanggal)</label>
                    <input
                      type="date"
                      value={addTransactionForm.estimasi_date}
                      onChange={(e) => setAddTransactionForm((f) => ({ ...f, estimasi_date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Metode Pembayaran</label>
                    <input
                      type="text"
                      value={addTransactionForm.payment_method}
                      onChange={(e) => setAddTransactionForm((f) => ({ ...f, payment_method: e.target.value }))}
                      placeholder="Transfer BCA / Cash"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm font-bold text-gray-700">Keterangan</label>
                    <input
                      type="text"
                      value={addTransactionForm.notes}
                      onChange={(e) => setAddTransactionForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Catatan tambahan"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setAddTransactionConsumerId(null); setEditingPayment(null); }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addTransactionSubmitting}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-60"
                >
                  {addTransactionSubmitting ? 'Menyimpan...' : (editingPayment ? 'Simpan Perubahan' : 'Simpan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceStatCard({ title, value, change, type, icon }: { title: string, value: string, change: string, type: 'up' | 'down' | 'neutral', icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
          type === 'up' ? 'bg-green-50 text-green-600 border border-green-100' : 
          type === 'down' ? 'bg-red-50 text-red-600 border border-red-100' : 
          'bg-primary/10 text-primary border border-primary/20'
        }`}>
          {change}
        </span>
      </div>
      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h4>
    </div>
  );
}