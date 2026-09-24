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
  // Where the student is lives in the address, so the back button and shared links work.
  const [params, setParams] = useSearchParams();
  const lesson = Number(params.get('lesson')) || null;
  const view = lesson || params.get('view') === 'lessons' ? 'lessons' : 'class';
  const slideIdx = Math.max(0, (Number(params.get('slide')) || 1) - 1);
  const showClass = () => setParams({});
  const showLessons = () => setParams({ view: 'lessons' });
  const openLesson = (id: number) => setParams({ lesson: String(id) });
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
  const open = poll?.status === 'open';
  const live = !!stage || open;
  return (
    <div className={`poll-app participant ${embedded ? 'embedded' : ''}`}>
      <header className="poll-header participant-header">
        <div className="participant-brand">
          Clearview Ward <span aria-hidden="true">·</span> Sunday School
        </div>
        <nav className="participant-tabs" aria-label="Sections">
          <button className={view === 'class' ? 'current' : ''} aria-current={view === 'class'} onClick={showClass}>
            {live && <span className="live-dot" aria-label="Live now" />}
            Class
          </button>
          <button
            className={view === 'lessons' ? 'current' : ''}
            aria-current={view === 'lessons'}
            onClick={showLessons}
          >
            Lessons
          </button>
        </nav>
      </header>
      <main className={`participant-main ${lesson ? 'wide' : ''}`}>
        {view === 'lessons' ? (
          <>
            {live && (
              <button className="live-banner" onClick={showClass}>
                <span className="live-dot" /> Class is live now <span aria-hidden="true">→</span>
              </button>
            )}
            {lesson ? (
              <DeckViewer
                key={lesson}
                api={api}
                deckId={lesson}
                idx={slideIdx}
                onIdx={(i) =>
                  setParams({ lesson: String(lesson), ...(i ? { slide: String(i + 1) } : {}) }, { replace: true })
                }
                onBack={showLessons}
              />
            ) : (
              <section className="lesson-list">
                <h1>Lessons</h1>
                {decks.length ? (
                  <ul>
                    {decks.map((d) => (
                      <li key={d.id}>
                        <LessonCard deck={d} onOpen={() => openLesson(d.id)} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="lesson-empty">{loading ? 'Loading lessons…' : 'Slides from class will appear here.'}</p>
                )}
              </section>
            )}
          </>
        ) : stage ? (
          <>
            <div className="slide-bleed">
              <SlideFrame key={`${stage.deck.id}:${stage.slide.idx}`} html={stage.slide.html} />
            </div>
            {open && <Question key={poll.id} poll={poll} api={api} preview={preview} />}
          </>
        ) : open ? (
          <Question key={poll.id} poll={poll} api={api} preview={preview} />
        ) : (
          <>
            <div className="waiting-compact">
              <div className="waiting-icon">
                <Radio size={22} strokeWidth={1.5} />
              </div>
              <div>
                <p className="eyebrow waiting-phrase">{welcome}</p>
                <p role="status">
                  {loading || error ? 'Connecting to the class…' : 'The next question will appear here.'}
                </p>
              </div>
            </div>
            {decks[0] && (
              <section className="latest-lesson">
                <LessonCard deck={decks[0]} label="Latest lesson" onOpen={() => openLesson(decks[0].id)} />
                {decks.length > 1 && (
                  <button className="text-button" onClick={showLessons}>
                    All lessons <span aria-hidden="true">→</span>
                  </button>
                )}
              </section>
            )}
          </>
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
