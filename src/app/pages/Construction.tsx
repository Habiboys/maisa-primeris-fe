import {
  AlertTriangle as AlertTriangleIcon,
  Box,
  Calendar,
  CheckCircle2 as CheckCircle2Icon,
  ChevronRight,
  ClipboardList,
  Clock as ClockIcon,
  Construction as ConstructionIcon,
  Edit2,
  Filter,
  History as HistoryIcon,
  Home,
  Info,
  LayoutGrid,
  Loader2,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  TrendingUp,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useConfirmDialog, useConstructionStatuses, useProjects, useQCTemplates } from '../../hooks';
import { type ConstructionStatus, type InventoryLog, type Project, type ProjectUnit, type WorkLog } from '../../lib/mockConstruction';
import { compressImageToFile } from '../../lib/utils';
import { formatDateId } from '../../lib/date';
import { projectService } from '../../services';
import type { ConstructionStatus as ApiCS, Project as ApiProject, ProjectUnit as ApiProjectUnit } from '../../types';
import { QCTemplateManager } from '../components/QCTemplateManager';
import { QualityControl } from '../components/QualityControl';
import { Modal } from '../components/ui/Modal';
import { ProjectStatusBadge } from '../components/ui/ProjectStatusBadge';

const mapApiUnitToUi = (unit: ApiProjectUnit): ProjectUnit => ({
  no: unit.no,
  tipe: unit.tipe ?? '-',
  progress: unit.progress ?? 0,
  status: unit.status ?? 'Belum Mulai',
  qcStatus: unit.qc_status,
  qcReadiness: unit.qc_readiness,
  qcTemplateId: unit.qc_template_id,
});

const mapApiProjectToUi = (project: ApiProject): Project => {
  const units = (project.units ?? []).map(mapApiUnitToUi);
  const avgProgress = units.length > 0
    ? Math.round(units.reduce((sum, u) => sum + (u.progress ?? 0), 0) / units.length)
    : 0;
  return {
    id: project.id,
    name: project.name,
    type: project.type,
    location: project.location ?? '-',
    unitsCount: project.units_count ?? units.length,
    // progress selalu dihitung dari rata-rata progress unit
    progress: avgProgress,
    status: project.status,
    deadline: project.deadline ?? '-',
    lead: '-',
    units,
    inventory: {},
    logs: [],
    timeSchedule: [],
    layout_svg: project.layout_svg,
  };
};

/*
const initialProjects: Project[] = [
  { 
    id: 1, 
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
    id: 2, 
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
    id: 3, 
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
    id: 4, 
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
    id: 5, 
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
    id: 6, 
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
*/

