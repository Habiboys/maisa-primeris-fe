import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { companyService } from '../services';
import type { Company, CompanyPayload, CompanySettingsPayload } from '../types';

export function useCompanies(params?: { search?: string; is_active?: boolean }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await companyService.getAll(params);
      setCompanies(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const create = async (payload: CompanyPayload) => {
    try {
      const res = await companyService.create(payload);
      toast.success('Perusahaan berhasil dibuat');
      if (res.provisioning?.default_admin) {
        const admin = res.provisioning.default_admin;
        toast.info(`Akun tenant dibuat: ${admin.email} / ${admin.password}`);
      }
      await fetchCompanies();
      return res;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const update = async (id: string, payload: CompanyPayload) => {
    try {
      const res = await companyService.update(id, payload);
      toast.success('Perusahaan berhasil diperbarui');
      await fetchCompanies();
      return res;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await companyService.remove(id);
      toast.success('Perusahaan berhasil dihapus');
      await fetchCompanies();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const reset = async (id?: string) => {
    try {
      const res = id 
        ? await companyService.resetTenant(id) 
        : await companyService.resetMyTenant();
      toast.success('Data perusahaan berhasil di-reset');
      // Only re-fetch if not super admin resetting their own (causes 403 otherwise)
      if (id) {
        await fetchCompanies();
      }
      return res;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return {
    companies,
    isLoading,
    refetch: fetchCompanies,
    create,
    update,
    remove,
    reset,
  };
}

export function useCompany(id: string | undefined, enabled = true) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompany = useCallback(async () => {
    if (!id || !enabled) {
      setCompany(null);
      return;
    }
    setIsLoading(true);
    try {
      const data = await companyService.getById(id);
      setCompany(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setCompany(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, enabled]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return { company, isLoading, refetch: fetchCompany };
}

export function useCompanyBranding(options?: { companyId?: string; enabled?: boolean }) {
  const companyId = options?.companyId;
  const enabled = options?.enabled ?? true;
  const [settings, setSettings] = useState<Company['settings'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!enabled) {
      setSettings(null);
      return;
    }

    setIsLoading(true);
    try {
      const data = companyId
        ? await companyService.getSettingsByCompany(companyId)
        : await companyService.getMySettings();
      setSettings(data ?? null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [companyId, enabled]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const update = async (payload: CompanySettingsPayload, logo?: File | null, favicon?: File | null) => {
    try {
      const data = logo
        ? companyId
          ? await companyService.updateSettingsByCompanyWithLogo(companyId, payload, logo, favicon)
          : await companyService.updateMySettingsWithLogo(payload, logo, favicon)
        : companyId
          ? await companyService.updateSettingsByCompany(companyId, payload)
          : await companyService.updateMySettings(payload);
      setSettings(data ?? null);
      toast.success('Branding berhasil diperbarui');
      return data;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return {
    settings,
    isLoading,
    refetch: fetchSettings,
    update,
  };
}
