import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { mediaService } from '../services';
import type { MediaAsset, MediaListParams, UploadMediaPayload } from '../types';

export function useMedia(initialParams?: MediaListParams) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; total_pages: number } | null>(null);
  const [params, setParams] = useState<MediaListParams | undefined>(initialParams);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialParams !== undefined) setParams(initialParams);
  }, [initialParams?.search, initialParams?.page, initialParams?.limit, initialParams?.category, initialParams?.type]);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await mediaService.getAll(params);
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

  const upload = async (payload: UploadMediaPayload) => {
    const promise = mediaService.upload(payload);
    toast.promise(promise, {
      loading: 'Mengupload file...',
      success: 'Media berhasil diupload',
      error: (err) => getErrorMessage(err),
    });
    const row = await promise;
    // Refresh list di background — tidak perlu di-await supaya upload terasa instan
    void fetch();
    return row;
  };

  const remove = async (id: string) => {
    try {
      await mediaService.remove(id);
      toast.success('Media berhasil dihapus');
      await fetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return {
    items,
    pagination,
    params,
    setParams,
    isLoading,
    refetch: fetch,
    upload,
    remove,
  };
}
