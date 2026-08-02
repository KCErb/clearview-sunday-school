import { supabase } from '@/lib/supabase';
import type {
  Answer,
  Inquiry,
  Insight,
  Lesson,
  LiveOption,
  LivePrompt,
  LiveResponse,
  LiveTallyRow,
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

// ---- live prompts ----------------------------------------------------------
/** How long a heartbeat counts as "still here" (must exceed the /live poll interval). */
export const PRESENCE_WINDOW_MS = 30_000;

/** The session currently in live mode, if any. Readable by the class (RLS allows is_live). */
export async function liveSession(): Promise<Session | null> {
  const { data } = await supabase.from('sessions').select('*').eq('is_live', true).maybeSingle();
  return (data as Session) ?? null;
}

/** The one open prompt, if any. */
export async function openPrompt(): Promise<LivePrompt | null> {
  const { data } = await supabase
    .from('live_prompts')
    .select('*')
    .eq('status', 'open')
    .maybeSingle();
  return (data as LivePrompt) ?? null;
}

/**
 * What /live should show: the most recently opened prompt, open or closed. RLS already
 * limits this to the live session, so a just-closed prompt keeps its revealed tally on
 * screen until KC opens the next one (vanishing mid-read looks like a bug).
 */
export async function currentClassPrompt(): Promise<LivePrompt | null> {
  const { data } = await supabase
    .from('live_prompts')
    .select('*')
    .in('status', ['open', 'closed'])
    .order('opened_at', { ascending: false, nullsFirst: false })
    .limit(1);
  return ((data as LivePrompt[]) ?? [])[0] ?? null;
}

export async function optionsForPrompt(promptId: number): Promise<LiveOption[]> {
  const { data } = await supabase
    .from('live_options')
    .select('*')
    .eq('prompt_id', promptId)
    .order('sort_order', { ascending: true });
  return (data as LiveOption[]) ?? [];
}

/** Admin: every prompt for a session, drafts included. */
export async function livePromptsForSession(sessionId: number): Promise<LivePrompt[]> {
  const { data } = await supabase
    .from('live_prompts')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true });
  return (data as LivePrompt[]) ?? [];
}

/** Admin: options for every prompt in a session, in one round trip. */
export async function optionsForSession(promptIds: number[]): Promise<LiveOption[]> {
  if (!promptIds.length) return [];
  const { data } = await supabase
    .from('live_options')
    .select('*')
    .in('prompt_id', promptIds)
    .order('sort_order', { ascending: true });
  return (data as LiveOption[]) ?? [];
}

export function createLivePrompt(p: {
  session_id: number;
  kind: LivePrompt['kind'];
  prompt: string;
  detail: string | null;
  attribution: LivePrompt['attribution'];
  sort_order: number;
}) {
  return supabase.from('live_prompts').insert(p).select().single();
}

export function updateLivePrompt(
  id: number,
  patch: Partial<Pick<LivePrompt, 'prompt' | 'detail' | 'kind' | 'attribution' | 'reveal' | 'sort_order'>>,
) {
  return supabase.from('live_prompts').update(patch).eq('id', id);
}

export function deleteLivePrompt(id: number) {
  return supabase.from('live_prompts').delete().eq('id', id);
}

export function createLiveOption(p: { prompt_id: number; label: string; sort_order: number }) {
  return supabase.from('live_options').insert(p);
}

export function updateLiveOption(id: number, patch: Partial<Pick<LiveOption, 'label' | 'sort_order'>>) {
  return supabase.from('live_options').update(patch).eq('id', id);
}

export function deleteLiveOption(id: number) {
  return supabase.from('live_options').delete().eq('id', id);
}

/**
 * Reconciles a prompt's options against a list of labels, matching by position so
 * existing rows keep their ids — a delete-and-recreate would cascade away any responses
 * already attached to them.
 */
