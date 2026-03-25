/**
 * hooks/useQualityControl.ts
 * Hook terpusat untuk modul Quality Control (templates + submissions)
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { qcService } from '../services';
import type {
  QcSubmission,
  QcSubmissionInput,
  QcTemplate,
  QcTemplateItem,
  QcTemplateSection,
} from '../types';

// ── Templates ─────────────────────────────────────────────────
export function useQCTemplates() {
  const [templates, setTemplates] = useState<QcTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
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
    try {
      const tpl = await qcService.createTemplate(payload);
      toast.success('Template QC dibuat');
      await fetchTemplates();
      return tpl;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<QcTemplate>) => {
    try {
      const tpl = await qcService.updateTemplate(id, payload);
      toast.success('Template QC diperbarui');
      await fetchTemplates();
      return tpl;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const duplicate = async (id: string) => {
    try {
      const tpl = await qcService.duplicateTemplate(id);
      toast.success('Template QC diduplikasi');
      await fetchTemplates();
      return tpl;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
    try {
      await qcService.removeTemplate(id);
      toast.success('Template QC dihapus');
      await fetchTemplates();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const addSection = async (templateId: string, payload: Partial<QcTemplateSection>) => {
    const section = await qcService.createSection(templateId, payload);
    await fetchTemplates();
    return section;
  };

  const updateSection = async (templateId: string, sectionId: string, payload: Partial<QcTemplateSection>) => {
    const section = await qcService.updateSection(templateId, sectionId, payload);
    await fetchTemplates();
    return section;
  };

  const removeSection = async (templateId: string, sectionId: string) => {
    await qcService.removeSection(templateId, sectionId);
    await fetchTemplates();
  };

  const addItem = async (templateId: string, sectionId: string, payload: Partial<QcTemplateItem>) => {
    const item = await qcService.createItem(templateId, sectionId, payload);
    await fetchTemplates();
    return item;
  };

  const updateItem = async (templateId: string, sectionId: string, itemId: string, payload: Partial<QcTemplateItem>) => {
    const item = await qcService.updateItem(templateId, sectionId, itemId, payload);
    await fetchTemplates();
    return item;
  };

  const removeItem = async (templateId: string, sectionId: string, itemId: string) => {
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
  const [submissions, setSubmissions] = useState<QcSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubmissions = useCallback(async (filters?: { project_id?: string; unit_no?: string; unit_id?: string; status?: string }) => {
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
    try {
      const res = await qcService.createSubmission(payload);
      if (!silent) toast.success('Submission QC dibuat');
      await fetchSubmissions(initialFilters);
      return res;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const update = async (id: string, payload: Partial<QcSubmissionInput>, silent = false) => {
    try {
      const res = await qcService.updateSubmission(id, payload);
      if (!silent) toast.success('Submission QC diperbarui');
      await fetchSubmissions(initialFilters);
      return res;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const submit = async (id: string, silent = false) => {
    try {
      const res = await qcService.submitSubmission(id);
      if (!silent) toast.success('Submission QC disubmit');
      await fetchSubmissions(initialFilters);
      return res;
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  const remove = async (id: string) => {
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
