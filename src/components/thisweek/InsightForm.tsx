import { useState, type FormEvent } from 'react';
import { submitInsight } from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import { Spinner } from '@/components/Spinner';
import type { SharePref } from '@/lib/types';

export function InsightForm({
  sessionId,
  cfmWeek,
  userId,
  onSubmitted,
}: {
  sessionId: number;
  cfmWeek: number | null;
  userId: string;
  onSubmitted: () => void;
}) {
  const { show } = useToast();
  const [body, setBody] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [sharePref, setSharePref] = useState<SharePref>('verbatim_ok');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    const { error } = await submitInsight({
      session_id: sessionId,
      cfm_week: cfmWeek,
      body: body.trim(),
      is_anonymous: anonymous,
      author_id: anonymous ? null : userId,
      share_pref: sharePref,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBody('');
    setAnonymous(false);
    setSharePref('verbatim_ok');
    setOpen(false);
    show('Shared with KC');
    onSubmitted();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-sky-200 bg-white/40 p-4 text-left text-sm font-medium text-ink-soft transition hover:border-brand/50 hover:text-brand"
      >
        ✍️ Share an insight with the class…
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        autoFocus
        placeholder="Something that stood out, a thought to offer, a way you’re applying this…"
        className="w-full resize-y rounded-xl border border-sky-100 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <div className="space-y-2.5 rounded-xl bg-sky-50/70 p-3">
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />
          <span>
            <span className="font-medium text-ink">Post anonymously</span>
            <span className="block text-xs text-ink-faint">
              Your name is never attached — not even KC can see who wrote it.
              {anonymous && ' (Anonymous insights can’t be edited later.)'}
            </span>
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={sharePref === 'summarize_only'}
            onChange={(e) => setSharePref(e.target.checked ? 'summarize_only' : 'verbatim_ok')}
            className="h-4 w-4 accent-brand"
          />
          Please don’t quote me — KC can summarize
        </label>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50"
        >
          {saving ? <Spinner className="h-4 w-4" /> : 'Share'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
