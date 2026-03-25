import { ClipboardList, Plus, Printer, Save, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { sopService } from '../../services/sop.service';
import { getErrorMessage } from '../../lib/utils';

interface InventarisItem {
  uraian: string;
  tanggalPeminjaman: string;
  tanggalPengembalian: string;
  satuan: string;
  volume: number;
  kondisi: string;
  tandaTangan: string;
  lokasi: string;
}

interface FormInventarisProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  data?: {
    id?: string | number;
    kode?: string;
    namaBarang?: string;
    kategori?: string;
    lokasi?: string;
    kondisi?: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang';
    qty?: number;
    satuan?: string;
    tanggalCatat?: string;
    penanggungJawab?: string;
  } | null;
}

export const FormInventarisLapangan: React.FC<FormInventarisProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  data 
}) => {
  const [inventarisRows, setInventarisRows] = useState<InventarisItem[]>(
    []
  );

  // For editing single item
  const [singleItemMode, setSingleItemMode] = useState(false);
  
  // Local state for current item being added
  const [currentItem, setCurrentItem] = useState<InventarisItem>({
    uraian: '',
    tanggalPeminjaman: new Date().toISOString().split('T')[0],
    tanggalPengembalian: '',
    satuan: '',
    volume: 0,
    kondisi: 'Baik',
    tandaTangan: '',
    lokasi: ''
  });

  const [kode, setKode] = useState('');
  const [kategori, setKategori] = useState('');
  const [disetujui, setDisetujui] = useState('');
  const [diperiksa, setDiperiksa] = useState('');
  const [penanggungJawab, setPenanggungJawab] = useState('');

  // Update form when data prop changes
  useEffect(() => {
    if (data && data.namaBarang) {
      setSingleItemMode(true);
      const row: InventarisItem = {
        uraian: data.namaBarang || '',
        tanggalPeminjaman: data.tanggalCatat || '',
        tanggalPengembalian: '',
        satuan: data.satuan || '',
        volume: data.qty || 0,
        kondisi: data.kondisi || 'Baik',
        tandaTangan: '',
        lokasi: data.lokasi || ''
      };
      setInventarisRows([row]);
      setPenanggungJawab(data.penanggungJawab || '');
      setKode(data.kode || '');
      setKategori(data.kategori || '');
    } else {
      setSingleItemMode(false);
      setInventarisRows([]);
      setDisetujui('');
      setDiperiksa('');
      setPenanggungJawab('');
      setKode('');
      setKategori('');
    }
  }, [data, isOpen]);

  const handleAddItem = () => {
    if (!currentItem.uraian.trim()) {
      toast.error('Uraian barang harus diisi');
      return;
    }
    setInventarisRows([...inventarisRows, currentItem]);
    setCurrentItem({
      uraian: '',
      tanggalPeminjaman: new Date().toISOString().split('T')[0],
      tanggalPengembalian: '',
      satuan: '',
      volume: 0,
      kondisi: 'Baik',
      tandaTangan: '',
      lokasi: ''
    });
    toast.success('Item inventaris ditambahkan');
  };

  const removeItem = (index: number) => {
    setInventarisRows(inventarisRows.filter((_, i) => i !== index));
  };

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getPreviewPayload = useCallback(() => ({
    items: inventarisRows,
    disetujui,
    diperiksa,
    penanggungJawab,
  }), [inventarisRows, disetujui, diperiksa, penanggungJawab]);

  useEffect(() => {
    if (!isOpen) return;
    previewDebounceRef.current && clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      setPreviewLoading(true);
      sopService.getInventarisPreviewHtml(getPreviewPayload())
        .then(html => setPreviewHtml(html))
        .catch(() => setPreviewHtml(''))
        .finally(() => setPreviewLoading(false));
    }, 600);
    return () => { previewDebounceRef.current && clearTimeout(previewDebounceRef.current); };
  }, [isOpen, getPreviewPayload]);

  const handleCetakPdf = async () => {
    try {
      const blob = await sopService.getInventarisPdfBlob(getPreviewPayload());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'InventarisLapangan.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF berhasil diunduh');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const handleSave = () => {
    if (singleItemMode) {
      // Save single item edit - read from table first row
      const firstRow = inventarisRows[0];
      
      if (!firstRow.uraian.trim()) {
        toast.error('Nama barang harus diisi');
        return;
      }

      const saveData: any = {
        kode,
        namaBarang: firstRow.uraian,
        kategori,
        lokasi: firstRow.lokasi,
        kondisi: firstRow.kondisi || 'Baik',
        qty: firstRow.volume,
        satuan: firstRow.satuan,
        tanggalCatat: firstRow.tanggalPeminjaman || new Date().toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        penanggungJawab
      };

      // Include id if editing
      if (data && data.id) {
        saveData.id = data.id;
      }

      if (onSave) {
        onSave(saveData);
      }
    } else {
      // Save batch items
      const filledItems = inventarisRows.filter(item => item.uraian.trim() !== '');
      
      if (filledItems.length === 0) {
        toast.error('Minimal harus ada 1 item inventaris yang diisi');
        return;
      }

      const saveData = {
        items: filledItems,
        disetujui,
        diperiksa,
        penanggungJawab,
        tanggal: new Date().toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        })
      };

      if (onSave) {
        onSave(saveData);
      }
    }
    
    onClose();
  };

  const updateInventarisRow = (index: number, field: keyof InventarisItem, value: any) => {
    const newRows = [...inventarisRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setInventarisRows(newRows);
  };

  const addMoreRows = () => {
    setInventarisRows([...inventarisRows, ...Array(5).fill({ 
      uraian: '', 
      tanggalPeminjaman: '', 
      tanggalPengembalian: '', 
      satuan: '', 
      volume: 0, 
      kondisi: '', 
      tandaTangan: '', 
      lokasi: '' 
    })]);
  };

  if (!isOpen) return null;

  const currentDate = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#f3f4f6] rounded-3xl shadow-2xl max-w-[98vw] w-[1400px] h-[92vh] flex flex-col overflow-hidden border border-white/20">
        
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <ClipboardList size={28} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xl">Draft Inventaris Lapangan</h3>
              <p className="text-gray-500 text-sm">Maisa Primeris App • Monitoring Aset Proyek</p>
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
              <span>Simpan Daftar</span>
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
              {singleItemMode && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <span className="w-6 h-[2px] bg-primary"></span>
                    Identitas Aset
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Kode Inventaris</label>
                    <input
                      type="text"
                      value={kode}
                      onChange={(e) => setKode(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                      placeholder="INV-XXX"
                    />
                  </div>
                </div>
              )}

              {/* ITEM ADDITION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <span className="w-6 h-[2px] bg-primary"></span>
                    Input Aset / Alat
                  </div>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">{inventarisRows.length} Unit</span>
                </div>

                {/* Input Add Item */}
                <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Uraian / Nama Alat</label>
                    <input
                      type="text"
                      value={currentItem.uraian}
                      onChange={(e) => setCurrentItem({...currentItem, uraian: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-transparent rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Molen / Scaffolding / Pompa..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Volume</label>
                      <input
                        type="number"
                        value={currentItem.volume || ''}
                        onChange={(e) => setCurrentItem({...currentItem, volume: Number(e.target.value)})}
                        className="w-full px-4 py-2.5 bg-white border border-transparent rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Satuan</label>
                      <input
                        type="text"
                        value={currentItem.satuan}
                        onChange={(e) => setCurrentItem({...currentItem, satuan: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-transparent rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Unit / Set"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Lokasi Lapangan</label>
                    <input
                      type="text"
                      value={currentItem.lokasi}
                      onChange={(e) => setCurrentItem({...currentItem, lokasi: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-transparent rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Site A / Gudang B..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tgl Pinjam</label>
                      <input
                        type="date"
                        value={currentItem.tanggalPeminjaman}
                        onChange={(e) => setCurrentItem({...currentItem, tanggalPeminjaman: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-transparent rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Kondisi</label>
                      <select
                        value={currentItem.kondisi}
                        onChange={(e) => setCurrentItem({...currentItem, kondisi: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-transparent rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option>Baik</option>
                        <option>Rusak Ringan</option>
                        <option>Rusak Berat</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleAddItem}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Tambah ke Daftar
                  </button>
                </div>

                {/* Added Items List */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar pr-1">
                  {inventarisRows.map((row, index) => (
                    <div key={index} className="group flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center font-bold text-xs text-primary shadow-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">{row.uraian}</p>
                          <p className="text-[10px] text-gray-500 font-bold">{row.volume} {row.satuan} • {row.lokasi} • {row.kondisi}</p>
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
                  {inventarisRows.length === 0 && (
                    <div className="text-center py-6 text-gray-400 italic text-xs border-2 border-dashed border-gray-100 rounded-2xl">
                      Belum ada aset yang dicatat
                    </div>
                  )}
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <span className="w-6 h-[2px] bg-primary"></span>
                  Otorisasi
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    value={disetujui}
                    onChange={(e) => setDisetujui(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xs font-bold"
                    placeholder="Disetujui Oleh"
                  />
                  <input
                    type="text"
                    value={diperiksa}
                    onChange={(e) => setDiperiksa(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xs font-bold"
                    placeholder="Diperiksa Oleh"
                  />
                  <input
                    type="text"
                    value={penanggungJawab}
                    onChange={(e) => setPenanggungJawab(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xs font-bold"
                    placeholder="Logistik / Gudang"
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
                <div className="bg-white shadow-sm max-w-[297mm] w-full min-h-[210mm] overflow-auto">
                  <iframe
                    title="Preview Inventaris Lapangan"
                    srcDoc={previewHtml}
                    className="w-full min-h-[210mm] border-0"
                    style={{ minHeight: '210mm' }}
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