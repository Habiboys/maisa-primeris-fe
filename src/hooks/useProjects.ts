/**
 * hooks/useProjects.ts
 * Hook untuk mengelola data proyek, unit, status konstruksi, time schedule, dll.
 *
 * Mendukung mode USE_MOCK_DATA dan mode API.
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { USE_MOCK_DATA } from '../lib/config';
import {
    mockConstructionProjects,
    type ConstructionStatus as MockCS,
    type Project as MockProject,
    type ProjectUnit as MockUnit,
} from '../lib/mockConstruction';
import { getErrorMessage } from '../lib/utils';
import { projectService } from '../services/project.service';
import type {
    Project as ApiProject,
    ProjectUnit as ApiProjectUnit,
    ConstructionStatus,
    InventoryLog,
    PaginatedResponse,
    TimeScheduleItem,
    WorkLog,
} from '../types';

/* ── Mock → API mappers ─────────────────────────────────────────── */

function mapMockUnitToApi(unit: MockUnit, projectId: string): ApiProjectUnit {
  return {
    id: `${projectId}-${unit.no}`,
    project_id: projectId,
    no: unit.no,
    tipe: unit.tipe,
    progress: unit.progress,
    status: unit.status,
    qc_status: unit.qcStatus,
    qc_readiness: unit.qcReadiness ?? 0,
    qc_template_id: unit.qcTemplateId,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-02-01').toISOString(),
  } as ApiProjectUnit;
}

function mapMockProjectToApi(project: MockProject): ApiProject {
  return {
    id: String(project.id),
    name: project.name,
    type: project.type,
    location: project.location ?? '-',
    units_count: project.unitsCount,
    progress: project.progress,
    status: project.status,
    deadline: project.deadline,
    lead: project.lead,
    qc_template_id: project.qcTemplateId,
    construction_status: project.constructionStatus,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-02-01').toISOString(),
    units: project.units.map((u) => mapMockUnitToApi(u, project.id)),
  } as ApiProject;
}

function mapMockCSToApi(cs: MockCS): ConstructionStatus {
  return {
    id: cs.id,
    name: cs.name,
    progress: cs.progress,
    color: cs.color,
    order_index: cs.order,
  };
}

/* ── Mock construction statuses ─────────────────────────────────── */

const mockStatuses: MockCS[] = [
  { id: 'cs-1', name: 'Belum Mulai', progress: 0, color: '#94a3b8', order: 1 },
  { id: 'cs-2', name: 'Persiapan Lahan', progress: 5, color: '#94a3b8', order: 2 },
  { id: 'cs-3', name: 'Pondasi', progress: 20, color: '#f97316', order: 3 },
  { id: 'cs-4', name: 'Struktur', progress: 40, color: '#eab308', order: 4 },
  { id: 'cs-5', name: 'Dinding & Plester', progress: 55, color: '#3b82f6', order: 5 },
  { id: 'cs-6', name: 'Atap', progress: 65, color: '#8b5cf6', order: 6 },
  { id: 'cs-7', name: 'Instalasi MEP', progress: 80, color: '#06b6d4', order: 7 },
  { id: 'cs-8', name: 'Finishing', progress: 95, color: '#10b981', order: 8 },
  { id: 'cs-9', name: 'Serah Terima', progress: 100, color: '#22c55e', order: 9 },
];

/* ═══════════════════════════════════════════════════════════════════
 *  useProjects — CRUD projects
 * ═══════════════════════════════════════════════════════════════════ */

