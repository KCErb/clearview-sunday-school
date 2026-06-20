import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { cfmUrl, formatRange } from '@/lib/cfm';
import { resolveArt } from '@/lib/art';
import {
  currentSession,
  lessonsForWeeks,
  questionsForSession,
  sectionLinks,
  sharedInquiries,
  sharedInsights,
} from '@/data/cwass';
import { Wordmark } from '@/components/Logo';
import { CroppedImage } from '@/components/CroppedImage';
import { FullPageSpinner } from '@/components/Spinner';
import { Footer } from '@/components/Footer';
import { AskQuestion } from '@/components/thisweek/AskQuestion';
import { InsightForm } from '@/components/thisweek/InsightForm';
import type {
  Lesson,
  Question,
  SectionArt,
  SectionLink,
  Session,
  SharedInquiry,
  SharedInsight,
} from '@/lib/types';

interface Section {
  week: number | null; // null = home-centered
  title: string;
  lesson?: Lesson;
}

export function ThisWeek() {
  const { user, profile, signOut } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const userId = user?.id ?? '';

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [links, setLinks] = useState<SectionLink[]>([]);
  const [insights, setInsights] = useState<SharedInsight[]>([]);
  const [inquiries, setInquiries] = useState<SharedInquiry[]>([]);

  const load = useCallback(async () => {
    const s = await currentSession();
    setSession(s);
    if (s) {
      const [ls, qs, lk, ins, inq] = await Promise.all([
        lessonsForWeeks(s.cfm_weeks),
        questionsForSession(s.id),
        sectionLinks(s.id),
        sharedInsights(s.id),
        sharedInquiries(),
      ]);
      setLessons(ls);
      setQuestions(qs);
      setLinks(lk);
      setInsights(ins);
      setInquiries(inq);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  if (loading) return <FullPageSpinner />;

  const firstName = profile?.first_name?.trim() || 'friend';

  const lessonByWeek = new Map(lessons.map((l) => [l.cfm_week, l]));
  const weeksDesc = session ? [...session.cfm_weeks].sort((a, b) => b - a) : [];
  const sections: Section[] = session
    ? [
        { week: null, title: 'Teaching & learning in our homes' },
        ...weeksDesc.map((w) => ({
          week: w,
          title: lessonByWeek.get(w)?.title ?? `Come, Follow Me — week ${w}`,
          lesson: lessonByWeek.get(w),
        })),
      ]
    : [];

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-8">
        <Wordmark />
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link to="/manage" className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-white">
              Manage
            </Link>
          )}
          <button onClick={signOut} className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-white hover:text-ink">
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6">
        {!session ? (
          <p className="mt-10 rounded-2xl border border-dashed border-sky-100 bg-white/40 p-6 text-center text-sm text-ink-faint">
            No lesson is posted yet. Check back soon!
          </p>
        ) : (
          <>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{session.title}</h1>

            <p className="mt-2 text-sm text-ink-soft">
              Welcome, {firstName}. Read along, then share what you’re finding — in class or here.
            </p>

            {sections.map((section) => (
              <SectionBlock
                key={section.week ?? 'home'}
                section={section}
                sa={session.section_art[section.week == null ? 'home' : String(section.week)] ?? null}
                questions={questions.filter((q) => (q.cfm_week ?? null) === section.week && q.is_active)}
                links={links.filter((l) => (l.cfm_week ?? null) === section.week)}
                insights={insights.filter((i) => (i.cfm_week ?? null) === section.week)}
                userId={userId}
                sessionId={session.id}
                onChange={load}
              />
            ))}

            <section className="mt-12">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Ask a question
              </h2>
              <AskQuestion sessionId={session.id} userId={userId} onSubmitted={load} />
            </section>

            {inquiries.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Questions we’ve discussed
                </h2>
                <ul className="space-y-3">
                  {inquiries.map((q) => (
                    <li key={q.id} className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
                      <p className="font-medium text-ink">{q.body}</p>
                      {q.answer && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{q.answer}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function SectionBlock({
  section,
  sa,
  questions,
  links,
  insights,
  userId,
  sessionId,
  onChange,
}: {
  section: Section;
  sa: SectionArt | null;
  questions: Question[];
  links: SectionLink[];
  insights: SharedInsight[];
  userId: string;
  sessionId: number;
  onChange: () => void;
}) {
  return (
    <section className="mt-12">
      <header className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
          {section.lesson
            ? `Come, Follow Me · ${formatRange(section.lesson.week_start, section.lesson.week_end)}`
            : 'In our homes'}
        </p>
        <h2 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-ink">
          {section.title}
        </h2>
      </header>

      <LinksCard sa={sa} lesson={section.lesson} week={section.week} links={links} />

      {questions.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {questions.map((q) => (
            <li key={q.id}>
              <Link
                to={`/q/${q.id}`}
                className="block rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm transition hover:border-brand/40 hover:shadow"
              >
                <p className="font-medium text-ink">{q.prompt}</p>
                <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-sky-100 pt-2.5">
                  <span className="text-xs font-semibold text-brand">
                    Share your response with the class
                  </span>
                  <span aria-hidden className="text-brand">→</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {insights.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Shared with the class
          </h3>
          <ul className="space-y-2">
            {insights.map((i) => (
              <li key={i.id} className="rounded-xl bg-sky-50/80 px-3.5 py-3 text-sm leading-relaxed text-ink">
                {i.body}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <InsightForm sessionId={sessionId} cfmWeek={section.week} userId={userId} onSubmitted={onChange} />
      </div>
    </section>
  );
}

function LinksCard({
  sa,
  lesson,
  week,
  links,
}: {
  sa: SectionArt | null;
  lesson?: Lesson;
  week: number | null;
  links: SectionLink[];
}) {
  const hasManual = !!lesson && week != null;
  const piece = sa ? resolveArt(sa.src) : null;
  if (!sa && !hasManual && links.length === 0) return null;
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-sky-100 bg-white/80 shadow-sm sm:flex-row">
      {sa && piece && (
        <div className="sm:w-44 sm:shrink-0">
          <CroppedImage art={sa} alt={piece.title} className="h-full w-full" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          Study &amp; resources
        </div>
        <ul className="mt-2.5 divide-y divide-sky-100">
          {hasManual && (
            <li>
              <a
                href={cfmUrl(week!)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 py-2.5"
              >
                <span className="font-semibold text-ink underline-offset-2 group-hover:underline">
                  Read in the Come, Follow Me manual
                </span>
                <span aria-hidden className="shrink-0 text-brand">→</span>
              </a>
            </li>
          )}
          {links.map((l) => (
            <li key={l.id}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 py-2.5"
              >
                <span className="font-semibold text-ink underline-offset-2 group-hover:underline">{l.label}</span>
                <span aria-hidden className="shrink-0 text-brand">→</span>
              </a>
            </li>
          ))}
          {!hasManual && links.length === 0 && (
            <li className="py-2.5 text-sm text-ink-faint">No resources added yet.</li>
          )}
        </ul>
        {piece?.source && piece.artist && (
          <a href={piece.source} target="_blank" rel="noopener noreferrer" className="mt-auto pt-4 text-[11px] text-ink-faint hover:text-brand">
            {piece.title} — {piece.artist} ↗
          </a>
        )}
      </div>
    </div>
  );
}
