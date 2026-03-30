import { Edit2, Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog, useConstructionStatuses } from '../../hooks';
import type { ConstructionStatus } from '../../types';

const COLOR_OPTIONS = [
  { label: 'Abu-abu', value: 'bg-gray-100 text-gray-600' },
  { label: 'Merah', value: 'bg-red-50 text-red-600' },
  { label: 'Orange', value: 'bg-orange-50 text-orange-600' },
  { label: 'Kuning', value: 'bg-yellow-50 text-yellow-700' },
  { label: 'Hijau', value: 'bg-green-50 text-green-600' },
  { label: 'Biru', value: 'bg-blue-50 text-blue-600' },
  { label: 'Indigo', value: 'bg-indigo-50 text-indigo-600' },
  { label: 'Ungu', value: 'bg-purple-50 text-purple-600' },
];

export function ConstructionStatusManagerPanel() {
  const { statuses, isLoading, create, update, remove } = useConstructionStatuses();
  const { showConfirm, ConfirmDialog } = useConfirmDialog();
  const [editing, setEditing] = useState<ConstructionStatus | null>(null);
  const [form, setForm] = useState({
    name: '',
    progress: '',
    color: 'bg-blue-50 text-blue-600',
    order_index: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const sorted = useMemo(
    () => [...statuses].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [statuses],
  );

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', progress: '', color: 'bg-blue-50 text-blue-600', order_index: '' });
  };

  const startEdit = (s: ConstructionStatus) => {
    setEditing(s);
    setForm({
      name: s.name,
      progress: String(s.progress ?? ''),
      color: s.color ?? 'bg-blue-50 text-blue-600',
      order_index: String(s.order_index ?? ''),
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || form.progress === '') {
      toast.error('Nama dan progres (%) wajib diisi');
      return;
    }
    const progress = Number(form.progress);
    if (Number.isNaN(progress) || progress < 0 || progress > 100) {
      toast.error('Progres harus antara 0–100');
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      const order = form.order_index === '' ? undefined : Number(form.order_index);
      if (editing) {
        await update(editing.id, {
          name: form.name.trim(),
          progress,
          color: form.color,
          ...(typeof order === 'number' && !Number.isNaN(order) ? { order_index: order } : {}),
        });
      } else {
        await create({
          name: form.name.trim(),
          progress,
          color: form.color,
          order_index: typeof order === 'number' && !Number.isNaN(order) ? order : sorted.length,
        });
      }
      resetForm();
    } catch {
      /* hook toast */
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (s: ConstructionStatus) => {
    if (!(await showConfirm({ title: 'Hapus status', description: `Hapus "${s.name}"?` }))) return;
    try {
      await remove(s.id);
      if (editing?.id === s.id) resetForm();
    } catch {
      /* hook toast */
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {ConfirmDialog}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <Plus size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Status Konstruksi</h1>
          <p className="text-sm text-gray-500 mt-1">Master tahapan pembangunan — nama, progres, warna, dan urutan.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
        <h2 className="font-bold text-gray-900">{editing ? 'Edit status' : 'Tambah status'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nama *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Contoh: Finishing"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Progres % *</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => setForm({ ...form, progress: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Warna badge</label>
            <select
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {COLOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Urutan</label>
            <input
              type="number"
              min={0}
              value={form.order_index}
              onChange={(e) => setForm({ ...form, order_index: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Opsional"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
          >
            {isSaving && <Loader2 className="animate-spin" size={16} />}
            {editing ? 'Simpan perubahan' : 'Tambah'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-xl text-sm font-bold hover:bg-gray-300"
            >
              Batal edit
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Daftar status</h2>
          {isLoading && <Loader2 className="animate-spin text-primary" size={20} />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                <th className="px-4 py-3">Urutan</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Progres</th>
                <th className="px-4 py-3">Warna</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 text-gray-600">{s.order_index ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3">{s.progress}%</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${s.color ?? 'bg-gray-100 text-gray-600'}`}>
                      Preview
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="p-2 rounded-lg border border-gray-200 hover:border-primary/40 inline-flex"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 inline-flex ml-1"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    Belum ada status. Tambahkan baris pertama di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
