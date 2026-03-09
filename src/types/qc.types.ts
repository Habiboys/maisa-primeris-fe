/**
 * types/qc.types.ts
 * Tipe untuk modul Quality Control
 */

export type QcResultValue = 'OK' | 'Not OK' | 'N/A';
export type QcSubmissionStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface QcTemplateItem {
  id: string;
  section_id: string;
  description: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface QcTemplateSection {
  id: string;
  template_id: string;
  name: string;
  order_index: number;
  items?: QcTemplateItem[];
  created_at?: string;
  updated_at?: string;
}

export interface QcTemplate {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  sections?: QcTemplateSection[];
  created_at?: string;
  updated_at?: string;
}

export interface QcSubmissionResult {
  id: string;
  submission_id: string;
  item_id?: string | null;
  result: QcResultValue | null;
  notes?: string | null;
  photo_url?: string | null;
  templateItem?: QcTemplateItem;
  created_at?: string;
  updated_at?: string;
}

export interface QcSubmission {
  id: string;
  project_id?: string | null;
  unit_id?: string | null;
  unit_no?: string | null;
  template_id?: string | null;
  submission_date: string;
  status: QcSubmissionStatus;
  notes?: string | null;
  project?: { id: string; name: string };
  unit?: { id: string; no: string; tipe?: string; project_id?: string };
  template?: QcTemplate;
  results?: QcSubmissionResult[];
  created_at?: string;
  updated_at?: string;
}

export interface QcSubmissionInput {
  project_id: string;
  unit_id?: string | null;
  unit_no?: string | null;
  template_id: string;
  submission_date: string;
  notes?: string | null;
  status?: QcSubmissionStatus;
  results?: Array<{
    item_id?: string | null;
    template_item_id?: string | null;
    result?: QcResultValue | 'NOT OK';
    status?: QcResultValue | 'NOT OK';
    notes?: string | null;
    remarks?: string | null;
    photo_url?: string | null;
    photo?: string | null;
  }>;
}
