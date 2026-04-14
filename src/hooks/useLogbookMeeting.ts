import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { logbookService, meetingNoteService } from '../services';
import type {
    CreateLogbookPayload,
    CreateMeetingNotePayload,
    JobCategory,
    Logbook,
    LogbookListParams,
    MeetingNote,
    MeetingNoteListParams,
    UpdateLogbookPayload,
    UpdateMeetingNotePayload,
} from '../types';

export function useJobCategories() {
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await logbookService.getJobCategories();
      setCategories(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { categories, isLoading, refetch: fetch };
}

export function useLogbooks(initialParams?: LogbookListParams) {
  const [items, setItems] = useState<Logbook[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; total_pages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState<LogbookListParams | undefined>(initialParams);

  useEffect(() => {
    if (initialParams !== undefined) setParams(initialParams);
  }, [initialParams?.search, initialParams?.page, initialParams?.limit, initialParams?.status, initialParams?.job_category_id]);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await logbookService.getLogbooks(params);
      setItems(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = async (payload: CreateLogbookPayload) => {
    try {
      const row = await logbookService.createLogbook(payload);
      toast.success('Logbook berhasil ditambahkan');
      await fetch();
      return row;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const update = async (id: string, payload: UpdateLogbookPayload) => {
    try {
      const row = await logbookService.updateLogbook(id, payload);
      toast.success('Logbook berhasil diperbarui');
      await fetch();
      return row;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await logbookService.deleteLogbook(id);
      toast.success('Logbook berhasil dihapus');
      await fetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const addFiles = async (id: string, files: File[]) => {
    try {
      await logbookService.addFiles(id, files);
      toast.success('File berhasil ditambahkan');
      await fetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const removeFile = async (id: string, fileId: string) => {
    try {
      await logbookService.deleteFile(id, fileId);
      toast.success('File berhasil dihapus');
      await fetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return {
    items,
    pagination,
    isLoading,
    params,
    setParams,
    refetch: fetch,
    create,
    update,
    remove,
    addFiles,
    removeFile,
  };
}

export function useMeetingNotes(initialParams?: MeetingNoteListParams) {
  const [items, setItems] = useState<MeetingNote[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; total_pages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState<MeetingNoteListParams | undefined>(initialParams);

  useEffect(() => {
    if (initialParams !== undefined) setParams(initialParams);
  }, [initialParams?.search, initialParams?.page, initialParams?.limit, initialParams?.meeting_type]);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await meetingNoteService.getAll(params);
      setItems(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = async (payload: CreateMeetingNotePayload) => {
    try {
      const row = await meetingNoteService.create(payload);
      toast.success('Notulensi berhasil ditambahkan');
      await fetch();
      return row;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const update = async (id: string, payload: UpdateMeetingNotePayload) => {
    try {
      const row = await meetingNoteService.update(id, payload);
      toast.success('Notulensi berhasil diperbarui');
      await fetch();
      return row;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await meetingNoteService.remove(id);
      toast.success('Notulensi berhasil dihapus');
      await fetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const exportPdf = async (id: string, fileName = 'notulensi.pdf') => {
    try {
      const blob = await meetingNoteService.exportPdf(id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return {
    items,
    pagination,
    isLoading,
    params,
    setParams,
    refetch: fetch,
    create,
    update,
    remove,
    exportPdf,
  };
}

export function useLogbookDetail(id?: string) {
  const [item, setItem] = useState<Logbook | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await logbookService.getById(id);
      setItem(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { item, isLoading, refetch: fetch };
}

export function useMeetingNoteDetail(id?: string) {
  const [item, setItem] = useState<MeetingNote | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await meetingNoteService.getById(id);
      setItem(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { item, isLoading, refetch: fetch };
}
