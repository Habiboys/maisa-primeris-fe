import {
    ArrowLeft,
    Calendar,
    Check,
    CreditCard,
    Edit2,
    FileText,
    History,
    MapPin,
    Plus,
    Printer,
    Trash2,
    User,
    X
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog, useConsumerDetail, usePaymentHistory } from '../../hooks';
import { formatRupiah } from '../../lib/utils';
import type { CreatePaymentPayload, PaymentHistory } from '../../types';

interface FinanceDetailProps {
  id: string;
  onBack: () => void;
}

interface ItemTagihan {
  id: string;
  jenis: string;
  harga: number;
}

export function FinanceDetail({ id, onBack }: FinanceDetailProps) {
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  // Remote data from hooks
  const { consumer } = useConsumerDetail(id);
  const { payments, create: createPayment, update: updatePayment, remove: removePayment } = usePaymentHistory(id);

  // Customer info derived from consumer
  const customerName = consumer?.name || '-';
  const customerUnit = consumer?.unit_code || '-';
  const customerScheme = consumer?.payment_scheme || '-';

  // Tagihan is local (billing breakdown — no separate backend model)
  const [tagihan, setTagihan] = useState<ItemTagihan[]>([]);
  const [modalCategory, setModalCategory] = useState('');
  const [modalCategoryLainnya, setModalCategoryLainnya] = useState('');

  // State for modal & editing
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'tagihan' | 'pemasukan' | 'profile'>('tagihan');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Sync modal category when open for pemasukan
  useEffect(() => {
    if (showModal && modalType === 'pemasukan' && editingItem) {
      const cat = editingItem.category || '';
      const isLainnya = cat && !['Booking Fee', 'Angsuran', 'Pelunasan', 'Refund'].includes(cat);
      setModalCategory(isLainnya ? 'Lainnya' : cat);
      setModalCategoryLainnya(isLainnya ? cat : '');
    } else if (showModal && modalType === 'pemasukan') {
      setModalCategory('');
      setModalCategoryLainnya('');
    }
  }, [showModal, modalType, editingItem]);

  // When consumer loads, initialise tagihan jika belum ada
  useMemo(() => {
    if (consumer && tagihan.length === 0) {
      setTagihan([
        { id: 't-price', jenis: `Harga Rumah Unit ${consumer.unit_code}`, harga: consumer.total_price },
      ]);
    }
  }, [consumer]);

  // Calculations
  const totalTagihan = useMemo(() => tagihan.reduce((acc, curr) => acc + curr.harga, 0), [tagihan]);
  const totalPemasukan = useMemo(() => payments.reduce((acc, curr) => acc + (curr.amount ?? (curr.debit ?? 0) - (curr.credit ?? 0)), 0), [payments]);
  const sisaPiutang = totalTagihan - totalPemasukan;
  const progressPercent = totalTagihan > 0 ? Math.min(Math.round((totalPemasukan / totalTagihan) * 100), 100) : 0;

  const handleOpenModal = (type: typeof modalType, item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDeleteTagihan = async (itemId: string) => {
    if (!await showConfirm({ title: 'Hapus Tagihan', description: 'Hapus data ini?' })) return;
    setTagihan(tagihan.filter(t => t.id !== itemId));
    toast.success('Tagihan berhasil dihapus');
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!await showConfirm({ title: 'Hapus Pembayaran', description: 'Hapus pembayaran ini?' })) return;
    try { await removePayment(paymentId); } catch { /* handled in hook */ }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (modalType === 'tagihan') {
      const data: ItemTagihan = {
        id: editingItem?.id || Math.random().toString(36).substr(2, 9),
        jenis: formData.get('uraian') as string,
        harga: Number(formData.get('nominal')),
      };
      if (editingItem) {
        setTagihan(tagihan.map(t => t.id === editingItem.id ? data : t));
      } else {
        setTagihan([...tagihan, data]);
      }
      toast.success(editingItem ? 'Tagihan diperbarui' : 'Tagihan ditambahkan');
    } else if (modalType === 'pemasukan') {
      const debit = Number(formData.get('debit')) || 0;
      const credit = Number(formData.get('credit')) || 0;
      const categorySelect = (formData.get('category') as string) || '';
      const categoryValue = categorySelect === 'Lainnya' ? (formData.get('category_lainnya') as string) || '' : categorySelect;
      const payload: CreatePaymentPayload = {
        payment_date: formData.get('payment_date') as string,
        debit,
        credit,
        transaction_name: (formData.get('transaction_name') as string) || undefined,
        category: categoryValue || undefined,
        estimasi_date: (formData.get('estimasi_date') as string) || undefined,
        notes: (formData.get('notes') as string) || undefined,
        payment_method: (formData.get('payment_method') as string) || undefined,
      };
      if (debit === 0 && credit === 0) {
        toast.error('Isi minimal Debit atau Kredit.');
        return;
      }

      try {
        if (editingItem) {
          await updatePayment(editingItem.id, payload);
        } else {
          await createPayment(payload);
        }
      } catch { /* handled in hook */ }
    }

    setShowModal(false);
    setEditingItem(null);
  };

  const openPrintWindow = (title: string, bodyHtml: string) => {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      toast.error('Popup print diblokir browser. Izinkan popup lalu coba lagi.');
      return;
    }

    w.document.open();
    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            h2 { font-size: 14px; margin: 16px 0 8px; text-transform: uppercase; color: #4b5563; }
            p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
            th { background: #f9fafb; text-align: left; }
            .right { text-align: right; }
            .muted { color: #6b7280; font-size: 12px; }
            .summary { margin-top: 14px; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          ${bodyHtml}
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 200);
  };

  const printRecap = () => {
    const tagihanRows = tagihan
      .map((t, i) => `<tr><td>${i + 1}</td><td>${t.jenis}</td><td class="right">${formatRupiah(t.harga)}</td></tr>`)
      .join('');

    const paymentRows = payments
      .map((p, i) => `<tr><td>${i + 1}</td><td>${p.payment_date}</td><td>${p.notes || '-'}</td><td class="right">${formatRupiah(p.amount)}</td></tr>`)
      .join('');

    openPrintWindow(
      'Rekap Keuangan Konsumen',
      `
        <h1>Rekap Keuangan Konsumen</h1>
        <p class="muted">Tanggal cetak: ${new Date().toLocaleString('id-ID')}</p>

        <h2>Identitas</h2>
        <p><strong>Nama Nasabah:</strong> ${customerName}</p>
        <p><strong>Unit:</strong> ${customerUnit}</p>
        <p><strong>Metode:</strong> ${customerScheme}</p>

        <h2>Rincian Tagihan</h2>
        <table>
          <thead>
            <tr><th>No</th><th>Uraian</th><th class="right">Nominal</th></tr>
          </thead>
          <tbody>${tagihanRows || '<tr><td colspan="3">Tidak ada data tagihan</td></tr>'}</tbody>
        </table>

        <h2>Riwayat Pemasukan</h2>
        <table>
          <thead>
            <tr><th>No</th><th>Tanggal</th><th>Uraian</th><th class="right">Jumlah</th></tr>
          </thead>
          <tbody>${paymentRows || '<tr><td colspan="4">Tidak ada riwayat pemasukan</td></tr>'}</tbody>
        </table>

        <div class="summary">
          <p><strong>Total Tagihan:</strong> ${formatRupiah(totalTagihan)}</p>
          <p><strong>Total Terbayar:</strong> ${formatRupiah(totalPemasukan)}</p>
          <p><strong>Sisa Piutang:</strong> ${formatRupiah(sisaPiutang)}</p>
          <p><strong>Progress:</strong> ${progressPercent}%</p>
        </div>
      `,
    );
  };

  const printReceipt = (payment: PaymentHistory, index: number) => {
    openPrintWindow(
      `Kwitansi-${payment.id}`,
      `
        <h1>KWITANSI PEMBAYARAN</h1>
        <p class="muted">No: KW-${index + 1}-${new Date(payment.payment_date).getFullYear()}</p>
        <p class="muted">Tanggal cetak: ${new Date().toLocaleString('id-ID')}</p>

        <h2>Detail Pembayaran</h2>
        <p><strong>Nama Nasabah:</strong> ${customerName}</p>
        <p><strong>Unit:</strong> ${customerUnit}</p>
        <p><strong>Tanggal Bayar:</strong> ${payment.payment_date}</p>
        <p><strong>Metode:</strong> ${payment.payment_method || '-'}</p>
        <p><strong>Uraian:</strong> ${payment.notes || '-'}</p>

        <div class="summary">
          <p><strong>Jumlah Dibayar:</strong> ${formatRupiah(payment.amount)}</p>
        </div>

        <div style="margin-top:36px; display:flex; justify-content:space-between;">
          <div>
            <p class="muted">Penerima</p>
            <p style="margin-top:56px; border-top:1px solid #9ca3af; width:180px;">Finance</p>
          </div>
          <div>
            <p class="muted">Pembayar</p>
            <p style="margin-top:56px; border-top:1px solid #9ca3af; width:180px;">${customerName}</p>
          </div>
        </div>
      `,
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 relative">
      {ConfirmDialogElement}
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-gray-500 hover:text-primary transition-all font-semibold text-sm"
        >
          <div className="p-2 bg-white border border-gray-200 rounded-lg group-hover:border-primary/30 transition-colors shadow-sm">
            <ArrowLeft size={16} />
          </div>
          <span>Kembali ke Monitoring</span>
        </button>
        <button onClick={printRecap} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
          <Printer size={16} className="text-primary" />
          <span>Cetak Rekap Keuangan</span>
        </button>
      </div>

      {/* Summary Section (Editable Profile) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group/card">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 p-8 border-r border-gray-50 relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Identitas Pembayaran</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><User size={10}/> Nama Nasabah</p>
                <p className="text-base font-bold text-gray-800 border-b border-gray-100 pb-1.5">{customerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={10}/> Lokasi Unit</p>
                <p className="text-base font-bold text-gray-800 border-b border-gray-100 pb-1.5">{customerUnit}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><CreditCard size={10}/> Metode</p>
                <div className="pt-1">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full border border-primary/20">{customerScheme}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={10}/> Persentase Terbayar</p>
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500">{progressPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-8 bg-gray-50/40">
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Tagihan</p>
                  <p className="text-xl font-bold text-gray-900">{formatRupiah(totalTagihan)}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                  <FileText size={20} />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Terbayar</p>
                  <p className="text-base font-bold text-gray-900">{formatRupiah(totalPemasukan)}</p>
                </div>
                <div className="flex-1 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Sisa Piutang</p>
                  <p className="text-base font-bold text-gray-900">{formatRupiah(sisaPiutang)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="space-y-8">
        
        {/* Table Tagihan */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h5 className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Rincian Tagihan
            </h5>
            <button 
              onClick={() => handleOpenModal('tagihan')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Tambah Tagihan</span>
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-3 w-16 text-center">No</th>
                <th className="px-6 py-3">Uraian</th>
                <th className="px-6 py-3 text-right">Nominal</th>
                <th className="px-6 py-3 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tagihan.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-center text-sm text-gray-400 font-medium">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700">{item.jenis}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">{formatRupiah(item.harga)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleOpenModal('tagihan', item)} className="p-2 text-gray-300 hover:text-amber-500 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteTagihan(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-50/20 font-bold border-t border-blue-100">
                <td colSpan={2} className="px-6 py-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Keseluruhan Tagihan</td>
                <td className="px-6 py-4 text-right text-base font-bold text-primary">{formatRupiah(totalTagihan)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Table Riwayat Transaksi Pembayaran — debit/kredit pisah, sisa otomatis */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h5 className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Riwayat Transaksi Pembayaran
            </h5>
            <button 
              onClick={() => handleOpenModal('pemasukan')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-[11px] font-bold hover:bg-primary/90 transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Tambah Transaksi</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-3 w-12 text-center">#</th>
                  <th className="px-6 py-3 whitespace-nowrap">Tanggal</th>
                  <th className="px-6 py-3">Nama Transaksi</th>
                  <th className="px-6 py-3 whitespace-nowrap">Kategori Transaksi</th>
                  <th className="px-6 py-3 text-right">Pembayaran</th>
                  <th className="px-6 py-3 text-right">Pengembalian</th>
                  <th className="px-6 py-3 text-right">Sisa Piutang</th>
                  <th className="px-6 py-3 whitespace-nowrap">Estimasi</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(() => {
                  const formatDdMmYyyy = (d: string) => {
                    if (!d) return '-';
                    const [y, m, day] = d.split('-');
                    return day && m && y ? `${day}/${m}/${y}` : d;
                  };
                  const asc = [...payments].sort((a, b) => (a.payment_date || '').localeCompare(b.payment_date || ''));
                  let running = totalTagihan;
                  const sisaAfter: Record<string, number> = {};
                  asc.forEach((p) => {
                    const net = (p.debit ?? p.amount ?? 0) - (p.credit ?? 0);
                    running -= net;
                    sisaAfter[p.id] = running;
                  });
                  return asc.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-center text-sm text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDdMmYyyy(item.payment_date)}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-700">{item.transaction_name || item.notes || '-'}</p>
                        {item.payment_method && <span className="text-[10px] font-bold text-primary uppercase">{item.payment_method}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${(item.transaction_category || ((item.debit ?? 0) > 0 ? 'Debit' : 'Kredit')) === 'Debit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.transaction_category || ((item.debit ?? 0) > 0 ? 'Debit' : 'Kredit')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-600 whitespace-nowrap">
                        {(item.debit ?? 0) > 0 ? formatRupiah(item.debit) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-red-600 whitespace-nowrap">
                        {(item.credit ?? 0) > 0 ? formatRupiah(item.credit) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 whitespace-nowrap">{formatRupiah(sisaAfter[item.id] ?? 0)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{item.estimasi_date ? formatDdMmYyyy(item.estimasi_date) : '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.status || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button" onClick={() => printReceipt(item, idx)} className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[9px] font-bold text-gray-500 hover:bg-gray-100 uppercase">
                            <Printer size={10} /> Kwitansi
                          </button>
                          <button type="button" onClick={() => handleOpenModal('pemasukan', item)} className="p-1.5 text-gray-300 hover:text-amber-500">
                            <Edit2 size={14} />
                          </button>
                          <button type="button" onClick={() => handleDeletePayment(item.id)} className="p-1.5 text-gray-300 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
              <tfoot>
                <tr className="bg-green-50/20 font-bold border-t border-green-100">
                  <td colSpan={3} className="px-6 py-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Terbayar (net)</td>
                  <td colSpan={3} className="px-6 py-4 text-right text-base font-bold text-green-600">{formatRupiah(totalPemasukan)}</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form Tambah/Edit Data */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest">
                {editingItem ? 'Edit' : 'Tambah'} {
                  modalType === 'tagihan' ? 'Tagihan' : 'Riwayat Transaksi'
                }
              </h3>
              <button onClick={() => {setShowModal(false); setEditingItem(null);}} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalType === 'tagihan' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Uraian Tagihan</label>
                    <input name="uraian" defaultValue={editingItem?.jenis} required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nominal (Rp)</label>
                    <input name="nominal" defaultValue={editingItem?.harga} required type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal *</label>
                      <input name="payment_date" defaultValue={editingItem?.payment_date} required type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                      <select
                        name="category"
                        value={modalCategory}
                        onChange={(e) => setModalCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      >
                        <option value="">Pilih kategori...</option>
                        <option value="Booking Fee">Booking Fee</option>
                        <option value="Angsuran">Angsuran</option>
                        <option value="Pelunasan">Pelunasan</option>
                        <option value="Refund">Refund</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    {modalCategory === 'Lainnya' && (
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategori (ketik sendiri)</label>
                        <input name="category_lainnya" value={modalCategoryLainnya} onChange={(e) => setModalCategoryLainnya(e.target.value)} type="text" placeholder="Tulis kategori transaksi" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                      </div>
                    )}
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Transaksi</label>
                      <input name="transaction_name" defaultValue={editingItem?.transaction_name ?? editingItem?.notes} type="text" placeholder="Contoh: DP 1 / Angsuran" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Debit (Pembayaran)</label>
                      <input name="debit" defaultValue={editingItem?.debit ?? (editingItem?.amount != null && editingItem.amount >= 0 ? editingItem.amount : '')} type="number" min={0} placeholder="0" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kredit (Pengembalian)</label>
                      <input name="credit" defaultValue={editingItem?.credit ?? (editingItem?.amount != null && editingItem.amount < 0 ? -editingItem.amount : '')} type="number" min={0} placeholder="0" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estimasi (tanggal)</label>
                      <input name="estimasi_date" defaultValue={editingItem?.estimasi_date} type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Metode Pembayaran</label>
                      <input name="payment_method" defaultValue={editingItem?.payment_method} type="text" placeholder="Transfer BCA / Cash" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Keterangan</label>
                      <input name="notes" defaultValue={editingItem?.notes} type="text" placeholder="Catatan" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                  </div>
                </>
              )}
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setShowModal(false); setEditingItem(null);}} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2">
                  <Check size={16} />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
