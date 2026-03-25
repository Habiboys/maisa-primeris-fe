/**
 * hooks/useMarketing.ts
 * Hook untuk mengelola data leads, marketing person, unit status
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { marketingService } from '../services/marketing.service';
import type { CreateLeadPayload, CreateMarketingPersonPayload, Lead, LeadListParams, LeadStats, MarketingPerson, UnitStatus } from '../types';

export function useLeads(initialParams?: LeadListParams) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; total_pages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState<LeadListParams | undefined>(initialParams);
  useEffect(() => {
    if (initialParams !== undefined) setParams(initialParams);
  }, [initialParams?.page, initialParams?.limit, initialParams?.search, initialParams?.status, initialParams?.project_id]);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, s] = await Promise.all([
        marketingService.getLeads(params),
        marketingService.getLeadStats(),
      ]);
      setLeads(res.data ?? []);
      setStats(s);
      setPagination(res.pagination ?? null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [params]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const create = async (payload: CreateLeadPayload) => {
    try {
      const l = await marketingService.createLead(payload);
      toast.success('Lead berhasil ditambahkan');
      await fetchLeads();
      return l;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<CreateLeadPayload>) => {
    try {
      const l = await marketingService.updateLead(id, payload);
      toast.success('Lead berhasil diperbarui');
      await fetchLeads();
      return l;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await marketingService.removeLead(id);
      toast.success('Lead berhasil dihapus');
      await fetchLeads();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { leads, stats, pagination, isLoading, refetch: fetchLeads, setParams, create, update, remove };
}

export function useMarketingPersons(initialParams?: { page?: number; limit?: number; is_active?: boolean }) {
  const [persons, setPersons] = useState<MarketingPerson[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; total_pages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState(initialParams);
  useEffect(() => {
    if (initialParams && (initialParams.page !== params?.page || initialParams.limit !== params?.limit || initialParams.is_active !== params?.is_active)) {
      setParams(initialParams);
    }
  }, [initialParams?.page, initialParams?.limit, initialParams?.is_active]);

  const fetchPersons = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await marketingService.getMarketingPersons(params);
      setPersons(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [params?.page, params?.limit, params?.is_active]);

  useEffect(() => { fetchPersons(); }, [fetchPersons]);

  const create = async (payload: CreateMarketingPersonPayload) => {
    try {
      const p = await marketingService.createMarketingPerson(payload);
      toast.success('Marketing person ditambahkan');
      await fetchPersons();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<CreateMarketingPersonPayload>) => {
    try {
      const p = await marketingService.updateMarketingPerson(id, payload);
      toast.success('Marketing person diperbarui');
      await fetchPersons();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await marketingService.removeMarketingPerson(id);
      toast.success('Marketing person dihapus');
      await fetchPersons();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { persons, pagination, isLoading, refetch: fetchPersons, setParams, create, update, remove };
}

export function useUnitStatuses() {
  const [unitStatuses, setUnitStatuses] = useState<UnitStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatuses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await marketingService.getUnitStatuses();
      setUnitStatuses(data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  const update = async (unitCode: string, payload: Partial<UnitStatus>) => {
    try {
      const s = await marketingService.updateUnitStatus(unitCode, payload);
      toast.success('Status unit diperbarui');
      await fetchStatuses();
      return s;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { unitStatuses, isLoading, refetch: fetchStatuses, update };
}
