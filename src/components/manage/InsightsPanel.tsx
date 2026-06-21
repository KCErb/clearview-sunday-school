import { useState } from 'react';
import { deleteInsight } from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import type { Insight } from '@/lib/types';

/** Admin review of open-ended "share an insight" submissions for one section. */
export function InsightsPanel({ insights, onChange }: { insights: Insight[]; onChange: () => void }) {
  return (
    <div>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Shared insights{insights.length ? ` (${insights.length})` : ''}
      </span>
      {insights.length === 0 ? (
        <p className="text-sm text-ink-faint">No insights shared yet.</p>
      ) : (
        <ul className="space-y-2">
          {insights.map((i) => (
            <InsightRow key={i.id} insight={i} onChange={onChange} />
          ))}
        </ul>
      )}
    </div>
  );
}

function InsightRow({ insight, onChange }: { insight: Insight; onChange: () => void }) {
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm('Delete this insight?')) return;
    setBusy(true);
    await deleteInsight(insight.id);
    setBusy(false);
    show('Deleted');
    onChange();
  }

  return (
    <li className="rounded-xl border border-sky-100 bg-white p-3 text-sm shadow-sm">
      <p className="text-ink">{insight.body}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge cls={insight.is_anonymous ? 'bg-slate-100 text-slate-600' : 'bg-sky-100 text-brand'}>
          {insight.is_anonymous ? 'anonymous' : 'named'}
        </Badge>
        {insight.share_pref === 'summarize_only' && (
          <Badge cls="bg-amber-100 text-amber-700">don't quote — summarize</Badge>
        )}
        <button onClick={remove} disabled={busy} className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700">
          Delete
        </button>
      </div>
    </li>
  );
}

function Badge({ children, cls }: { children: string; cls: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}
