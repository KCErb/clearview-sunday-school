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
