/**
 * Status prospek (leads) — sumber tunggal di frontend.
 * Selaras dengan backend: kolom ENUM `leads.status` + `backend/src/constants/leadStatuses.js`.
 *
 * Menambah/mengubah status: update file ini, types, backend ENUM + migration, lalu seeder jika perlu.
 */
export const LEAD_STATUS_VALUES = [
  'Baru',
  'Follow-up',
  'Survey',
  'Negoisasi',
  'Deal',
  'Batal',
] as const;

export type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];

/** Untuk <select> filter / form */
export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = LEAD_STATUS_VALUES.map((value) => ({
  value,
  label: value,
}));

export function isLeadStatus(v: string): v is LeadStatus {
  return (LEAD_STATUS_VALUES as readonly string[]).includes(v);
}
