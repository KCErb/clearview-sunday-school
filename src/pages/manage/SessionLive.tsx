import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Radio, Users } from 'lucide-react';
import {
  closeLivePrompt,
  createLivePrompt,
  deleteLivePrompt,
  getSession,
  liveResponses,
  livePromptsForSession,
  nameMap,
  openLivePrompt,
  optionsForSession,
  presentCount,
  saveLiveOptions,
  setLiveSession,
  updateLivePrompt,
} from '@/data/cwass';
import { useLiveRefresh } from '@/lib/useLiveRefresh';
import { useToast } from '@/components/toast/useToast';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { FullPageSpinner } from '@/components/Spinner';
import { TallyBars } from '@/components/live/TallyBars';
import type { LiveKind, LiveOption, LivePrompt, LiveResponse, Session } from '@/lib/types';

const POLL_MS = 2000; // KC's view — he wants it to feel live

const inputCls =
  'w-full resize-y rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

export function SessionLive() {
  const { id } = useParams();
  const sessionId = Number(id);
  const { show } = useToast();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [prompts, setPrompts] = useState<LivePrompt[]>([]);
  const [options, setOptions] = useState<LiveOption[]>([]);
  const [responses, setResponses] = useState<LiveResponse[]>([]);
  const [present, setPresent] = useState(0);
  const [names, setNames] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<number | null>(null);

  const open = prompts.find((p) => p.status === 'open') ?? null;

  const loadStructure = useCallback(async () => {
    const [s, ps, nm] = await Promise.all([getSession(sessionId), livePromptsForSession(sessionId), nameMap()]);
    setSession(s);
    setPrompts(ps);
    setNames(nm);
    setOptions(await optionsForSession(ps.map((p) => p.id)));
    setLoading(false);
  }, [sessionId]);

  // The fast loop: only what changes second to second.
  const loadLive = useCallback(async () => {
    const [ps, n] = await Promise.all([livePromptsForSession(sessionId), presentCount()]);
    setPrompts(ps);
    setPresent(n);
    const o = ps.find((p) => p.status === 'open');
    setResponses(o ? await liveResponses(o.id) : []);
  }, [sessionId]);

  useEffect(() => {
    void (async () => {
      await loadStructure();
    })();
  }, [loadStructure]);
  useEffect(() => {
    void (async () => {
      await loadLive();
    })();
  }, [loadLive]);
  useLiveRefresh(loadLive, POLL_MS);

  async function toggleLive() {
    if (!session) return;
    const next = !session.is_live;
    const { error } = await setLiveSession(session.id, next);
    if (error) return show(error.message, 'info');
    show(next ? 'You’re live' : 'Live session ended');
    await Promise.all([loadStructure(), loadLive()]);
  }

  async function send(promptId: number) {
    const { error } = await openLivePrompt(promptId);
    setPending(null);
    if (error) return show(error.message, 'info');
    await loadLive();
  }

  async function close(promptId: number) {
    const { error } = await closeLivePrompt(promptId);
    if (error) return show(error.message, 'info');
    await loadLive();
  }

  async function toggleReveal(p: LivePrompt) {
    const { error } = await updateLivePrompt(p.id, { reveal: !p.reveal });
    if (error) return show(error.message, 'info');
    await loadLive();
  }

  if (loading) return <FullPageSpinner />;
  if (!session) {
    return (
      <ManageLayout>
        <p className="text-ink-soft">Session not found.</p>
        <Link to="/manage" className="mt-3 inline-block font-semibold text-brand">← All sessions</Link>
      </ManageLayout>
    );
  }

  const responders = new Set(responses.map((r) => r.submission_id)).size;

  return (
    <ManageLayout>
      <Link to={`/manage/s/${session.id}`} className="text-sm font-medium text-brand hover:text-brand-bright">
        ← {session.title || 'Session'}
      </Link>

      {/* ---- live mode + room meter ---- */}
      <section
        className={`mt-4 rounded-2xl border p-5 shadow-sm ${
          session.is_live ? 'border-emerald-200 bg-emerald-50/60' : 'border-sky-100 bg-white/80'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold text-ink">
              <Radio className={`h-5 w-5 ${session.is_live ? 'text-emerald-600' : 'text-ink-faint'}`} aria-hidden="true" />
              {session.is_live ? 'You’re live' : 'Live mode is off'}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {session.is_live
                ? 'The class’s /live page is awake and waiting for a prompt.'
                : 'Turn this on when class starts, then send prompts one at a time.'}
            </p>
          </div>
          <button
            onClick={toggleLive}
            className={`rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${
              session.is_live ? 'bg-ink hover:bg-ink-soft' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {session.is_live ? 'End live session' : 'Go live'}
          </button>
        </div>

        {session.is_live && (
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Meter icon={<Users className="h-4 w-4" aria-hidden="true" />} value={present} label="on the app" />
            {open && <Meter value={responders} label="responded" tone="brand" />}
          </div>
        )}
      </section>

      {/* ---- the open prompt, live ---- */}
      {open && (
        <OpenPanel
          prompt={open}
          options={options.filter((o) => o.prompt_id === open.id)}
          responses={responses}
          responders={responders}
          names={names}
          onClose={() => close(open.id)}
          onToggleReveal={() => toggleReveal(open)}
        />
      )}

      {/* ---- the menu ---- */}
      <h2 className="mt-8 text-lg font-bold text-ink">Your prompts</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Prepared ahead of class. Tap one to send it to the class.
      </p>

      <ul className="mt-4 space-y-2.5">
        {prompts
          .filter((p) => p.status !== 'open')
          .map((p) => (
            <PromptRow
              key={p.id}
              prompt={p}
              options={options.filter((o) => o.prompt_id === p.id)}
              canSend={session.is_live}
              pending={pending === p.id}
              onPend={() => setPending(p.id)}
              onCancel={() => setPending(null)}
              onSend={() => send(p.id)}
              onChanged={loadStructure}
            />
          ))}
        {prompts.length === 0 && (
          <li className="rounded-2xl border border-dashed border-sky-100 p-6 text-center text-sm text-ink-faint">
            No prompts yet. Build a few before class.
          </li>
        )}
      </ul>

      <AddPrompt sessionId={session.id} nextOrder={prompts.length + 1} onAdded={loadStructure} />
    </ManageLayout>
  );
}

function Meter({
  icon,
  value,
  label,
  tone = 'plain',
}: {
  icon?: React.ReactNode;
  value: number;
  label: string;
  tone?: 'plain' | 'brand';
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold ${
        tone === 'brand' ? 'bg-brand/10 text-brand' : 'bg-white text-ink shadow-sm'
      }`}
    >
      {icon}
      <span className="tabular-nums">{value}</span>
      <span className="font-medium text-ink-soft">{label}</span>
    </span>
  );
}

function OpenPanel({
  prompt,
  options,
  responses,
  responders,
  names,
  onClose,
  onToggleReveal,
}: {
  prompt: LivePrompt;
  options: LiveOption[];
  responses: LiveResponse[];
  responders: number;
  names: Record<string, string>;
  onClose: () => void;
  onToggleReveal: () => void;
}) {
  const items = options.map((o) => ({
    option_id: o.id,
    label: o.label,
    votes: responses.filter((r) => r.option_id === o.id).length,
  }));
  const texts = responses.filter((r) => r.body);

  return (
    <section className="mt-4 rounded-2xl border-2 border-brand bg-white p-5 shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Open now</p>
      <h2 className="mt-1 text-lg font-bold leading-snug text-ink">{prompt.prompt}</h2>
      <p className="mt-1 text-xs text-ink-faint">
        {prompt.attribution === 'anonymous' ? '🔒 Anonymous — no names recorded' : '👤 Names visible to you only'}
      </p>

      <div className="mt-4">
        {prompt.kind === 'text' ? (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {responders} response{responders === 1 ? '' : 's'}
            </p>
            <ul className="space-y-2">
              {texts.map((r) => (
                <li key={r.id} className="rounded-xl bg-sky-50/70 p-3">
                  <p className="whitespace-pre-wrap text-sm text-ink">{r.body}</p>
                  {r.author_id && (
                    <p className="mt-1 text-xs font-medium text-ink-faint">
                      {names[r.author_id] ?? 'Member'}
                    </p>
                  )}
                </li>
              ))}
              {texts.length === 0 && (
                <li className="text-sm text-ink-faint">Nothing yet — give it a moment.</li>
              )}
            </ul>
          </>
        ) : (
          <TallyBars items={items} responders={responders} />
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-sky-100 pt-4">
        <button
          onClick={onClose}
          className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft"
        >
          Close this prompt
        </button>
        {prompt.kind !== 'text' && (
          <button
            onClick={onToggleReveal}
            className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition ${
              prompt.reveal
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-sky-200 text-ink-soft hover:border-brand hover:text-brand'
            }`}
          >
            {prompt.reveal ? '✓ Class is seeing results' : 'Show the class'}
          </button>
        )}
      </div>
    </section>
  );
}

