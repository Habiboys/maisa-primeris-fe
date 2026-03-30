import React, { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../hooks';
import { getErrorMessage } from '../../lib/utils';
import type { Department } from '../../services/department.service';
import { departmentService } from '../../services/department.service';
import { useDepartments } from '../../hooks/useMasterData';
import { Modal } from './ui/Modal';

export function DepartmentManagerPanel() {
  const { departments, isLoading, refetch } = useDepartments();
  const { showConfirm, ConfirmDialog } = useConfirmDialog();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Department | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({ name: '', description: '' });

  const handleOpenNew = () => {
    setEditingItem(null);
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (item: Department) => {
    setEditingItem(item);
    setForm({ name: item.name, description: item.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error('Nama divisi harus diisi');
    
    setIsSaving(true);
    try {
      if (editingItem) {
        await departmentService.update(editingItem.id, form);
        toast.success('Divisi berhasil diperbarui');
      } else {
        await departmentService.create(form);
        toast.success('Divisi berhasil ditambahkan');
      }
      setShowModal(false);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: Department) => {
    const ok = await showConfirm({
      title: 'Hapus Divisi',
      description: `Yakin ingin menghapus divisi ${item.name}? Data yang terhubung mungkin akan terpengaruh.`,
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await departmentService.delete(item.id);
      toast.success('Divisi berhasil dihapus');
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
          <h2 className="text-xl font-bold">Data Divisi / Departemen</h2>
          <p className="text-gray-500 text-sm">Kelola daftar divisi untuk digunakan di form SOP & operasional</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary/90 transition-all text-sm"
        >
          <Plus size={16} /> Tambah Divisi
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">No</th>
              <th className="px-6 py-4">Nama Divisi</th>
              <th className="px-6 py-4">Deskripsi</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">Memuat data...</td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">Belum ada data divisi</td>
              </tr>
            ) : (
              departments.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-gray-600">{item.description || '-'}</td>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Divisi' : 'Tambah Divisi'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Nama Divisi</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary"
              placeholder="Contoh: General Affair"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Deskripsi</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
