import {
    ArrowLeft,
    Building2,
    ChevronRight,
    Edit2,
    Home,
    Layers,
    Loader2,
    MapIcon,
    MapPin,
    Package,
    Plus,
    Search,
    Trash2,
    UsersRound,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useConfirmDialog, useConstructionStatuses, useDepartments, useHousingUnits, useMaterials, usePaymentSchemes, useProjects, useProjectUnits, useQCTemplates } from '../../hooks';
import { formatDateId } from '../../lib/date';
import { formatRupiah } from '../../lib/utils';
import { housingService, projectService } from '../../services';
import { departmentService } from '../../services/department.service';
import { materialService } from '../../services/material.service';
import { paymentSchemeService } from '../../services/paymentScheme.service';
import type { HousingUnit, Project, ProjectStatus, ProjectType, ProjectUnit, UnitBlockRange } from '../../types';
import { ConstructionStatusManagerPanel } from '../components/ConstructionStatusManagerPanel';
import { QCTemplateManager } from '../components/QCTemplateManager';
import { Modal } from '../components/ui/Modal';
import { ProjectStatusBadge } from '../components/ui/ProjectStatusBadge';

function totalUnitsFromBlockRows(rows: Array<{ prefix: string; start: string; end: string }>): number {
  let t = 0;
  for (const row of rows) {
    const prefix = row.prefix.trim();
    const start = parseInt(row.start, 10);
    const end = parseInt(row.end, 10);
    if (!prefix || Number.isNaN(start) || Number.isNaN(end) || end < start) continue;
    t += end - start + 1;
  }
  return t;
}

function previewUnitBlocks(rows: Array<{ prefix: string; start: string; end: string }>): string {
  const parsed: UnitBlockRange[] = rows
    .map((row) => ({
      prefix: row.prefix.trim(),
      start: parseInt(row.start, 10),
      end: parseInt(row.end, 10),
    }))
    .filter((b) => b.prefix && !Number.isNaN(b.start) && !Number.isNaN(b.end) && b.end >= b.start);
  if (parsed.length === 0) return '';
  let max = 0;
  for (const b of parsed) {
    for (let i = b.start; i <= b.end; i += 1) max = Math.max(max, i);
  }
  const w = Math.max(2, String(max).length);
  return parsed
    .map((b) => {
      const n = b.end - b.start + 1;
      return `${b.prefix}-${String(b.start).padStart(w, '0')} … ${b.prefix}-${String(b.end).padStart(w, '0')} (${n} unit)`;
    })
    .join(' · ');
}

type DataMasterSection =
  | 'projects'
  | 'qc-templates'
  | 'construction-statuses'
  | 'departments'
  | 'materials'
  | 'payment-schemes';

interface DataMasterProps {
  section?: DataMasterSection;
}

/* ──────────────────────────────────────────────────────────────
 *  Main DataMaster Component
 * ────────────────────────────────────────────────────────────── */
