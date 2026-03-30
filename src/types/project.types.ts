/**
 * types/project.types.ts
 * Tipe untuk Modul Project & Konstruksi
 */

export type ProjectType = 'cluster' | 'standalone';
export type ProjectStatus = 'On Progress' | 'Completed' | 'Delayed';
export type QCStatus = 'Pass' | 'Fail' | 'Ongoing';

/** Pembagian nomor unit per blok (hanya dipakai saat POST create project / bulk-units) */
export interface UnitBlockRange {
  prefix: string;
  start: number;
  end: number;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  location?: string;
  units_count: number;
  progress: number;
  status: ProjectStatus;
  deadline?: string;
  /** Batas/kapasitas pagu biaya (untuk dashboard, satuan IDR) */
  budget_cap?: number | null;
  created_at: string;
  updated_at: string;
  /** Hanya untuk body create — multi-blok pengganti unit_prefix + jumlah tunggal */
  unit_blocks?: UnitBlockRange[];
  unit_prefix?: string;
  unit_tipe?: string;
  // relasi yang bisa di-include
  units?: ProjectUnit[];
}

export interface ProjectUnit {
  id: string;
  project_id: string;
  no: string;
  tipe?: string;
  progress: number;
  status?: string;
  qc_status?: QCStatus;
  qc_readiness: number;
  qc_template_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ConstructionStatus {
  id: string;
  name: string;
  progress: number;
  color?: string;
  order_index: number;
}

export interface TimeScheduleItem {
  id: string;
  ref_id: string;
  ref_type: 'project' | 'unit';
  urutan?: number;
  uraian_pekerjaan: string;
  biaya: number;
  bobot: number;
  elevasi?: string;
  bulan1?: { minggu1?: number; minggu2?: number; minggu3?: number; minggu4?: number };
  bulan2?: { minggu1?: number; minggu2?: number; minggu3?: number; minggu4?: number };
  bulan3?: { minggu1?: number; minggu2?: number; minggu3?: number; minggu4?: number };
  bulan4?: { minggu1?: number; minggu2?: number; minggu3?: number; minggu4?: number };
  keterangan?: string;
}

export interface InventoryLog {
  id: string;
  project_id: string;
  unit_no?: string;
  date: string;
  item: string;
  qty: number;
  unit_satuan?: string;
  type: 'in' | 'out';
  person?: string;
  created_at: string;
}

export interface WorkLog {
  id: string;
  project_id: string;
  date: string;
  unit_no?: string;
  activity: string;
  worker_count: number;
  progress_added?: number;
  status?: 'Normal' | 'Lembur' | 'Kendala';
  weather?: 'Cerah' | 'Berawan' | 'Hujan' | 'Hujan Lebat';
  created_at: string;
  photos?: WorkLogPhoto[];
}

export interface WorkLogPhoto {
  id: string;
  work_log_id: string;
  photo_url: string;
  created_at: string;
}
