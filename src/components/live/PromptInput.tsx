import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Spinner } from '@/components/Spinner';
import type { LiveOption, LivePrompt } from '@/lib/types';

/** Renders the response control for a prompt's kind and hands the answer back to /live. */
export function PromptInput({
  prompt,
  options,
  onSubmit,
}: {
  prompt: LivePrompt;
  options: LiveOption[];
  onSubmit: (p: { option_ids: number[]; body: string | null }) => Promise<string | null>;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isText = prompt.kind === 'text';
  const ready = isText ? body.trim().length > 0 : picked.length > 0;

  function toggle(id: number) {
    setPicked((cur) =>
      prompt.kind === 'single'
        ? [id]
        : cur.includes(id)
          ? cur.filter((x) => x !== id)
          : [...cur, id],
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    const err = await onSubmit({
      option_ids: isText ? [] : picked,
      body: isText ? body.trim() : null,
    });
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {isText ? (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          autoFocus
          placeholder="Type your thought…"
          className="w-full resize-y rounded-xl border border-sky-100 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      ) : (
        <ul className="space-y-2.5">
          {options.map((o) => {
            const on = picked.includes(o.id);
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => toggle(o.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-base transition ${
                    on
                      ? 'border-brand bg-brand/10 font-semibold text-ink shadow-sm'
                      : 'border-sky-100 bg-white/80 text-ink hover:border-brand/40'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 transition ${
                      prompt.kind === 'multi' ? 'rounded-md' : 'rounded-full'
                    } ${on ? 'border-brand bg-brand text-white' : 'border-sky-200'}`}
                  >
                    {on && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {prompt.kind === 'multi' && (
        <p className="text-xs text-ink-faint">Choose as many as you like.</p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={!ready || saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-base font-semibold text-white transition hover:bg-brand-bright disabled:opacity-40"
      >
        {saving ? <Spinner className="h-5 w-5" /> : 'Send'}
      </button>
    </form>
  );
}
