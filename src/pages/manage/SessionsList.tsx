import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { allQuestions, allSessions, answerCounts, createSession } from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { FullPageSpinner } from '@/components/Spinner';
import type { AnswerCounts } from '@/data/cwass';
import type { Question, Session } from '@/lib/types';

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
  const [counts, setCounts] = useState<Record<number, AnswerCounts>>({});

  const load = useCallback(async () => {
    const [ss, qs, ac] = await Promise.all([allSessions(), allQuestions(), answerCounts()]);
    setSessions(ss);
    setQuestions(qs);
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
          const pending = qs.reduce((sum, q) => sum + (counts[q.id]?.unpublished ?? 0), 0);
          return (
            <li key={s.id}>
              <Link
                to={`/manage/s/${s.id}`}
                className="block rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm transition hover:border-brand/40 hover:shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-ink">{s.title || fmtDate(s.teach_date)}</h2>
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
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                  <span>{qs.length} question{qs.length === 1 ? '' : 's'}</span>
                  {s.cfm_weeks.length > 0 && <span>· CFM weeks {s.cfm_weeks.join(', ')}</span>}
                  {pending > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                      {pending} response{pending === 1 ? '' : 's'} to review
                    </span>
                  )}
                </div>
              </Link>
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
