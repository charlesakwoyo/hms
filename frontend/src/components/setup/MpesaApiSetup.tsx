import React, { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Save, Smartphone, TestTube, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const MpesaApiSetup: React.FC = () => {
  const [form, setForm] = useState({
    environment: 'sandbox',
    consumerKey: '',
    consumerSecret: '',
    shortCode: '174379',
    passkey: '',
    transactionType: 'CustomerPayBillOnline',
    callbackUrl: '',
    accountReference: 'WISECARE',
    transactionDesc: 'Hospital payment',
    enabled: true,
  });
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  useEffect(() => {
    (async () => {
      const r = await apiClient.getMpesaConfig();
      if (r?.data) {
        setForm((f) => ({
          ...f,
          environment: r.data.environment || 'sandbox',
          consumerKey: r.data.consumer_key || '',
          consumerSecret: r.data.has_consumer_secret ? '********' : '',
          shortCode: r.data.short_code || (r.data.environment === 'sandbox' ? '174379' : ''),
          passkey: r.data.has_passkey ? '********' : '',
          transactionType: r.data.transaction_type || 'CustomerPayBillOnline',
          callbackUrl: r.data.callback_url || '',
          accountReference: r.data.account_reference || 'WISECARE',
          transactionDesc: r.data.transaction_desc || 'Hospital payment',
          enabled: !!r.data.enabled,
        }));
      }
      setLoaded(true);
    })();
  }, []);
  const save = async () => {
    setMessage('');
    setError('');
    const payload = {
      ...form,
      consumerSecret: form.consumerSecret === '********' ? '' : form.consumerSecret,
      passkey: form.passkey === '********' ? '' : form.passkey,
    };
    const r = await apiClient.saveMpesaConfig(payload);
    if (r.success) {
      setMessage(r.message || 'M-PESA API details saved.');
      const fresh = await apiClient.getMpesaConfig();
      if (fresh?.data)
        setForm((f) => ({
          ...f,
          environment: fresh.data.environment || 'sandbox',
          consumerKey: fresh.data.consumer_key || '',
          consumerSecret: fresh.data.has_consumer_secret ? '********' : '',
          shortCode: fresh.data.short_code || (fresh.data.environment === 'sandbox' ? '174379' : ''),
          passkey: fresh.data.has_passkey ? '********' : '',
          transactionType: fresh.data.transaction_type || 'CustomerPayBillOnline',
          callbackUrl: fresh.data.callback_url || '',
          accountReference: fresh.data.account_reference || 'WISECARE',
          transactionDesc: fresh.data.transaction_desc || 'Hospital payment',
          enabled: !!fresh.data.enabled,
        }));
    } else setError(r.error || 'Could not save settings.');
  };
  const test = async () => {
    setTesting(true);
    setMessage('');
    setError('');
    const r = await apiClient.testMpesaConfig();
    setTesting(false);
    if (r.success) setMessage(r.message || 'Connection successful.');
    else setError(r.error || 'Connection test failed.');
  };
  const field = (label: keyof typeof form, type = 'text') => (
    <div>
      <label className="block font-bold text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={String(form[label] ?? '')}
        onChange={(e) => setForm({ ...form, [label]: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
      />
    </div>
  );
  if (!loaded) return <div className="bg-white rounded-2xl border p-6 text-sm">Loading M-PESA settings…</div>;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6 text-xs">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-base font-bold">M-PESA / Daraja API Setup</h2>
          <p className="text-gray-500">
            The keys Safaricom gave the hospital for M-PESA payment prompts. They are kept on the WiseCare server and never shown again
            after saving.
          </p>
        </div>
        <Smartphone className="w-7 h-7 text-emerald-600" />
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
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Environment</label>
          <select
            value={form.environment}
            onChange={(e) => {
              const environment = e.target.value;
              setForm((f) => ({ ...f, environment, shortCode: environment === 'sandbox' ? f.shortCode || '174379' : f.shortCode }));
            }}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
        </div>
        {field('consumerKey')} {field('consumerSecret', 'password')} {field('shortCode')} {field('passkey', 'password')}
        <div>
          <label className="block font-bold text-gray-700 mb-1">Transaction Type</label>
          <select
            value={form.transactionType}
            onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="CustomerPayBillOnline">CustomerPayBillOnline</option>
            <option value="CustomerBuyGoodsOnline">CustomerBuyGoodsOnline</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block font-bold text-gray-700 mb-1">M-PESA Callback URL</label>
          <input
            type="url"
            value={String(form.callbackUrl ?? '')}
            onChange={(e) => setForm({ ...form, callbackUrl: e.target.value })}
            placeholder="https://your-public-domain.example/wisecare/api/mpesa.php?action=callback"
            className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            WiseCare's public HTTPS address followed by <b>/api/mpesa.php?action=callback</b>. Optional while testing on this computer:
            WiseCare then asks Safaricom for each result instead.
          </p>
        </div>{' '}
        {field('accountReference')} {field('transactionDesc')}
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="font-bold text-slate-900">Saved API configuration</div>
        <div className="grid md:grid-cols-3 gap-3 mt-3 text-xs">
          <div>
            <span className="text-gray-500">Consumer Key</span>
            <div className="font-mono font-semibold">{form.consumerKey || 'Not configured'}</div>
          </div>
          <div>
            <span className="text-gray-500">Consumer Secret</span>
            <div className="font-mono font-semibold">{form.consumerSecret === '********' ? '********' : 'Not configured'}</div>
          </div>
          <div>
            <span className="text-gray-500">Passkey</span>
            <div className="font-mono font-semibold">{form.passkey === '********' ? '********' : 'Not configured'}</div>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="font-bold text-blue-900">Business Short Code</div>
        <p className="text-blue-800 mt-1">
          For the Safaricom Daraja Sandbox STK Push example, WiseCare uses <b>174379</b>. It is automatically filled when Sandbox is
          selected. For Production, enter the PayBill/Till shortcode registered against your production Daraja credentials.
        </p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="font-bold text-blue-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> How a payment is confirmed
        </div>
        <p className="text-blue-800 mt-1">
          The cashier sends the prompt from the bill; the patient enters their M-PESA PIN. WiseCare marks the bill paid only after Safaricom
          confirms the payment: through the callback (online), or by asking Safaricom every few seconds (works on this computer too). Each
          callback must carry WiseCare's secret token, so a forged message cannot mark a bill paid.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={test} disabled={testing} className="px-5 py-2 border rounded-xl font-bold flex items-center gap-2">
          {' '}
          <TestTube className="w-4 h-4" />
          {testing ? 'Testing…' : 'Test OAuth Connection'}
        </button>
        <button onClick={save} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save M-PESA Settings
        </button>
      </div>
    </div>
  );
};
