import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { allAnswers, deleteAnswer, updateAnswer } from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import type { Answer } from '@/lib/types';

export function ResponsesPanel({ questionId }: { questionId: number }) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Answer[] | null>(null);

  const load = useCallback(async () => {
    setAnswers(await allAnswers(questionId));
  }, [questionId]);

  useEffect(() => {
    if (!open || answers !== null) return;
    void (async () => {
      await load();
    })();
  }, [open, answers, load]);

  const count = answers?.length ?? 0;

  async function togglePublish(a: Answer) {
    await updateAnswer(a.id, { published: !a.published });
    show(a.published ? 'Unshared' : 'Shared with class');
    await load();
  }
  async function remove(a: Answer) {
    if (!window.confirm('Delete this response?')) return;
    await deleteAnswer(a.id);
    show('Deleted');
    await load();
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-semibold text-ink-soft hover:text-ink"
      >
        {open ? '▾' : '▸'} Responses{answers ? ` (${count})` : ''}
      </button>
      {open && (
        <div className="mt-2">
          {answers === null ? (
            <p className="text-xs text-ink-faint">Loading…</p>
          ) : count === 0 ? (
            <p className="text-xs text-ink-faint">No responses yet.</p>
          ) : (
            <ul className="space-y-2">
              {answers.map((a) => (
                <li key={a.id} className="rounded-lg border border-sky-100 bg-white p-2.5 text-sm">
                  <p className="text-ink">{a.body}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge cls={a.is_anonymous ? 'bg-slate-100 text-slate-600' : 'bg-sky-100 text-brand'}>
                      {a.is_anonymous ? 'anonymous' : 'named'}
                    </Badge>
                    {a.share_pref === 'summarize_only' && (
                      <Badge cls="bg-amber-100 text-amber-700">don't quote — summarize</Badge>
                    )}
                    {a.edited_at && !a.published && (
                      <Badge cls="bg-amber-100 text-amber-700">edited — needs re-approval</Badge>
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
                    <button
                      onClick={() => remove(a)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ children, cls }: { children: ReactNode; cls: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}
