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
  /** Live mode: the class's /live page is awake and KC can open prompts. One session at a time. */
  is_live: boolean;
  image: string | null; // legacy single image (unused; art is per-section now)
  /** Per-section art keyed by "home" or a CFM week number. */
  section_art: Record<string, SectionArt>;
  created_at: string;
}

export interface SectionArt {
  src: string; // art library key or image URL
  focalX: number; // 0–100, horizontal framing point
  focalY: number; // 0–100, vertical framing point
  zoom: number; // 1 = cover, >1 zooms in around the focal point
}

export type QuestionCategory = 'study' | 'home';

export interface Question {
  id: number;
  session_id: number;
  category: QuestionCategory;
  cfm_week: number | null; // null = home-centered section
  prompt: string;
  reference_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface SectionLink {
  id: number;
  session_id: number;
  cfm_week: number | null;
  label: string;
  url: string;
  sort_order: number;
}

export interface Insight {
  id: number;
  session_id: number;
  cfm_week: number | null;
  body: string;
  is_anonymous: boolean;
  author_id: string | null;
  attribution_ok: boolean;
  share_pref: SharePref; // legacy, unused
  published: boolean; // legacy, unused
  edited_at: string | null;
  created_at: string;
}

export interface SharedInsight {
  id: number;
  session_id: number;
  cfm_week: number | null;
  body: string;
  share_pref: SharePref;
  created_at: string;
}

export type SharePref = 'verbatim_ok' | 'summarize_only';

// Full answer row — only KC (admin) can read these.
export interface Answer {
  id: number;
  question_id: number;
  body: string;
  is_anonymous: boolean; // true = not even KC knows who
  author_id: string | null;
  attribution_ok: boolean; // true = OK to show name (and photo) in class
  share_pref: SharePref; // legacy, unused
  published: boolean; // legacy, unused
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

// ---- live prompts (in-class, real-time) ------------------------------------
export type LiveKind = 'single' | 'multi' | 'text';
/** anonymous = author_id never written (not even KC knows). named = only KC sees the name. */
export type LiveAttribution = 'anonymous' | 'named';
export type LiveStatus = 'draft' | 'open' | 'closed';

export interface LivePrompt {
  id: number;
  session_id: number;
  kind: LiveKind;
  prompt: string;
  detail: string | null;
  attribution: LiveAttribution;
  status: LiveStatus;
  reveal: boolean; // show the tally to the class (counts only — never names)
  sort_order: number;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface LiveOption {
  id: number;
  prompt_id: number;
  label: string;
  sort_order: number;
}

/** One row per selected option; submission_id ties a multi-select answer together. */
export interface LiveResponse {
  id: number;
  prompt_id: number;
  option_id: number | null;
  body: string | null;
  submission_id: string;
  author_id: string | null;
  created_at: string;
}

export interface LiveTallyRow {
  prompt_id: number;
  option_id: number;
  label: string;
  sort_order: number;
  votes: number;
}