export function DataMaster({ section }: DataMasterProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const masterSection = useMemo<DataMasterSection>(() => {
    if (section) return section;
    const p = location.pathname.replace(/\/$/, '');
    if (p.endsWith('/qc-templates')) return 'qc-templates' as const;
    if (p.endsWith('/construction-statuses')) return 'construction-statuses' as const;
    if (p.endsWith('/departments')) return 'departments' as const;
    if (p.endsWith('/materials')) return 'materials' as const;
    if (p.endsWith('/payment-schemes')) return 'payment-schemes' as const;
    return 'projects' as const;
  }, [location.pathname, section]);

  // ── State: drill-down view ──────────────────────────────────
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'konstruksi' | 'kavling'>('konstruksi');

  const housingSyncRunningRef = useRef(false);

  // ── Data hooks ─────────────────────────────────────────────
  const {
    projects,
    refetch: refetchProjects,
    create: createProject,
    update: updateProject,
    remove: removeProject,
  } = useProjects();

  const {
    units: projectUnits,
    create: createUnit,
    update: updateUnit,
    remove: removeUnit,
    refetch: refetchUnits,
  } = useProjectUnits(selectedProjectId ?? '');

  const kavlingHousing = useHousingUnits(undefined, {
    limit: 500,
    project_id: selectedProjectId || undefined,
  });

  const { statuses: constructionStatuses } = useConstructionStatuses();
  const {
    templates: qcTemplates,
    isLoading: qcTemplatesLoading,
    create: qcCreateTemplate,
    update: qcUpdateTemplate,
    duplicate: qcDuplicateTemplate,
    remove: qcRemoveTemplate,
    refetch: qcRefetchTemplates,
  } = useQCTemplates();
  const { showConfirm, ConfirmDialog } = useConfirmDialog();

  // ── Master Data: Departemen ───────────────────────────────
  const { departments, refetch: refetchDepartments } = useDepartments();
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<{ id: string; name: string; description: string } | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [isSavingDept, setIsSavingDept] = useState(false);

  const handleSaveDept = async () => {
    if (!deptForm.name.trim()) { toast.error('Nama divisi wajib diisi'); return; }
    if (isSavingDept) return;
    setIsSavingDept(true);
    try {
      if (editingDept) {
        await departmentService.update(editingDept.id, { name: deptForm.name, description: deptForm.description || undefined });
        toast.success('Divisi berhasil diperbarui');
      } else {
        await departmentService.create({ name: deptForm.name, description: deptForm.description || undefined });
        toast.success('Divisi berhasil ditambahkan');
      }
      await refetchDepartments();
      setShowDeptModal(false);
      setEditingDept(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal menyimpan divisi');
    } finally {
      setIsSavingDept(false);
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (!(await showConfirm({ title: 'Hapus Divisi', description: `Hapus "${name}"?` }))) return;
    try {
      await departmentService.delete(id);
      toast.success('Divisi berhasil dihapus');
      await refetchDepartments();
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal menghapus divisi');
    }
  };

  // ── Master Data: Material ─────────────────────────────────
  const { materials, refetch: refetchMaterials } = useMaterials();
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<{ id: string; name: string; unit: string; notes: string } | null>(null);
  const [materialForm, setMaterialForm] = useState({ name: '', unit: '', notes: '' });
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);

  const handleSaveMaterial = async () => {
    if (!materialForm.name.trim() || !materialForm.unit.trim()) { toast.error('Nama dan satuan material wajib diisi'); return; }
    if (isSavingMaterial) return;
    setIsSavingMaterial(true);
    try {
      if (editingMaterial) {
        await materialService.update(editingMaterial.id, { name: materialForm.name, unit: materialForm.unit, notes: materialForm.notes || undefined });
        toast.success('Material berhasil diperbarui');
      } else {
        await materialService.create({ name: materialForm.name, unit: materialForm.unit, notes: materialForm.notes || undefined });
        toast.success('Material berhasil ditambahkan');
      }
      await refetchMaterials();
      setShowMaterialModal(false);
      setEditingMaterial(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal menyimpan material');
    } finally {
      setIsSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (id: string, name: string) => {
    if (!(await showConfirm({ title: 'Hapus Material', description: `Hapus "${name}"?` }))) return;
    try {
      await materialService.delete(id);
      toast.success('Material berhasil dihapus');
      await refetchMaterials();
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal menghapus material');
    }
  };

  // ── Master Data: Payment Schemes ──────────────────────────
  const { paymentSchemes, refetch: refetchPaymentSchemes } = usePaymentSchemes();
  const [showPaymentSchemeModal, setShowPaymentSchemeModal] = useState(false);
  const [editingPaymentScheme, setEditingPaymentScheme] = useState<{ id: string; name: string; description: string } | null>(null);
  const [paymentSchemeForm, setPaymentSchemeForm] = useState({ name: '', description: '' });
  const [isSavingPaymentScheme, setIsSavingPaymentScheme] = useState(false);

  const handleSavePaymentScheme = async () => {
    if (!paymentSchemeForm.name.trim()) { toast.error('Nama skema pembayaran wajib diisi'); return; }
    if (isSavingPaymentScheme) return;
    setIsSavingPaymentScheme(true);
    try {
      if (editingPaymentScheme) {
        await paymentSchemeService.update(editingPaymentScheme.id, { name: paymentSchemeForm.name, description: paymentSchemeForm.description || undefined });
        toast.success('Skema pembayaran berhasil diperbarui');
      } else {
        await paymentSchemeService.create({ name: paymentSchemeForm.name, description: paymentSchemeForm.description || undefined });
        toast.success('Skema pembayaran berhasil ditambahkan');
      }
      await refetchPaymentSchemes();
      setShowPaymentSchemeModal(false);
      setEditingPaymentScheme(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal menyimpan skema pembayaran');
    } finally {
      setIsSavingPaymentScheme(false);
    }
  };

  const handleDeletePaymentScheme = async (id: string, name: string) => {
    if (!(await showConfirm({ title: 'Hapus Skema Pembayaran', description: `Hapus "${name}"?` }))) return;
    try {
      await paymentSchemeService.delete(id);
      toast.success('Skema pembayaran berhasil dihapus');
      await refetchPaymentSchemes();
    } catch (e: any) {
      toast.error(e?.message ?? 'Gagal menghapus skema pembayaran');
    }
  };

  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingUnit, setIsSavingUnit] = useState(false);
  const [isSavingKavling, setIsSavingKavling] = useState(false);
  const [layoutSvgFile, setLayoutSvgFile] = useState<File | null>(null);

  useEffect(() => {
    if (masterSection !== 'projects') setSelectedProjectId(null);
  }, [masterSection]);

  // ── Project list search ────────────────────────────────────
  const [projectSearch, setProjectSearch] = useState('');
  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(p => (p.name ?? '').toLowerCase().includes(q) || (p.location ?? '').toLowerCase().includes(q));
  }, [projects, projectSearch]);

  // ── Selected project ───────────────────────────────────────
  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) ?? null;
  }, [projects, selectedProjectId]);

  const getProgressFromStatus = (statusName: string) => {
    const st = constructionStatuses.find(s => s.name === statusName);
    return st?.progress ?? 0;
  };

  // ── Project form ───────────────────────────────────────────
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    type: 'cluster' as ProjectType,
    location: '',
    /** Baris blok: prefix + rentang nomor (mis. A 1–10, B 1–10) */
    unitBlocks: [{ prefix: '', start: '1', end: '10' }] as Array<{ prefix: string; start: string; end: string }>,
    budget_cap: 0,
    deadline: '',
    status: 'On Progress' as ProjectStatus,
  });

  const toDateInputValue = (value?: string | null) => {
    if (!value) return '';
    const iso = value.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (iso) return iso;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  // ── Unit form ──────────────────────────────────────────────
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProjectUnit | null>(null);
  const [unitForm, setUnitForm] = useState({
    no: '',
    tipe: '',
    status: '',
    qcTemplateId: '',
  });

  // ── Kavling edit form ──────────────────────────────────────
  const [editingKavling, setEditingKavling] = useState<HousingUnit | null>(null);
  const [showKavlingModal, setShowKavlingModal] = useState(false);
  const [kavlingForm, setKavlingForm] = useState({
    luas_tanah: undefined as number | undefined,
    luas_bangunan: undefined as number | undefined,
    panjang_kanan: undefined as number | undefined,
    panjang_kiri: undefined as number | undefined,
    lebar_depan: undefined as number | undefined,
    lebar_belakang: undefined as number | undefined,
    harga_per_meter: undefined as number | undefined,
    harga_jual: undefined as number | undefined,
    daya_listrik: undefined as number | undefined,
    id_rumah: '',
    no_sertifikat: '',
    status: 'Tersedia' as HousingUnit['status'],
    notes: '',
  });

  const [kavlingPhotoFile, setKavlingPhotoFile] = useState<File | null>(null);
  const [kavlingSertifikatFile, setKavlingSertifikatFile] = useState<File | null>(null);

  // ── Sinkronkan housing_units untuk project konstruksi ─────
  // Tujuan: pastikan setiap `project_unit` punya 1 record housing unit (one-to-one),
  // termasuk jika unit dibuat lewat jalur lain (mis. bulk create) dan housing belum sempat dibuat.
  const ensureHousingUnitsForProject = async () => {
    if (!selectedProjectId) return;
    if (!projectUnits || projectUnits.length === 0) return;

    // Cegah race condition ketika user bolak-balik tab.
    if (housingSyncRunningRef.current) return;
    housingSyncRunningRef.current = true;

    try {
      for (const pu of projectUnits) {
        const unitCode = pu.no;

        // Cari housing unit berdasarkan unit_code (lintas project),
        // karena bisa saja relasinya belum sesuai akibat data lama.
        const existingList = await housingService.getAll({
          search: unitCode,
          limit: 50,
          page: 1,
        });
        const existing = existingList.data?.find((u) => u.unit_code === unitCode) ?? null;

        if (!existing) {
          await housingService.create({
            unit_code: unitCode,
            project_id: selectedProjectId,
            project_unit_id: pu.id,
            unit_type: pu.tipe ?? undefined,
            status: 'Tersedia',
            notes: '',
          });
        } else {
          // Relink agar sesuai dengan project konstruksi ini.
          if ((existing as any).project_id !== selectedProjectId || (existing as any).project_unit_id !== pu.id) {
            await housingService.update(existing.id, {
              project_id: selectedProjectId,
              project_unit_id: pu.id,
              // Wipe detail kavling agar project baru tidak ikut membawa data dari project lain.
              unit_type: pu.tipe ?? null,
              status: 'Tersedia',
              notes: '',

              luas_tanah: null,
              luas_bangunan: null,
              panjang_kanan: null,
              panjang_kiri: null,
              lebar_depan: null,
              lebar_belakang: null,
              harga_per_meter: null,
              harga_jual: null,
              daya_listrik: null,
              id_rumah: null,
              no_sertifikat: null,
              photo_url: null,
              sertifikat_file_url: null,
            } as any);
          }
        }
      }
    } finally {
      housingSyncRunningRef.current = false;
      // Refresh daftar kavling supaya langsung terlihat
      await kavlingHousing.refetch();
    }
  };

  // ── Handlers: Project ──────────────────────────────────────
  const openCreateProject = () => {
    setEditingProject(null);
    setProjectForm({
      name: '',
      type: 'cluster',
      location: '',
      unitBlocks: [{ prefix: '', start: '1', end: '10' }],
      budget_cap: 0,
      deadline: '',
      status: 'On Progress',
    });
    setLayoutSvgFile(null);
    setShowProjectModal(true);
  };

  const openEditProject = (p: Project) => {
    setEditingProject(p);
    setProjectForm({
      name: p.name,
      type: p.type,
      location: p.location ?? '',
      unitBlocks: [{ prefix: '', start: '1', end: '10' }],
      budget_cap: p.budget_cap ?? 0,
      deadline: toDateInputValue(p.deadline),
      status: p.status,
    });
    setLayoutSvgFile(null);
    setShowProjectModal(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.name || !projectForm.type) {
      toast.error('Nama dan tipe proyek wajib diisi');
      return;
    }
    if (isSavingProject) return;
    setIsSavingProject(true);
    try {
      let projectId = editingProject?.id;

      if (editingProject) {
        await updateProject(editingProject.id, {
          name: projectForm.name,
          type: projectForm.type,
          location: projectForm.location || null,
          deadline: projectForm.deadline || null,
          status: projectForm.status,
          budget_cap: projectForm.budget_cap || null,
        } as Partial<Project>);
      } else {
        const blocks: UnitBlockRange[] = projectForm.unitBlocks
          .map((row) => ({
            prefix: row.prefix.trim(),
            start: parseInt(row.start, 10),
            end: parseInt(row.end, 10),
          }))
          .filter((b) => b.prefix.length > 0);

        for (const b of blocks) {
          if (Number.isNaN(b.start) || Number.isNaN(b.end) || b.start < 1 || b.end < b.start) {
            toast.error(`Rentang tidak valid untuk blok "${b.prefix || '?'}" (nomor awal ≤ akhir, minimal 1)`);
            return;
          }
        }

        const totalPlanned = totalUnitsFromBlockRows(projectForm.unitBlocks);
        const created = await createProject({
          name: projectForm.name,
          type: projectForm.type,
          location: projectForm.location || null,
          units_count: blocks.length > 0 ? totalPlanned : 0,
          ...(blocks.length > 0 ? { unit_blocks: blocks } : {}),
          deadline: projectForm.deadline || null,
          status: projectForm.status,
          budget_cap: projectForm.budget_cap || null,
        } as Partial<Project>);
        projectId = created.id;
        setSelectedProjectId(created.id);
      }

      if (layoutSvgFile && projectId) {
        const fd = new FormData();
        fd.append('layout_svg', layoutSvgFile);
        await projectService.updateLayoutSvg(projectId, fd);
      }

      setShowProjectModal(false);
      setEditingProject(null);
      setLayoutSvgFile(null);
      await refetchProjects();
      await refetchUnits();
    } catch {
      // hook already handles toast
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!(await showConfirm({ title: 'Hapus Proyek', description: 'Hapus proyek dan seluruh unit terkait?' }))) return;
    try {
      await removeProject(id);
      if (selectedProjectId === id) setSelectedProjectId(null);
      await refetchProjects();
    } catch {
      // hook already handles toast
    }
  };

  // ── Handlers: Unit ─────────────────────────────────────────
  const openCreateUnit = () => {
    if (!selectedProjectId) return;
    setEditingUnit(null);
    setUnitForm({
      no: '',
      tipe: '',
      status: constructionStatuses[0]?.name ?? '',
      qcTemplateId: '',
    });
    setShowUnitModal(true);
  };

  const openEditUnit = (u: ProjectUnit) => {
    setEditingUnit(u);
    const qcId =
      u.qc_template_id && qcTemplates.some((t) => t.id === u.qc_template_id)
        ? u.qc_template_id
        : '';
    setUnitForm({
      no: u.no,
      tipe: u.tipe ?? '',
      status: u.status ?? '',
      qcTemplateId: qcId,
    });
    setShowUnitModal(true);
  };

  const handleSaveUnit = async () => {
    if (!selectedProjectId) return;
    if (!unitForm.no?.trim()) {
      toast.error('No Unit wajib diisi');
      return;
    }
    if (isSavingUnit) return;
    const statusName =
      unitForm.status ||
      editingUnit?.status ||
      constructionStatuses[0]?.name ||
      '';
    const progress = getProgressFromStatus(statusName);
    const rawQc = unitForm.qcTemplateId;
    const validQc =
      rawQc && qcTemplates.some((t) => t.id === rawQc) ? rawQc : undefined;
    const payload = {
      no: unitForm.no.trim(),
      tipe: unitForm.tipe.trim(),
      status: statusName,
      progress,
      qc_template_id: editingUnit
        ? (validQc === undefined ? null : validQc)
        : validQc || undefined,
    } as Partial<ProjectUnit>;
    setIsSavingUnit(true);
    try {
      if (editingUnit) {
        await updateUnit(editingUnit.no, payload);

        // Pastikan relasi housing_unit ikut tersambung ke project konstruksi yang benar.
        // (Unit code di UI tidak berubah saat edit, tapi project_id/project_unit_id bisa saja belum konsisten.)
        try {
          const existingList = await housingService.getAll({
            search: editingUnit.no,
            limit: 50,
            page: 1,
          });
          const existingHousing = existingList.data?.find((u) => u.unit_code === editingUnit.no) ?? null;
          if (existingHousing) {
            await housingService.update(existingHousing.id, {
              project_id: selectedProjectId,
              project_unit_id: editingUnit.id,
              // Saat edit, relasi bisa berubah; wipe detail agar tidak ikut data project lain.
              unit_type: editingUnit.tipe ?? null,
              status: 'Tersedia',
              notes: '',
              luas_tanah: null,
              luas_bangunan: null,
              panjang_kanan: null,
              panjang_kiri: null,
              lebar_depan: null,
              lebar_belakang: null,
              harga_per_meter: null,
              harga_jual: null,
              daya_listrik: null,
              id_rumah: null,
              no_sertifikat: null,
              photo_url: null,
              sertifikat_file_url: null,
            } as any);
          }
        } catch {
          // skip
        }
      } else {
        const created = await createUnit(payload);
        // Auto-create / upsert housing unit for the new construction unit
        try {
          // Cari existing housing unit berdasarkan `unit_code` lintas project,
          // lalu "relink" agar sesuai dengan project konstruksi saat ini.
          const existingList = await housingService.getAll({
            search: created.no,
            limit: 50,
            page: 1,
          });
          const existingUnit =
            existingList.data?.find((u) => u.unit_code === created.no) ?? null;

          if (!existingUnit) {
            await housingService.create({
              unit_code: created.no,
              project_id: selectedProjectId,
              project_unit_id: created.id,
              unit_type: created.tipe ?? undefined,
              status: 'Tersedia',
              notes: '',
            });
          } else if ((existingUnit as any).project_unit_id !== created.id) {
            await housingService.update(existingUnit.id, {
              project_id: selectedProjectId,
              project_unit_id: created.id,
              // Wipe detail kavling agar tidak terbawa dari project lain.
              unit_type: created.tipe ?? null,
              status: 'Tersedia',
              notes: '',

              luas_tanah: null,
              luas_bangunan: null,
              panjang_kanan: null,
              panjang_kiri: null,
              lebar_depan: null,
              lebar_belakang: null,
              harga_per_meter: null,
              harga_jual: null,
              daya_listrik: null,
              id_rumah: null,
              no_sertifikat: null,
              photo_url: null,
              sertifikat_file_url: null,
            } as any);
          } else if ((existingUnit as any).project_id !== selectedProjectId) {
            // relink project_id juga supaya kavling muncul di daftar proyek yang benar
            await housingService.update(existingUnit.id, {
              project_id: selectedProjectId,
              // Wipe detail kavling agar tampilan bersih.
              unit_type: created.tipe ?? null,
              status: 'Tersedia',
              notes: '',
              luas_tanah: null,
              luas_bangunan: null,
              panjang_kanan: null,
              panjang_kiri: null,
              lebar_depan: null,
              lebar_belakang: null,
              harga_per_meter: null,
              harga_jual: null,
              daya_listrik: null,
              id_rumah: null,
              no_sertifikat: null,
              photo_url: null,
              sertifikat_file_url: null,
            } as any);
          }
        } catch {
          // Silently skip housing auto-create error
        }
      }
      setShowUnitModal(false);
      setEditingUnit(null);
      await refetchProjects();
      await refetchUnits();
      await kavlingHousing.refetch();
    } catch {
      // hook already handles toast
    } finally {
      setIsSavingUnit(false);
    }
  };

  const handleDeleteUnit = async (unitNo: string) => {
    if (!selectedProjectId) return;
    if (!(await showConfirm({ title: 'Hapus Unit', description: `Hapus unit no. ${unitNo}?` }))) return;
    try {
      await removeUnit(unitNo);
      await refetchProjects();
      await refetchUnits();
    } catch {
      // hook already handles toast
    }
  };

  // ── Handlers: Kavling Edit ─────────────────────────────────
  const openEditKavling = (unit: HousingUnit) => {
    setEditingKavling(unit);
    setKavlingForm({
      luas_tanah: unit.luas_tanah,
      luas_bangunan: unit.luas_bangunan,
      panjang_kanan: unit.panjang_kanan,
      panjang_kiri: unit.panjang_kiri,
      lebar_depan: unit.lebar_depan,
      lebar_belakang: unit.lebar_belakang,
      harga_per_meter: unit.harga_per_meter,
      harga_jual: unit.harga_jual,
      daya_listrik: unit.daya_listrik,
      id_rumah: unit.id_rumah ?? '',
      no_sertifikat: (unit as any).no_sertifikat ?? '',
      status: unit.status ?? 'Tersedia',
      notes: unit.notes ?? '',
    });
    setKavlingPhotoFile(null);
    setKavlingSertifikatFile(null);
    setShowKavlingModal(true);
  };

  const handleSaveKavling = async () => {
    if (!editingKavling) return;
    if (isSavingKavling) return;
    setIsSavingKavling(true);
    try {
      if (kavlingPhotoFile || kavlingSertifikatFile) {
        const fd = new FormData();
        fd.append('status', kavlingForm.status ?? 'Tersedia');
        if (kavlingForm.luas_tanah != null) fd.append('luas_tanah', String(kavlingForm.luas_tanah));
        if (kavlingForm.luas_bangunan != null) fd.append('luas_bangunan', String(kavlingForm.luas_bangunan));
        if (kavlingForm.panjang_kanan != null) fd.append('panjang_kanan', String(kavlingForm.panjang_kanan));
        if (kavlingForm.panjang_kiri != null) fd.append('panjang_kiri', String(kavlingForm.panjang_kiri));
        if (kavlingForm.lebar_depan != null) fd.append('lebar_depan', String(kavlingForm.lebar_depan));
        if (kavlingForm.lebar_belakang != null) fd.append('lebar_belakang', String(kavlingForm.lebar_belakang));
        if (kavlingForm.harga_per_meter != null) fd.append('harga_per_meter', String(kavlingForm.harga_per_meter));
        if (kavlingForm.harga_jual != null) fd.append('harga_jual', String(kavlingForm.harga_jual));
        if (kavlingForm.daya_listrik != null) fd.append('daya_listrik', String(kavlingForm.daya_listrik));
        if (kavlingForm.id_rumah) fd.append('id_rumah', kavlingForm.id_rumah);
        if (kavlingForm.no_sertifikat) fd.append('no_sertifikat', kavlingForm.no_sertifikat);
        if (kavlingForm.notes) fd.append('notes', kavlingForm.notes);
        if (kavlingPhotoFile) fd.append('photo', kavlingPhotoFile);
        if (kavlingSertifikatFile) fd.append('sertifikat_file', kavlingSertifikatFile);

        await kavlingHousing.update(editingKavling.id, fd as any);
        setKavlingPhotoFile(null);
        setKavlingSertifikatFile(null);
      } else {
        await kavlingHousing.update(editingKavling.id, kavlingForm as any);
      }
      setShowKavlingModal(false);
      setEditingKavling(null);
      await kavlingHousing.refetch();
    } catch {
      // hook already handles toast
    } finally {
      setIsSavingKavling(false);
    }
  };

  // ── Refresh kavling when switching tabs ─────────────────────
  useEffect(() => {
    if (detailTab === 'kavling' && selectedProjectId) {
      kavlingHousing.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailTab, selectedProjectId]);

  // Sync missing housing_units when entering "Kavling & Unit"
  useEffect(() => {
    if (detailTab !== 'kavling') return;
    if (!selectedProjectId) return;
    void ensureHousingUnitsForProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailTab, selectedProjectId, projectUnits.length]);

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

  if (masterSection === 'qc-templates') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {ConfirmDialog}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template QC</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola checklist Quality Control untuk inspeksi unit.</p>
          </div>
        </div>
        <QCTemplateManager
          templates={qcTemplates}
          onCreate={qcCreateTemplate}
          onUpdate={qcUpdateTemplate}
          onDuplicate={qcDuplicateTemplate}
          onDelete={qcRemoveTemplate}
          onRefetch={qcRefetchTemplates}
          isLoading={qcTemplatesLoading}
          onClose={() => navigate('/data-master/projects')}
        />
      </div>
    );
  }

  if (masterSection === 'construction-statuses') {
    return <ConstructionStatusManagerPanel />;
  }

  // ── RENDER: Divisi/Departemen ────────────────────────────────
  if (masterSection === 'departments') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {ConfirmDialog}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl text-primary"><UsersRound size={20} /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Divisi / Departemen</h1>
              <p className="text-sm text-gray-500 mt-1">Master data divisi untuk digunakan pada form SOP.</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingDept(null); setDeptForm({ name: '', description: '' }); setShowDeptModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus size={16} /> Tambah Divisi
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200">
                <th className="py-3 px-5">Nama Divisi</th>
                <th className="py-3 px-5">Deskripsi</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-5 font-bold text-gray-900">{d.name}</td>
                  <td className="py-3 px-5 text-gray-500 text-sm">{d.description || '—'}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingDept({ id: d.id, name: d.name, description: d.description ?? '' }); setDeptForm({ name: d.name, description: d.description ?? '' }); setShowDeptModal(true); }} className="p-2 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors" title="Edit"><Edit2 size={15} className="text-gray-600" /></button>
                      <button onClick={() => handleDeleteDept(d.id, d.name)} className="p-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors" title="Hapus"><Trash2 size={15} className="text-red-600" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr><td colSpan={3} className="py-12 text-center text-sm text-gray-400">Belum ada data divisi. Tambahkan divisi baru.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Divisi */}
        {showDeptModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold">{editingDept ? 'Edit Divisi' : 'Tambah Divisi'}</h3>
                <button onClick={() => setShowDeptModal(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nama Divisi *</label>
                  <input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="contoh: Divisi Teknik" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Deskripsi</label>
                  <input value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Opsional" />
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowDeptModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Batal</button>
                <button onClick={handleSaveDept} disabled={isSavingDept} className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center gap-2">
                  {isSavingDept && <Loader2 size={16} className="animate-spin" />}
                  {isSavingDept ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER: Material ─────────────────────────────────────────
  if (masterSection === 'materials') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {ConfirmDialog}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl text-primary"><Package size={20} /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Master Material</h1>
              <p className="text-sm text-gray-500 mt-1">Master data material untuk digunakan pada form SOP/pengadaan.</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingMaterial(null); setMaterialForm({ name: '', unit: '', notes: '' }); setShowMaterialModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus size={16} /> Tambah Material
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200">
                <th className="py-3 px-5">Nama Material</th>
                <th className="py-3 px-5">Satuan</th>
                <th className="py-3 px-5">Catatan</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-5 font-bold text-gray-900">{m.name}</td>
                  <td className="py-3 px-5 text-gray-700">{m.unit}</td>
                  <td className="py-3 px-5 text-gray-500 text-sm">{m.notes || '—'}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingMaterial({ id: m.id, name: m.name, unit: m.unit, notes: m.notes ?? '' }); setMaterialForm({ name: m.name, unit: m.unit, notes: m.notes ?? '' }); setShowMaterialModal(true); }} className="p-2 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors" title="Edit"><Edit2 size={15} className="text-gray-600" /></button>
                      <button onClick={() => handleDeleteMaterial(m.id, m.name)} className="p-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors" title="Hapus"><Trash2 size={15} className="text-red-600" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr><td colSpan={4} className="py-12 text-center text-sm text-gray-400">Belum ada data material. Tambahkan material baru.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Material */}
        {showMaterialModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold">{editingMaterial ? 'Edit Material' : 'Tambah Material'}</h3>
                <button onClick={() => setShowMaterialModal(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nama Material *</label>
                  <input value={materialForm.name} onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="contoh: Besi Beton" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Satuan *</label>
                  <input value={materialForm.unit} onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="contoh: kg / m2 / buah" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Catatan</label>
                  <input value={materialForm.notes} onChange={(e) => setMaterialForm({ ...materialForm, notes: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Opsional" />
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowMaterialModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Batal</button>
                <button onClick={handleSaveMaterial} disabled={isSavingMaterial} className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center gap-2">
                  {isSavingMaterial && <Loader2 size={16} className="animate-spin" />}
                  {isSavingMaterial ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER: Skema Pembayaran ────────────────────────────────
  if (masterSection === 'payment-schemes') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {ConfirmDialog}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl text-primary"><Wallet size={20} /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Skema Pembayaran</h1>
              <p className="text-sm text-gray-500 mt-1">Master data skema pembayaran untuk digunakan di modul Finance.</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingPaymentScheme(null); setPaymentSchemeForm({ name: '', description: '' }); setShowPaymentSchemeModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus size={16} /> Tambah Skema
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200">
                <th className="py-3 px-5">Nama Skema</th>
                <th className="py-3 px-5">Deskripsi</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paymentSchemes.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-5 font-bold text-gray-900">{p.name}</td>
                  <td className="py-3 px-5 text-gray-500 text-sm">{p.description || '—'}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingPaymentScheme({ id: p.id, name: p.name, description: p.description ?? '' }); setPaymentSchemeForm({ name: p.name, description: p.description ?? '' }); setShowPaymentSchemeModal(true); }} className="p-2 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors" title="Edit"><Edit2 size={15} className="text-gray-600" /></button>
                      <button onClick={() => handleDeletePaymentScheme(p.id, p.name)} className="p-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors" title="Hapus"><Trash2 size={15} className="text-red-600" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paymentSchemes.length === 0 && (
                <tr><td colSpan={3} className="py-12 text-center text-sm text-gray-400">Belum ada data skema pembayaran. Tambahkan skema baru.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Skema Pembayaran */}
        {showPaymentSchemeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold">{editingPaymentScheme ? 'Edit Skema' : 'Tambah Skema'}</h3>
                <button onClick={() => setShowPaymentSchemeModal(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nama Skema *</label>
                  <input value={paymentSchemeForm.name} onChange={(e) => setPaymentSchemeForm({ ...paymentSchemeForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="contoh: Cash Keras / KPR Bank" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Deskripsi</label>
                  <input value={paymentSchemeForm.description} onChange={(e) => setPaymentSchemeForm({ ...paymentSchemeForm, description: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Opsional" />
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowPaymentSchemeModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Batal</button>
                <button onClick={handleSavePaymentScheme} disabled={isSavingPaymentScheme} className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center gap-2">
                  {isSavingPaymentScheme && <Loader2 size={16} className="animate-spin" />}
                  {isSavingPaymentScheme ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {ConfirmDialog}

      {/* ═══════════════════════════════════════════════════════
       *  VIEW 1: DAFTAR PROYEK
       * ═══════════════════════════════════════════════════════ */}
      {!selectedProjectId ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Building2 size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Data Master</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola proyek, unit konstruksi, dan detail kavling.</p>
              </div>
            </div>
            <button
              onClick={openCreateProject}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <Plus size={16} />
              Proyek Baru
            </button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Cari nama atau lokasi proyek..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((p) => {
              const unitCount = p.units?.length ?? p.units_count ?? 0;
              const progress = p.progress ?? 0;
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProjectId(p.id); setDetailTab('konstruksi'); }}
                  className="text-left bg-white rounded-2xl border border-gray-200 p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Home size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{p.name}</h3>
                        {p.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <MapPin size={12} />
                            {p.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors mt-1" />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                      <div className="text-lg font-bold text-gray-900">{unitCount}</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase">Unit</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                      <div className="text-lg font-bold text-gray-900">{progress}%</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase">Progress</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center flex items-center justify-center">
                      <ProjectStatusBadge status={p.status} />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300 mb-4">
                  <Building2 size={32} />
                </div>
                <p className="text-gray-500 font-medium">Belum ada proyek. Buat proyek baru untuk memulai.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ═══════════════════════════════════════════════════════
         *  VIEW 2: DETAIL PROYEK (DRILL-DOWN)
         * ═══════════════════════════════════════════════════════ */
        <>
          {/* Breadcrumb + back */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedProjectId(null)}
                className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-gray-600"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <span className="hover:text-primary cursor-pointer" onClick={() => setSelectedProjectId(null)}>Data Master</span>
                  <ChevronRight size={12} />
                  <span className="text-gray-700">{selectedProject?.name ?? 'Proyek'}</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 mt-0.5">{selectedProject?.name}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => selectedProject && openEditProject(selectedProject)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => selectedProjectId && handleDeleteProject(selectedProjectId)}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
                Hapus
              </button>
            </div>
          </div>

          {/* Project summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs font-bold text-gray-400 uppercase">Status</div>
              <div className={`mt-1 text-sm font-bold px-2.5 py-1 rounded-lg inline-block ${selectedProject?.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  selectedProject?.status === 'Delayed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                }`}>{selectedProject?.status}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs font-bold text-gray-400 uppercase">Jumlah Unit</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{projectUnits.length}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs font-bold text-gray-400 uppercase">Progress</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{selectedProject?.progress ?? 0}%</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs font-bold text-gray-400 uppercase">Deadline</div>
              <div className="mt-1 text-sm font-bold text-gray-900">
                {selectedProject?.deadline ? formatDateId(selectedProject.deadline) : '—'}
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${detailTab === 'konstruksi' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setDetailTab('konstruksi')}
            >
              <Layers size={16} />
              Unit Konstruksi
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${detailTab === 'kavling' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setDetailTab('kavling')}
            >
              <Home size={16} />
              Kavling &amp; Unit
            </button>
          </div>

          {/* ── Sub-tab: Unit Konstruksi ──── */}
          {detailTab === 'konstruksi' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-gray-900">Unit Konstruksi</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Daftar unit konstruksi dalam proyek ini</p>
                </div>
                <button
                  onClick={openCreateUnit}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  <Plus size={16} />
                  Tambah Unit
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200">
                      <th className="py-3 px-4">No Unit</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4">Status Konstruksi</th>
                      <th className="py-3 px-4">Progress</th>
                      <th className="py-3 px-4">QC</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectUnits.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">{u.no}</td>
                        <td className="py-3 px-4 text-gray-700">{u.tipe ?? '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${(u.progress ?? 0) >= 100 ? 'bg-green-100 text-green-700' :
                              (u.progress ?? 0) > 0 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-500'
                            }`}>
                            {u.status ?? 'Belum dimulai'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${u.progress ?? 0}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-600">{u.progress ?? 0}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${u.qc_status === 'Pass' ? 'bg-green-100 text-green-700' :
                              u.qc_status === 'Fail' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-500'
                            }`}>
                            {u.qc_status ?? 'Ongoing'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditUnit(u)}
                              className="p-2 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                              title="Edit unit"
                            >
                              <Edit2 size={16} className="text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteUnit(u.no)}
                              className="p-2 rounded-lg border border-red-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                              title="Hapus unit"
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {projectUnits.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                          Belum ada unit. Tambahkan unit baru di sini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Sub-tab: Kavling & Unit ──── */}
          {detailTab === 'kavling' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-gray-900">Kavling &amp; Unit</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Detail kavling — dimensi, harga, sertifikat, dll. Unit otomatis terbuat saat proyek dibuat.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200">
                      <th className="py-3 px-4">No. Kavling</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4 text-right">L. Tanah</th>
                      <th className="py-3 px-4 text-right">L. Bangunan</th>
                      <th className="py-3 px-4 text-right">Harga Jual</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kavlingHousing.units.map((unit) => {
                      const filled = (unit.luas_tanah != null && unit.harga_jual != null);
                      return (
                        <tr key={unit.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${!filled ? 'bg-amber-50/30' : ''}`}>
                          <td className="py-3 px-4 font-bold text-gray-900">{unit.unit_code}</td>
                          <td className="py-3 px-4 text-gray-700">{unit.unit_type ?? '-'}</td>
                          <td className="py-3 px-4 text-right text-gray-700">
                            {unit.luas_tanah != null ? `${unit.luas_tanah} m²` : <span className="text-gray-400 italic">—</span>}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700">
                            {unit.luas_bangunan != null ? `${unit.luas_bangunan} m²` : <span className="text-gray-400 italic">—</span>}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700">
                            {unit.harga_jual != null ? formatRupiah(unit.harga_jual) : <span className="text-gray-400 italic">—</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${unit.status === 'Tersedia' ? 'bg-green-100 text-green-700' :
                                unit.status === 'Proses' ? 'bg-yellow-100 text-yellow-700' :
                                  unit.status === 'Sold' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-500'
                              }`}>
                              {unit.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openEditKavling(unit)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
                            >
                              <Edit2 size={14} />
                              {filled ? 'Edit' : 'Lengkapi'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {kavlingHousing.units.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                          Belum ada data kavling. Data kavling otomatis terbuat saat unit dibuat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
       *  MODALS
       * ═══════════════════════════════════════════════════════ */}

      {/* Project Modal */}
      <Modal
        isOpen={showProjectModal}
        onClose={() => { setShowProjectModal(false); setEditingProject(null); }}
        title={editingProject ? 'Edit Proyek' : 'Buat Proyek Baru'}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nama Proyek *</label>
            <input
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Nama proyek"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Tipe</label>
              <select
                value={projectForm.type}
                onChange={(e) => setProjectForm({ ...projectForm, type: e.target.value as ProjectType })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="cluster">Cluster</option>
                <option value="standalone">Standalone</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
              <select
                value={projectForm.status}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as ProjectStatus })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="On Progress">On Progress</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Lokasi</label>
            <input
              value={projectForm.location}
              onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Lokasi proyek"
            />
          </div>

          {/* Unit auto-create — multi-blok: tiap baris = prefix + rentang nomor */}
          {!editingProject && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs font-bold text-primary uppercase">Auto-Create Unit (per blok)</p>
                <button
                  type="button"
                  onClick={() =>
                    setProjectForm((p) => ({
                      ...p,
                      unitBlocks: [...p.unitBlocks, { prefix: '', start: '1', end: '10' }],
                    }))
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <Plus size={14} />
                  Tambah blok
                </button>
              </div>
              <p className="text-xs text-gray-600">
                Contoh: Blok <span className="font-semibold">A</span> nomor 1–10, lalu Blok <span className="font-semibold">B</span> 1–10 → total 20 unit (A-01…A-10, B-01…B-10). Kosongkan semua prefix jika tidak ingin membuat unit sekarang.
              </p>
              <div className="space-y-2">
                {projectForm.unitBlocks.map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-end bg-white/80 border border-primary/10 rounded-lg p-2"
                  >
                    <div className="col-span-12 sm:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Prefix</label>
                      <input
                        value={row.prefix}
                        onChange={(e) => {
                          const next = [...projectForm.unitBlocks];
                          next[idx] = { ...next[idx], prefix: e.target.value };
                          setProjectForm({ ...projectForm, unitBlocks: next });
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="A"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">No. awal</label>
                      <input
                        type="number"
                        min={1}
                        value={row.start}
                        onChange={(e) => {
                          const next = [...projectForm.unitBlocks];
                          next[idx] = { ...next[idx], start: e.target.value };
                          setProjectForm({ ...projectForm, unitBlocks: next });
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">No. akhir</label>
                      <input
                        type="number"
                        min={1}
                        value={row.end}
                        onChange={(e) => {
                          const next = [...projectForm.unitBlocks];
                          next[idx] = { ...next[idx], end: e.target.value };
                          setProjectForm({ ...projectForm, unitBlocks: next });
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-3 flex justify-end pb-1">
                      {projectForm.unitBlocks.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setProjectForm((p) => ({
                              ...p,
                              unitBlocks: p.unitBlocks.filter((_, i) => i !== idx),
                            }))
                          }
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Hapus blok
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {totalUnitsFromBlockRows(projectForm.unitBlocks) > 0 && (
                <div className="text-xs text-gray-700 space-y-1">
                  <p>
                    <span className="font-bold text-primary">Total {totalUnitsFromBlockRows(projectForm.unitBlocks)} unit</span>
                    {' '}
                    akan dibuat.
                  </p>
                  <p className="text-gray-500 break-words">{previewUnitBlocks(projectForm.unitBlocks)}</p>
                </div>
              )}
            </div>
          )}

          {/* Read-only unit count on edit */}
          {editingProject && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Jumlah Unit (read-only)</label>
              <input
                type="number"
                value={projectUnits.length}
                disabled
                className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none text-gray-500 cursor-not-allowed"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Deadline</label>
            <input
                  type="date"
              value={projectForm.deadline}
              onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="YYYY-MM-DD"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Pagu Biaya (IDR)</label>
            <input
              type="number"
              min={0}
              value={projectForm.budget_cap}
              onChange={(e) => setProjectForm({ ...projectForm, budget_cap: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="contoh: 500000000"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Layout SVG (Peta Kawasan)</label>
            <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-all ${layoutSvgFile ? 'border-primary/50 bg-primary/5' : ''}`}>
              {layoutSvgFile ? (
                <div className="flex flex-col items-center gap-1">
                  <MapIcon size={24} className="text-primary" />
                  <span className="text-xs font-bold text-primary">{layoutSvgFile.name}</span>
                  <span className="text-[10px] text-gray-500">{(layoutSvgFile.size / 1024).toFixed(1)} KB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <MapIcon size={24} className="text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 font-bold">Klik untuk upload SVG</p>
                  <p className="text-[10px] text-gray-400">Format: .svg | Maks: 10MB</p>
                </div>
              )}
              <input
                type="file"
                accept=".svg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error('Ukuran file maksimal 10MB');
                      return;
                    }
                    const allowedTypes = ['image/svg+xml'];
                    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.svg')) {
                      toast.error('Hanya file SVG yang diizinkan');
                      return;
                    }
                    setLayoutSvgFile(file);
                  }
                  e.target.value = '';
                }}
              />
            </label>
            {layoutSvgFile && (
              <button
                type="button"
                onClick={() => setLayoutSvgFile(null)}
                className="text-xs text-red-600 font-bold hover:underline mt-1"
              >
                Hapus file
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleSaveProject}
              disabled={isSavingProject}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {isSavingProject && <Loader2 className="animate-spin" size={18} />}
              {isSavingProject ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              onClick={() => { setShowProjectModal(false); setEditingProject(null); }}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      {/* Unit Modal */}
      <Modal
        isOpen={showUnitModal}
        onClose={() => { setShowUnitModal(false); setEditingUnit(null); }}
        title={editingUnit ? `Edit Unit ${editingUnit.no}` : 'Tambah Unit'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">No. Unit *</label>
              <input
                value={unitForm.no}
                onChange={(e) => setUnitForm({ ...unitForm, no: e.target.value })}
                disabled={Boolean(editingUnit)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                placeholder="A-01"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Tipe *</label>
              <input
                value={unitForm.tipe}
                onChange={(e) => setUnitForm({ ...unitForm, tipe: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Tipe 36"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Status Konstruksi</label>
            <select
              value={unitForm.status}
              onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">- Pilih Status -</option>
              {constructionStatuses
                .slice()
                .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                .map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.progress}%)
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Template QC (opsional)</label>
            <select
              value={unitForm.qcTemplateId}
              onChange={(e) => setUnitForm({ ...unitForm, qcTemplateId: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">-- Tidak dipilih --</option>
              {qcTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSaveUnit}
            disabled={isSavingUnit}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {isSavingUnit && <Loader2 className="animate-spin" size={18} />}
            {isSavingUnit ? 'Menyimpan...' : editingUnit ? 'Simpan Perubahan' : 'Tambah Unit'}
          </button>
        </div>
      </Modal>

      {/* Kavling Edit Modal */}
      <Modal
        isOpen={showKavlingModal}
        onClose={() => {
          setShowKavlingModal(false);
          setEditingKavling(null);
          setKavlingPhotoFile(null);
          setKavlingSertifikatFile(null);
        }}
        title={`Detail Kavling ${editingKavling?.unit_code ?? ''}`}
        wide
      >
        <div className="space-y-6">
          {/* Read-only info */}
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-4"  >
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase">No. Kavling</div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">{editingKavling?.unit_code}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase">Tipe</div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">{editingKavling?.unit_type ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase">Status</div>
              <select
                value={kavlingForm.status ?? 'Tersedia'}
                onChange={(e) => setKavlingForm({ ...kavlingForm, status: e.target.value as any })}
                className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Tersedia">Tersedia</option>
                <option value="Proses">Proses</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
          </div>

          {/* Identitas */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Identitas</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">ID Rumah</label>
                <input
                  value={kavlingForm.id_rumah}
                  onChange={(e) => setKavlingForm({ ...kavlingForm, id_rumah: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">No. Sertifikat</label>
                <input
                  value={kavlingForm.no_sertifikat}
                  onChange={(e) => setKavlingForm({ ...kavlingForm, no_sertifikat: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Dimensi */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Dimensi (Meter)</h4>
            <div className="grid grid-cols-2 gap-4">
              {([
                ['Panjang Kanan', 'panjang_kanan'],
                ['Panjang Kiri', 'panjang_kiri'],
                ['Lebar Depan', 'lebar_depan'],
                ['Lebar Belakang', 'lebar_belakang'],
              ] as const).map(([label, key]) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={kavlingForm[key] ?? ''}
                    onChange={(e) => setKavlingForm({ ...kavlingForm, [key]: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Luas & Harga */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Luas &amp; Harga</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Luas Tanah (m²)</label>
                <input
                  type="number"
                  min={0}
                  value={kavlingForm.luas_tanah ?? ''}
                  onChange={(e) => setKavlingForm({ ...kavlingForm, luas_tanah: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Luas Bangunan (m²)</label>
                <input
                  type="number"
                  min={0}
                  value={kavlingForm.luas_bangunan ?? ''}
                  onChange={(e) => setKavlingForm({ ...kavlingForm, luas_bangunan: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Harga per Meter</label>
                <input
                  type="number"
                  min={0}
                  value={kavlingForm.harga_per_meter ?? ''}
                  onChange={(e) => setKavlingForm({ ...kavlingForm, harga_per_meter: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Harga Jual</label>
                <input
                  type="number"
                  min={0}
                  value={kavlingForm.harga_jual ?? ''}
                  onChange={(e) => setKavlingForm({ ...kavlingForm, harga_jual: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Lainnya */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Lainnya</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Daya Listrik (Watt)</label>
                <input
                  type="number"
                  min={0}
                  value={kavlingForm.daya_listrik ?? ''}
                  onChange={(e) => setKavlingForm({ ...kavlingForm, daya_listrik: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Catatan</label>
                <input
                  value={kavlingForm.notes}
                  onChange={(e) => setKavlingForm({ ...kavlingForm, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Catatan optional"
                />
              </div>
            </div>
          </div>

          {/* Foto Unit */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Foto Unit</h4>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setKavlingPhotoFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium"
            />
            <div className="flex flex-wrap items-center gap-4">
              {editingKavling?.photo_url && !kavlingPhotoFile && (
                <div className="w-28 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={`${import.meta.env.VITE_ASSET_URL ?? ''}${editingKavling.photo_url}`}
                    alt={`Foto unit ${editingKavling.unit_code}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {kavlingPhotoFile && (
                <div className="w-28 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={URL.createObjectURL(kavlingPhotoFile)}
                    alt="Preview foto"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* File Sertifikat */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">File Sertifikat</h4>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setKavlingSertifikatFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium"
            />
            <p className="text-xs text-gray-500">Format: PDF/JPG/JPEG/PNG (maks. 5MB)</p>
            <div className="text-sm">
              {kavlingSertifikatFile ? (
                <span className="text-primary font-medium">File dipilih: {kavlingSertifikatFile.name}</span>
              ) : editingKavling?.sertifikat_file_url ? (
                <a
                  href={`${import.meta.env.VITE_ASSET_URL ?? ''}${editingKavling.sertifikat_file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  Lihat file sertifikat saat ini
                </a>
              ) : (
                <span className="text-gray-400">Belum ada file sertifikat</span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveKavling}
              disabled={isSavingKavling}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {isSavingKavling && <Loader2 className="animate-spin" size={18} />}
              {isSavingKavling ? 'Menyimpan...' : 'Simpan Detail'}
            </button>
            <button
              onClick={() => {
                setShowKavlingModal(false);
                setEditingKavling(null);
                setKavlingPhotoFile(null);
                setKavlingSertifikatFile(null);
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
