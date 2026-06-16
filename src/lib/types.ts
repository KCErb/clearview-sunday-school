// Hand-maintained types mirroring supabase/migrations. Keep in sync with the schema.

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface ScheduleWeek {
  id: number;
  week_date: string | null;
  title: string;
  reading: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export type SubmissionKind = 'answer' | 'question';

export interface Submission {
  id: number;
  user_id: string;
  kind: SubmissionKind;
  body: string;
  media_path: string | null;
  created_at: string;
}
