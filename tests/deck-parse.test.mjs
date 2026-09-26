import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { parseDeck, collectAssets, readTokens, rewriteAssets } from '../src/decks/parse.ts';
import { JOIN_LABEL, withJoinSlide } from '../src/decks/join.ts';

const exported = readFileSync(
  new URL('../Church Design System/templates/sunday-school-lesson/SundaySchoolLesson.dc.html', import.meta.url),
  'utf8',
);

test('reads every slide out of an exported lesson', () => {
  const deck = parseDeck(exported);
  assert.equal(deck.slides.length, 11);
  assert.equal(deck.slides[1].label, '02 Opening question');
  assert.equal(deck.slides[0].idx, 0);
  assert.equal(deck.title, 'I Am the Good Shepherd');
  assert.match(deck.subtitle, /Clearview Ward/);
  assert.deepEqual(deck.assets, []);
});

test('each slide is a standalone section without the presentation drop shadow', () => {
  const deck = parseDeck(exported);
  for (const slide of deck.slides) {
    assert.match(slide.html, /^<section[\s>]/);
    assert.match(slide.html, /<\/section>$/);
    assert.ok(!/^<section[^>]*box-shadow/i.test(slide.html), 'section keeps its own drop shadow');
    assert.match(slide.html, /width:1920px/);
  }
});

test('nested sections stay inside their slide', () => {
  const deck = parseDeck('<x-dc><section data-screen-label="01 One"><section>inner</section>tail</section></x-dc>');
  assert.equal(deck.slides.length, 1);
  assert.equal(deck.slides[0].label, '01 One');
  assert.match(deck.slides[0].html, /inner/);
});

test('finds and rewrites local image references', () => {
  const html = '<section style="background-image:url(art/shepherd.jpg)"><img src="./sheep.png"><img src="https://example.test/x.png"><img src="data:image/gif;base64,AAA"></section>';
  const deck = parseDeck(html);
  assert.deepEqual(deck.assets, ['art/shepherd.jpg', './sheep.png']);
  const rewritten = rewriteAssets(deck.slides[0].html, {
    'art/shepherd.jpg': 'https://cdn.test/a.jpg',
    './sheep.png': 'https://cdn.test/b.png',
  });
  assert.deepEqual(collectAssets(rewritten), []);
  assert.match(rewritten, /https:\/\/cdn\.test\/a\.jpg/);
  assert.match(rewritten, /https:\/\/cdn\.test\/b\.png/);
});

test('falls back to the template name and then the given title', () => {
  assert.equal(parseDeck('<!-- @template name="Easter Lesson" --><section>x</section>').title, 'Easter Lesson');
  assert.equal(parseDeck('<section>x</section>', 'Week 34').title, 'Week 34');
});

test('a file with no slides is rejected', () => {
  assert.throws(() => parseDeck('<html><body><p>not a deck</p></body></html>'), /No slides found/);
});

const tokenDir = new URL('../Church Design System/tokens/', import.meta.url);
const tokens = readTokens(...readdirSync(tokenDir).map((n) => readFileSync(new URL(n, tokenDir), 'utf8')));
const lesson = (dir) => readFileSync(new URL(`../lessons/${dir}/SundaySchoolLesson.dc.html`, import.meta.url), 'utf8');

test('design-system components become static markup', () => {
  const deck = parseDeck(lesson('2026-09-14-god-is-my-salvation'), 'x', tokens);
  assert.equal(deck.slides.length, 14);
  assert.deepEqual(deck.warnings, []);
  for (const slide of deck.slides) {
    assert.ok(!slide.html.includes('<x-import'), `${slide.label} still has a runtime component`);
    assert.ok(!slide.html.includes('var(--'), `${slide.label} still depends on a stylesheet token`);
  }
  const scripture = deck.slides[1].html;
  assert.match(scripture, /<blockquote[^>]*font-style:italic[^>]*>all things that \[Isaiah\] spake/);
  assert.match(scripture, /border-left:2px solid #C1A01E/);
  assert.match(scripture, /<figcaption[^>]*>3 Nephi 23:3<\/figcaption>/);
  assert.match(deck.slides[4].html, /mask-image:url\(https:\/\/cdn\.jsdelivr\.net\/npm\/lucide-static@[\d.]+\/icons\/plus\.svg\)/);
});

test('hub slides keep their links to other slides', () => {
  const deck = parseDeck(lesson('2026-09-14-god-is-my-salvation'), 'x', tokens);
  const hub = deck.slides.find((s) => s.label === '09 Discussion');
  assert.deepEqual([...hub.html.matchAll(/data-goto="(\d+)"/g)].map((m) => Number(m[1])), [8, 10, 11, 12]);
  assert.equal(deck.slides[8].label, '10 Discussion 1a', 'links are zero-based slide positions');
});

test('token references in inline styles resolve', () => {
  const deck = parseDeck(lesson('2026-09-07-he-shall-direct-thy-paths'), 'x', tokens);
  assert.equal(deck.slides.length, 11);
  assert.equal(deck.title, '“He Shall Direct Thy Paths”');
  assert.match(deck.slides[5].html, /background-color: #235C35/);
  assert.deepEqual(deck.assets, ['uploads/pasted-1789321172757-0.png', 'uploads/pasted-1789321243035-0.png']);
});

test('an unknown component is reported rather than silently dropped', () => {
  const deck = parseDeck('<section><x-import component-from-global-scope="DS.Carousel"></x-import></section>');
  assert.deepEqual(deck.warnings, ['Carousel']);
});

test('the join slide goes after the title and hub links still land on the same slides', () => {
  const deck = parseDeck(lesson('2026-09-14-god-is-my-salvation'), 'x', tokens);
  const slides = withJoinSlide(deck.slides, (s) => ({ ...s, idx: -1 }));
  assert.equal(slides.length, 15);
  assert.equal(slides[1].label, JOIN_LABEL);
  assert.match(slides[1].html, /<img src="\/join-qr\.svg"/);
  const hub = slides.find((s) => s.label === '09 Discussion');
  const targets = [...hub.html.matchAll(/data-goto="(\d+)"/g)].map((m) => slides[Number(m[1])].label);
  assert.deepEqual(targets, ['10 Discussion 1a', '12 Discussion 2', '13 Discussion 3', '14 Discussion 4']);
  const back = [...slides[9].html.matchAll(/data-goto="(\d+)"/g)].map((m) => slides[Number(m[1])].label);
  assert.deepEqual(back, ['09 Discussion'], '"Back to discussion" still returns to the hub');
  assert.equal(withJoinSlide(slides, (s) => s).length, 15, 'adding it twice is a no-op');
  assert.deepEqual(collectAssets(slides[1].html), [], 'site paths are not treated as images to upload');
});
