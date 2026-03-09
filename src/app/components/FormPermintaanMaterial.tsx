import { ClipboardList, Plus, Printer, Save, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MaterialItem {
  namaBarang: string;
  qty: number;
  satuan: string;
  keterangan?: string;
}

interface FormPermintaanProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  data?: {
    id: string | number;
    noForm: string;
    tanggal: string;
    divisi: string;
    namaPeminta: string;
    items: MaterialItem[];
    disetujui?: string;
    diperiksa?: string;
  } | null;
}

export const FormPermintaanMaterial: React.FC<FormPermintaanProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  data 
}) => {
  const [formData, setFormData] = useState({
    noForm: data?.noForm || '',
    divisi: data?.divisi || '',
    namaPeminta: data?.namaPeminta || '',
  });

  const [materialRows, setMaterialRows] = useState<MaterialItem[]>(
    data?.items || []
  );

  const [disetujui, setDisetujui] = useState(data?.disetujui || '');
  const [diperiksa, setDiperiksa] = useState(data?.diperiksa || '');

  // Local state for current item being added
  const [currentItem, setCurrentItem] = useState<MaterialItem>({
    namaBarang: '',
    qty: 0,
    satuan: '',
    keterangan: ''
  });

  // Update form when data prop changes
  useEffect(() => {
    if (data) {
      setFormData({
        noForm: data.noForm || '',
        divisi: data.divisi,
        namaPeminta: data.namaPeminta,
      });
      setMaterialRows(data.items || []);
      setDisetujui(data.disetujui || '');
      setDiperiksa(data.diperiksa || '');
    } else {
      // Reset form for new entry
      setFormData({ 
        noForm: `PM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`, 
        divisi: '', 
        namaPeminta: '' 
      });
      setMaterialRows([]);
      setDisetujui('');
      setDiperiksa('');
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
      keterangan: ''
    });
    toast.success('Material ditambahkan ke daftar');
  };

  const removeItem = (index: number) => {
    setMaterialRows(materialRows.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = document.getElementById('form-print-content');
    if (!printContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Form Permintaan Material</title>
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
              text-align: center;
              margin-bottom: 20px;
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
            
            .no-col {
              width: 30px;
              text-align: center;
            }
            
            .material-col {
              width: 35%;
            }
            
            .satuan-col {
              width: 15%;
              text-align: center;
            }
            
            .volume-col {
              width: 15%;
              text-align: center;
            }
            
            .keterangan-col {
              width: 35%;
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
    if (!formData.divisi || !formData.namaPeminta) {
      toast.error('Divisi dan Nama Peminta harus diisi');
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
      disetujui,
      diperiksa,
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
    setMaterialRows([...materialRows, ...Array(5).fill({ namaBarang: '', qty: 0, satuan: '', keterangan: '' })]);
  };

  const currentDate = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#f3f4f6] rounded-3xl shadow-2xl max-w-[95vw] w-[1200px] h-[90vh] flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <ClipboardList size={28} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xl">Draft Permintaan Material</h3>
              <p className="text-gray-500 text-sm">Maisa Primeris App • Form Pengadaan Internal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              <Printer size={18} />
              <span>Preview Cetak</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Save size={18} />
              <span>Simpan Form</span>
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
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nomor Form (ID)</label>
                    <input
                      type="text"
                      value={formData.noForm}
                      onChange={(e) => setFormData({ ...formData, noForm: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-gray-900"
                      placeholder="Contoh: PM-2026-001"
                    />
                  </div>
                </div>
              </div>

              {/* Info Pengaju */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <span className="w-6 h-[2px] bg-primary"></span>
                  Informasi Pengaju
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nama Peminta</label>
                    <input
                      type="text"
                      value={formData.namaPeminta}
                      onChange={(e) => setFormData({ ...formData, namaPeminta: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-gray-900"
                      placeholder="Masukkan nama lengkap..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Divisi / Departemen</label>
                    <input
                      type="text"
                      value={formData.divisi}
                      onChange={(e) => setFormData({ ...formData, divisi: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                      placeholder="Contoh: Project Construction / Finishing"
                    />
                  </div>
                </div>
              </div>

              {/* ITEM ADDITION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <span className="w-6 h-[2px] bg-primary"></span>
                    Material yg Diminta
                  </div>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">{materialRows.length} Baris</span>
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
                      placeholder="Semen / Besi / Cat..."
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
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Keterangan (Opsional)</label>
                    <input
                      type="text"
                      value={currentItem.keterangan}
                      onChange={(e) => setCurrentItem({...currentItem, keterangan: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-transparent rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Untuk unit A1, dll..."
                    />
                  </div>
                  <button
                    onClick={handleAddItem}
                    className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Tambah Material
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
                          <p className="text-[10px] text-gray-500">{row.qty} {row.satuan} {row.keterangan ? `• ${row.keterangan}` : ''}</p>
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
                      Belum ada material yang ditambahkan
                    </div>
                  )}
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <span className="w-6 h-[2px] bg-primary"></span>
                  Persetujuan
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Disetujui Oleh</label>
                    <input
                      type="text"
                      value={disetujui}
                      onChange={(e) => setDisetujui(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xs font-bold"
                      placeholder="Nama Atasan / Manajer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Diperiksa Oleh</label>
                    <input
                      type="text"
                      value={diperiksa}
                      onChange={(e) => setDiperiksa(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xs font-bold"
                      placeholder="Nama Pengawas / Gudang"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Side: LIVE PREVIEW (LETTER LOOK) */}
          <div className="flex-1 bg-[#4b5563] overflow-y-auto p-12 flex justify-center no-scrollbar">
            <div 
              className="w-[750px] bg-white shadow-2xl min-h-[950px] p-12 flex flex-col origin-top transform scale-[1.02]" 
              id="form-print-content"
            >
              {/* Header Surat */}
              <div className="text-center border-b-4 border-gray-900 pb-6 mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">MAISA PRIMERIS MANGGALO</h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.1em]">
                  JL. Barang Marao No.3, RT.3 RW.10, Alai Parak Kopi, Kec. Padang Utara, Kota Padang
                </p>
                <div className="mt-6 inline-block border-2 border-gray-900 px-8 py-2 bg-gray-50 font-black text-xl tracking-widest uppercase">
                  Form Permintaan Material
                </div>
                <p className="text-xs font-bold text-gray-700 mt-2">Nomor: {formData.noForm || '____________________'}</p>
              </div>

              {/* Meta Info */}
              <div className="flex justify-between items-start mb-8 text-sm">
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <span className="w-24 text-gray-500 font-bold uppercase text-[10px]">Nama Peminta</span>
                    <span className="font-black text-gray-900">: {formData.namaPeminta || '_______________________'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-24 text-gray-500 font-bold uppercase text-[10px]">Divisi</span>
                    <span className="font-black text-gray-900">: {formData.divisi || '_______________________'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">Padang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Internal Document</p>
                </div>
              </div>

              {/* Table Material */}
              <div className="flex-1">
                <table className="w-full border-2 border-gray-900">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border-2 border-gray-900 p-3 text-center text-[10px] font-black w-12 uppercase tracking-widest">No</th>
                      <th className="border-2 border-gray-900 p-3 text-left text-[10px] font-black uppercase tracking-widest">Uraian Material</th>
                      <th className="border-2 border-gray-900 p-3 text-center text-[10px] font-black w-24 uppercase tracking-widest">Volume</th>
                      <th className="border-2 border-gray-900 p-3 text-center text-[10px] font-black w-24 uppercase tracking-widest">Satuan</th>
                      <th className="border-2 border-gray-900 p-3 text-left text-[10px] font-black uppercase tracking-widest">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialRows.length > 0 ? materialRows.map((row, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="border-2 border-gray-900 p-3 text-center text-xs font-bold">{idx + 1}</td>
                        <td className="border-2 border-gray-900 p-3 text-xs font-black uppercase">{row.namaBarang}</td>
                        <td className="border-2 border-gray-900 p-3 text-center text-sm font-black text-primary">{row.qty}</td>
                        <td className="border-2 border-gray-900 p-3 text-center text-xs font-bold">{row.satuan}</td>
                        <td className="border-2 border-gray-900 p-3 text-[10px] font-medium leading-tight italic text-gray-600">{row.keterangan || '-'}</td>
                      </tr>
                    )) : (
                      Array(8).fill(0).map((_, idx) => (
                        <tr key={idx} className="h-10">
                          <td className="border-2 border-gray-900 p-3 text-center text-xs text-gray-200">{idx + 1}</td>
                          <td className="border-2 border-gray-900 p-3"></td>
                          <td className="border-2 border-gray-900 p-3"></td>
                          <td className="border-2 border-gray-900 p-3"></td>
                          <td className="border-2 border-gray-900 p-3"></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Persetujuan */}
              <div className="mt-16 grid grid-cols-3 gap-12 text-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase mb-24 tracking-widest border-b border-gray-200 pb-1">Disetujui</span>
                  <div className="border-t-2 border-gray-900 pt-2">
                    <span className="text-xs font-black uppercase">{disetujui || '..........................'}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase mb-24 tracking-widest border-b border-gray-200 pb-1">Diperiksa</span>
                  <div className="border-t-2 border-gray-900 pt-2">
                    <span className="text-xs font-black uppercase">{diperiksa || '..........................'}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase mb-24 tracking-widest border-b border-gray-200 pb-1">Mengajukan</span>
                  <div className="border-t-2 border-gray-900 pt-2">
                    <span className="text-xs font-black uppercase">{formData.namaPeminta || '..........................'}</span>
                  </div>
                </div>
              </div>

              {/* Footnote */}
              <div className="mt-auto pt-10 text-[7px] text-gray-400 font-bold uppercase tracking-[0.3em] flex justify-between items-center border-t border-gray-50">
                <span>Maisa Primeris Procurement Management</span>
                <span>Dokumen Sah Internal v2.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};