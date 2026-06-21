import { supabase } from '@/lib/supabase';
import type {
  Answer,
  Inquiry,
  Insight,
  Lesson,
  Question,
  SectionLink,
  Session,
  SharedAnswer,
  SharedInquiry,
  SharedInsight,
} from '@/lib/types';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---- sessions & lessons ----------------------------------------------------
/**
 * The session shown to the class: among published sessions, the latest whose block
 * (earliest CFM week) has already begun — so a published future session doesn't take
 * over until the first day of its block. Falls back to the soonest upcoming if none
 * have started yet.
 */
export async function currentSession(): Promise<Session | null> {
  const { data } = await supabase.from('sessions').select('*').eq('is_published', true);
  const sessions = (data as Session[]) ?? [];
  if (sessions.length === 0) return null;

  const weeks = [...new Set(sessions.flatMap((s) => s.cfm_weeks))];
  const lessons = await lessonsForWeeks(weeks);
  const startByWeek = new Map(lessons.map((l) => [l.cfm_week, l.week_start]));

  const today = todayISO();
  const withStart = sessions.map((s) => {
    const starts = s.cfm_weeks
      .map((w) => startByWeek.get(w))
      .filter((d): d is string => !!d);
    const blockStart = starts.length ? starts.slice().sort()[0] : s.teach_date;
    return { s, blockStart };
  });

  const started = withStart
    .filter((x) => x.blockStart <= today)
    .sort((a, b) => b.blockStart.localeCompare(a.blockStart));
  if (started.length) return started[0].s;

  const upcoming = withStart.slice().sort((a, b) => a.blockStart.localeCompare(b.blockStart));
  return upcoming[0]?.s ?? null;
}

export async function getSession(id: number): Promise<Session | null> {
  const { data } = await supabase.from('sessions').select('*').eq('id', id).maybeSingle();
  return (data as Session) ?? null;
}

export async function allSessions(): Promise<Session[]> {
  const { data } = await supabase.from('sessions').select('*').order('teach_date', { ascending: false });
  return (data as Session[]) ?? [];
}

/** CFM catalog rows for the given week numbers (for reading links). */
export async function lessonsForWeeks(weeks: number[]): Promise<Lesson[]> {
  if (!weeks.length) return [];
  const { data } = await supabase
    .from('lessons')
    .select('*')
    .in('cfm_week', weeks)
    .order('cfm_week', { ascending: true });
  return (data as Lesson[]) ?? [];
}

export async function allLessons(): Promise<Lesson[]> {
  const { data } = await supabase.from('lessons').select('*').order('cfm_week', { ascending: true });
  return (data as Lesson[]) ?? [];
}

// ---- questions -------------------------------------------------------------
export async function questionsForSession(sessionId: number): Promise<Question[]> {
  const { data } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', sessionId)
    .order('category', { ascending: false }) // 'study' before 'home'
    .order('sort_order', { ascending: true });
  return (data as Question[]) ?? [];
}

export async function getQuestion(id: number): Promise<Question | null> {
  const { data } = await supabase.from('questions').select('*').eq('id', id).maybeSingle();
  return (data as Question) ?? null;
}

/** Admin: all member profiles, as a map of user id → display name. */
export async function nameMap(): Promise<Record<string, string>> {
  const { data } = await supabase.from('profiles').select('id, first_name, last_name');
  const out: Record<string, string> = {};
  for (const p of (data as { id: string; first_name: string | null; last_name: string | null }[]) ?? []) {
    out[p.id] = [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || 'Member';
  }
  return out;
}

/** Admin: every question across all sessions (for the manage overview). */
export async function allQuestions(): Promise<Question[]> {
  const { data } = await supabase
    .from('questions')
    .select('*')
    .order('category', { ascending: false })
    .order('sort_order', { ascending: true });
  return (data as Question[]) ?? [];
}

export interface AnswerCounts {
  total: number;
  unpublished: number;
  edited: number;
}

/** Admin: per-question answer counts (total, awaiting-share, edited-pending). */
export async function answerCounts(): Promise<Record<number, AnswerCounts>> {
  const { data } = await supabase.from('answers').select('question_id, published, edited_at');
  const rows = (data as { question_id: number; published: boolean; edited_at: string | null }[]) ?? [];
  const out: Record<number, AnswerCounts> = {};
  for (const r of rows) {
    const e = (out[r.question_id] ??= { total: 0, unpublished: 0, edited: 0 });
    e.total += 1;
    if (!r.published) e.unpublished += 1;
    if (r.edited_at && !r.published) e.edited += 1;
  }
  return out;
}

export function createQuestion(p: {
  session_id: number;
  cfm_week: number | null;
  prompt: string;
  reference_url: string | null;
  sort_order: number;
}) {
  return supabase
    .from('questions')
    .insert({ ...p, category: p.cfm_week == null ? 'home' : 'study' });
}

export function updateQuestion(
  id: number,
  patch: Partial<Pick<Question, 'prompt' | 'reference_url' | 'category' | 'cfm_week' | 'is_active' | 'sort_order'>>,
) {
  return supabase.from('questions').update(patch).eq('id', id);
}

export function deleteQuestion(id: number) {
  return supabase.from('questions').delete().eq('id', id);
}

// ---- answers ---------------------------------------------------------------
export async function sharedAnswers(questionId: number): Promise<SharedAnswer[]> {
  const { data } = await supabase
    .from('shared_answers')
    .select('*')
    .eq('question_id', questionId)
    .order('created_at', { ascending: true });
  return (data as SharedAnswer[]) ?? [];
}

/** The signed-in user's own (identified) answers to a question. */
export async function myAnswers(questionId: number, userId: string): Promise<Answer[]> {
  const { data } = await supabase
    .from('answers')
    .select('*')
    .eq('question_id', questionId)
    .eq('author_id', userId)
    .order('created_at', { ascending: false });
  return (data as Answer[]) ?? [];
}

/** Admin only: every answer across several questions (named + anonymous). */
export async function answersForQuestions(questionIds: number[]): Promise<Answer[]> {
  if (!questionIds.length) return [];
  const { data } = await supabase
    .from('answers')
    .select('*')
    .in('question_id', questionIds)
    .order('created_at', { ascending: true });
  return (data as Answer[]) ?? [];
}

/** Admin only: every answer to a question (named + anonymous). */
export async function allAnswers(questionId: number): Promise<Answer[]> {
  const { data } = await supabase
    .from('answers')
    .select('*')
    .eq('question_id', questionId)
    .order('created_at', { ascending: true });
  return (data as Answer[]) ?? [];
}

export function submitAnswer(p: {
  question_id: number;
  body: string;
  is_anonymous: boolean;
  author_id: string | null;
  attribution_ok: boolean;
}) {
  return supabase.from('answers').insert(p);
}

export function updateAnswer(id: number, patch: Partial<Pick<Answer, 'body' | 'attribution_ok'>>) {
  return supabase.from('answers').update(patch).eq('id', id);
}

export function deleteAnswer(id: number) {
  return supabase.from('answers').delete().eq('id', id);
}

// ---- inquiries -------------------------------------------------------------
export async function sharedInquiries(): Promise<SharedInquiry[]> {
  const { data } = await supabase
    .from('shared_inquiries')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as SharedInquiry[]) ?? [];
}

