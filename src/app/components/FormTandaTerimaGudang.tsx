import { PackageCheck, Plus, Printer, Save, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { sopService } from '../../services/sop.service';
import { getErrorMessage } from '../../lib/utils';

interface MaterialItem {
  namaBarang: string;
  qty: number;
  satuan: string;
  namaRekanan?: string;
}

interface FormTandaTerimaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  data?: {
    id: string | number;
    noTerima: string;
    tanggal: string;
    supplier: string;
    penerima: string;
    items: MaterialItem[];
    mengetahui?: string;
    pengirim?: string;
  } | null;
}

export const FormTandaTerimaGudang: React.FC<FormTandaTerimaProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  data 
}) => {
  const [formData, setFormData] = useState({
    noTerima: data?.noTerima || '',
    supplier: data?.supplier || '',
    penerima: data?.penerima || '',
  });

  const [materialRows, setMaterialRows] = useState<MaterialItem[]>(
    data?.items || []
  );

  const [mengetahui, setMengetahui] = useState(data?.mengetahui || '');
  const [pengirim, setPengirim] = useState(data?.pengirim || '');

  // Local state for current item being added
  const [currentItem, setCurrentItem] = useState<MaterialItem>({
    namaBarang: '',
    qty: 0,
    satuan: '',
    namaRekanan: ''
  });

  // Update form when data prop changes
  useEffect(() => {
    if (data) {
      setFormData({
        noTerima: data.noTerima || '',
        supplier: data.supplier,
        penerima: data.penerima,
      });
      setMaterialRows(data.items || []);
      setMengetahui(data.mengetahui || '');
      setPengirim(data.pengirim || '');
    } else {
      // Reset form for new entry
      setFormData({ 
        noTerima: `TTG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        supplier: '', 
        penerima: '' 
      });
      setMaterialRows([]);
      setMengetahui('');
      setPengirim('');
    }
  }, [data, isOpen]);

  const handleAddItem = () => {
    if (!currentItem.namaBarang.trim()) {
      toast.error('Nama barang harus diisi');
      return;
    }
    if (currentItem.qty <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    setMaterialRows([...materialRows, currentItem]);
    setCurrentItem({
      namaBarang: '',
      qty: 0,
      satuan: '',
      namaRekanan: ''
    });
    toast.success('Material ditambahkan');
  };

  const removeItem = (index: number) => {
    setMaterialRows(materialRows.filter((_, i) => i !== index));
  };

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getPreviewPayload = useCallback(() => ({
    noTerima: formData.noTerima,
    supplier: formData.supplier,
    penerima: formData.penerima,
    items: materialRows.map(r => ({ namaBarang: r.namaBarang, qty: r.qty, satuan: r.satuan })),
    mengetahui,
    pengirim,
  }), [formData.noTerima, formData.supplier, formData.penerima, materialRows, mengetahui, pengirim]);

  useEffect(() => {
    if (!isOpen) return;
    previewDebounceRef.current && clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      setPreviewLoading(true);
      sopService.getTTGPreviewHtml(getPreviewPayload()).then(html => {
        setPreviewHtml(html);
      }).catch(() => setPreviewHtml('')).finally(() => setPreviewLoading(false));
    }, 600);
    return () => { previewDebounceRef.current && clearTimeout(previewDebounceRef.current); };
  }, [isOpen, getPreviewPayload]);

  const handleCetakPdf = async () => {
    try {
      const blob = await sopService.getTTGPdfBlob(getPreviewPayload());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TTG-${formData.noTerima || 'draft'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF berhasil diunduh');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const handleSave = () => {
    if (!formData.supplier || !formData.penerima) {
      toast.error('Supplier dan Penerima harus diisi');
      return;
    }

    const filledItems = materialRows.filter(item => item.namaBarang.trim() !== '');
    
    if (filledItems.length === 0) {
      toast.error('Minimal harus ada 1 material yang diisi');
      return;
    }

    const saveData = {
      ...formData,
      items: filledItems,
      mengetahui,
      pengirim,
      // gunakan format ISO (YYYY-MM-DD) supaya backend/moment tidak warning
      tanggal: new Date().toISOString().slice(0, 10),
    };

    if (onSave) {
      onSave(saveData);
    }
    
    onClose();
  };

  const updateMaterialRow = (index: number, field: keyof MaterialItem, value: any) => {
    const newRows = [...materialRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setMaterialRows(newRows);
  };

  const addMoreRows = () => {
    setMaterialRows([...materialRows, ...Array(5).fill({ namaBarang: '', qty: 0, satuan: '', namaRekanan: '' })]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#f3f4f6] rounded-3xl shadow-2xl max-w-[95vw] w-[1200px] h-[90vh] flex flex-col overflow-hidden border border-white/20">
        
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <PackageCheck size={28} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xl">Draft Tanda Terima Gudang</h3>
              <p className="text-gray-500 text-sm">Maisa Primeris App • Logistik & Pergudangan</p>
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
              <span>Simpan Bukti</span>
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
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nomor Tanda Terima</label>
                    <input
                      type="text"
                      value={formData.noTerima}
                      onChange={(e) => setFormData({ ...formData, noTerima: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-gray-900"
                      placeholder="Contoh: TTG-2026-001"
                    />
                  </div>
                </div>
              </div>

              {/* Info Pengiriman */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <span className="w-6 h-[2px] bg-primary"></span>
                  Informasi Penerimaan
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Supplier / Rekanan</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-gray-900"
                      placeholder="Nama PT / Toko..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Penerima (Gudang)</label>
                    <input
                      type="text"
                      value={formData.penerima}
                      onChange={(e) => setFormData({ ...formData, penerima: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                      placeholder="Nama staf gudang..."
                    />
                  </div>
                </div>
              </div>

              {/* ITEM ADDITION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <span className="w-6 h-[2px] bg-primary"></span>
                    Material Masuk
                  </div>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">{materialRows.length} Items</span>
                </div>

                {/* Input Add Item */}
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nama Material</label>
                    <input
                      type="text"
                      value={currentItem.namaBarang}
                      onChange={(e) => setCurrentItem({...currentItem, namaBarang: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-transparent rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Semen / Besi / Batu..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Volume</label>
                      <input
                        type="number"
                        value={currentItem.qty || ''}
                        onChange={(e) => setCurrentItem({...currentItem, qty: Number(e.target.value)})}
                        className="w-full px-4 py-2 bg-white border border-transparent rounded-lg text-sm font-black text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Satuan</label>
                      <input
                        type="text"
                        value={currentItem.satuan}
                        onChange={(e) => setCurrentItem({...currentItem, satuan: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-transparent rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Sak / M3 / Kg"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddItem}
                    className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Konfirmasi Item Masuk
                  </button>
                </div>

                {/* Added Items List */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar pr-1">
                  {materialRows.map((row, index) => (
                    <div key={index} className="group flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center font-bold text-xs text-primary shadow-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">{row.namaBarang}</p>
                          <p className="text-[10px] text-gray-500 font-bold">{row.qty} {row.satuan}</p>
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
                  {materialRows.length === 0 && (
                    <div className="text-center py-6 text-gray-400 italic text-xs border-2 border-dashed border-gray-100 rounded-2xl">
                      Belum ada material yang dicatat
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
                    value={pengirim}
                    onChange={(e) => setPengirim(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xs font-bold"
                    placeholder="Nama Pengirim (Supplier)"
                  />
                  <input
                    type="text"
                    value={mengetahui}
                    onChange={(e) => setMengetahui(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xs font-bold"
                    placeholder="Nama Mengetahui (Pengawas)"
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
                  <iframe
                    title="Preview TTG"
                    srcDoc={previewHtml}
                    className="w-full min-h-[297mm] border-0"
                    style={{ minHeight: '297mm' }}
                  />
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