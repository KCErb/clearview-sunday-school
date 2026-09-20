import { useRef, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PollError, type Poll, type PollApi, type WriteIn } from './types';
import { useRefresh } from './useRefresh';

interface Draft { id: string; body: string; revision: number }

export function WriteIns({ api, poll, token, preview }: {
  api: PollApi; poll: Poll; token: string; preview: boolean;
}) {
  const draftKey = `${preview ? 'cwass.demo' : 'cwass.poll'}.write-in-draft.${poll.id}`;
  const [items, setItems] = useState<WriteIn[]>([]);
  const [draft, setDraft] = useState<Draft | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
      return saved && typeof saved.id === 'string' && typeof saved.body === 'string' &&
        Number.isSafeInteger(saved.revision) ? saved : null;
    } catch { return null; }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState('');
  const [status, setStatus] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const generation = useRef(0);
  const open = poll.status === 'open';

  function remember(next: Draft | null) {
    setDraft(next);
    try {
      if (next) localStorage.setItem(draftKey, JSON.stringify(next));
      else localStorage.removeItem(draftKey);
    } catch { /* The editor remains usable when storage is unavailable. */ }
  }
  useRefresh(async () => {
    // Do not let an older list response replace an acknowledged edit.
    if (busy) return;
    const started = generation.current;
    try {
      const rows = await api.writeIns(poll.id, token);
      if (started === generation.current) { setItems(rows); setConnection(''); }
    }
    catch { setConnection('Reconnecting to your suggestions…'); }
  });

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || busy || !open || !draft.body.trim()) return;
    generation.current++;
    setBusy(true); setError(''); setStatus('');
    try {
      const saved = await api.saveWriteIn(poll.id, token, draft.id, draft.body.trim(), draft.revision, poll.opened_at || '');
      remember(null);
      setStatus('Suggestion saved');
      setConnection('');
      setItems(current => [...current.filter(row => row.id !== saved.id), saved]
        .sort((a, b) => a.created_at.localeCompare(b.created_at)));
    } catch (error) {
      if (error instanceof PollError && error.code === 'conflict') {
        try {
          const rows = await api.writeIns(poll.id, token); setItems(rows);
          const latest = rows.find(row => row.id === draft.id);
          remember({ ...draft, id: latest?.id || crypto.randomUUID(), revision: latest?.revision || 0 });
          setError('This suggestion changed in another tab. Review your text and save again.');
        } catch { setError('Reconnecting. Your text is kept here; please try saving again.'); }
      } else setError(error instanceof PollError && error.code === 'closed'
        ? 'This question has closed. Your suggestion was not saved.'
        : error instanceof Error ? error.message : 'Your suggestion is not saved yet. Please try again.');
    } finally { setBusy(false); }
  }
  async function remove(item: WriteIn) {
    if (busy || !open) return;
    generation.current++;
    setBusy(true); setDeleting(item.id); setError(''); setStatus('');
    try {
      await api.saveWriteIn(poll.id, token, item.id, null, item.revision, poll.opened_at || '');
      setItems(current => current.filter(row => row.id !== item.id));
      if (draft?.id === item.id) remember(null);
      setStatus('Suggestion removed');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not remove your suggestion. Please try again.');
    } finally { setBusy(false); setDeleting(null); }
  }

  return <section className="write-ins" aria-label="Your own suggestions">
    {items.length > 0 && <>
      <h2>Your suggestions</h2>
      <ul className="write-in-list">{items.map(item => <li key={item.id}>
        <p>{item.body}</p>
        {open && <div className="write-in-actions">
          <button className="text-button" disabled={busy} onClick={() => {
            remember({ id: item.id, body: item.body, revision: item.revision }); setError(''); setStatus('');
          }}><Pencil size={14} />Edit</button>
          <button className="text-button" disabled={busy} onClick={() => void remove(item)}>
            <Trash2 size={14} />{deleting === item.id ? 'Removing…' : 'Remove'}
          </button>
        </div>}
      </li>)}</ul>
    </>}
    {draft && open ? <form className="write-in-editor" onSubmit={event => void save(event)}>
      <label htmlFor={`write-in-${poll.id}`}>What would you like to discuss?</label>
      <textarea id={`write-in-${poll.id}`} autoFocus maxLength={2000} rows={3} required
        value={draft.body} disabled={busy} onChange={event => remember({ ...draft, body: event.target.value })} />
      <p className="write-in-help">Only you and the teacher can see your suggestions.</p>
      <div className="write-in-actions">
        <button className="poll-button" disabled={busy || !draft.body.trim()}>{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" className="text-button" disabled={busy} onClick={() => { remember(null); setError(''); }}>Cancel</button>
      </div>
    </form> : open && <button className="text-button add-write-in" disabled={busy} onClick={() => {
      remember({ id: crypto.randomUUID(), body: '', revision: 0 }); setError(''); setStatus('');
    }}><Plus size={17} />Add my own</button>}
    {error && <p role="alert" className="write-in-error">{error}</p>}
    {(status || connection) && <p role="status" className="write-in-help">{connection || status}</p>}
  </section>;
}
