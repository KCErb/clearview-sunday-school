import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AnswerSession } from '../src/polling/answerSession.ts';
import { PollError } from '../src/polling/types.ts';
let store;
beforeEach(() => { store = new Map(); globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) }; });
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup(overrides = {}) {
  let saved = { selection: [], revision: 0 }; let state; const calls = [];
  const api = {
    answer: async () => structuredClone(saved),
    saveAnswer: async (id, token, selection, revision, epoch) => {
      calls.push({ id, token, selection, revision, epoch });
      if (revision !== saved.revision) throw new PollError('Stale revision', 'conflict');
      saved = { selection, revision: revision + 1 }; return structuredClone(saved);
    }, ...overrides,
  };
  const namespace = crypto.randomUUID();
  const session = new AnswerSession(api, 1, namespace, 'opening-1', next => { state = next; });
  return { api, session, namespace, calls, state: () => state, saved: () => saved, setSaved: value => { saved = value; } };
}
test('saves on tap, replaces selections, and clears without a submit action', async () => {
  const t = setup(); await t.session.refresh(); t.session.select([1,2]); await tick();
  assert.deepEqual(t.saved().selection, [1,2]); assert.match(t.state().status, /^Saved/);
  t.session.select([2]); await tick(); assert.deepEqual(t.saved().selection, [2]);
  t.session.select([]); await tick(); assert.deepEqual(t.saved().selection, []); assert.equal(t.saved().revision,3);
});
test('rapid taps are serialized and coalesced to the newest selection', async () => {
  let release; const t = setup(); const original = t.api.saveAnswer;
  t.api.saveAnswer = async (...args) => { if (!release) await new Promise(resolve => { release = resolve; }); return original(...args); };
  await t.session.refresh(); t.session.select([1]); t.session.select([1,2]); t.session.select([2]);
  assert.deepEqual(t.state().selection,[2]); release(); await tick();
  assert.deepEqual(t.calls.map(c => c.selection),[[1],[2]]); assert.deepEqual(t.saved().selection,[2]);
});
test('unsaved selection survives a network failure and retries', async () => {
  const t = setup(); const original = t.api.saveAnswer; let offline = true;
  t.api.saveAnswer = (...args) => { if (offline) throw new Error('offline'); return original(...args); };
  await t.session.refresh(); t.session.select([1]); await tick(); assert.match(t.state().status,/not saved/);
  offline = false; await t.session.refresh(); assert.deepEqual(t.saved().selection,[1]); assert.match(t.state().status,/^Saved/);
});
test('retry recognizes a successful write whose acknowledgement was lost', async () => {
  const t = setup(); const original = t.api.saveAnswer; let first = true;
  t.api.saveAnswer = async (...args) => { const result = await original(...args); if (first) { first=false; throw new Error('timeout'); } return result; };
  await t.session.refresh(); t.session.select([1]); await tick(); await t.session.refresh();
  assert.equal(t.saved().revision,1); assert.match(t.state().status,/^Saved/);
});
test('another tab’s newer response is not overwritten by a stale write', async () => {
  const t = setup(); await t.session.refresh(); t.setSaved({selection:[2],revision:1}); t.session.select([1]); await tick();
  assert.deepEqual(t.state().selection,[2]); assert.match(t.state().status,/another tab/);
});
test('refresh restores the browser response and ownership token', async () => {
  const t = setup(); await t.session.refresh(); t.session.select([1]); await tick(); t.session.stop();
  let state; const next = new AnswerSession(t.api,1,t.namespace,'opening-1',s => {state=s;}); await next.refresh(); next.select([2]); await tick();
  assert.deepEqual(state.selection,[2]); assert.equal(t.calls[0].token,t.calls[1].token);
});
test('offline pending changes cannot overwrite a newer response after reload', async () => {
  const t = setup(); await t.session.refresh(); const original=t.api.saveAnswer; t.api.saveAnswer=async()=>{throw new Error('offline');};
  t.session.select([1]); await tick(); t.session.stop(); t.setSaved({selection:[2],revision:1}); t.api.saveAnswer=original;
  let state; const next=new AnswerSession(t.api,1,t.namespace,'opening-1',s=>{state=s;}); await next.refresh();
  assert.deepEqual(t.saved().selection,[2]); assert.match(state.status,/another tab/);
});
test('closing discards pending changes; reopening does not submit them', async () => {
  const t = setup(); await t.session.refresh(); const original=t.api.saveAnswer; t.api.saveAnswer=async()=>{throw new Error('offline');};
  t.session.select([1]); await tick(); await t.session.refresh(false); t.session.stop(); t.api.saveAnswer=original;
  const next=new AnswerSession(t.api,1,t.namespace,'opening-2',()=>{}); await next.refresh(); assert.equal(t.calls.length,0);
});
test('new opening discards offline changes even when the phone missed the closure', async () => {
  const t = setup(); await t.session.refresh(); const original=t.api.saveAnswer; t.api.saveAnswer=async()=>{throw new Error('offline');};
  t.session.select([1]); await tick(); t.session.stop(); t.api.saveAnswer=original;
  const next=new AnswerSession(t.api,1,t.namespace,'opening-2',()=>{}); await next.refresh(); assert.equal(t.calls.length,0);
});
test('unavailable storage still allows answering and reports session-only continuity', async () => {
  globalThis.localStorage = { getItem(){throw new Error('blocked');}, setItem(){throw new Error('blocked');} };
  const t=setup(); await t.session.refresh(); t.session.select([1]); await tick();
  assert.deepEqual(t.saved().selection,[1]); assert.match(t.state().status,/Keep this page open/);
});
test('server closure prevents retries of an unsaved answer', async () => {
  const t=setup({saveAnswer:async()=>{throw new PollError('Question closed','closed');}});
  await t.session.refresh(); t.session.select([1]); await tick(); assert.match(t.state().status,/closed before/);
});
