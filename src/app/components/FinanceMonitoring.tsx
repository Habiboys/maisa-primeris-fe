import {
    ChevronRight,
    FileText,
    Home,
    Phone,
    Plus
} from 'lucide-react';
import { formatRupiah } from '../../lib/utils';
import type { Consumer } from '../../types';

interface BillingItem {
  id: string;
  label: string;
  amount: number;
  type: 'base' | 'additional' | 'payment';
}

interface MonitoringData {
  id: string;
  no: number;
  name: string;
  phone: string;
  payment_scheme: string;
  unit_code: string;
  items: BillingItem[];
  status: string;
  total_price: number;
  paid_amount: number;
  sisa: number;
}

export function FinanceMonitoring({
  consumers,
  onDetail,
  onAddConsumer,
}: {
  consumers: Consumer[];
  onDetail: (id: string) => void;
  /** Sama dengan aksi "Tambah Piutang" di tab lama — buka modal data konsumen */
  onAddConsumer?: () => void;
}) {
  const data: MonitoringData[] = consumers.map((c, idx) => ({
    id: c.id,
    no: idx + 1,
    name: c.name,
    phone: c.phone || '-',
    payment_scheme: c.payment_scheme || '-',
    unit_code: c.unit_code || '-',
    items: (c.payments || []).map((p, i) => ({
      id: p.id || `p-${i}`,
      label: p.notes || `Pembayaran ${i + 1}`,
      amount: p.amount,
      type: 'payment' as const,
    })),
    status: c.status === 'Lunas' ? 'LUNAS' : c.status === 'Dibatalkan' ? 'HOLD' : 'PROCESS',
    total_price: c.total_price,
    paid_amount: c.paid_amount,
    sisa: c.total_price - c.paid_amount,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HOLD': return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'PROCESS': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'VERIFIED': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'LUNAS': return 'text-green-600 bg-green-50 border-green-100';
      default: return 'text-gray-500 bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Scroll indicator */}
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-primary" />
            <h3 className="text-xs font-bold text-gray-700">Monitoring Keuangan</h3>
          </div>
          <div className="flex items-center gap-2">
            {onAddConsumer && (
              <button
                type="button"
                onClick={onAddConsumer}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary/90 shadow-sm"
              >
                <Plus size={14} strokeWidth={2.5} />
                Tambah Piutang
              </button>
            )}
            <p className="text-[10px] text-gray-500 hidden md:block">Scroll untuk detail →</p>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="w-full text-left border-collapse" style={{ minWidth: '1000px' }}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center w-12">No</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[140px]">Nasabah</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[320px]">Rincian Transaksi</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[180px]">Ringkasan</th>
                <th className="px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center min-w-[100px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <FileText size={48} className="mx-auto text-gray-200 mb-3" />
                    <h4 className="font-bold text-gray-900 mb-1">Belum ada data piutang</h4>
                    <p className="text-sm text-gray-500 mb-4">Tambahkan konsumen untuk mulai memantau pembayaran di monitoring.</p>
                    {onAddConsumer && (
                      <button
                        type="button"
                        onClick={onAddConsumer}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90"
                      >
                        <Plus size={18} />
                        Tambah Piutang
                      </button>
                    )}
                  </td>
                </tr>
              )}
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-4 text-center align-top">
                    <span className="text-xs font-bold text-gray-400">#{row.no}</span>
                  </td>
                  
                  <td className="px-3 py-4 align-top">
                    <div className="space-y-1.5">
                      <p className="font-bold text-gray-900 text-sm uppercase tracking-tight">{row.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Phone size={12} className="text-gray-400" />
                        {row.phone}
                      </p>
                      <span className="inline-block px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded border border-primary/20 uppercase tracking-wider">
                        {row.payment_scheme}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-4 align-top">
                    <div className="space-y-3">
                      {row.items.map((item, idx) => (
                        <div key={item.id} className="group/item">
                          <div className="flex gap-2 items-start">
                            <div className="shrink-0 mt-0.5">
                              {item.type === 'base' && (
                                <div className="w-6 h-6 flex items-center justify-center text-red-500 bg-red-50 rounded-md">
                                  <Home size={13} fill="currentColor" fillOpacity={0.1} />
                                </div>
                              )}
                              {item.type === 'additional' && (
                                <div className="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-md shadow-sm">
                                  <Plus size={11} strokeWidth={3} />
                                </div>
                              )}
                              {item.type === 'payment' && (
                                <div className="w-6 h-6 flex items-center justify-center bg-green-500 text-white rounded-full shadow-sm">
                                  <Plus size={11} strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-600 leading-snug line-clamp-2">
                                {item.label}
                              </p>
                              <p className="text-sm font-bold text-gray-900 mt-0.5">
                                {formatRupiah(item.amount)}
                              </p>
                            </div>
                          </div>
                          {idx < row.items.length - 1 && (
                            <div className="mt-3 border-b border-gray-100/60 w-full"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-3 py-4 align-top">
                    <div className="space-y-2.5 min-w-[220px]">
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Tagihan</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(row.status)}`}>
                            {row.status}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-primary tracking-tight">{formatRupiah(row.total_price)}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-2 bg-green-50/50 border border-green-100 rounded-lg">
                          <span className="text-[9px] font-bold text-green-600 uppercase block mb-0.5">Lunas</span>
                          <span className="text-[13px] font-bold text-green-700">{formatRupiah(row.paid_amount)}</span>
                        </div>
                        <div className="flex-1 p-2 bg-red-50/50 border border-red-100 rounded-lg">
                          <span className="text-[9px] font-bold text-red-600 uppercase block mb-0.5">Sisa</span>
                          <span className="text-[13px] font-bold text-red-700">{formatRupiah(row.sisa)}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-4 text-center align-top">
                    <button 
                      onClick={() => onDetail(row.id)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-[12px] font-bold rounded-xl shadow-md shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Detail Data</span>
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}