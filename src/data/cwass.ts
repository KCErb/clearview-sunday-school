import { supabase } from '@/lib/supabase';
import type {
  Answer,
  Inquiry,
  Lesson,
  Question,
  QuestionCategory,
  Session,
  SharedAnswer,
  SharedInquiry,
  SharePref,
} from '@/lib/types';

// ---- sessions & lessons ----------------------------------------------------
/** The session shown to the class: the latest published one (KC controls via publish). */
export async function currentSession(): Promise<Session | null> {
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('is_published', true)
    .order('teach_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Session) ?? null;
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
  category: QuestionCategory;
  prompt: string;
  reference_url: string | null;
  sort_order: number;
}) {
  return supabase.from('questions').insert(p);
}

export function updateQuestion(
  id: number,
  patch: Partial<Pick<Question, 'prompt' | 'reference_url' | 'category' | 'is_active' | 'sort_order'>>,
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
  share_pref: SharePref;
}) {
  return supabase.from('answers').insert(p);
}

export function updateAnswer(id: number, patch: Partial<Pick<Answer, 'body' | 'share_pref' | 'published'>>) {
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
  patch: Partial<Pick<Session, 'title' | 'teach_date' | 'cfm_weeks' | 'is_published' | 'image'>>,
) {
  return supabase.from('sessions').update(patch).eq('id', id);
}

export function deleteSession(id: number) {
  return supabase.from('sessions').delete().eq('id', id);
}
