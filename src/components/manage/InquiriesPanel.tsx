import { Attribution } from './Attribution';
import type { Inquiry } from '@/lib/types';

export function InquiriesPanel({
  inquiries,
  names,
}: {
  inquiries: Inquiry[];
  names: Record<string, string>;
}) {
  if (inquiries.length === 0) {
    return <p className="text-sm text-ink-faint">No questions from the class yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {inquiries.map((q) => (
        <li key={q.id} className="flex items-start justify-between gap-3 rounded-xl bg-white p-3 text-sm shadow-sm">
          <p className="text-ink">{q.body}</p>
          <div className="shrink-0">
            <Attribution anonymous={q.is_anonymous} name={q.author_id ? names[q.author_id] : undefined} />
          </div>
        </li>
      ))}
    </ul>
  );
}
