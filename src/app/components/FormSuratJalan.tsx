import { Plus, Printer, Save, Trash2, Truck, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { sopService } from '../../services/sop.service';
import { getErrorMessage } from '../../lib/utils';
import { useMaterials } from '../../hooks/useMasterData';

interface BarangItem {
  namaBarang: string;
  satuan: string;
  jumlah: number;
  keterangan: string;
}

interface FormSuratJalanProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  data?: {
    id?: string | number;
    nomorSurat?: string;
    tanggal?: string;
    nomorPO?: string;
    kepada?: string;
    dikirimDengan?: string;
    noPolisi?: string;
    namaPengemudi?: string;
    tandaTerima?: string;
    pengemudi?: string;
    mengetahui?: string;
    items?: BarangItem[];
  } | null;
}

export const FormSuratJalan: React.FC<FormSuratJalanProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  data 
}) => {
  const [barangRows, setBarangRows] = useState<BarangItem[]>(
    data?.items || []
  );

  const [nomorSurat, setNomorSurat] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [nomorPO, setNomorPO] = useState('');
  const [kepada, setKepada] = useState('');
  const [dikirimDengan, setDikirimDengan] = useState('');
  const [noPolisi, setNoPolisi] = useState('');
  const [namaPengemudi, setNamaPengemudi] = useState('');
  const [tandaTerima, setTandaTerima] = useState('');
  const [pengemudi, setPengemudi] = useState('');
  const [mengetahui, setMengetahui] = useState('');

  // Local state for current item being added
  const { materials } = useMaterials();
  const [currentItem, setCurrentItem] = useState<BarangItem>({
    namaBarang: '',
    satuan: '',
    jumlah: 0,
    keterangan: ''
  });

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getPreviewPayload = useCallback(() => ({
    nomorSurat,
    tanggal,
    nomorPO,
    kepada,
    dikirimDengan,
    noPolisi,
    namaPengemudi,
    tandaTerima,
    pengemudi,
    mengetahui,
    items: barangRows.map(r => ({ namaBarang: r.namaBarang, jumlah: r.jumlah, satuan: r.satuan, keterangan: r.keterangan ?? '' })),
  }), [nomorSurat, tanggal, nomorPO, kepada, dikirimDengan, noPolisi, namaPengemudi, tandaTerima, pengemudi, mengetahui, barangRows]);

  useEffect(() => {
    if (!isOpen) return;
    previewDebounceRef.current && clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      setPreviewLoading(true);
      sopService.getSuratJalanPreviewHtml(getPreviewPayload()).then(html => setPreviewHtml(html)).catch(() => setPreviewHtml('')).finally(() => setPreviewLoading(false));
    }, 600);
    return () => { previewDebounceRef.current && clearTimeout(previewDebounceRef.current); };
  }, [isOpen, getPreviewPayload]);

  const handleCetakPdf = async () => {
    try {
      const blob = await sopService.getSuratJalanPdfBlob(getPreviewPayload());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SuratJalan-${nomorSurat || 'draft'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF berhasil diunduh');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  // Update form when data prop changes (for edit mode)
  useEffect(() => {
    if (data) {
      setNomorSurat(data.nomorSurat || '');
      setTanggal(data.tanggal || '');
      setNomorPO(data.nomorPO || '');
      setKepada(data.kepada || '');
      setDikirimDengan(data.dikirimDengan || '');
      setNoPolisi(data.noPolisi || '');
      setNamaPengemudi(data.namaPengemudi || '');
      setTandaTerima(data.tandaTerima || '');
      setPengemudi(data.pengemudi || '');
      setMengetahui(data.mengetahui || '');
      setBarangRows(data.items || []);
    } else {
      // Reset form for new entry
      setNomorSurat('');
      setTanggal(new Date().toISOString().split('T')[0]);
      setNomorPO('');
      setKepada('');
      setDikirimDengan('');
      setNoPolisi('');
      setNamaPengemudi('');
      setTandaTerima('');
      setPengemudi('');
      setMengetahui('');
      setBarangRows([]);
    }
  }, [data, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!currentItem.namaBarang.trim()) {
      toast.error('Nama barang harus diisi');
      return;
    }
    if (currentItem.jumlah <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    setBarangRows([...barangRows, currentItem]);
    setCurrentItem({
      namaBarang: '',
      satuan: '',
      jumlah: 0,
      keterangan: ''
    });
    toast.success('Barang ditambahkan ke daftar');
  };

  const removeItem = (index: number) => {
    setBarangRows(barangRows.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const filledItems = barangRows.filter(item => item.namaBarang.trim() !== '');
    
    if (!nomorSurat.trim()) {
      toast.error('Nomor Surat Jalan harus diisi');
      return;
    }

    if (filledItems.length === 0) {
      toast.error('Minimal harus ada 1 barang yang diisi');
      return;
    }

    const saveData = {
      nomorSurat,
      tanggal: tanggal || new Date().toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }),
      nomorPO,
      kepada,
      dikirimDengan,
      noPolisi,
      namaPengemudi,
      tandaTerima,
      pengemudi,
      mengetahui,
      items: filledItems,
      totalBarang: filledItems.length
    };

    if (onSave) {
      onSave(saveData);
    }
    
    toast.success('Surat Jalan berhasil disimpan');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#f3f4f6] rounded-3xl shadow-2xl max-w-[95vw] w-[1200px] h-[90vh] flex flex-col overflow-hidden border border-white/20">
        
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Truck size={28} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xl">Draft Surat Jalan</h3>
              <p className="text-gray-500 text-sm">Maisa Primeris App • Dokumentasi Logistik</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCetakPdf}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              <Printer size={18} />
              <span>Cetak PDF</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Save size={18} />
              <span>Simpan Dokumen</span>
            </button>
            <button 
              onClick={onClose} 
              className="p-2.5 hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-gray-400"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: Input Form (DRAFTING) */}
          <div className="w-[450px] border-r border-gray-200 bg-white overflow-y-auto no-scrollbar">
            <div className="p-8 space-y-8">
              
              {/* Info Dokumen */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <span className="w-6 h-[2px] bg-primary"></span>
                  Informasi Dokumen
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nomor Surat Jalan</label>
                    <input
                      type="text"
                      value={nomorSurat}
                      onChange={(e) => setNomorSurat(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-gray-900"
                      placeholder="Contoh: SJ-2026-001"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tanggal</label>
                      <input
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nomor PO (Opsional)</label>
                      <input
                        type="text"
                        value={nomorPO}
                        onChange={(e) => setNomorPO(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                        placeholder="PO-XXX"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Pengiriman */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <span className="w-6 h-[2px] bg-primary"></span>
                  Tujuan & Pengiriman
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Kepada / Tujuan</label>
                    <textarea
                      value={kepada}
                      onChange={(e) => setKepada(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium resize-none"
                      placeholder="Nama Penerima / Alamat Tujuan..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dikirim Dengan</label>
                      <input
                        type="text"
                        value={dikirimDengan}
                        onChange={(e) => setDikirimDengan(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                        placeholder="Truk / Pick-up"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">No. Polisi</label>
                      <input
                        type="text"
                        value={noPolisi}
                        onChange={(e) => setNoPolisi(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm uppercase"
                        placeholder="BA 1234 XY"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEM ADDITION (NO MORE EXCEL TABLE) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <span className="w-6 h-[2px] bg-primary"></span>
                    Daftar Barang
                  </div>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">{barangRows.length} Items</span>
                </div>

                {/* Input Add Item */}
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nama Material</label>
                    <select
                      value={currentItem.namaBarang}
                      onChange={(e) => {
                         const mat = materials.find(m => m.name === e.target.value);
                         setCurrentItem({...currentItem, namaBarang: e.target.value, satuan: mat ? mat.unit : currentItem.satuan});
                      }}
                      className="w-full px-4 py-2 bg-white border border-transparent rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">— Pilih Material —</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center bg-white rounded-lg border border-transparent focus-within:ring-2 focus-within:ring-primary/20 transition-all px-3">
                      <input
                        type="number"
                        value={currentItem.jumlah || ''}
                        onChange={(e) => setCurrentItem({...currentItem, jumlah: Number(e.target.value)})}
                        className="w-full py-2 bg-transparent outline-none text-sm font-bold"
                        placeholder="Jumlah"
                      />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Qty</span>
                    </div>
                    <div className="flex items-center bg-white rounded-lg border border-transparent focus-within:ring-2 focus-within:ring-primary/20 transition-all px-3">
                      <input
                        type="text"
                        value={currentItem.satuan}
                        onChange={(e) => setCurrentItem({...currentItem, satuan: e.target.value})}
                        className="w-full py-2 bg-transparent outline-none text-sm font-bold"
                        placeholder="Satuan"
                      />
                    </div>
                  </div>
                  <textarea
                    value={currentItem.keterangan}
                    onChange={(e) => setCurrentItem({...currentItem, keterangan: e.target.value})}
                    rows={1}
                    className="w-full px-4 py-2 bg-white border border-transparent rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    placeholder="Keterangan tambahan..."
                  />
                  <button
                    onClick={handleAddItem}
                    className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Tambah ke Dokumen
                  </button>
                </div>

                {/* Added Items List List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                  {barangRows.map((row, index) => (
                    <div key={index} className="group flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center font-bold text-xs text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">{row.namaBarang}</p>
                          <p className="text-[10px] text-gray-500">{row.jumlah} {row.satuan} • {row.keterangan || '-'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeItem(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {barangRows.length === 0 && (
                    <div className="text-center py-6 text-gray-400 italic text-xs border-2 border-dashed border-gray-100 rounded-2xl">
                      Daftar barang masih kosong
                    </div>
                  )}
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <span className="w-6 h-[2px] bg-primary"></span>
                  Pihak Terkait
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    value={tandaTerima}
                    onChange={(e) => setTandaTerima(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xs font-bold"
                    placeholder="Nama Penerima (Tanda Terima)"
                  />
                  <input
                    type="text"
                    value={pengemudi}
                    onChange={(e) => setPengemudi(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xs font-bold"
                    placeholder="Nama Pengemudi"
                  />
                  <input
                    type="text"
                    value={mengetahui}
                    onChange={(e) => setMengetahui(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xs font-bold"
                    placeholder="Nama Mengetahui (Atasan)"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Right Side: Preview (sama dengan PDF dari server) */}
          <div className="flex-1 bg-gray-200 overflow-hidden flex flex-col min-w-0">
            <div className="px-4 py-2 bg-gray-300 text-xs font-medium text-gray-600 border-b border-gray-300">
              Preview — sama dengan hasil cetak PDF
            </div>
            <div className="flex-1 overflow-auto p-4 flex justify-center">
              {previewLoading ? (
                <div className="self-center text-gray-500 text-sm">Memuat preview...</div>
              ) : previewHtml ? (
                <div className="bg-white shadow-sm max-w-[210mm] w-full min-h-[297mm] overflow-auto">
                  <iframe title="Preview Surat Jalan" srcDoc={previewHtml} className="w-full min-h-[297mm] border-0" style={{ minHeight: '297mm' }} />
                </div>
              ) : (
                <div className="self-center text-gray-400 text-sm">Isi form untuk melihat preview</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};