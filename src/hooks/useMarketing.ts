/**
 * hooks/useMarketing.ts
 * Hook untuk mengelola data leads, marketing person, unit status
 *
 * Cara pakai di komponen:
 *   const { leads, isLoading, stats } = useLeads();
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { USE_MOCK_DATA } from '../lib/config';
import { mockLeadsData, mockLeadStats, mockMarketingPersons, mockUnitStatuses } from '../lib/mockMarketing';
import { getErrorMessage } from '../lib/utils';
import { marketingService } from '../services/marketing.service';
import type { CreateLeadPayload, CreateMarketingPersonPayload, Lead, LeadListParams, LeadStats, MarketingPerson, UnitStatus } from '../types';

// ── Hook leads ────────────────────────────────────────────────────

export function useLeads(initialParams?: LeadListParams) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState<LeadListParams | undefined>(initialParams);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) {
        setLeads(mockLeadsData);
        setStats(mockLeadStats);
        return;
      }
      const [res, s] = await Promise.all([
        marketingService.getLeads(params),
        marketingService.getLeadStats(),
      ]);
      setLeads(res.data);
      setStats(s);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, [params]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const create = async (payload: CreateLeadPayload) => {
    if (USE_MOCK_DATA) {
      const newLead: Lead = {
        id: crypto.randomUUID(),
        ...payload,
        status: payload.status ?? 'Baru',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLeads(prev => [newLead, ...prev]);
      toast.success('Lead berhasil ditambahkan');
      return newLead;
    }
    try {
      const l = await marketingService.createLead(payload);
      toast.success('Lead berhasil ditambahkan');
      await fetchLeads();
      return l;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<CreateLeadPayload>) => {
    if (USE_MOCK_DATA) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...payload, updated_at: new Date().toISOString() } : l));
      toast.success('Lead berhasil diperbarui');
      return;
    }
    try {
      const l = await marketingService.updateLead(id, payload);
      toast.success('Lead berhasil diperbarui');
      await fetchLeads();
      return l;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setLeads(prev => prev.filter(l => l.id !== id));
      toast.success('Lead berhasil dihapus');
      return;
    }
    try {
      await marketingService.removeLead(id);
      toast.success('Lead berhasil dihapus');
      await fetchLeads();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { leads, stats, isLoading, refetch: fetchLeads, setParams, create, update, remove };
}

// ── Hook marketing persons ────────────────────────────────────────

export function useMarketingPersons() {
  const [persons, setPersons] = useState<MarketingPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPersons = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) {
        setPersons(mockMarketingPersons);
        return;
      }
      const res = await marketingService.getMarketingPersons();
      setPersons(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchPersons(); }, [fetchPersons]);

  const create = async (payload: CreateMarketingPersonPayload) => {
    if (USE_MOCK_DATA) {
      const p: MarketingPerson = {
        id: crypto.randomUUID(),
        ...payload,
        target: payload.target ?? 0,
        is_active: payload.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPersons(prev => [...prev, p]);
      toast.success('Marketing person ditambahkan');
      return p;
    }
    try {
      const p = await marketingService.createMarketingPerson(payload);
      toast.success('Marketing person ditambahkan');
      await fetchPersons();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<CreateMarketingPersonPayload>) => {
    if (USE_MOCK_DATA) {
      setPersons(prev => prev.map(p => p.id === id ? { ...p, ...payload, updated_at: new Date().toISOString() } : p));
      toast.success('Marketing person diperbarui');
      return;
    }
    try {
      const p = await marketingService.updateMarketingPerson(id, payload);
      toast.success('Marketing person diperbarui');
      await fetchPersons();
      return p;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setPersons(prev => prev.filter(p => p.id !== id));
      toast.success('Marketing person dihapus');
      return;
    }
    try {
      await marketingService.removeMarketingPerson(id);
      toast.success('Marketing person dihapus');
      await fetchPersons();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { persons, isLoading, refetch: fetchPersons, create, update, remove };
}

// ── Hook unit statuses ────────────────────────────────────────────

export function useUnitStatuses() {
  const [unitStatuses, setUnitStatuses] = useState<UnitStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatuses = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) {
        setUnitStatuses(mockUnitStatuses);
        return;
      }
      const data = await marketingService.getUnitStatuses();
      setUnitStatuses(data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  const update = async (unitCode: string, payload: Partial<UnitStatus>) => {
    if (USE_MOCK_DATA) {
      setUnitStatuses(prev => prev.map(u => u.unit_code === unitCode ? { ...u, ...payload } : u));
      toast.success('Status unit diperbarui');
      return;
    }
    try {
      const s = await marketingService.updateUnitStatus(unitCode, payload);
      toast.success('Status unit diperbarui');
      await fetchStatuses();
      return s;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return { unitStatuses, isLoading, refetch: fetchStatuses, update };
}
