import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { cfmUrl, formatRange } from '@/lib/cfm';
import { resolveArt, type ArtPiece } from '@/lib/art';
import { currentSession, lessonsForWeeks, questionsForSession, sharedInquiries } from '@/data/cwass';
import { Wordmark } from '@/components/Logo';
import { FullPageSpinner } from '@/components/Spinner';
import { Footer } from '@/components/Footer';
import { AskQuestion } from '@/components/thisweek/AskQuestion';
import type { Lesson, Question, Session, SharedInquiry } from '@/lib/types';

const CATEGORIES: { key: 'study' | 'home'; label: string }[] = [
  { key: 'study', label: 'From this week’s study' },
  { key: 'home', label: 'Teaching & learning in our homes' },
];

export function ThisWeek() {
  const { user, profile, signOut } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const userId = user?.id ?? '';

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [inquiries, setInquiries] = useState<SharedInquiry[]>([]);

  const load = useCallback(async () => {
    const s = await currentSession();
    setSession(s);
    if (s) {
      const [ls, qs, si] = await Promise.all([
        lessonsForWeeks(s.cfm_weeks),
        questionsForSession(s.id),
        sharedInquiries(),
      ]);
      setLessons(ls);
      setQuestions(qs);
      setInquiries(si);
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
  const art = session ? resolveArt(session.image) : null;

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-8">
          <Wordmark />
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link
                to="/manage"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-white"
              >
                Manage
              </Link>
            )}
            <button
              onClick={signOut}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-white hover:text-ink"
            >
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
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
              {session.title ?? 'This week'}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Welcome, {firstName}. Read along, then share what you’re finding — in class or here.
            </p>

            {lessons.length > 0 && <SessionHeader art={art} lessons={lessons} />}

            {CATEGORIES.map(({ key, label }) => {
              const qs = questions.filter((q) => q.category === key && q.is_active);
              if (qs.length === 0) return null;
              return (
                <section key={key} className="mt-8">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    {label}
                  </h2>
                  <ul className="space-y-2.5">
                    {qs.map((q) => (
                      <li key={q.id}>
                        <Link
                          to={`/q/${q.id}`}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm transition hover:border-brand/40 hover:shadow"
                        >
                          <span className="font-medium text-ink">{q.prompt}</span>
                          <span aria-hidden className="shrink-0 text-brand">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}

            <section className="mt-10">
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
                      {q.answer && (
                        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{q.answer}</p>
                      )}
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

function ReadingLinks({ lessons, dark }: { lessons: Lesson[]; dark?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {lessons.map((l) => (
        <li key={l.id}>
          <a
            href={cfmUrl(l.cfm_week)}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex flex-wrap items-baseline gap-x-2"
          >
            <span
              className={`text-sm font-semibold underline-offset-2 group-hover:underline ${
                dark ? 'text-white' : 'text-ink'
              }`}
            >
              {l.title}
            </span>
            <span className={`text-xs ${dark ? 'text-white/75' : 'text-ink-faint'}`}>
              {formatRange(l.week_start, l.week_end)} →
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function SessionHeader({ art, lessons }: { art: ArtPiece | null; lessons: Lesson[] }) {
  if (art) {
    return (
      <div className="mt-5 grid overflow-hidden rounded-3xl border border-sky-100 bg-white/80 shadow-sm sm:grid-cols-[14rem_1fr]">
        <img
          src={art.src}
          alt={art.title}
          className="h-56 w-full object-cover object-[50%_28%] sm:h-full"
        />
        <div className="flex flex-col p-5 sm:min-h-[15rem]">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
            Come, Follow Me
          </div>
          <div className="mt-3">
            <ReadingLinks lessons={lessons} />
          </div>
          <p className="mt-auto pt-5 text-[11px] text-ink-faint">
            {art.artist ? (
              art.source ? (
                <a href={art.source} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                  {art.title} — {art.artist} ↗
                </a>
              ) : (
                <>
                  {art.title} — {art.artist}
                </>
              )
            ) : (
              art.source && (
                <a href={art.source} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                  Image source ↗
                </a>
              )
            )}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-5 rounded-2xl bg-gradient-to-br from-brand to-brand-bright p-5 text-white shadow-lg shadow-brand/20">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/80">
        Come, Follow Me
      </div>
      <div className="mt-2">
        <ReadingLinks lessons={lessons} dark />
      </div>
    </div>
  );
}
