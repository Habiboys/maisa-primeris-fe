export type DateIdFormatOptions = Intl.DateTimeFormatOptions;

const DEFAULT_DATE_ID_OPTIONS: DateIdFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

export function formatDateId(input?: string | Date | null, options: DateIdFormatOptions = DEFAULT_DATE_ID_OPTIONS): string {
  if (!input) return '-';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', options);
}

const DEFAULT_DATETIME_ID_OPTIONS: DateIdFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

/** Tanggal + jam (locale id-ID), untuk log / last update. */
export function formatDateTimeId(input?: string | Date | null, options: DateIdFormatOptions = DEFAULT_DATETIME_ID_OPTIONS): string {
  if (!input) return '-';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', options);
}

