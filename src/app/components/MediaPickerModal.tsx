import { Search, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { useMedia } from '../../hooks';
import { resolveAssetUrl } from '../../lib/utils';
import type { MediaAsset } from '../../types';
import { ImageWithFallback } from './figma/ImageWithFallback';

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

const getCroppedImageFile = async (source: string, crop: Area, name = 'gallery-crop.jpg'): Promise<File> => {
  const image = await createImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia');

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Gagal memproses crop gambar'));
    }, 'image/jpeg', 0.92);
  });

  const safeName = (name || 'gallery-crop').replace(/\.[^.]+$/, '');
  return new File([blob], `${safeName}.jpg`, { type: 'image/jpeg' });
};

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaAsset) => void;
  category?: string;
}

export function MediaPickerModal({ open, onClose, onSelect, category }: MediaPickerModalProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState('');
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState('gallery-crop.jpg');
  const [cropPoint, setCropPoint] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const { items, isLoading, upload } = useMedia({ page: 1, limit: 24, category });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Pilih dari Gallery & Crop</h3>
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
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const objectUrl = URL.createObjectURL(file);
              setCropSource(objectUrl);
              setCropFileName(file.name || 'gallery-crop.jpg');
              setCropPoint({ x: 0, y: 0 });
              setZoom(1);
              setCroppedAreaPixels(null);
              setCropOpen(true);
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
                  onClick={() => {
                    const fullUrl = resolveAssetUrl(item.file_path) || '';
                    setCropSource(fullUrl);
                    setCropFileName(item.original_name || item.stored_name || 'gallery-crop.jpg');
                    setCropPoint({ x: 0, y: 0 });
                    setZoom(1);
                    setCroppedAreaPixels(null);
                    setCropOpen(true);
                  }}
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
          <p className="text-xs text-gray-500">Pilih gambar lalu crop sesuai kebutuhan.</p>
        </div>
      </div>

      {cropOpen && cropSource && (
        <div className="fixed inset-0 z-[210] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Crop Gambar (Wajib)</h4>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(cropSource);
                  setCropOpen(false);
                  setCropSource(null);
                  setCroppedAreaPixels(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative h-[420px] bg-gray-900">
              <Cropper
                image={cropSource}
                crop={cropPoint}
                zoom={zoom}
                aspect={undefined}
                onCropChange={setCropPoint}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            </div>

            <div className="px-4 py-3 border-t border-gray-200 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-12">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(cropSource);
                    setCropOpen(false);
                    setCropSource(null);
                    setCroppedAreaPixels(null);
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!croppedAreaPixels}
                  onClick={async () => {
                    if (!croppedAreaPixels) return;
                    const cropped = await getCroppedImageFile(cropSource, croppedAreaPixels, cropFileName);
                    const uploadedAsset = await upload({ file: cropped, category });
                    URL.revokeObjectURL(cropSource);
                    setCropOpen(false);
                    setCropSource(null);
                    setCroppedAreaPixels(null);
                    if (uploadedAsset) {
                      onSelect(uploadedAsset);
                      onClose();
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
                >
                  Upload Hasil Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
