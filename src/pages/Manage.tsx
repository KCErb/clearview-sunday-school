import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import {
  allInquiries,
  allSessions,
  createQuestion,
  createSession,
  questionsForSession,
  updateSession,
} from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import { FullPageSpinner } from '@/components/Spinner';
import { QuestionEditor } from '@/components/manage/QuestionEditor';
import { InquiriesPanel } from '@/components/manage/InquiriesPanel';
import type { Inquiry, Question, QuestionCategory, Session } from '@/lib/types';

const CATEGORIES: { key: QuestionCategory; label: string }[] = [
  { key: 'study', label: 'Study questions' },
  { key: 'home', label: 'Home-centered questions' },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function Manage() {
  const { signOut } = useAuth();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const loadSessions = useCallback(async () => {
    const [ss, inq] = await Promise.all([allSessions(), allInquiries()]);
    setSessions(ss);
    setInquiries(inq);
    setSelectedId((cur) => cur ?? ss[0]?.id ?? null);
    setLoading(false);
  }, []);

  const loadQuestions = useCallback(async (sessionId: number) => {
    setQuestions(await questionsForSession(sessionId));
  }, []);

  useEffect(() => {
    void (async () => {
      await loadSessions();
    })();
  }, [loadSessions]);

  useEffect(() => {
    if (selectedId == null) return;
    void (async () => {
      await loadQuestions(selectedId);
    })();
  }, [selectedId, loadQuestions]);

  const selected = sessions.find((s) => s.id === selectedId) ?? null;
  const refreshAll = useCallback(async () => {
    await loadSessions();
    if (selectedId != null) await loadQuestions(selectedId);
  }, [loadSessions, loadQuestions, selectedId]);

  async function newSession() {
    const { data, error } = await createSession({
      title: 'New session',
      teach_date: todayISO(),
      cfm_weeks: [],
      is_published: false,
    });
    if (error || !data) {
      show(error?.message ?? 'Could not create', 'info');
      return;
    }
    show('Session created (unpublished)');
    await loadSessions();
    setSelectedId((data as Session).id);
  }

  if (loading) return <FullPageSpinner />;

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-6 pb-24">
      <header className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-lg font-bold text-ink">Manage</h1>
          <Link to="/this-week" className="text-sm font-medium text-brand hover:text-brand-bright">
            ← Back to the class view
          </Link>
        </div>
        <button
          onClick={signOut}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-white hover:text-ink"
        >
          Sign out
        </button>
      </header>

      <section className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Session
          </label>
          <button
            onClick={newSession}
            className="rounded-lg border border-dashed border-sky-200 px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-brand hover:text-brand"
          >
            + New session
          </button>
        </div>
        <select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          className="mt-2 w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title || s.teach_date} {s.is_published ? '' : '(draft)'}
            </option>
          ))}
        </select>
        {selected && <SessionForm key={selected.id} session={selected} onSaved={refreshAll} />}
      </section>

      {selected && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold text-ink">Questions</h2>
          {CATEGORIES.map(({ key, label }) => (
            <div key={key} className="mb-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {label}
              </h3>
              <ul className="space-y-2">
                {questions
                  .filter((q) => q.category === key)
                  .map((q) => (
                    <QuestionEditor key={q.id} question={q} onChange={() => loadQuestions(selected.id)} />
                  ))}
              </ul>
              <AddQuestion
                sessionId={selected.id}
                category={key}
                nextOrder={questions.filter((q) => q.category === key).length + 1}
                onAdded={() => loadQuestions(selected.id)}
              />
            </div>
          ))}
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold text-ink">Questions from the class</h2>
        <InquiriesPanel inquiries={inquiries} onChange={loadSessions} />
      </section>
    </div>
  );
}

function SessionForm({ session, onSaved }: { session: Session; onSaved: () => void }) {
  const { show } = useToast();
  const [title, setTitle] = useState(session.title ?? '');
  const [teachDate, setTeachDate] = useState(session.teach_date);
  const [weeks, setWeeks] = useState(session.cfm_weeks.join(', '));
  const [published, setPublished] = useState(session.is_published);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const cfm = weeks
      .split(',')
      .map((w) => parseInt(w.trim(), 10))
      .filter((n) => !Number.isNaN(n));
    const { error } = await updateSession(session.id, {
      title: title.trim() || null,
      teach_date: teachDate,
      cfm_weeks: cfm,
      is_published: published,
    });
    setBusy(false);
    if (error) {
      show(error.message, 'info');
      return;
    }
    show('Session saved');
    onSaved();
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Sunday, June 21" />
      </Field>
      <Field label="Teaching date">
        <input type="date" value={teachDate} onChange={(e) => setTeachDate(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Come Follow Me week(s) — comma separated">
        <input value={weeks} onChange={(e) => setWeeks(e.target.value)} className={inputCls} placeholder="26, 27, 28, 29" />
      </Field>
      <div className="flex items-end gap-3">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-brand" />
          Published (visible to class)
        </label>
      </div>
      <div className="sm:col-span-2">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50"
        >
          Save session
        </button>
      </div>
    </div>
  );
}

function AddQuestion({
  sessionId,
  category,
  nextOrder,
  onAdded,
}: {
  sessionId: number;
  category: QuestionCategory;
  nextOrder: number;
  onAdded: () => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setBusy(true);
    await createQuestion({
      session_id: sessionId,
      category,
      prompt: prompt.trim(),
      reference_url: ref.trim() || null,
      sort_order: nextOrder,
    });
    setBusy(false);
    setPrompt('');
    setRef('');
    onAdded();
  }

  return (
    <form onSubmit={add} className="mt-2 space-y-2 rounded-xl border border-dashed border-sky-200 p-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        placeholder={`Add a ${category === 'home' ? 'home-centered' : 'study'} question…`}
        className={inputCls}
      />
      <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Reference URL (optional)" className={inputCls} />
      <button
        type="submit"
        disabled={busy || !prompt.trim()}
        className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50"
      >
        Add question
      </button>
    </form>
  );
}

const inputCls =
  'w-full resize-y rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
