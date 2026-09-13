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
  savePoll: (id, draft) =>
    rpc('poll_save', {
      p_id: id,
      p_question: draft.question,
      p_detail: draft.detail,
      p_kind: draft.kind,
      p_labels: draft.labels,
    }),
  action: (id, action) => rpc('poll_action', { p_id: id, p_action: action }),
};