export async function saveLiveOptions(promptId: number, labels: string[], existing: LiveOption[]) {
  const cur = [...existing].sort((a, b) => a.sort_order - b.sort_order);
  const work: Promise<unknown>[] = [];
  labels.forEach((label, i) => {
    const row = cur[i];
    if (!row) work.push(Promise.resolve(createLiveOption({ prompt_id: promptId, label, sort_order: i + 1 })));
    else if (row.label !== label || row.sort_order !== i + 1)
      work.push(Promise.resolve(updateLiveOption(row.id, { label, sort_order: i + 1 })));
  });
  cur.slice(labels.length).forEach((row) => work.push(Promise.resolve(deleteLiveOption(row.id))));
  await Promise.all(work);
}

/** Live mode on/off for a session. Turning it off also closes any open prompt. */
export function setLiveSession(sessionId: number, live: boolean) {
  return supabase.rpc('set_live_session', { p_id: sessionId, p_live: live });
}

/** Opens this prompt and closes any other. Resets `reveal` so results start private. */
export function openLivePrompt(id: number) {
  return supabase.rpc('open_live_prompt', { p_id: id });
}

export function closeLivePrompt(id: number) {
  return supabase.rpc('close_live_prompt', { p_id: id });
}

/**
 * One row per selected option (text prompts get a single row). `submission_id` ties a
 * multi-select answer together so responders stay countable without recording identity.
 */
export function submitLiveResponse(p: {
  prompt_id: number;
  option_ids: number[];
  body: string | null;
  author_id: string | null;
}) {
  const submission_id = crypto.randomUUID();
  const rows: {
    prompt_id: number;
    option_id: number | null;
    body: string | null;
    submission_id: string;
    author_id: string | null;
  }[] = p.option_ids.length
    ? p.option_ids.map((option_id) => ({
        prompt_id: p.prompt_id,
        option_id,
        body: null,
        submission_id,
        author_id: p.author_id,
      }))
    : [{ prompt_id: p.prompt_id, option_id: null, body: p.body, submission_id, author_id: p.author_id }];
  return supabase.from('live_responses').insert(rows);
}

/** The signed-in user's own rows for a prompt (named prompts only — anonymous rows are unreadable). */
export async function myLiveResponses(promptId: number, userId: string): Promise<LiveResponse[]> {
  const { data } = await supabase
    .from('live_responses')
    .select('*')
    .eq('prompt_id', promptId)
    .eq('author_id', userId);
  return (data as LiveResponse[]) ?? [];
}

/** Clears the user's own answer so they can re-submit (named prompts only). */
export function clearMyLiveResponses(promptId: number, userId: string) {
  return supabase.from('live_responses').delete().eq('prompt_id', promptId).eq('author_id', userId);
}

/** Admin: raw responses for a prompt. */
export async function liveResponses(promptId: number): Promise<LiveResponse[]> {
  const { data } = await supabase
    .from('live_responses')
    .select('*')
    .eq('prompt_id', promptId)
    .order('created_at', { ascending: false });
  return (data as LiveResponse[]) ?? [];
}

/** Class: revealed tallies only (counts, never names or bodies). */
export async function liveTally(promptId: number): Promise<LiveTallyRow[]> {
  const { data } = await supabase
    .from('live_tallies')
    .select('*')
    .eq('prompt_id', promptId)
    .order('sort_order', { ascending: true });
  return (data as LiveTallyRow[]) ?? [];
}

/**
 * Member: "I'm here" ping, so KC can gauge how much of the room is actually on the app.
 * Goes through an RPC because members have no direct privileges on live_presence — the
 * function derives the user from auth.uid(), so it can only ever write your own row.
 */
export async function markPresent() {
  // Must await: a PostgrestBuilder is lazy and never issues the request otherwise.
  const { error } = await supabase.rpc('live_heartbeat');
  if (error) console.warn('presence heartbeat failed:', error.message);
}

/** Admin: how many people have pinged within the presence window. */
export async function presentCount(): Promise<number> {
  const since = new Date(Date.now() - PRESENCE_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from('live_presence')
    .select('user_id', { count: 'exact', head: true })
    .gt('seen_at', since);
  return count ?? 0;
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
