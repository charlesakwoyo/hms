let lastSetupId = 0;

export function nextSetupId(): number {
  const now = Date.now() * 1000;
  lastSetupId = Math.max(lastSetupId + 1, now + Math.floor(Math.random() * 1000));
  return lastSetupId;
}
