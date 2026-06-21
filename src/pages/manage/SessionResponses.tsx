import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  allInsights,
  answersForQuestions,
  getSession,
  lessonsForWeeks,
  nameMap,
  questionsForSession,
} from '@/data/cwass';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Attribution } from '@/components/manage/Attribution';
import { FullPageSpinner } from '@/components/Spinner';
import { formatRange } from '@/lib/cfm';
import type { Answer, Insight, Lesson, Question, Session } from '@/lib/types';

export function SessionResponses() {
  const { id } = useParams();
  const sessionId = Number(id);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const s = await getSession(sessionId);
    setSession(s);
    if (s) {
      const qs = await questionsForSession(sessionId);
      const [ls, ans, ins, nm] = await Promise.all([
        lessonsForWeeks(s.cfm_weeks),
        answersForQuestions(qs.map((q) => q.id)),
        allInsights(sessionId),
        nameMap(),
      ]);
      setQuestions(qs);
      setLessons(ls);
      setAnswers(ans);
      setInsights(ins);
      setNames(nm);
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
  const sections = [
    { week: null as number | null, label: 'Teaching & learning in our homes', eyebrow: 'In our homes', lesson: undefined as Lesson | undefined },
    ...[...session.cfm_weeks].sort((a, b) => b - a).map((w) => {
      const lesson = lessonByWeek.get(w);
      return {
        week: w as number | null,
        label: lesson?.title ?? `Come, Follow Me — week ${w}`,
        eyebrow: lesson ? `Come, Follow Me · ${formatRange(lesson.week_start, lesson.week_end)}` : '',
        lesson,
      };
    }),
  ];

  return (
    <ManageLayout>
      <Link to="/manage" className="text-sm font-medium text-brand hover:text-brand-bright">← All sessions</Link>
      <h1 className="mt-3 text-xl font-bold text-ink">{session.title} · responses</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Everything members sent this session, all in one place. Anonymous submissions have no record
        of who sent them.
      </p>

      {sections.map((sec) => {
        const qs = questions.filter((q) => (q.cfm_week ?? null) === sec.week);
        const secInsights = insights.filter((i) => (i.cfm_week ?? null) === sec.week);
        if (qs.length === 0 && secInsights.length === 0) return null;
        return (
          <section key={sec.week ?? 'home'} className="mt-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{sec.eyebrow}</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-ink">{sec.label}</h2>

            {qs.map((q) => {
              const qa = answers.filter((a) => a.question_id === q.id);
              return (
                <div key={q.id} className="mt-4">
                  <h3 className="font-medium text-ink">{q.prompt}</h3>
                  {qa.length === 0 ? (
                    <p className="mt-1 text-sm text-ink-faint">No responses yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {qa.map((a) => (
                        <SubmissionRow key={a.id} body={a.body} anonymous={a.is_anonymous} authorId={a.author_id} summarize={a.share_pref === 'summarize_only'} names={names} />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {secInsights.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Shared insights</h3>
                <ul className="mt-2 space-y-2">
                  {secInsights.map((i) => (
                    <SubmissionRow key={i.id} body={i.body} anonymous={i.is_anonymous} authorId={i.author_id} summarize={i.share_pref === 'summarize_only'} names={names} />
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </ManageLayout>
  );
}

function SubmissionRow({
  body,
  anonymous,
  authorId,
  summarize,
  names,
}: {
  body: string;
  anonymous: boolean;
  authorId: string | null;
  summarize?: boolean;
  names: Record<string, string>;
}) {
  return (
    <li className="rounded-xl border border-sky-100 bg-white p-3.5 text-sm shadow-sm">
      <p className="leading-relaxed text-ink">{body}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Attribution anonymous={anonymous} name={authorId ? names[authorId] : undefined} />
        {summarize && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            don't quote — summarize
          </span>
        )}
      </div>
    </li>
  );
}
