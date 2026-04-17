import { Search, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useMedia } from '../../hooks';
import { resolveAssetUrl } from '../../lib/utils';
import type { MediaAsset } from '../../types';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaAsset) => void;
  category?: string;
}

export function MediaPickerModal({ open, onClose, onSelect, category }: MediaPickerModalProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState('');
  const { items, isLoading, upload } = useMedia({ page: 1, limit: 24, category });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Pilih dari Gallery & Upload</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari media..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const uploadedAsset = await upload({ file, category });
              if (uploadedAsset) {
                onSelect(uploadedAsset);
                onClose();
              }
              e.currentTarget.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-white"
          >
            <Upload size={16} /> Upload Gambar
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <p className="text-sm text-gray-500">Memuat gallery...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada media. Upload gambar untuk melanjutkan.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="relative rounded-lg border border-gray-200 overflow-hidden hover:ring-2 hover:ring-primary/20 transition"
                >
                  <ImageWithFallback
                    src={resolveAssetUrl(item.file_path) || ''}
                    alt={item.original_name || item.stored_name}
                    className="w-full aspect-square object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">Pilih gambar dari gallery atau upload file baru.</p>
        </div>
      </div>
    </div>
  );
}
