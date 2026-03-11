import { Plus, Printer, Save, Trash2, Truck, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
  const [currentItem, setCurrentItem] = useState<BarangItem>({
    namaBarang: '',
    satuan: '',
    jumlah: 0,
    keterangan: ''
  });

  const [isAddingItem, setIsAddingItem] = useState(false);

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
    setIsAddingItem(false);
    toast.success('Barang ditambahkan ke daftar');
  };

  const removeItem = (index: number) => {
    setBarangRows(barangRows.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = document.getElementById('surat-jalan-print-content');
    if (!printContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Surat Jalan - ${nomorSurat}</title>
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
              font-size: 10pt;
              line-height: 1.3;
              color: #000;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10px;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
            }

            .header-left h1 {
              font-size: 13pt;
              font-weight: bold;
              margin-bottom: 3px;
            }

            .header-left .address {
              font-size: 8pt;
              line-height: 1.4;
            }

            .logo-box {
              width: 80px;
              height: 80px;
              background-color: #1a1a1a;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #000;
            }

            .logo-text {
              color: #b7860f;
              font-size: 14pt;
              font-weight: bold;
              font-style: italic;
              text-align: center;
              line-height: 1.1;
            }

            .title-bar {
              background-color: #ffeb3b;
              text-align: center;
              padding: 8px;
              margin: 15px 0;
              font-weight: bold;
              font-size: 12pt;
              border: 1px solid #000;
            }

            .info-section {
              display: flex;
              gap: 20px;
              margin-bottom: 15px;
            }

            .kepada-box {
              flex: 1;
              border: 1px solid #000;
              padding: 8px;
              min-height: 100px;
            }

            .kepada-label {
              font-weight: bold;
              margin-bottom: 5px;
            }

            .detail-box {
              flex: 1;
            }

            .detail-row {
              display: flex;
              margin-bottom: 4px;
              font-size: 9pt;
            }

            .detail-label {
              width: 130px;
              font-weight: normal;
            }

            .detail-value {
              flex: 1;
              border-bottom: 1px dotted #000;
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
            
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 30px;
            }
            
            .signature-box {
              width: 30%;
              text-align: center;
            }
            
            .signature-box .label {
              font-weight: bold;
              margin-bottom: 60px;
              font-size: 9pt;
            }
            
            .signature-box .name {
              border-top: 1px solid #000;
              padding-top: 5px;
              display: inline-block;
              min-width: 150px;
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

  const updateBarangRow = (index: number, field: keyof BarangItem, value: any) => {
    const newRows = [...barangRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setBarangRows(newRows);
  };

  const addMoreRows = () => {
    setBarangRows([...barangRows, ...Array(5).fill({ 
      namaBarang: '', 
      satuan: '', 
      jumlah: 0, 
      keterangan: '' 
    })]);
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
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              <Printer size={18} />
              <span>Cetak / PDF</span>
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
                    <input
                      type="text"
                      value={currentItem.namaBarang}
                      onChange={(e) => setCurrentItem({...currentItem, namaBarang: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-transparent rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Nama Barang / Material..."
                    />
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

          {/* Right Side: LIVE PREVIEW (LETTER LOOK) */}
          <div className="flex-1 bg-[#4b5563] overflow-y-auto p-12 flex justify-center no-scrollbar">
            <div 
              className="w-[700px] bg-white shadow-2xl min-h-[900px] p-12 flex flex-col origin-top transform scale-[1.05]" 
              id="surat-jalan-print-content"
            >
              {/* Header Surat */}
              <div className="flex justify-between items-start border-b-2 border-gray-900 pb-5 mb-6">
                <div className="flex-1">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">MAISA PRIMERIS CLUSTER</h1>
                  <p className="text-[10px] text-gray-600 leading-relaxed uppercase font-bold">
                    Jl. Gajah Mada Dalam, RT 002 RW 002, Kel. Kampung Olo,<br/>
                    Kec. Nanggalo, Kota Padang - Sumatera Barat
                  </p>
                </div>
                <div className="w-24 h-24 bg-gray-900 p-2 flex flex-col items-center justify-center border-2 border-gray-900 rounded">
                  <span className="text-primary font-black italic text-xl leading-none">MAISA</span>
                  <span className="text-white font-bold text-[8px] tracking-[0.2em] mt-1 border-t border-white/20 pt-1">PRIMERIS</span>
                </div>
              </div>

              {/* Judul & Nomor */}
              <div className="text-center mb-10">
                <div className="bg-yellow-400 text-gray-900 font-black py-2.5 px-6 inline-block border-2 border-gray-900 mb-2 uppercase tracking-widest text-lg">
                  SURAT JALAN
                </div>
                <p className="text-xs font-bold text-gray-700">Nomor: {nomorSurat || '____________________'}</p>
              </div>

              {/* Info Pengiriman */}
              <div className="flex gap-10 mb-8">
                <div className="flex-1 border-2 border-gray-900 p-5 bg-gray-50/50">
                  <h4 className="font-black text-[10px] text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-1">Tujuan Pengiriman:</h4>
                  <p className="text-sm font-bold text-gray-900 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                    {kepada || '________________________________\n________________________________'}
                  </p>
                </div>
                <div className="flex-1 space-y-2.5">
                  <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Tanggal</span>
                    <span className="text-xs font-bold text-gray-900">{tanggal ? new Date(tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '________________'}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Nomor PO</span>
                    <span className="text-xs font-bold text-gray-900">{nomorPO || '________________'}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Kendaraan</span>
                    <span className="text-xs font-bold text-gray-900">{dikirimDengan || '________________'}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">No. Polisi</span>
                    <span className="text-xs font-bold text-gray-900 tracking-widest uppercase">{noPolisi || '________________'}</span>
                  </div>
                </div>
              </div>

              {/* Table Barang */}
              <div className="flex-1">
                <table className="w-full border-2 border-gray-900">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      <th className="border-2 border-gray-900 p-2.5 text-center text-[10px] font-black w-10 uppercase">No</th>
                      <th className="border-2 border-gray-900 p-2.5 text-left text-[10px] font-black uppercase">Nama Barang / Material</th>
                      <th className="border-2 border-gray-900 p-2.5 text-center text-[10px] font-black w-24 uppercase">Satuan</th>
                      <th className="border-2 border-gray-900 p-2.5 text-center text-[10px] font-black w-20 uppercase">Jumlah</th>
                      <th className="border-2 border-gray-900 p-2.5 text-left text-[10px] font-black uppercase">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barangRows.length > 0 ? barangRows.map((row, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="border-2 border-gray-900 p-2 text-center text-xs font-bold">{idx + 1}</td>
                        <td className="border-2 border-gray-900 p-2 text-xs font-bold uppercase">{row.namaBarang}</td>
                        <td className="border-2 border-gray-900 p-2 text-center text-xs font-bold">{row.satuan}</td>
                        <td className="border-2 border-gray-900 p-2 text-center text-sm font-black text-gray-900">{row.jumlah}</td>
                        <td className="border-2 border-gray-900 p-2 text-[10px] font-medium leading-tight">{row.keterangan || '-'}</td>
                      </tr>
                    )) : (
                      // Fill with empty rows to maintain "letter" height if desired
                      Array(5).fill(0).map((_, idx) => (
                        <tr key={idx} className="h-10">
                          <td className="border-2 border-gray-900 p-2 text-center text-xs text-gray-300 italic">{idx + 1}</td>
                          <td className="border-2 border-gray-900 p-2"></td>
                          <td className="border-2 border-gray-900 p-2"></td>
                          <td className="border-2 border-gray-900 p-2"></td>
                          <td className="border-2 border-gray-900 p-2"></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer / Signatures */}
              <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase mb-20 tracking-widest">Tanda Terima</span>
                  <div className="border-t-2 border-gray-900 pt-1 mx-4">
                    <span className="text-xs font-black uppercase tracking-tight">{tandaTerima || '..........................'}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase mb-20 tracking-widest">Pengemudi</span>
                  <div className="border-t-2 border-gray-900 pt-1 mx-4">
                    <span className="text-xs font-black uppercase tracking-tight">{pengemudi || '..........................'}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase mb-20 tracking-widest">Hormat Kami</span>
                  <div className="border-t-2 border-gray-900 pt-1 mx-4">
                    <span className="text-xs font-black uppercase tracking-tight">{mengetahui || '..........................'}</span>
                  </div>
                </div>
              </div>

              {/* Footnote */}
              <div className="mt-auto pt-10 text-[8px] text-gray-400 font-bold uppercase tracking-[0.2em] flex justify-between items-center border-t border-gray-100">
                <span>Maisa Primeris Logistik System</span>
                <span>Halaman 1 / 1</span>
                <span>Asli: Putih | Copy: Kuning & Merah</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};