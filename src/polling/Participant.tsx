import { useEffect, useRef, useState } from 'react';
import { Check, LockKeyhole, Radio } from 'lucide-react';
import type { Poll, PollApi } from './types';
import { AnswerSession, type AnswerState } from './answerSession';
import { useRefresh } from './useRefresh';
import { WriteIns } from './WriteIns';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [welcome] = useState(() => welcomePhrases[Math.floor(Math.random() * welcomePhrases.length)]);
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
      <header className="poll-header participant-header">
        <div className="participant-brand">
          Clearview Ward <span aria-hidden="true">·</span> Sunday School
        </div>
      </header>
      <main className="participant-main">
        {poll?.status === 'open' ? (
          <Question key={poll.id} poll={poll} api={api} preview={preview} />
        ) : (
          <div className="waiting-state">
            <div className="waiting-icon">
              <Radio size={28} strokeWidth={1.4} />
            </div>
            <h1 className="eyebrow waiting-phrase">{welcome}</h1>
            <div className="gold-rule" />
            <p role="status">
              {loading || error ? 'Connecting to the class…' : 'The next question will appear here.'}
            </p>
          </div>
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