export function useProjects() {
  const [projects, setProjects] = useState<ApiProject[]>(
    USE_MOCK_DATA ? mockConstructionProjects.map(mapMockProjectToApi) : [],
  );
  const [pagination, setPagination] = useState<PaginatedResponse<ApiProject>['pagination'] | null>(
    USE_MOCK_DATA
      ? { page: 1, limit: mockConstructionProjects.length, total: mockConstructionProjects.length, total_pages: 1 }
      : null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (USE_MOCK_DATA) {
      const data = mockConstructionProjects.map(mapMockProjectToApi);
      setProjects(data);
      setPagination({ page: 1, limit: data.length, total: data.length, total_pages: 1 });
      return;
    }

    setIsLoading(true);
    try {
      const res = await projectService.getAll();
      setProjects(res.data);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const create = async (payload: Partial<ApiProject>) => {
    if (USE_MOCK_DATA) {
      const newProject: ApiProject = {
        id: crypto.randomUUID(),
        name: payload.name ?? 'Proyek Mock',
        type: payload.type ?? 'cluster',
        location: payload.location ?? '-',
        units_count: Number(payload.units_count ?? 0),
        progress: payload.progress ?? 0,
        status: payload.status ?? 'On Progress',
        deadline: payload.deadline ?? '',
        lead: payload.lead ?? '',
        qc_template_id: payload.qc_template_id,
        construction_status: payload.construction_status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        units: [],
      } as ApiProject;
      setProjects((prev) => [newProject, ...prev]);
      toast.success('Proyek (mock) berhasil ditambahkan');
      return newProject;
    }

    try {
      const newProject = await projectService.create(payload);
      toast.success('Proyek berhasil ditambahkan');
      await fetchProjects();
      return newProject;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const update = async (id: string, payload: Partial<ApiProject>) => {
    if (USE_MOCK_DATA) {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...payload, updated_at: new Date().toISOString() } : p)),
      );
      toast.success('Proyek (mock) berhasil diperbarui');
      return projects.find((p) => p.id === id) ?? null;
    }

    try {
      const updated = await projectService.update(id, payload);
      toast.success('Proyek berhasil diperbarui');
      await fetchProjects();
      return updated;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success('Proyek (mock) dihapus');
      return;
    }

    try {
      await projectService.remove(id);
      toast.success('Proyek berhasil dihapus');
      await fetchProjects();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return { projects, pagination, isLoading, refetch: fetchProjects, create, update, remove };
}

/* ═══════════════════════════════════════════════════════════════════
 *  useProjectUnits — CRUD units untuk satu project
 * ═══════════════════════════════════════════════════════════════════ */

export function useProjectUnits(projectId: string) {
  const [units, setUnits] = useState<ApiProjectUnit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnits = useCallback(async () => {
    if (!projectId) return;

    if (USE_MOCK_DATA) {
      const proj = mockConstructionProjects.find((p) => p.id === projectId);
      setUnits(proj ? proj.units.map((u) => mapMockUnitToApi(u, projectId)) : []);
      return;
    }

    setIsLoading(true);
    try {
      const res = await projectService.getUnits(projectId);
      setUnits(res);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const create = async (payload: Partial<ApiProjectUnit>) => {
    if (USE_MOCK_DATA) {
      const newUnit: ApiProjectUnit = {
        id: crypto.randomUUID(),
        project_id: projectId,
        no: payload.no ?? '',
        tipe: payload.tipe,
        progress: payload.progress ?? 0,
        status: payload.status ?? 'Belum Mulai',
        qc_status: payload.qc_status ?? 'Ongoing',
        qc_readiness: payload.qc_readiness ?? 0,
        qc_template_id: payload.qc_template_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ApiProjectUnit;
      setUnits((prev) => [...prev, newUnit]);
      toast.success(`Unit ${payload.no} (mock) ditambahkan`);
      return newUnit;
    }

    try {
      const created = await projectService.createUnit(projectId, payload);
      toast.success(`Unit ${payload.no} berhasil ditambahkan`);
      await fetchUnits();
      return created;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const update = async (unitNo: string, payload: Partial<ApiProjectUnit>) => {
    if (USE_MOCK_DATA) {
      setUnits((prev) =>
        prev.map((u) => (u.no === unitNo ? { ...u, ...payload, updated_at: new Date().toISOString() } : u)),
      );
      toast.success(`Unit ${unitNo} (mock) diperbarui`);
      return;
    }

    try {
      await projectService.updateUnit(projectId, unitNo, payload);
      toast.success(`Unit ${unitNo} berhasil diperbarui`);
      await fetchUnits();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const remove = async (unitNo: string) => {
    if (USE_MOCK_DATA) {
      setUnits((prev) => prev.filter((u) => u.no !== unitNo));
      toast.success(`Unit ${unitNo} (mock) dihapus`);
      return;
    }

    try {
      await projectService.removeUnit(projectId, unitNo);
      toast.success(`Unit ${unitNo} berhasil dihapus`);
      await fetchUnits();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return { units, isLoading, refetch: fetchUnits, create, update, remove };
}

/* ═══════════════════════════════════════════════════════════════════
 *  useConstructionStatuses — CRUD master status konstruksi
 * ═══════════════════════════════════════════════════════════════════ */

export function useConstructionStatuses() {
  const [statuses, setStatuses] = useState<ConstructionStatus[]>(
    USE_MOCK_DATA ? mockStatuses.map(mapMockCSToApi) : [],
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatuses = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setStatuses(mockStatuses.map(mapMockCSToApi));
      return;
    }

    setIsLoading(true);
    try {
      const data = await projectService.getConstructionStatuses();
      setStatuses(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const create = async (payload: Partial<ConstructionStatus>) => {
    if (USE_MOCK_DATA) {
      const newStatus: ConstructionStatus = {
        id: `cs-${Date.now()}`,
        name: payload.name ?? '',
        progress: payload.progress ?? 0,
        color: payload.color ?? '#3b82f6',
        order_index: payload.order_index ?? statuses.length + 1,
      };
      setStatuses((prev) => [...prev, newStatus].sort((a, b) => a.order_index - b.order_index));
      toast.success('Status konstruksi (mock) ditambahkan');
      return newStatus;
    }

    try {
      const newStatus = await projectService.createConstructionStatus(payload);
      toast.success('Status konstruksi ditambahkan');
      await fetchStatuses();
      return newStatus;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const update = async (id: string, payload: Partial<ConstructionStatus>) => {
    if (USE_MOCK_DATA) {
      setStatuses((prev) =>
        prev
          .map((s) => (s.id === id ? { ...s, ...payload } : s))
          .sort((a, b) => a.order_index - b.order_index),
      );
      toast.success('Status konstruksi (mock) diperbarui');
      return;
    }

    try {
      await projectService.updateConstructionStatus(id, payload);
      toast.success('Status konstruksi diperbarui');
      await fetchStatuses();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setStatuses((prev) => prev.filter((s) => s.id !== id));
      toast.success('Status konstruksi (mock) dihapus');
      return;
    }

    try {
      await projectService.removeConstructionStatus(id);
      toast.success('Status konstruksi dihapus');
      await fetchStatuses();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return { statuses, isLoading, refetch: fetchStatuses, create, update, remove };
}

/* ═══════════════════════════════════════════════════════════════════
 *  useTimeSchedule
 * ═══════════════════════════════════════════════════════════════════ */

export function useTimeSchedule(projectId: string, unitNo?: string) {
  const [items, setItems] = useState<TimeScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) return;

    if (USE_MOCK_DATA) {
      // Mock: time schedules are embedded differently — return empty
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await projectService.getTimeSchedule(projectId, unitNo);
      setItems(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, unitNo]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { items, isLoading, refetch: fetch };
}

/* ═══════════════════════════════════════════════════════════════════
 *  useWorkLogs
 * ═══════════════════════════════════════════════════════════════════ */

export function useWorkLogs(projectId: string, params?: { unit_no?: string }) {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) return;

    if (USE_MOCK_DATA) {
      setLogs([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await projectService.getWorkLogs(projectId, params);
      setLogs(res);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, params?.unit_no]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = async (formData: FormData) => {
    if (USE_MOCK_DATA) {
      toast.success('Work log (mock) ditambahkan');
      return;
    }

    try {
      await projectService.createWorkLog(projectId, formData);
      toast.success('Laporan harian berhasil disimpan');
      await fetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const update = async (logId: string, payload: Partial<WorkLog>) => {
    if (USE_MOCK_DATA) {
      setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, ...payload } : l)));
      toast.success('Work log (mock) diperbarui');
      return;
    }

    try {
      await projectService.updateWorkLog(projectId, logId, payload);
      toast.success('Laporan harian berhasil diperbarui');
      await fetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return { logs, isLoading, refetch: fetch, create, update };
}

/* ═══════════════════════════════════════════════════════════════════
 *  useInventoryLogs
 * ═══════════════════════════════════════════════════════════════════ */

export function useInventoryLogs(projectId: string) {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) return;

    if (USE_MOCK_DATA) {
      setLogs([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await projectService.getInventoryLogs(projectId);
      setLogs(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = async (payload: Partial<InventoryLog>) => {
    if (USE_MOCK_DATA) {
      const newLog: InventoryLog = {
        id: crypto.randomUUID(),
        project_id: projectId,
        unit_no: payload.unit_no,
        date: payload.date ?? new Date().toISOString().slice(0, 10),
        item: payload.item ?? '',
        qty: payload.qty ?? 0,
        unit_satuan: payload.unit_satuan,
        type: payload.type ?? 'in',
        person: payload.person,
        created_at: new Date().toISOString(),
      };
      setLogs((prev) => [newLog, ...prev]);
      toast.success('Mutasi (mock) dicatat');
      return newLog;
    }

    try {
      const created = await projectService.createInventoryLog(projectId, payload);
      toast.success('Mutasi barang berhasil dicatat');
      await fetch();
      return created;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return { logs, isLoading, refetch: fetch, create };
}
