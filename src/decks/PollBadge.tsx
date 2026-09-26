import { JOIN_URL } from './join';

/**
 * Corner badge on a slide whose question is open, so anyone who missed the join slide can still
 * answer. Sized in slide pixels; SlideFrame's overlay layer scales it with the slide.
 */
export function PollBadge() {
  return (
    <div className="poll-badge-slide" role="note">
      <img src="/join-qr.svg" alt="" />
      <div>
        <span>Answer on your phone</span>
        <strong>{JOIN_URL}</strong>
      </div>
    </div>
  );
}
