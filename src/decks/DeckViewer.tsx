import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import type { DeckSummary, PollApi, Slide } from '@/polling/types';
import { SlideFrame } from './SlideFrame';
import { centerThumb } from './strip';

/**
 * A lesson on a phone: the slide as large as the page allows, and one obvious button to fill the
 * whole screen. In full screen, tapping the right or left side (or swiping) turns the page.
 * iPhones don't allow real full screen for a page, so full screen is a fixed overlay everywhere,
 * upgraded to the browser's full screen and landscape where Android allows it.
 */
export function DeckViewer({
  api,
  deckId,
  idx,
  onIdx,
  eyebrow,
  action,
  alert,
}: {
  api: PollApi;
  deckId: number;
  idx: number;
  onIdx: (idx: number) => void;
  eyebrow: string;
  /** Beside the eyebrow, e.g. "Back to this week" when reading an older lesson. */
  action?: ReactNode;
  /** Shown over the full-screen slide, e.g. an open question to answer. */
  alert?: { text: string; onClick: () => void } | null;
}) {
  const [deck, setDeck] = useState<{ deck: DeckSummary; slides: Slide[] } | null>(null);
  const [error, setError] = useState('');
  const [full, setFull] = useState(false);
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
  const enterFull = () => {
    setFull(true);
    // Must start inside the tap itself; the overlay already covers the page if this is refused.
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
          return orientation.lock?.('landscape');
        })
        .catch(() => {});
    }
  };
  const exitFull = () => {
    setFull(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  };
  useEffect(() => {
    // Android's back gesture leaves browser full screen; close the overlay with it.
    const change = () => {
      if (!document.fullscreenElement) setFull(false);
    };
    document.addEventListener('fullscreenchange', change);
    return () => document.removeEventListener('fullscreenchange', change);
  }, []);
  useEffect(() => {
    if (!full) return;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = before;
    };
  }, [full]);
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(at + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(at - 1);
      if (e.key === 'Escape' && full) exitFull();
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  });
  useEffect(() => {
    centerThumb(strip.current);
  }, [at, count]);
  const slide = deck?.slides[at];
  // Tap the left or right third to turn the page; links on the slide handle themselves.
  const tapToTurn = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('button, a')) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    if (x < 1 / 3) go(at - 1);
    else if (x > 2 / 3) go(at + 1);
  };
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => (touch.current = e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touch.current === null) return;
      const dx = e.changedTouches[0].clientX - touch.current;
      touch.current = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? at + 1 : at - 1);
    },
  };
  return (
    <section className="deck-viewer">
      <div className="deck-viewer-top">
        <span className="eyebrow">{eyebrow}</span>
        {action}
      </div>
      {error && <p role="status">{error}</p>}
      {deck && (
        <>
          <header className="deck-viewer-heading">
            <h1>{deck.deck.title}</h1>
            {deck.deck.subtitle && <p className="deck-subtitle">{deck.deck.subtitle}</p>}
          </header>
          <div className="deck-viewer-stage slide-bleed" onClick={tapToTurn} {...swipe}>
            {slide && <SlideFrame html={slide.html} onGoto={go} />}
          </div>
          <div className="deck-viewer-nav">
            <button className="poll-button secondary compact" disabled={at === 0} onClick={() => go(at - 1)}>
              <ChevronLeft size={16} /> <span className="nav-word">Back</span>
            </button>
            <button className="poll-button full-button" onClick={enterFull}>
              <Maximize2 size={17} /> Full screen
            </button>
            <button className="poll-button secondary compact" disabled={at >= count - 1} onClick={() => go(at + 1)}>
              <span className="nav-word">Next</span> <ChevronRight size={16} />
            </button>
          </div>
          <p className="deck-viewer-count">
            Slide {at + 1} of {count}
          </p>
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
          {full && slide && (
            <div className="viewer-full" role="dialog" aria-label={deck.deck.title} onClick={tapToTurn} {...swipe}>
              <SlideFrame key={slide.id} html={slide.html} fit="contain" onGoto={go} />
              <button className="viewer-full-close" aria-label="Exit full screen" onClick={exitFull}>
                <X size={22} />
              </button>
              {alert && (
                <button
                  className="viewer-full-alert"
                  onClick={() => {
                    exitFull();
                    alert.onClick();
                  }}
                >
                  {alert.text}
                </button>
              )}
              <div className="viewer-full-foot">
                <span>
                  {at + 1} / {count}
                </span>
                <span className="viewer-full-rotate">Turn your phone sideways for a bigger slide</span>
              </div>
            </div>
          )}
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
