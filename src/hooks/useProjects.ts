/**
 * hooks/useProjects.ts
 * Hook untuk mengelola data proyek, unit, status konstruksi, time schedule, dll.
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { projectService } from '../services/project.service';
import type {
  Project as ApiProject,
  ProjectUnit as ApiProjectUnit,
  ConstructionStatus,
  InventoryLog,
  PaginatedResponse,
  TimeScheduleItem,
  UnitBlockRange,
  WorkLog,
} from '../types';

/* ═══════════════════════════════════════════════════════════════════
 *  useProjects — CRUD projects
 * ═══════════════════════════════════════════════════════════════════ */

export function useProjects() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<ApiProject>['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
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
    try {
      await projectService.removeUnit(projectId, unitNo);
      toast.success(`Unit ${unitNo} berhasil dihapus`);
      await fetchUnits();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const bulkCreate = async (
    payload: ({ blocks: UnitBlockRange[] } | { count: number; prefix: string }) & { tipe?: string },
  ) => {
    try {
      const created = await projectService.bulkCreateUnits(projectId, payload);
      toast.success(`${created.length} unit berhasil dibuat`);
      await fetchUnits();
      return created;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return { units, isLoading, refetch: fetchUnits, create, update, remove, bulkCreate };
}

/* ═══════════════════════════════════════════════════════════════════
 *  useConstructionStatuses — CRUD master status konstruksi
 * ═══════════════════════════════════════════════════════════════════ */

export function useConstructionStatuses() {
  const [statuses, setStatuses] = useState<ConstructionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatuses = useCallback(async () => {
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
