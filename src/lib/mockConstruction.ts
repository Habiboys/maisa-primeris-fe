/**
 * lib/mockConstruction.ts
 * Mock data khusus modul Konstruksi/Project yang sebelumnya berada di app/pages/Construction.tsx.
 * Gunakan ini hanya ketika USE_MOCK_DATA aktif agar UI tetap bisa jalan tanpa API.
 */

// Tipe sederhana untuk mock konstruksi (UI-oriented)
export interface ProjectUnit {
  no: string;
  tipe: string;
  progress: number;
  status: string; // Dynamic from ConstructionStatus master data
  qcStatus?: 'Pass' | 'Fail' | 'Ongoing';
  qcReadiness?: number;
  qcTemplateId?: string; // reference to QC template
  timeSchedule?: TimeScheduleItem[];
}

export interface TimeScheduleItem {
  id: number;
  uraianPekerjaan: string;
  biaya: number;
  bobot: number;
  elevasi?: string;
  bulan1?: { minggu1?: number; minggu2?: number; minggu3?: number; minggu4?: number };
  bulan2?: { minggu1?: number; minggu2?: number; minggu3?: number; minggu4?: number };
  bulan3?: { minggu1?: number; minggu2?: number; minggu3?: number; minggu4?: number };
  bulan4?: { minggu1?: number; minggu2?: number; minggu3?: number; minggu4?: number };
  keterangan?: string;
}

export interface ConstructionStatus {
  id: string;
  name: string;
  progress: number;
  color: string; // Tailwind color classes
  order: number;
}

export interface InventoryLog {
  date: string;
  item: string;
  qty: number;
  unit: string;
  type: 'in' | 'out';
  person: string;
}

export interface WorkLog {
  id: number;
  date: string;
  unitNo: string;
  activity: string;
  workerCount: number;
  progressAdded: number;
  status: 'Normal' | 'Lembur' | 'Kendala';
  weather?: 'Cerah' | 'Berawan' | 'Hujan' | 'Hujan Lebat';
  photos?: string[];
  photoData?: { id: string; url: string }[]; // for server photos with IDs
  apiLogId?: string; // real API ID for photo operations
}

export interface Project {
  id: string;
  name: string;
  type: 'cluster' | 'standalone'; // tipe project
  location: string;
  unitsCount: number;
  progress: number;
  status: 'On Progress' | 'Completed' | 'Delayed';
  deadline: string;
  lead: string;
  units: ProjectUnit[];
  inventory: { [unitNo: string]: InventoryLog[] };
  logs: WorkLog[];
  timeSchedule?: TimeScheduleItem[]; // untuk standalone buildings
  qcTemplateId?: string; // reference to QC template untuk standalone
  constructionStatus?: string; // status konstruksi untuk standalone
  layout_svg?: string; // path file SVG layout peta kawasan
}

