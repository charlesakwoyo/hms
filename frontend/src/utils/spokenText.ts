export const spokenTicket = (t: string): string =>
  String(t || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/([A-Z0-9])/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();

const titleWord = (w: string) => w.toLowerCase().replace(/(^|[-'’])([a-z])/g, (_m, sep, ch) => sep + ch.toUpperCase());
export const spokenName = (n: string): string =>
  String(n || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b[A-Z]{1,3}-\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w === w.toUpperCase() || w === w.toLowerCase() ? titleWord(w) : w))
    .join(' ');

const PLACE_WORDS: Record<string, string> = {
  OPD: 'O P D',
  IPD: 'I P D',
  MCH: 'M C H',
  CCC: 'C C C',
  ENT: 'E N T',
  SHA: 'S H A',
  ICU: 'I C U',
  HDU: 'H D U',
  NHIF: 'N H I F',
  ANC: 'A N C',
  PNC: 'P N C',
  FP: 'family planning',
  TB: 'T B',
  HIV: 'H I V',
  'X-RAY': 'X ray',
  XRAY: 'X ray',
  LAB: 'Laboratory',
  DEPT: 'Department',
  RM: 'Room',
  NO: 'number',
  CONSULT: 'Consultation',
};
export const spokenPlace = (d: string): string =>
  String(d || 'your department')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => {
      const key = w.toUpperCase().replace(/[.,]$/, '');
      if (PLACE_WORDS[key]) return PLACE_WORDS[key];
      return w === w.toUpperCase() && w.length > 1 ? titleWord(w) : w;
    })
    .join(' ');

export const bestVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  const female = [
    'female',
    'woman',
    'zira',
    'samantha',
    'victoria',
    'karen',
    'moira',
    'tessa',
    'susan',
    'ava',
    'aria',
    'jenny',
    'natasha',
    'libby',
    'sonia',
    'asilia',
    'leah',
    'ezinne',
    'imani',
    'linda',
    'heera',
  ];
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -1;
  for (const v of voices) {
    const lang = String(v.lang || '')
      .toLowerCase()
      .replace('_', '-');
    const name = String(v.name || '').toLowerCase();
    if (!lang.startsWith('en')) continue;
    let score = 30;
    if (lang === 'en-ke' || name.includes('kenya')) score = 100;
    else if (/^en-(za|ng|tz|ug|gh)$/.test(lang) || /south africa|nigeria|tanzania|uganda|ghana/.test(name)) score = 80;
    else if (lang === 'en-gb') score = 55;
    else if (lang === 'en-us') score = 45;
    if (/natural|online|neural/.test(name)) score += 15;
    if (female.some((f) => name.includes(f))) score += 10;
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best;
};
