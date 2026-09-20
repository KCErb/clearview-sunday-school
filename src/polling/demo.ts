import { PollError, type Answer, type Library, type PollApi, type Poll, type WriteIn } from './types.ts';
const key = 'cwass.poll-preview.v1';
interface DemoState extends Library {
  answers: Record<string, Answer>;
  nextId: number;
  writeIns?: Record<string, WriteIn & { pollId: number; token: string }>;
}
const initial = (): DemoState => ({
  nextId: 4,
  currentId: 1,
  answers: {},
  results: {},
  polls: [
    {
      id: 1,
      question: 'What would you like to explore together?',
      detail: 'Choose any that would be helpful to you today.',
      kind: 'multi',
      status: 'open',
      options: [
        { id: 11, label: 'Finding peace in uncertain times' },
        { id: 12, label: 'Recognizing answers to prayer' },
        { id: 13, label: 'Making room for daily scripture study' },
        { id: 14, label: 'Helping others feel they belong' },
      ],
      locked: false,
      created_at: new Date().toISOString(),
      opened_at: new Date().toISOString(),
    },
    {
      id: 2,
      question: 'Where shall we spend a little more time?',
      detail: '',
      kind: 'single',
      status: 'draft',
      options: [
        { id: 21, label: 'The scripture passage' },
        { id: 22, label: 'An everyday example' },
        { id: 23, label: 'Time to reflect' },
      ],
      locked: false,
      created_at: new Date().toISOString(),
      opened_at: null,
    },
    {
      id: 3,
      question: 'What helps you feel ready to learn?',
      detail: '',
      kind: 'multi',
      status: 'closed',
      options: [
        { id: 31, label: 'A quiet moment' },
        { id: 32, label: 'Hearing someone’s experience' },
        { id: 33, label: 'A question to think about' },
      ],
      locked: true,
      created_at: new Date().toISOString(),
      opened_at: new Date().toISOString(),
    },
  ],
});
let memory = initial();
export let demoOffline = false;
export function setDemoOffline(value: boolean) {
  demoOffline = value;
}
function read(): DemoState {
  if (demoOffline) throw new PollError('Preview connection paused');
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') || memory;
  } catch {
    return memory;
  }
}
function write(state: DemoState) {
  memory = state;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* In-memory preview still works. */
  }
}
function poll(state: DemoState, id: number): Poll {
  const p = state.polls.find((p) => p.id === id);
  if (!p) throw new Error('Question not found');
  return p;
}
export function resetDemo() {
  write(initial());
}
export const demoApi: PollApi = {
  async writeIns(id, token) {
    return Object.values(read().writeIns || {}).filter(w => w.pollId === id && w.token === token && !w.deleted)
      .map(({ id, body, revision, created_at }) => ({ id, body, revision, created_at }));
  },
  async saveWriteIn(id, token, writeInId, body, revision, epoch) {
    const s = read(); const p = poll(s, id); s.writeIns ||= {};
    if (p.status !== 'open' || s.currentId !== id || p.opened_at !== epoch) throw new PollError('Question closed', 'closed');
    const existing = s.writeIns[writeInId];
    if (existing && (existing.token !== token || existing.pollId !== id)) throw new Error('Suggestion unavailable');
    const normalized = body?.trim() ?? null;
    if (body !== null && (!normalized || normalized.length > 2000)) throw new Error('Enter a suggestion of up to 2,000 characters');
    if (existing && existing.revision === revision + 1 &&
        ((normalized === null && existing.deleted) || (!existing.deleted && existing.body === normalized))) return existing;
    if ((existing?.revision || 0) !== revision) throw new PollError('Stale revision', 'conflict');
    if ((!existing && normalized === null) || existing?.deleted) throw new Error('Suggestion unavailable');
    const row = { id: writeInId, pollId: id, token, body: normalized ?? existing.body,
      revision: revision + 1, created_at: existing?.created_at || new Date().toISOString(), deleted: normalized === null };
    s.writeIns[writeInId] = row; p.locked = true; write(s); return row;
  },
  async current() {
    const s = read();
    return s.polls.find((p) => p.id === s.currentId) || null;
  },
  async answer(id, token) {
    return read().answers[`${id}:${token}`] || { selection: [], revision: 0 };
  },
  async saveAnswer(id, token, selection, revision, epoch) {
    const s = read();
    const p = poll(s, id);
    const k = `${id}:${token}`;
    if (p.status !== 'open' || s.currentId !== id || p.opened_at !== epoch)
      throw new PollError('Question closed', 'closed');
    if ((s.answers[k]?.revision || 0) !== revision)
      throw new PollError('Stale revision', 'conflict');
    const next = { selection, revision: revision + 1 };
    s.answers[k] = next;
    if (selection.length) p.locked = true;
    write(s);
    return next;
  },
  async library() {
    const s = read();
    s.results = { 3: { respondents: 18, counts: { 31: 8, 32: 12, 33: 7 } } };
    for (const p of s.polls) {
      const entries = Object.entries(s.answers).filter(([k, a]) => k.startsWith(`${p.id}:`) && a.selection.length);
      const answers = entries.map(([, a]) => a);
      const writeIns = Object.values(s.writeIns || {}).filter(w => w.pollId === p.id && !w.deleted);
      const responders = new Set([...entries.map(([k]) => k.slice(`${p.id}:`.length)), ...writeIns.map(w => w.token)]);
      s.results[p.id] = {
        respondents: responders.size + (p.id === 3 ? 18 : 0),
        write_ins: writeIns.map(({ id, body, revision, created_at }) => ({ id, body, revision, created_at })),
        counts: Object.fromEntries(
          p.options.map((o) => [
            o.id,
            answers.filter((a) => a.selection.includes(o.id)).length +
              (p.id === 3 ? s.results[3].counts[o.id] || 0 : 0),
          ]),
        ),
      };
    }
    return s;
  },
  async savePoll(id, draft) {
    const s = read();
    const existing = id === null ? null : poll(s, id);
    if (existing?.locked || existing?.status === 'open')
      throw new Error('Duplicate this question to edit it.');
    const pollId = existing?.id ?? s.nextId++;
    const p: Poll = {
      id: pollId,
      ...draft,
      options: draft.labels.map((label, i) => ({ id: pollId * 100 + i, label })),
      status: existing?.status || 'draft',
      created_at: existing?.created_at || new Date().toISOString(),
      opened_at: existing?.opened_at || null,
      locked: false,
    };
    s.polls = [p, ...s.polls.filter((p) => p.id !== pollId)];
    write(s);
    return pollId;
  },
  async action(id, action) {
    const s = read();
    const p = poll(s, id);
    if (action === 'open') {
      s.polls.forEach((p) => {
        if (p.status === 'open') p.status = 'closed';
      });
      p.status = 'open';
      p.opened_at = new Date().toISOString();
      s.currentId = id;
    }
    if (action === 'close') p.status = 'closed';
    if (action === 'delete') {
      if (p.locked || p.status !== 'draft')
        throw new Error('Only unanswered drafts can be deleted.');
      s.polls = s.polls.filter((p) => p.id !== id);
    }
    write(s);
  },
};
