/**
 * Admin attribution display. Three states:
 *  - anonymous: not even KC knows who
 *  - named, OK to show in class
 *  - named, KC only (don't put the name in class) — the safe default
 */
export function Attribution({
  anonymous,
  name,
  attributionOk,
}: {
  anonymous: boolean;
  name?: string;
  attributionOk?: boolean;
}) {
  if (anonymous) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
        Anonymous
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-sm font-semibold text-ink">{name ?? 'Member'}</span>
      {attributionOk ? (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          name OK in class
        </span>
      ) : (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          KC only — don’t name in class
        </span>
      )}
    </span>
  );
}
