import { deleteInquiry } from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import type { Inquiry } from '@/lib/types';

export function InquiriesPanel({ inquiries, onChange }: { inquiries: Inquiry[]; onChange: () => void }) {
  if (inquiries.length === 0) {
    return <p className="text-sm text-ink-faint">No questions from the class yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {inquiries.map((q) => (
        <InquiryRow key={q.id} inquiry={q} onChange={onChange} />
      ))}
    </ul>
  );
}

function InquiryRow({ inquiry, onChange }: { inquiry: Inquiry; onChange: () => void }) {
  const { show } = useToast();
  async function remove() {
    if (!window.confirm('Delete this question?')) return;
    await deleteInquiry(inquiry.id);
    show('Deleted');
    onChange();
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-xl bg-white p-3 text-sm shadow-sm">
      <p className="text-ink">{inquiry.body}</p>
      <div className="flex shrink-0 items-center gap-3">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {inquiry.is_anonymous ? 'anonymous' : 'named'}
        </span>
        <button onClick={remove} className="text-xs font-semibold text-red-600 hover:text-red-700">
          Delete
        </button>
      </div>
    </li>
  );
}
