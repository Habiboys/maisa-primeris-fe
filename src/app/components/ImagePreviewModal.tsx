import { Download, Search, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { resolveAssetUrl } from '../../lib/utils';
import { Button } from './ui/button';

type ImagePreviewModalProps = {
  open: boolean;
  src: string | null;
  title?: string;
  onClose: () => void;
  downloadFileName?: string;
};

const normalizeImageUrl = (rawSrc: string | null): string | null => {
  if (!rawSrc) return null;
  const value = rawSrc.trim();
  if (!value) return null;

  if (
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  ) {
    return value;
  }

  return resolveAssetUrl(value) ?? value;
};

export function ImagePreviewModal({
  open,
  src,
  title = 'Preview Gambar',
  onClose,
  downloadFileName = 'gambar-qc.jpg',
}: ImagePreviewModalProps) {
  const [zoom, setZoom] = useState(1);

  const resolvedSrc = useMemo(() => normalizeImageUrl(src), [src]);

  const handleZoomIn = () => setZoom((z) => Math.min(4, Number((z + 0.2).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, Number((z - 0.2).toFixed(2))));
  const handleReset = () => setZoom(1);

  const handleDownload = async () => {
    if (!resolvedSrc) return;

    const anchor = document.createElement('a');
    anchor.rel = 'noopener';
    anchor.download = downloadFileName;

    if (resolvedSrc.startsWith('data:') || resolvedSrc.startsWith('blob:')) {
      anchor.href = resolvedSrc;
      anchor.click();
      return;
    }

    try {
      const response = await fetch(resolvedSrc);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      anchor.href = objectUrl;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // fallback ke direct link
      anchor.href = resolvedSrc;
      anchor.target = '_blank';
      anchor.click();
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleReset();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          handleReset();
          onClose();
        }}
      />

      <div className="relative w-[98vw] max-w-6xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
        <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">{title}</h3>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              handleReset();
              onClose();
            }}
            aria-label="Tutup preview"
            title="Tutup"
            className="h-8 w-8"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="px-4 py-3 border-b flex items-center gap-2 flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut size={16} /> Zoom Out
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            <Search size={16} /> Reset
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn size={16} /> Zoom In
          </Button>
          <Button type="button" size="sm" onClick={handleDownload} disabled={!resolvedSrc}>
            <Download size={16} /> Download
          </Button>
          <span className="text-xs text-gray-500 ml-auto">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="h-[72vh] bg-gray-100 overflow-auto flex items-center justify-center p-4">
          {resolvedSrc ? (
            <img
              src={resolvedSrc}
              alt={title}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="max-w-full max-h-full rounded-md shadow object-contain transition-transform duration-150"
            />
          ) : (
            <div className="text-sm text-gray-500">Gambar tidak tersedia</div>
          )}
        </div>
      </div>
    </div>
  );
}
