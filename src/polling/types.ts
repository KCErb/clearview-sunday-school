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
}
export class PollError extends Error {
  code: string;
  constructor(message: string, code = 'network') {
    super(message);
    this.code = code;
  }
}
