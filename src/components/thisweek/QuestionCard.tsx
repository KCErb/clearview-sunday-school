import { useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { AnswerForm } from './AnswerForm';
import type { Answer, Question, SharedAnswer } from '@/lib/types';

export function QuestionCard({
  question,
  shared,
  adminAnswers,
  isAdmin,
  userId,
  onChange,
}: {
  question: Question;
  shared: SharedAnswer[];
  adminAnswers: Answer[];
  isAdmin: boolean;
  userId: string;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white/80 shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <span className="font-medium text-ink">{question.prompt}</span>
        <span className="shrink-0 text-xs font-medium text-brand">{open ? 'Close' : 'Respond'}</span>
      </button>

      {open && (
        <div className="space-y-5 border-t border-sky-100 p-4">
          {shared.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Shared with the class
              </h4>
              <ul className="space-y-2">
                {shared.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl bg-sky-50/80 px-3.5 py-2.5 text-sm leading-relaxed text-ink"
                  >
                    {a.body}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <AnswerForm questionId={question.id} userId={userId} onSubmitted={onChange} />

          {isAdmin && (
            <AdminAnswers answers={adminAnswers} onChange={onChange} />
          )}
        </div>
      )}
    </div>
  );
}

function AdminAnswers({ answers, onChange }: { answers: Answer[]; onChange: () => void }) {
  async function togglePublish(a: Answer) {
    await supabase.from('answers').update({ published: !a.published }).eq('id', a.id);
    onChange();
  }

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
        KC only · {answers.length} response{answers.length === 1 ? '' : 's'}
      </h4>
      {answers.length === 0 ? (
        <p className="text-sm text-ink-faint">No responses yet.</p>
      ) : (
        <ul className="space-y-2">
          {answers.map((a) => (
            <li key={a.id} className="rounded-lg bg-white p-2.5 text-sm shadow-sm">
              <p className="text-ink">{a.body}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge tone={a.is_anonymous ? 'slate' : 'sky'}>
                  {a.is_anonymous ? 'anonymous' : 'named'}
                </Badge>
                {a.share_pref === 'summarize_only' && (
                  <Badge tone="amber">don't quote — summarize</Badge>
                )}
                <button
                  onClick={() => togglePublish(a)}
                  disabled={a.share_pref === 'summarize_only' && !a.published}
                  title={
                    a.share_pref === 'summarize_only'
                      ? 'This person asked not to be quoted verbatim'
                      : ''
                  }
                  className={`ml-auto rounded-md px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    a.published
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-brand text-white hover:bg-brand-bright'
                  }`}
                >
                  {a.published ? 'Shared ✓ (unshare)' : 'Share with class'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: 'slate' | 'sky' | 'amber';
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    sky: 'bg-sky-100 text-brand',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
