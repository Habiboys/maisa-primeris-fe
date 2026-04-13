/**
 * hooks/useAttendance.ts
 * Hook untuk mengelola absensi, lokasi kerja, dan izin karyawan
 *
 * Cara pakai di komponen:
 *   const { attendances, isLoading, clockIn } = useAttendance();
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { attendanceService } from '../services/attendance.service';
import type { Attendance, AttendanceSetting, ClockInPayload, CreateLeaveRequestPayload, LeaveRequest, UserLocationAssignment, WorkLocation } from '../types';

// ── Hook pengaturan jam kerja ────────────────────────────────────

export function useAttendanceSettings() {
  const [settings, setSettings] = useState<AttendanceSetting | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getAttendanceSettings();
      setSettings(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const update = async (payload: Partial<AttendanceSetting>) => {
    try {
      const data = await attendanceService.updateAttendanceSettings(payload);
      setSettings(data);
      toast.success('Pengaturan jam kerja berhasil diperbarui');
      return data;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return { settings, isLoading, refetch: fetchSettings, update };
}

// ── Hook absensi ──────────────────────────────────────────────────

export function useAttendance(params?: { user_id?: string; date?: string }) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAttendances = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await attendanceService.getAll(params);
      setAttendances(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [params]);

  useEffect(() => { fetchAttendances(); }, [fetchAttendances]);

  const clockIn = async (payload: ClockInPayload) => {
    try {
      const a = await attendanceService.clockIn(payload);
      toast.success('Clock-in berhasil');
      await fetchAttendances();
      return a;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const clockOut = async (payload: ClockInPayload) => {
    try {
      const a = await attendanceService.clockOut(payload);
      toast.success('Clock-out berhasil');
      await fetchAttendances();
      return a;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { attendances, isLoading, refetch: fetchAttendances, clockIn, clockOut };
}

// ── Hook absensi pribadi (employee self-service) ──────────────────

export function useMyAttendance() {
  const [myAttendances, setMyAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMyAttendances = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getMy();
      setMyAttendances(data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchMyAttendances(); }, [fetchMyAttendances]);

  return { myAttendances, isLoading, refetch: fetchMyAttendances };
}

// ── Hook lokasi kerja ─────────────────────────────────────────────

export function useWorkLocations() {
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getWorkLocations();
      setLocations(data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const create = async (payload: Partial<WorkLocation>) => {
    try {
      const l = await attendanceService.createWorkLocation(payload);
      toast.success('Lokasi kerja berhasil ditambahkan');
      await fetchLocations();
      return l;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<WorkLocation>) => {
    try {
      const l = await attendanceService.updateWorkLocation(id, payload);
      toast.success('Lokasi kerja berhasil diperbarui');
      await fetchLocations();
      return l;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await attendanceService.removeWorkLocation(id);
      toast.success('Lokasi kerja berhasil dihapus');
      await fetchLocations();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { locations, isLoading, refetch: fetchLocations, create, update, remove };
}

// ── Hook assignment lokasi user ───────────────────────────────────

export function useLocationAssignments() {
  const [assignments, setAssignments] = useState<UserLocationAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getAssignments();
      setAssignments(data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const create = async (userId: string, workLocationId: string) => {
    try {
      const a = await attendanceService.createAssignment({ user_id: userId, work_location_id: workLocationId });
      toast.success('Penugasan berhasil ditambahkan');
      await fetchAssignments();
      return a;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await attendanceService.removeAssignment(id);
      toast.success('Penugasan berhasil dihapus');
      await fetchAssignments();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { assignments, isLoading, refetch: fetchAssignments, create, remove };
}

// ── Hook pengajuan izin ───────────────────────────────────────────

export function useLeaveRequests(scope: 'all' | 'my' = 'all') {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      if (scope === 'my') {
        const data = await attendanceService.getMyLeaveRequests();
        setLeaveRequests(data);
      } else {
        const res = await attendanceService.getLeaveRequests({ limit: 200 });
        setLeaveRequests(res.data);
      }
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [scope]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const create = async (payload: CreateLeaveRequestPayload) => {
    try {
      const r = await attendanceService.createLeaveRequest(payload);
      toast.success('Pengajuan izin berhasil dikirim');
      await fetchRequests();
      return r;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const approve = async (id: string) => {
    try {
      await attendanceService.approveLeaveRequest(id);
      toast.success('Izin disetujui');
      await fetchRequests();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const reject = async (id: string) => {
    try {
      await attendanceService.rejectLeaveRequest(id);
      toast.success('Izin ditolak');
      await fetchRequests();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await attendanceService.removeLeaveRequest(id);
      toast.success('Pengajuan berhasil dihapus');
      await fetchRequests();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { leaveRequests, isLoading, refetch: fetchRequests, create, approve, reject, remove };
}

// ── Hook rekap bulanan (SA view) ──────────────────────────────────

export interface AttendanceRecapEntry {
  name: string;
  present: number;
  late: number;
  cuti: number;
  permit: number;
  alpha: number;
  score: number;
}

export function useAttendanceRecap(month: number, year: number) {
  const [rawData, setRawData] = useState<Attendance[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const monthStr = String(month).padStart(2, '0');
      const lastDayInMonth = new Date(year, month, 0).getDate();
      const [attRes, leaveRes] = await Promise.all([
        attendanceService.getAll({ month, year, limit: 500 }),
        attendanceService.getLeaveRequests({
          status: 'Disetujui',
          type: 'Cuti',
          start_date: `${year}-${monthStr}-01`,
          end_date: `${year}-${monthStr}-${String(lastDayInMonth).padStart(2, '0')}`,
          limit: 500,
        }),
      ]);
      setRawData(attRes.data);
      setLeaveData(leaveRes.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const recap = useMemo<AttendanceRecapEntry[]>(() => {
    const map = new Map<string, { name: string; present: number; late: number; cuti: number; permit: number; alpha: number }>();
    for (const a of rawData) {
      const key  = a.user_id;
      const name = a.user?.name ?? 'Unknown';
      if (!map.has(key)) map.set(key, { name, present: 0, late: 0, cuti: 0, permit: 0, alpha: 0 });
      const entry = map.get(key)!;
      if (a.status === 'Hadir')              entry.present++;
      else if (a.status === 'Terlambat')     { entry.present++; entry.late++; }
      else if (a.status === 'Izin' || a.status === 'Sakit') entry.permit++;
      else if (a.status === 'Alpha')         entry.alpha++;
    }

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    for (const req of leaveData) {
      const key = req.user_id;
      const name = req.user?.name ?? 'Unknown';
      if (!map.has(key)) map.set(key, { name, present: 0, late: 0, cuti: 0, permit: 0, alpha: 0 });
      const entry = map.get(key)!;

      const reqStart = new Date(req.start_date);
      const reqEnd = new Date(req.end_date || req.start_date);
      const overlapStart = reqStart > monthStart ? reqStart : monthStart;
      const overlapEnd = reqEnd < monthEnd ? reqEnd : monthEnd;
      if (overlapStart <= overlapEnd) {
        const diff = Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        entry.cuti += diff;
      }
    }

    return Array.from(map.values()).map(e => {
      const total = e.present + e.cuti + e.permit + e.alpha;
      const score = total > 0 ? Math.round((e.present / total) * 100) : 100;
      return { ...e, score };
    }).sort((a, b) => b.score - a.score);
  }, [rawData, leaveData, month, year]);

  return { recap, isLoading, refetch: fetchData };
}
