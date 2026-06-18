import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/useAuth';
import { cfmUrl, formatRange } from '@/lib/cfm';
import { Wordmark } from '@/components/Logo';
import { FullPageSpinner } from '@/components/Spinner';
import { Footer } from '@/components/Footer';
import { QuestionCard } from '@/components/thisweek/QuestionCard';
import { AddQuestion } from '@/components/thisweek/AddQuestion';
import { AskQuestion } from '@/components/thisweek/AskQuestion';
import { AdminInquiries } from '@/components/thisweek/AdminInquiries';
import type { Answer, Inquiry, Lesson, Question, SharedAnswer, SharedInquiry } from '@/lib/types';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function groupBy<T, K extends string | number>(items: T[], key: (t: T) => K) {
  const map = new Map<K, T[]>();
  for (const it of items) {
    const k = key(it);
    (map.get(k) ?? map.set(k, []).get(k)!).push(it);
  }
  return map;
}

export function ThisWeek() {
  const { user, profile, signOut } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const userId = user?.id ?? '';

  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [shared, setShared] = useState<SharedAnswer[]>([]);
  const [adminAnswers, setAdminAnswers] = useState<Answer[]>([]);
  const [sharedInquiries, setSharedInquiries] = useState<SharedInquiry[]>([]);
  const [adminInquiries, setAdminInquiries] = useState<Inquiry[]>([]);

  const load = useCallback(async () => {
    const { data: ls } = await supabase
      .from('lessons')
      .select('*')
      .lte('week_start', todayISO())
      .order('week_start', { ascending: false })
      .limit(2);
    const lessonRows = (ls as Lesson[]) ?? [];
    const lessonIds = lessonRows.map((l) => l.id);

    const { data: qs } = await supabase
      .from('questions')
      .select('*')
      .in('lesson_id', lessonIds.length ? lessonIds : [-1])
      .order('sort_order', { ascending: true });
    const questionRows = (qs as Question[]) ?? [];
    const qIds = questionRows.map((q) => q.id);

    const { data: sh } = await supabase
      .from('shared_answers')
      .select('*')
      .in('question_id', qIds.length ? qIds : [-1]);

    const { data: si } = await supabase
      .from('shared_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    let adminA: Answer[] = [];
    let adminI: Inquiry[] = [];
    if (isAdmin) {
      const { data: aa } = await supabase
        .from('answers')
        .select('*')
        .in('question_id', qIds.length ? qIds : [-1])
        .order('created_at', { ascending: true });
      adminA = (aa as Answer[]) ?? [];
      const { data: ai } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      adminI = (ai as Inquiry[]) ?? [];
    }

    setLessons(lessonRows);
    setQuestions(questionRows);
    setShared((sh as SharedAnswer[]) ?? []);
    setSharedInquiries((si as SharedInquiry[]) ?? []);
    setAdminAnswers(adminA);
    setAdminInquiries(adminI);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  if (loading) return <FullPageSpinner />;

  const questionsByLesson = groupBy(questions, (q) => q.lesson_id);
  const sharedByQ = groupBy(shared, (a) => a.question_id);
  const adminByQ = groupBy(adminAnswers, (a) => a.question_id);
  const firstName = profile?.first_name?.trim() || 'friend';
  const primaryLessonId = lessons[0]?.id ?? null;

  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-2xl px-6">
        <header className="flex items-center justify-between py-6">
          <Wordmark />
          <button
            onClick={signOut}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-white hover:text-ink"
          >
            Sign out
          </button>
        </header>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">This week</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Welcome, {firstName}. Here’s what we’re studying — read along, and share what you’re
          finding.
        </p>

        {lessons.map((lesson) => {
          const qs = questionsByLesson.get(lesson.id) ?? [];
          return (
            <section key={lesson.id} className="mt-8">
              <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-bright p-5 text-white shadow-lg shadow-brand/20">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/80">
                  Week of {formatRange(lesson.week_start, lesson.week_end)}
                </div>
                <h2 className="mt-1 text-lg font-bold">{lesson.title}</h2>
                <a
                  href={cfmUrl(lesson.cfm_week)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
                >
                  Read on Come, Follow Me →
                </a>
              </div>

              <div className="mt-3 space-y-3">
                {qs.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    shared={sharedByQ.get(q.id) ?? []}
                    adminAnswers={adminByQ.get(q.id) ?? []}
                    isAdmin={isAdmin}
                    userId={userId}
                    onChange={load}
                  />
                ))}
                {qs.length === 0 && !isAdmin && (
                  <p className="rounded-2xl border border-dashed border-sky-100 bg-white/40 p-4 text-center text-sm text-ink-faint">
                    KC hasn’t posted questions for this lesson yet.
                  </p>
                )}
                {isAdmin && <AddQuestion lessonId={lesson.id} onAdded={load} />}
              </div>
            </section>
          );
        })}

        <section className="mt-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Ask a question
          </h2>
          {userId && <AskQuestion lessonId={primaryLessonId} userId={userId} onSubmitted={load} />}
        </section>

        {sharedInquiries.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Questions KC answered
            </h2>
            <ul className="space-y-3">
              {sharedInquiries.map((q) => (
                <li key={q.id} className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
                  <p className="font-medium text-ink">{q.body}</p>
                  {q.answer && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{q.answer}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {isAdmin && (
          <section className="mt-10 rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              KC only · Questions from the class
            </h2>
            <AdminInquiries inquiries={adminInquiries} onChange={load} />
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
