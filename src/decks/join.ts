/**
 * The standard "Join the class" slide. The importer adds it after the title slide of every lesson,
 * so the room always has one place that says how to get onto the site and what to do there.
 * It is ordinary slide HTML (1920x1080, inline styles) so the TV, phones and viewer all show it.
 */
export const JOIN_LABEL = 'Join the class';
export const JOIN_URL = 'clearviewsunday.school';

const sans = "'Source Sans 3',Helvetica,sans-serif";
const step = (n: number, lead: string, rest: string) =>
  `<div style="display:flex;gap:32px;align-items:baseline">` +
  `<div style="font-family:${sans};font-size:40px;font-weight:700;color:#DBBF6B;width:44px;flex-shrink:0">${n}</div>` +
  `<div style="flex:1;min-width:0;font-size:38px;line-height:1.4;color:#FFFFFF"><strong style="font-weight:600">${lead}</strong> ` +
  `<span style="color:rgba(255,255,255,.82)">${rest}</span></div></div>`;

export const joinSlideHtml =
  `<section data-screen-label="${JOIN_LABEL}" style="width:1920px;height:1080px;box-sizing:border-box;` +
  `padding:80px 112px;background:#003057;color:#FFFFFF;font-family:'Source Serif 4',Georgia,serif;` +
  `display:flex;align-items:center;gap:112px">` +
  `<div style="flex:1;min-width:0">` +
  `<div style="font-family:${sans};font-size:24px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.72)">Join the class</div>` +
  `<h2 style="font-size:72px;line-height:1.08;letter-spacing:-.02em;font-weight:600;margin:32px 0 0;color:#FFFFFF;text-wrap:pretty">Follow along on your phone</h2>` +
  `<hr style="width:120px;height:5px;background:#DBBF6B;border:0;margin:48px 0 56px">` +
  `<div style="display:flex;flex-direction:column;gap:36px;max-width:920px">` +
  step(1, 'Scan the code', `or go to ${JOIN_URL}. You’ll see the slide that’s on the screen.`) +
  step(2, 'Answer when a question opens.', 'It appears under the slide. Answers are anonymous, and you can change them.') +
  step(3, 'Tap Lessons', 'to look back through today’s slides any time.') +
  `</div></div>` +
  `<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:28px;background:#FFFFFF;border-radius:10px;padding:48px 48px 40px">` +
  `<img src="/join-qr.svg" alt="QR code for ${JOIN_URL}" style="width:520px;height:520px;display:block">` +
  `<div style="font-family:${sans};font-size:40px;font-weight:600;color:#003057;letter-spacing:.01em">${JOIN_URL}</div>` +
  `</div></section>`;

/**
 * Puts the join slide after the title slide. Slides that link to other slides (`data-goto`, zero-
 * based) are renumbered so hub links still land where they did in Claude Design.
 */
export function withJoinSlide<T extends { label: string; html: string }>(slides: T[], make: (s: { label: string; html: string }) => T): T[] {
  if (slides.some((s) => s.label === JOIN_LABEL)) return slides;
  const at = Math.min(1, slides.length);
  const shift = (html: string) =>
    html.replace(/data-goto="(\d+)"/g, (whole, n: string) => (Number(n) >= at ? `data-goto="${Number(n) + 1}"` : whole));
  const renumbered = slides.map((s) => ({ ...s, html: shift(s.html) }));
  return [...renumbered.slice(0, at), make({ label: JOIN_LABEL, html: joinSlideHtml }), ...renumbered.slice(at)];
}