// Mock project data dipindahkan dari Construction.tsx
export const mockConstructionProjects: Project[] = [
  { 
    id: 'mock-1', 
    name: 'Cluster A: Emerald Heights',
    type: 'cluster',
    location: 'Blok A-F', 
    unitsCount: 45, 
    progress: 85, 
    status: 'On Progress',
    deadline: 'Dec 2026',
    lead: 'Ir. Hendra',
    units: [
      { 
        no: 'A-01', 
        tipe: 'Tipe 36', 
        progress: 100, 
        status: 'Selesai', 
        qcStatus: 'Pass', 
        qcReadiness: 100,
        qcTemplateId: 'tpl-tipe36',
        timeSchedule: [
          { id: 1, uraianPekerjaan: 'Pekerjaan Persiapan & Pembersihan Lahan', biaya: 5200000, bobot: 1.16, bulan1: { minggu1: 1.16 } },
          { id: 2, uraianPekerjaan: 'Pekerjaan Galian Tanah Pondasi', biaya: 8400000, bobot: 1.88, elevasi: '-0.80', bulan1: { minggu1: 0.94, minggu2: 0.94 } },
          { id: 3, uraianPekerjaan: 'Pekerjaan Urugan Pasir Bawah Pondasi', biaya: 6800000, bobot: 1.52, elevasi: '-0.80', bulan1: { minggu2: 1.52 } },
          { id: 4, uraianPekerjaan: 'Pekerjaan Pondasi Batu Kali', biaya: 24600000, bobot: 5.49, elevasi: '-0.60', bulan1: { minggu2: 2.75, minggu3: 2.75 } },
          { id: 5, uraianPekerjaan: 'Pekerjaan Septik Tank & Resapan', biaya: 12500000, bobot: 2.79, elevasi: '-2.50', bulan1: { minggu3: 1.40, minggu4: 1.40 } },
          { id: 6, uraianPekerjaan: 'Pekerjaan Sloof Beton Bertulang', biaya: 18900000, bobot: 4.22, elevasi: '±0.00', bulan1: { minggu3: 2.11, minggu4: 2.11 } },
          { id: 7, uraianPekerjaan: 'Pekerjaan Urugan Tanah & Pemadatan', biaya: 9200000, bobot: 2.05, elevasi: '±0.00', bulan1: { minggu4: 2.05 } },
          { id: 8, uraianPekerjaan: 'Pekerjaan Kolom Lantai 1', biaya: 28400000, bobot: 6.34, elevasi: '+3.50', bulan2: { minggu1: 3.17, minggu2: 3.17 } },
          { id: 9, uraianPekerjaan: 'Pekerjaan Pasangan Dinding Bata Lantai 1', biaya: 32500000, bobot: 7.26, elevasi: '+3.50', bulan2: { minggu2: 2.42, minggu3: 2.42, minggu4: 2.42 } },
          { id: 10, uraianPekerjaan: 'Pekerjaan Balok & Plat Lantai 2', biaya: 42300000, bobot: 9.45, elevasi: '+3.50', bulan2: { minggu3: 3.15, minggu4: 3.15 }, bulan3: { minggu1: 3.15 } },
          { id: 11, uraianPekerjaan: 'Pekerjaan Kolom Lantai 2', biaya: 26800000, bobot: 5.98, elevasi: '+7.00', bulan3: { minggu1: 2.99, minggu2: 2.99 } },
          { id: 12, uraianPekerjaan: 'Pekerjaan Pasangan Dinding Bata Lantai 2', biaya: 28600000, bobot: 6.39, elevasi: '+7.00', bulan3: { minggu2: 2.13, minggu3: 2.13, minggu4: 2.13 } },
          { id: 13, uraianPekerjaan: 'Pekerjaan Rangka Atap Kayu', biaya: 32400000, bobot: 7.23, elevasi: '+7.00', bulan3: { minggu3: 3.62, minggu4: 3.62 } },
          { id: 14, uraianPekerjaan: 'Pekerjaan Penutup Atap Genteng Metal', biaya: 24800000, bobot: 5.54, elevasi: '+9.50', bulan3: { minggu4: 2.77 }, bulan4: { minggu1: 2.77 } },
          { id: 15, uraianPekerjaan: 'Pekerjaan Plafond & Rangka Lantai 1', biaya: 18200000, bobot: 4.06, elevasi: '+3.00', bulan4: { minggu1: 2.03, minggu2: 2.03 } },
          { id: 16, uraianPekerjaan: 'Pekerjaan Plafond & Rangka Lantai 2', biaya: 16500000, bobot: 3.68, elevasi: '+6.50', bulan4: { minggu2: 1.84, minggu3: 1.84 } },
          { id: 17, uraianPekerjaan: 'Pekerjaan Plesteran & Acian Lantai 1', biaya: 22400000, bobot: 5.00, bulan4: { minggu1: 2.50, minggu2: 2.50 } },
          { id: 18, uraianPekerjaan: 'Pekerjaan Plesteran & Acian Lantai 2', biaya: 19800000, bobot: 4.42, bulan4: { minggu2: 2.21, minggu3: 2.21 } },
          { id: 19, uraianPekerjaan: 'Pekerjaan Kusen Pintu & Jendela', biaya: 28600000, bobot: 6.39, bulan4: { minggu1: 3.20, minggu2: 3.20 } },
          { id: 20, uraianPekerjaan: 'Pekerjaan Lantai Keramik 40x40', biaya: 24300000, bobot: 5.43, bulan4: { minggu3: 2.72, minggu4: 2.72 } },
          { id: 21, uraianPekerjaan: 'Pekerjaan Instalasi Listrik & Lampu', biaya: 18700000, bobot: 4.17, bulan4: { minggu3: 2.09, minggu4: 2.09 } },
          { id: 22, uraianPekerjaan: 'Pekerjaan Instalasi Air Bersih & Sanitasi', biaya: 16400000, bobot: 3.66, bulan4: { minggu3: 1.83, minggu4: 1.83 } },
          { id: 23, uraianPekerjaan: 'Pekerjaan Pengecatan Seluruh Bangunan', biaya: 14200000, bobot: 3.17, bulan4: { minggu4: 3.17 } },
          { id: 24, uraianPekerjaan: 'Pekerjaan Cleaning & Finishing', biaya: 4800000, bobot: 1.07, bulan4: { minggu4: 1.07 } },
        ]
      },
      { 
        no: 'A-02', 
        tipe: 'Tipe 36', 
        progress: 100, 
        status: 'Finishing', 
        qcStatus: 'Ongoing', 
        qcReadiness: 85,
        qcTemplateId: 'tpl-tipe36',
        timeSchedule: [
          { id: 1, uraianPekerjaan: 'Pekerjaan Persiapan & Pembersihan Lahan', biaya: 5200000, bobot: 1.16, bulan1: { minggu1: 1.16 } },
          { id: 2, uraianPekerjaan: 'Pekerjaan Galian Tanah Pondasi', biaya: 8400000, bobot: 1.88, elevasi: '-0.80', bulan1: { minggu1: 0.94, minggu2: 0.94 } },
          { id: 3, uraianPekerjaan: 'Pekerjaan Urugan Pasir Bawah Pondasi', biaya: 6800000, bobot: 1.52, elevasi: '-0.80', bulan1: { minggu2: 1.52 } },
          { id: 4, uraianPekerjaan: 'Pekerjaan Pondasi Batu Kali', biaya: 24600000, bobot: 5.49, elevasi: '-0.60', bulan1: { minggu2: 2.75, minggu3: 2.75 } },
          { id: 5, uraianPekerjaan: 'Pekerjaan Septik Tank & Resapan', biaya: 12500000, bobot: 2.79, elevasi: '-2.50', bulan1: { minggu3: 1.40, minggu4: 1.40 } },
          { id: 6, uraianPekerjaan: 'Pekerjaan Sloof Beton Bertulang', biaya: 18900000, bobot: 4.22, elevasi: '±0.00', bulan1: { minggu3: 2.11, minggu4: 2.11 } },
          { id: 7, uraianPekerjaan: 'Pekerjaan Urugan Tanah & Pemadatan', biaya: 9200000, bobot: 2.05, elevasi: '±0.00', bulan1: { minggu4: 2.05 } },
          { id: 8, uraianPekerjaan: 'Pekerjaan Kolom Lantai 1', biaya: 28400000, bobot: 6.34, elevasi: '+3.50', bulan2: { minggu1: 3.17, minggu2: 3.17 } },
          { id: 9, uraianPekerjaan: 'Pekerjaan Pasangan Dinding Bata Lantai 1', biaya: 32500000, bobot: 7.26, elevasi: '+3.50', bulan2: { minggu2: 2.42, minggu3: 2.42, minggu4: 2.42 } },
          { id: 10, uraianPekerjaan: 'Pekerjaan Balok & Plat Lantai 2', biaya: 42300000, bobot: 9.45, elevasi: '+3.50', bulan2: { minggu3: 3.15, minggu4: 3.15 }, bulan3: { minggu1: 3.15 } },
          { id: 11, uraianPekerjaan: 'Pekerjaan Kolom Lantai 2', biaya: 26800000, bobot: 5.98, elevasi: '+7.00', bulan3: { minggu1: 2.99, minggu2: 2.99 } },
          { id: 12, uraianPekerjaan: 'Pekerjaan Pasangan Dinding Bata Lantai 2', biaya: 28600000, bobot: 6.39, elevasi: '+7.00', bulan3: { minggu2: 2.13, minggu3: 2.13, minggu4: 2.13 } },
          { id: 13, uraianPekerjaan: 'Pekerjaan Rangka Atap Kayu', biaya: 32400000, bobot: 7.23, elevasi: '+7.00', bulan3: { minggu3: 3.62, minggu4: 3.62 } },
          { id: 14, uraianPekerjaan: 'Pekerjaan Penutup Atap Genteng Metal', biaya: 24800000, bobot: 5.54, elevasi: '+9.50', bulan3: { minggu4: 2.77 }, bulan4: { minggu1: 2.77 } },
          { id: 15, uraianPekerjaan: 'Pekerjaan Plafond & Rangka Lantai 1', biaya: 18200000, bobot: 4.06, elevasi: '+3.00', bulan4: { minggu1: 2.03, minggu2: 2.03 } },
          { id: 16, uraianPekerjaan: 'Pekerjaan Plafond & Rangka Lantai 2', biaya: 16500000, bobot: 3.68, elevasi: '+6.50', bulan4: { minggu2: 1.84, minggu3: 1.84 } },
          { id: 17, uraianPekerjaan: 'Pekerjaan Plesteran & Acian Lantai 1', biaya: 22400000, bobot: 5.00, bulan4: { minggu1: 2.50, minggu2: 2.50 } },
          { id: 18, uraianPekerjaan: 'Pekerjaan Plesteran & Acian Lantai 2', biaya: 19800000, bobot: 4.42, bulan4: { minggu2: 2.21, minggu3: 2.21 } },
          { id: 19, uraianPekerjaan: 'Pekerjaan Kusen Pintu & Jendela', biaya: 28600000, bobot: 6.39, bulan4: { minggu1: 3.20, minggu2: 3.20 } },
          { id: 20, uraianPekerjaan: 'Pekerjaan Lantai Keramik 40x40', biaya: 24300000, bobot: 5.43, bulan4: { minggu3: 2.72, minggu4: 2.72 } },
          { id: 21, uraianPekerjaan: 'Pekerjaan Instalasi Listrik & Lampu', biaya: 18700000, bobot: 4.17, bulan4: { minggu3: 2.09, minggu4: 2.09 } },
          { id: 22, uraianPekerjaan: 'Pekerjaan Instalasi Air Bersih & Sanitasi', biaya: 16400000, bobot: 3.66, bulan4: { minggu3: 1.83, minggu4: 1.83 } },
          { id: 23, uraianPekerjaan: 'Pekerjaan Pengecatan Seluruh Bangunan', biaya: 14200000, bobot: 3.17, bulan4: { minggu4: 3.17 } },
        ]
      },
      { 
        no: 'A-03', 
        tipe: 'Tipe 45', 
        progress: 85, 
        status: 'Pemasangan Daun Pintu', 
        qcStatus: 'Fail', 
        qcReadiness: 70,
        qcTemplateId: 'tpl-tipe45',
        timeSchedule: [
          { id: 1, uraianPekerjaan: 'Pekerjaan Persiapan & Pembersihan Lahan', biaya: 6200000, bobot: 1.09, bulan1: { minggu1: 1.09 } },
          { id: 2, uraianPekerjaan: 'Pekerjaan Galian Tanah Pondasi', biaya: 10500000, bobot: 1.85, elevasi: '-0.80', bulan1: { minggu1: 0.93, minggu2: 0.93 } },
          { id: 3, uraianPekerjaan: 'Pekerjaan Urugan Pasir Bawah Pondasi', biaya: 8200000, bobot: 1.44, elevasi: '-0.80', bulan1: { minggu2: 1.44 } },
          { id: 4, uraianPekerjaan: 'Pekerjaan Pondasi Batu Kali', biaya: 31200000, bobot: 5.49, elevasi: '-0.60', bulan1: { minggu2: 2.75, minggu3: 2.75 } },
          { id: 5, uraianPekerjaan: 'Pekerjaan Septik Tank & Resapan', biaya: 14800000, bobot: 2.61, elevasi: '-2.50', bulan1: { minggu3: 1.31, minggu4: 1.31 } },
          { id: 6, uraianPekerjaan: 'Pekerjaan Sloof Beton Bertulang', biaya: 23400000, bobot: 4.12, elevasi: '±0.00', bulan1: { minggu3: 2.06, minggu4: 2.06 } },
          { id: 7, uraianPekerjaan: 'Pekerjaan Urugan Tanah & Pemadatan', biaya: 11500000, bobot: 2.02, elevasi: '±0.00', bulan1: { minggu4: 2.02 } },
          { id: 8, uraianPekerjaan: 'Pekerjaan Kolom Lantai 1', biaya: 35600000, bobot: 6.27, elevasi: '+3.50', bulan2: { minggu1: 3.14, minggu2: 3.14 } },
          { id: 9, uraianPekerjaan: 'Pekerjaan Pasangan Dinding Bata Lantai 1', biaya: 41200000, bobot: 7.25, elevasi: '+3.50', bulan2: { minggu2: 2.42, minggu3: 2.42, minggu4: 2.42 } },
          { id: 10, uraianPekerjaan: 'Pekerjaan Balok & Plat Lantai 2', biaya: 52800000, bobot: 9.30, elevasi: '+3.50', bulan2: { minggu3: 3.10, minggu4: 3.10 }, bulan3: { minggu1: 3.10 } },
          { id: 11, uraianPekerjaan: 'Pekerjaan Kolom Lantai 2', biaya: 33500000, bobot: 5.90, elevasi: '+7.00', bulan3: { minggu1: 2.95, minggu2: 2.95 } },
          { id: 12, uraianPekerjaan: 'Pekerjaan Pasangan Dinding Bata Lantai 2', biaya: 36200000, bobot: 6.37, elevasi: '+7.00', bulan3: { minggu2: 2.12, minggu3: 2.12, minggu4: 2.12 } },
          { id: 13, uraianPekerjaan: 'Pekerjaan Rangka Atap Kayu', biaya: 40500000, bobot: 7.13, elevasi: '+7.00', bulan3: { minggu3: 3.57, minggu4: 3.57 } },
          { id: 14, uraianPekerjaan: 'Pekerjaan Penutup Atap Genteng Metal', biaya: 31200000, bobot: 5.49, elevasi: '+9.50', bulan3: { minggu4: 2.75 }, bulan4: { minggu1: 2.75 } },
          { id: 15, uraianPekerjaan: 'Pekerjaan Plafond & Rangka Lantai 1', biaya: 22800000, bobot: 4.01, elevasi: '+3.00', bulan4: { minggu1: 2.01, minggu2: 2.01 } },
          { id: 16, uraianPekerjaan: 'Pekerjaan Plafond & Rangka Lantai 2', biaya: 20600000, bobot: 3.63, elevasi: '+6.50', bulan4: { minggu2: 1.82, minggu3: 1.82 } },
          { id: 17, uraianPekerjaan: 'Pekerjaan Plesteran & Acian Lantai 1', biaya: 28100000, bobot: 4.95, bulan4: { minggu1: 2.48, minggu2: 2.48 } },
          { id: 18, uraianPekerjaan: 'Pekerjaan Plesteran & Acian Lantai 2', biaya: 24800000, bobot: 4.37, bulan4: { minggu2: 2.19, minggu3: 2.19 } },
          { id: 19, uraianPekerjaan: 'Pekerjaan Kusen Pintu & Jendela', biaya: 35800000, bobot: 6.30, bulan4: { minggu1: 3.15, minggu2: 3.15 } },
          { id: 20, uraianPekerjaan: 'Pekerjaan Lantai Keramik 40x40', biaya: 30400000, bobot: 5.35, bulan4: { minggu3: 2.68, minggu4: 2.68 } },
          { id: 21, uraianPekerjaan: 'Pekerjaan Instalasi Listrik & Lampu', biaya: 23400000, bobot: 4.12, bulan4: { minggu3: 2.06, minggu4: 2.06 } },
          { id: 22, uraianPekerjaan: 'Pekerjaan Instalasi Air Bersih & Sanitasi', biaya: 20500000, bobot: 3.61, bulan4: { minggu3: 1.81, minggu4: 1.81 } },
        ]
      },
      { 
        no: 'B-01', 
        tipe: 'Tipe 60', 
        progress: 40, 
        status: 'Struktur', 
        qcStatus: 'Ongoing', 
        qcReadiness: 45,
        timeSchedule: [
          { id: 1, uraianPekerjaan: 'Pekerjaan Persiapan & Pembersihan Lahan', biaya: 7500000, bobot: 1.02, bulan1: { minggu1: 1.02 } },
          { id: 2, uraianPekerjaan: 'Pekerjaan Galian Tanah Pondasi', biaya: 13400000, bobot: 1.82, elevasi: '-0.80', bulan1: { minggu1: 0.91, minggu2: 0.91 } },
          { id: 3, uraianPekerjaan: 'Pekerjaan Urugan Pasir Bawah Pondasi', biaya: 10200000, bobot: 1.39, elevasi: '-0.80', bulan1: { minggu2: 1.39 } },
          { id: 4, uraianPekerjaan: 'Pekerjaan Pondasi Batu Kali', biaya: 38600000, bobot: 5.25, elevasi: '-0.60', bulan1: { minggu2: 2.63, minggu3: 2.63 } },
          { id: 5, uraianPekerjaan: 'Pekerjaan Septik Tank & Resapan', biaya: 18400000, bobot: 2.50, elevasi: '-2.50', bulan1: { minggu3: 1.25, minggu4: 1.25 } },
          { id: 6, uraianPekerjaan: 'Pekerjaan Sloof Beton Bertulang', biaya: 28900000, bobot: 3.93, elevasi: '±0.00', bulan1: { minggu3: 1.97, minggu4: 1.97 } },
          { id: 7, uraianPekerjaan: 'Pekerjaan Urugan Tanah & Pemadatan', biaya: 14200000, bobot: 1.93, elevasi: '±0.00', bulan1: { minggu4: 1.93 } },
          { id: 8, uraianPekerjaan: 'Pekerjaan Kolom Lantai 1', biaya: 44300000, bobot: 6.02, elevasi: '+3.50', bulan2: { minggu1: 3.01, minggu2: 3.01 } },
          { id: 9, uraianPekerjaan: 'Pekerjaan Pasangan Dinding Bata Lantai 1', biaya: 52400000, bobot: 7.12, elevasi: '+3.50', bulan2: { minggu2: 2.37, minggu3: 2.37, minggu4: 2.37 } },
          { id: 10, uraianPekerjaan: 'Pekerjaan Balok & Plat Lantai 2', biaya: 65800000, bobot: 8.95, elevasi: '+3.50', bulan2: { minggu3: 2.98, minggu4: 2.98 }, bulan3: { minggu1: 2.98 } },
        ]
      },
      { 
        no: 'B-02', 
        tipe: 'Tipe 60', 
        progress: 20, 
        status: 'Struktur Bawah', 
        qcStatus: 'Ongoing', 
        qcReadiness: 10,
        timeSchedule: [
          { id: 1, uraianPekerjaan: 'Pekerjaan Persiapan & Pembersihan Lahan', biaya: 7500000, bobot: 1.02, bulan1: { minggu1: 1.02 } },
          { id: 2, uraianPekerjaan: 'Pekerjaan Galian Tanah Pondasi', biaya: 13400000, bobot: 1.82, elevasi: '-0.80', bulan1: { minggu1: 0.91, minggu2: 0.91 } },
          { id: 3, uraianPekerjaan: 'Pekerjaan Urugan Pasir Bawah Pondasi', biaya: 10200000, bobot: 1.39, elevasi: '-0.80', bulan1: { minggu2: 1.39 } },
          { id: 4, uraianPekerjaan: 'Pekerjaan Pondasi Batu Kali', biaya: 38600000, bobot: 5.25, elevasi: '-0.60', bulan1: { minggu2: 2.63, minggu3: 2.63 } },
          { id: 5, uraianPekerjaan: 'Pekerjaan Septik Tank & Resapan', biaya: 18400000, bobot: 2.50, elevasi: '-2.50', bulan1: { minggu3: 1.25 } },
        ]
      },
    ],
    inventory: {
      'A-01': [
        { date: '05 Feb 2026', item: 'Cat Tembok Putih', qty: 2, unit: 'Pail', type: 'out', person: 'Mandor Arie' },
        { date: '01 Feb 2026', item: 'Kuas Cat 4"', qty: 5, unit: 'Pcs', type: 'out', person: 'Mandor Arie' },
      ],
      'A-02': [
        { date: '04 Feb 2026', item: 'Semen Padang', qty: 10, unit: 'Sak', type: 'out', person: 'Bpk. Jajang' },
      ],
      'B-01': [
        { date: '03 Feb 2026', item: 'Besi Beton 10mm', qty: 50, unit: 'Batang', type: 'out', person: 'Mandor Arie' },
      ]
    },
    logs: [
      { 
        id: 1,
        date: '13 Feb 2026', 
        unitNo: 'A2',
        activity: 'Pek. Pas. Kitchen set.', 
        workerCount: 2, 
        progressAdded: 5, 
        status: 'Normal',
        photos: ['https://images.unsplash.com/photo-1634586657092-438d8f1560ae?q=80&w=600']
      },
      { 
        id: 2,
        date: '13 Feb 2026', 
        unitNo: 'E2',
        activity: 'Pek. Acian dinding taman depan, Acian dinding di atas plin tangga, Acian di bawah dinding rooster, Pas. Lampu downlight, Pas. Daun pintu utama, Pas. Kusen alumunium pintu kamar.', 
        workerCount: 4, 
        progressAdded: 3, 
        status: 'Normal',
        photos: ['https://images.unsplash.com/photo-1747762323708-4f7ac8e7e0eb?q=80&w=600']
      },
      { 
        id: 3,
        date: '13 Feb 2026', 
        unitNo: 'B2',
        activity: 'Pek. Acian diatas plin dinding, Acian tekong listrik, Acian pipa buangan air ac.', 
        workerCount: 3, 
        progressAdded: 2, 
        status: 'Normal'
      },
      { 
        id: 4,
        date: '13 Feb 2026', 
        unitNo: 'D3',
        activity: 'Pek. Finishing tangga besi, Pas. Pijakan kayu tangga besi, Pengecatan daun pintu utama, Pas. Smartlock, Pas. Pintu HPL kamar, Taman, Pas. Paving blok.', 
        workerCount: 5, 
        progressAdded: 4, 
        status: 'Normal'
      },
      { 
        id: 5,
        date: '12 Feb 2026', 
        unitNo: 'D6',
        activity: 'Pek. Pas. Granit lantai lt.1, Pas. Granit lantai KM/WC lt.1, Pas. Plin granit dinding, Pas. Instalasi waterheater, Pas. Granit dinding KM/WC lt.1, Pas. Granit lantai lt.2.', 
        workerCount: 4, 
        progressAdded: 6, 
        status: 'Normal',
        photos: ['https://images.unsplash.com/photo-1736182615481-3795ea557614?q=80&w=600']
      },
    ]
  },
  { 
    id: 'mock-2', 
    name: 'Cluster B: Sapphire Garden',
    type: 'cluster',
    location: 'Blok G-K', 
    unitsCount: 32, 
    progress: 40, 
    status: 'On Progress',
    deadline: 'Jun 2027',
    lead: 'Ir. Maya',
    units: [
      { no: 'G-01', tipe: 'Tipe 45', progress: 40, status: 'Pekerjaan Dinding' },
      { no: 'G-02', tipe: 'Tipe 45', progress: 20, status: 'Struktur Bawah' },
      { no: 'H-01', tipe: 'Tipe 60', progress: 5, status: 'Pondasi' },
    ],
    inventory: {},
    logs: []
  },
  { 
    id: 'mock-3', 
    name: 'Gerbang Utama & Pos Keamanan',
    type: 'standalone',
    location: 'Entrance - Area Utama', 
    unitsCount: 0, 
    progress: 100, 
    status: 'Completed',
    deadline: 'Jan 2026',
    lead: 'Ir. Hendra',
    units: [],
    inventory: {
      'main': [
        { date: '15 Jan 2026', item: 'Cat Besi Anti Karat', qty: 5, unit: 'Kaleng', type: 'out', person: 'Mandor Arie' },
        { date: '10 Jan 2026', item: 'Semen Padang', qty: 20, unit: 'Sak', type: 'out', person: 'Bpk. Jajang' },
        { date: '08 Jan 2026', item: 'Besi Hollow 4x4', qty: 30, unit: 'Batang', type: 'out', person: 'Mandor Arie' },
      ]
    },
    logs: [
      { 
        id: 1,
        date: '20 Jan 2026', 
        unitNo: 'Gerbang Utama',
        activity: 'Pengecatan finishing gerbang dan pagar besi', 
        workerCount: 3, 
        progressAdded: 10, 
        status: 'Normal',
        photos: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600']
      },
      { 
        id: 2,
        date: '15 Jan 2026', 
        unitNo: 'Pos Keamanan',
        activity: 'Instalasi CCTV dan sistem barrier otomatis', 
        workerCount: 2, 
        progressAdded: 15, 
        status: 'Normal'
      },
    ],
    timeSchedule: [
      { id: 1, uraianPekerjaan: 'Pekerjaan Persiapan & Pembersihan Lahan', biaya: 8500000, bobot: 2.5, bulan1: { minggu1: 2.5 } },
      { id: 2, uraianPekerjaan: 'Pekerjaan Pondasi Gerbang & Pagar', biaya: 42000000, bobot: 12.3, elevasi: '-0.80', bulan1: { minggu1: 6.15, minggu2: 6.15 } },
      { id: 3, uraianPekerjaan: 'Pekerjaan Struktur Pos Keamanan', biaya: 65000000, bobot: 19.0, elevasi: '±0.00', bulan1: { minggu2: 9.5, minggu3: 9.5 } },
      { id: 4, uraianPekerjaan: 'Pekerjaan Pemasangan Rangka Gerbang Besi', biaya: 85000000, bobot: 24.9, elevasi: '+0.00', bulan1: { minggu3: 12.45, minggu4: 12.45 } },
      { id: 5, uraianPekerjaan: 'Pekerjaan Dinding & Plester Pos Keamanan', biaya: 32000000, bobot: 9.4, elevasi: '+3.50', bulan2: { minggu1: 4.7, minggu2: 4.7 } },
      { id: 6, uraianPekerjaan: 'Pekerjaan Atap Pos Keamanan', biaya: 28000000, bobot: 8.2, elevasi: '+3.50', bulan2: { minggu2: 4.1, minggu3: 4.1 } },
      { id: 7, uraianPekerjaan: 'Pekerjaan Instalasi Listrik & CCTV', biaya: 24000000, bobot: 7.0, bulan2: { minggu3: 3.5, minggu4: 3.5 } },
      { id: 8, uraianPekerjaan: 'Pekerjaan Barrier Otomatis & Sistem Keamanan', biaya: 45000000, bobot: 13.2, bulan2: { minggu4: 6.6 }, bulan3: { minggu1: 6.6 } },
      { id: 9, uraianPekerjaan: 'Pekerjaan Finishing & Pengecatan', biaya: 12000000, bobot: 3.5, bulan3: { minggu1: 1.75, minggu2: 1.75 } },
    ],
    qcTemplateId: 'tpl-standalone',
    constructionStatus: 'Selesai'
  },
  { 
    id: 'mock-4', 
    name: 'Masjid Al-Ikhlas',
    type: 'standalone',
    location: 'Area Pusat Perumahan', 
    unitsCount: 0, 
    progress: 65, 
    status: 'On Progress',
    deadline: 'Sep 2026',
    lead: 'Ir. Ahmad Fauzi',
    units: [],
    inventory: {
      'main': [
        { date: '18 Feb 2026', item: 'Karpet Masjid Premium', qty: 150, unit: 'M2', type: 'out', person: 'Bpk. Usman' },
        { date: '10 Feb 2026', item: 'Genteng Metal Hijau', qty: 200, unit: 'Lembar', type: 'out', person: 'Mandor Dedi' },
        { date: '05 Feb 2026', item: 'Keramik Lantai 60x60', qty: 120, unit: 'Dus', type: 'out', person: 'Mandor Dedi' },
      ]
    },
    logs: [
      { 
        id: 1,
        date: '20 Feb 2026', 
        unitNo: 'Masjid',
        activity: 'Pemasangan karpet masjid dan instalasi sound system', 
        workerCount: 4, 
        progressAdded: 8, 
        status: 'Normal',
        photos: ['https://images.unsplash.com/photo-1564769625905-50e93615e769?q=80&w=600']
      },
      { 
        id: 2,
        date: '15 Feb 2026', 
        unitNo: 'Masjid',
        activity: 'Pengecatan kubah dan pemasangan ornamen kaligrafi', 
        workerCount: 5, 
        progressAdded: 12, 
        status: 'Normal'
      },
    ],
    timeSchedule: [
      { id: 1, uraianPekerjaan: 'Pekerjaan Persiapan & Pembersihan Lahan', biaya: 12000000, bobot: 1.8, bulan1: { minggu1: 1.8 } },
      { id: 2, uraianPekerjaan: 'Pekerjaan Galian Pondasi & Basement', biaya: 48000000, bobot: 7.2, elevasi: '-1.50', bulan1: { minggu1: 3.6, minggu2: 3.6 } },
      { id: 3, uraianPekerjaan: 'Pekerjaan Pondasi Batu Kali & Sloof', biaya: 95000000, bobot: 14.2, elevasi: '-1.00', bulan1: { minggu2: 7.1, minggu3: 7.1 } },
      { id: 4, uraianPekerjaan: 'Pekerjaan Struktur Kolom & Balok Lantai 1', biaya: 125000000, bobot: 18.7, elevasi: '±0.00', bulan1: { minggu3: 9.35, minggu4: 9.35 } },
      { id: 5, uraianPekerjaan: 'Pekerjaan Dinding Bata Lantai 1', biaya: 78000000, bobot: 11.7, elevasi: '+4.50', bulan2: { minggu1: 5.85, minggu2: 5.85 } },
      { id: 6, uraianPekerjaan: 'Pekerjaan Struktur Lantai 2 & Mezanin', biaya: 98000000, bobot: 14.7, elevasi: '+4.50', bulan2: { minggu2: 7.35, minggu3: 7.35 } },
      { id: 7, uraianPekerjaan: 'Pekerjaan Dinding Bata Lantai 2', biaya: 62000000, bobot: 9.3, elevasi: '+9.00', bulan2: { minggu3: 4.65, minggu4: 4.65 } },
      { id: 8, uraianPekerjaan: 'Pekerjaan Kubah Masjid & Menara', biaya: 185000000, bobot: 27.7, elevasi: '+12.00', bulan3: { minggu1: 9.23, minggu2: 9.23, minggu3: 9.23 } },
      { id: 9, uraianPekerjaan: 'Pekerjaan Atap Genteng Metal', biaya: 85000000, bobot: 12.7, elevasi: '+9.00', bulan3: { minggu3: 6.35, minggu4: 6.35 } },
      { id: 10, uraianPekerjaan: 'Pekerjaan Plafond & Ornamen', biaya: 72000000, bobot: 10.8, bulan4: { minggu1: 5.4, minggu2: 5.4 } },
      { id: 11, uraianPekerjaan: 'Pekerjaan Lantai Keramik & Karpet', biaya: 95000000, bobot: 14.2, bulan4: { minggu2: 7.1, minggu3: 7.1 } },
      { id: 12, uraianPekerjaan: 'Pekerjaan Instalasi Listrik & Sound System', biaya: 48000000, bobot: 7.2, bulan4: { minggu3: 3.6, minggu4: 3.6 } },
      { id: 13, uraianPekerjaan: 'Pekerjaan Tempat Wudhu & Sanitasi', biaya: 42000000, bobot: 6.3, bulan4: { minggu3: 3.15, minggu4: 3.15 } },
      { id: 14, uraianPekerjaan: 'Pekerjaan Kaligrafi & Finishing', biaya: 38000000, bobot: 5.7, bulan4: { minggu4: 5.7 } },
    ],
    qcTemplateId: 'tpl-standalone',
    constructionStatus: 'Pekerjaan Atap'
  },
  { 
    id: 'mock-5', 
    name: 'Kantor Marketing & Customer Service',
    type: 'standalone',
    location: 'Area Depan - Dekat Gerbang', 
    unitsCount: 0, 
    progress: 45, 
    status: 'On Progress',
    deadline: 'Jul 2026',
    lead: 'Ir. Maya Sari',
    units: [],
    inventory: {
      'main': [
        { date: '20 Feb 2026', item: 'Kaca Tempered 8mm', qty: 24, unit: 'Lembar', type: 'out', person: 'Bpk. Rahmat' },
        { date: '12 Feb 2026', item: 'Aluminium Frame', qty: 15, unit: 'Batang', type: 'out', person: 'Mandor Arie' },
        { date: '08 Feb 2026', item: 'Plafond Gypsum', qty: 80, unit: 'Lembar', type: 'out', person: 'Mandor Dedi' },
      ]
    },
    logs: [
      { 
        id: 1,
        date: '21 Feb 2026', 
        unitNo: 'Kantor',
        activity: 'Pemasangan partisi kaca dan instalasi AC central', 
        workerCount: 5, 
        progressAdded: 7, 
        status: 'Normal',
        photos: ['https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600']
      },
      { 
        id: 2,
        date: '18 Feb 2026', 
        unitNo: 'Kantor',
        activity: 'Pemasangan plafond gypsum dan instalasi lampu LED', 
        workerCount: 4, 
        progressAdded: 9, 
        status: 'Normal'
      },
    ],
    timeSchedule: [
      { id: 1, uraianPekerjaan: 'Pekerjaan Persiapan & Pembersihan Lahan', biaya: 8500000, bobot: 2.1, bulan1: { minggu1: 2.1 } },
      { id: 2, uraianPekerjaan: 'Pekerjaan Galian Pondasi', biaya: 22000000, bobot: 5.4, elevasi: '-0.80', bulan1: { minggu1: 2.7, minggu2: 2.7 } },
      { id: 3, uraianPekerjaan: 'Pekerjaan Pondasi & Sloof', biaya: 48000000, bobot: 11.8, elevasi: '-0.60', bulan1: { minggu2: 5.9, minggu3: 5.9 } },
      { id: 4, uraianPekerjaan: 'Pekerjaan Struktur Kolom & Balok', biaya: 75000000, bobot: 18.4, elevasi: '±0.00', bulan1: { minggu3: 9.2, minggu4: 9.2 } },
      { id: 5, uraianPekerjaan: 'Pekerjaan Dinding Bata Ringan', biaya: 52000000, bobot: 12.8, elevasi: '+4.00', bulan2: { minggu1: 6.4, minggu2: 6.4 } },
      { id: 6, uraianPekerjaan: 'Pekerjaan Atap Baja Ringan & Spandek', biaya: 45000000, bobot: 11.1, elevasi: '+4.00', bulan2: { minggu2: 5.55, minggu3: 5.55 } },
      { id: 7, uraianPekerjaan: 'Pekerjaan Plafond Gypsum', biaya: 38000000, bobot: 9.3, bulan2: { minggu3: 4.65, minggu4: 4.65 } },
      { id: 8, uraianPekerjaan: 'Pekerjaan Partisi Kaca & Aluminium', biaya: 65000000, bobot: 16.0, bulan3: { minggu1: 8.0, minggu2: 8.0 } },
      { id: 9, uraianPekerjaan: 'Pekerjaan Lantai Granite Tile 80x80', biaya: 48000000, bobot: 11.8, bulan3: { minggu2: 5.9, minggu3: 5.9 } },
      { id: 10, uraianPekerjaan: 'Pekerjaan Instalasi Listrik & Data', biaya: 32000000, bobot: 7.9, bulan3: { minggu3: 3.95, minggu4: 3.95 } },
      { id: 11, uraianPekerjaan: 'Pekerjaan AC Central & Ducting', biaya: 55000000, bobot: 13.5, bulan3: { minggu4: 6.75 }, bulan4: { minggu1: 6.75 } },
      { id: 12, uraianPekerjaan: 'Pekerjaan Sanitasi & Plumbing', biaya: 28000000, bobot: 6.9, bulan4: { minggu1: 3.45, minggu2: 3.45 } },
      { id: 13, uraianPekerjaan: 'Pekerjaan Pengecatan & Wallpaper', biaya: 18000000, bobot: 4.4, bulan4: { minggu2: 2.2, minggu3: 2.2 } },
      { id: 14, uraianPekerjaan: 'Pekerjaan Signage & Landscape', biaya: 15000000, bobot: 3.7, bulan4: { minggu3: 1.85, minggu4: 1.85 } },
    ],
    constructionStatus: 'Pekerjaan Dinding'
  },
  { 
    id: 'mock-6', 
    name: 'Taman & Jogging Track',
    type: 'standalone',
    location: 'Area Hijau - Tengah Perumahan', 
    unitsCount: 0, 
    progress: 30, 
    status: 'On Progress',
    deadline: 'Nov 2026',
    lead: 'Ir. Budi Santoso',
    units: [],
    inventory: {
      'main': [
        { date: '22 Feb 2026', item: 'Rumput Jepang', qty: 500, unit: 'M2', type: 'out', person: 'Bpk. Tono' },
        { date: '15 Feb 2026', item: 'Paving Block Warna Abu', qty: 300, unit: 'M2', type: 'out', person: 'Bpk. Jajang' },
        { date: '10 Feb 2026', item: 'Pohon Tabebuya', qty: 12, unit: 'Pohon', type: 'out', person: 'Bpk. Tono' },
      ]
    },
    logs: [
      { 
        id: 1,
        date: '22 Feb 2026', 
        unitNo: 'Taman',
        activity: 'Penanaman rumput jepang dan pohon pelindung', 
        workerCount: 6, 
        progressAdded: 10, 
        status: 'Normal',
        photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600']
      },
      { 
        id: 2,
        date: '18 Feb 2026', 
        unitNo: 'Jogging Track',
        activity: 'Pengecoran track dan pemasangan paving block', 
        workerCount: 8, 
        progressAdded: 15, 
        status: 'Normal'
      },
    ],
    timeSchedule: [
      { id: 1, uraianPekerjaan: 'Pekerjaan Survey & Desain Landscape', biaya: 15000000, bobot: 5.2, bulan1: { minggu1: 2.6, minggu2: 2.6 } },
      { id: 2, uraianPekerjaan: 'Pekerjaan Pembersihan & Land Clearing', biaya: 18000000, bobot: 6.2, bulan1: { minggu2: 3.1, minggu3: 3.1 } },
      { id: 3, uraianPekerjaan: 'Pekerjaan Cut & Fill Tanah', biaya: 32000000, bobot: 11.0, bulan1: { minggu3: 5.5, minggu4: 5.5 } },
      { id: 4, uraianPekerjaan: 'Pekerjaan Base Jogging Track', biaya: 45000000, bobot: 15.5, bulan2: { minggu1: 7.75, minggu2: 7.75 } },
      { id: 5, uraianPekerjaan: 'Pekerjaan Paving Block Jogging Track', biaya: 52000000, bobot: 17.9, bulan2: { minggu2: 8.95, minggu3: 8.95 } },
      { id: 6, uraianPekerjaan: 'Pekerjaan Sistem Drainase & Irigasi', biaya: 38000000, bobot: 13.1, bulan2: { minggu3: 6.55, minggu4: 6.55 } },
      { id: 7, uraianPekerjaan: 'Pekerjaan Penanaman Rumput', biaya: 28000000, bobot: 9.7, bulan3: { minggu1: 4.85, minggu2: 4.85 } },
      { id: 8, uraianPekerjaan: 'Pekerjaan Penanaman Pohon & Tanaman Hias', biaya: 42000000, bobot: 14.5, bulan3: { minggu2: 7.25, minggu3: 7.25 } },
      { id: 9, uraianPekerjaan: 'Pekerjaan Gazebo & Bangku Taman', biaya: 24000000, bobot: 8.3, bulan3: { minggu3: 4.15, minggu4: 4.15 } },
      { id: 10, uraianPekerjaan: 'Pekerjaan Lampu Taman & Dekoratif', biaya: 18000000, bobot: 6.2, bulan4: { minggu1: 3.1, minggu2: 3.1 } },
      { id: 11, uraianPekerjaan: 'Pekerjaan Instalasi Fitness Outdoor', biaya: 22000000, bobot: 7.6, bulan4: { minggu2: 3.8, minggu3: 3.8 } },
      { id: 12, uraianPekerjaan: 'Pekerjaan Signage & Finishing', biaya: 8000000, bobot: 2.8, bulan4: { minggu3: 1.4, minggu4: 1.4 } },
    ],
    constructionStatus: 'Pekerjaan Paving'
  },
];
