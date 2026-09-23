/**
 * Reads a slideshow exported from claude.ai/design (`<Name>.dc.html`): every slide is a
 * top-level <section> sized 1920x1080 with inline styles. Pure string work, no DOM, so the
 * import script and the browser upload share one parser and Node can test it.
 */
export interface ParsedSlide {
  idx: number;
  label: string;
  html: string;
}
export interface ParsedDeck {
  title: string;
  subtitle: string;
  slides: ParsedSlide[];
  /** Relative image references, in the order first seen. Absolute and data: URLs are left alone. */
  assets: string[];
}

const attribute = (tag: string, name: string) =>
  new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag);

function body(source: string) {
  const open = /<x-dc(?:\s[^>]*)?>/i.exec(source);
  if (!open) return source;
  const close = source.lastIndexOf('</x-dc>');
  return close > open.index ? source.slice(open.index + open[0].length, close) : source;
}

/** Sections carry a presentation-room drop shadow; the stage and thumbnails supply their own frame. */
function dropShadow(html: string) {
  const open = /^<section[^>]*>/i.exec(html);
  if (!open) return html;
  const style = attribute(open[0], 'style');
  if (!style) return html;
  const raw = style[2] ?? style[3] ?? '';
  const cleaned = raw
    .split(';')
    .filter((d) => !/^\s*box-shadow\s*:/i.test(d))
    .join(';')
    .replace(/^;+|;+$/g, '');
  return html.slice(0, open.index) + open[0].replace(raw, cleaned) + html.slice(open[0].length);
}

function sections(html: string) {
  const found: string[] = [];
  const tag = /<(\/?)section(?=[\s/>])[^>]*>/gi;
  let depth = 0;
  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = tag.exec(html))) {
    if (match[1]) {
      depth -= 1;
      if (depth === 0) found.push(html.slice(start, tag.lastIndex));
    } else if (!match[0].endsWith('/>')) {
      if (depth === 0) start = match.index;
      depth += 1;
    }
  }
  return found;
}

function text(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&middot;|&#183;/g, '·')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The credit line on the title slide ("Clearview Ward · 14 September 2026") becomes the subtitle. */
function subtitleOf(html: string) {
  const lines = (html.match(/<div[^>]*>[^<]*<\/div>/gi) || []).map(text).filter(Boolean);
  const dated = lines.filter((line) => /\d{4}/.test(line) || line.includes('·'));
  return (dated.length ? dated[dated.length - 1] : '').slice(0, 200);
}

export function collectAssets(html: string) {
  const found: string[] = [];
  const refs = /(?:src\s*=\s*["']([^"']+)["']|url\(\s*["']?([^"')]+)["']?\s*\))/gi;
  let match: RegExpExecArray | null;
  while ((match = refs.exec(html))) {
    const ref = (match[1] ?? match[2] ?? '').trim();
    if (!ref || /^(https?:|data:|blob:|#|\/\/)/i.test(ref)) continue;
    if (!found.includes(ref)) found.push(ref);
  }
  return found;
}

export function rewriteAssets(html: string, map: Record<string, string>) {
  return Object.entries(map).reduce(
    (out, [from, to]) => out.split(`"${from}"`).join(`"${to}"`).split(`'${from}'`).join(`'${to}'`).split(`(${from})`).join(`(${to})`),
    html,
  );
}

export function parseDeck(source: string, fallbackTitle = 'Untitled lesson'): ParsedDeck {
  const inner = body(source);
  const slides = sections(inner).map((html, idx) => {
    const open = /^<section[^>]*>/i.exec(html);
    const label = open ? attribute(open[0], 'data-screen-label') : null;
    return { idx, label: ((label?.[2] ?? label?.[3] ?? '') || '').slice(0, 200), html: dropShadow(html) };
  });
  if (!slides.length) throw new Error('No slides found — export the lesson from Claude Design as a .dc.html file.');
  const template = /@template\s+name\s*=\s*"([^"]+)"/i.exec(source);
  const titled = /<title>([^<]*)<\/title>/i.exec(source);
  const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(slides[0].html);
  const title = (
    text(heading?.[1] ?? '') ||
    (template?.[1] ?? '').trim() ||
    (titled?.[1] ?? '').trim() ||
    fallbackTitle
  ).slice(0, 200);
  const assets: string[] = [];
  for (const slide of slides) for (const ref of collectAssets(slide.html)) if (!assets.includes(ref)) assets.push(ref);
  return { title, subtitle: subtitleOf(slides[0].html), slides, assets };
}
