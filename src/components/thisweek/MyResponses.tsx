import { useState } from 'react';
import { deleteAnswer, updateAnswer } from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import { Spinner } from '@/components/Spinner';
import type { Answer, SharePref } from '@/lib/types';

export function MyResponses({ answers, onChange }: { answers: Answer[]; onChange: () => void }) {
  if (answers.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Your response{answers.length === 1 ? '' : 's'}
      </h3>
      <ul className="space-y-2">
        {answers.map((a) => (
          <MyAnswer key={a.id} answer={a} onChange={onChange} />
        ))}
      </ul>
    </div>
  );
}

function statusLabel(a: Answer) {
  if (a.published) return { text: 'Shared with the class', cls: 'bg-emerald-100 text-emerald-700' };
  if (a.edited_at) return { text: 'Edited — waiting for KC', cls: 'bg-amber-100 text-amber-700' };
  return { text: 'Sent to KC privately', cls: 'bg-sky-100 text-brand' };
}

function MyAnswer({ answer, onChange }: { answer: Answer; onChange: () => void }) {
  const { show } = useToast();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(answer.body);
  const [sharePref, setSharePref] = useState<SharePref>(answer.share_pref);
  const [busy, setBusy] = useState(false);
  const status = statusLabel(answer);

  async function save() {
    if (!body.trim()) return;
    setBusy(true);
    const { error } = await updateAnswer(answer.id, { body: body.trim(), share_pref: sharePref });
    setBusy(false);
    if (error) {
      show(error.message, 'info');
      return;
    }
    setEditing(false);
    show('Saved — KC will review before resharing');
    onChange();
  }

  async function remove() {
    if (!window.confirm('Delete this response? This cannot be undone.')) return;
    setBusy(true);
    const { error } = await deleteAnswer(answer.id);
    setBusy(false);
    if (error) {
      show(error.message, 'info');
      return;
    }
    show('Response deleted');
    onChange();
  }

  return (
    <li className="rounded-xl border border-sky-100 bg-white p-3 text-sm shadow-sm">
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={sharePref === 'summarize_only'}
              onChange={(e) => setSharePref(e.target.checked ? 'summarize_only' : 'verbatim_ok')}
              className="h-4 w-4 accent-brand"
            />
            Please don't quote me — KC can summarize
          </label>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={busy || !body.trim()}
              className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50"
            >
              {busy ? <Spinner className="h-3.5 w-3.5" /> : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setBody(answer.body);
                setSharePref(answer.share_pref);
              }}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-ink">{answer.body}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.cls}`}>
              {status.text}
            </span>
            {answer.share_pref === 'summarize_only' && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                don't quote
              </span>
            )}
            <button
              onClick={() => setEditing(true)}
              className="ml-auto text-xs font-semibold text-brand hover:text-brand-bright"
            >
              Edit
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </li>
  );
}