export async function allInquiries(): Promise<Inquiry[]> {
  const { data } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as Inquiry[]) ?? [];
}

export function submitInquiry(p: {
  session_id: number | null;
  body: string;
  is_anonymous: boolean;
  author_id: string | null;
}) {
  return supabase.from('inquiries').insert(p);
}

export function updateInquiry(id: number, patch: Partial<Pick<Inquiry, 'answer' | 'published'>>) {
  return supabase.from('inquiries').update(patch).eq('id', id);
}

export function deleteInquiry(id: number) {
  return supabase.from('inquiries').delete().eq('id', id);
}

// ---- section links (CFM manual is derived; these are extra, e.g. talks) -----
export async function sectionLinks(sessionId: number): Promise<SectionLink[]> {
  const { data } = await supabase
    .from('section_links')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true });
  return (data as SectionLink[]) ?? [];
}

export function createSectionLink(p: {
  session_id: number;
  cfm_week: number | null;
  label: string;
  url: string;
  sort_order: number;
}) {
  return supabase.from('section_links').insert(p);
}

export function updateSectionLink(id: number, patch: Partial<Pick<SectionLink, 'label' | 'url' | 'sort_order'>>) {
  return supabase.from('section_links').update(patch).eq('id', id);
}

export function deleteSectionLink(id: number) {
  return supabase.from('section_links').delete().eq('id', id);
}

// ---- insights (open-ended "share with the class", per section) --------------
export async function sharedInsights(sessionId: number): Promise<SharedInsight[]> {
  const { data } = await supabase
    .from('shared_insights')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  return (data as SharedInsight[]) ?? [];
}

export async function myInsights(sessionId: number, userId: string): Promise<Insight[]> {
  const { data } = await supabase
    .from('insights')
    .select('*')
    .eq('session_id', sessionId)
    .eq('author_id', userId)
    .order('created_at', { ascending: false });
  return (data as Insight[]) ?? [];
}

export async function allInsights(sessionId: number): Promise<Insight[]> {
  const { data } = await supabase
    .from('insights')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  return (data as Insight[]) ?? [];
}

export function submitInsight(p: {
  session_id: number;
  cfm_week: number | null;
  body: string;
  is_anonymous: boolean;
  author_id: string | null;
  attribution_ok: boolean;
}) {
  return supabase.from('insights').insert(p);
}

export function updateInsight(id: number, patch: Partial<Pick<Insight, 'body' | 'attribution_ok'>>) {
  return supabase.from('insights').update(patch).eq('id', id);
}

export function deleteInsight(id: number) {
  return supabase.from('insights').delete().eq('id', id);
}

// ---- session admin ---------------------------------------------------------
export function createSession(p: {
  title: string | null;
  teach_date: string;
  cfm_weeks: number[];
  is_published: boolean;
}) {
  return supabase.from('sessions').insert(p).select().single();
}

export function updateSession(
  id: number,
  patch: Partial<Pick<Session, 'title' | 'teach_date' | 'cfm_weeks' | 'is_published' | 'image' | 'section_art'>>,
) {
  return supabase.from('sessions').update(patch).eq('id', id);
}

export function deleteSession(id: number) {
  return supabase.from('sessions').delete().eq('id', id);
}
