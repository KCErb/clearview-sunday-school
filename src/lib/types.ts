// Hand-maintained types mirroring supabase/migrations. Keep in sync with the schema.

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean;
  created_at: string;
}

// CFM catalog (the 52 Come, Follow Me weeks) — reference data for reading links.
export interface Lesson {
  id: number;
  cfm_week: number;
  title: string;
  week_start: string;
  week_end: string;
}

// A teaching session = a Sunday KC teaches; may span several CFM weeks.
export interface Session {
  id: number;
  title: string | null;
  teach_date: string;
  cfm_weeks: number[];
  is_published: boolean;
  created_at: string;
}

export type QuestionCategory = 'study' | 'home';

export interface Question {
  id: number;
  session_id: number;
  category: QuestionCategory;
  prompt: string;
  reference_url: string | null;
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
  edited_at: string | null;
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
  session_id: number | null;
  body: string;
  is_anonymous: boolean;
  author_id: string | null;
  answer: string | null;
  published: boolean;
  created_at: string;
}

export interface SharedInquiry {
  id: number;
  session_id: number | null;
  body: string;
  answer: string | null;
  created_at: string;
}
