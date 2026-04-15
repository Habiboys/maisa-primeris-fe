import { ImagePlus, Search, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useMedia } from '../../hooks';
import { formatDateTime, resolveAssetUrl } from '../../lib/utils';
import { ImagePreviewModal } from '../components/ImagePreviewModal';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function MediaGallery() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [imagePreview, setImagePreview] = useState<{ src: string; title: string } | null>(null);

  const { items, pagination, isLoading, setParams, upload, remove } = useMedia({ page: 1, limit: 20 });

  const applySearch = () => {
    setPage(1);
    setParams({ page: 1, limit, search });
  };

  const changePage = (next: number) => {
    const total = pagination?.total_pages ?? 1;
    const target = Math.max(1, Math.min(total, next));
    setPage(target);
    setParams({ page: target, limit, search });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-sm text-gray-500">Semua upload gambar terpusat. Maks 2MB, dikompres server ke target ±500KB.</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            await upload({ file });
            e.currentTarget.value = '';
          }}
        />
        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white">
          <ImagePlus size={16} /> Upload Gambar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama file..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200"
          />
        </div>
        <button type="button" onClick={applySearch} className="px-3 py-2 rounded-lg bg-gray-900 text-white">Terapkan</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Memuat gallery...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada media.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setImagePreview({ src: resolveAssetUrl(item.file_path) || '', title: item.original_name || item.stored_name })}>
                  <ImageWithFallback
                    src={resolveAssetUrl(item.file_path) || ''}
                    alt={item.original_name || item.stored_name}
                    className="w-full aspect-square object-cover"
                  />
                </div>
                <div className="p-2 space-y-1">
                  <p className="text-xs font-medium text-gray-900 truncate" title={item.original_name || item.stored_name}>
                    {item.original_name || item.stored_name}
                  </p>
                  <p className="text-[11px] text-gray-500">{(item.size_bytes / 1024).toFixed(0)} KB</p>
                  <p className="text-[11px] text-gray-500">{formatDateTime(item.created_at)}</p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>View per page</span>
          <select
            value={limit}
            onChange={(e) => {
              const next = Number(e.target.value);
              setLimit(next);
              setPage(1);
              setParams({ page: 1, limit: next, search });
            }}
            className="px-2 py-1 rounded border border-gray-200"
          >
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => changePage(page - 1)} className="px-3 py-1.5 rounded border border-gray-200" disabled={page <= 1}>Sebelumnya</button>
          <span>Hal. {page} / {pagination?.total_pages ?? 1}</span>
          <button type="button" onClick={() => changePage(page + 1)} className="px-3 py-1.5 rounded border border-gray-200" disabled={page >= (pagination?.total_pages ?? 1)}>Selanjutnya</button>
        </div>
      </div>

      <ImagePreviewModal
        open={Boolean(imagePreview)}
        src={imagePreview?.src ?? null}
        title={imagePreview?.title ?? 'Preview Gambar'}
        downloadFileName={`media-${(imagePreview?.title ?? 'gambar').replace(/\s+/g, '-').toLowerCase()}.jpg`}
        onClose={() => setImagePreview(null)}
      />
    </div>
  );
}
