import { Edit2, Eye, Plus, Trash2, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobCategories, useLogbooks } from '../../hooks';
import { formatDate } from '../../lib/utils';
import type { Logbook, LogbookStatus } from '../../types';
import { RichTextEditor } from '../components/RichTextEditor';

const STATUS_OPTIONS: LogbookStatus[] = ['Draft', 'Submitted', 'Reviewed'];

interface LogbookFormState {
  date: string;
  job_category_id: string;
  description: string;
  progress: string;
  status: LogbookStatus;
  files: File[];
}

const emptyForm = (): LogbookFormState => ({
  date: new Date().toISOString().slice(0, 10),
  job_category_id: '',
  description: '',
  progress: '0',
  status: 'Draft',
  files: [],
});

export function Logbook() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<LogbookStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { categories } = useJobCategories();
  const { items, pagination, isLoading, create, update, remove, setParams } = useLogbooks({
    search: '',
    page: 1,
    limit: 10,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Logbook | null>(null);
  const [form, setForm] = useState<LogbookFormState>(emptyForm);

  const totalPages = pagination?.total_pages ?? 1;

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const applyFilter = () => {
    setPage(1);
    setParams({
      search,
      status: statusFilter || undefined,
      job_category_id: categoryFilter || undefined,
      page: 1,
      limit,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm((prev) => ({ ...emptyForm(), job_category_id: prev.job_category_id || categories[0]?.id || '' }));
    setIsFormOpen(true);
  };

  const openEdit = (row: Logbook) => {
    setEditing(row);
    setForm({
      date: row.date,
      job_category_id: row.job_category_id,
      description: row.description,
      progress: String(row.progress ?? 0),
      status: row.status,
      files: [],
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const progress = Math.max(0, Math.min(100, Number(form.progress || 0)));

    if (editing) {
      await update(editing.id, {
        date: form.date,
        job_category_id: form.job_category_id,
        description: form.description,
        progress,
        status: form.status,
      });
    } else {
      await create({
        date: form.date,
        job_category_id: form.job_category_id,
        description: form.description,
        progress,
        status: form.status,
        files: form.files,
      });
    }

    setIsFormOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const changePage = (next: number) => {
    const target = Math.min(Math.max(1, next), totalPages);
    setPage(target);
    setParams({
      search,
      status: statusFilter || undefined,
      job_category_id: categoryFilter || undefined,
      page: target,
      limit,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logbook</h1>
          <p className="text-sm text-gray-500">Pencatatan aktivitas harian tim (independen dari unit/proyek)</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90"
        >
          <Plus size={16} /> Tambah Logbook
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari deskripsi..."
          className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-200"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200"
        >
          <option value="">Semua kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LogbookStatus | '')}
          className="px-3 py-2 rounded-lg border border-gray-200"
        >
          <option value="">Semua status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" onClick={applyFilter} className="px-3 py-2 rounded-lg bg-gray-900 text-white">Terapkan</button>
      </div>

      {isFormOpen && (
        <form onSubmit={onSubmit} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
          <h2 className="font-semibold text-gray-900">{editing ? 'Edit Logbook' : 'Tambah Logbook'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-200" required />
            <select value={form.job_category_id} onChange={(e) => setForm((p) => ({ ...p, job_category_id: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-200" required>
              <option value="">Pilih kategori kerja</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm((p) => ({ ...p, progress: e.target.value }))} placeholder="Progress %" className="px-3 py-2 rounded-lg border border-gray-200" />
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as LogbookStatus }))} className="px-3 py-2 rounded-lg border border-gray-200">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Deskripsi Kegiatan</p>
            <RichTextEditor
              value={form.description}
              onChange={(next) => setForm((p) => ({ ...p, description: next }))}
              placeholder="Tuliskan deskripsi kegiatan"
            />
          </div>
          {!editing && (
            <input
              type="file"
              multiple
              onChange={(e) => setForm((p) => ({ ...p, files: Array.from(e.target.files ?? []) }))}
              className="block w-full text-sm"
            />
          )}
          <div className="flex items-center gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white">Simpan</button>
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200">Batal</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Tanggal</th>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Jenis Pekerjaan</th>
              <th className="text-left px-4 py-3">Progress</th>
              <th className="text-left px-4 py-3">File</th>
              <th className="text-left px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{formatDate(row.date)}</td>
                <td className="px-4 py-3">{row.user?.name || '-'}</td>
                <td className="px-4 py-3">{row.jobCategory?.name || categoryMap.get(row.job_category_id) || '-'}</td>
                <td className="px-4 py-3">{row.progress ?? 0}%</td>
                <td className="px-4 py-3">{row.files?.length ? `${row.files.length} file` : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => navigate(`/logbook/${row.id}`)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700"><Eye size={16} /></button>
                    <button type="button" onClick={() => openEdit(row)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700"><Edit2 size={16} /></button>
                    <button type="button" onClick={() => remove(row.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Belum ada data logbook.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>View per page</span>
          <select
            value={limit}
            onChange={(e) => {
              const nextLimit = Number(e.target.value);
              setLimit(nextLimit);
              setPage(1);
              setParams({
                search,
                status: statusFilter || undefined,
                job_category_id: categoryFilter || undefined,
                page: 1,
                limit: nextLimit,
              });
            }}
            className="px-2 py-1 rounded border border-gray-200"
          >
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => changePage(page - 1)} disabled={page <= 1} className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-50">Sebelumnya</button>
          <span className="text-sm text-gray-600">Hal. {page} / {totalPages}</span>
          <button type="button" onClick={() => changePage(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-50">Selanjutnya</button>
        </div>
      </div>

      <div className="text-xs text-gray-500 flex items-center gap-2">
        <Upload size={14} />
        Upload file tersedia saat tambah logbook. Untuk update, edit data inti logbook.
      </div>
    </div>
  );
}
