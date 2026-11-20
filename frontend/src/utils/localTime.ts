const pad = (n: number) => String(n).padStart(2, '0');

export const localDate = (d: Date = new Date()): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const localDateTime = (separator: ' ' | 'T' = ' ', withSeconds = false, d: Date = new Date()): string =>
  `${localDate(d)}${separator}${pad(d.getHours())}:${pad(d.getMinutes())}${withSeconds ? `:${pad(d.getSeconds())}` : ''}`;
