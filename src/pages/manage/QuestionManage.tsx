import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  allAnswers,
  deleteAnswer,
  deleteQuestion,
  getQuestion,
  getSession,
  updateAnswer,
  updateQuestion,
} from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { FullPageSpinner } from '@/components/Spinner';
import type { Answer, Question, QuestionCategory, Session } from '@/lib/types';

const inputCls =
  'w-full resize-y rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

export function QuestionManage() {
  const { id } = useParams();
  const questionId = Number(id);
  const navigate = useNavigate();
  const { show } = useToast();

  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);

  // editable fields
  const [prompt, setPrompt] = useState('');
  const [ref, setRef] = useState('');
  const [category, setCategory] = useState<QuestionCategory>('study');

  const loadAnswers = useCallback(async () => {
    setAnswers(await allAnswers(questionId));
  }, [questionId]);

  const load = useCallback(async () => {
    const q = await getQuestion(questionId);
    setQuestion(q);
    if (q) {
      setPrompt(q.prompt);
      setRef(q.reference_url ?? '');
      setCategory(q.category);
      const [s] = await Promise.all([getSession(q.session_id), loadAnswers()]);
      setSession(s);
    }
    setLoading(false);
  }, [questionId, loadAnswers]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  if (loading) return <FullPageSpinner />;
  if (!question) {
    return (
      <ManageLayout>
        <p className="text-ink-soft">Question not found.</p>
        <Link to="/manage" className="mt-3 inline-block font-semibold text-brand">
          ← All sessions
        </Link>
      </ManageLayout>
    );
  }

  async function saveQuestion() {
    if (!prompt.trim()) return;
    const { error } = await updateQuestion(questionId, {
      prompt: prompt.trim(),
      reference_url: ref.trim() || null,
      category,
    });
    if (error) return show(error.message, 'info');
    show('Question saved');
    await load();
  }

  async function removeQuestion() {
    if (!window.confirm('Delete this question and all its responses?')) return;
    const { error } = await deleteQuestion(questionId);
    if (error) return show(error.message, 'info');
    show('Question deleted');
    navigate(`/manage/s/${question!.session_id}`);
  }

  return (
    <ManageLayout>
      <Link
        to={`/manage/s/${question.session_id}`}
        className="text-sm font-medium text-brand hover:text-brand-bright"
      >
        ← {session?.title ?? 'Session'}
      </Link>

      <section className="mt-4 rounded-2xl border border-sky-100 bg-white/80 p-5 shadow-sm">
        <h1 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Question</h1>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className={`${inputCls} mt-2`} />
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="Reference URL (optional)"
          className={`${inputCls} mt-3`}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm text-ink-soft">
            Category{' '}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as QuestionCategory)}
              className="ml-1 rounded-lg border border-sky-100 bg-white px-2 py-1 text-sm text-ink outline-none focus:border-brand"
            >
              <option value="study">Study</option>
              <option value="home">Home-centered</option>
            </select>
          </label>
          <button
            onClick={saveQuestion}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-bright"
          >
            Save
          </button>
          <button onClick={removeQuestion} className="text-sm font-semibold text-red-600 hover:text-red-700">
            Delete question
          </button>
        </div>
      </section>

      <h2 className="mt-8 text-lg font-bold text-ink">
        Responses <span className="text-sm font-medium text-ink-faint">({answers.length})</span>
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Share the ones you’d like the class to see. Anonymous responses have no record of who sent
        them.
      </p>

      <ul className="mt-4 space-y-2.5">
        {answers.map((a) => (
          <ResponseRow key={a.id} answer={a} onChange={loadAnswers} />
        ))}
        {answers.length === 0 && (
          <li className="rounded-2xl border border-dashed border-sky-100 p-6 text-center text-sm text-ink-faint">
            No responses yet.
          </li>
        )}
      </ul>
    </ManageLayout>
  );
}

function ResponseRow({ answer, onChange }: { answer: Answer; onChange: () => void }) {
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  async function togglePublish() {
    setBusy(true);
    await updateAnswer(answer.id, { published: !answer.published });
    setBusy(false);
    show(answer.published ? 'Unshared' : 'Shared with class');
    onChange();
  }
  async function remove() {
    if (!window.confirm('Delete this response?')) return;
    setBusy(true);
    await deleteAnswer(answer.id);
    setBusy(false);
    show('Deleted');
    onChange();
  }

  const blocked = answer.share_pref === 'summarize_only' && !answer.published;

  return (
    <li className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
      <p className="text-sm leading-relaxed text-ink">{answer.body}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Badge cls={answer.is_anonymous ? 'bg-slate-100 text-slate-600' : 'bg-sky-100 text-brand'}>
          {answer.is_anonymous ? 'anonymous' : 'named'}
        </Badge>
        {answer.share_pref === 'summarize_only' && (
          <Badge cls="bg-amber-100 text-amber-700">don't quote — summarize</Badge>
        )}
        {answer.edited_at && !answer.published && (
          <Badge cls="bg-amber-100 text-amber-700">edited — needs re-approval</Badge>
        )}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={togglePublish}
            disabled={busy || blocked}
            title={blocked ? 'This person asked not to be quoted verbatim' : ''}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              answer.published
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-brand text-white hover:bg-brand-bright'
            }`}
          >
            {answer.published ? 'Shared ✓ (unshare)' : 'Share with class'}
          </button>
          <button onClick={remove} disabled={busy} className="text-xs font-semibold text-red-600 hover:text-red-700">
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}

function Badge({ children, cls }: { children: string; cls: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}
