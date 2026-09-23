import { supabase } from '@/lib/supabase';
import { PollError, type PollApi } from './types';

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(name, args).abortSignal(AbortSignal.timeout(10000));
  if (error)
    throw new PollError(
      error.message,
      error.message.includes('closed')
        ? 'closed'
        : error.message.includes('revision')
          ? 'conflict'
          : 'network',
    );
  return data as T;
}
export const liveApi: PollApi = {
  current: () => rpc('poll_current'),
  answer: (id, token) => rpc('poll_my_answer', { p_id: id, p_token: token }),
  saveAnswer: (id, token, selection, revision, epoch) =>
    rpc('poll_answer', {
      p_id: id,
      p_token: token,
      p_selection: selection,
      p_revision: revision,
      p_epoch: epoch,
    }),
  library: () => rpc('poll_library'),
  writeIns: (id, token) => rpc('poll_my_write_ins', { p_id: id, p_token: token }),
  saveWriteIn: (id, token, writeInId, body, revision, epoch) => rpc('poll_write_in_save', {
    p_id: id, p_token: token, p_write_in_id: writeInId, p_body: body, p_revision: revision, p_epoch: epoch,
  }),
  savePoll: (id, draft) =>
    rpc('poll_save', {
      p_id: id,
      p_question: draft.question,
      p_detail: draft.detail,
      p_kind: draft.kind,
      p_labels: draft.labels,
    }),
  action: (id, action) => rpc('poll_action', { p_id: id, p_action: action }),
  stage: () => rpc('stage_current'),
  deckList: () => rpc('deck_list'),
  deckSlides: (id) => rpc('deck_slides', { p_deck_id: id }),
  deckLibrary: () => rpc('deck_library'),
  saveDeck: (deck) => rpc('deck_save', { p_deck: deck }),
  publishDeck: (id, published) => rpc('deck_publish', { p_id: id, p_published: published }),
  deleteDeck: (id) => rpc('deck_delete', { p_id: id }),
  setSlidePoll: (slideId, pollId) => rpc('slide_set_poll', { p_slide_id: slideId, p_poll_id: pollId }),
  setSlideNotes: (slideId, notes) => rpc('slide_set_notes', { p_slide_id: slideId, p_notes: notes }),
  goLive: (deckId) => rpc('deck_go_live', { p_deck_id: deckId }),
  endLive: () => rpc('deck_end_live'),
  show: (idx) => rpc('deck_show', { p_idx: idx }),
};
