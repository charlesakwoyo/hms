import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  HeartPulse,
  RefreshCw,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import type { QueueItem, QueueStation, TriageCategory } from '../types';
import { apiClient, type TriageWorklistEntry } from '../services/apiClient';

interface TriageModuleProps {
  queue: QueueItem[];
  onRoute: (queueId: string, station: QueueStation) => Promise<boolean>;
}

type TriageForm = {
  presentingComplaint: string;
  systolic: string;
  diastolic: string;
  pulse: string;
  temperature: string;
  respiratoryRate: string;
  spo2: string;
  weightKg: string;
  heightCm: string;
  triageCategory: TriageCategory;
  nurseNotes: string;
};

const emptyForm = (): TriageForm => ({
  presentingComplaint: '',
  systolic: '',
  diastolic: '',
  pulse: '',
  temperature: '',
  respiratoryRate: '',
  spo2: '',
  weightKg: '',
  heightCm: '',
  triageCategory: 'Normal',
  nurseNotes: '',
});

const toForm = (entry: TriageWorklistEntry): TriageForm => ({
  presentingComplaint: entry.assessment?.presentingComplaint || '',
  systolic: entry.assessment?.systolic == null ? '' : String(entry.assessment.systolic),
  diastolic: entry.assessment?.diastolic == null ? '' : String(entry.assessment.diastolic),
  pulse: entry.assessment?.pulse == null ? '' : String(entry.assessment.pulse),
  temperature: entry.assessment?.temperature == null ? '' : String(entry.assessment.temperature),
  respiratoryRate: entry.assessment?.respiratoryRate == null ? '' : String(entry.assessment.respiratoryRate),
  spo2: entry.assessment?.spo2 == null ? '' : String(entry.assessment.spo2),
  weightKg: entry.assessment?.weightKg == null ? '' : String(entry.assessment.weightKg),
  heightCm: entry.assessment?.heightCm == null ? '' : String(entry.assessment.heightCm),
  triageCategory: entry.assessment?.triageCategory || (entry.priority as TriageCategory) || 'Normal',
  nurseNotes: entry.assessment?.nurseNotes || '',
});

const waitMinutes = (arrivedTime: string) => {
  const parsed = new Date(arrivedTime.includes('T') ? arrivedTime : arrivedTime.replace(' ', 'T')).getTime();
  return Number.isFinite(parsed) ? Math.max(0, Math.floor((Date.now() - parsed) / 60000)) : 0;
};

const formatWait = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `+${hours}h${remainder.toString().padStart(2, '0')}m`;
};

const formatArrival = (value: string) => {
  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
};

