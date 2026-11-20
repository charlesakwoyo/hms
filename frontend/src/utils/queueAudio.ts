import { spokenTicket, spokenName, spokenPlace, bestVoice } from './spokenText';
import { getFirstName } from './nameUtils';

let audioContext: AudioContext | null = null;

const LOCAL_KEY = 'wcAnnounceOnThisComputer2';
export const announcesOnThisComputer = (): boolean => {
  try {
    return window.localStorage.getItem(LOCAL_KEY) === 'on';
  } catch {
    return false;
  }
};

export const hasSpeechVoices = (): boolean => {
  try {
    return !!window.speechSynthesis && window.speechSynthesis.getVoices().length > 0;
  } catch {
    return false;
  }
};
export const setAnnouncesOnThisComputer = (on: boolean): void => {
  try {
    window.localStorage.setItem(LOCAL_KEY, on ? 'on' : 'off');
  } catch {}
  window.dispatchEvent(new CustomEvent('wisecare:announce-setting', { detail: on }));
};

function getAudioContext(): AudioContext | null {
  try {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  } catch {
    return null;
  }
}

export function playHospitalChime(): void {
  if (!announcesOnThisComputer()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.22);
    gain2.gain.setValueAtTime(0.25, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.22);
    osc2.stop(now + 0.75);
  } catch {}
}

type Announcement = { message: string };
const pending: Announcement[] = [];
let speaking = false;
let current: SpeechSynthesisUtterance | null = null;
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const say = (message: string): Promise<void> =>
  new Promise((resolve) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth || !synth.getVoices().length) {
        resolve();
        return;
      }
      const u = new SpeechSynthesisUtterance(message);
      current = u;
      const voice = bestVoice(synth.getVoices());
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else u.lang = 'en-GB';
      u.rate = 0.85;
      u.pitch = 1.0;
      u.volume = 1;
      let done = false;
      const end = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      u.onend = end;
      u.onerror = end;
      if (synth.paused) synth.resume();
      synth.speak(u);

      window.setTimeout(
        () => {
          if (!done) {
            try {
              synth.cancel();
            } catch {}
            end();
          }
        },
        4000 + message.length * 110,
      );
    } catch {
      resolve();
    }
  });
async function runAnnouncements(): Promise<void> {
  if (speaking) return;
  speaking = true;
  try {
    while (pending.length) {
      const a = pending.shift()!;
      playHospitalChime();
      await wait(900);
      await say(a.message);
      await wait(600);
      await say(a.message);
      await wait(500);
    }
  } finally {
    speaking = false;
    current = null;
  }
}

export function announceTicket(ticketNumber: string, patientName: string, stationName: string, isRecall = false): void {
  if (!announcesOnThisComputer()) return;
  try {
    getAudioContext();
    window.speechSynthesis?.getVoices();
  } catch {}

  void isRecall;
  const first = spokenName(getFirstName(patientName));
  const message = `Attention please. Now serving ticket number ${spokenTicket(ticketNumber)}. ${first ? `${first}. ` : ''}Please proceed to ${spokenPlace(stationName)}. Thank you.`;
  pending.push({ message });
  void runAnnouncements();
}

export const playQueueChime = playHospitalChime;
export const announcePatientTicket = announceTicket;
