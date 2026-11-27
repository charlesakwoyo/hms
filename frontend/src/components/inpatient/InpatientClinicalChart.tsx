import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  apiClient,
  type InpatientAdmissionClinicalNote,
  type InpatientAdmissionSummary,
  type InpatientClinicalChart as ClinicalChartData,
} from '../../services/apiClient';
import type { IpdView } from './ipdViews';

type ClinicalView = Extract<IpdView, 'admission_notes' | 'doctor_notes' | 'ward_rounds' | 'vitals'>;
type AdmissionNoteForm = Omit<InpatientAdmissionClinicalNote, 'id' | 'clinicianName' | 'signedAt' | 'status'>;
type DoctorNoteForm = { icdCode: string; diagnosis: string; subjective: string; objective: string; assessment: string; plan: string };
type RoundForm = { subjective: string; objective: string; assessment: 'Critical' | 'Guarded' | 'Stable' | 'Improving'; plan: string };
type VitalsForm = Record<'systolic' | 'diastolic' | 'pulse' | 'temperature' | 'respiratoryRate' | 'spo2' | 'fbs' | 'rbs' | 'remarks', string>;

const emptyAdmissionNote: AdmissionNoteForm = {
  chiefComplaint: '',
  historyPresentIllness: '',
  pastHistory: '',
  examination: '',
  preMedications: '',
  tobaccoUse: null,
  alcoholUse: null,
  substanceNotes: '',
  primaryDiagnosis: '',
  differentialDiagnoses: '',
  orders: '',
  managementPlan: '',
  designation: '',
};
const emptyDoctorNote: DoctorNoteForm = { icdCode: '', diagnosis: '', subjective: '', objective: '', assessment: '', plan: '' };
const emptyRound: RoundForm = { subjective: '', objective: '', assessment: 'Stable', plan: '' };
const emptyVitals: VitalsForm = {
  systolic: '', diastolic: '', pulse: '', temperature: '', respiratoryRate: '', spo2: '', fbs: '', rbs: '', remarks: '',
};

const titles: Record<ClinicalView, string> = {
  admission_notes: 'Admission Clinical Notes',
  doctor_notes: 'Doctor Progress Notes',
  ward_rounds: 'Ward Rounds',
  vitals: 'Inpatient Vitals',
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Time not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const TextArea = ({ label, value, onChange, required = false, rows = 3, maxLength }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  maxLength?: number;
}) => (
  <label className="block text-sm font-medium text-slate-700">
    {label}{required && <span className="text-red-600"> *</span>}
    <textarea required={required} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} rows={rows}
      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50" />
  </label>
);

const NoteCard = ({ title, subtitle, entries }: {
  title: string;
  subtitle: string;
  entries: Array<{ label: string; value: string | null | undefined }>;
}) => (
  <article className="rounded-lg border border-slate-200 p-4">
    <div className="flex flex-wrap justify-between gap-2">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <span className="text-xs text-slate-500">{subtitle}</span>
    </div>
    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
      {entries.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{value || 'Not recorded'}</dd>
        </div>
      ))}
    </dl>
  </article>
);