export function Construction() {
  const { projects: apiProjects, create: apiCreateProject, update: apiUpdateProject, remove: apiRemoveProject, refetch: refetchProjects } = useProjects();
  const { statuses: apiStatuses, create: apiCreateStatus, update: apiUpdateStatus, remove: apiRemoveStatus } = useConstructionStatuses();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // --- Card Summary Calculation ---
  const totalProjects = projects.length;
  const totalUnits = projects.reduce((sum, p) => sum + (p.units?.length ?? p.unitsCount ?? 0), 0);
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress ?? 0), 0) / projects.length) : 0;
  // Sementara: kendala = proyek status 'Delayed' (atau bisa ganti ke field lain jika ada)
  const totalIssues = projects.filter(p => p.status === 'Delayed').length;

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  // Helper: map API ConstructionStatus → mock‐UI ConstructionStatus
  const mapApiCSToUi = (cs: ApiCS): ConstructionStatus => ({
    id: cs.id,
    name: cs.name,
    progress: cs.progress ?? 0,
    color: cs.color ?? 'bg-blue-50 text-blue-600',
    order: cs.order_index ?? 0,
  });

  useEffect(() => {
    setProjects(apiProjects.map(mapApiProjectToUi));
  }, [apiProjects]);

  // QC Template Management
  const {
    templates: qcTemplates,
    isLoading: qcTemplatesLoading,
    create: createTemplate,
    update: updateTemplate,
    duplicate: duplicateTemplate,
    remove: deleteTemplate,
    refetch: refetchTemplates,
  } = useQCTemplates();
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // Confirm Dialog
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();

  // Construction Status Master Data
  // Sumber kebenaran: master table `construction_statuses` (API).
  // Jika kosong (tenant baru), user bisa menambah lewat Status Manager.
  const [constructionStatuses, setConstructionStatuses] = useState<ConstructionStatus[]>([]);

  // Sync API construction statuses → local UI state
  useEffect(() => {
    if (apiStatuses.length === 0) return;
    setConstructionStatuses(apiStatuses.map(mapApiCSToUi));
  }, [apiStatuses]);

  const [showStatusManager, setShowStatusManager] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ConstructionStatus | null>(null);
  const [statusForm, setStatusForm] = useState({ name: '', progress: '', color: 'bg-blue-50 text-blue-600' });

  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingUnit, setIsSavingUnit] = useState(false);
  const [isSavingInventory, setIsSavingInventory] = useState(false);
  const [isSavingWorkLog, setIsSavingWorkLog] = useState(false);
  const [isSavingStandalone, setIsSavingStandalone] = useState(false);
  const [isSavingUpdateProgress, setIsSavingUpdateProgress] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isUploadingLayout, setIsUploadingLayout] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoadingSvg, setIsLoadingSvg] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'units' | 'inventory' | 'reports' | 'map' | 'schedule'>('units');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to the latest date available in logs, or today if no logs
    return formatDateId(new Date());
  });
  const [selectedUnitForQC, setSelectedUnitForQC] = useState<ProjectUnit | null>(null);
  const [selectedUnitForInventory, setSelectedUnitForInventory] = useState<string>('All');
  const [inventoryForm, setInventoryForm] = useState({
    unitNo: '',
    item: '',
    qty: '',
    unit: '',
    type: 'out' as 'in' | 'out'
  });
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [showQCHistory, setShowQCHistory] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showEditStandaloneModal, setShowEditStandaloneModal] = useState(false);
  const [showUpdateProgressModal, setShowUpdateProgressModal] = useState(false);
  const [updateProgressUnit, setUpdateProgressUnit] = useState<ProjectUnit | null>(null);
  const [updateProgressStatus, setUpdateProgressStatus] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingUnit, setEditingUnit] = useState<ProjectUnit | null>(null);

  // Form States
  const [projectForm, setProjectForm] = useState({ name: '', location: '', unitsCount: '', deadline: '', status: 'On Progress', type: 'cluster' as 'cluster' | 'standalone' });
  const [standaloneForm, setStandaloneForm] = useState({ name: '', location: '', deadline: '', status: 'On Progress' });
  const [unitForm, setUnitForm] = useState({ no: '', tipe: '', status: '', qcTemplateId: '' });
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  // Track existing server photos to delete when editing
  const [existingPhotos, setExistingPhotos] = useState<{ id: string; url: string }[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [reportForm, setReportForm] = useState({ 
    unitNo: '', 
    activity: '', 
    workers: '', 
    progress: '', 
    date: new Date().toISOString().split('T')[0],
    status: 'Normal' as 'Normal' | 'Lembur' | 'Kendala',
    weather: 'Cerah' as 'Cerah' | 'Berawan' | 'Hujan' | 'Hujan Lebat',
    photos: [] as string[]
  });
  const [reportFiles, setReportFiles] = useState<File[]>([]);

  // Load SVG when switching to map tab or when project/units change
  useEffect(() => {
    if (activeTab === 'map' && selectedProject?.layout_svg) {
      loadSvgWithUnitColors(selectedProject.layout_svg);
    } else if (activeTab !== 'map') {
      setSvgContent(null);
    }
  }, [activeTab, selectedProject?.layout_svg, selectedProject?.units]);



  // Helper: Convert status to progress percentage (dynamic from master data)
  const getProgressFromStatus = (statusName: string): number => {
    const status = constructionStatuses.find(s => s.name === statusName);
    return status ? status.progress : 0;
  };

  // Helper: Map construction status -> hex color (from master data)
  // Note: `construction_statuses.color` tersimpan sebagai HEX color, bukan Tailwind class.
  const getStatusColor = (statusName: string): string => {
    const status = constructionStatuses.find(s => s.name === statusName);
    return status?.color ?? '#e5e7eb'; // default: gray-200
  };

  const getReadableTextColor = (bgHex: string): string => {
    // Minimal brightness check untuk memilih hitam/putih.
    const hex = (bgHex || '').trim();
    const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
    if (![3, 6].includes(normalized.length)) return '#111827';

    const full =
      normalized.length === 3
        ? normalized.split('').map((c) => c + c).join('')
        : normalized;

    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.6 ? '#111827' : '#ffffff';
  };

  const legendColors = useMemo(() => {
    const sorted = constructionStatuses
      .slice()
      .sort((a, b) => Number(b.progress ?? 0) - Number(a.progress ?? 0));

    const selesai = sorted.find((s) => Number(s.progress ?? 0) >= 100) ?? sorted[0];
    const diproses =
      sorted.find((s) => Number(s.progress ?? 0) > 0 && Number(s.progress ?? 0) < 100) ??
      sorted[0];

    return {
      selesaiColor: selesai?.color ?? '#22c55e',
      diprosesColor: diproses?.color ?? '#2563eb',
    };
  }, [constructionStatuses]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenProject = async (project: Project) => {
    setSelectedProjectId(project.id);
    setViewMode('detail');
    setActiveTab('units');
    // Reset any open modals
    setShowInventoryModal(false);
    setShowReportModal(false);
    setShowUnitModal(false);

    // Fetch detail data (work logs + inventory) from API
    try {
      const [workLogs, inventoryLogs] = await Promise.all([
        projectService.getWorkLogs(project.id),
        projectService.getInventoryLogs(project.id),
      ]);

      // Map API work logs → UI work logs
      const uiLogs: WorkLog[] = workLogs.map((wl: import('../../types').WorkLog) => ({
        id: Number(wl.id.replace(/\D/g, '').slice(-8)) || Date.now(),
        date: wl.date ? formatDateId(wl.date) : '-',
        unitNo: wl.unit_no ?? '-',
        activity: wl.activity,
        workerCount: wl.worker_count ?? 0,
        progressAdded: wl.progress_added ?? 0,
        status: (wl.status as WorkLog['status']) ?? 'Normal',
        weather: wl.weather as WorkLog['weather'],
        photos: (wl.photos?.map((p: any) => `${import.meta.env.VITE_ASSET_URL ?? ''}${p.photo_url}`) ?? []).filter(Boolean),
        photoData: (wl.photos ?? []).map((p: any) => ({ id: p.id, url: `${import.meta.env.VITE_ASSET_URL ?? ''}${p.photo_url}` })),
        apiLogId: wl.id,
      }));

      // Map API inventory logs → UI inventory (grouped by unit_no)
      const uiInventory: { [unitNo: string]: InventoryLog[] } = {};
      for (const inv of inventoryLogs) {
        const key = inv.unit_no ?? 'main';
        if (!uiInventory[key]) uiInventory[key] = [];
        uiInventory[key].push({
          date: inv.date ? formatDateId(inv.date) : '-',
          item: inv.item ?? '-',
          qty: Number(inv.qty) || 0,
          unit: inv.unit_satuan ?? '-',
          type: inv.type as 'in' | 'out',
          person: inv.person ?? 'Admin',
        });
      }

      setProjects(prev => prev.map(p =>
        p.id === project.id ? { ...p, logs: uiLogs, inventory: uiInventory } : p
      ));
    } catch {
      // Silent — units already loaded from listProjects
    }
  };

  // Refresh khusus untuk detail yang bergantung pada API:
  // - work logs (laporan pekerjaan)
  // - inventory logs (mutasi material)
  const refreshProjectDetails = async (projectId: string) => {
    try {
      const [workLogs, inventoryLogs] = await Promise.all([
        projectService.getWorkLogs(projectId),
        projectService.getInventoryLogs(projectId),
      ]);

      const uiLogs: WorkLog[] = workLogs.map((wl: import('../../types').WorkLog) => ({
        id: Number(wl.id.replace(/\D/g, '').slice(-8)) || Date.now(),
        date: wl.date ? formatDateId(wl.date) : '-',
        unitNo: wl.unit_no ?? '-',
        activity: wl.activity,
        workerCount: wl.worker_count ?? 0,
        progressAdded: wl.progress_added ?? 0,
        status: (wl.status as WorkLog['status']) ?? 'Normal',
        weather: wl.weather as WorkLog['weather'],
        photos: (wl.photos?.map((p: any) => `${import.meta.env.VITE_ASSET_URL ?? ''}${p.photo_url}`) ?? []).filter(Boolean),
        photoData: (wl.photos ?? []).map((p: any) => ({ id: p.id, url: `${import.meta.env.VITE_ASSET_URL ?? ''}${p.photo_url}` })),
        apiLogId: wl.id,
      }));

      const uiInventory: { [unitNo: string]: InventoryLog[] } = {};
      for (const inv of inventoryLogs) {
        const key = inv.unit_no ?? 'main';
        if (!uiInventory[key]) uiInventory[key] = [];
        uiInventory[key].push({
          date: inv.date ? formatDateId(inv.date) : '-',
          item: inv.item ?? (inv as any).item_name ?? '-',
          qty: Number(inv.qty) || 0,
          unit: inv.unit_satuan ?? '-',
          type: inv.type as 'in' | 'out',
          person: inv.person ?? 'Admin',
        });
      }

      setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, logs: uiLogs, inventory: uiInventory } : p)));
    } catch {
      // Silent — agar tidak ganggu user saat refresh detail gagal
    }
  };

  const handleAddInventory = async () => {
    console.log("Saving inventory:", inventoryForm);
    
    const selectedProj = projects.find(p => p.id === selectedProjectId);
    const unitNoToUse = selectedProj?.type === 'standalone' ? 'main' : inventoryForm.unitNo;
    
    if (!unitNoToUse || !inventoryForm.item || !inventoryForm.qty) {
      toast.error('Mohon lengkapi semua data mutasi (Pilih Unit, Item, dan Jumlah)');
      return;
    }

    if (!selectedProjectId) return;
    if (isSavingInventory) return;
    setIsSavingInventory(true);
    try {
      await projectService.createInventoryLog(selectedProjectId, {
        unit_no: unitNoToUse,
        date: new Date().toISOString().slice(0, 10),
        item: inventoryForm.item,
        qty: Number(inventoryForm.qty),
        unit_satuan: inventoryForm.unit || 'Unit',
        type: inventoryForm.type,
        person: 'Admin Logistik',
      } as Partial<import('../../types').InventoryLog>);
      await refreshProjectDetails(selectedProjectId);
    } catch {
      /* hook shows toast */
    } finally {
      setIsSavingInventory(false);
    }

    setShowInventoryModal(false);
    setInventoryForm({ unitNo: '', item: '', qty: '', unit: '', type: 'out' });
  };

  const handleSaveProject = async () => {
    if (!projectForm.name || !projectForm.location) {
      toast.error('Nama dan Lokasi wajib diisi');
      return;
    }
    if (isSavingProject) return;
    setIsSavingProject(true);
    try {
      if (editingProject) {
        await apiUpdateProject(editingProject.id, {
          name: projectForm.name,
          type: projectForm.type,
          location: projectForm.location,
          units_count: Number(projectForm.unitsCount) || 0,
          deadline: projectForm.deadline,
          status: projectForm.status as 'On Progress' | 'Completed' | 'Delayed',
        });
      } else {
        await apiCreateProject({
          name: projectForm.name,
          type: projectForm.type,
          location: projectForm.location,
          units_count: Number(projectForm.unitsCount) || 0,
          deadline: projectForm.deadline,
          status: projectForm.status as 'On Progress' | 'Completed' | 'Delayed',
        });
      }
    } catch {
      /* hook already shows toast */
    } finally {
      setIsSavingProject(false);
    }
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const handleDeleteProject = async (id: string) => {
    if (await showConfirm({ title: 'Hapus Proyek', description: 'Apakah Anda yakin ingin menghapus proyek ini? Seluruh data unit dan logistik akan hilang.' })) {
      try {
        await apiRemoveProject(id);
      } catch { /* hook shows toast */ }
      setShowProjectModal(false);
      setEditingProject(null);
      if (selectedProjectId === id) setViewMode('list');
    }
  };

  const handleSaveUnit = async () => {
    if (!unitForm.no || !selectedProjectId) {
      toast.error('No Unit wajib diisi');
      return;
    }
    if (isSavingUnit) return;
    setIsSavingUnit(true);

    const progress = getProgressFromStatus(unitForm.status);

    try {
      if (editingUnit) {
        await projectService.updateUnit(selectedProjectId, editingUnit.no, {
          no: unitForm.no,
          tipe: unitForm.tipe || 'Tipe Standard',
          status: unitForm.status,
          progress,
          qc_template_id: unitForm.qcTemplateId || undefined,
        } as Partial<import('../../types').ProjectUnit>);
        await refetchProjects();
        toast.success(`Unit ${unitForm.no} berhasil diupdate`);
      } else {
        await projectService.createUnit(selectedProjectId, {
          no: unitForm.no,
          tipe: unitForm.tipe || 'Tipe Standard',
          status: unitForm.status,
          progress,
          qc_template_id: unitForm.qcTemplateId || undefined,
        } as Partial<import('../../types').ProjectUnit>);
        await refetchProjects();
        toast.success(`Unit ${unitForm.no} berhasil ditambahkan`);
      }
    } catch {
      /* hook/service shows toast */
    } finally {
      setIsSavingUnit(false);
    }

    setShowUnitModal(false);
    setUnitForm({ no: '', tipe: '', status: 'Belum Mulai', qcTemplateId: '' });
    setEditingUnit(null);
  };

  // Standalone Edit Handlers
  const handleEditStandalone = () => {
    const project = projects.find(p => p.id === selectedProjectId);
    if (project && project.type === 'standalone') {
      setStandaloneForm({
        name: project.name,
        location: project.location,
        deadline: project.deadline,
        status: project.status,
      });
      setShowEditStandaloneModal(true);
    }
  };

  const handleSaveStandalone = async () => {
    if (!standaloneForm.name || !standaloneForm.location) {
      toast.error('Nama dan lokasi harus diisi');
      return;
    }
    if (isSavingStandalone) return;
    setIsSavingStandalone(true);
    try {
      if (selectedProjectId) {
        await apiUpdateProject(selectedProjectId, {
          name: standaloneForm.name,
          location: standaloneForm.location,
          deadline: standaloneForm.deadline,
          status: standaloneForm.status as 'On Progress' | 'Completed' | 'Delayed',
        });
      }
    } catch {
      /* hook shows toast */
    } finally {
      setIsSavingStandalone(false);
    }

    setShowEditStandaloneModal(false);
    setStandaloneForm({ name: '', location: '', deadline: '', status: 'On Progress' });
  };

  const handleUploadLayoutSvg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjectId) return;
    
    const allowedTypes = ['image/svg+xml'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.svg')) {
      toast.error('Hanya file SVG yang diizinkan');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }

    setIsUploadingLayout(true);
    try {
      const formData = new FormData();
      formData.append('layout_svg', file);
      const updated = await projectService.updateLayoutSvg(selectedProjectId, formData);
      setProjects(prev => prev.map(p => 
        p.id === selectedProjectId ? { ...p, layout_svg: updated.layout_svg } : p
      ));
      toast.success('Layout SVG berhasil diupload');
    } catch { 
      /* error handled by service */
    } finally {
      setIsUploadingLayout(false);
    }
    e.target.value = '';
  };

  const loadSvgWithUnitColors = async (svgPath: string) => {
    if (!svgPath || !selectedProject) return;
    setIsLoadingSvg(true);
    try {
      const baseUrl = import.meta.env.VITE_ASSET_URL ?? '';
      const response = await fetch(`${baseUrl}${svgPath}`);
      if (!response.ok) throw new Error('Failed to fetch SVG');
      let svgText = await response.text();

      const unitColorMap = new Map(
        selectedProject.units.map(u => [u.no, getStatusColor(u.status)])
      );

      svgText = svgText.replace(
        /<path\b([^>]*?)(\/?)\s*>/g,
        (match, attrs: string, selfClose: string) => {
          // Extract the id from anywhere within the attributes
          const idMatch = attrs.match(/\bid="([^"]+)"/);
          if (!idMatch) return match;
          const unitId = idMatch[1];

          const color = unitColorMap.get(unitId);
          if (!color) return match;

          // Remove existing style attribute from attrs
          const attrsWithoutStyle = attrs.replace(/\bstyle="[^"]*"/, '').trim();

          // Build style: override fill and fill-opacity
          let styleAttr = (attrs.match(/\bstyle="([^"]*)"/)?.[1] ?? '').trim();

          const hasFill = /\bfill\s*:/.test(styleAttr);
          const hasFillOpacity = /\bfill-opacity\s*:/.test(styleAttr);

          if (hasFill) {
            styleAttr = styleAttr.replace(/\bfill\s*:[^;]+;?/, `fill:${color};`);
          } else {
            styleAttr = `fill:${color};${styleAttr}`;
          }

          if (hasFillOpacity) {
            styleAttr = styleAttr.replace(/\bfill-opacity\s*:[^;]+;?/, `fill-opacity:0.6;`);
          } else {
            styleAttr = `fill-opacity:0.6;${styleAttr}`;
          }

          return `<path ${attrsWithoutStyle} style="${styleAttr}"${selfClose}>`;
        }
      );

      setSvgContent(svgText);
    } catch {
      toast.error('Gagal memuat peta kawasan');
      setSvgContent(null);
    } finally {
      setIsLoadingSvg(false);
    }
  };

  // --- SVG Event Delegation Handlers ---
  // Use event delegation on the container div instead of attaching listeners
  // to individual path elements. This survives React re-renders of dangerouslySetInnerHTML.
  const getUnitIdFromEvent = (e: React.MouseEvent): string | null => {
    let target = e.target as Element | null;
    // Walk up to find a <path> with an id (handles clicking on child elements)
    while (target && target !== e.currentTarget) {
      if (target.tagName.toLowerCase() === 'path' && target.getAttribute('id')) {
        const unitId = target.getAttribute('id')!;
        const unit = selectedProject?.units.find(u => u.no === unitId);
        if (unit) return unitId;
      }
      target = target.parentElement;
    }
    return null;
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    const unitId = getUnitIdFromEvent(e);
    if (!unitId) return;
    const currentUnit = selectedProject?.units.find(u => u.no === unitId);
    if (!currentUnit) return;

    setEditingUnit(currentUnit);
    setUnitForm({
      no: currentUnit.no,
      tipe: currentUnit.tipe ?? '',
      status: currentUnit.status ?? '',
      qcTemplateId: currentUnit.qcTemplateId ?? '',
    });
    setShowUnitModal(true);
  };

  const handleSvgMouseOver = (e: React.MouseEvent) => {
    const target = e.target as Element;
    if (target.tagName.toLowerCase() === 'path' && target.getAttribute('id')) {
      const unitId = target.getAttribute('id')!;
      if (selectedProject?.units.find(u => u.no === unitId)) {
        (target as SVGPathElement).style.fillOpacity = '0.9';
        (target as SVGPathElement).style.cursor = 'pointer';
      }
    }
  };

  const handleSvgMouseOut = (e: React.MouseEvent) => {
    const target = e.target as Element;
    if (target.tagName.toLowerCase() === 'path' && target.getAttribute('id')) {
      const unitId = target.getAttribute('id')!;
      if (selectedProject?.units.find(u => u.no === unitId)) {
        (target as SVGPathElement).style.fillOpacity = '0.6';
      }
    }
  };

  const handleSaveUpdateProgress = async () => {
    if (!updateProgressUnit || !updateProgressStatus || !selectedProjectId) {
      toast.error('Pilih unit dan status terlebih dahulu');
      return;
    }
    if (isSavingUpdateProgress) return;
    setIsSavingUpdateProgress(true);
    const progress = getProgressFromStatus(updateProgressStatus);
    try {
      await projectService.updateUnit(selectedProjectId, updateProgressUnit.no, {
        status: updateProgressStatus,
        progress,
      } as Partial<import('../../types').ProjectUnit>);
      await refetchProjects();
      toast.success(`Progress unit ${updateProgressUnit.no} berhasil diupdate`);
    } catch { /* hook shows toast */ } finally {
      setIsSavingUpdateProgress(false);
    }
    setShowUpdateProgressModal(false);
    setUpdateProgressUnit(null);
    setUpdateProgressStatus('');
  };

  const handleAddWorkLog = async () => {
    if (!reportForm.activity || !reportForm.unitNo || !selectedProjectId) {
      toast.error('Unit dan Aktivitas wajib diisi');
      return;
    }
    if (isSavingWorkLog) return;
    setIsSavingWorkLog(true);
    try {
      if (editingLog) {
        const logApiId = editingLog.apiLogId ?? String(editingLog.id);
        
        await projectService.updateWorkLog(selectedProjectId, logApiId, {
          unit_no: reportForm.unitNo,
          activity: reportForm.activity,
          worker_count: Number(reportForm.workers) || 0,
          progress_added: Number(reportForm.progress) || 0,
          status: reportForm.status,
          weather: reportForm.weather,
        } as Partial<import('../../types').WorkLog>);

        // Delete removed photos from server
        for (const photoId of removedPhotoIds) {
          try { await projectService.deleteWorkLogPhoto(selectedProjectId, logApiId, photoId); } catch { /* skip */ }
        }

        // Upload new photos if any
        if (reportFiles.length > 0) {
          const fd = new FormData();
          reportFiles.forEach((file) => fd.append('photos', file));
          try { await projectService.addWorkLogPhotos(selectedProjectId, logApiId, fd); } catch { /* skip */ }
        }

        toast.success('Laporan berhasil diperbarui');
      } else {
        const formData = new FormData();
        formData.append('unit_no', reportForm.unitNo);
        formData.append('activity', reportForm.activity);
        formData.append('worker_count', String(Number(reportForm.workers) || 0));
        formData.append('progress_added', String(Number(reportForm.progress) || 0));
        formData.append('date', reportForm.date || new Date().toISOString().split('T')[0]);
        formData.append('status', reportForm.status);
        formData.append('weather', reportForm.weather);
        reportFiles.forEach((file) => {
          formData.append('photos', file);
        });
        await projectService.createWorkLog(selectedProjectId, formData);
        toast.success(`Laporan Unit ${reportForm.unitNo} berhasil disimpan`);
      }
      await refreshProjectDetails(selectedProjectId);
    } catch {
      /* hook shows toast */
    } finally {
      setIsSavingWorkLog(false);
    }

    setShowReportModal(false);
    setEditingLog(null);
    setReportFiles([]);
    setExistingPhotos([]);
    setRemovedPhotoIds([]);
    setReportForm({ unitNo: '', activity: '', workers: '', progress: '', date: new Date().toISOString().split('T')[0], status: 'Normal', weather: 'Cerah', photos: [] });
  };

  const handleEditWorkLog = (log: WorkLog) => {
    setEditingLog(log);
    setReportFiles([]);
    // Set existing server photos for tracking deletion
    setExistingPhotos(log.photoData ?? []);
    setRemovedPhotoIds([]);
    setReportForm({
      unitNo: log.unitNo,
      activity: log.activity,
      workers: String(log.workerCount),
      progress: String(log.progressAdded),
      date: new Date().toISOString().split('T')[0],
      status: log.status,
      weather: log.weather || 'Cerah',
      photos: log.photos || []
    });
    setShowReportModal(true);
  };

  const handleDeleteWorkLog = async (logId: number) => {
    if (await showConfirm({ title: 'Hapus Laporan', description: 'Apakah Anda yakin ingin menghapus laporan ini?' })) {
      const project = projects.find(p => p.id === selectedProjectId);
      const log = project?.logs.find(l => l.id === logId);
      
      if (log?.apiLogId) {
        try {
          await projectService.deleteWorkLog(selectedProjectId, log.apiLogId);
          toast.success('Laporan berhasil dihapus');
          await refreshProjectDetails(selectedProjectId);
        } catch (e: any) {
          toast.error(e?.response?.data?.message || e?.message || 'Gagal menghapus laporan');
        }
      } else {
        setProjects(prev => prev.map(p => {
          if (p.id === selectedProjectId) {
            return { ...p, logs: p.logs.filter(l => l.id !== logId) };
          }
          return p;
        }));
        toast.success('Laporan sementara dihapus');
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files);
    const compressed = await Promise.all(fileArray.map(f => compressImageToFile(f)));
    const previewUrls = compressed.map(f => URL.createObjectURL(f));
    setReportFiles(prev => [...prev, ...compressed]);
    setReportForm(prev => ({ ...prev, photos: [...prev.photos, ...previewUrls] }));
  };

  const handleAction = (_label: string) => { /* placeholder for quick stat clicks */ };

  // Construction Status Manager Handlers
  const handleAddStatus = () => {
    setEditingStatus(null);
    setStatusForm({ name: '', progress: '', color: 'bg-blue-50 text-blue-600' });
    setShowStatusManager(true);
  };

  const handleEditStatus = (status: ConstructionStatus) => {
    setEditingStatus(status);
    setStatusForm({ 
      name: status.name, 
      progress: String(status.progress), 
      color: status.color 
    });
  };

  const handleSaveStatus = async () => {
    if (!statusForm.name || !statusForm.progress) {
      toast.error('Nama dan persentase harus diisi');
      return;
    }
    if (isSavingStatus) return;
    setIsSavingStatus(true);
    try {
      if (editingStatus) {
        await apiUpdateStatus(editingStatus.id, {
          name: statusForm.name,
          progress: Number(statusForm.progress),
          color: statusForm.color,
        });
      } else {
        await apiCreateStatus({
          name: statusForm.name,
          progress: Number(statusForm.progress),
          color: statusForm.color,
          order_index: constructionStatuses.length + 1,
        });
      }
    } catch {
      /* hook shows toast */
    } finally {
      setIsSavingStatus(false);
    }

    setEditingStatus(null);
    setStatusForm({ name: '', progress: '', color: 'bg-blue-50 text-blue-600' });
  };

  const handleDeleteStatus = async (statusId: string) => {
    if (await showConfirm({ title: 'Hapus Status', description: 'Apakah Anda yakin ingin menghapus status ini?' })) {
      try {
        await apiRemoveStatus(statusId);
      } catch {
        /* hook shows toast */
      }
    }
  };

  return (
    <>
      {ConfirmDialogElement}
      {/* QC Form Fullscreen - Outside all wrappers */}
      {showChecklistForm && (
        <QualityControl 
          initialProject={selectedProject?.name || ''} 
          initialProjectId={selectedProject?.id}
          initialUnit={selectedUnitForQC?.no}
          initialTemplateId={selectedUnitForQC?.qcTemplateId || undefined}
          onSave={refetchProjects}
          onClose={() => {
            setShowChecklistForm(false);
          }}
        />
      )}

      <div className="space-y-6">
        {viewMode === 'detail' && selectedProject ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Detail Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-start gap-4">
              <button 
                onClick={() => setViewMode('list')}
                className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary hidden sm:block">
                  <ConstructionIcon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedProject.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {selectedProject.location}</span>
                    <ProjectStatusBadge status={selectedProject.status} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden lg:block mr-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Progres Keseluruhan</p>
                <p className="text-lg font-bold text-primary">{selectedProject.progress}%</p>
              </div>
              <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                Export PDF
              </button>
              <button
                onClick={() => {
                  if (selectedProject.type === 'standalone') {
                    handleEditStandalone();
                  } else {
                    setUpdateProgressUnit(null);
                    setUpdateProgressStatus('');
                    setShowUpdateProgressModal(true);
                  }
                }}
                className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                Update Progres
              </button>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-0">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {selectedProject.type === 'standalone' ? 'Tipe Bangunan' : 'Total Unit'}
              </p>
              <p className="text-xl font-bold text-gray-900">
                {selectedProject.type === 'standalone' ? 'Standalone' : `${selectedProject.unitsCount} Kavling`}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {selectedProject.type === 'standalone' ? 'Status Progres' : 'Selesai QC'}
              </p>
              <p className="text-xl font-bold text-green-600">
                {selectedProject.type === 'standalone' 
                  ? selectedProject.status 
                  : `${selectedProject.units.filter(u => u.qcStatus === 'Pass').length} Unit`}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Barang Masuk</p>
              <p className="text-xl font-bold text-blue-600">
                {Object.values(selectedProject.inventory).flat().filter(i => i.type === 'in').length} Mutasi
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deadline</p>
              <p className="text-xl font-bold text-orange-600">{selectedProject.deadline}</p>
            </div>
          </div>

          {/* Main Detail Content with Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative z-0">
            <div className="flex border-b border-gray-100 bg-gray-50/30 overflow-x-auto no-scrollbar">
              {[
                { id: 'units', label: selectedProject.type === 'standalone' ? 'Info Bangunan' : 'Unit Project', icon: LayoutGrid },
                { id: 'schedule', label: 'Time Schedule', icon: Calendar },
                { id: 'inventory', label: 'Logistik Material', icon: Box },
                { id: 'reports', label: 'Laporan Pekerjaan', icon: ClipboardList },
                ...(selectedProject.type === 'cluster' ? [{ id: 'map', label: 'Peta Kawasan', icon: MapIcon }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                    activeTab === tab.id ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 min-h-[400px]">
              {activeTab === 'units' && (
                selectedProject.type === 'standalone' ? (
                  /* Standalone Building - Show Direct Info */
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-2xl border border-primary/20">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                          <Home className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg">{selectedProject.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">{selectedProject.location}</p>
                            </div>
                            <button
                              onClick={handleEditStandalone}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              title="Edit Bangunan"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Target Selesai</p>
                              <p className="text-sm font-bold text-gray-900">{selectedProject.deadline}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Status Konstruksi</p>
                              <ProjectStatusBadge status={selectedProject.status} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                          <span>Progress Keseluruhan</span>
                          <span>{selectedProject.progress}%</span>
                        </div>
                        <div className="h-3 w-full bg-white rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500" style={{ width: `${selectedProject.progress}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Total Pekerjaan</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedProject.timeSchedule?.length || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Item</p>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Total Biaya</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedProject.timeSchedule 
                            ? (selectedProject.timeSchedule.reduce((sum, item) => sum + item.biaya, 0) / 1000000).toFixed(0) 
                            : 0}M
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Rupiah</p>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Work Logs</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedProject.logs.length}</p>
                        <p className="text-xs text-gray-400 mt-1">Aktivitas</p>
                      </div>
                    </div>

                    {/* QC Template Info (Standalone) */}
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-yellow-900">QC dikerjakan pada unit Cluster</p>
                          <p className="text-xs text-yellow-700 mt-1">Karena `qc_template_id` di level project sudah dihapus, inspeksi QC standalone tidak ditampilkan.</p>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <p className="text-sm text-blue-900">
                        <span className="font-bold">Bangunan Standalone</span> - Untuk melihat jadwal detail dan time schedule, klik tab "Time Schedule" di atas.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Cluster - Show Unit Cards */
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {!showChecklistForm && (
                      /* Unit Cards View */
                      <>
                        {/* Header Unit Project */}
                        <div>
                          <h3 className="font-bold text-gray-900">Unit Project</h3>
                          <p className="text-sm text-gray-500 mt-1">Total {selectedProject.units.length} unit rumah</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {selectedProject.units.map((unit, idx) => (
                    <div 
                      key={idx} 
                      className="group/card border border-gray-100 rounded-xl bg-white hover:border-primary/30 transition-all shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900 group-hover/card:text-primary transition-colors">Unit {unit.no}</p>
                            <p className="text-xs text-gray-500">{unit.tipe}</p>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: getStatusColor(unit.status),
                              color: getReadableTextColor(getStatusColor(unit.status)),
                            }}
                          >
                            {unit.status}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-gray-400">
                            <span>Progres Konstruksi</span>
                            <span>{unit.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${unit.progress}%` }}></div>
                          </div>
                        </div>

                        {/* QC Info */}
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          {unit.qcTemplateId && (
                            <div className="flex items-center gap-1.5">
                              <Settings className="w-3 h-3 text-primary" />
                              <span className="text-[9px] text-primary font-bold">
                                {qcTemplates.find(t => t.id === unit.qcTemplateId)?.name || 'Template QC'}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-gray-400">QC Kelayakan</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              unit.qcStatus === 'Pass' ? 'bg-green-50 text-green-600' :
                              unit.qcStatus === 'Fail' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
                            }`}>
                              {unit.qcStatus || 'Ongoing'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${unit.qcReadiness || 0}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-600">{unit.qcReadiness || 0}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* QC Action Area */}
                      <div className="mt-auto px-3 pb-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!unit.qcTemplateId) {
                              toast.error('Template QC belum dipilih untuk unit ini. Buka Data Master > Unit Konstruksi > pilih QC Template, lalu ulangi inspeksi.');
                              navigate('/data-master/projects');
                              return;
                            }
                            setSelectedUnitForQC(unit);
                            setShowChecklistForm(true);
                          }}
                          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                            unit.qcTemplateId
                              ? 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20'
                              : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}
                        >
                          <CheckCircle2Icon size={14} />
                          Mulai Inspeksi QC
                        </button>
                      </div>
                    </div>
                  ))}
                      </div>
                    </>
                    )}
                  </div>
                )
              )}

              {activeTab === 'schedule' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900">Time Schedule (Kurva S)</h4>
                      <p className="text-xs text-gray-500">
                        {selectedProject.type === 'standalone' 
                          ? 'Jadwal pekerjaan dengan rincian biaya dan bobot.'
                          : 'Jadwal pekerjaan per unit dengan rincian biaya dan bobot.'}
                      </p>
                    </div>
                  </div>

                  {/* Unit Schedule Cards */}
                  <div className="grid grid-cols-1 gap-4">
                    {selectedProject.type === 'standalone' && selectedProject.timeSchedule ? (
                      /* Standalone Building Schedule */
                      (() => {
                        const calculateSCurveData = () => {
                          if (!selectedProject.timeSchedule || selectedProject.timeSchedule.length === 0) return [];
                          
                          const weeklyData: { [key: string]: number } = {};
                          
                          selectedProject.timeSchedule.forEach(item => {
                            ['bulan1', 'bulan2', 'bulan3', 'bulan4'].forEach((bulan, bulanIdx) => {
                              const bulanData = item[bulan as keyof typeof item] as any;
                              if (bulanData && typeof bulanData === 'object') {
                                ['minggu1', 'minggu2', 'minggu3', 'minggu4'].forEach((minggu, mingguIdx) => {
                                  if (bulanData[minggu]) {
                                    const weekNum = bulanIdx * 4 + mingguIdx + 1;
                                    const weekKey = `W${weekNum}`;
                                    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + bulanData[minggu];
                                  }
                                });
                              }
                            });
                          });

                          let cumulative = 0;
                          const result = [];
                          for (let i = 1; i <= 16; i++) {
                            const weekKey = `W${i}`;
                            const weeklyBobot = weeklyData[weekKey] || 0;
                            cumulative += weeklyBobot;
                            
                            result.push({
                              minggu: `${i}`,
                              weekLabel: weekKey,
                              bobot: parseFloat(weeklyBobot.toFixed(2)),
                              'Rencana': parseFloat(cumulative.toFixed(2)),
                              'Aktual': parseFloat((cumulative * (selectedProject.progress / 100)).toFixed(2)),
                              bulan: Math.ceil(i / 4)
                            });
                          }
                          return result;
                        };

                        const sCurveData = calculateSCurveData();

                        return (
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-bold text-gray-900">{selectedProject.name}</h5>
                                  <p className="text-xs text-gray-500">Progress: {selectedProject.progress}% • Status: {selectedProject.status}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Total Biaya</p>
                                  <p className="text-lg font-bold text-primary">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
                                      selectedProject.timeSchedule.reduce((sum, item) => sum + item.biaya, 0)
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                                    <th className="px-4 py-3 border-b border-r border-gray-200">No</th>
                                    <th className="px-4 py-3 border-b border-r border-gray-200 min-w-[250px]">Uraian Pekerjaan</th>
                                    <th className="px-4 py-3 border-b border-r border-gray-200 text-right">Biaya (Rp)</th>
                                    <th className="px-4 py-3 border-b border-r border-gray-200 text-center">Bobot (%)</th>
                                    <th className="px-4 py-3 border-b border-r border-gray-200 text-center">Elevasi</th>
                                    {[1, 2, 3, 4].map(bulan => (
                                      <th key={bulan} colSpan={4} className="px-2 py-2 border-b border-r border-gray-200 text-center bg-primary/5">
                                        Bulan {bulan}
                                      </th>
                                    ))}
                                  </tr>
                                  <tr className="bg-gray-50/50 text-[9px] font-bold text-gray-500 uppercase">
                                    <th className="border-b border-gray-200"></th>
                                    <th className="border-b border-gray-200"></th>
                                    <th className="border-b border-gray-200"></th>
                                    <th className="border-b border-gray-200"></th>
                                    <th className="border-b border-r border-gray-200"></th>
                                    {[1, 2, 3, 4].map(bulan => 
                                      ['M1', 'M2', 'M3', 'M4'].map((m, idx) => (
                                        <th key={`${bulan}-${idx}`} className="px-2 py-2 border-b border-r border-gray-200 text-center">{m}</th>
                                      ))
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedProject.timeSchedule.map((item, itemIdx) => (
                                    <tr key={itemIdx} className="text-xs border-b border-gray-100 hover:bg-gray-50">
                                      <td className="px-4 py-3 border-r border-gray-100 text-center font-bold">{item.id}</td>
                                      <td className="px-4 py-3 border-r border-gray-100">{item.uraianPekerjaan}</td>
                                      <td className="px-4 py-3 border-r border-gray-100 text-right font-bold">
                                        {new Intl.NumberFormat('id-ID').format(item.biaya)}
                                      </td>
                                      <td className="px-4 py-3 border-r border-gray-100 text-center font-bold text-primary">{item.bobot}%</td>
                                      <td className="px-4 py-3 border-r border-gray-100 text-center text-gray-500 font-mono text-[10px]">
                                        {item.elevasi || '-'}
                                      </td>
                                      {['bulan1', 'bulan2', 'bulan3', 'bulan4'].map((bulan, bulanIdx) => {
                                        const bulanData = item[bulan as keyof typeof item] as any;
                                        return ['minggu1', 'minggu2', 'minggu3', 'minggu4'].map((minggu, mingguIdx) => {
                                          const value = bulanData && typeof bulanData === 'object' ? bulanData[minggu] : undefined;
                                          return (
                                            <td 
                                              key={`${bulanIdx}-${mingguIdx}`} 
                                              className={`px-2 py-3 border-r border-gray-100 text-center text-[11px] font-bold ${
                                                value ? 'bg-primary/10 text-primary' : 'text-gray-300'
                                              }`}
                                            >
                                              {value ? value.toFixed(2) : '-'}
                                            </td>
                                          );
                                        });
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* S-Curve Chart */}
                            {sCurveData.length > 0 && (
                              <div className="p-6 bg-gray-50 border-t border-gray-200">
                                <h6 className="text-sm font-bold text-gray-900 mb-4">Kurva S - Progress Mingguan</h6>
                                <ResponsiveContainer width="100%" height={300}>
                                  <AreaChart data={sCurveData}>
                                    <defs>
                                      <linearGradient id="colorRencana" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#b7860f" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#b7860f" stopOpacity={0}/>
                                      </linearGradient>
                                      <linearGradient id="colorAktual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis 
                                      dataKey="weekLabel" 
                                      tick={{ fontSize: 11, fill: '#6b7280' }}
                                      stroke="#d1d5db"
                                    />
                                    <YAxis 
                                      tick={{ fontSize: 11, fill: '#6b7280' }}
                                      stroke="#d1d5db"
                                      label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6b7280' } }}
                                    />
                                    <Tooltip 
                                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Area 
                                      type="monotone" 
                                      dataKey="Rencana" 
                                      stroke="#b7860f" 
                                      strokeWidth={2}
                                      fillOpacity={1} 
                                      fill="url(#colorRencana)" 
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="Aktual" 
                                      stroke="#10b981" 
                                      strokeWidth={2}
                                      fillOpacity={1} 
                                      fill="url(#colorAktual)" 
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      /* Cluster - Show Units Schedule */
                      selectedProject.units.map((unit, idx) => {
                      // Calculate S-Curve data
                      const calculateSCurveData = () => {
                        if (!unit.timeSchedule || unit.timeSchedule.length === 0) return [];
                        
                        const weeklyData: { [key: string]: number } = {};
                        
                        // Collect all weekly progress
                        unit.timeSchedule.forEach(item => {
                          ['bulan1', 'bulan2', 'bulan3', 'bulan4'].forEach((bulan, bulanIdx) => {
                            const bulanData = item[bulan as keyof typeof item] as any;
                            if (bulanData && typeof bulanData === 'object') {
                              ['minggu1', 'minggu2', 'minggu3', 'minggu4'].forEach((minggu, mingguIdx) => {
                                if (bulanData[minggu]) {
                                  const weekNum = bulanIdx * 4 + mingguIdx + 1;
                                  const weekKey = `W${weekNum}`;
                                  weeklyData[weekKey] = (weeklyData[weekKey] || 0) + bulanData[minggu];
                                }
                              });
                            }
                          });
                        });

                        // Calculate cumulative progress
                        let cumulative = 0;
                        const result = [];
                        for (let i = 1; i <= 16; i++) {
                          const weekKey = `W${i}`;
                          const weeklyBobot = weeklyData[weekKey] || 0;
                          cumulative += weeklyBobot;
                          
                          result.push({
                            minggu: `${i}`,
                            weekLabel: weekKey,
                            bobot: parseFloat(weeklyBobot.toFixed(2)),
                            'Rencana': parseFloat(cumulative.toFixed(2)),
                            'Aktual': parseFloat((cumulative * (unit.progress / 100)).toFixed(2)),
                            bulan: Math.ceil(i / 4)
                          });
                        }
                        return result;
                      };

                      const sCurveData = calculateSCurveData();

                      return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          {/* Unit Header */}
                          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-bold text-gray-900">Unit {unit.no} - {unit.tipe}</h5>
                                <p className="text-xs text-gray-500">Progress: {unit.progress}% • Status: {unit.status}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Total Biaya</p>
                                <p className="text-lg font-bold text-primary">
                                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
                                    unit.timeSchedule?.reduce((sum, item) => sum + item.biaya, 0) || 0
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Schedule Table with Integrated S-Curve */}
                          {unit.timeSchedule && unit.timeSchedule.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                                  <th className="px-4 py-3 sticky left-0 bg-gray-50 z-10">No</th>
                                  <th className="px-4 py-3 min-w-[250px]">Uraian Pekerjaan</th>
                                  <th className="px-4 py-3 text-right">Biaya</th>
                                  <th className="px-4 py-3 text-right">Bobot %</th>
                                  <th className="px-4 py-3 text-center">Elevasi</th>
                                  <th className="px-4 py-3 text-center bg-blue-50" colSpan={4}>Bulan Ke-I</th>
                                  <th className="px-4 py-3 text-center bg-green-50" colSpan={4}>Bulan Ke-II</th>
                                  <th className="px-4 py-3 text-center bg-orange-50" colSpan={4}>Bulan Ke-III</th>
                                  <th className="px-4 py-3 text-center bg-purple-50" colSpan={4}>Bulan Ke-IV</th>
                                </tr>
                                <tr className="bg-gray-50 text-[9px] font-bold text-gray-400 uppercase border-b border-gray-100">
                                  <th className="px-4 py-2 sticky left-0 bg-gray-50 z-10"></th>
                                  <th className="px-4 py-2"></th>
                                  <th className="px-4 py-2"></th>
                                  <th className="px-4 py-2"></th>
                                  <th className="px-4 py-2"></th>
                                  <th className="px-2 py-2 text-center bg-blue-50">I</th>
                                  <th className="px-2 py-2 text-center bg-blue-50">II</th>
                                  <th className="px-2 py-2 text-center bg-blue-50">III</th>
                                  <th className="px-2 py-2 text-center bg-blue-50">IV</th>
                                  <th className="px-2 py-2 text-center bg-green-50">I</th>
                                  <th className="px-2 py-2 text-center bg-green-50">II</th>
                                  <th className="px-2 py-2 text-center bg-green-50">III</th>
                                  <th className="px-2 py-2 text-center bg-green-50">IV</th>
                                  <th className="px-2 py-2 text-center bg-orange-50">I</th>
                                  <th className="px-2 py-2 text-center bg-orange-50">II</th>
                                  <th className="px-2 py-2 text-center bg-orange-50">III</th>
                                  <th className="px-2 py-2 text-center bg-orange-50">IV</th>
                                  <th className="px-2 py-2 text-center bg-purple-50">I</th>
                                  <th className="px-2 py-2 text-center bg-purple-50">II</th>
                                  <th className="px-2 py-2 text-center bg-purple-50">III</th>
                                  <th className="px-2 py-2 text-center bg-purple-50">IV</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {unit.timeSchedule.map((item) => (
                                  <tr key={item.id} className="text-xs hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-white z-10">{item.id}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{item.uraianPekerjaan}</td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-700">
                                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.biaya)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-primary">{item.bobot.toFixed(2)}%</td>
                                    <td className="px-4 py-3 text-center text-gray-600 font-medium">{item.elevasi || '-'}</td>
                                    
                                    {/* Bulan 1 */}
                                    <td className="px-2 py-3 text-center text-xs bg-blue-50/30">
                                      {item.bulan1?.minggu1 ? <span className="font-bold text-blue-700">{item.bulan1.minggu1.toFixed(2)}</span> : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center text-xs bg-blue-50/30">
                                      {item.bulan1?.minggu2 ? <span className="font-bold text-blue-700">{item.bulan1.minggu2.toFixed(2)}</span> : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center text-xs bg-blue-50/30">
                                      {item.bulan1?.minggu3 ? <span className="font-bold text-blue-700">{item.bulan1.minggu3.toFixed(2)}</span> : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center text-xs bg-blue-50/30">
                                      {item.bulan1?.minggu4 ? <span className="font-bold text-blue-700">{item.bulan1.minggu4.toFixed(2)}</span> : '-'}
                                    </td>

                                    {/* Bulan 2 */}
                                    <td className="px-2 py-3 text-center text-xs bg-green-50/30">
                                      {item.bulan2?.minggu1 ? <span className="font-bold text-green-700">{item.bulan2.minggu1.toFixed(2)}</span> : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center text-xs bg-green-50/30">
                                      {item.bulan2?.minggu2 ? <span className="font-bold text-green-700">{item.bulan2.minggu2.toFixed(2)}</span> : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center text-xs bg-green-50/30">
                                      {item.bulan2?.minggu3 ? <span className="font-bold text-green-700">{item.bulan2.minggu3.toFixed(2)}</span> : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center text-xs bg-green-50/30">
                                      {item.bulan2?.minggu4 ? <span className="font-bold text-green-700">{item.bulan2.minggu4.toFixed(2)}</span> : '-'}
                                    </td>

                                    {/* Bulan 3 */}
                                    <td className="px-2 py-3 text-center text-xs bg-orange-50/30">
                                      {item.bulan3?.minggu1 ? <span className="font-bold text-orange-700">{item.bulan3.minggu1.toFixed(2)}</span> : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center text-xs bg-orange-50/30">
                                      {item.bulan3?.minggu2 ? <span className="font-bold text-orange-700">{item.bulan3.minggu2.toFixed(2)}</span> : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center text-xs bg-orange-50/30">
                                      {item.bulan3?.minggu3 ? <span className="font-bold text-orange-700">{item.bulan3.minggu3.toFixed(2)}</span> : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center text-xs bg-orange-50/30">
                                      {item.bulan3?.minggu4 ? <span className="font-bold text-orange-700">{item.bulan3.minggu4.toFixed(2)}</span> : '-'}
                                    </td>

                                    {/* Bulan 4 */}
                                    <td className="px-2 py-3 text-center text-xs bg-purple-50/30">
                                      {item.bulan4?.minggu1 ? <span className="font-bold text-purple-700">{item.bulan4.minggu1.toFixed(2)}</span> : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center text-xs bg-purple-50/30">
                                      {item.bulan4?.minggu2 ? <span className="font-bold text-purple-700">{item.bulan4.minggu2.toFixed(2)}</span> : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center text-xs bg-purple-50/30">
                                      {item.bulan4?.minggu3 ? <span className="font-bold text-purple-700">{item.bulan4.minggu3.toFixed(2)}</span> : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-center text-xs bg-purple-50/30">
                                      {item.bulan4?.minggu4 ? <span className="font-bold text-purple-700">{item.bulan4.minggu4.toFixed(2)}</span> : '-'}
                                    </td>
                                  </tr>
                                ))}
                                
                                {/* Total Row */}
                                <tr className="bg-gray-100 font-bold text-sm border-t-2 border-gray-300">
                                  <td className="px-4 py-3 sticky left-0 bg-gray-100 z-10" colSpan={2}>TOTAL</td>
                                  <td className="px-4 py-3 text-right text-primary">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
                                      unit.timeSchedule.reduce((sum, item) => sum + item.biaya, 0)
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right text-primary">100%</td>
                                  <td className="px-4 py-3" colSpan={17}></td>
                                </tr>

                                {/* S-Curve Section */}
                                {sCurveData.length > 0 && (
                                  <>
                                    {/* Spacing Row */}
                                    <tr className="bg-gray-50">
                                      <td colSpan={21} className="py-1"></td>
                                    </tr>

                                    {/* S-Curve Header */}
                                    <tr className="bg-primary/10 border-y-2 border-primary">
                                      <td colSpan={5} className="px-4 py-3 font-bold text-sm text-gray-900 sticky left-0 bg-primary/10 z-10">
                                        <div className="flex items-center gap-2">
                                          <TrendingUp size={16} className="text-primary" />
                                          KURVA S - PROGRESS KUMULATIF
                                        </div>
                                      </td>
                                      <td colSpan={16} className="px-4 py-3"></td>
                                    </tr>

                                    {/* Bobot Mingguan Row */}
                                    <tr className="text-xs bg-gray-50 border-b border-gray-200">
                                      <td colSpan={2} className="px-4 py-3 font-bold text-gray-700 sticky left-0 bg-gray-50 z-10">
                                        Bobot Minggu (%)
                                      </td>
                                      <td colSpan={3} className="px-4 py-3 text-xs text-gray-500"></td>
                                      {sCurveData.map((data, i) => {
                                        const bgColors = ['bg-blue-100', 'bg-blue-100', 'bg-blue-100', 'bg-blue-100',
                                                         'bg-green-100', 'bg-green-100', 'bg-green-100', 'bg-green-100',
                                                         'bg-orange-100', 'bg-orange-100', 'bg-orange-100', 'bg-orange-100',
                                                         'bg-purple-100', 'bg-purple-100', 'bg-purple-100', 'bg-purple-100'];
                                        const textColors = ['text-blue-900', 'text-blue-900', 'text-blue-900', 'text-blue-900',
                                                           'text-green-900', 'text-green-900', 'text-green-900', 'text-green-900',
                                                           'text-orange-900', 'text-orange-900', 'text-orange-900', 'text-orange-900',
                                                           'text-purple-900', 'text-purple-900', 'text-purple-900', 'text-purple-900'];
                                        const height = data.bobot > 0 ? Math.max((data.bobot / 10) * 100, 20) : 0;
                                        
                                        return (
                                          <td key={i} className={`px-2 py-3 text-center ${bgColors[i]} border border-gray-200 relative`}>
                                            {data.bobot > 0 && (
                                              <div className="relative">
                                                <div 
                                                  className={`mx-auto rounded-t ${bgColors[i].replace('100', '400')} opacity-60`}
                                                  style={{ width: '80%', height: `${height}px` }}
                                                ></div>
                                                <span className={`block mt-1 font-bold text-[10px] ${textColors[i]}`}>
                                                  {data.bobot.toFixed(2)}%
                                                </span>
                                              </div>
                                            )}
                                            {data.bobot === 0 && <span className="text-gray-400 text-[10px]">-</span>}
                                          </td>
                                        );
                                      })}
                                    </tr>

                                    {/* Progress Rencana Row */}
                                    <tr className="text-xs bg-yellow-50/50 border-b border-gray-200">
                                      <td colSpan={2} className="px-4 py-3 font-bold text-gray-700 sticky left-0 bg-yellow-50/50 z-10">
                                        Progress Rencana (%)
                                      </td>
                                      <td colSpan={3} className="px-4 py-3 text-xs text-gray-500">
                                        <span className="inline-flex items-center gap-1">
                                          <span className="w-3 h-3 bg-primary rounded-full"></span>
                                          Target 100%
                                        </span>
                                      </td>
                                      {sCurveData.map((data, i) => {
                                        const bgColors = ['bg-blue-50/30', 'bg-blue-50/30', 'bg-blue-50/30', 'bg-blue-50/30',
                                                         'bg-green-50/30', 'bg-green-50/30', 'bg-green-50/30', 'bg-green-50/30',
                                                         'bg-orange-50/30', 'bg-orange-50/30', 'bg-orange-50/30', 'bg-orange-50/30',
                                                         'bg-purple-50/30', 'bg-purple-50/30', 'bg-purple-50/30', 'bg-purple-50/30'];
                                        
                                        return (
                                          <td key={i} className={`px-2 py-3 text-center ${bgColors[i]} border border-gray-200 relative`}>
                                            <div className="relative">
                                              <div 
                                                className="mx-auto bg-primary/20 rounded"
                                                style={{ width: '100%', height: '4px' }}
                                              ></div>
                                              <span className="block mt-1 font-bold text-[11px] text-primary">
                                                {data.Rencana.toFixed(1)}%
                                              </span>
                                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                                                <div className="w-2 h-2 bg-primary rounded-full border-2 border-white"></div>
                                              </div>
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>

                                    {/* Progress Aktual Row */}
                                    <tr className="text-xs bg-green-50/50 border-b-2 border-gray-300">
                                      <td colSpan={2} className="px-4 py-3 font-bold text-gray-700 sticky left-0 bg-green-50/50 z-10">
                                        Progress Aktual (%)
                                      </td>
                                      <td colSpan={3} className="px-4 py-3 text-xs text-gray-500">
                                        <span className="inline-flex items-center gap-1">
                                          <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                                          Saat Ini {unit.progress}%
                                        </span>
                                      </td>
                                      {sCurveData.map((data, i) => {
                                        const bgColors = ['bg-blue-50/30', 'bg-blue-50/30', 'bg-blue-50/30', 'bg-blue-50/30',
                                                         'bg-green-50/30', 'bg-green-50/30', 'bg-green-50/30', 'bg-green-50/30',
                                                         'bg-orange-50/30', 'bg-orange-50/30', 'bg-orange-50/30', 'bg-orange-50/30',
                                                         'bg-purple-50/30', 'bg-purple-50/30', 'bg-purple-50/30', 'bg-purple-50/30'];
                                        
                                        return (
                                          <td key={i} className={`px-2 py-3 text-center ${bgColors[i]} border border-gray-200 relative`}>
                                            <div className="relative">
                                              <div 
                                                className="mx-auto bg-green-600/20 rounded"
                                                style={{ width: '100%', height: '4px', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#059669' }}
                                              ></div>
                                              <span className="block mt-1 font-bold text-[11px] text-green-700">
                                                {data.Aktual.toFixed(1)}%
                                              </span>
                                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                                                <div className="w-2 h-2 bg-green-600 rounded-full border-2 border-white"></div>
                                              </div>
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  </>
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <Calendar className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-sm text-gray-500">Belum ada jadwal pekerjaan untuk unit ini.</p>
                          </div>
                        )}
                      </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900">Mutasi Barang & Material</h4>
                      <p className="text-xs text-gray-500">
                        {selectedProject.type === 'standalone' 
                          ? 'Riwayat pemakaian material untuk bangunan ini.' 
                          : 'Pilih unit untuk melihat detail pemakaian material spesifik.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedProject.type === 'cluster' && (
                        <select 
                          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                          value={selectedUnitForInventory}
                          onChange={(e) => setSelectedUnitForInventory(e.target.value)}
                        >
                          <option value="All">Semua Unit</option>
                          {selectedProject.units.map(u => (
                            <option key={u.no} value={u.no}>Unit {u.no}</option>
                          ))}
                        </select>
                      )}
                    <button 
                      onClick={() => {
                        console.log("Button clicked, opening modal...");
                        setShowInventoryModal(true);
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 shadow-md shadow-primary/10 whitespace-nowrap cursor-pointer"
                    >
                      Input Mutasi Baru
                    </button>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                          {selectedProject.type === 'cluster' && <th className="px-6 py-4">Unit</th>}
                          <th className="px-6 py-4">Tanggal</th>
                          <th className="px-6 py-4">Item Material</th>
                          <th className="px-6 py-4 text-center">Tipe</th>
                          <th className="px-6 py-4 text-right">Jumlah</th>
                          <th className="px-6 py-4">PIC Lapangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {Object.entries(selectedProject.inventory)
                          .filter(([unitNo]) => 
                            selectedProject.type === 'standalone' 
                              ? unitNo === 'main' 
                              : (selectedUnitForInventory === 'All' || unitNo === selectedUnitForInventory)
                          )
                          .flatMap(([unitNo, items]) => items.map(item => ({ ...item, unitNo })))
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((inv, idx) => (
                          <tr key={idx} className="text-sm hover:bg-gray-50 transition-colors">
                            {selectedProject.type === 'cluster' && (
                              <td className="px-6 py-4 font-bold text-primary">Unit {inv.unitNo}</td>
                            )}
                            <td className="px-6 py-4 text-gray-500 font-medium">{inv.date}</td>
                            <td className="px-6 py-4 font-bold text-gray-900">{inv.item}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                inv.type === 'in' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                              }`}>
                                {inv.type === 'in' ? 'Masuk' : 'Keluar'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold">{inv.qty} {inv.unit}</td>
                            <td className="px-6 py-4 text-gray-600 font-medium">{inv.person}</td>
                          </tr>
                        ))}
                        {Object.keys(selectedProject.inventory).length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">Belum ada data mutasi material.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">Laporan Progres Harian</h4>
                      <p className="text-xs text-gray-500">Pilih tanggal untuk melihat rekap aktivitas seluruh unit.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <select 
                          className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                        >
                          {Array.from(new Set(selectedProject.logs.map(log => log.date)))
                            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                            .map(date => (
                              <option key={date} value={date}>{date}</option>
                            ))
                          }
                          {!selectedProject.logs.some(l => l.date === formatDateId(new Date())) && (
                            <option value={formatDateId(new Date())}>
                              {formatDateId(new Date())} (Hari Ini)
                            </option>
                          )}
                        </select>
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>

                      <button 
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center justify-center gap-2 bg-primary text-white font-bold text-xs hover:bg-primary/90 px-4 py-2 rounded-xl transition-all shadow-md shadow-primary/10"
                      >
                        <Plus size={16} />
                        Tambah Laporan
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {(() => {
                      const dailyLogs = selectedProject.logs.filter(log => log.date === selectedDate);
                      
                      const totalWorkers = dailyLogs.reduce((sum, log) => sum + (log.workerCount || 0), 0);

                      return (
                        <div className="space-y-4">
                          {/* Summary Bar for the day */}
                          {dailyLogs.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in slide-in-from-top duration-300 mb-2">
                              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                  <Users size={20} />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Total Pekerja</p>
                                  <p className="text-sm font-bold text-gray-900">{totalWorkers} Orang</p>
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                  <LayoutGrid size={20} />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Unit Aktif</p>
                                  <p className="text-sm font-bold text-gray-900">{dailyLogs.length} Kavling</p>
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                                  <ClockIcon size={20} />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Status Update</p>
                                  <p className="text-sm font-bold text-gray-900">Final</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {dailyLogs.length === 0 ? (
                            <div className="py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm mb-4">
                                <ClipboardList size={32} />
                              </div>
                              <h6 className="text-gray-900 font-bold">Tidak Ada Aktivitas</h6>
                              <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">Belum ada laporan unit yang tercatat pada tanggal {selectedDate}.</p>
                            </div>
                          ) : (
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <HistoryIcon size={18} className="text-primary" />
                                  <h5 className="font-bold text-gray-900">Rekap Pekerjaan: {selectedDate}</h5>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{dailyLogs.length} Unit Dilaporkan</span>
                              </div>
                              
                              <div className="divide-y divide-gray-100">
                                {dailyLogs.map((log) => (
                                  <div key={log.id} className="p-6 hover:bg-gray-50/50 transition-colors group/row">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                      <div className="flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                          <div className="flex items-center gap-3">
                                            <span className="w-12 h-8 bg-primary/10 text-primary flex items-center justify-center rounded-lg font-bold text-sm">
                                              {log.unitNo}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                              log.status === 'Kendala' ? 'bg-red-50 text-red-600' : 
                                              log.status === 'Lembur' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                              {log.status}
                                            </span>
                                            {log.weather && (
                                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                                {log.weather === 'Cerah' ? '☀️' : log.weather === 'Berawan' ? '☁️' : log.weather === 'Hujan' ? '🌧️' : '⛈️'} {log.weather}
                                              </span>
                                            )}
                                          </div>
                                          
                                          <div className="flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                            <button 
                                              onClick={() => handleEditWorkLog(log)}
                                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                              title="Edit Laporan"
                                            >
                                              <Pencil size={14} />
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteWorkLog(log.id)}
                                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                              title="Hapus Laporan"
                                            >
                                              <X size={14} />
                                            </button>
                                          </div>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                          {log.activity}
                                        </p>
                                        <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-400 font-bold uppercase">
                                          <span className="flex items-center gap-1.5"><Users size={14} /> {log.workerCount} Pekerja</span>
                                        </div>
                                      </div>
                                      
                                      {log.photos && log.photos.length > 0 && (
                                        <div className="mt-3 space-y-2 lg:max-w-xs">
                                          <div className="flex items-center gap-2">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Foto Dokumentasi</div>
                                          </div>
                                          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                            {log.photos.map((photo, pIdx) => (
                                              <div key={pIdx} className="w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100 relative group cursor-pointer">
                                                <img 
                                                  src={photo} 
                                                  alt="Dokumentasi" 
                                                  className="w-full h-full object-cover"
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {activeTab === 'map' && (
                <div className="bg-gray-50 rounded-2xl p-4 md:p-8 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h5 className="font-bold text-gray-900 flex items-center gap-2">
                      <MapIcon size={20} className="text-primary" />
                      Peta Kawasan: {selectedProject.name}
                    </h5>
                    <div className="flex items-center gap-3">
                      {selectedProject.layout_svg && (
                        <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg">
                          SVG Tersedia
                        </span>
                      )}
                      <label className={`px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-primary/90 transition-colors inline-flex items-center gap-2 ${isUploadingLayout ? 'opacity-60 pointer-events-none' : ''}`}>
                        {isUploadingLayout ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Mengupload...
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            Upload SVG
                          </>
                        )}
                        <input
                          type="file"
                          accept=".svg,image/svg+xml"
                          className="hidden"
                          onChange={handleUploadLayoutSvg}
                          disabled={isUploadingLayout}
                        />
                      </label>
                    </div>
                  </div>

                  {selectedProject.layout_svg ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 overflow-hidden">
                      {isLoadingSvg ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                          <Loader2 size={32} className="animate-spin text-primary" />
                        </div>
                      ) : svgContent ? (
                        <div 
                          ref={svgContainerRef}
                          className="w-full overflow-auto max-h-[600px]"
                          dangerouslySetInnerHTML={{ __html: svgContent }}
                          onClick={handleSvgClick}
                          onMouseOver={handleSvgMouseOver}
                          onMouseOut={handleSvgMouseOut}
                        />
                      ) : (
                        <div className="flex items-center justify-center min-h-[400px]">
                          <p className="text-gray-500">Gagal memuat peta kawasan</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center min-h-[400px] bg-gray-50">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <MapIcon size={32} className="text-gray-300" />
                      </div>
                      <h6 className="text-gray-900 font-bold mb-2">Belum Ada Peta Kawasan</h6>
                      <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                        Upload file SVG untuk menampilkan peta kawasan visual. 
                        File SVG akan menggantikan tampilan grid default.
                      </p>
                      <div className="text-xs text-gray-400 mb-6">
                        Format: .svg | Maks: 10MB
                      </div>
                      <label className={`px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-primary/90 transition-colors inline-flex items-center gap-2 ${isUploadingLayout ? 'opacity-60 pointer-events-none' : ''}`}>
                        {isUploadingLayout ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Mengupload...
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            Pilih File SVG
                          </>
                        )}
                        <input
                          type="file"
                          accept=".svg,image/svg+xml"
                          className="hidden"
                          onChange={handleUploadLayoutSvg}
                          disabled={isUploadingLayout}
                        />
                      </label>

                      <div className="mt-8 w-full max-w-2xl">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 text-center">
                          Preview Default (Grid)
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                          {Array.from({ length: 32 }).map((_, i) => {
                            const unit = selectedProject.units[i];
                            const hasUnit = Boolean(unit);
                            return (
                              <div
                                key={i}
                                className={`aspect-square rounded-lg border flex items-center justify-center text-[10px] font-bold transition-all ${
                                  hasUnit
                                    ? 'border-2 hover:shadow-md'
                                    : 'bg-gray-100 border-gray-200 text-gray-300'
                                }`}
                                style={
                                  hasUnit
                                    ? {
                                        backgroundColor: getStatusColor(unit.status),
                                        borderColor: getStatusColor(unit.status),
                                        color: getReadableTextColor(getStatusColor(unit.status)),
                                      }
                                    : undefined
                                }
                              >
                                {hasUnit ? unit.no : ''}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Project & Manajemen Konstruksi</h2>
              <p className="text-gray-500">Monitor progres pembangunan fisik, logistik, dan laporan lapangan.</p>
            </div>

          </div>

          {/* Stats Quick View */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickStat onClick={() => handleAction('Proyek Aktif')} icon={<ConstructionIcon className="text-primary" />} label="Proyek Aktif" value={`${totalProjects} Proyek`} />
            {/* <QuickStat onClick={() => handleAction('Cluster')} icon={<LayoutGrid className="text-blue-600" />} label="Cluster" value={`${totalClusters} Cluster`} /> */}
            <QuickStat onClick={() => handleAction('Total Unit')} icon={<Home className="text-blue-600" />} label="Total Unit Bangun" value={`${totalUnits} Unit`} />
            <QuickStat onClick={() => handleAction('Analisis Progres')} icon={<TrendingUp className="text-green-600" />} label="Rata-rata Progres" value={`${avgProgress}%`} />
            <QuickStat onClick={() => handleAction('Kendala')} icon={<AlertTriangleIcon className="text-orange-600" />} label="Kendala Lapangan" value={`${totalIssues} Isu`} />
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama cluster atau lokasi..." 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select className="flex-1 md:flex-none px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium">
                <option>Semua Status</option>
                <option>On Progress</option>
                <option>Completed</option>
                <option>Delayed</option>
              </select>
              <button className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                <Filter size={20} />
              </button>
            </div>
          </div>

          {/* Project List/Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredProjects.map((project) => (
              <div 
                key={project.id} 
                className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer overflow-hidden"
                onClick={() => handleOpenProject(project)}
              >
                <div className="p-5 flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-4 rounded-2xl ${
                      project.status === 'Delayed' ? 'bg-red-50 text-red-600' : 
                      project.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-primary/10 text-primary'
                    }`}>
                      <ConstructionIcon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{project.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {project.location}</span>
                        <span className="flex items-center gap-1"><Home size={12} /> {project.unitsCount} Unit</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-64 space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-gray-400">Penyelesaian</span>
                      <span className="text-primary">{project.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          project.status === 'Delayed' ? 'bg-red-500' : 
                          project.status === 'Completed' ? 'bg-green-500' : 'bg-primary'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                    <div className="hidden sm:block">
                      <p className="text-[10px] text-gray-400 font-bold uppercase text-right">Target Deadline</p>
                      <p className="text-sm font-bold text-gray-900">{project.deadline}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProjectStatusBadge status={project.status} />
                      <div className="p-2 text-gray-300 group-hover:text-primary transition-colors">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Mutasi Barang */}
      <Modal 
        isOpen={showInventoryModal} 
        onClose={() => setShowInventoryModal(false)} 
        title={selectedProject?.type === 'standalone' ? 'Input Mutasi Barang' : 'Input Mutasi Barang (Per Unit)'}
      >
        <div className="space-y-4">
          <div className={`grid ${selectedProject?.type === 'standalone' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            {selectedProject?.type === 'cluster' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Pilih Unit</label>
                <select 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  value={inventoryForm.unitNo}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, unitNo: e.target.value })}
                >
                  <option value="">-- Pilih Unit --</option>
                  {selectedProject?.units.map(u => (
                    <option key={u.no} value={u.no}>Unit {u.no}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Tipe Mutasi</label>
              <select 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={inventoryForm.type}
                onChange={(e) => setInventoryForm({ ...inventoryForm, type: e.target.value as 'in' | 'out' })}
              >
                <option value="out">Barang Keluar (Dipakai)</option>
                <option value="in">Barang Masuk (Stok)</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nama Material</label>
            <input 
              type="text" 
              placeholder="Contoh: Keramik 40x40" 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={inventoryForm.item}
              onChange={(e) => setInventoryForm({ ...inventoryForm, item: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Jumlah</label>
              <input 
                type="number" 
                placeholder="0" 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={inventoryForm.qty}
                onChange={(e) => setInventoryForm({ ...inventoryForm, qty: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Satuan</label>
              <input
                type="text"
                value={inventoryForm.unit}
                onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                placeholder="Contoh: Sak, Kg, Meter, Pcs"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <button 
            type="button"
            onClick={handleAddInventory}
            disabled={isSavingInventory}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-2 hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {isSavingInventory && <Loader2 className="animate-spin" size={18} />}
            {isSavingInventory ? 'Menyimpan...' : 'Simpan Mutasi Unit'}
          </button>
        </div>
      </Modal>

      {/* Modal Proyek Baru / Edit Proyek */}
      <Modal 
        isOpen={showProjectModal} 
        onClose={() => {
          setShowProjectModal(false);
          setEditingProject(null);
        }} 
        title={editingProject ? "Edit Proyek / Cluster" : "Buat Proyek Baru"}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Tipe Proyek</label>
            <select 
              value={projectForm.type}
              onChange={(e) => setProjectForm({...projectForm, type: e.target.value as 'cluster' | 'standalone', unitsCount: e.target.value === 'standalone' ? '0' : projectForm.unitsCount})}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="cluster">Cluster Perumahan</option>
              <option value="standalone">Bangunan Tunggal</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nama Proyek / {projectForm.type === 'cluster' ? 'Cluster' : 'Bangunan'}</label>
            <input 
              type="text" 
              placeholder={projectForm.type === 'cluster' ? 'Masukkan nama cluster' : 'Contoh: Gerbang Utama, Masjid, dll'} 
              value={projectForm.name}
              onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Lokasi {projectForm.type === 'cluster' ? '(Blok)' : ''}</label>
            <input 
              type="text" 
              placeholder={projectForm.type === 'cluster' ? 'Contoh: Blok M-P' : 'Contoh: Area Utama, Depan Gerbang, dll'} 
              value={projectForm.location}
              onChange={(e) => setProjectForm({...projectForm, location: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {projectForm.type === 'cluster' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Jumlah Unit</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={projectForm.unitsCount}
                  onChange={(e) => setProjectForm({...projectForm, unitsCount: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                />
              </div>
            )}
            <div className={`space-y-1 ${projectForm.type === 'standalone' ? 'col-span-2' : ''}`}>
              <label className="text-xs font-bold text-gray-500 uppercase">Deadline</label>
              <input 
                type="text" 
                placeholder="Contoh: Dec 2026"
                value={projectForm.deadline}
                onChange={(e) => setProjectForm({...projectForm, deadline: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Status Proyek</label>
            <select 
              value={projectForm.status}
              onChange={(e) => setProjectForm({...projectForm, status: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option>On Progress</option>
              <option>Completed</option>
              <option>Delayed</option>
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            {editingProject && (
              <button 
                onClick={() => handleDeleteProject(editingProject.id)}
                className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
              >
                Hapus Proyek
              </button>
            )}
            <button 
              type="button"
              onClick={handleSaveProject}
              disabled={isSavingProject}
              className={`${editingProject ? 'flex-[2]' : 'w-full'} py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2`}
            >
              {isSavingProject && <Loader2 className="animate-spin" size={18} />}
              {isSavingProject ? 'Menyimpan...' : editingProject ? 'Simpan Perubahan' : 'Buat Proyek'}
            </button>
          </div>
        </div>
      </Modal>



      {/* Modal Laporan Harian */}
      <Modal 
        isOpen={showReportModal} 
        onClose={() => {
          setShowReportModal(false);
          setEditingLog(null);
          setReportFiles([]);
          setReportForm({ unitNo: '', activity: '', workers: '', progress: '', date: new Date().toISOString().split('T')[0], status: 'Normal', weather: 'Cerah', photos: [] });
        }} 
        title={editingLog ? `Edit Laporan Unit ${editingLog.unitNo}` : "Input Laporan Harian (Per Unit)"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Pilih Unit</label>
              <select 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={reportForm.unitNo}
                onChange={(e) => setReportForm({ ...reportForm, unitNo: e.target.value })}
              >
                <option value="">-- Pilih Unit --</option>
                {selectedProject?.units.map(u => (
                  <option key={u.no} value={u.no}>Unit {u.no}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Kondisi</label>
              <select 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={reportForm.status}
                onChange={(e) => setReportForm({ ...reportForm, status: e.target.value as any })}
              >
                <option value="Normal">Normal</option>
                <option value="Lembur">Lembur</option>
                <option value="Kendala">Kendala</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Cuaca</label>
              <select 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={reportForm.weather}
                onChange={(e) => setReportForm({ ...reportForm, weather: e.target.value as any })}
              >
                <option value="Cerah">☀️ Cerah</option>
                <option value="Berawan">☁️ Berawan</option>
                <option value="Hujan">🌧️ Hujan</option>
                <option value="Hujan Lebat">⛈️ Hujan Lebat</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Aktivitas Pekerjaan</label>
            <textarea 
              placeholder="Deskripsikan pekerjaan hari ini..." 
              value={reportForm.activity}
              onChange={(e) => setReportForm({...reportForm, activity: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none h-24 focus:ring-2 focus:ring-primary/20" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Jumlah Pekerja</label>
              <input 
                type="number" 
                placeholder="0" 
                value={reportForm.workers}
                onChange={(e) => setReportForm({...reportForm, workers: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" 
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Dokumentasi Foto</label>
            <div className="mt-1 flex flex-col gap-3">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Plus size={24} className="text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 font-bold">Klik untuk upload foto</p>
                  <p className="text-[10px] text-gray-400">PNG, JPG (bisa pilih banyak foto sekaligus)</p>
                  {reportForm.photos.length > 0 && (
                    <p className="text-[10px] text-primary font-bold mt-1">{reportForm.photos.length} foto terpilih</p>
                  )}
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
              
              {reportForm.photos.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
                  {reportForm.photos.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-100">
                      <img src={url} className="w-full h-full object-cover" alt="preview" />
                      <button 
                        onClick={() => {
                          // Check if this is an existing server photo
                          const existingCount = existingPhotos.filter(ep => !removedPhotoIds.includes(ep.id)).length;
                          if (i < existingCount) {
                            // This is an existing server photo — track its ID for deletion
                            const visibleExisting = existingPhotos.filter(ep => !removedPhotoIds.includes(ep.id));
                            const photoToRemove = visibleExisting[i];
                            if (photoToRemove) {
                              setRemovedPhotoIds(prev => [...prev, photoToRemove.id]);
                            }
                          } else {
                            // This is a newly added photo — remove from reportFiles
                            const newPhotoIndex = i - existingCount;
                            setReportFiles(prev => prev.filter((_, idx) => idx !== newPhotoIndex));
                          }
                          setReportForm(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }));
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{i + 1}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button 
            type="button"
            onClick={handleAddWorkLog}
            disabled={isSavingWorkLog}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-2 hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {isSavingWorkLog && <Loader2 className="animate-spin" size={18} />}
            {isSavingWorkLog ? 'Menyimpan...' : editingLog ? 'Simpan Perubahan' : 'Posting Laporan Unit'}
          </button>
        </div>
      </Modal>

      {/* Modal Unit */}
      <Modal 
        isOpen={showUnitModal} 
        onClose={() => {
          setShowUnitModal(false);
          setEditingUnit(null);
          setUnitForm({ no: '', tipe: '', status: 'Belum Mulai', qcTemplateId: '' });
        }} 
        title={editingUnit ? `Edit Unit ${editingUnit.no}` : "Tambah Unit Baru"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">No. Unit</label>
              <input 
                type="text" 
                placeholder="A-01" 
                value={unitForm.no}
                onChange={(e) => setUnitForm({...unitForm, no: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Tipe</label>
              <input 
                type="text" 
                placeholder="Tipe 36" 
                value={unitForm.tipe}
                onChange={(e) => setUnitForm({...unitForm, tipe: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" 
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Status Konstruksi</label>
            <select 
              value={unitForm.status}
              onChange={(e) => setUnitForm({...unitForm, status: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
            >
              {constructionStatuses.sort((a, b) => a.order - b.order).map(status => (
                <option key={status.id} value={status.name}>
                  {status.name} ({status.progress}%)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              ⚡ Progres otomatis diset sesuai status yang dipilih
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Template QC</label>
            <select 
              value={unitForm.qcTemplateId}
              onChange={(e) => setUnitForm({...unitForm, qcTemplateId: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
            >
              <option value="">-- Pilih Template QC (Opsional) --</option>
                  {qcTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Template QC akan digunakan untuk inspeksi kualitas unit ini
            </p>
          </div>
          <button 
            type="button"
            onClick={handleSaveUnit}
            disabled={isSavingUnit}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-2 hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {isSavingUnit && <Loader2 className="animate-spin" size={18} />}
            {isSavingUnit ? 'Menyimpan...' : editingUnit ? 'Simpan Perubahan' : 'Tambah Unit'}
          </button>
        </div>
      </Modal>

      {/* Quality Control History Modal */}
      {showQCHistory && selectedProject && selectedUnitForQC && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-white">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <HistoryIcon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Riwayat QC Unit {selectedUnitForQC.no}</h3>
                <p className="text-xs text-gray-500">{selectedProject.name}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowQCHistory(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/30 text-left">
            <div className="max-w-6xl mx-auto">
              <QualityControl 
                initialProject={selectedProject.name} 
                initialProjectId={selectedProject.id}
                initialUnit={selectedUnitForQC.no} 
                onClose={() => setShowQCHistory(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Modal Update Progres Cluster */}
      <Modal
        isOpen={showUpdateProgressModal}
        onClose={() => { setShowUpdateProgressModal(false); setUpdateProgressUnit(null); setUpdateProgressStatus(''); }}
        title="Update Progres Unit"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Pilih Unit</label>
            <select
              value={updateProgressUnit?.no ?? ''}
              onChange={(e) => {
                const unit = selectedProject?.units.find(u => u.no === e.target.value) ?? null;
                setUpdateProgressUnit(unit);
                setUpdateProgressStatus(unit?.status ?? '');
              }}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">- Pilih Unit -</option>
              {(selectedProject?.units ?? []).map(u => (
                <option key={u.no} value={u.no}>{u.no} — {u.tipe} ({u.progress}%)</option>
              ))}
            </select>
          </div>
          {updateProgressUnit && (
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
              Status saat ini: <span className="font-bold text-gray-900">{updateProgressUnit.status}</span> — <span className="font-bold text-primary">{updateProgressUnit.progress}%</span>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Status Baru</label>
            <select
              value={updateProgressStatus}
              onChange={(e) => setUpdateProgressStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">- Pilih Status -</option>
              {constructionStatuses.sort((a, b) => a.order - b.order).map(s => (
                <option key={s.id} value={s.name}>{s.name} ({s.progress}%)</option>
              ))}
            </select>
          </div>
          {updateProgressStatus && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-900">
                Progress akan diset ke <span className="font-bold">{getProgressFromStatus(updateProgressStatus)}%</span>
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={handleSaveUpdateProgress}
            disabled={!updateProgressUnit || !updateProgressStatus || isSavingUpdateProgress}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {isSavingUpdateProgress && <Loader2 className="animate-spin" size={18} />}
            {isSavingUpdateProgress ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            onClick={() => { setShowUpdateProgressModal(false); setUpdateProgressUnit(null); setUpdateProgressStatus(''); }}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
          >
            Batal
          </button>
        </div>
      </Modal>

      {/* Modal Edit Standalone */}
      <Modal 
        isOpen={showEditStandaloneModal} 
        onClose={() => {
          setShowEditStandaloneModal(false);
          setStandaloneForm({ name: '', location: '', deadline: '', status: 'On Progress' });
        }} 
        title="Edit Bangunan Standalone"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nama Bangunan</label>
            <input 
              type="text" 
              placeholder="Nama bangunan"
              value={standaloneForm.name}
              onChange={(e) => setStandaloneForm({...standaloneForm, name: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Lokasi</label>
            <input 
              type="text" 
              placeholder="Lokasi bangunan"
              value={standaloneForm.location}
              onChange={(e) => setStandaloneForm({...standaloneForm, location: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Deadline</label>
            <input 
              type="text" 
              placeholder="Contoh: Dec 2026"
              value={standaloneForm.deadline}
              onChange={(e) => setStandaloneForm({...standaloneForm, deadline: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Status Konstruksi</label>
            <select 
              value={standaloneForm.status}
              onChange={(e) => setStandaloneForm({...standaloneForm, status: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">- Pilih Status -</option>
              <option value="On Progress">On Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button 
            type="button"
            onClick={handleSaveStandalone}
            disabled={isSavingStandalone}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {isSavingStandalone && <Loader2 className="animate-spin" size={18} />}
            {isSavingStandalone ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <button 
            onClick={() => setShowEditStandaloneModal(false)}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
          >
            Batal
          </button>
        </div>
      </Modal>
    </>
  );
}

// ProjectStatusBadge direferensikan dari `frontend/src/app/components/ui/ProjectStatusBadge`

function QuickStat({ icon, label, value, onClick }: { icon: React.ReactNode, label: string, value: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 transition-all ${onClick ? 'cursor-pointer hover:border-primary/30 hover:shadow-md' : ''}`}
    >
      <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// Modal sudah di-refactor ke `frontend/src/app/components/ui/Modal.tsx`
