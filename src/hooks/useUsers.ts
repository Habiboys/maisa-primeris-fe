/**
 * hooks/useUsers.ts
 * Hook untuk mengelola data user (admin, manager, karyawan)
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
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
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, total_pages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState<UserListParams | undefined>(initialParams);

  const fetchUsers = useCallback(async () => {
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

export function useActivityLogs() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
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
