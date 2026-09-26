import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, QrCode, Square, Upload } from 'lucide-react';
import type { Deck, DeckLibrary, Library, PollApi } from '@/polling/types';
import { parseDeck, readTokens } from './parse';
import { designTokens } from './tokens';
import { JOIN_LABEL, withJoinSlide } from './join';
import { SlideFrame } from './SlideFrame';
import { PollBadge } from './PollBadge';
import { centerThumb } from './strip';

/** The teacher's phone during class: what the screen shows, what comes next, and the private notes. */
export function LessonPanel({
  api,
  library,
  decks,
  reload,
  busy,
  setBusy,
  setError,
  results,
}: {
  api: PollApi;
  library: Library;
  decks: DeckLibrary;
  reload: () => Promise<void>;
  busy: boolean;
  setBusy: (value: boolean) => void;
  setError: (message: string) => void;
  results: (deck: Deck, idx: number) => React.ReactNode;
}) {
  const live = decks.live.deck_id;
  const [picked, setPicked] = useState<number | null>(live ?? decks.decks[0]?.id ?? null);
  const [cursor, setCursor] = useState(0);
  const [notes, setNotes] = useState<{ id: number; text: string } | null>(null);
  const strip = useRef<HTMLDivElement | null>(null);
  const deck = decks.decks.find((d) => d.id === (live ?? picked)) ?? null;
  const idx = live !== null ? decks.live.slide_idx : Math.min(cursor, (deck?.slides.length ?? 1) - 1);
  const slide = deck?.slides[idx] ?? null;
  const next = deck?.slides[idx + 1] ?? null;
  // Latecomers: one tap puts the join slide back on the screen, wherever the lesson is.
  const joinIdx = deck?.slides.findIndex((s) => s.label === JOIN_LABEL) ?? -1;
  useEffect(() => {
    centerThumb(strip.current);
  }, [idx, deck?.id]);

  async function run(work: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await work();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the lesson.');
    } finally {
      setBusy(false);
    }
  }
  function go(to: number) {
    if (!deck || to < 0 || to >= deck.slides.length) return;
    if (live !== null) void run(() => api.show(to));
    else setCursor(to);
  }
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(idx + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(idx - 1);
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  });

  async function upload(file: File) {
    const source = await file.text();
    const parsed = parseDeck(source, file.name.replace(/\.[^.]+$/, ''), readTokens(...designTokens));
    if (parsed.assets.length)
      throw new Error(
        `This lesson uses images stored beside it (${parsed.assets[0]}). Import it with "pnpm import-deck" so the pictures come along.`,
      );
    await api.saveDeck({
      title: parsed.title,
      subtitle: parsed.subtitle,
      slides: withJoinSlide(parsed.slides, (j) => ({ ...j, idx: -1 })).map(({ label, html }) => ({ label, html })),
    });
  }

  return (
    <div className="lesson-panel">
      <div className="lesson-bar">
        <select
          value={deck?.id ?? ''}
          disabled={live !== null}
          onChange={(e) => {
            setPicked(Number(e.target.value));
            setCursor(0);
          }}
        >
          {!decks.decks.length && <option value="">No lessons yet</option>}
          {decks.decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
              {d.published ? '' : ' · not published'}
            </option>
          ))}
        </select>
        {live !== null ? (
          <button className="poll-button secondary compact" disabled={busy} onClick={() => void run(() => api.endLive())}>
            <Square size={14} /> End lesson
          </button>
        ) : (
          <button
            className="poll-button compact"
            disabled={busy || !deck}
            onClick={() => {
              if (!deck) return;
              setPicked(deck.id);
              void run(() => api.goLive(deck.id));
            }}
          >
            <Play size={15} /> Present
          </button>
        )}
        <label className="poll-button secondary compact file-button">
          <Upload size={14} /> Import lesson
          <input
            type="file"
            accept=".html,text/html"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void run(() => upload(file));
            }}
          />
        </label>
        {deck && (
          <div className="lesson-bar-small">
            <label>
              <input
                type="checkbox"
                checked={deck.published}
                disabled={busy}
                onChange={(e) => void run(() => api.publishDeck(deck.id, e.target.checked))}
              />
              Published for the class
            </label>
            <button
              className="text-button danger"
              disabled={busy || live !== null}
              onClick={() => {
                if (window.confirm(`Delete "${deck.title}"?`)) void run(() => api.deleteDeck(deck.id));
              }}
            >
              Delete lesson
            </button>
          </div>
        )}
      </div>

      {!deck ? (
        <div className="detail-empty">
          <div className="gold-rule" />
          <h2>No lessons yet.</h2>
          <p>Import a lesson exported from Claude Design to present it here.</p>
        </div>
      ) : (
        <>
          <div className="slide-strip" ref={strip}>
            {deck.slides.map((s) => (
              <button
                key={s.id}
                className={`slide-thumb ${s.idx === idx ? 'current' : ''}`}
                onClick={() => go(s.idx)}
                title={s.label}
              >
                <SlideFrame html={s.html} />
                <span>
                  {s.idx + 1}
                  {s.poll_id ? ' ·' : ''}
                </span>
              </button>
            ))}
          </div>
          <div className="lesson-layout">
            <div className="lesson-current">
              {slide && (
                <SlideFrame html={slide.html} onGoto={go} overlay={slide.poll_id ? <PollBadge /> : null} />
              )}
              <div className="deck-viewer-nav">
                <button className="poll-button secondary compact" disabled={busy || idx === 0} onClick={() => go(idx - 1)}>
                  <ChevronLeft size={15} /> Back
                </button>
                {joinIdx >= 0 && joinIdx !== idx && (
                  <button className="text-button" disabled={busy} onClick={() => go(joinIdx)}>
                    <QrCode size={15} /> Join slide
                  </button>
                )}
                <span>
                  {idx + 1} / {deck.slides.length}
                  {live !== null ? ' · on the screen' : ' · preview'}
                </span>
                <button
                  className="poll-button compact"
                  disabled={busy || idx >= deck.slides.length - 1}
                  onClick={() => go(idx + 1)}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
            <aside className="lesson-aside">
              {next && (
                <div className="lesson-next">
                  <span className="eyebrow">Coming next</span>
                  <SlideFrame html={next.html} />
                </div>
              )}
              {slide && (
                <>
                  <label className="lesson-field">
                    <span className="eyebrow">Your notes</span>
                    <textarea
                      rows={5}
                      value={notes?.id === slide.id ? notes.text : slide.notes || ''}
                      onChange={(e) => setNotes({ id: slide.id, text: e.target.value })}
                      onBlur={() => {
                        if (notes?.id === slide.id && notes.text !== (slide.notes || ''))
                          void run(() => api.setSlideNotes(slide.id, notes.text));
                        setNotes(null);
                      }}
                    />
                  </label>
                  <label className="lesson-field">
                    <span className="eyebrow">Question on this slide</span>
                    <select
                      value={slide.poll_id ?? ''}
                      disabled={busy}
                      onChange={(e) =>
                        void run(() => api.setSlidePoll(slide.id, e.target.value ? Number(e.target.value) : null))
                      }
                    >
                      <option value="">No question</option>
                      {library.polls.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.question}
                        </option>
                      ))}
                    </select>
                    <small>Arriving at this slide sends the question to the class.</small>
                  </label>
                  {results(deck, idx)}
                </>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
