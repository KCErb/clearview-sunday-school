import { Attribution } from './Attribution';
import type { Insight } from '@/lib/types';

/** Admin view of open-ended "share an insight" submissions for one section. */
export function InsightsPanel({
  insights,
  names,
}: {
  insights: Insight[];
  names: Record<string, string>;
}) {
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
            <li key={i.id} className="rounded-xl border border-sky-100 bg-white p-3 text-sm shadow-sm">
              <p className="text-ink">{i.body}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Attribution anonymous={i.is_anonymous} name={i.author_id ? names[i.author_id] : undefined} />
                {i.share_pref === 'summarize_only' && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    don't quote — summarize
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
