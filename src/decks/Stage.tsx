import { useEffect, useState } from 'react';
import type { PollApi, Stage as StageState } from '@/polling/types';
import { useRefresh } from '@/polling/useRefresh';
import { SlideFrame } from './SlideFrame';
import { PollBadge } from './PollBadge';

/**
 * The screen in the room. No chrome, no controls — it follows the presenter view in /manage.
 * Often this is a phone mirrored to the TV, so one tap goes full screen and landscape, and the
 * page asks the phone to stay awake for the whole lesson.
 */
export function Stage({ api }: { api: PollApi }) {
  const [stage, setStage] = useState<StageState | null>(null);
  const [started, setStarted] = useState(false);
  const [full, setFull] = useState(false);
  useRefresh(async () => {
    try {
      setStage(await api.stage());
      setStarted(true);
    } catch {
      // A blip on the chapel wi-fi must never blank the screen mid-lesson.
    }
  });
  useEffect(() => {
    document.title = stage ? stage.deck.title : 'Clearview Ward Sunday School';
  }, [stage]);
  useEffect(() => {
    const change = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', change);
    return () => document.removeEventListener('fullscreenchange', change);
  }, []);
  useEffect(() => {
    // A dimmed or locked phone would blank the TV mid-lesson. The lock drops whenever the page is
    // hidden, so it is taken again each time the page comes back.
    let lock: WakeLockSentinel | null = null;
    const keepAwake = async () => {
      if (document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return;
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        // Battery saver or an unsupported browser; the screen timeout setting still applies.
      }
    };
    void keepAwake();
    document.addEventListener('visibilitychange', keepAwake);
    return () => {
      document.removeEventListener('visibilitychange', keepAwake);
      void lock?.release().catch(() => {});
    };
  }, []);
  const goFull = async () => {
    if (document.fullscreenElement || !document.fullscreenEnabled) return;
    try {
      await document.documentElement.requestFullscreen();
      // Android Chrome can pin landscape once full screen; elsewhere this quietly does nothing.
      const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      await orientation.lock?.('landscape').catch(() => {});
    } catch {
      // Not allowed here; the slide still shows, just with the browser around it.
    }
  };
  const canFull = typeof document !== 'undefined' && document.fullscreenEnabled && !full;
  return (
    <div className="stage" onClick={() => void goFull()}>
      {stage ? (
        <SlideFrame
          key={`${stage.deck.id}:${stage.slide.idx}`}
          html={stage.slide.html}
          fit="contain"
          overlay={stage.slide.poll_id ? <PollBadge /> : null}
        />
      ) : (
        <div className="stage-idle">
          <span>Clearview Ward</span>
          <p>{started ? 'Ready when you are.' : 'Connecting…'}</p>
          {canFull && <small>Tap anywhere for full screen</small>}
        </div>
      )}
    </div>
  );
}
