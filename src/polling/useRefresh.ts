import { useEffect, useRef } from 'react';
/** One in-flight refresh, immediate foreground/online recovery, no background traffic. */
export function useRefresh(fn: () => Promise<void>, ms = 2000) {
  const callback = useRef(fn);
  useEffect(() => { callback.current = fn; }, [fn]);
  useEffect(() => {
    let stopped = false; let running = false; let timer: ReturnType<typeof setTimeout>;
    const run = async () => {
      if (stopped || running || document.hidden) return;
      clearTimeout(timer); running = true;
      try { await callback.current(); } finally { running = false; if (!stopped) timer = setTimeout(() => void run(), ms); }
    };
    const wake = () => { if (!document.hidden) void run(); else clearTimeout(timer); };
    void run(); document.addEventListener('visibilitychange', wake); window.addEventListener('online', wake);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener('visibilitychange', wake); window.removeEventListener('online', wake); };
  }, [ms]);
}
