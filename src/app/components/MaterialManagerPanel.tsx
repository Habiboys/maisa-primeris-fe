import React, { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../hooks';
import { getErrorMessage } from '../../lib/utils';
import type { Material } from '../../services/material.service';
import { materialService } from '../../services/material.service';
import { useMaterials } from '../../hooks/useMasterData';
import { Modal } from './ui/Modal';

export function MaterialManagerPanel() {
  const { materials, isLoading, refetch } = useMaterials();
  const { showConfirm, ConfirmDialog } = useConfirmDialog();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Material | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({ name: '', unit: '', notes: '' });

  const handleOpenNew = () => {
    setEditingItem(null);
    setForm({ name: '', unit: '', notes: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (item: Material) => {
    setEditingItem(item);
    setForm({ name: item.name, unit: item.unit, notes: item.notes || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.unit) return toast.error('Nama dan Satuan material harus diisi');
    
    setIsSaving(true);
    try {
      if (editingItem) {
        await materialService.update(editingItem.id, form);
        toast.success('Material berhasil diperbarui');
      } else {
        await materialService.create(form);
        toast.success('Material berhasil ditambahkan');
      }
      setShowModal(false);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: Material) => {
    const ok = await showConfirm({
      title: 'Hapus Material',
      description: `Yakin ingin menghapus material ${item.name}?`,
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await materialService.delete(item.id);
      toast.success('Material berhasil dihapus');
      refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      {ConfirmDialog}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold">Data Master Material</h2>
          <p className="text-gray-500 text-sm">Kelola daftar material dan satuannya yang digunakan pada input SOP.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary/90 transition-all text-sm"
        >
          <Plus size={16} /> Tambah Material
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">No</th>
              <th className="px-6 py-4">Nama Material</th>
              <th className="px-6 py-4">Satuan</th>
              <th className="px-6 py-4">Keterangan</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">Memuat data...</td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">Belum ada data material</td>
              </tr>
            ) : (
              materials.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 font-bold text-primary">{item.unit}</td>
                  <td className="px-6 py-4 text-gray-600">{item.notes || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors inline-block"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors inline-block"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Material' : 'Tambah Material'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Nama Material</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary"
              placeholder="Contoh: Semen Portland"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Satuan</label>
            <input
              type="text"
              required
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary"
              placeholder="Contoh: Sak, M3, Batang"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Keterangan</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary"
              placeholder="Opsional"
            />
          </div>
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-primary text-white rounded-lg font-bold disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
