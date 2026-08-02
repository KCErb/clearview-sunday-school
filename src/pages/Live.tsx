import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import {
  clearMyLiveResponses,
  currentClassPrompt,
  liveSession,
  liveTally,
  markPresent,
  myLiveResponses,
  optionsForPrompt,
  submitLiveResponse,
} from '@/data/cwass';
import { useLiveRefresh } from '@/lib/useLiveRefresh';
import { Wordmark } from '@/components/Logo';
import { FullPageSpinner } from '@/components/Spinner';
import { AttributionBanner } from '@/components/live/AttributionBanner';
import { PromptInput } from '@/components/live/PromptInput';
import { TallyBars } from '@/components/live/TallyBars';
import type { LiveOption, LivePrompt, LiveTallyRow, Session } from '@/lib/types';

const POLL_MS = 4000;
const HEARTBEAT_MS = 12_000;

/** Device guard for anonymous prompts — the honor-system half of "one response each". */
const answeredKey = (id: number) => `cwass.live.${id}`;

export function Live() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [prompt, setPrompt] = useState<LivePrompt | null>(null);
  const [options, setOptions] = useState<LiveOption[]>([]);
  const [tally, setTally] = useState<LiveTallyRow[]>([]);
  const [answered, setAnswered] = useState(false);

  // Which prompt's options we already fetched, so polling doesn't refetch every 4s.
  const loadedOptionsFor = useRef<number | null>(null);

  const load = useCallback(async () => {
    const s = await liveSession();
    setSession(s);

    if (!s) {
      setPrompt(null);
      setOptions([]);
      loadedOptionsFor.current = null;
      setLoading(false);
      return;
    }

    const p = await currentClassPrompt();
    setPrompt(p);

    if (!p) {
      setOptions([]);
      loadedOptionsFor.current = null;
      setLoading(false);
      return;
    }

    if (loadedOptionsFor.current !== p.id) {
      loadedOptionsFor.current = p.id;
      setOptions(p.kind === 'text' ? [] : await optionsForPrompt(p.id));
      // Anonymous rows are unreadable by design, so the device guard is the only record.
      const mine =
        p.attribution === 'named' && userId ? await myLiveResponses(p.id, userId) : [];
      setAnswered(mine.length > 0 || localStorage.getItem(answeredKey(p.id)) === '1');
    }

    setTally(p.reveal ? await liveTally(p.id) : []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  useLiveRefresh(load, POLL_MS);

  // "I'm here" ping, so KC can tell 5-of-30-on-the-app from 28-of-30.
  const beat = useCallback(() => {
    if (userId && session) void markPresent();
  }, [userId, session]);
  useEffect(() => {
    beat();
  }, [beat]);
  useLiveRefresh(beat, HEARTBEAT_MS, !!session);

  async function submit(p: { option_ids: number[]; body: string | null }) {
    if (!prompt) return 'That prompt just closed.';
    const { error } = await submitLiveResponse({
      prompt_id: prompt.id,
      option_ids: p.option_ids,
      body: p.body,
      author_id: prompt.attribution === 'named' ? userId : null,
    });
    if (error) return error.message;
    localStorage.setItem(answeredKey(prompt.id), '1');
    setAnswered(true);
    void load();
    return null;
  }

  async function changeAnswer() {
    if (!prompt || prompt.attribution !== 'named' || !userId) return;
    await clearMyLiveResponses(prompt.id, userId);
    localStorage.removeItem(answeredKey(prompt.id));
    setAnswered(false);
  }

  if (loading) return <FullPageSpinner />;

  const isOpen = prompt?.status === 'open';
  const showTally = !!prompt?.reveal && tally.length > 0;
  // A closed prompt only stays on screen if it left a revealed tally to read. Otherwise
  // the page returns to the waiting card — a lingering question with a "thanks" card
  // under it reads as a half-finished reset.
  const showPrompt = !!prompt && (isOpen || showTally);

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-8">
        <Wordmark />
        {session && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        )}
      </header>

      <main className="mx-auto max-w-xl px-6 pb-16">
        {!session ? (
          <IdleCard />
        ) : !showPrompt || !prompt ? (
          <WaitingCard />
        ) : (
          <section className="mt-4">
            <h1 className="text-2xl font-bold leading-snug tracking-tight text-ink">
              {prompt.prompt}
            </h1>
            {prompt.detail && <p className="mt-2 text-sm text-ink-soft">{prompt.detail}</p>}

            <div className="mt-4">
              <AttributionBanner attribution={prompt.attribution} />
            </div>

            <div className="mt-5">
              {isOpen && !answered ? (
                <PromptInput prompt={prompt} options={options} onSubmit={submit} />
              ) : (
                <div className="rounded-2xl border border-sky-100 bg-white/80 p-5 text-center shadow-sm">
                  <p className="font-semibold text-ink">
                    {!isOpen ? 'This one’s closed.' : 'Thanks — got it.'}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {isOpen
                      ? 'KC can see your response.'
                      : 'Here’s how the class answered.'}
                  </p>
                  {isOpen && answered && prompt.attribution === 'named' && (
                    <button
                      onClick={changeAnswer}
                      className="mt-3 text-sm font-semibold text-brand hover:text-brand-bright"
                    >
                      Change my answer
                    </button>
                  )}
                </div>
              )}
            </div>

            {showTally && (
              <div className="mt-6 rounded-2xl border border-sky-100 bg-white/80 p-5 shadow-sm">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  How the class answered
                </h2>
                <TallyBars items={tally} />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function IdleCard() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-sky-100 bg-white/40 p-8 text-center">
      <Radio className="mx-auto h-7 w-7 text-ink-faint" aria-hidden="true" />
      <p className="mt-3 font-semibold text-ink">Nothing live right now</p>
      <p className="mt-1 text-sm text-ink-soft">
        This page wakes up when KC starts a live session in class.
      </p>
      <Link to="/this-week" className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-bright">
        ← This week
      </Link>
    </div>
  );
}

function WaitingCard() {
  return (
    <div className="mt-10 rounded-2xl border border-sky-100 bg-white/70 p-8 text-center shadow-sm">
      <p className="text-lg font-bold text-ink">We’re live</p>
      <p className="mt-1.5 text-sm text-ink-soft">
        Keep this page open — a question will appear here when KC sends one.
      </p>
      <div className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-pulse rounded-full bg-brand/50"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
