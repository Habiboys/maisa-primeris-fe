import { AlertCircle, ChevronDown, ChevronUp, Copy, FileText, Pencil, Plus, Save, Settings, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../hooks';
import type { QcTemplate, QcTemplateItem, QcTemplateSection } from '../../types';

interface QCTemplateManagerProps {
  templates: QcTemplate[];
  onCreate?: (payload: Partial<QcTemplate>) => Promise<QcTemplate | null | void>;
  onUpdate?: (id: string, payload: Partial<QcTemplate>) => Promise<QcTemplate | null | void>;
  onDuplicate?: (id: string) => Promise<QcTemplate | null | void>;
  onDelete?: (id: string) => Promise<void>;
  onRefetch?: () => Promise<void>;
  onClose?: () => void;
  isLoading?: boolean;
}

const EMPTY_FORM: Partial<QcTemplate> = {
  name: '',
  description: '',
  is_active: true,
  sections: [],
};

export function QCTemplateManager({
  templates,
  onCreate,
  onUpdate,
  onDuplicate,
  onDelete,
  onRefetch,
  onClose,
  isLoading,
}: QCTemplateManagerProps) {
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Partial<QcTemplate>>(EMPTY_FORM);

  const editingTemplate = useMemo(
    () => templates.find(t => t.id === editingTemplateId) ?? null,
    [editingTemplateId, templates]
  );

  const handleCreateNew = () => {
    const initialSectionId = `sec-${Date.now()}`;
    setIsCreating(true);
    setEditingTemplateId(null);
    setFormData({
      name: '',
      description: '',
      is_active: true,
      sections: [{
        id: initialSectionId,
        template_id: '',
        name: '',
        order_index: 0,
        items: [],
      }],
    });
    setExpandedSections(new Set([initialSectionId]));
  };

  const handleEdit = (template: QcTemplate) => {
    const sections = (template.sections ?? []).map((s, idx) => ({
      id: s.id,
      template_id: s.template_id,
      name: s.name ?? '',
      order_index: s.order_index ?? idx,
      items: (s.items ?? []).map((item, iIdx) => ({
        ...item,
        order_index: item.order_index ?? iIdx,
      })),
    }));

    setIsCreating(false);
    setEditingTemplateId(template.id);
    setFormData({ ...template, sections });
    setExpandedSections(new Set(sections.map(s => s.id)));
  };

  const handleDuplicate = async (template: QcTemplate) => {
    if (!onDuplicate) {
      toast.error('Aksi duplikasi belum didukung');
      return;
    }
    await onDuplicate(template.id);
    await onRefetch?.();
  };

  const handleDelete = async (templateId: string) => {
    if (!onDelete) return;
    if (!await showConfirm({ title: 'Hapus Template', description: 'Apakah Anda yakin ingin menghapus template ini?' })) return;
    await onDelete(templateId);
    await onRefetch?.();
    setEditingTemplateId(null);
    setFormData(EMPTY_FORM);
  };

  const normalizePayload = (data: Partial<QcTemplate>): Partial<QcTemplate> => ({
    name: data.name?.trim() ?? '',
    description: data.description?.trim() ?? '',
    is_active: data.is_active ?? true,
    sections: (data.sections ?? []).map((section, sIdx) => ({
      id: section.id,
      template_id: section.template_id,
      name: section.name?.trim() ?? '',
      order_index: section.order_index ?? sIdx,
      items: (section.items ?? []).map((item, iIdx) => ({
        id: item.id,
        section_id: section.id,
        description: item.description?.trim() ?? '',
        order_index: item.order_index ?? iIdx,
      } as QcTemplateItem)),
    } as QcTemplateSection)),
  });

  const handleSave = async () => {
    if (!formData.name || (formData.sections?.length ?? 0) === 0) {
      toast.error('Nama template dan minimal satu section wajib diisi');
      return;
    }

    const payload = normalizePayload(formData);

    if (editingTemplateId) {
      if (!onUpdate) return;
      await onUpdate(editingTemplateId, payload);
      toast.success('Template QC diperbarui');
    } else {
      if (!onCreate) return;
      await onCreate(payload);
      toast.success('Template QC dibuat');
    }

    await onRefetch?.();
    setIsCreating(false);
    setEditingTemplateId(null);
    setFormData(EMPTY_FORM);
    setExpandedSections(new Set());
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingTemplateId(null);
    setFormData(EMPTY_FORM);
    setExpandedSections(new Set());
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) newExpanded.delete(sectionId);
    else newExpanded.add(sectionId);
    setExpandedSections(newExpanded);
  };

  const addSection = () => {
    const newSectionId = `sec-${Date.now()}`;
    setFormData({
      ...formData,
      sections: [
        ...(formData.sections ?? []),
        {
          id: newSectionId,
          template_id: editingTemplateId ?? '',
          name: '',
          order_index: formData.sections?.length ?? 0,
          items: [],
        },
      ],
    });
    setExpandedSections(new Set([...expandedSections, newSectionId]));
  };

  const updateSection = (sectionId: string, field: keyof QcTemplateSection, value: unknown) => {
    setFormData({
      ...formData,
      sections: (formData.sections ?? []).map(s => (s.id === sectionId ? { ...s, [field]: value } : s)),
    });
  };

  const deleteSection = (sectionId: string) => {
    setFormData({
      ...formData,
      sections: (formData.sections ?? []).filter(s => s.id !== sectionId),
    });
  };

  const addItem = (sectionId: string) => {
    setFormData({
      ...formData,
      sections: (formData.sections ?? []).map(s => {
        if (s.id !== sectionId) return s;
        const newItem: QcTemplateItem = {
          id: `${sectionId}-item-${Date.now()}`,
          section_id: sectionId,
          description: '',
          order_index: (s.items?.length ?? 0),
        };
        return { ...s, items: [...(s.items ?? []), newItem] };
      }),
    });
  };

  const updateItem = (sectionId: string, itemId: string, description: string) => {
    setFormData({
      ...formData,
      sections: (formData.sections ?? []).map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: (s.items ?? []).map(i => (i.id === itemId ? { ...i, description } : i)),
        };
      }),
    });
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    setFormData({
      ...formData,
      sections: (formData.sections ?? []).map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, items: (s.items ?? []).filter(i => i.id !== itemId) };
      }),
    });
  };

  const totalItems = useMemo(
    () => (templates ?? []).reduce((sum, tpl) => sum + (tpl.sections ?? []).reduce((s, sec) => s + (sec.items?.length ?? 0), 0), 0),
    [templates]
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {ConfirmDialogElement}
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">QC Template Management</h2>
              <p className="text-sm text-gray-500">Kelola template checklist Quality Control</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!isCreating && !editingTemplate ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900">Daftar Template QC</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {templates.length} template • {totalItems} item
                  </p>
                </div>
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4" />
                  Buat Template Baru
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => {
                  const sectionCount = template.sections?.length ?? 0;
                  const itemCount = (template.sections ?? []).reduce((sum, s) => sum + (s.items?.length ?? 0), 0);
                  return (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">{template.description || 'Tidak ada deskripsi'}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleEdit(template)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(template)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded transition-colors"
                            title="Duplikasi"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${template.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                          {template.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <div className="text-gray-500">
                          {sectionCount} section • {itemCount} item
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                        Dibuat: {template.created_at ? template.created_at.substring(0, 10) : '-'} • Update: {template.updated_at ? template.updated_at.substring(0, 10) : '-'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {templates.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Belum ada template QC</p>
                  <button
                    onClick={handleCreateNew}
                    className="mt-4 text-primary hover:underline text-sm"
                  >
                    Buat template pertama Anda
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-1">
                  {editingTemplate ? 'Edit Template' : 'Buat Template Baru'}
                </h3>
                <p className="text-sm text-gray-500">
                  {editingTemplate ? 'Ubah template QC yang sudah ada' : 'Buat template checklist QC baru'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-gray-900 mb-4">Informasi Template</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nama Template <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g., Template QC Tipe 60"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active ?? true}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <label className="text-sm font-bold text-gray-700">Aktif</label>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={2}
                    placeholder="Deskripsi singkat tentang template ini"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900">Sections & Items</h4>
                  <button
                    onClick={addSection}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Section
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.sections?.map((section, _sIdx) => (
                    <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-3 flex items-center gap-3">
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedSections.has(section.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          type="text"
                          value={section.name || ''}
                          onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded bg-white text-sm font-bold"
                          placeholder="e.g., A. PEKERJAAN PERSIAPAN"
                        />
                        <button
                          onClick={() => addItem(section.id)}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20"
                        >
                          + Item
                        </button>
                        <button
                          onClick={() => deleteSection(section.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {expandedSections.has(section.id) && (
                        <div className="p-3 bg-white space-y-2">
                          {(section.items ?? []).length === 0 ? (
                            <div className="text-center py-4 text-sm text-gray-400">
                              Belum ada item. Klik "+ Item" untuk menambah.
                            </div>
                          ) : (
                            (section.items ?? []).map((item, iIdx) => (
                              <div key={item.id} className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-6">{iIdx + 1}.</span>
                                <input
                                  type="text"
                                  value={item.description || ''}
                                  onChange={(e) => updateItem(section.id, item.id, e.target.value)}
                                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm"
                                  placeholder="Deskripsi item checklist"
                                />
                                <button
                                  onClick={() => deleteItem(section.id, item.id)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {(!formData.sections || formData.sections.length === 0) && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Belum ada section. Klik "Tambah Section" untuk memulai.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4" />
                  {editingTemplate ? 'Update Template' : 'Simpan Template'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}