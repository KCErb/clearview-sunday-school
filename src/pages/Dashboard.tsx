import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/useAuth';
import { Wordmark } from '@/components/Logo';
import { Spinner } from '@/components/Spinner';
import type { ScheduleWeek, Submission, SubmissionKind } from '@/lib/types';

export function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleWeek[] | null>(null);
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);

  const loadSubmissions = useCallback(async () => {
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });
    setSubmissions((data as Submission[]) ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('schedule')
        .select('*')
        .order('sort_order', { ascending: true });
      setSchedule((data as ScheduleWeek[]) ?? []);
      await loadSubmissions();
    })();
  }, [loadSubmissions]);

  const firstName = profile?.first_name?.trim() || user?.email?.split('@')[0] || 'friend';

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-6 pb-20">
      <header className="flex items-center justify-between py-6">
        <Wordmark />
        <button
          onClick={signOut}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-white hover:text-ink"
        >
          Sign out
        </button>
      </header>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
        Welcome, {firstName}! 👋
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Here’s what we’re studying and a place to share with the class.
      </p>

      <Section title="Study schedule">
        {schedule === null ? (
          <Loading />
        ) : schedule.length === 0 ? (
          <Empty>The schedule hasn’t been posted yet. Check back soon.</Empty>
        ) : (
          <ul className="space-y-3">
            {schedule.map((w) => (
              <li
                key={w.id}
                className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold text-ink">{w.title}</h3>
                  {w.week_date && (
                    <span className="shrink-0 text-xs font-medium text-ink-faint">
                      {formatDate(w.week_date)}
                    </span>
                  )}
                </div>
                {w.reading && <p className="mt-1 text-sm font-medium text-brand">{w.reading}</p>}
                {w.notes && <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{w.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Share an answer or a question">
        <SubmissionForm onSubmitted={loadSubmissions} />
      </Section>

      <Section title="Your recent submissions">
        {submissions === null ? (
          <Loading />
        ) : submissions.length === 0 ? (
          <Empty>Nothing yet — your answers and questions will show up here.</Empty>
        ) : (
          <ul className="space-y-2">
            {submissions.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-sky-100 bg-white/70 p-3.5 text-sm shadow-sm"
              >
                <span
                  className={`mr-2 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    s.kind === 'question'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-sky-100 text-brand'
                  }`}
                >
                  {s.kind}
                </span>
                <span className="text-ink">{s.body}</span>
                <span className="mt-1 block text-[11px] text-ink-faint">
                  {formatDateTime(s.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function SubmissionForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useAuth();
  const [kind, setKind] = useState<SubmissionKind>('answer');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() || !user) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('submissions')
      .insert({ user_id: user.id, kind, body: body.trim() });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBody('');
    onSubmitted();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
      <div className="mb-3 inline-flex rounded-lg bg-sky-100 p-1">
        {(['answer', 'question'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition ${
              kind === k ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={
          kind === 'answer'
            ? 'What stood out to you this week?'
            : 'What are you still wondering about?'
        }
        className="w-full resize-y rounded-xl border border-sky-100 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-ink-faint">🎙️ Audio &amp; video coming soon</span>
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50"
        >
          {saving ? <Spinner className="h-4 w-4" /> : 'Share'}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-6 text-brand">
      <Spinner />
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-sky-100 bg-white/40 p-5 text-center text-sm text-ink-faint">
      {children}
    </p>
  );
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
