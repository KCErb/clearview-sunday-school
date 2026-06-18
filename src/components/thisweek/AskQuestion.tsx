import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/Spinner';

export function AskQuestion({
  lessonId,
  userId,
  onSubmitted,
}: {
  lessonId: number | null;
  userId: string;
  onSubmitted: () => void;
}) {
  const [body, setBody] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('inquiries').insert({
      lesson_id: lessonId,
      body: body.trim(),
      is_anonymous: anonymous,
      author_id: anonymous ? null : userId,
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
      <p className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-800">
        Got it — thanks for asking.{' '}
        <button className="font-semibold underline hover:no-underline" onClick={() => setDone(false)}>
          Ask another
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
      <p className="mb-2 text-sm text-ink-soft">
        Wondering about something? Ask it here. KC may take it up in class or post a short answer.
      </p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="What's your question?"
        className="w-full resize-y rounded-xl border border-sky-100 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-ink-soft">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Ask anonymously
        </label>
        {error && <span className="text-xs text-red-700">{error}</span>}
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50"
        >
          {saving ? <Spinner className="h-4 w-4" /> : 'Ask'}
        </button>
      </div>
    </form>
  );
}
