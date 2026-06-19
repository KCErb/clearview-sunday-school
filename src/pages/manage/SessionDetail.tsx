import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  answerCounts,
  createQuestion,
  deleteQuestion,
  deleteSession,
  getSession,
  questionsForSession,
  updateQuestion,
  updateSession,
} from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { FullPageSpinner } from '@/components/Spinner';
import { ART_LIBRARY } from '@/lib/art';
import type { AnswerCounts } from '@/data/cwass';
import type { Question, QuestionCategory, Session } from '@/lib/types';

const CATEGORIES: { key: QuestionCategory; label: string }[] = [
  { key: 'study', label: 'Study questions' },
  { key: 'home', label: 'Home-centered questions' },
];

const inputCls =
  'w-full resize-y rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

export function SessionDetail() {
  const { id } = useParams();
  const sessionId = Number(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [counts, setCounts] = useState<Record<number, AnswerCounts>>({});

  const load = useCallback(async () => {
    const [s, qs, ac] = await Promise.all([
      getSession(sessionId),
      questionsForSession(sessionId),
      answerCounts(),
    ]);
    setSession(s);
    setQuestions(qs);
    setCounts(ac);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  if (loading) return <FullPageSpinner />;
  if (!session) {
    return (
      <ManageLayout>
        <p className="text-ink-soft">Session not found.</p>
        <Link to="/manage" className="mt-3 inline-block font-semibold text-brand">
          ← All sessions
        </Link>
      </ManageLayout>
    );
  }

  return (
    <ManageLayout>
      <Link to="/manage" className="text-sm font-medium text-brand hover:text-brand-bright">
        ← All sessions
      </Link>

      <SessionForm
        key={session.id}
        session={session}
        onSaved={load}
        onDeleted={() => navigate('/manage')}
      />

      <h2 className="mt-8 text-lg font-bold text-ink">Questions</h2>
      {CATEGORIES.map(({ key, label }) => {
        const qs = questions.filter((q) => q.category === key);
        return (
          <section key={key} className="mt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {label}
            </h3>
            <ul className="space-y-2">
              {qs.map((q) => (
                <QuestionRow key={q.id} question={q} counts={counts[q.id]} onChange={load} />
              ))}
              {qs.length === 0 && (
                <li className="text-sm text-ink-faint">None yet.</li>
              )}
            </ul>
            <AddQuestion
              sessionId={session.id}
              category={key}
              nextOrder={qs.length + 1}
              onAdded={load}
            />
          </section>
        );
      })}
    </ManageLayout>
  );
}

function SessionForm({
  session,
  onSaved,
  onDeleted,
}: {
  session: Session;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const { show } = useToast();
  const [title, setTitle] = useState(session.title ?? '');
  const [teachDate, setTeachDate] = useState(session.teach_date);
  const [weeks, setWeeks] = useState(session.cfm_weeks.join(', '));
  const [published, setPublished] = useState(session.is_published);
  const [image, setImage] = useState<string | null>(session.image);
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
      image,
    });
    setBusy(false);
    if (error) return show(error.message, 'info');
    show('Session saved');
    onSaved();
  }

  async function remove() {
    if (!window.confirm('Delete this whole session, its questions, and responses?')) return;
    const { error } = await deleteSession(session.id);
    if (error) return show(error.message, 'info');
    show('Session deleted');
    onDeleted();
  }

  return (
    <section className="mt-4 rounded-2xl border border-sky-100 bg-white/80 p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Sunday, July 19" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">Teaching date</span>
          <input type="date" value={teachDate} onChange={(e) => setTeachDate(e.target.value)} className={inputCls} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-ink-soft">
            Come, Follow Me week(s) — comma separated
          </span>
          <input value={weeks} onChange={(e) => setWeeks(e.target.value)} className={inputCls} placeholder="26, 27, 28, 29" />
        </label>
      </div>

      <div className="mt-4">
        <span className="mb-2 block text-xs font-medium text-ink-soft">
          Artwork (public domain) — shown on the lesson header
        </span>
        <ArtPicker value={image} onChange={setImage} />
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-brand" />
        Published (visible to the class)
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50"
        >
          Save session
        </button>
        <button onClick={remove} className="text-sm font-semibold text-red-600 hover:text-red-700">
          Delete session
        </button>
      </div>
    </section>
  );
}

function ArtPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const isCustom = !!value && (value.startsWith('http') || value.startsWith('/'));
  const baseTile = 'overflow-hidden rounded-lg border-2 transition';
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`flex h-20 items-center justify-center rounded-lg border-2 text-xs font-medium transition ${
            !value ? 'border-brand bg-brand/5 text-brand' : 'border-sky-100 text-ink-soft hover:border-brand/40'
          }`}
        >
          None
        </button>
        {ART_LIBRARY.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => onChange(a.key)}
            title={`${a.title} — ${a.artist}`}
            className={`${baseTile} ${value === a.key ? 'border-brand ring-2 ring-brand/30' : 'border-transparent hover:border-brand/40'}`}
          >
            <img src={a.src} alt={a.title} className="h-20 w-full object-cover object-top" />
          </button>
        ))}
      </div>
      <input
        value={isCustom ? value : ''}
        onChange={(e) => onChange(e.target.value.trim() || null)}
        placeholder="…or paste a public-domain image URL"
        className={`${inputCls} mt-2`}
      />
    </div>
  );
}

function QuestionRow({
  question,
  counts,
  onChange,
}: {
  question: Question;
  counts?: AnswerCounts;
  onChange: () => void;
}) {
  const { show } = useToast();
  async function toggle() {
    await updateQuestion(question.id, { is_active: !question.is_active });
    onChange();
  }
  async function remove() {
    if (!window.confirm('Delete this question and its responses?')) return;
    await deleteQuestion(question.id);
    show('Question deleted');
    onChange();
  }
  return (
    <li className="rounded-xl border border-sky-100 bg-white/80 p-3 shadow-sm">
      <p className={`text-sm ${question.is_active ? 'text-ink' : 'text-ink-faint line-through'}`}>
        {question.prompt}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <Link to={`/manage/q/${question.id}`} className="font-semibold text-brand hover:text-brand-bright">
          Edit &amp; manage responses
          {counts ? ` (${counts.total}` : ''}
          {counts && counts.unpublished > 0 ? ` · ${counts.unpublished} to review` : ''}
          {counts ? ')' : ''} →
        </Link>
        <button onClick={toggle} className="font-medium text-ink-soft hover:text-ink">
          {question.is_active ? 'Hide from class' : 'Show to class'}
        </button>
        <button onClick={remove} className="font-semibold text-red-600 hover:text-red-700">
          Delete
        </button>
      </div>
    </li>
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
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 rounded-lg border border-dashed border-sky-200 px-3 py-2 text-xs font-medium text-ink-soft transition hover:border-brand hover:text-brand"
      >
        + Add a {category === 'home' ? 'home-centered' : 'study'} question
      </button>
    );
  }

  return (
    <form onSubmit={add} className="mt-2 space-y-2 rounded-xl border border-dashed border-sky-200 p-3">
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} autoFocus placeholder="Question prompt…" className={inputCls} />
      <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Reference URL (optional)" className={inputCls} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !prompt.trim()} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50">
          Add question
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
