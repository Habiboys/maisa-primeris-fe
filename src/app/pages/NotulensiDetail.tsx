import { ArrowLeft, Download } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMeetingNoteDetail, useMeetingNotes } from '../../hooks';
import { formatDate } from '../../lib/utils';
import { RichTextEditor } from '../components/RichTextEditor';

export function NotulensiDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { item, isLoading } = useMeetingNoteDetail(id);
  const { exportPdf } = useMeetingNotes();

  if (isLoading) {
    return <div className="text-sm text-gray-500">Memuat detail notulensi...</div>;
  }

  if (!item) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => navigate('/notulensi')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Kembali
        </button>
        <p className="text-sm text-gray-500">Data notulensi tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => navigate('/notulensi')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Kembali ke Notulensi
        </button>
        <button
          type="button"
          onClick={() => exportPdf(item.id, `notulensi-${item.date}.pdf`)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm"
        >
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
          <p className="text-sm text-gray-500">{formatDate(item.date)} • {item.meeting_type}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Peserta</p>
            <p className="font-medium text-gray-900 whitespace-pre-wrap">{item.participants || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500">Dibuat oleh</p>
            <p className="font-medium text-gray-900">{item.creator?.name || '-'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Topik Pembahasan</p>
          <RichTextEditor value={item.discussion || ''} readOnly />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Hasil / Keputusan</p>
          <RichTextEditor value={item.result || ''} readOnly />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Action Items</p>
          {!item.actions?.length ? (
            <p className="text-sm text-gray-500">Tidak ada action items.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">Tugas</th>
                    <th className="text-left px-3 py-2">PIC</th>
                    <th className="text-left px-3 py-2">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {item.actions.map((action) => (
                    <tr key={action.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">{action.task}</td>
                      <td className="px-3 py-2">{action.assignee?.name || '-'}</td>
                      <td className="px-3 py-2">{action.deadline ? formatDate(action.deadline) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
