/**
 * hooks/useUsers.ts
 * Hook untuk mengelola data user (admin, manager, karyawan)
 *
 * Cara pakai di komponen:
 *   const { users, isLoading, create, update, remove } = useUsers();
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { USE_MOCK_DATA } from '../lib/config';
import { mockActivityLogs, mockUsers } from '../lib/mockData';
import { getErrorMessage } from '../lib/utils';
import { userService } from '../services/user.service';
import type { ActivityLog, CreateUserPayload, UpdateUserPayload, User, UserListParams } from '../types';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export function useUsers(initialParams?: UserListParams) {
  const [users, setUsers] = useState<User[]>(USE_MOCK_DATA ? (mockUsers as unknown as User[]) : []);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: USE_MOCK_DATA ? mockUsers.length : 0, total_pages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState<UserListParams | undefined>(initialParams);

  const fetchUsers = useCallback(async () => {
    // ── Mode Mock: gunakan data dummy, skip API ──────────────
    if (USE_MOCK_DATA) {
      setUsers(mockUsers as unknown as User[]);
      setPagination({ page: 1, limit: 20, total: mockUsers.length, total_pages: 1 });
      return;
    }
    setIsLoading(true);
    try {
      const res = await userService.getAll(params);
      setUsers(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const create = async (payload: CreateUserPayload) => {
    if (USE_MOCK_DATA) {
      const newUser: User = { id: crypto.randomUUID(), ...payload, status: 'Aktif', last_login: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as unknown as User;
      setUsers(prev => [newUser, ...prev]);
      toast.success('User berhasil ditambahkan');
      return newUser;
    }
    try {
      const newUser = await userService.create(payload);
      toast.success('User berhasil ditambahkan');
      await fetchUsers();
      return newUser;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const update = async (id: string, payload: UpdateUserPayload) => {
    if (USE_MOCK_DATA) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...payload } : u));
      toast.success('User berhasil diperbarui');
      return users.find(u => u.id === id)!;
    }
    try {
      const updated = await userService.update(id, payload);
      toast.success('User berhasil diperbarui');
      await fetchUsers();
      return updated;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const toggleStatus = async (id: string) => {
    if (USE_MOCK_DATA) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'Aktif' ? 'Nonaktif' : 'Aktif' } : u));
      toast.success('Status user diperbarui');
      return users.find(u => u.id === id)!;
    }
    try {
      const updated = await userService.toggleStatus(id);
      toast.success('Status user diperbarui');
      await fetchUsers();
      return updated;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User berhasil dihapus');
      return;
    }
    try {
      await userService.remove(id);
      toast.success('User berhasil dihapus');
      await fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return {
    users,
    pagination,
    isLoading,
    refetch: fetchUsers,
    setParams,
    create,
    update,
    toggleStatus,
    remove,
  };
}
// ── Hook activity logs ────────────────────────────────────────────

export function useActivityLogs() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(
    USE_MOCK_DATA ? (mockActivityLogs as unknown as ActivityLog[]) : []
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setActivityLogs(mockActivityLogs as unknown as ActivityLog[]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await userService.getActivityLogs();
      setActivityLogs(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return { activityLogs, isLoading, refetch: fetchLogs };
}