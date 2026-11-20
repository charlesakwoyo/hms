export type NoticeKind = 'success' | 'error' | 'warning' | 'info';

export interface Notice {
  kind: NoticeKind;
  title: string;
  message?: string;
  points?: string[];
}

export const NOTIFY_EVENT = 'wisecare:notify';

export const notify = (notice: Notice) => {
  window.dispatchEvent(new CustomEvent<Notice>(NOTIFY_EVENT, { detail: notice }));
};

export const noticeFromText = (text: string): Notice => {
  const lines = String(text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const points = lines.filter((l) => /^[•\-*]\s/.test(l)).map((l) => l.replace(/^[•\-*]\s+/, ''));
  const prose = lines.filter((l) => !/^[•\-*]\s/.test(l));
  const all = lines.join(' ');
  const kind: NoticeKind = /could not|cannot|can't|failed|failure|error|unable|denied|not saved|not found/i.test(all)
    ? 'error'
    : /^(please|select|enter|choose)\b|required|missing|invalid|must\b/i.test(all)
      ? 'warning'
      : /success|saved|completed|created|updated|approved|submitted|done/i.test(all)
        ? 'success'
        : 'info';
  const titles: Record<NoticeKind, string> = {
    success: 'Done',
    error: 'Something went wrong',
    warning: 'Please check',
    info: 'Please note',
  };
  if (prose.length > 1) return { kind, title: prose[0], message: prose.slice(1).join(' '), points };
  return { kind, title: titles[kind], message: prose[0] || '', points };
};
