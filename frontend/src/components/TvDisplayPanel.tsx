import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Monitor, Volume2, VolumeX, X, ExternalLink, CheckCircle2, AlertTriangle, Loader2, Copy } from 'lucide-react';

interface TvSettings {
  soundOn: boolean;
  volume: number;
  videoUrl: string;
  tickerText: string;
  testAt: number;
}
interface TvScreen {
  id: string;
  sound: string;
  screen: string;
  testPlayed: number;
  agent: string;
  secondsAgo: number;
  online: boolean;
}

const API = '/api/tv-settings';

async function call(body?: unknown) {
  const res = await fetch(
    API,
    body === undefined
      ? { credentials: 'include', cache: 'no-store' }
      : { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  );
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) throw new Error(data?.error || 'The TV settings could not be reached. Check the connection.');
  return data as { settings: TvSettings; screens: TvScreen[]; serverNow: number };
}

function deviceLabel(s: TvScreen) {
  const a = s.agent.toLowerCase();
  const kind = /android tv|googletv|aft|bravia|smart-?tv|tizen|webos|hbbtv|tv bro/.test(a)
    ? 'TV'
    : /android/.test(a)
      ? 'Android device'
      : /windows/.test(a)
        ? 'Windows computer'
        : /linux|x11/.test(a)
          ? 'Linux computer'
          : /mac/.test(a)
            ? 'Mac'
            : 'Screen';
  return `${kind}${s.screen ? ` (${s.screen.replace('x', ' × ')})` : ''}`;
}
function ago(sec: number) {
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.round(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)} h ago`;
  return `${Math.round(sec / 86400)} day(s) ago`;
}

export const TvDisplayPanel: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [settings, setSettings] = useState<TvSettings | null>(null);
  const [screens, setScreens] = useState<TvScreen[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [testAt, setTestAt] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [tickerText, setTickerText] = useState('');
  const loaded = useRef(false);
  const tvUrl = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}tv`;

  const refresh = useCallback(async () => {
    try {
      const d = await call();
      setSettings(d.settings);
      setScreens(d.screens || []);
      setError('');
      if (!loaded.current) {
        setVideoUrl(d.settings.videoUrl || '');
        setTickerText(d.settings.tickerText || '');
        loaded.current = true;
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      loaded.current = false;
      return;
    }
    void refresh();
    const t = window.setInterval(refresh, 2500);
    return () => window.clearInterval(t);
  }, [open, refresh]);

  const save = async (change: Partial<TvSettings>, note: string) => {
    if (!settings) return;
    setSaving(true);
    setSaved('');
    setSettings({ ...settings, ...change });
    try {
      const d = await call({ settings: change });
      setSettings(d.settings);
      setScreens(d.screens || []);
      setError('');
      setSaved(note);
    } catch (e) {
      setError((e as Error).message);
      void refresh();
    }
    setSaving(false);
  };
  const test = async () => {
    setSaved('');
    try {
      const d = (await call({ action: 'test' })) as any;
      setTestAt(Number(d.testAt || 0));
      setScreens(d.screens || []);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!open) return null;
  const online = screens.filter((s) => s.online);
  const blocked = online.some((s) => s.sound === 'blocked');
  const testHeard = testAt > 0 && online.some((s) => s.testPlayed >= testAt);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-3 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-600" /> Waiting-area TV display
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-5 text-sm">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">{error}</div>}
          {!settings && !error && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">TV screens</p>
            {screens.length === 0 && (
              <p className="text-xs text-gray-500">
                No TV has opened the queue page yet. Open <b>{tvUrl}</b> in the TV's browser.
              </p>
            )}
            <div className="space-y-2">
              {screens.slice(0, 6).map((s) => (
                <div key={s.id} className={`p-3 rounded-lg border text-xs ${s.online ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-800">{deviceLabel(s)}</span>
                    <span className={`font-semibold ${s.online ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {s.online ? '● Online' : `Offline, last seen ${ago(s.secondsAgo)}`}
                    </span>
                  </div>
                  {s.online && (
                    <div className="mt-1 text-gray-600">
                      {s.sound === 'ready' && <span className="text-emerald-700">Sound ready</span>}
                      {s.sound === 'off' && <span>Announcements switched off</span>}
                      {s.sound === 'chime' && <span className="text-amber-700">Chime only (this TV cannot play the voice)</span>}
                      {s.sound === 'blocked' && (
                        <span className="text-amber-700 font-semibold">
                          Sound waiting: press OK on this TV's remote once (its browser asks for one press after the page opens).
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {settings && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">Announcements on the TV</p>
                  <p className="text-xs text-gray-500">"Attention please. Now serving ticket number …" spoken on the TV for every call.</p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    save({ soundOn: !settings.soundOn }, settings.soundOn ? 'Announcements switched off.' : 'Announcements switched on.')
                  }
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold shrink-0 ${settings.soundOn ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-50 border-gray-300 text-gray-600'}`}
                >
                  {settings.soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {settings.soundOn ? 'On' : 'Off'}
                </button>
              </div>
              <div className={settings.soundOn ? '' : 'opacity-50 pointer-events-none'}>
                <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1">
                  <span>Volume</span>
                  <span>{settings.volume}%</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={settings.volume}
                  className="w-full"
                  onChange={(e) => setSettings({ ...settings, volume: Number(e.target.value) })}
                  onMouseUp={(e) => save({ volume: Number((e.target as HTMLInputElement).value) }, 'Volume saved.')}
                  onTouchEnd={(e) => save({ volume: Number((e.target as HTMLInputElement).value) }, 'Volume saved.')}
                  onKeyUp={(e) => save({ volume: Number((e.target as HTMLInputElement).value) }, 'Volume saved.')}
                />
                <p className="text-[11px] text-gray-500 mt-1">The TV's own volume still applies; set the TV loud enough once.</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={test}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                  >
                    Test sound on TV
                  </button>
                  {testAt > 0 && !testHeard && !blocked && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Sent; the TV plays it within a few seconds…
                    </span>
                  )}
                  {testAt > 0 && !testHeard && blocked && (
                    <span className="text-xs text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> The TV is waiting for one press on its remote before it can play sound.
                    </span>
                  )}
                  {testHeard && (
                    <span className="text-xs text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> The TV played the test.
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-1 border-t">
                <div className="pt-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Video on the TV (YouTube video, playlist or livestream link)
                  </label>
                  <input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Plays without sound, so calls are always heard. Leave empty to give the whole screen to the queue.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Scrolling message at the bottom</label>
                  <textarea
                    value={tickerText}
                    onChange={(e) => setTickerText(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Welcome to our hospital. Please listen for your ticket number…"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={saving || (videoUrl.trim() === (settings.videoUrl || '') && tickerText.trim() === (settings.tickerText || ''))}
                  onClick={() => {
                    if (
                      videoUrl.trim() &&
                      !/^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\//i.test(videoUrl.trim())
                    ) {
                      setError('Use a YouTube link (https://www.youtube.com/… or https://youtu.be/…).');
                      return;
                    }
                    void save(
                      { videoUrl: videoUrl.trim(), tickerText: tickerText.trim() },
                      'Video and message saved; the TV shows them within a few seconds.',
                    );
                  }}
                  className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold disabled:opacity-40"
                >
                  Save video & message
                </button>
              </div>
              {saved && <p className="text-xs text-emerald-700">{saved}</p>}
            </>
          )}

          <div className="p-3 rounded-lg bg-gray-50 border text-xs text-gray-600 space-y-1">
            <p>
              Open this address once in the TV's browser and leave it open; it fits any screen size, keeps the screen awake and reconnects
              by itself:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate bg-white border rounded px-2 py-1">{tvUrl}</code>
              <button
                type="button"
                title="Copy"
                onClick={() => {
                  void navigator.clipboard?.writeText(tvUrl);
                  setSaved('Address copied.');
                }}
                className="p-1.5 rounded border bg-white hover:bg-gray-100"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a href={tvUrl} target="_blank" rel="noreferrer" title="Open" className="p-1.5 rounded border bg-white hover:bg-gray-100">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
