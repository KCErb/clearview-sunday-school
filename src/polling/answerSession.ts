import { PollError, type Answer, type PollApi } from './types.ts';
export interface SavedDevice {
  token: string;
  pending: number[] | null;
  revision: number;
  selection: number[];
  epoch: string;
}
export interface AnswerState {
  selection: number[];
  status: string;
  ready: boolean;
  token?: string;
}
function isDevice(value: unknown): value is SavedDevice {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SavedDevice>;
  const isSelection = (items: unknown): items is number[] =>
    Array.isArray(items) && items.every(item => Number.isSafeInteger(item));
  return typeof candidate.token === 'string' && candidate.token.length >= 64 &&
    candidate.token.length <= 128 && typeof candidate.epoch === 'string' &&
    Number.isSafeInteger(candidate.revision) && (candidate.revision ?? -1) >= 0 &&
    isSelection(candidate.selection) &&
    (candidate.pending === null || isSelection(candidate.pending));
}
const memory = new Map<string, SavedDevice>();
export class AnswerSession {
  private device: SavedDevice;
  private stopped = false;
  private busy = false;
  private loaded = false;
  private change = 0;
  private state: AnswerState;
  private key: string;
  private durable = true;
  private epoch: string;
  private api: PollApi;
  private id: number;
  private emit: (state: AnswerState) => void;
  constructor(
    api: PollApi,
    id: number,
    namespace: string,
    epoch: string,
    emit: (state: AnswerState) => void,
  ) {
    this.epoch = epoch;
    this.api = api;
    this.id = id;
    this.emit = emit;
    this.key = `${namespace}.answer.${id}`;
    let stored: SavedDevice | undefined;
    try {
      const candidate: unknown = JSON.parse(localStorage.getItem(this.key) || 'null');
      if (isDevice(candidate)) stored = candidate;
    } catch {
      this.durable = false;
    }
    this.device = stored ||
      memory.get(this.key) || {
        token: crypto.randomUUID() + crypto.randomUUID(),
        pending: null,
        revision: 0,
        selection: [],
        epoch,
      };
    if (this.device.epoch !== epoch) {
      this.device.pending = null;
      this.device.epoch = epoch;
    }
    this.persist();
    this.state = {
      selection: this.device.pending ?? this.device.selection,
      status: 'Connecting…',
      ready: false,
    };
  }
  private persist() {
    memory.set(this.key, this.device);
    try {
      localStorage.setItem(this.key, JSON.stringify(this.device));
    } catch {
      this.durable = false;
    }
  }
  private publish(status: string) {
    this.state = {
      token: this.device.token,
      selection: this.device.pending ?? this.device.selection,
      status,
      ready: this.loaded,
    };
    if (!this.stopped) this.emit(this.state);
  }
  private savedLabel() {
    return this.durable
      ? 'Saved · You can change your answer'
      : 'Saved · Keep this page open to keep editing';
  }
  stop() {
    this.stopped = true;
  }
  select(selection: number[]) {
    if (!this.loaded || this.stopped) return;
    this.device.pending = selection;
    this.change++;
    this.persist();
    this.publish('Saving…');
    void this.refresh();
  }
  async refresh(open = true) {
    if (this.busy || this.stopped) return;
    this.busy = true;
    try {
      if (!open) {
        this.device.pending = null;
        this.persist();
      }
      if (!this.loaded || this.device.pending === null) {
        const mine = await this.api.answer(this.id, this.device.token);
        if (this.stopped) return;
        this.loaded = true;
        if (this.device.pending !== null && mine.revision !== this.device.revision) {
          const same =
            this.device.pending.slice().sort().join() === mine.selection.slice().sort().join();
          this.device.pending = null;
          this.device.revision = mine.revision;
          this.device.selection = mine.selection;
          this.persist();
          this.publish(
            same ? this.savedLabel() : 'Updated in another tab · You can change it here',
          );
          return;
        }
        this.device.revision = mine.revision;
        this.device.selection = mine.selection;
        this.persist();
        this.publish(
          open
            ? mine.revision
              ? this.savedLabel()
              : 'Your response is private'
            : 'Closed · Thank you for sharing',
        );
      }
      while (open && this.device.pending !== null && !this.stopped) {
        const selection = [...this.device.pending];
        const change = this.change;
        this.publish('Saving…');
        let result: Answer;
        try {
          result = await this.api.saveAnswer(
            this.id,
            this.device.token,
            selection,
            this.device.revision,
            this.epoch,
          );
        } catch (error) {
          if (error instanceof PollError && error.code === 'conflict') {
            const server = await this.api.answer(this.id, this.device.token);
            if (this.stopped) return;
            // A timed-out write may have succeeded. A different selection means another tab won.
            this.device.revision = server.revision;
            this.device.selection = server.selection;
            if (selection.slice().sort().join() !== server.selection.slice().sort().join()) {
              this.device.pending = null;
              this.persist();
              this.publish('Updated in another tab · You can change it here');
              return;
            }
            result = server;
          } else throw error;
        }
        if (this.stopped) return;
        this.device.revision = result.revision;
        this.device.selection = result.selection;
        if (this.change === change) this.device.pending = null;
        this.persist();
        this.publish(this.device.pending ? 'Saving…' : this.savedLabel());
      }
    } catch (error) {
      if (this.stopped) return;
      if (error instanceof PollError && error.code === 'closed') {
        this.device.pending = null;
        this.persist();
        this.publish('Question closed before this change was saved');
      } else
        this.publish(
          this.device.pending ? 'Reconnecting · Your change is not saved yet' : 'Reconnecting…',
        );
    } finally {
      this.busy = false;
    }
  }
}
