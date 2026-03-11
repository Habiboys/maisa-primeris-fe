import { PackageCheck, Plus, Printer, Save, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

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

  if (!isOpen) return null;

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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = document.getElementById('form-terima-print-content');
    if (!printContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tanda Terima Gudang</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4;
              margin: 1.5cm;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              font-size: 11pt;
              line-height: 1.4;
              color: #000;
            }
            
            .header {
              margin-bottom: 20px;
              position: relative;
            }

            .header-content {
              padding-right: 120px;
            }

            .logo-box {
              position: absolute;
              top: 0;
              right: 0;
              width: 100px;
              height: 100px;
              border: 2px solid #000;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #1a1a1a;
            }

            .logo-text {
              color: #b7860f;
              font-size: 16pt;
              font-weight: bold;
              font-style: italic;
              text-align: center;
              line-height: 1.2;
            }
            
            .header h1 {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .header .address {
              font-size: 9pt;
              margin-bottom: 15px;
            }
            
            .header h2 {
              font-size: 12pt;
              font-weight: bold;
              text-decoration: underline;
              margin-top: 10px;
              text-align: center;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            
            table, th, td {
              border: 1px solid #000;
            }
            
            th {
              background-color: #f5f5f5;
              padding: 8px;
              text-align: center;
              font-weight: bold;
              font-size: 10pt;
            }
            
            td {
              padding: 8px 6px;
              font-size: 10pt;
            }
            
            .footer {
              margin-top: 30px;
            }
            
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
            }
            
            .signature-box {
              width: 30%;
              text-align: center;
            }
            
            .signature-box .label {
              font-weight: bold;
              margin-bottom: 60px;
            }
            
            .signature-box .name {
              border-top: 1px solid #000;
              padding-top: 5px;
              display: inline-block;
              min-width: 150px;
            }

            .signature-box .subtitle {
              font-size: 9pt;
              margin-top: 3px;
            }
            
            .location-date {
              text-align: right;
              margin-bottom: 10px;
              font-size: 10pt;
            }
            
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
      tanggal: new Date().toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
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

  const currentDate = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

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
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              <Printer size={18} />
              <span>Cetak Preview</span>
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

          {/* Right Side: LIVE PREVIEW */}
          <div className="flex-1 bg-[#4b5563] overflow-y-auto p-12 flex justify-center no-scrollbar">
            <div 
              className="w-[750px] bg-white shadow-2xl min-h-[950px] p-12 flex flex-col origin-top transform scale-[1.02]" 
              id="form-terima-print-content"
            >
              {/* Header Surat */}
              <div className="flex items-center justify-between border-b-4 border-gray-900 pb-6 mb-8">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-2">MAISA PRIMERIS NANGGALO</h1>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    JL. Batang Marao No.9, RT.3 RW.10, Alai Parak Kopi,<br/>
                    Kec. Padang Utara, Kota Padang - Sumatera Barat
                  </p>
                </div>
                <div className="w-20 h-20 bg-gray-900 flex flex-col items-center justify-center border-2 border-gray-900 p-2">
                  <span className="text-primary font-black italic text-sm">MAISA</span>
                  <span className="text-white text-[6px] tracking-[0.2em] font-bold border-t border-white/20 mt-1 pt-1">GUDANG</span>
                </div>
              </div>

              <div className="text-center mb-10">
                <h2 className="text-xl font-black uppercase underline decoration-2 underline-offset-4 tracking-wider">
                  Tanda Terima Gudang
                </h2>
                <p className="text-xs font-bold text-gray-700 mt-1">Nomor: {formData.noTerima || '____________________'}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-2">INTERNAL WAREHOUSE DOCUMENT</p>
              </div>

              {/* Meta Data */}
              <div className="flex justify-between items-start mb-10 text-sm">
                <div className="space-y-1.5 flex-1">
                  <div className="flex gap-4">
                    <span className="w-28 text-[10px] font-black text-gray-400 uppercase">Diterima Dari</span>
                    <span className="font-black text-gray-900">: {formData.supplier || '_______________________'}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="w-28 text-[10px] font-black text-gray-400 uppercase">Penerima</span>
                    <span className="font-black text-gray-900">: {formData.penerima || '_______________________'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900">Padang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-[10px] text-primary font-black tracking-widest uppercase mt-1">Maisa Logistics</p>
                </div>
              </div>

              {/* Table Material */}
              <div className="flex-1">
                <table className="w-full border-2 border-gray-900">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border-2 border-gray-900 p-3 text-center text-[10px] font-black w-12 uppercase tracking-tighter">No</th>
                      <th className="border-2 border-gray-900 p-3 text-left text-[10px] font-black uppercase tracking-tighter">Daftar Material / Barang Masuk</th>
                      <th className="border-2 border-gray-900 p-3 text-center text-[10px] font-black w-24 uppercase tracking-tighter">Volume</th>
                      <th className="border-2 border-gray-900 p-3 text-center text-[10px] font-black w-24 uppercase tracking-tighter">Satuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialRows.length > 0 ? materialRows.map((row, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="border-2 border-gray-900 p-3 text-center text-xs font-bold">{idx + 1}</td>
                        <td className="border-2 border-gray-900 p-3 text-xs font-black uppercase">{row.namaBarang}</td>
                        <td className="border-2 border-gray-900 p-3 text-center text-sm font-black text-primary">{row.qty}</td>
                        <td className="border-2 border-gray-900 p-3 text-center text-xs font-bold">{row.satuan}</td>
                      </tr>
                    )) : (
                      Array(10).fill(0).map((_, idx) => (
                        <tr key={idx} className="h-9">
                          <td className="border-2 border-gray-900 p-3 text-center text-xs text-gray-100">{idx + 1}</td>
                          <td className="border-2 border-gray-900 p-3"></td>
                          <td className="border-2 border-gray-900 p-3"></td>
                          <td className="border-2 border-gray-900 p-3"></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signature Area */}
              <div className="mt-20 grid grid-cols-3 gap-12 text-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase mb-24 tracking-widest pb-1 border-b border-gray-100">Mengetahui</span>
                  <div className="border-t-2 border-gray-900 pt-2">
                    <span className="text-xs font-black uppercase tracking-tight">{mengetahui || '..........................'}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase mb-24 tracking-widest pb-1 border-b border-gray-100">Pengirim / Rekanan</span>
                  <div className="border-t-2 border-gray-900 pt-2">
                    <span className="text-xs font-black uppercase tracking-tight">{pengirim || '..........................'}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase mb-24 tracking-widest pb-1 border-b border-gray-100">Logistik / Gudang</span>
                  <div className="border-t-2 border-gray-900 pt-2">
                    <span className="text-xs font-black uppercase tracking-tight">{formData.penerima || '..........................'}</span>
                  </div>
                </div>
              </div>

              {/* Footnote */}
              <div className="mt-auto pt-10 text-[7px] text-gray-400 font-bold uppercase tracking-[0.4em] flex justify-between items-center border-t border-gray-50">
                <span>Maisa Primeris Warehouse Management System</span>
                <span>Dokumen Sah Logistik</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};