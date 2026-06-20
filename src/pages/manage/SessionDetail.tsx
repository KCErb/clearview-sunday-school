import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  answerCounts,
  createQuestion,
  createSectionLink,
  deleteQuestion,
  deleteSectionLink,
  deleteSession,
  getSession,
  lessonsForWeeks,
  questionsForSession,
  sectionLinks,
  updateQuestion,
  updateSession,
} from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { ArtField } from '@/components/manage/ArtField';
import { FullPageSpinner } from '@/components/Spinner';
import { formatRange } from '@/lib/cfm';
import type { AnswerCounts } from '@/data/cwass';
import type { Lesson, Question, SectionArt, SectionLink, Session } from '@/lib/types';

const inputCls =
  'w-full resize-y rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

interface SectionRef {
  week: number | null;
  key: string;
  label: string;
  eyebrow?: string;
}

export function SessionDetail() {
  const { id } = useParams();
  const sessionId = Number(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [links, setLinks] = useState<SectionLink[]>([]);
  const [counts, setCounts] = useState<Record<number, AnswerCounts>>({});

  const load = useCallback(async () => {
    const s = await getSession(sessionId);
    setSession(s);
    if (s) {
      const [ls, qs, lk, ac] = await Promise.all([
        lessonsForWeeks(s.cfm_weeks),
        questionsForSession(sessionId),
        sectionLinks(sessionId),
        answerCounts(),
      ]);
      setLessons(ls);
      setQuestions(qs);
      setLinks(lk);
      setCounts(ac);
    }
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
        <Link to="/manage" className="mt-3 inline-block font-semibold text-brand">← All sessions</Link>
      </ManageLayout>
    );
  }

  const lessonByWeek = new Map(lessons.map((l) => [l.cfm_week, l]));
  const sections: SectionRef[] = [
    { week: null, key: 'home', label: 'Teaching & learning in our homes' },
    ...[...session.cfm_weeks]
      .sort((a, b) => b - a)
      .map((w) => {
        const lesson = lessonByWeek.get(w);
        return {
          week: w,
          key: String(w),
          label: lesson?.title ?? `Come, Follow Me — week ${w}`,
          eyebrow: lesson ? `Come, Follow Me · ${formatRange(lesson.week_start, lesson.week_end)}` : undefined,
        };
      }),
  ];

  return (
    <ManageLayout>
      <Link to="/manage" className="text-sm font-medium text-brand hover:text-brand-bright">← All sessions</Link>

      <SessionSettings key={session.id} session={session} onSaved={load} onDeleted={() => navigate('/manage')} />

      <h2 className="mt-8 text-lg font-bold text-ink">Sections</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Build each section: choose its art, add resource links, and write questions. (Edit the
        weeks in Session settings above.)
      </p>

      {sections.map((sec) => (
        <SectionEditor
          key={sec.key}
          session={session}
          section={sec}
          links={links.filter((l) => (l.cfm_week ?? null) === sec.week)}
          questions={questions.filter((q) => (q.cfm_week ?? null) === sec.week)}
          counts={counts}
          onChange={load}
        />
      ))}
    </ManageLayout>
  );
}

function SessionSettings({
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
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const cfm = weeks.split(',').map((w) => parseInt(w.trim(), 10)).filter((n) => !Number.isNaN(n));
    const { error } = await updateSession(session.id, {
      title: title.trim() || null,
      teach_date: teachDate,
      cfm_weeks: cfm,
      is_published: published,
    });
    setBusy(false);
    if (error) return show(error.message, 'info');
    show('Session saved');
    onSaved();
  }
  async function remove() {
    if (!window.confirm('Delete this whole session, its sections, and responses?')) return;
    const { error } = await deleteSession(session.id);
    if (error) return show(error.message, 'info');
    show('Session deleted');
    onDeleted();
  }

  return (
    <section className="mt-4 rounded-2xl border border-sky-100 bg-white/80 p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-ink">Session settings</h2>
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
          <span className="mb-1 block text-xs font-medium text-ink-soft">Come, Follow Me week(s) — comma separated</span>
          <input value={weeks} onChange={(e) => setWeeks(e.target.value)} className={inputCls} placeholder="26, 27, 28, 29" />
        </label>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-brand" />
        Published (visible to the class)
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50">
          Save session
        </button>
        <button onClick={remove} className="text-sm font-semibold text-red-600 hover:text-red-700">Delete session</button>
      </div>
    </section>
  );
}

function SectionEditor({
  session,
  section,
  links,
  questions,
  counts,
  onChange,
}: {
  session: Session;
  section: SectionRef;
  links: SectionLink[];
  questions: Question[];
  counts: Record<number, AnswerCounts>;
  onChange: () => void;
}) {
  const { show } = useToast();
  const currentArt = session.section_art[section.key] ?? null;

  async function setArt(v: SectionArt | null) {
    const next = { ...session.section_art };
    if (v) next[section.key] = v;
    else delete next[section.key];
    await updateSession(session.id, { section_art: next });
    show('Art updated');
    onChange();
  }

  return (
    <section className="mt-5 rounded-2xl border border-sky-100 bg-white/60 p-5 shadow-sm">
      {section.eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{section.eyebrow}</p>
      )}
      <h3 className="text-base font-bold text-ink">{section.label}</h3>

      <div className="mt-4">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Art</span>
        <ArtField value={currentArt} onChange={setArt} />
      </div>

      <div className="mt-5">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Links {section.week != null && <span className="normal-case text-ink-faint">· the Come, Follow Me manual link is added automatically</span>}
        </span>
        <LinksEditor sessionId={session.id} week={section.week} links={links} onChange={onChange} />
      </div>

      <div className="mt-5">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Questions</span>
        <ul className="space-y-2">
          {questions.map((q) => (
            <QuestionRow key={q.id} question={q} counts={counts[q.id]} onChange={onChange} />
          ))}
          {questions.length === 0 && <li className="text-sm text-ink-faint">None yet.</li>}
        </ul>
        <AddQuestion sessionId={session.id} week={section.week} nextOrder={questions.length + 1} onAdded={onChange} />
      </div>
    </section>
  );
}

