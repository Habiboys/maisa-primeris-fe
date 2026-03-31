import {
    ArrowDownRight,
    ArrowUpRight,
    Edit2,
    FileSpreadsheet,
    FileText,
    Plus,
    Trash2,
    Wallet,
    X
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useConfirmDialog, useConsumers, useProjects, useTransactions, usePaymentSchemes } from '../../hooks';
import { formatRupiah, getErrorMessage } from '../../lib/utils';
import { financeService } from '../../services';
import { housingService } from '../../services/housing.service';
import { marketingService } from '../../services/marketing.service';
import type { CreateConsumerPayload, CreateTransactionPayload, Lead } from '../../types';
import { FinanceDetail } from '../components/FinanceDetail';
import { FinanceMonitoring } from '../components/FinanceMonitoring';
import { FinanceTablePagination, FinanceTableToolbar, SortableHeader } from '../components/FinanceTableControls';

export function Finance() {
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<'in' | 'out' | 'monitoring'>('monitoring');
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'income' | 'expense' | 'receivable'>('income');
  const [sortIn, setSortIn] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'tanggal', direction: 'desc' });
  const [sortOut, setSortOut] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'tanggal', direction: 'desc' });
  const [exporting, setExporting] = useState(false);
  /** Modal Tambah Transaksi (pembayaran piutang) dari dropdown piutang */
  const [addTransactionConsumerId, setAddTransactionConsumerId] = useState<string | null>(null);
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

  // ── Cascading project → unit untuk form Dana Masuk/Keluar ────────────
  const { projects } = useProjects();
  const { paymentSchemes } = usePaymentSchemes();
  const [txProjectId, setTxProjectId] = useState('');
  const [txUnitId, setTxUnitId] = useState('');
  const [txProjectUnits, setTxProjectUnits] = useState<{ id: string; unit_code: string }[]>([]);
  const [txUnitsLoading, setTxUnitsLoading] = useState(false);

  useEffect(() => {
    if (!txProjectId) { setTxProjectUnits([]); setTxUnitId(''); return; }
    let cancelled = false;
    setTxUnitsLoading(true);
    void housingService.getAll({ project_id: txProjectId, limit: 500, page: 1 }).then((r) => {
      if (!cancelled) {
        const newUnits = r.data ?? [];
        setTxProjectUnits(newUnits);
        setTxUnitId(prev => (newUnits.some((u: any) => u.id === prev) ? prev : ''));
      }
    }).catch(() => {
      if (!cancelled) setTxProjectUnits([]);
    }).finally(() => { if (!cancelled) setTxUnitsLoading(false); });
    return () => { cancelled = true; };
  }, [txProjectId]);

  const resetTxProjectUnit = () => { setTxProjectId(''); setTxUnitId(''); setTxProjectUnits([]); };

  /** Piutang dari lead Deal: isian form + dropdown */
  const [dealLeadsForFinance, setDealLeadsForFinance] = useState<Lead[]>([]);
  const [receivableLinkedLeadId, setReceivableLinkedLeadId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Dari modul lain: buka detail piutang atau modal tambah piutang dengan lead terpilih
  useEffect(() => {
    const state = location.state as {
      openDetailId?: string;
      prefilledLeadId?: string;
    } | null;
    if (!state) return;
    if (state.openDetailId) {
      setSelectedDetailId(state.openDetailId);
      setActiveTab('monitoring');
      navigate(location.pathname, { replace: true, state: {} });
    } else if (state.prefilledLeadId) {
      setActiveTab('monitoring');
      navigate(location.pathname, { replace: true, state: {} });
      void (async () => {
        try {
          const lead = await marketingService.getLeadById(state.prefilledLeadId!);
          if (lead.status !== 'Deal' || lead.consumer_id) {
            toast.error('Lead ini tidak bisa dipakai untuk piutang (bukan Deal atau sudah punya piutang).');
            return;
          }
          if (!lead.housing_unit_id) {
            toast.error('Lead Deal harus memiliki unit kavling sebelum membuat piutang.');
            return;
          }
          setReceivableLinkedLeadId(lead.id);
          setDealLeadsForFinance((prev) => (prev.some((l) => l.id === lead.id) ? prev : [lead, ...prev]));
          setShowModal(true);
          setModalType('receivable');
          setEditingItem(null);
        } catch {
          toast.error('Gagal memuat data lead.');
        }
      })();
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!showModal || modalType !== 'receivable' || editingItem) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await marketingService.getLeads({
          status: 'Deal',
          unconverted_finance: true,
          limit: 200,
          page: 1,
        });
        if (!cancelled) setDealLeadsForFinance(res.data ?? []);
      } catch {
        if (!cancelled) setDealLeadsForFinance([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showModal, modalType, editingItem]);

  const applyLeadToReceivableForm = (leadId: string | null) => {
    setReceivableLinkedLeadId(leadId || null);
  };

  const selectedDealLead = useMemo(() => {
    if (!receivableLinkedLeadId) return null;
    return dealLeadsForFinance.find((l) => l.id === receivableLinkedLeadId) ?? null;
  }, [dealLeadsForFinance, receivableLinkedLeadId]);

  // ── Hooks ──────────────────────────────────────────────
  const {
    transactions, summary,
    create: createTransaction, update: updateTransaction, remove: removeTransaction,
  } = useTransactions();

  const {
    consumers,
    refetch: refetchConsumers,
    create: createConsumer,
  } = useConsumers();

  // ── Derived data ──────────────────────────────────────────
  const danaMasuk = transactions
    .filter((t) => t.type === 'Pemasukan')
    .map((t, i) => ({
      ...t,
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
      ...t,
      no: i + 1,
      id: t.id,
      blok: t.reference_no || '-',
      tanggal: t.transaction_date,
      keterangan: t.description,
      jumlah: t.amount,
      noRek: t.payment_method || '-',
    }));

  const piutangList = consumers;

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
          String(item.blok ?? '').toLowerCase().includes(q)
          || String(item.tanggal ?? '').toLowerCase().includes(q)
          || String(item.keterangan ?? '').toLowerCase().includes(q)
          || String(item.jumlah ?? '').toLowerCase().includes(q)
          || String(item.noRek ?? '').toLowerCase().includes(q),
        )
      : danaKeluar;

    return applySort(filtered, sortOut, {
      blok: (item) => item.blok,
      tanggal: (item) => item.tanggal,
      keterangan: (item) => item.keterangan,
      jumlah: (item) => item.jumlah,
      noRek: (item) => item.noRek,
    });
  }, [danaKeluar, searchQuery, sortOut]);

  const pagedDanaMasuk = useMemo(
    () => filteredDanaMasuk.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredDanaMasuk, currentPage, perPage],
  );
  const pagedDanaKeluar = useMemo(
    () => filteredDanaKeluar.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredDanaKeluar, currentPage, perPage],
  );
  const totalRowsByTab = activeTab === 'in'
    ? filteredDanaMasuk.length
    : activeTab === 'out'
      ? filteredDanaKeluar.length
      : 0;

  const totalPages = Math.max(1, Math.ceil(totalRowsByTab / perPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, perPage]);

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
  const openAddReceivableModal = () => {
    setModalType('receivable');
    setEditingItem(null);
    setReceivableLinkedLeadId(null);
    setShowModal(true);
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const now = new Date().toISOString().slice(0, 10);
      let blob: Blob;
      let filename: string;
      let label: string;

      if (activeTab === 'monitoring') {
        blob = await financeService.exportConsumers({ search: searchQuery || undefined });
        filename = `laporan-piutang-${now}.csv`;
        label = 'Piutang (Monitoring)';
      } else if (activeTab === 'in') {
        blob = await financeService.exportTransactions({
          type: 'Pemasukan',
          search: searchQuery || undefined,
        });
        filename = `laporan-dana-masuk-${now}.csv`;
        label = 'Dana Masuk';
      } else {
        blob = await financeService.exportTransactions({
          type: 'Pengeluaran',
          search: searchQuery || undefined,
        });
        filename = `laporan-dana-keluar-${now}.csv`;
        label = 'Dana Keluar';
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(`Laporan ${label} berhasil diekspor.`);
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
      if (!receivableLinkedLeadId) {
        toast.error('Pilih lead Deal yang akan dijadikan piutang.');
        return;
      }
      const payload: CreateConsumerPayload = {
        lead_id: receivableLinkedLeadId,
        payment_scheme: formData.get('payment_scheme') as string,
        nik: (formData.get('nik') as string) || undefined,
        address: (formData.get('address') as string) || undefined,
      };

      try {
        await createConsumer(payload);
        setReceivableLinkedLeadId(null);
      } catch { /* error handled in hook */ }
    } else if (modalType === 'income') {
      const selectedUnit = txProjectUnits.find((u) => u.id === txUnitId);
      const payload: CreateTransactionPayload = {
        transaction_date: formData.get('transaction_date') as string,
        type: 'Pemasukan',
        category: 'Sales',
        description: formData.get('description') as string,
        amount: Number(formData.get('amount')),
        payment_method: formData.get('payment_method') as string,
        reference_no: selectedUnit ? selectedUnit.unit_code : ((formData.get('reference_no') as string) || undefined),
        project_id: txProjectId || undefined,
        housing_unit_id: txUnitId || undefined,
      };

      try {
        if (editingItem) {
          await updateTransaction(editingItem.id, payload);
        } else {
          await createTransaction(payload);
        }
      } catch { /* error handled in hook */ }
    } else if (modalType === 'expense') {
      const selectedUnit = txProjectUnits.find((u) => u.id === txUnitId);
      const payload: CreateTransactionPayload = {
        transaction_date: formData.get('transaction_date') as string,
        type: 'Pengeluaran',
        category: (formData.get('category') as string) || 'Operation',
        description: formData.get('description') as string,
        amount: Number(formData.get('amount')),
        payment_method: (formData.get('payment_method') as string) || undefined,
        reference_no: selectedUnit ? selectedUnit.unit_code : ((formData.get('reference_no') as string) || undefined),
        project_id: txProjectId || undefined,
        housing_unit_id: txUnitId || undefined,
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
    resetTxProjectUnit();
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
            {activeTab === 'in' ? 'Laporan Dana Masuk' : activeTab === 'out' ? 'Laporan Dana Keluar' : 'Tabel Monitoring Keuangan'}
          </h3>
        </div>

        {activeTab !== 'monitoring' && (
          <FinanceTableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            perPage={perPage}
            onPerPageChange={setPerPage}
            addLabel={`Tambah ${activeTab === 'in' ? 'Dana Masuk' : 'Dana Keluar'}`}
            onAdd={() => {
              setModalType(activeTab === 'in' ? 'income' : 'expense');
              setEditingItem(null);
              setShowModal(true);
            }}
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
                            setTxProjectId(item.project_id || '');
                            setTxUnitId(item.housing_unit_id || '');
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
                  <SortableHeader label="Blok" sortKey="blok" activeSort={sortOut} onSort={(key) => toggleSort(setSortOut, key)} />
                  <SortableHeader label="Tanggal" sortKey="tanggal" activeSort={sortOut} onSort={(key) => toggleSort(setSortOut, key)} />
                  <SortableHeader label="Keterangan" sortKey="keterangan" activeSort={sortOut} onSort={(key) => toggleSort(setSortOut, key)} />
                  <SortableHeader label="Jumlah" sortKey="jumlah" align="right" activeSort={sortOut} onSort={(key) => toggleSort(setSortOut, key)} />
                  <SortableHeader label="No Rek" sortKey="noRek" activeSort={sortOut} onSort={(key) => toggleSort(setSortOut, key)} />
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedDanaKeluar.map((item, idx) => (
                  <tr key={item.id ?? `${item.no}-${item.tanggal}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{(currentPage - 1) * perPage + idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">{item.blok}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.tanggal}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.keterangan}</td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">{formatRupiah(item.jumlah)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.noRek}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => {
                            setModalType('expense');
                            setEditingItem(item);
                            setTxProjectId(item.project_id || '');
                            setTxUnitId(item.housing_unit_id || '');
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
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Tidak ada data dana keluar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'monitoring' && (
            <FinanceMonitoring onDetail={setSelectedDetailId} onAddConsumer={openAddReceivableModal} />
          )}
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
              <button onClick={() => { setShowModal(false); resetTxProjectUnit(); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {modalType === 'income' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Baris 1: Pilih Project */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Project (Opsional)</label>
                      <select
                        value={txProjectId}
                        onChange={(e) => setTxProjectId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white text-sm"
                      >
                        <option value="">— Tidak Terkait Project / Unit —</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    {/* Baris 2: Pilih Blok/Unit (muncul setelah project dipilih) */}
                    {txProjectId && (
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Blok / Unit (Opsional)</label>
                        <select
                          value={txUnitId}
                          onChange={(e) => setTxUnitId(e.target.value)}
                          disabled={txUnitsLoading}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white text-sm disabled:opacity-60"
                        >
                          <option value="">{txUnitsLoading ? 'Memuat unit...' : '— Pilih Blok/Unit —'}</option>
                          {txProjectUnits.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                        </select>
                      </div>
                    )}
                    {/* Jika tidak pilih project, tetap bisa isi manual */}
                    {!txProjectId && (
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">No. Referensi (Opsional)</label>
                        <input name="reference_no" defaultValue={editingItem?.reference_no} type="text" placeholder="Contoh: INV-001 (Opsional)" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Tanggal</label>
                      <input name="transaction_date" defaultValue={editingItem?.transaction_date} required type="date" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Metode Pembayaran</label>
                      <input name="payment_method" defaultValue={editingItem?.payment_method} type="text" placeholder="BCA / Mandiri / Cash" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Keterangan</label>
                      <input name="description" defaultValue={editingItem?.description} required type="text" placeholder="Deskripsi pembayaran" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Jumlah (IDR)</label>
                      <input name="amount" defaultValue={editingItem?.amount} required type="number" placeholder="0" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                )}

                {modalType === 'expense' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cascading project → unit */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Project (Opsional)</label>
                      <select
                        value={txProjectId}
                        onChange={(e) => setTxProjectId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white text-sm"
                      >
                        <option value="">— Tidak Terkait Project / Unit —</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    {txProjectId && (
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Blok / Unit (Opsional)</label>
                        <select
                          value={txUnitId}
                          onChange={(e) => setTxUnitId(e.target.value)}
                          disabled={txUnitsLoading}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white text-sm disabled:opacity-60"
                        >
                          <option value="">{txUnitsLoading ? 'Memuat unit...' : '— Pilih Blok/Unit —'}</option>
                          {txProjectUnits.map((u) => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                        </select>
                      </div>
                    )}
                    {!txProjectId && (
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">No. Referensi (Opsional)</label>
                        <input name="reference_no" defaultValue={editingItem?.reference_no} type="text" placeholder="Contoh: INV-001 (Opsional)" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    )}
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
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Lead Deal (wajib)</label>
                      <select
                        value={receivableLinkedLeadId ?? ''}
                        onChange={(e) => applyLeadToReceivableForm(e.target.value || null)}
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white"
                      >
                        <option value="">— Pilih lead Deal yang belum punya piutang —</option>
                        {dealLeadsForFinance.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} · {l.housingUnit?.unit_code ?? l.interest ?? 'unit ?'}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-400">
                        Nama, kontak, dan unit diambil dari lead & data kavling. Buat atau ubah lead di Marketing jika belum ada.
                      </p>
                    </div>
                    {selectedDealLead && (
                      <div className="md:col-span-2 rounded-xl border border-gray-100 bg-gray-50/80 p-4 space-y-2 text-sm">
                        <p>
                          <span className="text-xs font-bold text-gray-500 uppercase">Nama</span>{' '}
                          <span className="font-bold text-gray-900">{selectedDealLead.name}</span>
                        </p>
                        <p>
                          <span className="text-xs font-bold text-gray-500 uppercase">Telepon / Email</span>{' '}
                          <span className="text-gray-800">
                            {selectedDealLead.phone ?? '—'} {selectedDealLead.email ? `· ${selectedDealLead.email}` : ''}
                          </span>
                        </p>
                        <p>
                          <span className="text-xs font-bold text-gray-500 uppercase">Unit</span>{' '}
                          <span className="font-bold text-primary">{selectedDealLead.housingUnit?.unit_code ?? '—'}</span>
                          {selectedDealLead.housingUnit?.harga_jual != null && (
                            <span className="text-gray-700"> · {formatRupiah(selectedDealLead.housingUnit.harga_jual)}</span>
                          )}
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">NIK</label>
                      <input name="nik" type="text" placeholder="Nomor KTP (opsional)" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Alamat</label>
                      <input name="address" type="text" placeholder="Opsional" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Skema Pembayaran</label>
                      <select name="payment_scheme" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white">
                        <option value="">— Pilih Skema Pembayaran —</option>
                        {paymentSchemes.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setReceivableLinkedLeadId(null);
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
            <p className="px-6 pt-2 text-sm text-gray-500">Konsumen: <strong>{editingPayment?.consumerName ?? '—'}</strong></p>
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