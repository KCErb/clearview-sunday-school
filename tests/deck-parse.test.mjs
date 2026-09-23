import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseDeck, collectAssets, rewriteAssets } from '../src/decks/parse.ts';

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