export const TriageModule = ({ queue, onRoute }: TriageModuleProps) => {
  const [worklist, setWorklist] = useState<TriageWorklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TriageWorklistEntry | null>(null);
  const [form, setForm] = useState<TriageForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [routing, setRouting] = useState(false);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);

  const loadWorklist = useCallback(async () => {
    setLoadError('');
    setLoading(true);
    try {
      setWorklist(await apiClient.getTriageWorklist());
    } catch (error) {
      setLoadError((error as Error).message || 'The triage worklist could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorklist();
  }, [loadWorklist]);

  const consultationCount = queue.filter((item) => item.currentStation === 'Consultation').length;
  const waitingCount = worklist.filter((entry) => entry.status === 'Waiting').length;
  const overdueCount = worklist.filter((entry) => waitMinutes(entry.arrivedTime) >= 30).length;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return worklist;
    return worklist.filter((entry) =>
      [entry.patientName, entry.patientId, entry.ticketNumber, entry.assessment?.presentingComplaint]
        .some((value) => String(value || '').toLowerCase().includes(query)),
    );
  }, [search, worklist]);

  const openEntry = (entry: TriageWorklistEntry) => {
    setSelected(entry);
    setForm(toForm(entry));
    setFormError('');
    setSaved(Boolean(entry.assessment));
  };

  const updateForm = (key: keyof TriageForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const saveAssessment = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || saving) return;
    setSaving(true);
    setFormError('');
    try {
      await apiClient.saveTriageAssessment(selected.queueId, {
        presentingComplaint: form.presentingComplaint.trim(),
        ...Object.fromEntries(
          (['systolic', 'diastolic', 'pulse', 'temperature', 'respiratoryRate', 'spo2', 'weightKg', 'heightCm'] as const)
            .filter((key) => form[key] !== '')
            .map((key) => [key, Number(form[key])]),
        ),
        triageCategory: form.triageCategory,
        nurseNotes: form.nurseNotes.trim(),
      });
      setSaved(true);
      await loadWorklist();
    } catch (error) {
      setFormError((error as Error).message || 'The triage assessment could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const continueCare = async () => {
    if (!selected || !saved || routing) return;
    const unpaidCash =
      /cash|m-pesa|mpesa/i.test(selected.paymentMethod) &&
      !selected.consultationFeePaid &&
      form.triageCategory !== 'Emergency';
    const destination: QueueStation = unpaidCash ? 'Billing' : 'Consultation';
    setRouting(true);
    setFormError('');
    try {
      const success = await onRoute(selected.queueId, destination);
      if (success) {
        setSelected(null);
        await loadWorklist();
      }
    } catch (error) {
      setFormError((error as Error).message || `Could not route the patient to ${destination}.`);
    } finally {
      setRouting(false);
    }
  };

  const stats = [
    { title: 'Awaiting Triage', value: waitingCount, icon: Clock3, tone: 'border-slate-700 bg-[#17191d]', color: 'text-slate-100' },
    { title: 'In Consultation', value: consultationCount, icon: HeartPulse, tone: 'border-blue-700 bg-blue-900/80', color: 'text-blue-200' },
    { title: 'Triaged — Awaiting Routing', value: worklist.length - waitingCount, icon: CheckCircle2, tone: 'border-emerald-700 bg-emerald-900/80', color: 'text-emerald-200' },
    { title: 'Waiting >30 min', value: overdueCount, icon: AlertTriangle, tone: 'border-red-800 bg-red-900/80', color: 'text-red-200' },
  ];

  return (
    <div className="min-h-full bg-[#0b0c0e] px-4 py-6 text-slate-100 sm:px-7">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">Triage Worklist</h1>
              {overdueCount > 0 && (
                <span className="rounded-full border border-red-800 bg-red-950 px-3 py-1 text-xs font-semibold text-red-300">
                  {overdueCount} waiting &gt;30 min
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">Patients awaiting or undergoing triage assessment</p>
          </div>
          <button
            type="button"
            onClick={() => void loadWorklist()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#17191d] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ title, value, icon: Icon, tone, color }) => (
            <div key={title} className={`flex items-center gap-4 rounded-2xl border p-5 ${tone}`}>
              <div className="rounded-xl bg-black/15 p-3">
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="mt-0.5 text-sm text-slate-300">{title}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#141619]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
            <label className="relative block w-full sm:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search patient, MRN, complaint..."
                className="w-full rounded-lg border border-slate-700 bg-[#1d2024] py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-teal-600"
              />
            </label>
            <span className="text-sm text-slate-400">{filtered.length} of {worklist.length} shown</span>
          </div>

          {loadError && <p role="alert" className="m-4 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">{loadError}</p>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-800 bg-[#17191d] text-slate-300">
                <tr>
                  <th className="px-5 py-3">Queue #</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Arrival</th>
                  <th className="px-5 py-3">Wait Time</th>
                  <th className="px-5 py-3">Triage Status</th>
                  <th className="px-5 py-3">Urgency</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/90">
                {loading && worklist.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">Loading triage worklist…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      {worklist.length ? 'No patients match your search.' : 'No patients are currently waiting for triage.'}
                    </td>
                  </tr>
                ) : filtered.map((entry) => {
                  const minutes = waitMinutes(entry.arrivedTime);
                  const urgency = entry.assessment?.triageCategory || entry.priority || 'Normal';
                  const urgent = urgency === 'Emergency' || urgency === 'Urgent';
                  return (
                    <tr key={entry.queueId} className="hover:bg-white/[0.025]">
                      <td className="px-5 py-4 font-mono text-teal-300">{entry.ticketNumber}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-950 text-xs font-bold text-teal-300">
                            {entry.patientName.split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase()}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-100">{entry.patientName}</div>
                            <div className="text-xs text-slate-500">{entry.patientId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-300">{formatArrival(entry.arrivedTime)}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${minutes >= 30 ? 'border-red-800 bg-red-950/70 text-red-300' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>
                          {formatWait(minutes)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${entry.status === 'Triaged' ? 'border-emerald-800 bg-emerald-950/60 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${urgent ? 'border-amber-800 bg-amber-950/50 text-amber-200' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>
                          {urgency}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEntry(entry)}
                          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-600"
                        >
                          {entry.status === 'Triaged' ? <UserRound className="h-4 w-4" /> : <HeartPulse className="h-4 w-4" />}
                          {entry.status === 'Triaged' ? 'View / Continue' : 'Open Triage'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6">
          <section role="dialog" aria-modal="true" aria-labelledby="triage-assessment-title" className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#141619] shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-800 bg-[#141619] px-5 py-4">
              <div>
                <h2 id="triage-assessment-title" className="text-lg font-bold">Triage Assessment</h2>
                <p className="mt-1 text-sm text-slate-400">{selected.patientName} · {selected.patientId} · {selected.ticketNumber}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close triage assessment" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="grid gap-3 border-b border-slate-800 px-5 py-4 text-sm sm:grid-cols-3">
              <div><span className="text-slate-500">Age / gender</span><div className="mt-1 text-slate-100">{selected.age ?? '—'} / {selected.gender || '—'}</div></div>
              <div><span className="text-slate-500">Blood group</span><div className="mt-1 text-slate-100">{selected.bloodGroup || 'Not recorded'}</div></div>
              <div><span className="text-slate-500">Allergies</span><div className="mt-1 text-slate-100">{selected.allergies || 'Not recorded'}</div></div>
            </div>

            <form onSubmit={saveAssessment} className="space-y-5 p-5">
              <label className="block text-sm font-semibold text-slate-200">
                Presenting complaint <span className="text-red-400">*</span>
                <textarea required maxLength={2000} rows={2} value={form.presentingComplaint} onChange={(event) => updateForm('presentingComplaint', event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#1d2024] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-600" placeholder="Record the patient's stated reason for visit" />
              </label>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200"><Activity className="h-4 w-4 text-teal-400" /> Observations / vitals</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {([
                    ['systolic', 'Systolic BP', 'mmHg', 0, 400],
                    ['diastolic', 'Diastolic BP', 'mmHg', 0, 300],
                    ['pulse', 'Pulse', 'bpm', 0, 300],
                    ['temperature', 'Temperature', '°C', 25, 45],
                    ['respiratoryRate', 'Resp. rate', '/min', 0, 100],
                    ['spo2', 'SpO₂', '%', 0, 100],
                    ['weightKg', 'Weight', 'kg', 0, 500],
                    ['heightCm', 'Height', 'cm', 0, 300],
                  ] as const).map(([key, label, unit, min, max]) => (
                    <label key={key} className="text-xs font-medium text-slate-400">
                      {label} <span className="text-slate-600">({unit})</span>
                      <input type="number" step="any" min={min} max={max} value={form[key]} onChange={(event) => updateForm(key, event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-[#1d2024] px-3 py-2 text-sm text-white outline-none focus:border-teal-600" />
                    </label>
                  ))}
                </div>
              </div>

              <label className="block text-sm font-semibold text-slate-200">
                Urgency
                <select value={form.triageCategory} onChange={(event) => updateForm('triageCategory', event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#1d2024] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-600">
                  <option value="Normal">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
                <span className="mt-1 block text-xs font-normal text-slate-500">Select urgency according to your facility's triage policy.</span>
              </label>
              {form.triageCategory === 'Emergency' && (
                <p className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">
                  Emergency visits can continue to Consultation without waiting for payment. A dedicated emergency stabilization workflow
                  is not yet available in this app.
                </p>
              )}

              <label className="block text-sm font-semibold text-slate-200">
                Triage notes
                <textarea maxLength={5000} rows={3} value={form.nurseNotes} onChange={(event) => updateForm('nurseNotes', event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#1d2024] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-600" placeholder="Additional assessment notes" />
              </label>

              {formError && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{formError}</p>}
              {saved && <p className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Assessment saved.</p>}

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                <button type="button" onClick={() => setSelected(null)} className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800">Close</button>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="submit" disabled={saving} className="rounded-lg border border-teal-700 px-4 py-2.5 text-sm font-bold text-teal-200 hover:bg-teal-950 disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save Assessment'}
                  </button>
                  <button type="button" onClick={() => void continueCare()} disabled={!saved || routing} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40">
                    {routing ? 'Routing…' : form.triageCategory === 'Emergency' ? 'Send to Consultation (Emergency)' : 'Complete Triage'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
