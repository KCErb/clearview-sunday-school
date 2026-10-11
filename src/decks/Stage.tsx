import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import type { PollApi, Stage as StageState } from '@/polling/types';
import { useRefresh } from '@/polling/useRefresh';
import { SlideFrame } from './SlideFrame';
import { PollBadge } from './PollBadge';

/**
 * The screen in the room. No chrome — it follows the presenter view in /manage.
 * Often this is a phone mirrored to the TV, so one tap goes full screen and landscape, and the
 * page asks the phone to stay awake for the whole lesson. When the teacher is signed in on this
 * device, tapping the left or right side (or arrow keys, or a clicker) also changes the slide for
 * everyone, so a phone alone can run a lesson that has no questions to manage.
 */
export function Stage({ api, control }: { api: PollApi; control?: boolean }) {
  const { profile } = useAuth();
  // deck_show is admin-only on the server; this only decides whether to try.
  const canControl = control ?? !!profile?.is_admin;
  const [stage, setStage] = useState<StageState | null>(null);
  const moving = useRef(false);
  const askedFull = useRef(false);
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
  const move = async (by: number) => {
    if (!stage || moving.current) return;
    const to = stage.slide.idx + by;
    if (to < 0 || to >= stage.count) return;
    moving.current = true;
    try {
      await api.show(to);
      // Don't wait for the next poll: the person tapping is watching this screen.
      setStage(await api.stage());
    } catch {
      // Signed out or offline; the slide simply stays.
    } finally {
      moving.current = false;
    }
  };
  useEffect(() => {
    if (!canControl) return;
    const keys = (e: KeyboardEvent) => {
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) void move(1);
      if (['ArrowLeft', 'PageUp'].includes(e.key)) void move(-1);
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  });
  // The first tap only asks for full screen, so reaching for the phone never skips a slide.
  // Only once: if the browser refuses, every later tap still turns the page.
  const firstTap = () => {
    if (askedFull.current || !document.fullscreenEnabled || document.fullscreenElement) return false;
    askedFull.current = true;
    void goFull();
    return true;
  };
  // Phones only let an embedded player (YouTube) start from a tap inside the player itself, so its
  // slide keeps the player uncovered; a plain video file can be played from a tap anywhere.
  const playPause = () => {
    const video = document.querySelector<HTMLVideoElement>('.stage .slide-canvas video');
    if (video) void (video.paused ? video.play().catch(() => {}) : video.pause());
  };
  // A swipe changes the slide; a tap goes full screen the first time, then plays or pauses a video.
  const press = useRef<{ x: number; y: number } | null>(null);
  const down = (e: React.PointerEvent) => {
    press.current = { x: e.clientX, y: e.clientY };
  };
  const up = (e: React.PointerEvent) => {
    const start = press.current;
    press.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (canControl) void move(dx < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && !firstTap()) playPause();
  };
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
    <div className="stage" onPointerDown={down} onPointerUp={up}>
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
          {canControl && <small>Swipe left or right to change slides</small>}
        </div>
      )}
      {/* For the teacher, a clear layer catches swipes so nothing on the slide swallows them. On a
          slide with an embedded player only the outer edges are covered, leaving the player's own
          controls to be tapped directly. */}
      {canControl && stage &&
        (stage.slide.html.includes('<iframe') ? (
          <>
            <div className="stage-touch edge prev" aria-hidden="true" />
            <div className="stage-touch edge next" aria-hidden="true" />
          </>
        ) : (
          <div className="stage-touch" aria-hidden="true" />
        ))}
    </div>
  );
}
