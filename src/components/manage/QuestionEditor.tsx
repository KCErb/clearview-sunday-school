import { useState } from 'react';
import { deleteQuestion, updateQuestion } from '@/data/cwass';
import { useToast } from '@/components/toast/useToast';
import { ResponsesPanel } from './ResponsesPanel';
import type { Question } from '@/lib/types';

export function QuestionEditor({ question, onChange }: { question: Question; onChange: () => void }) {
  const { show } = useToast();
  const [editing, setEditing] = useState(false);
  const [prompt, setPrompt] = useState(question.prompt);
  const [ref, setRef] = useState(question.reference_url ?? '');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!prompt.trim()) return;
    setBusy(true);
    await updateQuestion(question.id, { prompt: prompt.trim(), reference_url: ref.trim() || null });
    setBusy(false);
    setEditing(false);
    show('Question saved');
    onChange();
  }
  async function remove() {
    if (!window.confirm('Delete this question and all its responses?')) return;
    await deleteQuestion(question.id);
    show('Question deleted');
    onChange();
  }
  async function toggleActive() {
    await updateQuestion(question.id, { is_active: !question.is_active });
    onChange();
  }

  return (
    <li className="rounded-xl border border-sky-100 bg-white/80 p-3 shadow-sm">
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="Reference URL (optional)"
            className="w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={busy || !prompt.trim()}
              className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setPrompt(question.prompt);
                setRef(question.reference_url ?? '');
              }}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className={`text-sm ${question.is_active ? 'text-ink' : 'text-ink-faint line-through'}`}>
            {question.prompt}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            {question.reference_url && (
              <a
                href={question.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand hover:text-brand-bright"
              >
                reference ↗
              </a>
            )}
            <button onClick={() => setEditing(true)} className="font-semibold text-brand hover:text-brand-bright">
              Edit
            </button>
            <button onClick={toggleActive} className="font-medium text-ink-soft hover:text-ink">
              {question.is_active ? 'Hide' : 'Show'}
            </button>
            <button onClick={remove} className="font-semibold text-red-600 hover:text-red-700">
              Delete
            </button>
          </div>
          <ResponsesPanel questionId={question.id} />
        </>
      )}
    </li>
  );
}
