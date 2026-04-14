import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLogbookDetail } from '../../hooks';
import { formatDate, resolveAssetUrl } from '../../lib/utils';
import { RichTextEditor } from '../components/RichTextEditor';

export function LogbookDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { item, isLoading } = useLogbookDetail(id);

  if (isLoading) {
    return <div className="text-sm text-gray-500">Memuat detail logbook...</div>;
  }

  if (!item) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => navigate('/logbook')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Kembali
        </button>
        <p className="text-sm text-gray-500">Data logbook tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate('/logbook')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} /> Kembali ke Logbook
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detail Logbook</h1>
          <p className="text-sm text-gray-500">{item.user?.name || '-'} • {formatDate(item.date)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Kategori</p>
            <p className="font-medium text-gray-900">{item.jobCategory?.name || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500">Progress</p>
            <p className="font-medium text-gray-900">{item.progress ?? 0}%</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-medium text-gray-900">{item.status}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Deskripsi Kegiatan</p>
          <RichTextEditor value={item.description || ''} readOnly />
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Lampiran</p>
          {!item.files?.length ? (
            <p className="text-sm text-gray-500">Tidak ada lampiran.</p>
          ) : (
            <ul className="space-y-2">
              {item.files.map((file) => {
                const href = resolveAssetUrl(file.file_path) || file.file_path;
                return (
                  <li key={file.id}>
                    <a href={href} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                      {file.file_name || file.file_path}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
