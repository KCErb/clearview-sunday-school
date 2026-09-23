import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DeckSummary, PollApi, Slide } from '@/polling/types';
import { SlideFrame } from './SlideFrame';

/** Reading a past lesson on a phone: one slide at a time, nothing else. */
export function DeckViewer({ api, deckId, onBack }: { api: PollApi; deckId: number; onBack: () => void }) {
  const [deck, setDeck] = useState<{ deck: DeckSummary; slides: Slide[] } | null>(null);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    api
      .deckSlides(deckId)
      .then((d) => !cancelled && setDeck(d))
      .catch(() => !cancelled && setError('That lesson could not be opened just now.'));
    return () => {
      cancelled = true;
    };
  }, [api, deckId]);
  const slide = deck?.slides[idx];
  return (
    <section className="deck-viewer">
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={15} /> All lessons
      </button>
      {error && <p role="status">{error}</p>}
      {deck && (
        <>
          <h1>{deck.deck.title}</h1>
          {deck.deck.subtitle && <p className="deck-subtitle">{deck.deck.subtitle}</p>}
          {slide && <SlideFrame html={slide.html} />}
          <div className="deck-viewer-nav">
            <button
              className="poll-button secondary compact"
              disabled={idx === 0}
              onClick={() => setIdx((n) => Math.max(0, n - 1))}
            >
              <ChevronLeft size={15} /> Back
            </button>
            <span>
              {idx + 1} / {deck.slides.length}
            </span>
            <button
              className="poll-button secondary compact"
              disabled={idx >= deck.slides.length - 1}
              onClick={() => setIdx((n) => Math.min(deck.slides.length - 1, n + 1))}
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
