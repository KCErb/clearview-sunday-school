import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Inquiry } from '@/lib/types';

export function AdminInquiries({
  inquiries,
  onChange,
}: {
  inquiries: Inquiry[];
  onChange: () => void;
}) {
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
  const [answer, setAnswer] = useState(inquiry.answer ?? '');
  const [saving, setSaving] = useState(false);

  async function save(publish?: boolean) {
    setSaving(true);
    const patch: Partial<Inquiry> = { answer: answer.trim() || null };
    if (publish !== undefined) patch.published = publish;
    await supabase.from('inquiries').update(patch).eq('id', inquiry.id);
    setSaving(false);
    onChange();
  }

  return (
    <li className="rounded-xl bg-white p-3 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-ink">{inquiry.body}</p>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {inquiry.is_anonymous ? 'anonymous' : 'named'}
        </span>
      </div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={2}
        placeholder="Write a short answer to share online (optional)…"
        className="mt-2 w-full resize-y rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => save()}
          disabled={saving}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
        >
          Save answer
        </button>
        <button
          onClick={() => save(!inquiry.published)}
          disabled={saving || (!inquiry.published && !answer.trim())}
          title={!answer.trim() ? 'Write an answer first' : ''}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            inquiry.published
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-brand text-white hover:bg-brand-bright'
          }`}
        >
          {inquiry.published ? 'Posted ✓ (unpost)' : 'Post Q&A to class'}
        </button>
      </div>
    </li>
  );
}
