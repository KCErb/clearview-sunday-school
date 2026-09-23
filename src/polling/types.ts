export interface PollOption {
  id: number;
  label: string;
}
export interface Poll {
  id: number;
  question: string;
  detail: string;
  kind: 'single' | 'multi';
  status: 'draft' | 'open' | 'closed';
  options: PollOption[];
  created_at: string;
  opened_at: string | null;
  locked: boolean;
}
export interface PollDraft {
  question: string;
  detail: string;
  kind: Poll['kind'];
  labels: string[];
}
export interface Answer {
  selection: number[];
  revision: number;
}
export interface Results {
  respondents: number;
  counts: Record<number, number>;
  write_ins?: WriteIn[];
}
export interface WriteIn {
  id: string;
  body: string;
  revision: number;
  created_at: string;
  deleted?: boolean;
}
export interface Library {
  polls: Poll[];
  currentId: number | null;
  results: Record<number, Results>;
}
export interface DeckSummary {
  id: number;
  title: string;
  subtitle: string;
  created_at: string;
  count: number;
}
export interface Slide {
  id: number;
  idx: number;
  label: string;
  html: string;
  poll_id: number | null;
  /** Teacher-only; present in deckLibrary, never in stage or class reads. */
  notes?: string;
}
export interface Deck extends DeckSummary {
  published: boolean;
  slides: Slide[];
}
export interface DeckLibrary {
  decks: Deck[];
  live: { deck_id: number | null; slide_idx: number };
}
export interface Stage {
  deck: { id: number; title: string };
  slide: Slide;
  count: number;
}
export interface DeckInput {
  id?: number | null;
  title: string;
  subtitle: string;
  slides: { label: string; html: string; notes?: string }[];
}
export interface PollApi {
  current(): Promise<Poll | null>;
  answer(id: number, token: string): Promise<Answer>;
  saveAnswer(
    id: number,
    token: string,
    selection: number[],
    revision: number,
    epoch: string,
  ): Promise<Answer>;
  library(): Promise<Library>;
  writeIns(id: number, token: string): Promise<WriteIn[]>;
  saveWriteIn(id: number, token: string, writeInId: string, body: string | null, revision: number, epoch: string): Promise<WriteIn>;
  savePoll(id: number | null, draft: PollDraft): Promise<number>;
  action(id: number, action: 'open' | 'close' | 'delete'): Promise<void>;
  stage(): Promise<Stage | null>;
  deckList(): Promise<DeckSummary[]>;
  deckSlides(id: number): Promise<{ deck: DeckSummary; slides: Slide[] } | null>;
  deckLibrary(): Promise<DeckLibrary>;
  saveDeck(deck: DeckInput): Promise<number>;
  publishDeck(id: number, published: boolean): Promise<void>;
  deleteDeck(id: number): Promise<void>;
  setSlidePoll(slideId: number, pollId: number | null): Promise<void>;
  setSlideNotes(slideId: number, notes: string): Promise<void>;
  goLive(deckId: number): Promise<void>;
  endLive(): Promise<void>;
  show(idx: number): Promise<void>;
}
export class PollError extends Error {
  code: string;
  constructor(message: string, code = 'network') {
    super(message);
    this.code = code;
  }
}
