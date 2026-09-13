import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, LockKeyhole, Radio } from 'lucide-react';
import type { Poll, PollApi } from './types';
import { AnswerSession, type AnswerState } from './answerSession';
import { useRefresh } from './useRefresh';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useRefresh(async () => {
    try {
      setPoll(await api.current());
      setLoading(false);
      setError(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  });
  return (
    <div className={`poll-app participant ${embedded ? 'embedded' : ''}`}>
      <header className="poll-header">
        <Link to={preview ? '/preview/polls' : '/'} className="class-name">
          Clearview Ward <span>Sunday School</span>
        </Link>
        <span className="header-note">A place to listen.</span>
      </header>
      <main className="participant-main">
        {poll ? (
          <Question key={poll.id} poll={poll} api={api} preview={preview} />
        ) : (
          <div className="waiting-state">
            <div className="waiting-icon">
              <Radio size={28} strokeWidth={1.4} />
            </div>
            <p className="eyebrow">We're glad you're here</p>
            <h1>
              {loading
                ? 'Getting ready…'
                : error
                  ? 'Connecting to the class…'
                  : 'A moment to listen.'}
            </h1>
            <div className="gold-rule" />
            <p>
              The next question will appear here.
              <br />
              You can leave this page open.
            </p>
          </div>
        )}
        {error && (
          <p role="status" className="connection-note">
            Reconnecting to the class…
          </p>
        )}
      </main>
      {!embedded && (
        <footer className="poll-footer">
          <span>For our class, from our class.</span>
          <nav>
            <Link to="/archive">Study archive</Link>
            <Link to={preview ? '/preview/polls/manage' : '/manage'}>Teacher</Link>
          </nav>
        </footer>
      )}
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
    </section>
  );
}
