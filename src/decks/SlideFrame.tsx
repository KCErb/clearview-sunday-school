import { useEffect, useRef, useState } from 'react';

/**
 * Renders one exported slide at its authored 1920x1080 and scales it to fit.
 * The HTML comes from `deck_save`, which only `is_admin()` may call; the class and the
 * screen only ever read it, so it is inserted as authored rather than sanitized — a
 * sanitizer would also strip the inline styles the design system depends on.
 */
export function SlideFrame({
  html,
  fit = 'width',
  className = '',
  onGoto,
  overlay,
}: {
  html: string;
  fit?: 'width' | 'contain';
  className?: string;
  /** Hub slides link to other slides with `<a data-goto="n">` (zero-based, as in Claude Design). */
  onGoto?: (idx: number) => void;
  /** Drawn over the slide in its own 1920x1080 coordinates, e.g. the poll badge on the TV. */
  overlay?: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState({ scale: 0, left: 0, top: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width) return;
      const scale = fit === 'contain' ? Math.min(width / 1920, height / 1080) : width / 1920;
      setLayout({
        scale,
        left: Math.max(0, (width - 1920 * scale) / 2),
        top: fit === 'contain' ? Math.max(0, (height - 1080 * scale) / 2) : 0,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit]);
  return (
    <div
      ref={box}
      className={`slide-frame ${fit === 'contain' ? 'contain' : ''} ${onGoto ? 'can-goto' : ''} ${className}`}
      onClick={(e) => {
        const link = (e.target as Element).closest('a');
        if (!link) return;
        // Slide links are for moving within the lesson; never let "#" scroll or leave the page.
        e.preventDefault();
        const to = link.getAttribute('data-goto');
        if (to !== null && onGoto) {
          e.stopPropagation();
          onGoto(Number(to));
        }
      }}
    >
      <div
        className="slide-canvas"
        style={{
          transform: `translate(${layout.left}px, ${layout.top}px) scale(${layout.scale})`,
          visibility: layout.scale ? 'visible' : 'hidden',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {overlay && (
        <div
          className="slide-overlay"
          style={{ transform: `translate(${layout.left}px, ${layout.top}px) scale(${layout.scale})` }}
        >
          {overlay}
        </div>
      )}
    </div>
  );
}
