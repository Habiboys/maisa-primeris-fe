/**
 * lib/config.ts
 * ─────────────────────────────────────────────────────────
 * Konfigurasi global aplikasi.
 *
 * USE_MOCK_DATA:
 *   true  → semua modul memakai data dummy dari mockData.ts
 *           (berguna saat backend belum siap / tidak ada koneksi)
 *   false → semua modul memanggil API asli
 *
 * Cara mengatur lewat .env (frontend):
 *   VITE_USE_MOCK_DATA=true   ← aktifkan data dummy
 *   VITE_USE_MOCK_DATA=false  ← pakai API asli (default)
 *
 * Atau ubah langsung di sini untuk development cepat.
 * ─────────────────────────────────────────────────────────
 */

export const USE_MOCK_DATA: boolean =
  import.meta.env.VITE_USE_MOCK_DATA === 'true' || false;

/** Base URL API — diambil dari .env atau fallback ke localhost */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