function LinksEditor({
  sessionId,
  week,
  links,
  onChange,
}: {
  sessionId: number;
  week: number | null;
  links: SectionLink[];
  onChange: () => void;
}) {
  const { show } = useToast();
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;
    setBusy(true);
    await createSectionLink({ session_id: sessionId, cfm_week: week, label: label.trim(), url: url.trim(), sort_order: links.length + 1 });
    setBusy(false);
    setLabel('');
    setUrl('');
    onChange();
  }
  async function remove(id: number) {
    await deleteSectionLink(id);
    show('Link removed');
    onChange();
  }

  return (
    <div>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-brand hover:underline">
              {l.label}
            </a>
            <button onClick={() => remove(l.id)} className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700">Remove</button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-2 flex flex-wrap items-center gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Link label (e.g. a talk)" className={`${inputCls} flex-1`} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={`${inputCls} flex-1`} />
        <button type="submit" disabled={busy || !label.trim() || !url.trim()} className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50">
          Add link
        </button>
      </form>
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
    <li className="rounded-xl border border-sky-100 bg-white p-3 shadow-sm">
      <p className={`text-sm ${question.is_active ? 'text-ink' : 'text-ink-faint line-through'}`}>{question.prompt}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <Link to={`/manage/q/${question.id}`} className="font-semibold text-brand hover:text-brand-bright">
          Edit &amp; responses
          {counts ? ` (${counts.total}` : ''}
          {counts && counts.unpublished > 0 ? ` · ${counts.unpublished} to review` : ''}
          {counts ? ')' : ''} →
        </Link>
        <button onClick={toggle} className="font-medium text-ink-soft hover:text-ink">
          {question.is_active ? 'Hide from class' : 'Show to class'}
        </button>
        <button onClick={remove} className="font-semibold text-red-600 hover:text-red-700">Delete</button>
      </div>
    </li>
  );
}

function AddQuestion({
  sessionId,
  week,
  nextOrder,
  onAdded,
}: {
  sessionId: number;
  week: number | null;
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
    await createQuestion({ session_id: sessionId, cfm_week: week, prompt: prompt.trim(), reference_url: ref.trim() || null, sort_order: nextOrder });
    setBusy(false);
    setPrompt('');
    setRef('');
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-2 rounded-lg border border-dashed border-sky-200 px-3 py-2 text-xs font-medium text-ink-soft transition hover:border-brand hover:text-brand">
        + Add a question
      </button>
    );
  }
  return (
    <form onSubmit={add} className="mt-2 space-y-2 rounded-xl border border-dashed border-sky-200 p-3">
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} autoFocus placeholder="Question prompt…" className={inputCls} />
      <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Reference URL (optional)" className={inputCls} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !prompt.trim()} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50">Add question</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink">Cancel</button>
      </div>
    </form>
  );
}
