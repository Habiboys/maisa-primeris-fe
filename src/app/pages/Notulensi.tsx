import { Download, Edit2, Eye, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingNotes, useUsers } from '../../hooks';
import { formatDate } from '../../lib/utils';
import type { MeetingActionInput, MeetingNote, MeetingType } from '../../types';
import { RichTextEditor } from '../components/RichTextEditor';

const MEETING_TYPES: MeetingType[] = ['Mingguan', 'Bulanan'];

interface NoteFormState {
  title: string;
  date: string;
  meeting_type: MeetingType;
  participants: string;
  discussion: string;
  result: string;
  actions: MeetingActionInput[];
}

const emptyForm = (): NoteFormState => ({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  meeting_type: 'Mingguan',
  participants: '',
  discussion: '',
  result: '',
  actions: [{ task: '', assigned_to: null, deadline: null }],
});

export function Notulensi() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [typeFilter, setTypeFilter] = useState<MeetingType | ''>('');

  const { items, pagination, isLoading, setParams, create, update, remove, exportPdf } = useMeetingNotes({
    page: 1,
    limit: 10,
  });
  const { users } = useUsers({ page: 1, limit: 100 });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<MeetingNote | null>(null);
  const [form, setForm] = useState<NoteFormState>(emptyForm);

  const totalPages = pagination?.total_pages ?? 1;

  const applyFilter = () => {
    setPage(1);
    setParams({ search, meeting_type: typeFilter || undefined, page: 1, limit });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openEdit = (row: MeetingNote) => {
    setEditing(row);
    setForm({
      title: row.title,
      date: row.date,
      meeting_type: row.meeting_type,
      participants: row.participants || '',
      discussion: row.discussion || '',
      result: row.result || '',
      actions: row.actions?.length
        ? row.actions.map((a) => ({ task: a.task, assigned_to: a.assigned_to || null, deadline: a.deadline || null }))
        : [{ task: '', assigned_to: null, deadline: null }],
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const actions = form.actions.filter((a) => a.task.trim().length > 0);

    const payload = {
      title: form.title,
      date: form.date,
      meeting_type: form.meeting_type,
      participants: form.participants,
      discussion: form.discussion,
      result: form.result,
      actions,
    };

    if (editing) {
      await update(editing.id, payload);
    } else {
      await create(payload);
    }

    setIsFormOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const changePage = (next: number) => {
    const target = Math.min(Math.max(1, next), totalPages);
    setPage(target);
    setParams({ search, meeting_type: typeFilter || undefined, page: target, limit });
  };

  const updateAction = (index: number, key: keyof MeetingActionInput, value: string) => {
    setForm((prev) => ({
      ...prev,
      actions: prev.actions.map((item, i) => {
        if (i !== index) return item;
        if (key === 'task') return { ...item, task: value };
        return { ...item, [key]: value || null };
      }),
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notulensi</h1>
          <p className="text-sm text-gray-500">Catatan meeting mingguan atau bulanan + export PDF</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90">
          <Plus size={16} /> Tambah Notulensi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari judul meeting..." className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-200" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as MeetingType | '')} className="px-3 py-2 rounded-lg border border-gray-200">
          <option value="">Semua tipe</option>
          {MEETING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" onClick={applyFilter} className="px-3 py-2 rounded-lg bg-gray-900 text-white">Terapkan</button>
      </div>

      {isFormOpen && (
        <form onSubmit={onSubmit} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
          <h2 className="font-semibold text-gray-900">{editing ? 'Edit Notulensi' : 'Tambah Notulensi'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Judul meeting" className="px-3 py-2 rounded-lg border border-gray-200 md:col-span-2" required />
            <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-200" required />
            <select value={form.meeting_type} onChange={(e) => setForm((p) => ({ ...p, meeting_type: e.target.value as MeetingType }))} className="px-3 py-2 rounded-lg border border-gray-200">
              {MEETING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={form.participants} onChange={(e) => setForm((p) => ({ ...p, participants: e.target.value }))} placeholder="Peserta (pisahkan dengan koma)" className="px-3 py-2 rounded-lg border border-gray-200 md:col-span-2" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Topik Pembahasan</p>
            <RichTextEditor
              value={form.discussion}
              onChange={(next) => setForm((p) => ({ ...p, discussion: next }))}
              placeholder="Tuliskan topik pembahasan"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Hasil / Keputusan</p>
            <RichTextEditor
              value={form.result}
              onChange={(next) => setForm((p) => ({ ...p, result: next }))}
              placeholder="Tuliskan hasil meeting"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Action Items</p>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, actions: [...p.actions, { task: '', assigned_to: null, deadline: null }] }))}
                className="text-xs px-2 py-1 rounded border border-gray-200"
              >
                + Tambah Item
              </button>
            </div>
            {form.actions.map((item, index) => (
              <div key={`action-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input value={item.task || ''} onChange={(e) => updateAction(index, 'task', e.target.value)} placeholder="Tugas" className="px-3 py-2 rounded-lg border border-gray-200 md:col-span-2" />
                <select
                  value={item.assigned_to || ''}
                  onChange={(e) => updateAction(index, 'assigned_to', e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200"
                >
                  <option value="">Pilih PIC</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
                <input type="date" value={item.deadline || ''} onChange={(e) => updateAction(index, 'deadline', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200" />
              </div>
            ))}
          </div>

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
              <th className="text-left px-4 py-3">Judul</th>
              <th className="text-left px-4 py-3">Tipe</th>
              <th className="text-left px-4 py-3">Peserta</th>
              <th className="text-left px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{formatDate(row.date)}</td>
                <td className="px-4 py-3">{row.title}</td>
                <td className="px-4 py-3">{row.meeting_type}</td>
                <td className="px-4 py-3">{row.participants || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => navigate(`/notulensi/${row.id}`)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700"><Eye size={16} /></button>
                    <button type="button" onClick={() => exportPdf(row.id, `notulensi-${row.date}.pdf`)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700"><Download size={16} /></button>
                    <button type="button" onClick={() => openEdit(row)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700"><Edit2 size={16} /></button>
                    <button type="button" onClick={() => remove(row.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Belum ada notulensi.</td>
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
              setParams({ search, meeting_type: typeFilter || undefined, page: 1, limit: nextLimit });
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
    </div>
  );
}
