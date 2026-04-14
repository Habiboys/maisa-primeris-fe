export type LogbookStatus = 'Draft' | 'Submitted' | 'Reviewed';
export type MeetingType = 'Mingguan' | 'Bulanan';

export interface JobCategory {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface LogbookFile {
  id: string;
  logbook_id: string;
  file_path: string;
  file_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Logbook {
  id: string;
  company_id: string;
  user_id: string;
  date: string;
  job_category_id: string;
  description: string;
  progress?: number | null;
  status: LogbookStatus;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  jobCategory?: {
    id: string;
    name: string;
  };
  files?: LogbookFile[];
}

export interface LogbookListParams {
  search?: string;
  user_id?: string;
  job_category_id?: string;
  status?: LogbookStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface CreateLogbookPayload {
  date: string;
  job_category_id: string;
  description: string;
  progress?: number;
  status?: LogbookStatus;
  files?: File[];
}

export interface UpdateLogbookPayload {
  date?: string;
  job_category_id?: string;
  description?: string;
  progress?: number;
  status?: LogbookStatus;
}

export interface MeetingAction {
  id: string;
  meeting_note_id: string;
  task: string;
  assigned_to?: string | null;
  deadline?: string | null;
  created_at: string;
  updated_at: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface MeetingNote {
  id: string;
  company_id: string;
  title: string;
  date: string;
  meeting_type: MeetingType;
  participants?: string;
  discussion: string;
  result: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  actions?: MeetingAction[];
}

export interface MeetingActionInput {
  task: string;
  assigned_to?: string | null;
  deadline?: string | null;
}

export interface MeetingNoteListParams {
  search?: string;
  meeting_type?: MeetingType;
  date_from?: string;
  date_to?: string;
  created_by?: string;
  page?: number;
  limit?: number;
}

export interface CreateMeetingNotePayload {
  title: string;
  date: string;
  meeting_type: MeetingType;
  participants?: string | string[];
  discussion: string;
  result: string;
  actions?: MeetingActionInput[];
}

export interface UpdateMeetingNotePayload extends Partial<CreateMeetingNotePayload> {}
