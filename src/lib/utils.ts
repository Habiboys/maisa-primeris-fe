/**
 * lib/utils.ts
 * ─────────────────────────────────────────────────────────
 * Kumpulan fungsi utilitas yang dipakai di seluruh komponen.
 * Tidak ada state/React di sini — murni fungsi JavaScript.
 * ─────────────────────────────────────────────────────────
 */

// ── Format Rupiah ─────────────────────────────────────────────
/**
 * Mengubah angka menjadi format Rupiah.
 * @example formatRupiah(45000000) → "Rp 45.000.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// ── Format Tanggal ───────────────────────────────────────────
/**
 * Mengubah string ISO tanggal menjadi format Indonesia.
 * @example formatDate('2026-02-26') → "26 Feb 2026"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format tanggal + jam.
 * @example formatDateTime('2026-02-26T14:30:00') → "26 Feb 2026, 14:30"
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Format Angka Singkat ─────────────────────────────────────
/**
 * Menyingkat angka besar untuk dashboard KPI.
 * @example formatShortNumber(1200000000) → "1,2M"
 */
export function formatShortNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}M`;
  if (num >= 1_000_000)     return `${(num / 1_000_000).toFixed(1).replace('.0', '')}Jt`;
  if (num >= 1_000)         return `${(num / 1_000).toFixed(0)}Rb`;
  return String(num);
}

// ── Persentase ───────────────────────────────────────────────
/**
 * Menghitung persentase dan membatasi hasilnya 0-100.
 * @example calcPercent(45, 120) → 37.5
 */
export function calcPercent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

// ── Ambil Pesan Error ────────────────────────────────────────
/**
 * Mengekstrak pesan error dari response axios atau Error biasa.
 * Dipakai di hooks untuk tampilkan toast error.
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as {
      response?: {
        data?: {
          message?: string;
          error?: string;
          errors?: string[] | string;
        };
      };
    };
    const data = axiosErr.response?.data;
    const detailList = data?.errors;
    if (detailList) {
      const joined = Array.isArray(detailList)
        ? detailList.filter(Boolean).join(' ')
        : String(detailList);
      if (joined.trim()) {
        return [data?.message, joined].filter(Boolean).join(' — ');
      }
    }
    return (
      data?.message ??
      data?.error ??
      'Terjadi kesalahan pada server'
    );
  }
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan yang tidak diketahui';
}

// ── Sanitasi Query Params ────────────────────────────────────
/**
 * Menghapus key yang nilainya undefined/null/string kosong
 * sebelum dikirim sebagai query parameter.
 */
export function cleanParams(params: Record<string, unknown>): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== '',
    ),
  ) as Record<string, string | number | boolean>;
}

// ── Resolve URL aset backend ───────────────────────────────
/**
 * Ubah path relatif backend (mis. /uploads/logo.png) jadi URL absolut.
 */
export function resolveAssetUrl(assetPath?: string | null): string | null {
  if (!assetPath) return null;
  if (/^https?:\/\//i.test(assetPath)) return assetPath;

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
  const origin = new URL(apiBase).origin;
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${origin}${normalized}`;
}

// ── Konstanta Warna Status ───────────────────────────────────
export const STATUS_COLOR: Record<string, string> = {
  // QC
  Pass:    'bg-green-100 text-green-700',
  Fail:    'bg-red-100 text-red-700',
  Ongoing: 'bg-yellow-100 text-yellow-700',
  // Umum
  Aktif:   'bg-green-100 text-green-700',
  Nonaktif:'bg-gray-100 text-gray-500',
  // Lead pipeline
  Hot:     'bg-red-100 text-red-700',
  Warm:    'bg-orange-100 text-orange-700',
  Cold:    'bg-blue-100 text-blue-700',
  Closed:  'bg-green-100 text-green-700',
  Lost:    'bg-gray-100 text-gray-500',
  // Logistik
  Pending:   'bg-yellow-100 text-yellow-700',
  Disetujui: 'bg-green-100 text-green-700',
  Ditolak:   'bg-red-100 text-red-700',
  Selesai:   'bg-purple-100 text-purple-700',
  // Proyek
  'On Progress': 'bg-blue-100 text-blue-700',
  Completed:     'bg-green-100 text-green-700',
  Delayed:       'bg-red-100 text-red-700',
};

// ── Kompresi Gambar ──────────────────────────────────────────
/**
 * Kompres gambar (File) ke ukuran maksimal (default 3 MB).
 * Mengembalikan base64 data URL (JPEG).
 */
export async function compressImage(
  file: File,
  maxBytes = 3 * 1024 * 1024,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const { width, height } = img;
      let quality = 0.85;
      let scale = 1.0;

      const compress = (): string => {
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', quality);
      };

      let result = compress();
      // Kurangi quality dulu
      while (quality > 0.3) {
        const b64 = result.split(',')[1] ?? '';
        if (b64.length * 0.75 <= maxBytes) break;
        quality = Math.max(0.3, quality - 0.1);
        result = compress();
      }
      // Lalu kurangi dimensi jika masih terlalu besar
      while (scale > 0.2) {
        const b64 = result.split(',')[1] ?? '';
        if (b64.length * 0.75 <= maxBytes) break;
        scale = Math.max(0.2, scale - 0.15);
        result = compress();
      }
      resolve(result);
    };
    img.src = objectUrl;
  });
}

/**
 * Kompres gambar (File) ke ukuran maksimal dan kembalikan sebagai File JPEG.
 */
export async function compressImageToFile(
  file: File,
  maxBytes = 3 * 1024 * 1024,
): Promise<File> {
  const base64 = await compressImage(file, maxBytes);
  const res = await fetch(base64);
  const blob = await res.blob();
  const newName = file.name.replace(/\.[^.]+$/, '.jpg');
  return new File([blob], newName, { type: 'image/jpeg' });
}
