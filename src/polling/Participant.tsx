import { useEffect, useRef, useState } from 'react';
import { Check, LockKeyhole, Radio } from 'lucide-react';
import type { DeckSummary, Poll, PollApi, Stage } from './types';
import { AnswerSession, type AnswerState } from './answerSession';
import { useRefresh } from './useRefresh';
import { WriteIns } from './WriteIns';
import { SlideFrame } from '@/decks/SlideFrame';
import { DeckViewer, LessonCard } from '@/decks/DeckViewer';
import { useSearchParams } from 'react-router-dom';

const welcomePhrases = [
  'Glad you’re here',
  'A moment to listen',
  'A place to listen',
  'Room to reflect',
  'Learning together',
  'A moment together',
];

export function Participant({
  api,
  preview = false,
  embedded = false,
}: {
  api: PollApi;
  preview?: boolean;
  embedded?: boolean;
}) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const decksAt = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [welcome] = useState(() => welcomePhrases[Math.floor(Math.random() * welcomePhrases.length)]);
  const question = useRef<HTMLDivElement | null>(null);
  // Which lesson and slide are open lives in the address, so back and shared links (the QR codes) work.
  const [params, setParams] = useSearchParams();
  useRefresh(async () => {
    try {
      const [current, live] = await Promise.all([api.current(), api.stage()]);
      setPoll(current);
      setStage(live);
      // Lessons change a few times a week at most.
      if (Date.now() - decksAt.current > 60000) {
        decksAt.current = Date.now();
        setDecks(await api.deckList());
      }
      setLoading(false);
      setError(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  });
  // "This week" is the lesson on the screen, or else the newest one.
  const thisWeek = decks.find((d) => d.id === stage?.deck.id) ?? decks[0] ?? null;
  const shown = Number(params.get('lesson')) || thisWeek?.id || null;
  const slideParam = Number(params.get('slide')) || 0;
  // Until someone turns the page themselves, the lesson on the screen keeps up with the teacher.
  const following = !slideParam && stage?.deck.id === shown;
  const idx = slideParam ? slideParam - 1 : following && stage ? stage.slide.idx : 0;
  const open = poll?.status === 'open';
  const openLesson = (id: number) => {
    setParams({ lesson: String(id) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const toQuestion = () =>
    setTimeout(() => question.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  const others = decks.filter((d) => d.id !== shown && d.id !== thisWeek?.id);
  // A lesson presented without being published can't be browsed; show what's on the screen instead.
  const unlisted = stage && !decks.some((d) => d.id === stage.deck.id) ? stage : null;
  return (
    <div className={`poll-app participant ${embedded ? 'embedded' : ''}`}>
      <header className="poll-header participant-header">
        <div className="participant-brand">
          Clearview Ward <span aria-hidden="true">·</span> Sunday School
        </div>
      </header>
      <main className={`participant-main ${shown ? 'wide' : ''}`}>
        {unlisted && (
          <div className="slide-bleed">
            <SlideFrame key={`${unlisted.deck.id}:${unlisted.slide.idx}`} html={unlisted.slide.html} />
          </div>
        )}
        {shown ? (
          <DeckViewer
            key={shown}
            api={api}
            deckId={shown}
            idx={idx}
            onIdx={(i) => setParams({ lesson: String(shown), slide: String(i + 1) }, { replace: true })}
            eyebrow={shown === thisWeek?.id ? 'This week' : 'Previous lesson'}
            action={
              shown !== thisWeek?.id && thisWeek ? (
                <button className="text-button" onClick={() => openLesson(thisWeek.id)}>
                  Back to this week
                </button>
              ) : null
            }
            alert={open ? { text: 'Answer the open question', onClick: toQuestion } : null}
          />
        ) : (
          !open && (
            <div className="waiting-compact">
              <div className="waiting-icon">
                <Radio size={22} strokeWidth={1.5} />
              </div>
              <div>
                <p className="eyebrow waiting-phrase">{welcome}</p>
                <p role="status">
                  {loading || error ? 'Connecting to the class…' : 'This week’s lesson will appear here.'}
                </p>
              </div>
            </div>
          )
        )}
        {open && (
          <div ref={question} className="open-question">
            <Question key={poll.id} poll={poll} api={api} preview={preview} />
          </div>
        )}
        {others.length > 0 && (
          <section className="previous-lessons">
            <h2 className="lessons-divider">
              <span>Previous lessons</span>
            </h2>
            <ul>
              {others.map((d) => (
                <li key={d.id}>
                  <LessonCard deck={d} onOpen={() => openLesson(d.id)} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {error && poll && (
          <p role="status" className="connection-note">
            Reconnecting to the class…
          </p>
        )}
      </main>
    </div>
  );
}
function Question({ poll, api, preview }: { poll: Poll; api: PollApi; preview: boolean }) {
  const [answer, setAnswer] = useState<AnswerState>({
    selection: [],
    status: 'Connecting…',
    ready: false,
  });
  const session = useRef<AnswerSession | null>(null);
  useEffect(() => {
    const s = new AnswerSession(
      api,
      poll.id,
      preview ? 'cwass.demo' : 'cwass.poll',
      poll.opened_at || '',
      setAnswer,
    );
    session.current = s;
    void s.refresh(poll.status === 'open');
    return () => {
      s.stop();
      session.current = null;
    };
  }, [api, poll.id, poll.status, poll.opened_at, preview]);
  useRefresh(async () => {
    await session.current?.refresh(poll.status === 'open');
  });
  const open = poll.status === 'open';
  return (
    <section className="question-card">
      <div className="question-overline">
        <span className="eyebrow">Your perspective matters</span>
        <span className={`poll-badge ${open ? 'is-open' : ''}`}>
          {open ? 'Open now' : 'Closed'}
        </span>
      </div>
      <h1>{poll.question}</h1>
      <div className="gold-rule" />
      {poll.detail && <p className="question-detail">{poll.detail}</p>}
      <fieldset disabled={!open || !answer.ready}>
        <legend>{poll.kind === 'multi' ? 'Choose any that speak to you.' : 'Choose one.'}</legend>
        <div className="choice-list">
          {poll.options.map((option) => {
            const checked = answer.selection.includes(option.id);
            return (
              <label className={`poll-choice ${checked ? 'selected' : ''}`} key={option.id}>
                <input
                  type={poll.kind === 'single' ? 'radio' : 'checkbox'}
                  name={`poll-${poll.id}`}
                  checked={checked}
                  onChange={() =>
                    session.current?.select(
                      poll.kind === 'single'
                        ? [option.id]
                        : checked
                          ? answer.selection.filter((id) => id !== option.id)
                          : [...answer.selection, option.id],
                    )
                  }
                />
                <span className={`choice-indicator ${poll.kind === 'single' ? 'round' : ''}`}>
                  {checked &&
                    (poll.kind === 'single' ? <span className="radio-dot" /> : <Check size={16} />)}
                </span>
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="answer-footer">
        <p role="status" aria-live="polite" className="save-status">
          {answer.status.startsWith('Saved') ? <Check size={15} /> : <LockKeyhole size={14} />}
          {!open ? 'Closed · Thank you for sharing' : answer.status}
        </p>
        {open && answer.selection.length > 0 && (
          <button className="text-button" onClick={() => session.current?.select([])}>
            Clear answer
          </button>
        )}
      </div>
      {answer.ready && answer.token && (
        <WriteIns
          key={poll.id}
          api={api}
          poll={poll}
          token={answer.token}
          preview={preview}
        />
      )}
    </section>
  );
}
