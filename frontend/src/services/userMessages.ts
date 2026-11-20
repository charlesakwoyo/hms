const BY_STATUS: Record<number, string> = {
  400: 'Some details are missing or not in the right form. Check the form and try again.',
  401: 'Your session has ended. Sign in again to continue.',
  403: 'Your account is not allowed to do this. Ask the System Administrator if you need it.',
  404: 'This record could not be found. It may have been removed; refresh the page.',
  405: 'This action is not available here.',
  409: 'This record was changed by someone else, or it already exists. Refresh and try again.',
  413: 'The file is too large. Choose a smaller file.',
  422: 'Some details are missing or not valid. Check the form and try again.',
  423: 'This account is locked for a while after repeated wrong passwords.',
  429: 'Too many attempts in a short time. Wait a minute and try again.',
  500: 'WiseCare could not complete this. Try again; if it keeps happening, tell the System Administrator.',
  502: 'An outside service did not answer. Try again in a moment.',
  503: 'This service is not available right now. Try again in a moment.',
  504: 'An outside service took too long to answer. Try again in a moment.',
};

export const OFFLINE_MESSAGE = 'Cannot reach the WiseCare server. Check the network connection and try again.';
export const TIMEOUT_MESSAGE = 'The server took too long to answer. Check the connection and try again.';

const TECHNICAL =
  /SQLSTATE|PDO|mysqli|MySQL|MariaDB|\bSQL\b|syntax|stack trace|exception|undefined (index|variable|offset|array key)|fatal error|warning:|notice:|parse error|\.php\b|<br|<\/?[a-z]+[^>]*>|\bHTTP \d{3}\b|endpoint|payload|JSON|json_|curl|Apache|XAMPP|localhost|127\.0\.0\.1|entity_store|foreign key|constraint|\b[a-z]+_[a-z_]+\b\.[a-z_]+|null given|Call to|TypeError|NetworkError|Failed to fetch/i;

export function isTechnical(text: string): boolean {
  return TECHNICAL.test(text);
}

export function userMessage(detail: unknown, status?: number): string {
  const text = String((detail as any)?.message ?? detail ?? '').trim();
  if (/Failed to fetch|NetworkError|Load failed|ERR_CONNECTION/i.test(text)) return OFFLINE_MESSAGE;
  if (/timeout|timed out|AbortError/i.test(text)) return TIMEOUT_MESSAGE;
  if (text && text.length <= 400 && !isTechnical(text)) return text;
  if (status && BY_STATUS[status]) return BY_STATUS[status];
  if (status && status >= 500) return BY_STATUS[500];
  return 'Something went wrong. Try again; if it keeps happening, tell the System Administrator.';
}
