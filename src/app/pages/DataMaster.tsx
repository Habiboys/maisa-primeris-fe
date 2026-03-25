import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Edit2,
  Home,
  Layers,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog, useConstructionStatuses, useHousingUnits, useProjects, useProjectUnits, useQCTemplates } from '../../hooks';
import { formatRupiah } from '../../lib/utils';
import { housingService } from '../../services';
import type { HousingUnit, Project, ProjectStatus, ProjectType, ProjectUnit } from '../../types';

/* ──────────────────────────────────────────────────────────────
 *  Modal Component
 * ────────────────────────────────────────────────────────────── */
function Modal({
  isOpen,
  onClose,
  title,
  children,
  wide,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} shadow-2xl overflow-hidden text-left max-h-[90vh] overflow-y-auto`}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 *  Main DataMaster Component
 * ────────────────────────────────────────────────────────────── */
export function DataMaster() {
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
  const { templates: qcTemplates } = useQCTemplates();
  const { showConfirm, ConfirmDialog } = useConfirmDialog();

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
    units_count: 0,
    unit_prefix: '',
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
      units_count: 0,
      unit_prefix: '',
      deadline: '',
      status: 'On Progress',
    });
    setShowProjectModal(true);
  };

  const openEditProject = (p: Project) => {
    setEditingProject(p);
    setProjectForm({
      name: p.name,
      type: p.type,
      location: p.location ?? '',
      units_count: p.units_count ?? 0,
      unit_prefix: '',
      deadline: toDateInputValue(p.deadline),
      status: p.status,
    });
    setShowProjectModal(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.name || !projectForm.type) {
      toast.error('Nama dan tipe proyek wajib diisi');
      return;
    }
    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: projectForm.name,
          type: projectForm.type,
          location: projectForm.location || null,
          deadline: projectForm.deadline || null,
          status: projectForm.status,
        } as Partial<Project>);
      } else {
        if (projectForm.units_count > 0 && !projectForm.unit_prefix) {
          toast.error('Prefix unit wajib diisi jika units_count > 0');
          return;
        }
        const created = await createProject({
          name: projectForm.name,
          type: projectForm.type,
          location: projectForm.location || null,
          units_count: Number(projectForm.units_count) || 0,
          unit_prefix: projectForm.unit_prefix || undefined,
          deadline: projectForm.deadline || null,
          status: projectForm.status,
        } as Partial<Project>);
        setSelectedProjectId(created.id);
      }
      setShowProjectModal(false);
      setEditingProject(null);
      await refetchProjects();
      await refetchUnits();
    } catch {
      // hook already handles toast
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
    setUnitForm({
      no: u.no,
      tipe: u.tipe ?? '',
      status: u.status ?? constructionStatuses[0]?.name ?? '',
      qcTemplateId: u.qc_template_id ?? '',
    });
    setShowUnitModal(true);
  };

  const handleSaveUnit = async () => {
    if (!selectedProjectId) return;
    if (!unitForm.no || !unitForm.tipe || !unitForm.status) {
      toast.error('No Unit, Tipe, dan Status wajib diisi');
      return;
    }
    const progress = getProgressFromStatus(unitForm.status);
    const payload = {
      no: unitForm.no,
      tipe: unitForm.tipe,
      status: unitForm.status,
      progress,
      qc_template_id: unitForm.qcTemplateId || undefined,
    } as Partial<ProjectUnit>;
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
    setShowKavlingModal(true);
  };

  const handleSaveKavling = async () => {
    if (!editingKavling) return;
    try {
      if (kavlingPhotoFile) {
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
        fd.append('photo', kavlingPhotoFile);

        await kavlingHousing.update(editingKavling.id, fd as any);
        setKavlingPhotoFile(null);
      } else {
        await kavlingHousing.update(editingKavling.id, kavlingForm as any);
      }
      setShowKavlingModal(false);
      setEditingKavling(null);
      await kavlingHousing.refetch();
    } catch {
      // hook already handles toast
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
                    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                      <div className={`text-xs font-bold px-2 py-1 rounded-lg inline-block ${p.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          p.status === 'Delayed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>{p.status}</div>
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
              <div className="mt-1 text-sm font-bold text-gray-900">{selectedProject?.deadline || '—'}</div>
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

          {/* Unit auto-create — only on create, not edit */}
          {!editingProject && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-primary uppercase">Auto-Create Unit</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Jumlah Unit</label>
                  <input
                    type="number"
                    min={0}
                    value={projectForm.units_count}
                    onChange={(e) => setProjectForm({ ...projectForm, units_count: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Prefix Unit *</label>
                  <input
                    value={projectForm.unit_prefix}
                    onChange={(e) => setProjectForm({ ...projectForm, unit_prefix: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Contoh: A, B, BLOK-C"
                  />
                </div>
              </div>
              {projectForm.units_count > 0 && projectForm.unit_prefix && (
                <p className="text-xs text-gray-500">
                  Akan membuat unit: <span className="font-bold text-gray-700">{projectForm.unit_prefix}-01</span> s/d <span className="font-bold text-gray-700">{projectForm.unit_prefix}-{String(projectForm.units_count).padStart(2, '0')}</span>
                </p>
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

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSaveProject}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Simpan
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
            <label className="text-xs font-bold text-gray-500 uppercase">Status Konstruksi *</label>
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
            onClick={handleSaveUnit}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            {editingUnit ? 'Simpan Perubahan' : 'Tambah Unit'}
          </button>
        </div>
      </Modal>

      {/* Kavling Edit Modal */}
      <Modal
        isOpen={showKavlingModal}
        onClose={() => { setShowKavlingModal(false); setEditingKavling(null); }}
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

          <div className="flex gap-2">
            <button
              onClick={handleSaveKavling}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Simpan Detail
            </button>
            <button
              onClick={() => { setShowKavlingModal(false); setEditingKavling(null); }}
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
