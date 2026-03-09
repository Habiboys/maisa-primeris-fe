/**
 * types/api.types.ts
 * ─────────────────────────────────────────────────────────
 * Tipe-tipe generik untuk response API.
 * Semua service harus memakai tipe ini agar konsisten.
 * ─────────────────────────────────────────────────────────
 */

// Wrapper standar semua response dari backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Response untuk list dengan paginasi
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Parameter paginasi umum untuk query params
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}
