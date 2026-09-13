import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  Edit3,
  Plus,
  Radio,
  Search,
  Send,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import type { Library, Poll, PollApi, PollDraft, Results } from './types';
import { useRefresh } from './useRefresh';

export function Teacher({ api, preview = false }: { api: PollApi; preview?: boolean }) {
  const { signOut } = useAuth();
  const [library, setLibrary] = useState<Library>({ polls: [], currentId: null, results: {} });
  const firstLoad = useRef(true);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<'draft' | 'history'>('draft');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<{ id: number | null; draft?: PollDraft } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState('');
  const load = async () => {
    try {
      const next = await api.library();
      setLibrary(next);
      if (firstLoad.current) {
        firstLoad.current = false;
        if (next.polls.some((p) => p.id === next.currentId && p.status === 'open')) {
          setSelected(next.currentId);
          setTab('history');
        }
      }
      setLoaded(true);
      setConnection('');
    } catch (e) {
      setConnection(e instanceof Error ? e.message : 'Reconnecting…');
    }
  };
  useRefresh(load);
  const active = library.polls.find((p) => p.status === 'open');
  const chosen = library.polls.find((p) => p.id === selected) ?? null;
  const filtered = library.polls.filter(
    (p) =>
      (tab === 'draft' ? p.status === 'draft' : p.status !== 'draft') &&
      `${p.question} ${p.detail}`.toLowerCase().includes(search.toLowerCase()),
  );
  async function action(p: Poll, kind: 'open' | 'close' | 'delete') {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api.action(p.id, kind);
      if (kind === 'open') setTab('history');
      if (kind === 'delete') setSelected(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update question.');
    } finally {
      setBusy(false);
    }
  }
  function edit(p: Poll, duplicate: boolean) {
    setEditor({
      id: duplicate ? null : p.id,
      draft: {
        question: p.question,
        detail: p.detail,
        kind: p.kind,
        labels: p.options.map((o) => o.label),
      },
    });
  }
  return (
    <div className="poll-app teacher">
      <header className="poll-header">
        <Link to={preview ? '/preview/polls/manage' : '/manage'} className="class-name">
          Clearview Ward <span>Sunday School</span>
        </Link>
        <nav>
          <Link to={preview ? '/preview/polls' : '/'} target="_blank">
            Class view <ArrowUpRight size={15} />
          </Link>
          {!preview && (
            <button className="text-button" onClick={() => void signOut()}>
              Sign out
            </button>
          )}
        </nav>
      </header>
      <main className="teacher-main">
        <div className="teacher-title">
          <div>
            <p className="eyebrow">Teacher's desk</p>
            <h1>Listen to the room.</h1>
            <p>A question. A little reflection. A better conversation.</p>
          </div>
          <button className="poll-button" onClick={() => setEditor({ id: null })}>
            <Plus size={18} />
            New question
          </button>
        </div>
        {connection && (
          <p role="status" className="poll-notice">
            Reconnecting. {connection}
          </p>
        )}
        {error && (
          <p role="alert" className="poll-notice">
            {error}
            <button className="text-button" onClick={() => setError('')}>
              Dismiss
            </button>
          </p>
        )}
        <div className="live-strip">
          <div className="live-strip-icon">
            <Radio size={23} />
          </div>
          <div>
            <span className="eyebrow">
              {active ? 'On the class’s phones' : 'The class is waiting'}
            </span>
            <p>{active?.question || 'Send a question whenever you’re ready.'}</p>
          </div>
          {active && (
            <>
              <button
                className="text-button"
                onClick={() => {
                  setSelected(active.id);
                  setTab('history');
                }}
              >
                View responses
              </button>
              <button
                className="poll-button secondary compact"
                disabled={busy}
                onClick={() => void action(active, 'close')}
              >
                <Square size={14} />
                Close
              </button>
            </>
          )}
        </div>
        <div className={`teacher-workspace ${chosen ? 'has-selection' : ''}`}>
          <aside className="poll-library">
            <div className="library-heading">
              <h2>Your questions</h2>
              <span>{library.polls.length}</span>
            </div>
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Search questions"
                placeholder="Find a question…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="poll-tabs" role="tablist" aria-label="Question library">
              <button role="tab" aria-selected={tab === 'draft'} onClick={() => setTab('draft')}>
                Drafts <span>{library.polls.filter((p) => p.status === 'draft').length}</span>
              </button>
              <button
                role="tab"
                aria-selected={tab === 'history'}
                onClick={() => setTab('history')}
              >
                History <span>{library.polls.filter((p) => p.status !== 'draft').length}</span>
              </button>
            </div>
            <div className="library-list">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  className={`library-item ${selected === p.id ? 'selected' : ''}`}
                  onClick={() => setSelected(p.id)}
                >
                  <div className="item-meta">
                    <span>{p.kind === 'multi' ? 'Multiple choice' : 'Single choice'}</span>
                    {p.status === 'open' && <span className="live-dot">Open</span>}
                  </div>
                  <h3>{p.question}</h3>
                  <p>
                    {p.status === 'draft'
                      ? `${p.options.length} options · Ready when you are`
                      : `${library.results[p.id]?.respondents ?? 0} responses · ${new Date(p.opened_at || p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                  </p>
                </button>
              ))}
              {!filtered.length && (
                <p className="empty-library">
                  {!loaded
                    ? 'Loading questions…'
                    : search
                      ? 'No matching questions.'
                      : tab === 'draft'
                        ? 'Make a little room for a good question. Create your first draft above.'
                        : 'Questions you send will stay here with their results.'}
                </p>
              )}
            </div>
            <Link className="archive-link" to="/archive/manage">
              Earlier lessons and results <ArrowUpRight size={14} />
            </Link>
          </aside>
          <section className="poll-detail">
            {chosen ? (
              <>
                <button className="mobile-back text-button" onClick={() => setSelected(null)}>
                  <ArrowLeft size={17} />
                  Your questions
                </button>
                <div className="detail-heading">
                  <span className="eyebrow">
                    {chosen.status === 'draft' ? 'Ready for class' : 'Your class’s perspective'}
                  </span>
                  <span className={`poll-badge ${chosen.status === 'open' ? 'is-open' : ''}`}>
                    {chosen.status === 'draft'
                      ? 'Draft'
                      : chosen.status === 'open'
                        ? 'Open now'
                        : 'Closed'}
                  </span>
                </div>
                <h2>{chosen.question}</h2>
                {chosen.detail && <p className="detail-copy">{chosen.detail}</p>}
                <div className="gold-rule" />
                {chosen.status === 'draft' ? (
                  <div className="draft-options">
                    {chosen.options.map((o) => (
                      <div key={o.id}>
                        <span
                          className={`empty-indicator ${chosen.kind === 'single' ? 'round' : ''}`}
                        />
                        {o.label}
                      </div>
                    ))}
                  </div>
                ) : (
                  <ResultBars
                    poll={chosen}
                    results={library.results[chosen.id] || { respondents: 0, counts: {} }}
                  />
                )}
                <div className="detail-actions">
                  {chosen.status === 'open' ? (
                    <button
                      disabled={busy}
                      className="poll-button secondary"
                      onClick={() => void action(chosen, 'close')}
                    >
                      <Square size={15} />
                      Close question
                    </button>
                  ) : (
                    <button
                      disabled={busy}
                      className="poll-button"
                      onClick={() => void action(chosen, 'open')}
                    >
                      <Send size={16} />
                      {chosen.status === 'closed' ? 'Reopen question' : 'Send to class'}
                    </button>
                  )}
                  <button
                    className="poll-button secondary"
                    disabled={busy}
                    onClick={() => edit(chosen, true)}
                  >
                    <Copy size={16} />
                    {chosen.status === 'draft' ? 'Duplicate' : 'Ask again'}
                  </button>
                </div>
                <div className="detail-small-actions">
                  {!chosen.locked && chosen.status !== 'open' && (
                    <button className="text-button" onClick={() => edit(chosen, false)}>
                      <Edit3 size={14} />
                      Edit question
                    </button>
                  )}
                  {chosen.status === 'draft' && !chosen.locked && (
                    <button
                      className="text-button danger"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm('Delete this unanswered draft?'))
                          void action(chosen, 'delete');
                      }}
                    >
                      <Trash2 size={14} />
                      Delete draft
                    </button>
                  )}
                </div>
                <p className="privacy-note">
                  {chosen.locked
                    ? 'This question is kept with its original wording. Ask again to make an editable copy.'
                    : 'Responses are private. Only you see the results.'}
                </p>
              </>
            ) : (
              <div className="detail-empty">
                <div className="gold-rule" />
                <h2>Good questions make space.</h2>
                <p>
                  Choose a question to prepare it for class
                  <br />
                  or return to what people shared.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
      {editor && (
        <PollEditor
          key={`${editor.id}:${editor.draft?.question}`}
          draft={editor.draft}
          onClose={() => setEditor(null)}
          onSave={async (draft) => {
            const id = await api.savePoll(editor.id, draft);
            await load();
            setSelected(id);
            setTab(editor.id !== null && chosen?.status !== 'draft' ? 'history' : 'draft');
            setEditor(null);
          }}
        />
      )}
    </div>
  );
}
function ResultBars({ poll, results }: { poll: Poll; results: Results }) {
  return (
    <div className="results">
      <div className="results-heading">
        <strong>{results.respondents}</strong>
        <span>
          response{results.respondents === 1 ? '' : 's'}
          <small>
            {poll.status === 'open'
              ? 'Updating live · Only visible to you'
              : 'Saved results · Only visible to you'}
          </small>
        </span>
      </div>
      {poll.options.map((o) => {
        const n = results.counts[o.id] || 0;
        const percent = results.respondents ? Math.round((n / results.respondents) * 100) : 0;
        return (
          <div className="result-row" key={o.id}>
            <div>
              <span>{o.label}</span>
              <strong>
                {n}
                <small>{percent}%</small>
              </strong>
            </div>
            <div className="result-track">
              <div style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
      {poll.kind === 'multi' && (
        <p className="results-note">
          People can choose more than one. Percentages are of respondents.
        </p>
      )}
    </div>
  );
}
function PollEditor({
  draft,
  onClose,
  onSave,
}: {
  draft?: PollDraft;
  onClose: () => void;
  onSave: (draft: PollDraft) => Promise<void>;
}) {
  const [question, setQuestion] = useState(draft?.question || '');
  const [detail, setDetail] = useState(draft?.detail || '');
  const [kind, setKind] = useState<Poll['kind']>(draft?.kind || 'single');
  const [options, setOptions] = useState(draft?.labels.join('\n') || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({
        question: question.trim(),
        detail: detail.trim(),
        kind,
        labels: options
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      className="poll-dialog"
      ref={(element) => {
        if (element && !element.open) element.showModal();
      }}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      aria-labelledby="editor-title"
    >
      <form onSubmit={(e) => void submit(e)}>
        <div className="editor-heading">
          <div>
            <p className="eyebrow">Make room for reflection</p>
            <h2 id="editor-title">{draft ? 'Prepare your question' : 'A new question'}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close editor"
            disabled={busy}
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        <label>
          Question
          <textarea
            autoFocus
            required
            maxLength={1000}
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to ask the class?"
          />
        </label>
        <label>
          Helper text <span className="optional">Optional</span>
          <input
            maxLength={2000}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="A little context, if it helps"
          />
        </label>
        <fieldset className="type-picker">
          <legend>How can people answer?</legend>
          <label>
            <input
              type="radio"
              name="kind"
              checked={kind === 'single'}
              onChange={() => setKind('single')}
            />
            Choose one
          </label>
          <label>
            <input
              type="radio"
              name="kind"
              checked={kind === 'multi'}
              onChange={() => setKind('multi')}
            />
            Choose several
          </label>
        </fieldset>
        <label>
          Choices <span className="optional">One per line · At least two</span>
          <textarea
            required
            rows={5}
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder={'First choice\nSecond choice\nThird choice'}
          />
        </label>
        {error && (
          <p role="alert" className="poll-notice">
            {error}
          </p>
        )}
        <div className="editor-actions">
          <button type="button" className="poll-button secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="poll-button"
            disabled={
              busy || !question.trim() || options.split('\n').filter((o) => o.trim()).length < 2
            }
          >
            <Check size={17} />
            {busy ? 'Saving…' : 'Save draft'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