function PromptRow({
  prompt,
  options,
  canSend,
  pending,
  onPend,
  onCancel,
  onSend,
  onChanged,
}: {
  prompt: LivePrompt;
  options: LiveOption[];
  canSend: boolean;
  pending: boolean;
  onPend: () => void;
  onCancel: () => void;
  onSend: () => void;
  onChanged: () => void;
}) {
  const { show } = useToast();
  const [editing, setEditing] = useState(false);

  async function remove() {
    if (!window.confirm('Delete this prompt and its responses?')) return;
    await deleteLivePrompt(prompt.id);
    show('Prompt deleted');
    onChanged();
  }

  const kindLabel: Record<LiveKind, string> = {
    single: 'Pick one',
    multi: 'Pick any',
    text: 'Write-in',
  };

  if (editing) {
    return (
      <li className="rounded-2xl border border-brand bg-white p-4 shadow-sm">
        <PromptFields
          initial={prompt}
          initialOptions={options}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSave={async (v) => {
            await updateLivePrompt(prompt.id, {
              prompt: v.prompt,
              detail: v.detail,
              kind: v.kind,
              attribution: v.attribution,
            });
            await saveLiveOptions(prompt.id, v.kind === 'text' ? [] : v.labels, options);
            setEditing(false);
            show('Prompt updated');
            onChanged();
          }}
        />
      </li>
    );
  }

  return (
    <li
      className={`rounded-2xl border bg-white/80 p-4 shadow-sm transition ${
        pending ? 'border-brand ring-2 ring-brand/20' : 'border-sky-100'
      }`}
    >
      <button
        type="button"
        onClick={canSend && !pending ? onPend : undefined}
        disabled={!canSend}
        className="block w-full text-left disabled:cursor-default"
      >
        <p className="font-medium text-ink">{prompt.prompt}</p>
        {prompt.detail && <p className="mt-0.5 text-xs text-ink-soft">{prompt.detail}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-ink-soft">{kindLabel[prompt.kind]}</span>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-ink-soft">
            {prompt.attribution === 'anonymous' ? '🔒 Anonymous' : '👤 Named'}
          </span>
          {prompt.status === 'closed' && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">Already used</span>
          )}
        </div>
      </button>

      {/* What the class will actually see — the whole point of a prepared menu. */}
      {prompt.kind === 'text' ? (
        <p className="mt-2.5 rounded-lg bg-sky-50/70 px-3 py-2 text-xs italic text-ink-faint">
          Write-in — the class gets a text box.
        </p>
      ) : (
        <ol className="mt-2.5 space-y-1 rounded-lg bg-sky-50/70 px-3 py-2">
          {options.map((o, i) => (
            <li key={o.id} className="text-xs text-ink-soft">
              <span className="mr-1.5 font-semibold text-ink-faint">{i + 1}.</span>
              {o.label}
            </li>
          ))}
          {options.length === 0 && (
            <li className="text-xs font-medium text-red-600">No options yet — add some before sending.</li>
          )}
        </ol>
      )}

      {pending ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sky-100 pt-3">
          <button
            onClick={onSend}
            className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-bright"
          >
            Send to the class
          </button>
          <button onClick={onCancel} className="px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink">
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs">
          {canSend ? (
            <span className="font-semibold text-brand">Tap to send →</span>
          ) : (
            <span className="text-ink-faint">Go live to send this</span>
          )}
          <button onClick={() => setEditing(true)} className="font-semibold text-brand hover:text-brand-bright">
            Edit
          </button>
          <button onClick={remove} className="font-semibold text-red-600 hover:text-red-700">
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

interface PromptDraft {
  prompt: string;
  detail: string | null;
  kind: LiveKind;
  attribution: 'anonymous' | 'named';
  labels: string[];
}

/** The prompt form, shared by "add" and "edit" so the two can't drift apart. */
function PromptFields({
  initial,
  initialOptions,
  submitLabel,
  onSave,
  onCancel,
}: {
  initial?: LivePrompt;
  initialOptions?: LiveOption[];
  submitLabel: string;
  onSave: (v: PromptDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial?.prompt ?? '');
  const [detail, setDetail] = useState(initial?.detail ?? '');
  const [kind, setKind] = useState<LiveKind>(initial?.kind ?? 'single');
  const [attribution, setAttribution] = useState<'anonymous' | 'named'>(
    initial?.attribution ?? 'anonymous',
  );
  const [opts, setOpts] = useState(
    (initialOptions ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).map((o) => o.label).join('\n'),
  );
  const [busy, setBusy] = useState(false);

  const labels = opts.split('\n').map((l) => l.trim()).filter(Boolean);
  const ready = text.trim().length > 0 && (kind === 'text' || labels.length > 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    await onSave({
      prompt: text.trim(),
      detail: detail.trim() || null,
      kind,
      attribution,
      labels,
    });
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Prompt</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          autoFocus
          placeholder="Which of these would you like to dig into?"
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Helper line (optional)</span>
        <input
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Shown under the prompt on their phones"
          className={inputCls}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">Type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as LiveKind)} className={inputCls}>
            <option value="single">Pick one</option>
            <option value="multi">Pick any</option>
            <option value="text">Write-in</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">Attribution</span>
          <select
            value={attribution}
            onChange={(e) => setAttribution(e.target.value as 'anonymous' | 'named')}
            className={inputCls}
          >
            <option value="anonymous">Anonymous — no names recorded</option>
            <option value="named">Named — you see who (class never does)</option>
          </select>
        </label>
      </div>

      {kind !== 'text' && (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">Options — one per line</span>
          <textarea
            value={opts}
            onChange={(e) => setOpts(e.target.value)}
            rows={5}
            placeholder={'Faith\nRepentance\nCovenants\nGrace'}
            className={inputCls}
          />
          <span className="mt-1 block text-xs text-ink-faint">
            {labels.length} option{labels.length === 1 ? '' : 's'}
          </span>
        </label>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !ready}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-bright disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddPrompt({
  sessionId,
  nextOrder,
  onAdded,
}: {
  sessionId: number;
  nextOrder: number;
  onAdded: () => void;
}) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-2xl border border-dashed border-sky-200 px-3 py-3 text-sm font-medium text-ink-soft transition hover:border-brand hover:text-brand"
      >
        + Add a prompt
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-sky-200 p-4">
      <PromptFields
        submitLabel="Add prompt"
        onCancel={() => setOpen(false)}
        onSave={async (v) => {
          const { data, error } = await createLivePrompt({
            session_id: sessionId,
            kind: v.kind,
            prompt: v.prompt,
            detail: v.detail,
            attribution: v.attribution,
            sort_order: nextOrder,
          });
          if (error || !data) {
            show(error?.message ?? 'Could not create', 'info');
            return;
          }
          await saveLiveOptions((data as LivePrompt).id, v.kind === 'text' ? [] : v.labels, []);
          setOpen(false);
          show('Prompt added');
          onAdded();
        }}
      />
    </div>
  );
}
