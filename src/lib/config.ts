/**
 * lib/config.ts
 * Konfigurasi global aplikasi.
 * Seluruh modul memakai API (tidak ada mode mock/dummy di runtime).
 */

/** Base URL API — diambil dari .env atau fallback ke localhost */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
