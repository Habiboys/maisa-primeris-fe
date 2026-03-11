import { ClipboardList, Plus, Printer, Save, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

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

  if (!isOpen) return null;

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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = document.getElementById('form-inventaris-print-content');
    if (!printContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daftar Inventaris Lapangan</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4 landscape;
              margin: 1.5cm;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              font-size: 10pt;
              line-height: 1.3;
              color: #000;
            }
            
            .header {
              margin-bottom: 15px;
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
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 3px;
            }
            
            .header .address {
              font-size: 8pt;
              margin-bottom: 10px;
            }
            
            .header h2 {
              font-size: 11pt;
              font-weight: bold;
              text-align: center;
              margin-top: 8px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            
            table, th, td {
              border: 1px solid #000;
            }
            
            th {
              background-color: #f5f5f5;
              padding: 6px 4px;
              text-align: center;
              font-weight: bold;
              font-size: 9pt;
            }
            
            td {
              padding: 5px 4px;
              font-size: 9pt;
            }
            
            .footer {
              margin-top: 20px;
            }
            
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
            }
            
            .signature-box {
              width: 30%;
              text-align: center;
            }
            
            .signature-box .label {
              font-weight: bold;
              margin-bottom: 50px;
              font-size: 9pt;
            }
            
            .signature-box .name {
              border-top: 1px solid #000;
              padding-top: 5px;
              display: inline-block;
              min-width: 150px;
              font-size: 9pt;
            }

            .location-date {
              text-align: right;
              margin-bottom: 10px;
              font-size: 9pt;
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
      
      toast.success('Inventaris berhasil diupdate');
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
      
      toast.success(`${filledItems.length} inventaris berhasil disimpan`);
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
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              <Printer size={18} />
              <span>Cetak (Landscape)</span>
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

          {/* Right Side: LIVE PREVIEW (LANDSCAPE) */}
          <div className="flex-1 bg-[#4b5563] overflow-y-auto p-12 flex justify-center no-scrollbar">
            <div 
              className="w-[1100px] bg-white shadow-2xl min-h-[750px] p-12 flex flex-col origin-top transform scale-[0.95]" 
              id="form-inventaris-print-content"
            >
              {/* Header Surat */}
              <div className="flex justify-between items-center border-b-4 border-gray-900 pb-6 mb-8">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-2">MAISA PRIMERIS NANGGALO</h1>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    JL. Batang Marao No.9, RT.3 RW.10, Alai Parak Kopi, Kec. Padang Utara, Kota Padang
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900">
                    Daftar Inventaris Lapangan
                  </h2>
                  <p className="text-[10px] font-bold text-primary tracking-[0.2em] mt-1 uppercase italic underline decoration-2 underline-offset-4">Project Asset Management</p>
                </div>
              </div>

              {/* Table Material */}
              <div className="flex-1">
                <table className="w-full border-2 border-gray-900">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border-2 border-gray-900 p-2 text-center text-[9px] font-black w-10 uppercase">No</th>
                      <th className="border-2 border-gray-900 p-2 text-left text-[9px] font-black uppercase">Uraian / Deskripsi Barang</th>
                      <th className="border-2 border-gray-900 p-2 text-center text-[9px] font-black w-32 uppercase">Tgl Peminjaman</th>
                      <th className="border-2 border-gray-900 p-2 text-center text-[9px] font-black w-32 uppercase">Tgl Kembali</th>
                      <th className="border-2 border-gray-900 p-2 text-center text-[9px] font-black w-20 uppercase">Satuan</th>
                      <th className="border-2 border-gray-900 p-2 text-center text-[9px] font-black w-20 uppercase">Volume</th>
                      <th className="border-2 border-gray-900 p-2 text-center text-[9px] font-black w-24 uppercase">Kondisi</th>
                      <th className="border-2 border-gray-900 p-2 text-center text-[9px] font-black w-24 uppercase">TTD</th>
                      <th className="border-2 border-gray-900 p-2 text-left text-[9px] font-black w-40 uppercase">Lokasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventarisRows.length > 0 ? inventarisRows.map((row, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="border border-gray-900 p-2 text-center text-xs font-bold">{idx + 1}</td>
                        <td className="border border-gray-900 p-2 text-xs font-black uppercase leading-tight">{row.uraian}</td>
                        <td className="border border-gray-900 p-2 text-center text-xs font-medium">{row.tanggalPeminjaman || '-'}</td>
                        <td className="border border-gray-900 p-2 text-center text-xs font-medium">{row.tanggalPengembalian || '-'}</td>
                        <td className="border border-gray-900 p-2 text-center text-xs font-bold uppercase">{row.satuan}</td>
                        <td className="border border-gray-900 p-2 text-center text-sm font-black text-primary">{row.volume}</td>
                        <td className="border border-gray-900 p-2 text-center text-[10px] font-black">{row.kondisi}</td>
                        <td className="border border-gray-900 p-2 text-center text-xs italic text-gray-300">...</td>
                        <td className="border border-gray-900 p-2 text-xs font-medium">{row.lokasi}</td>
                      </tr>
                    )) : (
                      Array(12).fill(0).map((_, idx) => (
                        <tr key={idx} className="h-8">
                          <td className="border border-gray-900 p-2 text-center text-xs text-gray-100">{idx + 1}</td>
                          <td className="border border-gray-900 p-2"></td>
                          <td className="border border-gray-900 p-2"></td>
                          <td className="border border-gray-900 p-2"></td>
                          <td className="border border-gray-900 p-2"></td>
                          <td className="border border-gray-900 p-2"></td>
                          <td className="border border-gray-900 p-2"></td>
                          <td className="border border-gray-900 p-2"></td>
                          <td className="border border-gray-900 p-2"></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signature Area */}
              <div className="mt-12 grid grid-cols-3 gap-12 text-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase mb-20 tracking-widest">Disetujui</span>
                  <div className="border-t-2 border-gray-900 pt-2 mx-10">
                    <span className="text-xs font-black uppercase">{disetujui || '..........................'}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase mb-20 tracking-widest">Diperiksa</span>
                  <div className="border-t-2 border-gray-900 pt-2 mx-10">
                    <span className="text-xs font-black uppercase">{diperiksa || '..........................'}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase mb-4 tracking-widest">Padang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="text-[10px] font-bold text-gray-500 mb-16 uppercase">Logistik / Gudang</span>
                  <div className="border-t-2 border-gray-900 pt-2 mx-10">
                    <span className="text-xs font-black uppercase">{penanggungJawab || '..........................'}</span>
                  </div>
                </div>
              </div>

              {/* Footnote */}
              <div className="mt-auto pt-8 text-[7px] text-gray-400 font-bold uppercase tracking-[0.5em] flex justify-between items-center border-t border-gray-50">
                <span>Maisa Primeris Cluster Project Management</span>
                <span>Asset-Log-V2.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};