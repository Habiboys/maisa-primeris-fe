import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  ChevronDown,
  Edit2,
  FileSpreadsheet,
  FileText,
  Plus,
  Search,
  Trash2,
  User,
  Wallet,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog, useConsumers, useTransactions } from '../../hooks';
import { USE_MOCK_DATA } from '../../lib/config';
import { MOCK } from '../../lib/mockData';
import { formatRupiah } from '../../lib/utils';
import type { CreateConsumerPayload, CreateTransactionPayload } from '../../types';
import { FinanceDetail } from '../components/FinanceDetail';
import { FinanceMonitoring } from '../components/FinanceMonitoring';

export function Finance() {
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<'in' | 'out' | 'receivables' | 'monitoring'>('monitoring');
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'income' | 'expense' | 'receivable'>('income');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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
    create: createConsumer, update: updateConsumer, remove: removeConsumer,
  } = useConsumers();

  // ── Derived data ──────────────────────────────────────────
  const danaMasuk = USE_MOCK_DATA
    ? MOCK.danaMasuk
    : transactions
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

  const danaKeluar = USE_MOCK_DATA
    ? MOCK.danaKeluar
    : transactions
        .filter((t) => t.type === 'Pengeluaran')
        .map((t, i) => ({
          no: i + 1,
          id: t.id,
          tanggal: t.transaction_date,
          keterangan: t.description,
          jumlah: t.amount,
        }));

  const piutangList = USE_MOCK_DATA
    ? (MOCK.piutang as any[])
    : consumers;

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

  const handleExport = () => {
    toast.success(`Laporan ${activeTab === 'in' ? 'Dana Masuk' : activeTab === 'out' ? 'Dana Keluar' : 'Piutang'} berhasil diekspor!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    if (modalType === 'receivable') {
      const payload: CreateConsumerPayload = {
        name: formData.get('name') as string,
        unit_code: formData.get('unit_code') as string,
        total_price: Number(formData.get('total_price')),
        payment_scheme: formData.get('payment_scheme') as string,
        nik: (formData.get('nik') as string) || undefined,
        phone: (formData.get('phone') as string) || undefined,
      };

      try {
        if (editingItem) {
          await updateConsumer(editingItem.id, payload);
        } else {
          await createConsumer(payload);
        }
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

  const handleDeleteDanaMasuk = async (item: any) => {
    if (!await showConfirm({ title: 'Hapus Dana Masuk', description: 'Hapus data dana masuk ini?' })) return;
    if (item.id && !USE_MOCK_DATA) {
      try { await removeTransaction(item.id); } catch { /* handled */ }
    } else {
      toast.success('Data berhasil dihapus');
    }
  };

  const handleDeleteDanaKeluar = async (item: any) => {
    if (!await showConfirm({ title: 'Hapus Dana Keluar', description: 'Hapus data dana keluar ini?' })) return;
    if (item.id && !USE_MOCK_DATA) {
      try { await removeTransaction(item.id); } catch { /* handled */ }
    } else {
      toast.success('Data berhasil dihapus');
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
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            <FileSpreadsheet size={18} className="text-green-600" />
            <span>Export Laporan</span>
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
            {activeTab !== 'monitoring' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari data..." 
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-primary outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>
              <button 
                onClick={() => {
                  setModalType(activeTab === 'in' ? 'income' : activeTab === 'out' ? 'expense' : 'receivable');
                  setEditingItem(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/10 whitespace-nowrap"
              >
                <Plus size={16} />
                <span>Tambah {activeTab === 'in' ? 'Dana Masuk' : activeTab === 'out' ? 'Dana Keluar' : 'Piutang'}</span>
              </button>
            </div>
            )}
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'in' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Blok</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4 text-right">Jumlah</th>
                  <th className="px-6 py-4">No Rek</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {danaMasuk.map((item) => (
                  <tr key={item.no} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{item.no}</td>
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
              </tbody>
            </table>
          )}

          {activeTab === 'out' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4 text-right">Jumlah</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {danaKeluar.map((item) => (
                  <tr key={item.no} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{item.no}</td>
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
              </tbody>
            </table>
          )}

          {activeTab === 'receivables' && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-4 w-8"></th>
                  <th className="px-4 py-4">Konsumen</th>
                  <th className="px-4 py-4 text-right">Harga Rumah</th>
                  <th className="px-4 py-4 text-right">Sisa Piutang</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {piutangList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
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
                  piutangList.flatMap((consumer: any) => {
                    const isExpanded = expandedRows.has(consumer.id);
                    const sisaPiutang = (consumer.total_price ?? 0) - (consumer.paid_amount ?? 0);
                    const statusLunas = consumer.status === 'Lunas' || sisaPiutang <= 0;
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
                            <td colSpan={6} className="bg-gray-50/50 px-4 py-4 border-t border-gray-200">
                              <div className="ml-14">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                                    <FileText size={16} className="text-primary" />
                                    Riwayat Pembayaran
                                  </h4>
                                </div>
                                
                                {payments.length === 0 ? (
                                  <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
                                    <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-500">Belum ada riwayat pembayaran</p>
                                  </div>
                                ) : (
                                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                      <thead>
                                        <tr className="bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                                          <th className="px-3 py-2.5 w-8">#</th>
                                          <th className="px-3 py-2.5">Tanggal</th>
                                          <th className="px-3 py-2.5">Keterangan</th>
                                          <th className="px-3 py-2.5">Metode</th>
                                          <th className="px-3 py-2.5 text-right">Jumlah</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {payments.map((p: any, idx: number) => (
                                          <tr key={p.id || idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-3 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                                            <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{p.payment_date}</td>
                                            <td className="px-3 py-2.5 font-medium text-gray-900">{p.notes || '-'}</td>
                                            <td className="px-3 py-2.5 text-gray-500 text-xs">{p.payment_method || '-'}</td>
                                            <td className="px-3 py-2.5 text-right font-bold text-green-600 whitespace-nowrap">
                                              {formatRupiah(p.amount)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
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
      </div>

      {/* Modal Input Dinamis */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Unit / Blok</label>
                      <input name="unit_code" defaultValue={editingItem?.unit_code} required type="text" placeholder="Contoh: A-01" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Harga Rumah</label>
                      <input name="total_price" defaultValue={editingItem?.total_price} required type="number" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Skema Pembayaran</label>
                      <input name="payment_scheme" defaultValue={editingItem?.payment_scheme} required type="text" placeholder="Contoh: Cash Bertahap / KPR" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
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