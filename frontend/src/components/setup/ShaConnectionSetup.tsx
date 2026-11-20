import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Save, ShieldCheck, Wifi } from 'lucide-react';
import { userMessage } from '../../services/userMessages';

type Env = 'sandbox' | 'production';
interface EnvView {
  baseUrl: string;
  keySet: boolean;
  keyHint: string | null;
  keySource: 'setup' | 'file' | 'none';
  certificate?: { subject: string; expires: string | null } | null;
}
interface View {
  active: Env;
  environments: Record<Env, EnvView>;
  webhookSecretSet: boolean;
}
interface TestResult {
  ok: boolean;
  state: string;
  message: string;
  vendorName: string | null;
  facility: { name: string | null; code: string | null; level: string | null; county: string | null } | null;
  matchesHospital: boolean | null;
  hospitalMfl: string | null;
}

const ENV_LABEL: Record<Env, string> = { sandbox: 'Test (Mwavuli sandbox)', production: "Live (the hospital's Connector)" };

async function call(action: string, body?: unknown) {
  try {
    const res = await fetch(
      `/api/sha/settings/${action}`,
      body === undefined
        ? { headers: { Accept: 'application/json' } }
        : { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    );
    const d = await res.json().catch(() => null);
    if (!d) return { success: false, error: userMessage('', res.status || 500) };
    if (!res.ok || d.success === false) return { success: false, error: userMessage(d.error || '', res.status) };
    return d;
  } catch {
    return { success: false, error: 'Cannot reach the WiseCare server. Check the network connection and try again.' };
  }
}

export const ShaConnectionSetup: React.FC = () => {
  const [view, setView] = useState<View | null>(null);
  const [active, setActive] = useState<Env>('sandbox');
  const [urls, setUrls] = useState<Record<Env, string>>({ sandbox: '', production: '' });
  const [keys, setKeys] = useState<Record<Env, string>>({ sandbox: '', production: '' });
  const [webhook, setWebhook] = useState('');

  const [cas, setCas] = useState<Record<Env, string>>({ sandbox: '', production: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<Env | null>(null);
  const [tests, setTests] = useState<Partial<Record<Env, TestResult>>>({});

  const show = (v: View) => {
    setView(v);
    setActive(v.active);
    setUrls({ sandbox: v.environments.sandbox.baseUrl || '', production: v.environments.production.baseUrl || '' });
    setKeys({ sandbox: '', production: '' });
    setWebhook('');
  };
  useEffect(() => {
    call('get').then((d) => {
      if (d.success) show(d.data);
      else setError(d.error);
    });
  }, []);

  const save = async (clear?: string) => {
    setSaving(true);
    setMessage('');
    setError('');
    const d = await call('save', {
      active,
      sandboxUrl: urls.sandbox,
      productionUrl: urls.production,
      sandboxKey: keys.sandbox,
      productionKey: keys.production,
      webhookSecret: webhook,
      sandboxCa: cas.sandbox,
      productionCa: cas.production,
      ...(clear ? { [`clear_${clear}`]: true } : {}),
    });
    setSaving(false);
    if (d.success) {
      show(d.data);
      setCas({ sandbox: '', production: '' });
      setMessage(clear ? 'Removed.' : d.message || 'SHA connection saved.');
    } else setError(d.error);
  };

  const test = async (env: Env) => {
    setTesting(env);
    setError('');
    const d = await call('test', { environment: env, baseUrl: urls[env], apiKey: keys[env], caPem: cas[env] });
    setTesting(null);
    if (d.success) setTests((t) => ({ ...t, [env]: d.data }));
    else setError(d.error);
  };

  if (!view) return <div className="bg-white rounded-2xl border p-6 text-sm">{error || 'Loading the SHA connection…'}</div>;

  const envCard = (env: Env) => {
    const v = view.environments[env];
    const t = tests[env];
    return (
      <div key={env} className={`rounded-xl border p-4 space-y-3 ${active === env ? 'border-blue-600 bg-blue-50/40' : 'border-gray-200'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 font-bold text-gray-900 cursor-pointer">
            <input type="radio" checked={active === env} onChange={() => setActive(env)} />
            {ENV_LABEL[env]}
          </label>
          {active === env && <span className="rounded-full bg-blue-700 px-2 py-0.5 text-[10px] font-bold text-white">IN USE</span>}
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Connector address</label>
          <input
            type="url"
            value={urls[env]}
            onChange={(e) => setUrls({ ...urls, [env]: e.target.value })}
            placeholder={
              env === 'sandbox' ? 'https://sandbox.mwavuli360.co.ke/api/vendor/v1' : 'https://connector.your-hospital.local/api/vendor/v1'
            }
            className="w-full px-3 py-2 border rounded-lg font-mono text-xs bg-white"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">API key</label>
          <input
            type="password"
            autoComplete="new-password"
            value={keys[env]}
            onChange={(e) => setKeys({ ...keys, [env]: e.target.value })}
            placeholder={
              v.keySet
                ? `Saved (${v.keyHint}). Type a new key only to replace it.`
                : 'mwv_…  (shown once in the Connector when the key is made)'
            }
            className="w-full px-3 py-2 border rounded-lg font-mono text-xs bg-white"
          />
          <p className="mt-1 text-[11px] text-gray-500 flex flex-wrap items-center gap-2">
            {v.keySet ? (
              <>
                Key saved: <b className="font-mono">{v.keyHint}</b>
                {v.keySource === 'file' && ' (from the server file)'}
              </>
            ) : (
              'No key saved.'
            )}
            {v.keySource === 'setup' && (
              <button type="button" onClick={() => save(`${env}_key`)} className="text-red-700 underline cursor-pointer">
                Remove
              </button>
            )}
          </p>
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">
            Connector certificate{' '}
            <span className="font-normal text-gray-500">(only if the hospital's Connector uses its own: mwavuli-connector-ca.crt)</span>
          </label>
          <input
            type="file"
            accept=".crt,.pem,.cer"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              setCas({ ...cas, [env]: f ? await f.text() : '' });
            }}
            className="w-full text-xs"
          />

          <textarea
            value={cas[env] && !cas[env].includes('\u0000') ? cas[env] : ''}
            onChange={(e) => setCas({ ...cas, [env]: e.target.value })}
            rows={3}
            placeholder={'…or paste its text here:\n-----BEGIN CERTIFICATE-----\n…\n-----END CERTIFICATE-----'}
            className="mt-1 w-full px-3 py-2 border rounded-lg font-mono text-[10px] bg-white"
          />
          {cas[env] && !/-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----/.test(cas[env]) && (
            <p className="text-[11px] text-red-700">
              This is not a certificate: copy everything from -----BEGIN CERTIFICATE----- to -----END CERTIFICATE-----.
            </p>
          )}
          <p className="mt-1 text-[11px] text-gray-500 flex flex-wrap items-center gap-2">
            {cas[env] ? (
              'Certificate chosen: press Save (or Test connection to try it first).'
            ) : v.certificate ? (
              <>
                Certificate saved: <b>{v.certificate.subject}</b>
                {v.certificate.expires ? `, valid until ${v.certificate.expires}` : ''}
              </>
            ) : (
              'None: the Connector must use a public certificate.'
            )}
            {v.certificate && !cas[env] && (
              <button type="button" onClick={() => save(`${env}_ca`)} className="text-red-700 underline cursor-pointer">
                Remove
              </button>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => test(env)}
          disabled={testing !== null}
          className="px-4 py-2 border rounded-lg font-bold flex items-center gap-2 bg-white cursor-pointer disabled:opacity-60"
        >
          {testing === env ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />} Test connection
        </button>
        {t && (
          <div
            className={`rounded-lg border p-3 space-y-1 ${t.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-300 bg-amber-50 text-amber-900'}`}
          >
            <p className="font-semibold flex items-center gap-1.5">
              {t.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {t.message}
            </p>
            {t.facility?.name && (
              <p>
                This key sends requests as <b>{t.facility.name}</b> (KMHFL {t.facility.code}
                {t.facility.level ? `, ${t.facility.level}` : ''}
                {t.facility.county ? `, ${t.facility.county}` : ''}).
                {env === 'sandbox' && " On the test system this is Mwavuli's test facility."}
              </p>
            )}
            {t.vendorName && (
              <p>
                WiseCare is registered in this Connector as <b>{t.vendorName}</b>.
              </p>
            )}
            {env === 'production' && t.matchesHospital === false && (
              <p className="font-semibold text-red-800">
                This key belongs to facility {t.facility?.code}, but this hospital's KMHFL code is {t.hospitalMfl}. Claims would go out
                under the wrong hospital: use the key from this hospital's own Connector.
              </p>
            )}
            {env === 'production' && t.matchesHospital === null && t.facility && (
              <p>Enter this hospital's KMHFL code in Hospital settings so WiseCare can check the key belongs to it.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5 text-xs">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-base font-bold">SHA connection (Mwavuli)</h2>
          <p className="text-gray-500">
            WiseCare sends SHA claims through the hospital's own Mwavuli Connector. SHA knows the hospital by the facility the Connector's
            key belongs to, so each hospital enters its own address and key here.
          </p>
        </div>
        <ShieldCheck className="w-7 h-7 text-blue-700" />
      </div>
      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {message}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">{(['sandbox', 'production'] as Env[]).map(envCard)}</div>

      <div className="rounded-xl border border-gray-200 p-4 space-y-2">
        <label className="block font-bold text-gray-700">Webhook secret (optional)</label>
        <input
          type="password"
          autoComplete="new-password"
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
          placeholder={
            view.webhookSecretSet
              ? 'Saved. Type a new secret only to replace it.'
              : 'whsec_…  (from the Mwavuli portal, if Mwavuli pushes updates to WiseCare)'
          }
          className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
        />
        <p className="text-[11px] text-gray-500">Without it WiseCare still collects SHA's updates every two minutes.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
        <div className="font-bold text-blue-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> Where these come from
        </div>
        <ol className="list-decimal pl-4 text-blue-800 space-y-0.5">
          <li>Mwavuli installs the hospital's Connector, registered to the hospital's KMHFL code.</li>
          <li>
            In the Connector, the hospital's administrator registers WiseCare (the name typed there is what Mwavuli shows as the software)
            and makes a key. The key is shown only once: copy it straight here.
          </li>
          <li>
            Press <b>Test connection</b>: WiseCare shows the facility the key belongs to. It must be this hospital.
          </li>
          <li>
            Choose <b>Live</b> and save. Keys are stored encrypted on the WiseCare server and never shown again.
          </li>
        </ol>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => save()}
          disabled={saving}
          className="px-6 py-2 bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save SHA connection
        </button>
      </div>
    </div>
  );
};
