import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoApi, resetDemo } from '../src/polling/demo.ts';
test('reopened sample history includes new feedback and preserves the previous results', async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
  resetDemo();
  await demoApi.action(3, 'open');
  const poll = await demoApi.current();
  await demoApi.saveAnswer(3, 'sample-browser', [31, 32], 0, poll.opened_at);
  let data = await demoApi.library();
  assert.equal(data.results[3].respondents, 19);
  assert.equal(data.results[3].counts[31], 9);
  await demoApi.action(3, 'close');
  await demoApi.action(3, 'open');
  const reopened = await demoApi.current();
  assert.deepEqual((await demoApi.answer(3, 'sample-browser')).selection, [31, 32]);
  await demoApi.saveAnswer(3, 'sample-browser', [], 1, reopened.opened_at);
  data = await demoApi.library();
  assert.equal(data.results[3].respondents, 18);
  assert.equal(data.results[3].counts[31], 8);
});

test('private write-ins stay separate from choices and count each respondent once', async () => {
  const store = new Map();
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  resetDemo();
  const poll = await demoApi.current();
  const first = crypto.randomUUID();
  const second = crypto.randomUUID();
  await demoApi.saveWriteIn(poll.id, 'one', first, 'My topic', 0, poll.opened_at);
  await demoApi.saveWriteIn(poll.id, 'one', second, 'Another topic', 0, poll.opened_at);
  await demoApi.saveWriteIn(poll.id, 'one', first, 'My topic', 0, poll.opened_at);
  assert.equal((await demoApi.writeIns(poll.id, 'one')).length, 2);
  assert.deepEqual(await demoApi.writeIns(poll.id, 'two'), []);
  await assert.rejects(demoApi.saveWriteIn(poll.id, 'two', first, 'Not mine', 1, poll.opened_at));
  await demoApi.saveAnswer(poll.id, 'one', [poll.options[0].id], 0, poll.opened_at);
  let library = await demoApi.library();
  assert.equal(library.results[poll.id].respondents, 1);
  assert.equal(library.results[poll.id].write_ins.length, 2);
  assert.equal(library.results[poll.id].counts[poll.options[0].id], 1);
  await demoApi.saveWriteIn(poll.id, 'one', first, 'Changed topic', 1, poll.opened_at);
  await demoApi.saveWriteIn(poll.id, 'one', first, null, 2, poll.opened_at);
  library = await demoApi.library();
  assert.equal(library.results[poll.id].write_ins.length, 1);
  await demoApi.action(poll.id, 'close');
  await assert.rejects(demoApi.saveWriteIn(poll.id, 'one', second, 'Closed edit', 1, poll.opened_at));
});
test('presenting a sample lesson drives the stage and the slide question', async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
  resetDemo();
  assert.equal(await demoApi.stage(), null);
  assert.equal((await demoApi.deckList()).length, 1, 'only published lessons reach the class');
  await demoApi.goLive(1);
  const opening = await demoApi.stage();
  assert.equal(opening.slide.idx, 0);
  assert.equal(opening.count, 4);
  assert.ok(!('notes' in opening.slide), 'teacher notes never reach the class');
  await demoApi.show(1);
  assert.equal((await demoApi.stage()).slide.label, 'Join the class', 'every lesson opens with the join slide');
  await demoApi.show(2);
  assert.equal((await demoApi.current()).id, 2, 'the slide question opens on arrival');
  assert.equal((await demoApi.current()).status, 'open');
  await demoApi.show(3);
  assert.equal((await demoApi.current()).status, 'closed', 'moving on closes the slide question');
  await demoApi.endLive();
  assert.equal(await demoApi.stage(), null);
  const past = await demoApi.deckSlides(1);
  assert.equal(past.slides.length, 4);
  assert.equal(await demoApi.deckSlides(2), null, 'unpublished lessons stay hidden');
});
