import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function AddQuestion({ lessonId, onAdded }: { lessonId: number; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!prompt.trim()) return;
    setSaving(true);
    await supabase.from('questions').insert({ lesson_id: lessonId, prompt: prompt.trim() });
    setSaving(false);
    setPrompt('');
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-sky-200 px-3 py-2 text-xs font-medium text-ink-soft transition hover:border-brand hover:text-brand"
      >
        + Add a question (KC)
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        autoFocus
        placeholder="Write a key question for this lesson…"
        className="w-full resize-y rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={add}
          disabled={saving || !prompt.trim()}
          className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50"
        >
          Add
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
