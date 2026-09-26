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
  /** Design-system components the parser could not turn into static markup. */
  warnings: string[];
}
/** Design tokens by name without the leading dashes, e.g. `{ 'gold-20': '#C1A01E' }`. */
export type Tokens = Record<string, string>;

/** Collects every `--name: value` declaration from the design system's token stylesheets. */
export function readTokens(...css: string[]): Tokens {
  const tokens: Tokens = {};
  for (const sheet of css)
    for (const m of sheet.matchAll(/--([\w-]+)\s*:\s*([^;}]+)/g)) tokens[m[1]] ??= m[2].trim();
  return tokens;
}

/** Replaces known `var(--x)` references with their values so slides carry no stylesheet dependency. */
export function resolveVars(text: string, tokens: Tokens) {
  let out = text;
  for (let depth = 0; depth < 6 && out.includes('var(--'); depth++) {
    const next = out.replace(/var\(--([\w-]+)(?:\s*,\s*([^()]*))?\)/g, (whole, name: string, fallback?: string) =>
      tokens[name] ?? fallback?.trim() ?? whole,
    );
    if (next === out) break;
    out = next;
  }
  return out;
}

const ICON_CDN = 'https://cdn.jsdelivr.net/npm/lucide-static@0.462.0/icons/';
const attrs = (tag: string) => {
  const found: Record<string, string> = {};
  for (const m of tag.matchAll(/([\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) found[m[1]] = m[3] ?? m[4] ?? '';
  return found;
};

/**
 * Claude Design renders design-system components (`<x-import component-from-global-scope=…>`)
 * with React at runtime. Slides here are static, so the two the lessons use are expanded to the
 * same markup the components produce (see Church Design System/components).
 */
function expandComponents(html: string, warnings: string[]) {
  return html.replace(/<x-import(\s[^>]*)>([\s\S]*?)<\/x-import>/gi, (whole, rawAttrs: string, children: string) => {
    const a = attrs(rawAttrs);
    const component = (a['component-from-global-scope'] || '').split('.').pop();
    const style = a.style ? `;${a.style}` : '';
    if (component === 'Icon') {
      const size = a.size || '20px';
      const mask = `url(${ICON_CDN}${encodeURIComponent(a.name || 'circle')}.svg)`;
      return (
        `<span role="presentation" aria-hidden="true" style="display:inline-block;width:${size};height:${size};` +
        `flex:0 0 auto;background-color:currentColor;-webkit-mask-image:${mask};mask-image:${mask};` +
        `-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-size:contain;mask-size:contain;` +
        `-webkit-mask-position:center;mask-position:center${style}"></span>`
      );
    }
    if (component === 'ScriptureBlock') {
      const fs = { sm: 'var(--fs-body-lg)', md: 'var(--fs-h3)', lg: 'var(--fs-h1)' }[a.size || 'md'] || 'var(--fs-h3)';
      const invert = a.tone === 'invert';
      const caption = a.reference
        ? `<figcaption style="margin-top:var(--space-4);font-family:var(--font-sans);font-size:var(--fs-body-sm);` +
          `font-weight:var(--fw-semibold);letter-spacing:.02em;color:${invert ? 'var(--text-invert-muted)' : 'var(--text-muted)'}">` +
          `${a.reference}</figcaption>`
        : '';
      return (
        `<div style="${a.style || ''}"><figure style="margin:0;border-left:var(--border-medium) solid var(--gold-20);` +
        `padding-left:var(--space-6);max-width:var(--measure-body)"><blockquote style="margin:0;` +
        `font-family:var(--font-serif-text);font-size:${fs};line-height:1.45;font-style:italic;` +
        `color:${invert ? 'var(--text-invert)' : 'var(--text-heading)'}">${children.trim()}</blockquote>${caption}</figure></div>`
      );
    }
    if (!warnings.includes(component || whole.slice(0, 60))) warnings.push(component || whole.slice(0, 60));
    return whole;
  });
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
    // Absolute URLs, inline data and site paths (/decks/…, /join-qr.svg) are already servable.
    if (!ref || /^(https?:|data:|blob:|#|\/)/i.test(ref)) continue;
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

export function parseDeck(source: string, fallbackTitle = 'Untitled lesson', tokens: Tokens = {}): ParsedDeck {
  const inner = body(source);
  const warnings: string[] = [];
  const slides = sections(inner).map((html, idx) => {
    const open = /^<section[^>]*>/i.exec(html);
    const label = open ? attribute(open[0], 'data-screen-label') : null;
    return {
      idx,
      label: ((label?.[2] ?? label?.[3] ?? '') || '').slice(0, 200),
      html: resolveVars(expandComponents(dropShadow(html), warnings), tokens),
    };
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
  return { title, subtitle: subtitleOf(slides[0].html), slides, assets, warnings };
}
