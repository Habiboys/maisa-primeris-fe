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
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog, useConsumerDetail, usePaymentHistory } from '../../hooks';
import { USE_MOCK_DATA } from '../../lib/config';
import { formatRupiah } from '../../lib/utils';
import type { CreatePaymentPayload } from '../../types';

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

  // When consumer loads, initialise tagihan if empty
  useMemo(() => {
    if (consumer && tagihan.length === 0) {
      setTagihan([
        { id: 't-price', jenis: `Harga Rumah Unit ${consumer.unit_code}`, harga: consumer.total_price },
      ]);
    }
  }, [consumer]);

  // State for modal & editing
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'tagihan' | 'pemasukan' | 'profile'>('tagihan');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Calculations
  const totalTagihan = useMemo(() => tagihan.reduce((acc, curr) => acc + curr.harga, 0), [tagihan]);
  const totalPemasukan = useMemo(() => payments.reduce((acc, curr) => acc + curr.amount, 0), [payments]);
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
    if (USE_MOCK_DATA) {
      toast.success('Data berhasil dihapus');
      return;
    }
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
      const payload: CreatePaymentPayload = {
        payment_date: formData.get('payment_date') as string,
        amount: Number(formData.get('amount')),
        payment_method: (formData.get('payment_method') as string) || undefined,
        notes: (formData.get('notes') as string) || undefined,
      };

      if (USE_MOCK_DATA) {
        toast.success('Data berhasil disimpan (mock)');
      } else {
        try {
          if (editingItem) {
            await updatePayment(editingItem.id, payload);
          } else {
            await createPayment(payload);
          }
        } catch { /* handled in hook */ }
      }
    }

    setShowModal(false);
    setEditingItem(null);
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
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
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

        {/* Table Pemasukan */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h5 className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Riwayat Pemasukan
            </h5>
            <button 
              onClick={() => handleOpenModal('pemasukan')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-[11px] font-bold hover:bg-green-700 transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Input Dana Masuk</span>
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-3 w-16 text-center">No</th>
                <th className="px-6 py-3 w-40">Tanggal</th>
                <th className="px-6 py-3">Uraian Transaksi</th>
                <th className="px-6 py-3 text-right">Jumlah</th>
                <th className="px-6 py-3 text-center w-40">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-center text-sm text-gray-400 font-medium">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.payment_date}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-700">{item.notes || '-'}</p>
                    <span className="text-[10px] font-bold text-green-600 uppercase">{item.payment_method || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-green-600">{formatRupiah(item.amount)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[9px] font-bold text-gray-500 hover:bg-gray-100 uppercase">
                        <Printer size={10} /> Kwitansi
                      </button>
                      <button onClick={() => handleOpenModal('pemasukan', item)} className="p-1.5 text-gray-300 hover:text-amber-500">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeletePayment(item.id)} className="p-1.5 text-gray-300 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-green-50/20 font-bold border-t border-green-100">
                <td colSpan={3} className="px-6 py-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Terbayar</td>
                <td className="px-6 py-4 text-right text-base font-bold text-green-600">{formatRupiah(totalPemasukan)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Table Pengeluaran */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h5 className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Pengembalian Dana / Refund
            </h5>
          </div>
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-2">
            <History size={24} className="text-gray-200" />
            <p className="text-xs font-semibold text-gray-400 italic">Belum ada riwayat pengembalian dana.</p>
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
                  modalType === 'tagihan' ? 'Tagihan' : 'Pemasukan'
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
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal</label>
                      <input name="payment_date" defaultValue={editingItem?.payment_date} required type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Metode Bayar</label>
                      <input name="payment_method" defaultValue={editingItem?.payment_method} type="text" placeholder="Cash / Transfer" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Keterangan</label>
                    <input name="notes" defaultValue={editingItem?.notes} type="text" placeholder="Catatan pembayaran" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jumlah (Rp)</label>
                    <input name="amount" defaultValue={editingItem?.amount} required type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
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
