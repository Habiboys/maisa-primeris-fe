/**
 * hooks/useQualityControl.ts
 * Hook terpusat untuk modul Quality Control (templates + submissions)
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { USE_MOCK_DATA } from '../lib/config';
import { mockQCSubmissions, mockQCTemplates } from '../lib/mockData';
import { getErrorMessage } from '../lib/utils';
import { qcService } from '../services';
import type {
  QcSubmission,
  QcSubmissionInput,
  QcTemplate,
  QcTemplateItem,
  QcTemplateSection,
} from '../types';

const normalizeMockResult = (val?: string | null): 'OK' | 'Not OK' | 'N/A' | null => {
  const v = (val || '').toLowerCase();
  if (v === 'ok') return 'OK';
  if (v === 'not ok' || v === 'not_ok' || v === 'notok' || v === 'fail') return 'Not OK';
  if (v === 'n/a' || v === 'na') return 'N/A';
  return null;
};

// ── Templates ─────────────────────────────────────────────────
export function useQCTemplates() {
  const [templates, setTemplates] = useState<QcTemplate[]>(USE_MOCK_DATA ? (mockQCTemplates as QcTemplate[]) : []);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setTemplates(mockQCTemplates as QcTemplate[]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await qcService.getTemplates();
      setTemplates(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const create = async (payload: Partial<QcTemplate>) => {
    if (USE_MOCK_DATA) {
      const newTpl: QcTemplate = {
        id: crypto.randomUUID(),
        name: payload.name ?? 'Template QC Baru',
        description: payload.description ?? '',
        is_active: payload.is_active ?? true,
        sections: payload.sections ?? [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTemplates(prev => [newTpl, ...prev]);
      toast.success('Template QC (mock) dibuat');
      return newTpl;
    }

    try {
      const tpl = await qcService.createTemplate(payload);
      toast.success('Template QC dibuat');
      await fetchTemplates();
      return tpl;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<QcTemplate>) => {
    if (USE_MOCK_DATA) {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...payload, updated_at: new Date().toISOString() } : t));
      toast.success('Template QC (mock) diperbarui');
      return templates.find(t => t.id === id) ?? null;
    }

    try {
      const tpl = await qcService.updateTemplate(id, payload);
      toast.success('Template QC diperbarui');
      await fetchTemplates();
      return tpl;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const duplicate = async (id: string) => {
    if (USE_MOCK_DATA) {
      const base = templates.find(t => t.id === id);
      if (!base) return null;
      const copy: QcTemplate = {
        ...base,
        id: crypto.randomUUID(),
        name: `${base.name} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTemplates(prev => [copy, ...prev]);
      toast.success('Template QC (mock) diduplikasi');
      return copy;
    }

    try {
      const tpl = await qcService.duplicateTemplate(id);
      toast.success('Template QC diduplikasi');
      await fetchTemplates();
      return tpl;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template QC (mock) dihapus');
      return;
    }

    try {
      await qcService.removeTemplate(id);
      toast.success('Template QC dihapus');
      await fetchTemplates();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const addSection = async (templateId: string, payload: Partial<QcTemplateSection>) => {
    if (USE_MOCK_DATA) {
      const newSection: QcTemplateSection = {
        id: crypto.randomUUID(),
        template_id: templateId,
        name: payload.name ?? '',
        order_index: payload.order_index ?? 0,
        items: [],
      };
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, sections: [...(t.sections ?? []), newSection] } : t));
      return newSection;
    }
    const section = await qcService.createSection(templateId, payload);
    await fetchTemplates();
    return section;
  };

  const updateSection = async (templateId: string, sectionId: string, payload: Partial<QcTemplateSection>) => {
    if (USE_MOCK_DATA) {
      setTemplates(prev => prev.map(t => t.id === templateId ? {
        ...t,
        sections: (t.sections ?? []).map(s => s.id === sectionId ? { ...s, ...payload } : s),
      } : t));
      return templates.find(t => t.id === templateId)?.sections?.find(s => s.id === sectionId) ?? null;
    }
    const section = await qcService.updateSection(templateId, sectionId, payload);
    await fetchTemplates();
    return section;
  };

  const removeSection = async (templateId: string, sectionId: string) => {
    if (USE_MOCK_DATA) {
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, sections: (t.sections ?? []).filter(s => s.id !== sectionId) } : t));
      return;
    }
    await qcService.removeSection(templateId, sectionId);
    await fetchTemplates();
  };

  const addItem = async (templateId: string, sectionId: string, payload: Partial<QcTemplateItem>) => {
    if (USE_MOCK_DATA) {
      const newItem: QcTemplateItem = {
        id: crypto.randomUUID(),
        section_id: sectionId,
        description: payload.description ?? '',
        order_index: payload.order_index ?? 0,
      };
      setTemplates(prev => prev.map(t => t.id === templateId ? {
        ...t,
        sections: (t.sections ?? []).map(s => s.id === sectionId ? { ...s, items: [...(s.items ?? []), newItem] } : s),
      } : t));
      return newItem;
    }
    const item = await qcService.createItem(templateId, sectionId, payload);
    await fetchTemplates();
    return item;
  };

  const updateItem = async (templateId: string, sectionId: string, itemId: string, payload: Partial<QcTemplateItem>) => {
    if (USE_MOCK_DATA) {
      setTemplates(prev => prev.map(t => t.id === templateId ? {
        ...t,
        sections: (t.sections ?? []).map(s => s.id === sectionId ? {
          ...s,
          items: (s.items ?? []).map(i => i.id === itemId ? { ...i, ...payload } : i),
        } : s),
      } : t));
      return templates
        .find(t => t.id === templateId)?.sections
        ?.find(s => s.id === sectionId)?.items
        ?.find(i => i.id === itemId) ?? null;
    }
    const item = await qcService.updateItem(templateId, sectionId, itemId, payload);
    await fetchTemplates();
    return item;
  };

  const removeItem = async (templateId: string, sectionId: string, itemId: string) => {
    if (USE_MOCK_DATA) {
      setTemplates(prev => prev.map(t => t.id === templateId ? {
        ...t,
        sections: (t.sections ?? []).map(s => s.id === sectionId ? { ...s, items: (s.items ?? []).filter(i => i.id !== itemId) } : s),
      } : t));
      return;
    }
    await qcService.removeItem(templateId, sectionId, itemId);
    await fetchTemplates();
  };

  return {
    templates,
    isLoading,
    refetch: fetchTemplates,
    create,
    update,
    duplicate,
    remove,
    addSection,
    updateSection,
    removeSection,
    addItem,
    updateItem,
    removeItem,
    getById: (id: string) => templates.find(t => t.id === id) || null,
  };
}

// ── Submissions ─────────────────────────────────────────────
export function useQCSubmissions(initialFilters?: { project_id?: string; unit_no?: string; unit_id?: string; status?: string }) {
  const [submissions, setSubmissions] = useState<QcSubmission[]>(USE_MOCK_DATA ? (mockQCSubmissions as QcSubmission[]) : []);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubmissions = useCallback(async (filters?: { project_id?: string; unit_no?: string; unit_id?: string; status?: string }) => {
    if (USE_MOCK_DATA) {
      setSubmissions(mockQCSubmissions as QcSubmission[]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await qcService.getSubmissions(filters);
      setSubmissions(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubmissions(initialFilters); }, [fetchSubmissions, initialFilters?.project_id, initialFilters?.unit_no, initialFilters?.unit_id, initialFilters?.status]);

  const create = async (payload: QcSubmissionInput, silent = false) => {
    if (USE_MOCK_DATA) {
      const newId = `QC-${new Date().getFullYear()}-${String(submissions.length + 1).padStart(3, '0')}`;
      const newSubmission: QcSubmission = {
        id: newId,
        project_id: payload.project_id,
        unit_id: payload.unit_id ?? null,
        unit_no: payload.unit_no ?? null,
        template_id: payload.template_id,
        submission_date: payload.submission_date,
        status: payload.status ?? 'Draft',
        notes: payload.notes ?? null,
        results: payload.results?.map((r, idx) => ({
          id: `res-${Date.now()}-${idx}`,
          submission_id: newId,
          item_id: r.item_id ?? r.template_item_id ?? null,
          result: normalizeMockResult(r.result ?? r.status ?? null),
          notes: r.notes ?? r.remarks ?? null,
          photo_url: r.photo_url ?? r.photo ?? null,
        })) ?? [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSubmissions(prev => [newSubmission, ...prev]);
      if (!silent) toast.success('Submission QC (mock) dibuat');
      return newSubmission;
    }

    try {
      const res = await qcService.createSubmission(payload);
      if (!silent) toast.success('Submission QC dibuat');
      await fetchSubmissions(initialFilters);
      return res;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<QcSubmissionInput>, silent = false) => {
    if (USE_MOCK_DATA) {
      setSubmissions(prev => prev.map(s => {
        if (s.id !== id) return s;
        const updated: QcSubmission = { ...s, ...payload, updated_at: new Date().toISOString() } as QcSubmission;
        if (payload.results) {
          updated.results = payload.results.map((r, idx) => ({
            id: `res-${Date.now()}-${idx}`,
            submission_id: id,
            item_id: r.item_id ?? r.template_item_id ?? null,
            result: normalizeMockResult(r.result ?? r.status ?? null),
            notes: r.notes ?? r.remarks ?? null,
            photo_url: r.photo_url ?? r.photo ?? null,
          }));
        }
        return updated;
      }));
      if (!silent) toast.success('Submission QC (mock) diperbarui');
      return submissions.find(s => s.id === id) ?? null;
    }
    try {
      const res = await qcService.updateSubmission(id, payload);
      if (!silent) toast.success('Submission QC diperbarui');
      await fetchSubmissions(initialFilters);
      return res;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const submit = async (id: string, silent = false) => {
    if (USE_MOCK_DATA) {
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'Submitted', updated_at: new Date().toISOString() } : s));
      if (!silent) toast.success('Submission QC (mock) disubmit');
      return submissions.find(s => s.id === id) ?? null;
    }
    try {
      const res = await qcService.submitSubmission(id);
      if (!silent) toast.success('Submission QC disubmit');
      await fetchSubmissions(initialFilters);
      return res;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    if (USE_MOCK_DATA) {
      setSubmissions(prev => prev.filter(s => s.id !== id));
      toast.success('Submission QC (mock) dihapus');
      return;
    }
    try {
      await qcService.removeSubmission(id);
      toast.success('Submission QC dihapus');
      await fetchSubmissions(initialFilters);
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return {
    submissions,
    isLoading,
    refetch: fetchSubmissions,
    create,
    update,
    submit,
    remove,
    getById: (id: string) => submissions.find(s => s.id === id) || null,
  };
}
