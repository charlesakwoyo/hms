const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const newRecordId = (prefix: string): string => {
  const d = new Date();
  const date = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const bytes = new Uint8Array(5);
  (globalThis.crypto || (window as any).msCrypto).getRandomValues(bytes);
  const code = Array.from(bytes, (b) => LETTERS[b % LETTERS.length]).join('');
  return `${prefix}-${date}-${code}`;
};
