import { useRef, useState, type ReactNode } from 'react';

const MAX = 5;
type View = { s: number; x: number; y: number };
const IDENTITY: View = { s: 1, x: 0, y: 0 };

/**
 * Pinch to zoom and drag to pan, handled here rather than by the browser: Android turns page zoom
 * off in true full screen, and a browser zoom can't tell a pinch's last finger from a tap. At
 * normal size a tap or a horizontal swipe is passed up to turn the page; while zoomed in, one
 * finger pans and nothing turns the page. Key this per slide so each slide starts unzoomed.
 */
export function ZoomPan({
  children,
  onTap,
  onSwipe,
}: {
  children: ReactNode;
  /** A tap at normal size, as a fraction of the width (0 = left edge). */
  onTap: (x: number) => void;
  /** A horizontal swipe at normal size: +1 for next, -1 for back. */
  onSwipe: (by: number) => void;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<View>(IDENTITY);
  const live = useRef<View>(IDENTITY);
  const points = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<
    | { kind: 'press'; x: number; y: number; from: View; moved: boolean; link: boolean }
    | { kind: 'pinch'; dist: number; mid: { x: number; y: number }; from: View }
    | null
  >(null);

  const apply = (next: View) => {
    const r = box.current?.getBoundingClientRect();
    const s = Math.min(MAX, Math.max(1, next.s));
    // Keep the slide covering the screen: never pan past its edges.
    const w = r?.width ?? 0;
    const h = r?.height ?? 0;
    const clamped = s <= 1.01 ? IDENTITY : {
      s,
      x: Math.min(0, Math.max(w - w * s, next.x)),
      y: Math.min(0, Math.max(h - h * s, next.y)),
    };
    live.current = clamped;
    setView(clamped);
  };
  const local = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const pinchFrom = () => {
    const [a, b] = [...points.current.values()];
    return { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };

  // No pointer capture: the layer already covers the screen, and capturing would steal the click
  // from links on the slide (a discussion menu, say).
  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    points.current.set(e.pointerId, local(e));
    if (points.current.size === 1) {
      const p = local(e);
      const link = !!(e.target as Element).closest('a, button, iframe, video');
      gesture.current = { kind: 'press', x: p.x, y: p.y, from: live.current, moved: false, link };
    } else if (points.current.size === 2) {
      gesture.current = { kind: 'pinch', ...pinchFrom(), from: live.current };
    }
  };
  const move = (e: React.PointerEvent) => {
    if (!points.current.has(e.pointerId)) return;
    points.current.set(e.pointerId, local(e));
    const g = gesture.current;
    if (g?.kind === 'pinch' && points.current.size >= 2) {
      const now = pinchFrom();
      const s = Math.min(MAX, Math.max(1, (g.from.s * now.dist) / g.dist));
      // The point of the slide under the fingers when the pinch began stays under them.
      const px = (g.mid.x - g.from.x) / g.from.s;
      const py = (g.mid.y - g.from.y) / g.from.s;
      apply({ s, x: now.mid.x - px * s, y: now.mid.y - py * s });
    } else if (g?.kind === 'press') {
      const p = local(e);
      const dx = p.x - g.x;
      const dy = p.y - g.y;
      if (Math.abs(dx) + Math.abs(dy) > 8) g.moved = true;
      if (g.from.s > 1) apply({ s: g.from.s, x: g.from.x + dx, y: g.from.y + dy });
    }
  };
  const up = (e: React.PointerEvent) => {
    const g = gesture.current;
    const p = points.current.get(e.pointerId);
    points.current.delete(e.pointerId);
    if (g?.kind === 'pinch') {
      // One finger still down after a pinch: let it pan, but never count it as a tap.
      const [rest] = [...points.current.values()];
      gesture.current = rest ? { kind: 'press', x: rest.x, y: rest.y, from: live.current, moved: true, link: false } : null;
      if (!rest && live.current.s < 1.05) apply(IDENTITY);
      return;
    }
    gesture.current = null;
    if (g?.kind !== 'press' || !p || g.from.s > 1.01 || live.current.s > 1.01) return;
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    if (!g.moved) {
      if (!g.link) onTap(p.x / (box.current?.getBoundingClientRect().width || 1));
    } else if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      onSwipe(dx < 0 ? 1 : -1);
    }
  };
  const cancel = (e: React.PointerEvent) => {
    points.current.delete(e.pointerId);
    if (!points.current.size) gesture.current = null;
  };

  const zoomed = view.s > 1.01;
  return (
    <div
      ref={box}
      className="zoom-pan"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={cancel}
    >
      <div
        className="zoom-pan-content"
        style={{ transform: zoomed ? `translate(${view.x}px, ${view.y}px) scale(${view.s})` : undefined }}
      >
        {children}
      </div>
      {zoomed && (
        <button
          className="zoom-out"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => apply(IDENTITY)}
        >
          Zoom out
        </button>
      )}
    </div>
  );
}
