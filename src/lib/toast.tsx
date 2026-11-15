import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}
interface ToastValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = ++counter.current;
      setItems((prev) => [...prev.slice(-2), { id, message, kind }]);
      const timer = window.setTimeout(() => dismiss(id), 3800);
      timers.current.push(timer);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex flex-col items-center gap-2 px-4 sm:bottom-8" aria-live="polite">
        {items.map((item) => {
          const Icon = item.kind === 'success' ? CheckCircle2 : item.kind === 'error' ? XCircle : Info;
          return (
            <div
              key={item.id}
              className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line-strong)',
                color: 'var(--text)'
              }}
              role="status"
            >
              <Icon
                size={20}
                className="shrink-0"
                style={{ color: item.kind === 'success' ? 'var(--ok)' : item.kind === 'error' ? 'var(--danger)' : 'var(--brand)' }}
              />
              <span className="flex-1">{item.message}</span>
              <button className="rounded-full p-1 opacity-60 hover:opacity-100" onClick={() => dismiss(item.id)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
