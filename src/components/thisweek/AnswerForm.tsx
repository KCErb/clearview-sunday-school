import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/Spinner';
import type { SharePref } from '@/lib/types';

export function AnswerForm({
  questionId,
  userId,
  onSubmitted,
}: {
  questionId: number;
  userId: string;
  onSubmitted: () => void;
}) {
  const [body, setBody] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [sharePref, setSharePref] = useState<SharePref>('verbatim_ok');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('answers').insert({
      question_id: questionId,
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
    setDone(true);
    onSubmitted();
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-800">
        Thank you — this went straight to KC.{' '}
        <button
          className="font-semibold underline hover:no-underline"
          onClick={() => setDone(false)}
        >
          Share another thought
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Share what you're thinking…"
        className="w-full resize-y rounded-xl border border-sky-100 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />

      <div className="space-y-2.5 rounded-xl bg-sky-50/70 p-3">
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand"
          />
          <span>
            <span className="font-medium text-ink">Post anonymously</span>
            <span className="block text-xs text-ink-faint">
              Anonymous means anonymous — your name is never attached, and not even KC can see
              who wrote it.
            </span>
          </span>
        </label>

        <div className="text-sm">
          <span className="font-medium text-ink">Sharing</span>
          <div className="mt-1.5 grid gap-1.5">
            <ShareOption
              checked={sharePref === 'verbatim_ok'}
              onSelect={() => setSharePref('verbatim_ok')}
              label="Okay to share with the class as I wrote it"
            />
            <ShareOption
              checked={sharePref === 'summarize_only'}
              onSelect={() => setSharePref('summarize_only')}
              label="Please don't quote me — KC can summarize the idea"
            />
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-ink-faint">
        Nothing here appears to the class unless KC chooses to share it. Even then, it still
        helps shape the discussion.
      </p>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={saving || !body.trim()}
        className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50"
      >
        {saving ? <Spinner className="h-4 w-4" /> : 'Share with KC'}
      </button>
    </form>
  );
}

function ShareOption({
  checked,
  onSelect,
  label,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
        checked ? 'border-brand bg-white text-ink' : 'border-transparent text-ink-soft hover:bg-white/60'
      }`}
    >
      <input type="radio" checked={checked} onChange={onSelect} className="h-4 w-4 accent-brand" />
      {label}
    </label>
  );
}
