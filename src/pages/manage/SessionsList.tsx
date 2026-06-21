import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { allInquiries, allQuestions, allSessions, answerCounts, createSession } from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { FullPageSpinner } from '@/components/Spinner';
import type { AnswerCounts } from '@/data/cwass';
import type { Inquiry, Question, Session } from '@/lib/types';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SessionsList() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [counts, setCounts] = useState<Record<number, AnswerCounts>>({});

  const load = useCallback(async () => {
    const [ss, qs, inq, ac] = await Promise.all([
      allSessions(),
      allQuestions(),
      allInquiries(),
      answerCounts(),
    ]);
    setSessions(ss);
    setQuestions(qs);
    setInquiries(inq);
    setCounts(ac);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

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
    navigate(`/manage/s/${(data as Session).id}`);
  }

  if (loading) return <FullPageSpinner />;

  return (
    <ManageLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Sessions</h1>
        <button
          onClick={newSession}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-bright"
        >
          + New session
        </button>
      </div>

      <ul className="mt-5 space-y-3">
        {sessions.map((s) => {
          const qs = questions.filter((q) => q.session_id === s.id);
          const responses = qs.reduce((sum, q) => sum + (counts[q.id]?.total ?? 0), 0);
          const classQuestions = inquiries.filter((i) => i.session_id === s.id).length;
          return (
            <li key={s.id} className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to={`/manage/s/${s.id}`}
                  className="font-semibold text-ink underline-offset-2 hover:text-brand hover:underline"
                >
                  {s.title || fmtDate(s.teach_date)}
                </Link>
                {s.is_published ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Published
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                    Draft
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-soft">{fmtDate(s.teach_date)}</p>
              {s.cfm_weeks.length > 0 && (
                <p className="mt-1 text-xs text-ink-faint">CFM weeks {s.cfm_weeks.join(', ')}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <Link to={`/manage/s/${s.id}`} className="font-semibold text-brand hover:text-brand-bright">
                  Build / edit →
                </Link>
                <Link
                  to={`/manage/s/${s.id}/responses`}
                  className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 font-semibold text-brand transition hover:bg-brand/20"
                >
                  {responses} response{responses === 1 ? '' : 's'} →
                </Link>
                <Link
                  to={`/manage/s/${s.id}/questions`}
                  className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 font-semibold text-brand transition hover:bg-brand/20"
                >
                  {classQuestions} question{classQuestions === 1 ? '' : 's'} →
                </Link>
              </div>
            </li>
          );
        })}
        {sessions.length === 0 && (
          <li className="rounded-2xl border border-dashed border-sky-100 p-6 text-center text-sm text-ink-faint">
            No sessions yet. Create your first one.
          </li>
        )}
      </ul>
    </ManageLayout>
  );
}
