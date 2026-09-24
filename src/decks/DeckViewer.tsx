import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import type { DeckSummary, PollApi, Slide } from '@/polling/types';
import { SlideFrame } from './SlideFrame';
import { centerThumb } from './strip';

/**
 * Reading a past lesson: the slide as large as the screen allows, with tap, swipe and arrow
 * keys to move, a strip to jump, and true full screen where the browser supports it.
 */
export function DeckViewer({
  api,
  deckId,
  idx,
  onIdx,
  onBack,
}: {
  api: PollApi;
  deckId: number;
  idx: number;
  onIdx: (idx: number) => void;
  onBack: () => void;
}) {
  const [deck, setDeck] = useState<{ deck: DeckSummary; slides: Slide[] } | null>(null);
  const [error, setError] = useState('');
  const [full, setFull] = useState(false);
  const stage = useRef<HTMLDivElement | null>(null);
  const strip = useRef<HTMLDivElement | null>(null);
  const touch = useRef<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    api
      .deckSlides(deckId)
      .then((d) => {
        if (cancelled) return;
        if (d) setDeck(d);
        else setError('That lesson is not available.');
      })
      .catch(() => !cancelled && setError('That lesson could not be opened just now.'));
    return () => {
      cancelled = true;
    };
  }, [api, deckId]);
  const count = deck?.slides.length ?? 0;
  const at = Math.min(Math.max(idx, 0), Math.max(count - 1, 0));
  const go = (to: number) => {
    if (to >= 0 && to < count && to !== at) onIdx(to);
  };
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') go(at + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(at - 1);
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  });
  useEffect(() => {
    const change = () => setFull(document.fullscreenElement === stage.current);
    document.addEventListener('fullscreenchange', change);
    return () => document.removeEventListener('fullscreenchange', change);
  }, []);
  useEffect(() => {
    centerThumb(strip.current);
  }, [at, count]);
  const canFull = typeof document !== 'undefined' && !!document.fullscreenEnabled;
  const slide = deck?.slides[at];
  return (
    <section className="deck-viewer">
      <div className="deck-viewer-top">
        <button className="text-button" onClick={onBack}>
          <ArrowLeft size={15} /> All lessons
        </button>
        {deck && (
          <span className="deck-viewer-count">
            {at + 1} / {count}
          </span>
        )}
      </div>
      {error && <p role="status">{error}</p>}
      {deck && (
        <>
          <header className="deck-viewer-heading">
            <h1>{deck.deck.title}</h1>
            {deck.deck.subtitle && <p className="deck-subtitle">{deck.deck.subtitle}</p>}
          </header>
          <div
            ref={stage}
            className={`deck-viewer-stage slide-bleed ${full ? 'is-full' : ''}`}
            onClick={(e) => {
              // Tap the left or right third of the slide to move; links on the slide handle themselves.
              if ((e.target as Element).closest('button, a')) return;
              const { left, width } = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - left) / width;
              if (x < 1 / 3) go(at - 1);
              else if (x > 2 / 3) go(at + 1);
            }}
            onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touch.current === null) return;
              const dx = e.changedTouches[0].clientX - touch.current;
              touch.current = null;
              if (Math.abs(dx) > 40) go(dx < 0 ? at + 1 : at - 1);
            }}
          >
            {slide && (
              <SlideFrame key={`${full}`} html={slide.html} fit={full ? 'contain' : 'width'} onGoto={go} />
            )}
            {canFull && (
              <button
                className="full-toggle"
                aria-label={full ? 'Exit full screen' : 'Full screen'}
                onClick={() =>
                  void (full ? document.exitFullscreen() : stage.current?.requestFullscreen().catch(() => {}))
                }
              >
                {full ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
          </div>
          <div className="deck-viewer-nav">
            <button className="poll-button secondary compact" disabled={at === 0} onClick={() => go(at - 1)}>
              <ChevronLeft size={15} /> Back
            </button>
            <span>{slide?.label.replace(/^\d+\s+/, '')}</span>
            <button className="poll-button compact" disabled={at >= count - 1} onClick={() => go(at + 1)}>
              Next <ChevronRight size={15} />
            </button>
          </div>
          <div className="slide-strip" ref={strip}>
            {deck.slides.map((s) => (
              <button
                key={s.id}
                className={`slide-thumb ${s.idx === at ? 'current' : ''}`}
                onClick={() => go(s.idx)}
                aria-label={`Slide ${s.idx + 1}`}
              >
                <SlideFrame html={s.html} />
                <span>{s.idx + 1}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/** One lesson in the class's list, fronted by its first slide. */
export function LessonCard({ deck, onOpen, label }: { deck: DeckSummary; onOpen: () => void; label?: string }) {
  return (
    <button className="lesson-card" onClick={onOpen}>
      {deck.cover && <SlideFrame html={deck.cover} />}
      <div className="lesson-card-text">
        {label && <span className="eyebrow">{label}</span>}
        <strong>{deck.title}</strong>
        <span>
          {deck.subtitle ? `${deck.subtitle} · ` : ''}
          {deck.count} slide{deck.count === 1 ? '' : 's'}
        </span>
      </div>
    </button>
  );
}
