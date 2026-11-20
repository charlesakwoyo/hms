import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { Notice, NoticeKind, NOTIFY_EVENT } from '../services/notify';

const STYLES: Record<NoticeKind, { border: string; iconBg: string; Icon: React.ElementType; closeAfterMs?: number }> = {
  success: { border: 'border-emerald-200', iconBg: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2, closeAfterMs: 5000 },
  info: { border: 'border-blue-200', iconBg: 'bg-blue-100 text-blue-700', Icon: Info, closeAfterMs: 7000 },
  warning: { border: 'border-amber-300', iconBg: 'bg-amber-100 text-amber-700', Icon: AlertTriangle, closeAfterMs: 12000 },
  error: { border: 'border-red-300', iconBg: 'bg-red-100 text-red-700', Icon: XCircle },
};

type Shown = Notice & { id: number };

export const NotificationCenter: React.FC = () => {
  const [notices, setNotices] = useState<Shown[]>([]);

  const close = (id: number) => setNotices((prev) => prev.filter((n) => n.id !== id));

  useEffect(() => {
    let next = 0;
    const onNotify = (event: Event) => {
      const notice = (event as CustomEvent<Notice>).detail;
      if (!notice) return;
      const id = Date.now() + next++;

      setNotices((prev) => [
        ...prev.filter((n) => !(n.title === notice.title && n.message === notice.message)).slice(-3),
        { ...notice, id },
      ]);
      const after = STYLES[notice.kind]?.closeAfterMs;
      if (after) window.setTimeout(() => close(id), after);
    };
    window.addEventListener(NOTIFY_EVENT, onNotify);
    return () => window.removeEventListener(NOTIFY_EVENT, onNotify);
  }, []);

  if (!notices.length) return null;
  return (
    <div className="fixed right-4 top-4 z-[10000] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
      {notices.map((n) => {
        const style = STYLES[n.kind] || STYLES.info;
        return (
          <div
            key={n.id}
            role={n.kind === 'error' ? 'alert' : 'status'}
            className={`flex gap-3 rounded-xl border ${style.border} bg-white px-4 py-3 shadow-2xl`}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}>
              <style.Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900">{n.title}</div>
              {n.message && <div className="mt-0.5 text-xs text-slate-600 whitespace-pre-line">{n.message}</div>}
              {n.points && n.points.length > 0 && (
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-slate-700">
                  {n.points.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => close(n.id)}
              className="h-6 w-6 shrink-0 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close message"
            >
              <X className="mx-auto h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
