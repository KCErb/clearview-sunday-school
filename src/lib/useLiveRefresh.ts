import { useEffect, useRef } from 'react';

/**
 * Visibility-aware interval refetch — the transport for live prompts.
 *
 * Deliberately not Supabase Realtime: a dropped channel fails silently, and the one moment
 * this feature must not fail is a chapel full of backgrounded phones on spotty LTE. An
 * interval self-heals. Pauses while the tab is hidden and fires immediately on return, so
 * coming back to a stale page — the failure people would actually notice — can't happen.
 */
export function useLiveRefresh(fn: () => void | Promise<void>, ms: number, enabled = true) {
  const saved = useRef(fn);
  useEffect(() => {
    saved.current = fn;
  }, [fn]);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | undefined;

    const run = () => void saved.current();
    const start = () => {
      stop();
      timer = setInterval(run, ms);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        run();
        start();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ms, enabled]);
}
