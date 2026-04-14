/**
 * Helper util untuk konten editor Quill (HTML string).
 */

export function normalizeQuillHtml(raw?: string | null): string {
  return raw ?? '';
}

export function quillHtmlToPlainText(value?: string | null): string {
  return (value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
