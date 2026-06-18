// Hand-maintained types mirroring supabase/migrations. Keep in sync with the schema.

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Lesson {
  id: number;
  cfm_week: number;
  title: string;
  week_start: string;
  week_end: string;
}

export interface Question {
  id: number;
  lesson_id: number;
  prompt: string;
  sort_order: number;
  is_active: boolean;
}

export type SharePref = 'verbatim_ok' | 'summarize_only';

// Full answer row — only KC (admin) can read these.
export interface Answer {
  id: number;
  question_id: number;
  body: string;
  is_anonymous: boolean;
  author_id: string | null;
  share_pref: SharePref;
  published: boolean;
  created_at: string;
}

// Safe, class-visible view (no author identity, only what KC published).
export interface SharedAnswer {
  id: number;
  question_id: number;
  body: string;
  share_pref: SharePref;
  created_at: string;
}

export interface Inquiry {
  id: number;
  lesson_id: number | null;
  body: string;
  is_anonymous: boolean;
  author_id: string | null;
  answer: string | null;
  published: boolean;
  created_at: string;
}

export interface SharedInquiry {
  id: number;
  lesson_id: number | null;
  body: string;
  answer: string | null;
  created_at: string;
}
