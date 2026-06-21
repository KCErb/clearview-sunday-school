import { useState } from 'react';
import { deleteInsight, updateInsight } from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import { Spinner } from '@/components/Spinner';
import type { Insight } from '@/lib/types';

/** A member's own insights for a section — they can read/edit/delete them. */
export function MyInsights({ insights, onChange }: { insights: Insight[]; onChange: () => void }) {
  if (insights.length === 0) return null;
  return (
    <ul className="space-y-2">
      {insights.map((i) => (
        <MyInsight key={i.id} insight={i} onChange={onChange} />
      ))}
    </ul>
  );
}

function MyInsight({ insight, onChange }: { insight: Insight; onChange: () => void }) {
  const { show } = useToast();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(insight.body);
  const [nameInClass, setNameInClass] = useState(insight.attribution_ok);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!body.trim()) return;
    setBusy(true);
    const { error } = await updateInsight(insight.id, { body: body.trim(), attribution_ok: nameInClass });
    setBusy(false);
    if (error) return show(error.message, 'info');
    setEditing(false);
    show('Saved');
    onChange();
  }
  async function remove() {
    if (!window.confirm('Delete this insight?')) return;
    setBusy(true);
    const { error } = await deleteInsight(insight.id);
    setBusy(false);
    if (error) return show(error.message, 'info');
    show('Deleted');
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
              checked={nameInClass}
              onChange={(e) => setNameInClass(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            You can use my name in class
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
                setBody(insight.body);
                setNameInClass(insight.attribution_ok);
              }}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-ink">{insight.body}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-brand">
              Only KC sees this
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {insight.attribution_ok ? 'name OK in class' : 'no name in class'}
            </span>
            <button onClick={() => setEditing(true)} className="ml-auto text-xs font-semibold text-brand hover:text-brand-bright">
              Edit
            </button>
            <button onClick={remove} disabled={busy} className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50">
              Delete
            </button>
          </div>
        </>
      )}
    </li>
  );
}
