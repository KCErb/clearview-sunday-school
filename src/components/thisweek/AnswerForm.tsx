import { useState, type FormEvent } from 'react';
import { submitAnswer } from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import { Spinner } from '@/components/Spinner';
import { SharingOptions } from './SharingOptions';

export function AnswerForm({
  questionId,
  userId,
  onSubmitted,
}: {
  questionId: number;
  userId: string;
  onSubmitted: () => void;
}) {
  const { show } = useToast();
  const [body, setBody] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [nameInClass, setNameInClass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    const { error } = await submitAnswer({
      question_id: questionId,
      body: body.trim(),
      is_anonymous: anonymous,
      author_id: anonymous ? null : userId,
      attribution_ok: !anonymous && nameInClass,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBody('');
    setAnonymous(false);
    setNameInClass(false);
    show('Shared with KC');
    onSubmitted();
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

      <SharingOptions
        anonymous={anonymous}
        setAnonymous={setAnonymous}
        nameInClass={nameInClass}
        setNameInClass={setNameInClass}
      />

      <p className="text-xs leading-relaxed text-ink-faint">
        This goes only to KC, to help prepare the lesson — it isn’t posted for others on the site.
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
