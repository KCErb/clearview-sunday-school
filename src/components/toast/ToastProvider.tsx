import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastTone } from './context';

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    setToast({ id: Date.now(), message, tone });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div
            key={toast.id}
            className={`toast-in pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl ${
              toast.tone === 'success' ? 'bg-emerald-600' : 'bg-ink'
            }`}
          >
            {toast.tone === 'success' && <span aria-hidden>✓</span>}
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
