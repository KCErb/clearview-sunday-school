import {
  PollError,
  type Answer,
  type Deck,
  type Library,
  type PollApi,
  type Poll,
  type WriteIn,
} from './types.ts';
const key = 'cwass.poll-preview.v1';
interface DemoState extends Library {
  answers: Record<string, Answer>;
  nextId: number;
  writeIns?: Record<string, WriteIn & { pollId: number; token: string }>;
  decks: Deck[];
  live: { deck_id: number | null; slide_idx: number };
  nextDeckId: number;
}
const slide = (id: number, label: string, bg: string, ink: string, body: string) => ({
  id,
  idx: id % 10,
  label,
  poll_id: null as number | null,
  html:
    `<section data-screen-label="${label}" style="width:1920px;height:1080px;box-sizing:border-box;` +
    `padding:80px 112px;background:${bg};color:${ink};font-family:'Source Serif 4',Georgia,serif;` +
    `display:flex;flex-direction:column;justify-content:center">${body}</section>`,
});
const sampleSlides = (): Deck['slides'] => [
  slide(
    10,
    '01 Welcome',
    '#EFEFE7',
    '#000000',
    `<div style="font-family:'Source Sans 3',sans-serif;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:#676B6E">Sunday School · Come, Follow Me</div>` +
      `<h1 style="font-size:88px;line-height:1.05;margin:40px 0 0;font-weight:600">I Am the Good Shepherd</h1>` +
      `<hr style="width:120px;height:5px;background:#C1A01E;border:0;margin:48px 0 40px">` +
      `<div style="font-size:32px;color:#53575B">John 10 · Week 34</div>`,
  ),
  slide(
    11,
    '02 Opening question',
    '#235C35',
    '#FFFFFF',
    `<div style="font-family:'Source Sans 3',sans-serif;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.72);text-align:center">To begin</div>` +
      `<h2 style="font-size:88px;line-height:1.05;margin:40px auto 0;max-width:20ch;text-align:center;font-weight:600">Where shall we spend a little more time?</h2>`,
  ),
  slide(
    12,
    '03 Close',
    '#003057',
    '#FFFFFF',
    `<h2 style="font-size:64px;line-height:1.08;margin:0;max-width:22ch;font-weight:600">Listen for one prompting, and act on it.</h2>` +
      `<hr style="width:120px;height:5px;background:#DBBF6B;border:0;margin:48px 0 0">`,
  ),
]
const initial = (): DemoState => ({
  nextId: 4,
  nextDeckId: 3,
  live: { deck_id: null, slide_idx: 0 },
  decks: [
    {
      id: 1,
      title: 'I Am the Good Shepherd',
      subtitle: 'Clearview Ward · Week 34',
      published: true,
      created_at: new Date().toISOString(),
      count: 3,
      // The middle slide carries the prepared question, so advancing to it opens the poll.
      slides: sampleSlides().map((s) => (s.idx === 1 ? { ...s, poll_id: 2 } : s)),
    },
    {
      id: 2,
      title: 'Next Sunday (not published yet)',
      subtitle: 'Clearview Ward',
      published: false,
      created_at: new Date().toISOString(),
      count: 3,
      slides: sampleSlides(),
    },
  ],
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
  let stored: DemoState | null;
  try {
    stored = JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    stored = null;
  }
  const state = stored || memory;
  // A preview saved before lessons existed still has to open.
  if (!state.decks) {
    const fresh = initial();
    state.decks = fresh.decks;
    state.live = fresh.live;
    state.nextDeckId = fresh.nextDeckId;
  }
  return state;
}
function write(state: DemoState) {
  memory = state;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* In-memory preview still works. */
  }
}
/** Notes belong to the teacher; the class and the screen read slides without them. */
const classSlide = ({ notes, ...rest }: Deck['slides'][number]) => (void notes, rest);
function openPoll(state: DemoState, p: Poll) {
  if (p.status !== 'open') {
    state.polls.forEach((other) => {
      if (other.status === 'open') other.status = 'closed';
    });
    p.status = 'open';
    p.opened_at = new Date().toISOString();
  }
  state.currentId = p.id;
}
function deck(state: DemoState, id: number): Deck {
  const d = state.decks.find((d) => d.id === id);
  if (!d) throw new Error('Lesson not found');
  return d;
}
/** Mirrors deck_arrive in 0018_decks.sql: the slide's own question opens, the last one closes. */
function arrive(state: DemoState, idx: number) {
  const d = deck(state, state.live.deck_id as number);
  if (idx < 0 || idx >= d.slides.length) throw new Error('Slide out of range');
  const leaving = d.slides[state.live.slide_idx]?.poll_id ?? null;
  const arriving = d.slides[idx]?.poll_id ?? null;
  state.live.slide_idx = idx;
  if (leaving !== null && leaving !== arriving && state.currentId === leaving) {
    poll(state, leaving).status = 'closed';
  }
  if (arriving !== null) openPoll(state, poll(state, arriving));
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
    if (action === 'open') openPoll(s, p);
    if (action === 'close') p.status = 'closed';
    if (action === 'delete') {
      if (p.locked || p.status !== 'draft')
        throw new Error('Only unanswered drafts can be deleted.');
      s.polls = s.polls.filter((p) => p.id !== id);
    }
    write(s);
  },
  async stage() {
    const s = read();
    if (s.live.deck_id === null) return null;
    const d = deck(s, s.live.deck_id);
    const slide = d.slides[s.live.slide_idx];
    if (!slide) return null;
    return { deck: { id: d.id, title: d.title }, slide: classSlide(slide), count: d.slides.length };
  },
  async deckList() {
    return read()
      .decks.filter((d) => d.published)
      .map(({ id, title, subtitle, created_at, count, slides }) => ({
        id,
        title,
        subtitle,
        created_at,
        count,
        cover: slides[0]?.html,
      }));
  },
  async deckSlides(id) {
    const s = read();
    const d = s.decks.find((d) => d.id === id && d.published);
    if (!d) return null;
    const { id: deckId, title, subtitle, created_at, count } = d;
    return {
      deck: { id: deckId, title, subtitle, created_at, count },
      slides: d.slides.map(classSlide),
    };
  },
  async deckLibrary() {
    const s = read();
    return { decks: s.decks, live: s.live };
  },
  async saveDeck(input) {
    const s = read();
    if (!input.slides.length) throw new Error('A lesson needs slides.');
    const existing = input.id ? deck(s, input.id) : null;
    if (existing && s.live.deck_id === existing.id) throw new Error('End the live lesson first.');
    const id = existing?.id ?? s.nextDeckId++;
    const slides = input.slides.map((slide, idx) => ({
      id: id * 100 + idx,
      idx,
      label: slide.label,
      html: slide.html,
      notes: slide.notes || existing?.slides[idx]?.notes || '',
      poll_id: existing?.slides[idx]?.poll_id ?? null,
    }));
    const next: Deck = {
      id,
      title: input.title,
      subtitle: input.subtitle,
      published: existing?.published ?? false,
      created_at: existing?.created_at ?? new Date().toISOString(),
      count: slides.length,
      slides,
    };
    s.decks = [next, ...s.decks.filter((d) => d.id !== id)];
    write(s);
    return id;
  },
  async publishDeck(id, published) {
    const s = read();
    deck(s, id).published = published;
    write(s);
  },
  async deleteDeck(id) {
    const s = read();
    if (s.live.deck_id === id) throw new Error('End the live lesson first.');
    deck(s, id);
    s.decks = s.decks.filter((d) => d.id !== id);
    write(s);
  },
  async setSlidePoll(slideId, pollId) {
    const s = read();
    if (pollId !== null) poll(s, pollId);
    for (const d of s.decks)
      for (const slide of d.slides) if (slide.id === slideId) slide.poll_id = pollId;
    write(s);
  },
  async setSlideNotes(slideId, notes) {
    const s = read();
    for (const d of s.decks)
      for (const slide of d.slides) if (slide.id === slideId) slide.notes = notes;
    write(s);
  },
  async goLive(deckId) {
    const s = read();
    const d = deck(s, deckId);
    if (!d.slides.length) throw new Error('That lesson has no slides.');
    s.live = { deck_id: deckId, slide_idx: 0 };
    arrive(s, 0);
    write(s);
  },
  async endLive() {
    const s = read();
    const d = s.live.deck_id === null ? null : deck(s, s.live.deck_id);
    if (d && s.currentId !== null && d.slides.some((slide) => slide.poll_id === s.currentId)) {
      poll(s, s.currentId).status = 'closed';
    }
    s.live = { deck_id: null, slide_idx: 0 };
    write(s);
  },
  async show(idx) {
    const s = read();
    if (s.live.deck_id === null) throw new Error('No live lesson');
    if (idx === s.live.slide_idx) return;
    arrive(s, idx);
    write(s);
  },
};
