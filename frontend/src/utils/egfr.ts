export const EGFR_KEY = 'eGFR';
export const EGFR_UNIT = 'mL/min/1.73m²';
export const EGFR_REFERENCE = '≥ 90';

export const EGFR_CATEGORIES: { code: string; range: string; term: string; min: number }[] = [
  { code: 'G1', range: '≥ 90', term: 'Normal or high', min: 90 },
  { code: 'G2', range: '60–89', term: 'Mildly decreased', min: 60 },
  { code: 'G3a', range: '45–59', term: 'Mildly to moderately decreased', min: 45 },
  { code: 'G3b', range: '30–44', term: 'Moderately to severely decreased', min: 30 },
  { code: 'G4', range: '15–29', term: 'Severely decreased', min: 15 },
  { code: 'G5', range: '< 15', term: 'Kidney failure', min: -Infinity },
];

export const classifyEgfr = (value: unknown) => {
  const t = String(value ?? '').trim();
  if (t === '' || !Number.isFinite(Number(t)) || Number(t) < 0) return null;
  const n = Number(t);
  return EGFR_CATEGORIES.find((c) => n >= c.min) || null;
};
