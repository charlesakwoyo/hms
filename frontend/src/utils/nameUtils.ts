export function getFirstName(fullName?: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();

  const withoutPrefix = trimmed.replace(/^(mr\.|mrs\.|ms\.|dr\.|rev\.|prof\.|miss)\s+/i, '');
  const parts = withoutPrefix.split(/\s+/);
  return parts[0] || trimmed;
}
