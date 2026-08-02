export interface TallyItem {
  option_id: number;
  label: string;
  votes: number;
}

/**
 * Shared by KC's console and the revealed class view. Bars are scaled to the leading
 * option so a 3-vote winner still reads clearly; zero-vote options stay visible, since
 * a tally that dropped them would misrepresent the room.
 */
export function TallyBars({ items, responders }: { items: TallyItem[]; responders?: number }) {
  const max = Math.max(1, ...items.map((i) => i.votes));

  return (
    <div>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.option_id}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-ink">{i.label}</span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-brand">{i.votes}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-sky-100">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
                style={{ width: `${(i.votes / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      {responders != null && (
        <p className="mt-3 text-xs text-ink-faint">
          {responders} {responders === 1 ? 'person has' : 'people have'} responded
        </p>
      )}
    </div>
  );
}
