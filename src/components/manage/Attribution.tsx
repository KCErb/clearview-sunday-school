/** Shows a member's name, or a muted "Anonymous" tag (for admin views). */
export function Attribution({ anonymous, name }: { anonymous: boolean; name?: string }) {
  if (anonymous) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
        Anonymous
      </span>
    );
  }
  return <span className="text-sm font-semibold text-ink">{name ?? 'Member'}</span>;
}
