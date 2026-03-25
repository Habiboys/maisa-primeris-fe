import {
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2 as CheckCircle2Icon,
  CheckCircle as CheckCircleIcon,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileText,
  Filter,
  History as HistoryIcon,
  LayoutList,
  Save,
  Search,
  Send,
  Trash2,
  User as UserIcon,
  XCircle as XCircleIcon
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog, useQCSubmissions, useQCTemplates } from '../../hooks';
import { compressImage } from '../../lib/utils';
import { qcService } from '../../services';
import type { QcSubmission, QcSubmissionInput, QcTemplate } from '../../types';

type ChecklistItemState = {
  id: string;
  description: string;
  result: 'OK' | 'Not OK' | null;
  photo: string | null;
  notes: string;
};

type ChecklistSectionState = {
  id: string;
  name: string;
  items: ChecklistItemState[];
};

interface QCProps {
  initialProject?: string;
  initialProjectId?: string;
  initialUnit?: string;
  initialTemplateId?: string;
  onClose?: () => void;
  onSave?: () => void;
}

export function QualityControl({ initialProject = '', initialProjectId, initialUnit = '', initialTemplateId, onClose, onSave }: QCProps) {
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  const { templates, isLoading: templatesLoading } = useQCTemplates();
  const {
    submissions,
    isLoading: submissionsLoading,
    create,
    update,
    submit,
    remove,
    refetch,
  } = useQCSubmissions({ unit_no: initialUnit || undefined, project_id: initialProjectId || undefined });

  const [activeTab, setActiveTab] = useState<'checklist' | 'history'>(initialUnit ? 'history' : 'checklist');
  const [isInspecting, setIsInspecting] = useState(!!initialUnit);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId || '');
  const [sections, setSections] = useState<ChecklistSectionState[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [headerData, setHeaderData] = useState({
    project: initialProject,
    unit: initialUnit,
    date: new Date().toISOString().split('T')[0],
    inspector: 'Admin Maisa',
  });
  const [viewDetail, setViewDetail] = useState<QcSubmission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const draftLoadedRef = useRef(false);
  // Tracks the ID of an existing Draft that was pre-filled into the form,
  // so we UPDATE it instead of creating a duplicate.
  const loadedDraftId = useRef<string | null>(null);

  const summarizeSubmission = (submission: QcSubmission) => {
    const results = submission.results ?? [];
    const okCount = results.filter(r => (r.result || '').toUpperCase() === 'OK').length;
    const notOkCount = results.filter(r => (r.result || '').toUpperCase() === 'NOT OK' || r.result === 'Not OK').length;
    return {
      okCount,
      notOkCount,
      total: results.length,
    };
  };

  const filteredHistory = useMemo(() => {
    return submissions.filter(sub => {
      if (headerData.unit && sub.unit_no && sub.unit_no !== headerData.unit) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        sub.id?.toLowerCase().includes(q) ||
        sub.project?.name?.toLowerCase().includes(q) ||
        sub.unit_no?.toLowerCase().includes(q)
      );
    });
  }, [headerData.unit, searchQuery, submissions]);

  const detailSections = useMemo(() => {
    if (!viewDetail) return [] as Array<{ id: string; name: string; items: Array<{ id: string; description: string; result: string | null; notes?: string | null; photo_url?: string | null }> }>;
    const sectionMap = (viewDetail.template?.sections ?? []).map(section => {
      const items = (section.items ?? []).map(item => {
        const res = viewDetail.results?.find(r => r.item_id === item.id || r.templateItem?.id === item.id);
        return {
          id: item.id,
          description: item.description,
          result: res?.result ?? null,
          notes: res?.notes ?? null,
          photo_url: res?.photo_url ?? null,
        };
      });
      return { id: section.id, name: section.name, items };
    });

    if (sectionMap.length > 0) return sectionMap;

    const fallback = (viewDetail.results ?? []).reduce<Record<string, { name: string; items: Array<{ id: string; description: string; result: string | null; notes?: string | null; photo_url?: string | null }> }>>((acc, res) => {
      const sectionId = res.templateItem?.section_id ?? 'default';
      if (!acc[sectionId]) {
        acc[sectionId] = { name: res.templateItem?.section_id ?? 'Checklist', items: [] };
      }
      acc[sectionId].items.push({
        id: res.item_id ?? res.id,
        description: res.templateItem?.description ?? '-',
        result: res.result ?? null,
        notes: res.notes ?? null,
        photo_url: res.photo_url ?? null,
      });
      return acc;
    }, {});

    return Object.entries(fallback).map(([id, section]) => ({ id, name: section.name, items: section.items }));
  }, [viewDetail]);

  const resolveTemplate = useMemo(() => {
    return (tid: string | undefined | null): QcTemplate | null => {
      if (!tid) return null;
      return templates.find(t => t.id === tid) ?? null;
    };
  }, [templates]);

  const buildSectionsFromTemplate = (tpl: QcTemplate | null): ChecklistSectionState[] => {
    if (!tpl) return [];
    const sec = tpl.sections ?? [];
    return sec.map((s, idx) => ({
      id: s.id,
      name: s.name ?? `Section ${idx + 1}`,
      items: (s.items ?? []).map((item, iIdx) => ({
        id: item.id,
        description: item.description,
        result: null,
        photo: null,
        notes: '',
      })),
    }));
  };

  useEffect(() => {
    if (initialProject || initialUnit) {
      setHeaderData(prev => ({
        ...prev,
        project: initialProject || prev.project,
        unit: initialUnit || prev.unit,
      }));
      if (initialUnit) setIsInspecting(true);
    }
  }, [initialProject, initialUnit]);

  useEffect(() => {
    if (templatesLoading) return;
    if (selectedTemplateId) return;
    if (initialTemplateId) {
      const target = resolveTemplate(initialTemplateId);
      if (target) setSelectedTemplateId(target.id);
    }
  }, [initialTemplateId, resolveTemplate, selectedTemplateId, templates, templatesLoading]);

  useEffect(() => {
    const tpl = resolveTemplate(selectedTemplateId);
    const nextSections = buildSectionsFromTemplate(tpl);
    setSections(nextSections);
    setExpandedSections(nextSections.slice(0, 2).map(s => s.id));
    // reset draft pre-fill guard whenever template changes
    draftLoadedRef.current = false;
    loadedDraftId.current = null;
  }, [resolveTemplate, selectedTemplateId]);

  // Pre-fill checklist from the latest submission (Draft first, then Submitted) when opening inspection
  useEffect(() => {
    if (!isInspecting) { draftLoadedRef.current = false; loadedDraftId.current = null; return; }
    if (draftLoadedRef.current) return;
    if (submissionsLoading || sections.length === 0 || !selectedTemplateId) return;

    // unit_no is not stored on the submission row — it lives on the associated unit
    const matchUnit = (s: import('../../types').QcSubmission) =>
      (s.unit?.no ?? s.unit_no) === headerData.unit;

    const sorted = [...submissions]
      .filter(s => matchUnit(s) && s.template_id === selectedTemplateId)
      .sort((a, b) => new Date(b.updated_at ?? b.created_at ?? 0).getTime() - new Date(a.updated_at ?? a.created_at ?? 0).getTime());

    // prefer Draft so it can still be edited; fall back to latest Submitted
    const target = sorted.find(s => s.status === 'Draft') ?? sorted[0];

    if (!target) return;

    draftLoadedRef.current = true;
    // Only track the ID if it's a Draft — Submitted cannot be updated
    loadedDraftId.current = target.status === 'Draft' ? target.id : null;

    qcService.getSubmission(target.id).then(full => {
      if (!full.results?.length) return;
      setSections(prev => prev.map(section => ({
        ...section,
        items: section.items.map(item => {
          const res = full.results!.find(r => r.item_id === item.id);
          if (!res) return item;
          return {
            ...item,
            result: (res.result as 'OK' | 'Not OK' | null) ?? null,
            notes: res.notes ?? '',
            photo: res.photo_url ?? null,
          };
        }),
      })));
    }).catch(() => {/* silent */});
  }, [isInspecting, submissionsLoading, sections.length, submissions, headerData.unit, selectedTemplateId]);

  const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
  const okItems = sections.reduce((acc, section) => acc + section.items.filter(i => i.result === 'OK').length, 0);
  const notOkItems = sections.reduce((acc, section) => acc + section.items.filter(i => i.result === 'Not OK').length, 0);
  const progressPercent = totalItems === 0 ? 0 : Math.round(((okItems + notOkItems) / totalItems) * 100);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => (prev.includes(sectionId) ? prev.filter(t => t !== sectionId) : [...prev, sectionId]));
  };

  const updateItem = (sectionId: string, itemId: string, field: keyof ChecklistItemState, value: unknown) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        items: section.items.map(item => (item.id === itemId ? { ...item, [field]: value } : item)),
      };
    }));
  };

  const handleFileUpload = async (sectionId: string, itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      updateItem(sectionId, itemId, 'photo', compressed);
      toast.success('Foto berhasil diunggah');
    } catch {
      toast.error('Gagal memproses foto');
    }
  };

  const buildPayloadResults = (): NonNullable<QcSubmissionInput['results']> => {
    return sections.flatMap(section =>
      section.items.map(item => ({
        item_id: item.id,
        result: item.result ?? undefined,
        notes: item.notes || null,
        photo_url: item.photo || null,
      }))
    );
  };

  const handleSave = async (status: 'Draft' | 'Submitted') => {
    if (!headerData.project || !headerData.unit) {
      toast.error('Pilih proyek dan unit terlebih dahulu');
      return;
    }
    if (!selectedTemplateId) {
      toast.error('Pilih template QC terlebih dahulu');
      return;
    }
    if (status === 'Submitted') {
      const unfilled = sections.flatMap(s => s.items).filter(item => !item.result);
      if (unfilled.length > 0) {
        toast.error(`${unfilled.length} item belum diisi. Semua item harus dicentang sebelum submit.`);
        return;
      }
    }
    setIsSaving(true);
    try {
      const resultsPayload = buildPayloadResults();
      const basePayload = {
        project_id: initialProjectId || headerData.project,
        unit_no: headerData.unit,
        template_id: selectedTemplateId,
        submission_date: headerData.date,
        results: resultsPayload,
      };

      const existingDraftId = loadedDraftId.current;

      if (status === 'Submitted') {
        if (existingDraftId) {
          // UPDATE existing draft with latest data, then submit it
          await update(existingDraftId, basePayload, true);
          await submit(existingDraftId, true);
        } else {
          // No existing draft → create one, then submit
          const draft = await create({ ...basePayload, status: 'Draft' }, true);
          if (draft?.id) await submit(draft.id, true);
        }
      } else {
        // Saving as Draft
        if (existingDraftId) {
          await update(existingDraftId, basePayload, true);
        } else {
          await create({ ...basePayload, status: 'Draft' }, true);
        }
      }
      toast.success(status === 'Submitted' ? 'Laporan QC berhasil disubmit' : 'Draft QC berhasil disimpan');
      onSave?.();
      setIsInspecting(false);
      setActiveTab('history');
      await refetch({ unit_no: headerData.unit });
      onClose?.();
    } catch (err) {
      // toast handled in hook on errors
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!await showConfirm({ title: 'Hapus Riwayat QC', description: 'Apakah Anda yakin ingin menghapus laporan riwayat QC ini?' })) return;
    await remove(id);
    await refetch({ unit_no: headerData.unit });
  };

  if (isInspecting) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-white">
        {ConfirmDialogElement}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                if (await showConfirm({ title: 'Keluar Inspeksi', description: 'Apakah Anda yakin ingin keluar? Data yang belum disimpan akan hilang.', confirmText: 'Ya, Keluar', variant: 'danger' })) {
                  setIsInspecting(false);
                  if (onClose) onClose();
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-primary transition-all"
              title="Kembali"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <CheckCircle2Icon size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Checklist QC Mingguan</h3>
              <p className="text-xs text-gray-500">
                {headerData.project} • <span className="text-primary font-bold">Unit {headerData.unit}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 px-4 py-6 md:px-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Calendar size={12} /> Tanggal Inspeksi
                </label>
                <input 
                  type="date" 
                  value={headerData.date}
                  onChange={(e) => setHeaderData({...headerData, date: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <UserIcon size={12} /> Petugas QC
                </label>
                <input 
                  type="text" 
                  value={headerData.inspector}
                  onChange={(e) => setHeaderData({...headerData, inspector: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                />
              </div>
              <div className="flex items-center gap-4 bg-primary/5 p-3 rounded-xl border border-primary/10">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-primary text-primary font-bold">
                  {progressPercent}%
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase">Progress</p>
                  <p className="text-xs text-gray-500">{okItems + notOkItems} / {totalItems} Selesai</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {sections.map((section, sIdx) => (
                <div key={section.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <button 
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary text-[10px]">
                        {String.fromCharCode(65 + sIdx)}
                      </div>
                      {section.name}
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-gray-400">
                        {section.items.filter(i => i.result !== null).length} / {section.items.length} Selesai
                      </span>
                      {expandedSections.includes(section.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {expandedSections.includes(section.id) && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                            <th className="px-6 py-3 w-12">No</th>
                            <th className="px-4 py-3 min-w-[200px]">Uraian Pekerjaan</th>
                            <th className="px-4 py-3 text-center w-32">Kualitas</th>
                            <th className="px-4 py-3 text-center w-24">Foto</th>
                            <th className="px-4 py-3 min-w-[200px]">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {section.items.map((item, iIdx) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 text-xs font-bold text-gray-400">{sIdx + 1}.{iIdx + 1}</td>
                              <td className="px-4 py-4">
                                <p className="text-sm font-bold text-gray-900">{item.description}</p>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-center gap-3">
                                  <button 
                                    onClick={() => updateItem(section.id, item.id, 'result', 'OK')}
                                    className={`p-2 rounded-lg transition-all border ${item.result === 'OK' ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200 text-gray-300 hover:border-green-300'}`}
                                  >
                                    <CheckCircle2Icon size={18} />
                                  </button>
                                  <button 
                                    onClick={() => updateItem(section.id, item.id, 'result', 'Not OK')}
                                    className={`p-2 rounded-lg transition-all border ${item.result === 'Not OK' ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gray-200 text-gray-300 hover:border-red-300'}`}
                                  >
                                    <XCircleIcon size={18} />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex justify-center relative group/photo">
                                  {item.photo ? (
                                    <div className="relative">
                                      <img 
                                        src={item.photo} 
                                        alt="QC" 
                                        className="w-10 h-10 object-cover rounded-lg border border-gray-200" 
                                      />
                                      <button 
                                        onClick={() => updateItem(section.id, item.id, 'photo', null)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                      >
                                        <XCircleIcon size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => handleFileUpload(section.id, item.id, e)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                      />
                                      <button className="p-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition-colors">
                                        <Camera size={18} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <input 
                                  type="text" 
                                  value={item.notes}
                                  onChange={(e) => updateItem(section.id, item.id, 'notes', e.target.value)}
                                  placeholder={item.result === 'Not OK' ? "Wajib diisi..." : "Catatan..."}
                                  className={`w-full px-3 py-1.5 text-sm bg-gray-50 border rounded-lg outline-none transition-all ${
                                    item.result === 'Not OK' && !item.notes ? 'border-red-200' : 'border-gray-200'
                                  }`}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between sticky bottom-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">OK</span>
              <span className="text-sm font-bold text-green-600">{okItems} Poin</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">NOT OK</span>
              <span className="text-sm font-bold text-red-600">{notOkItems} Poin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave('Draft')}
              disabled={isSaving}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={18} /> Simpan Draft
            </button>
            <button 
              onClick={() => handleSave('Submitted')}
              disabled={isSaving}
              className="px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send size={18} /> Submit Laporan QC
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ConfirmDialogElement}
      {/* Tab Navigation */}
      <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'checklist' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <LayoutList size={18} />
          Checklist Baru
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <HistoryIcon size={18} />
          Riwayat QC
        </button>
      </div>

      {activeTab === 'checklist' ? (
        <div className="animate-in fade-in duration-300 space-y-6">
          {/* Form Selection (ketika tidak dalam mode full screen/inspeksi unit spesifik) */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <LayoutList size={40} />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-900">Mulai Checklist Mingguan</h3>
              <p className="text-gray-500 mt-2">Pilih proyek dan unit untuk memulai inspeksi lapangan digital.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="text-left space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Pilih Proyek</label>
                <select 
                  value={headerData.project}
                  onChange={(e) => setHeaderData({...headerData, project: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">-- Pilih Proyek --</option>
                  <option>Emerald Heights</option>
                  <option>Sapphire Garden</option>
                </select>
              </div>
              <div className="text-left space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Pilih Unit</label>
                <select 
                  value={headerData.unit}
                  onChange={(e) => setHeaderData({...headerData, unit: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">-- Pilih Unit --</option>
                  <option>A-01</option>
                  <option>A-02</option>
                  <option>B-12</option>
                </select>
              </div>
              <div className="text-left space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Template QC</label>
                <select 
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                  disabled={templatesLoading}
                >
                  <option value="">-- Pilih Template --</option>
                  {templates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={() => {
                if(headerData.project && headerData.unit && selectedTemplateId) setIsInspecting(true);
                else toast.error("Pilih Proyek, Unit, dan Template terlebih dahulu");
              }}
              className="px-12 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              Buka Form Checklist
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300 space-y-6">
          {/* Filter Riwayat */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari ID, Proyek, atau Unit..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm font-bold text-gray-600 flex items-center gap-2 hover:bg-gray-100 transition-all">
                <Filter size={18} /> Filter
              </button>
            </div>
          </div>

          {/* Tabel Riwayat */}
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4">Minggu Ke / ID</th>
                  <th className="px-4 py-4">Proyek & Unit</th>
                  <th className="px-4 py-4">Tanggal QC</th>
                  <th className="px-4 py-4">Hasil (OK/NOK)</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredHistory.map(sub => {
                  const summary = summarizeSubmission(sub);
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900">{sub.id}</span>
                          <span className="text-[10px] text-gray-400">{sub.template?.name ?? 'Template'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-gray-900">{(sub.project?.name ?? headerData.project) || '-'}</p>
                        <p className="text-xs text-gray-500">Unit {sub.unit_no ?? '-'}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {sub.submission_date}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">OK</span>
                            <span className="text-xs font-bold text-green-600">{summary.okCount}</span>
                          </div>
                          <div className="w-px h-6 bg-gray-100"></div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">NOK</span>
                            <span className="text-xs font-bold text-red-600">{summary.notOkCount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          sub.status === 'Submitted' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setViewDetail(sub)}
                            className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteHistory(sub.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg" title="Cetak/Export">
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredHistory.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-sm">
                Tidak ada riwayat inspeksi untuk unit ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Detail History (Read-only View) */}
      {viewDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewDetail(null)}></div>
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Detail Laporan QC {viewDetail.id}</h3>
                  <p className="text-sm text-gray-500">{viewDetail.project?.name ?? '-'} • Unit {viewDetail.unit_no ?? '-'} • {viewDetail.submission_date}</p>
                </div>
              </div>
              <button onClick={() => setViewDetail(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XCircleIcon size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Petugas Lapangan</p>
                  <p className="text-sm font-bold text-gray-900">{viewDetail.notes || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status Laporan</p>
                  <p className="text-sm font-bold text-gray-900">{viewDetail.status}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Akurasi Kelayakan</p>
                  <p className="text-sm font-bold text-green-600">{(() => {
                    const summary = summarizeSubmission(viewDetail);
                    if (!summary.total) return '0% Lolos Standar';
                    return `${Math.round((summary.okCount / summary.total) * 100)}% Lolos Standar`;
                  })()}</p>
                </div>
              </div>

              <div className="space-y-4">
                {detailSections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    <h4 className="font-bold text-primary flex items-center gap-2 border-b border-primary/10 pb-2">
                      <CheckCircleIcon size={16} /> {section.name}
                    </h4>
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-gray-50">
                          {section.items.map((item, idx) => (
                            <tr key={item.id} className="text-sm">
                              <td className="px-4 py-3 w-8 text-gray-400">{idx+1}</td>
                              <td className="px-4 py-3 flex-1">{item.description}</td>
                              <td className="px-4 py-3 w-32">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  (item.result || '').toUpperCase() === 'OK'
                                    ? 'bg-green-50 text-green-600'
                                    : (item.result ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500')
                                }`}>
                                  {item.result || '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3 italic text-gray-400">{item.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center gap-2">
                <Download size={18} /> Cetak Laporan
              </button>
              <button 
                onClick={() => setViewDetail(null)}
                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}