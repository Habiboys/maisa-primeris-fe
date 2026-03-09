/**
 * hooks/useAttendance.ts
 * Hook untuk mengelola absensi, lokasi kerja, dan izin karyawan
 *
 * Cara pakai di komponen:
 *   const { attendances, isLoading, clockIn } = useAttendance();
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { USE_MOCK_DATA } from '../lib/config';
import { mockUserLocationAssignments as mockAssignments, mockAttendances, mockLeaveRequests as mockLeaves, mockWorkLocations as mockLocs } from '../lib/mockAttendance';
import { getErrorMessage } from '../lib/utils';
import { attendanceService } from '../services/attendance.service';
import type { Attendance, ClockInPayload, CreateLeaveRequestPayload, LeaveRequest, UserLocationAssignment, WorkLocation } from '../types';

// ── Hook absensi ──────────────────────────────────────────────────

export function useAttendance(params?: { user_id?: string; date?: string }) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAttendances = useCallback(async () => {
    if (USE_MOCK_DATA) { setAttendances(mockAttendances); return; }
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

// ── Hook lokasi kerja ─────────────────────────────────────────────

export function useWorkLocations() {
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    if (USE_MOCK_DATA) { setLocations(mockLocs); return; }
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
    if (USE_MOCK_DATA) { setAssignments(mockAssignments); return; }
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

export function useLeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (USE_MOCK_DATA) { setLeaveRequests(mockLeaves); return; }
    setIsLoading(true);
    try {
      const res = await attendanceService.getLeaveRequests();
      setLeaveRequests(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

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
