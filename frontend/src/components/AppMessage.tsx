import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type MessageTone = 'warning' | 'success' | 'info';
export interface AppMessageDetail {
  title?: string;
  message: string;
  tone?: MessageTone;
}

export const showMessage = (detail: AppMessageDetail | string) => {
  const d = typeof detail === 'string' ? { message: detail } : detail;
  window.dispatchEvent(new CustomEvent<AppMessageDetail>('wisecare:message', { detail: d }));
};

export interface ConfirmDetail {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}
export const askConfirm = (detail: ConfirmDetail): Promise<boolean> =>
  new Promise((resolve) => window.dispatchEvent(new CustomEvent('wisecare:confirm', { detail: { ...detail, resolve } })));

const guess = (message: string): { tone: MessageTone; title: string } => {
  if (
    /\b(cannot|could not|couldn't|not saved|was not|were not|not found|refused|failed|unable|invalid|missing|required|already|no longer|too many|expired|denied|not allowed|must|please|enter|select|choose|first|before|check)\b/i.test(
      message,
    )
  )
    return { tone: 'warning', title: 'Not done' };
  if (/\b(saved|sent|done|completed|recorded|updated|created|added|dispensed|paid|approved|submitted|imported)\b/i.test(message))
    return { tone: 'success', title: 'Done' };
  return { tone: 'info', title: 'WiseCare' };
};

const STYLE: Record<MessageTone, { ring: string; icon: React.ReactNode; button: string }> = {
  warning: { ring: 'bg-amber-50 text-amber-600', icon: <AlertTriangle className="w-6 h-6" />, button: 'bg-amber-600 hover:bg-amber-700' },
  success: {
    ring: 'bg-emerald-50 text-emerald-600',
    icon: <CheckCircle2 className="w-6 h-6" />,
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
  info: { ring: 'bg-blue-50 text-blue-600', icon: <Info className="w-6 h-6" />, button: 'bg-blue-600 hover:bg-blue-700' },
};

export const AppMessageHost: React.FC = () => {
  type Entry = Required<AppMessageDetail> & { confirm?: { label: string; danger: boolean; resolve: (ok: boolean) => void } };
  const [queue, setQueue] = useState<Entry[]>([]);

  const [toasts, setToasts] = useState<Array<{ id: number; title: string; message: string }>>([]);
  const dropToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  useEffect(() => {
    const onMessage = (e: Event) => {
      const d = (e as CustomEvent<AppMessageDetail>).detail;
      if (!d?.message) return;
      const g = guess(d.message);
      const tone = d.tone || g.tone;
      if (tone === 'success') {
        const id = Date.now() + Math.random();
        setToasts((t) => [...t.slice(-2), { id, title: d.title || 'Done', message: d.message }]);
        window.setTimeout(() => dropToast(id), Math.min(9000, 3500 + d.message.length * 25));
        return;
      }
      setQueue((q) => [...q, { message: d.message, tone, title: d.title || g.title }]);
    };
    window.addEventListener('wisecare:message', onMessage);
    const onConfirm = (e: Event) => {
      const d = (e as CustomEvent<ConfirmDetail & { resolve: (ok: boolean) => void }>).detail;
      setQueue((q) => [
        ...q,
        {
          title: d.title,
          message: d.message,
          tone: d.danger ? 'warning' : 'info',
          confirm: { label: d.confirmLabel || 'Continue', danger: !!d.danger, resolve: d.resolve },
        },
      ]);
    };
    window.addEventListener('wisecare:confirm', onConfirm);
    const original = window.alert;
    window.alert = (m?: any) => showMessage(String(m ?? ''));
    return () => {
      window.removeEventListener('wisecare:message', onMessage);
      window.removeEventListener('wisecare:confirm', onConfirm);
      window.alert = original;
    };
  }, []);

  const current = queue[0];

  function answer(ok: boolean) {
    setQueue((q) => {
      q[0]?.confirm?.resolve(ok);
      return q.slice(1);
    });
  }
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') answer(false);
      else if (e.key === 'Enter') answer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current]);
  const toastList = toasts.length > 0 && (
    <div
      className="fixed top-4 right-4 z-[10001] flex flex-col gap-2 w-[min(380px,calc(100vw-2rem))] pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <button
          type="button"
          key={t.id}
          onClick={() => dropToast(t.id)}
          className="wc-toast pointer-events-auto text-left flex items-start gap-3 rounded-xl border border-emerald-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-gray-900">{t.title}</span>
            <span className="block text-xs text-gray-600 whitespace-pre-line break-words">{t.message}</span>
          </span>
        </button>
      ))}
    </div>
  );
  if (!current) return toastList || null;
  const s = STYLE[current.tone];
  const close = () => answer(false);
  return (
    <>
      {toastList}
      <div
        className="wc-fade fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="wc-msg-title"
      >
        <div className="wc-pop w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100">
          <div className="flex items-start gap-3 p-5">
            <div className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center ${s.ring}`}>{s.icon}</div>
            <div className="flex-1 min-w-0">
              <h2 id="wc-msg-title" className="text-base font-bold text-gray-900">
                {current.title}
              </h2>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-line break-words">{current.message}</p>
            </div>
            <button type="button" onClick={close} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
            {queue.length > 1 && <span className="mr-auto self-center text-[11px] text-gray-400">{queue.length - 1} more</span>}
            {current.confirm ? (
              <>
                <button
                  type="button"
                  onClick={() => answer(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => answer(true)}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold text-white cursor-pointer ${current.confirm.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {current.confirm.label}
                </button>
              </>
            ) : (
              <button
                type="button"
                autoFocus
                onClick={() => answer(true)}
                className={`rounded-lg px-5 py-2 text-sm font-semibold text-white cursor-pointer ${s.button}`}
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
