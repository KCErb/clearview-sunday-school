/** Brings the current thumbnail into view by scrolling the strip sideways only, never the page. */
export function centerThumb(strip: HTMLElement | null) {
  const thumb = strip?.querySelector<HTMLElement>('.slide-thumb.current');
  if (!strip || !thumb) return;
  strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: 'smooth' });
}