export const InpatientClinicalChart = ({ view }: { view: ClinicalView }) => {
  const [admissions, setAdmissions] = useState<InpatientAdmissionSummary[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [chart, setChart] = useState<ClinicalChartData | null>(null);
  const [admissionNote, setAdmissionNote] = useState<AdmissionNoteForm>(emptyAdmissionNote);
  const [doctorNote, setDoctorNote] = useState<DoctorNoteForm>(emptyDoctorNote);
  const [round, setRound] = useState<RoundForm>(emptyRound);
  const [vitals, setVitals] = useState<VitalsForm>(emptyVitals);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedAdmission = useMemo(
    () => admissions.find((admission) => admission.id === selectedId) || null,
    [admissions, selectedId],
  );

  const loadChart = useCallback(async (admissionId: string) => {
    if (!admissionId) {
      setChart(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.getInpatientClinicalChart(admissionId);
      setChart(result);
      setAdmissionNote(result.admissionNotes ? {
        chiefComplaint: result.admissionNotes.chiefComplaint,
        historyPresentIllness: result.admissionNotes.historyPresentIllness,
        pastHistory: result.admissionNotes.pastHistory,
        examination: result.admissionNotes.examination,
        preMedications: result.admissionNotes.preMedications,
        tobaccoUse: result.admissionNotes.tobaccoUse,
        alcoholUse: result.admissionNotes.alcoholUse,
        substanceNotes: result.admissionNotes.substanceNotes,
        primaryDiagnosis: result.admissionNotes.primaryDiagnosis,
        differentialDiagnoses: result.admissionNotes.differentialDiagnoses,
        orders: result.admissionNotes.orders,
        managementPlan: result.admissionNotes.managementPlan,
        designation: result.admissionNotes.designation || '',
      } : emptyAdmissionNote);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'The clinical chart could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAdmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await apiClient.getInpatientAdmissions();
      setAdmissions(rows);
      setSelectedId((current) => rows.some((row) => row.id === current) ? current : rows[0]?.id || '');
      if (rows.length === 0) setChart(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Active admissions could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdmissions();
  }, [loadAdmissions]);

  useEffect(() => {
    if (selectedId) void loadChart(selectedId);
  }, [loadChart, selectedId]);

  const refresh = async () => {
    if (selectedId) await loadChart(selectedId);
    else await loadAdmissions();
  };

  const save = async (action: () => Promise<unknown>, message: string) => {
    if (!selectedId || saving) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(message);
      await loadChart(selectedId);
      if (view === 'doctor_notes') setDoctorNote(emptyDoctorNote);
      if (view === 'ward_rounds') setRound(emptyRound);
      if (view === 'vitals') setVitals(emptyVitals);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The clinical entry could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const saveAdmissionNotes = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void save(() => apiClient.saveInpatientAdmissionNotes(selectedId, admissionNote), 'Admission notes saved as a draft.');
  };

  const saveDoctorNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void save(() => apiClient.saveInpatientDoctorNote(selectedId, {
      ...doctorNote,
      icdCode: doctorNote.icdCode || undefined,
    }), 'Doctor progress note recorded.');
  };

  const saveRound = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void save(() => apiClient.saveInpatientWardRound(selectedId, round), 'Ward-round entry recorded.');
  };

  const saveVitals = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(
      Object.entries(vitals).filter(([key, value]) => key === 'remarks' ? value.trim() !== '' : value !== '')
        .map(([key, value]) => [key, key === 'remarks' ? value.trim() : Number(value)]),
    );
    void save(() => apiClient.saveInpatientVitals(selectedId, data), 'Vitals recorded.');
  };

  const setAdmissionField = (field: keyof AdmissionNoteForm, value: string | null) =>
    setAdmissionNote((current) => ({ ...current, [field]: value }));

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Inpatient clinical chart</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{titles[view]}</h1>
          <p className="mt-1 text-sm text-slate-600">Document care against an active admission. Entries are time-stamped and retained in the patient chart.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="block max-w-2xl text-sm font-semibold text-slate-700">
          Active inpatient
          <select aria-label="Active inpatient" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
            <option value="">Select an admitted patient</option>
            {admissions.map((admission) => (
              <option key={admission.id} value={admission.id}>{admission.patientName} · {admission.wardName} · Bed {admission.bedNumber}</option>
            ))}
          </select>
        </label>
        {selectedAdmission && chart && (
          <div className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-950">
            <strong>{chart.admission.patientName}</strong> · {chart.admission.wardName} · Bed {chart.admission.bedNumber}
            <span className="ml-2 text-teal-800">Admitted {formatDate(chart.admission.admittedAt)} · Diagnosis: {chart.admission.diagnosis || 'Not recorded'}</span>
          </div>
        )}
      </section>

      {!loading && admissions.length === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">There are no active admissions to document.</p>
      )}
      {loading && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading clinical chart…</p>}
      {!loading && selectedId && chart && (
        <>
          {view === 'admission_notes' && (
            <div className="space-y-4">
              {chart.admissionNotes?.status === 'Signed' && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  Signed by {chart.admissionNotes.clinicianName || 'clinical staff'} on {formatDate(chart.admissionNotes.signedAt)}. This note is read-only; add changes as a doctor progress note.
                </p>
              )}
              <form onSubmit={saveAdmissionNotes} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2">
                <fieldset disabled={chart.admissionNotes?.status === 'Signed'} className="contents">
                <TextArea label="Chief complaint" required value={admissionNote.chiefComplaint} onChange={(value) => setAdmissionField('chiefComplaint', value)} />
                <TextArea label="History of present illness" required value={admissionNote.historyPresentIllness} onChange={(value) => setAdmissionField('historyPresentIllness', value)} />
                <TextArea label="Past medical and surgical history" value={admissionNote.pastHistory} onChange={(value) => setAdmissionField('pastHistory', value)} />
                <TextArea label="Clinical examination" required value={admissionNote.examination} onChange={(value) => setAdmissionField('examination', value)} />
                <TextArea label="Pre-admission medications" value={admissionNote.preMedications} onChange={(value) => setAdmissionField('preMedications', value)} />
                <TextArea label="Substance-use notes" value={admissionNote.substanceNotes} onChange={(value) => setAdmissionField('substanceNotes', value)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {(['tobaccoUse', 'alcoholUse'] as const).map((field) => (
                    <label key={field} className="text-sm font-medium text-slate-700">{field === 'tobaccoUse' ? 'Tobacco use' : 'Alcohol use'}
                      <select value={admissionNote[field] || ''} disabled={chart.admissionNotes?.status === 'Signed'}
                        onChange={(event) => setAdmissionField(field, event.target.value ? event.target.value as 'Yes' | 'No' | 'Unknown' : null)}
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                        <option value="">Not recorded</option><option>Yes</option><option>No</option><option>Unknown</option>
                      </select>
                    </label>
                  ))}
                </div>
                <TextArea label="Primary diagnosis" required maxLength={255} value={admissionNote.primaryDiagnosis} onChange={(value) => setAdmissionField('primaryDiagnosis', value)} />
                <TextArea label="Differential diagnoses" value={admissionNote.differentialDiagnoses} onChange={(value) => setAdmissionField('differentialDiagnoses', value)} />
                <TextArea label="Orders" value={admissionNote.orders} onChange={(value) => setAdmissionField('orders', value)} />
                <TextArea label="Management plan" required value={admissionNote.managementPlan} onChange={(value) => setAdmissionField('managementPlan', value)} />
                <label className="text-sm font-medium text-slate-700">Designation
                  <input value={admissionNote.designation || ''} onChange={(event) => setAdmissionField('designation', event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
                </fieldset>
                {chart.admissionNotes?.status !== 'Signed' && (
                  <div className="flex flex-wrap items-end gap-2 md:col-span-2">
                    <button disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save draft'}</button>
                    <button type="button" disabled={saving || !chart.admissionNotes}
                      onClick={() => void save(() => apiClient.signInpatientAdmissionNotes(selectedId), 'Admission notes signed.')}
                      className="rounded-lg border border-teal-700 px-4 py-2.5 text-sm font-bold text-teal-800 disabled:opacity-50">Save and sign</button>
                    {!chart.admissionNotes && <span className="text-xs text-slate-500">Save a draft before signing.</span>}
                  </div>
                )}
              </form>
            </div>
          )}

          {view === 'doctor_notes' && (
            <div className="space-y-4">
              <form onSubmit={saveDoctorNote} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Diagnosis *
                  <input required minLength={3} value={doctorNote.diagnosis} onChange={(event) => setDoctorNote({ ...doctorNote, diagnosis: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
                <label className="text-sm font-medium text-slate-700">ICD code
                  <input value={doctorNote.icdCode} onChange={(event) => setDoctorNote({ ...doctorNote, icdCode: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
                {(['subjective', 'objective', 'assessment', 'plan'] as const).map((field) => (
                  <TextArea key={field} label={field[0].toUpperCase() + field.slice(1)} required value={doctorNote[field]}
                    onChange={(value) => setDoctorNote((current) => ({ ...current, [field]: value }))} />
                ))}
                <button disabled={saving} className="w-fit rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Record progress note'}</button>
              </form>
              <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-900">Progress-note history ({chart.doctorNotes.length})</h2>
                {chart.doctorNotes.length ? chart.doctorNotes.map((note) => (
                  <NoteCard key={note.id} title={note.diagnosis || 'Progress note'} subtitle={`${note.clinician || 'Clinical staff'} · ${formatDate(note.notedAt)}`}
                    entries={[{ label: 'ICD code', value: note.icdCode }, { label: 'Subjective', value: note.subjective }, { label: 'Objective', value: note.objective }, { label: 'Assessment', value: note.assessment }, { label: 'Plan', value: note.plan }]} />
                )) : <p className="text-sm text-slate-500">No doctor progress notes recorded.</p>}
              </section>
            </div>
          )}

          {view === 'ward_rounds' && (
            <div className="space-y-4">
              <form onSubmit={saveRound} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2">
                <TextArea label="Subjective" required value={round.subjective} onChange={(value) => setRound({ ...round, subjective: value })} />
                <TextArea label="Objective" required value={round.objective} onChange={(value) => setRound({ ...round, objective: value })} />
                <label className="text-sm font-medium text-slate-700">Clinical status
                  <select value={round.assessment} onChange={(event) => setRound({ ...round, assessment: event.target.value as RoundForm['assessment'] })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                    {(['Critical', 'Guarded', 'Stable', 'Improving'] as const).map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <TextArea label="Plan" required value={round.plan} onChange={(value) => setRound({ ...round, plan: value })} />
                <button disabled={saving} className="w-fit rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Record ward round'}</button>
              </form>
              <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-900">Ward-round history ({chart.wardRounds.length})</h2>
                {chart.wardRounds.length ? chart.wardRounds.map((note) => (
                  <NoteCard key={note.id} title={note.assessment || 'Ward round'} subtitle={`${note.doctorName || 'Clinical staff'} · ${formatDate(note.timestamp)}`}
                    entries={[{ label: 'Subjective', value: note.subjective }, { label: 'Objective', value: note.objective }, { label: 'Plan', value: note.plan }]} />
                )) : <p className="text-sm text-slate-500">No ward rounds recorded.</p>}
              </section>
            </div>
          )}

          {view === 'vitals' && (
            <div className="space-y-4">
              <form onSubmit={saveVitals} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
                {([
                  ['systolic', 'Systolic BP (mmHg)', '40', '300'],
                  ['diastolic', 'Diastolic BP (mmHg)', '20', '200'],
                  ['pulse', 'Pulse (bpm)', '20', '250'],
                  ['temperature', 'Temperature (°C)', '25', '45'],
                  ['respiratoryRate', 'Respiratory rate (/min)', '4', '80'],
                  ['spo2', 'SpO₂ (%)', '40', '100'],
                  ['fbs', 'FBS (mmol/L)', '0', '80'],
                  ['rbs', 'RBS (mmol/L)', '0', '80'],
                ] as const).map(([field, label, min, max]) => (
                  <label key={field} className="text-sm font-medium text-slate-700">{label}
                    <input type="number" step={field === 'temperature' || field === 'fbs' || field === 'rbs' ? '0.1' : '1'} min={min} max={max}
                      value={vitals[field]} onChange={(event) => setVitals({ ...vitals, [field]: event.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
                  </label>
                ))}
                <div className="sm:col-span-2 lg:col-span-4">
                  <TextArea label="Remarks" value={vitals.remarks} onChange={(value) => setVitals({ ...vitals, remarks: value })} rows={2} />
                </div>
                <button disabled={saving} className="w-fit rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Record vitals'}</button>
              </form>
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <h2 className="border-b border-slate-200 p-4 font-bold text-slate-900">Vitals history ({chart.vitals.length})</h2>
                {chart.vitals.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Recorded', 'Blood pressure', 'Pulse', 'Temp', 'Resp.', 'SpO₂', 'FBS / RBS', 'Remarks'].map((label) => <th key={label} className="px-3 py-2">{label}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-100">{chart.vitals.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-3 py-3">{formatDate(entry.recordedAt)}<span className="block text-xs text-slate-500">{entry.recordedBy || ''}</span></td>
                          <td className="px-3 py-3">{entry.systolic ?? '—'}/{entry.diastolic ?? '—'}</td>
                          <td className="px-3 py-3">{entry.pulse ?? '—'}</td>
                          <td className="px-3 py-3">{entry.temperature ?? '—'}</td>
                          <td className="px-3 py-3">{entry.respiratoryRate ?? '—'}</td>
                          <td className="px-3 py-3">{entry.spo2 ?? '—'}</td>
                          <td className="px-3 py-3">{entry.fbs ?? '—'} / {entry.rbs ?? '—'}</td>
                          <td className="px-3 py-3">{entry.remarks || '—'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ) : <p className="p-5 text-sm text-slate-500">No vitals recorded for this admission.</p>}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
};
