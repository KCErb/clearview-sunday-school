import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import {
  getQuestion,
  getSession,
  myAnswers,
  questionsForSession,
  sharedAnswers,
} from '@/data/cwass';
import { FullPageSpinner } from '@/components/Spinner';
import { Footer } from '@/components/Footer';
import { AnswerForm } from '@/components/thisweek/AnswerForm';
import { MyResponses } from '@/components/thisweek/MyResponses';
import type { Answer, Question, Session, SharedAnswer } from '@/lib/types';

const CATEGORY_LABEL: Record<string, string> = {
  study: 'This week’s study',
  home: 'Teaching & learning in our homes',
};

export function QuestionPage() {
  const { id } = useParams();
  const questionId = Number(id);
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [siblings, setSiblings] = useState<Question[]>([]);
  const [shared, setShared] = useState<SharedAnswer[]>([]);
  const [mine, setMine] = useState<Answer[]>([]);

  const load = useCallback(async () => {
    const q = await getQuestion(questionId);
    setQuestion(q);
    if (q) {
      const [sess, sibs, sh, mn] = await Promise.all([
        getSession(q.session_id),
        questionsForSession(q.session_id),
        sharedAnswers(q.id),
        userId ? myAnswers(q.id, userId) : Promise.resolve([]),
      ]);
      setSession(sess);
      setSiblings(sibs);
      setShared(sh);
      setMine(mn);
    }
    setLoading(false);
  }, [questionId, userId]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  if (loading) return <FullPageSpinner />;

  if (!question) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="text-ink-soft">That question isn’t available.</p>
        <Link to="/this-week" className="mt-4 font-semibold text-brand hover:text-brand-bright">
          ← Back to this week
        </Link>
      </div>
    );
  }

  const idx = siblings.findIndex((q) => q.id === question.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-2xl px-6 pt-8">
        <Link to="/this-week" className="text-sm font-medium text-brand hover:text-brand-bright">
          ← {session?.title ?? 'This week'}
        </Link>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          {CATEGORY_LABEL[question.category] ?? 'Question'}
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-ink">
          {question.prompt}
        </h1>
        {question.reference_url && (
          <a
            href={question.reference_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-bright"
          >
            Related reading →
          </a>
        )}

        <div className="mt-8 space-y-8">
          {shared.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Shared with the class
              </h2>
              <ul className="space-y-2">
                {shared.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl bg-sky-50/80 px-3.5 py-3 text-sm leading-relaxed text-ink"
                  >
                    {a.body}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <MyResponses answers={mine} onChange={load} />

          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {mine.length ? 'Add another response' : 'Your response'}
            </h2>
            {userId && <AnswerForm questionId={question.id} userId={userId} onSubmitted={load} />}
          </div>
        </div>

        <nav className="mt-10 flex items-center justify-between gap-3 border-t border-sky-100 pt-5 text-sm">
          {prev ? (
            <Link to={`/q/${prev.id}`} className="font-medium text-brand hover:text-brand-bright">
              ← Previous question
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/q/${next.id}`} className="font-medium text-brand hover:text-brand-bright">
              Next question →
            </Link>
          ) : (
            <Link to="/this-week" className="font-medium text-brand hover:text-brand-bright">
              Back to this week
            </Link>
          )}
        </nav>
      </div>
      <Footer />
    </div>
  );
}
