import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  ClipboardCheck,
  FileText,
  HeartPulse,
  History,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Scissors,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';
import { apiClient, type ConsultationEncounter, type ConsultationWorklistEntry, type DiagnosisCatalogItem, type LaboratoryCatalogItem } from '../services/apiClient';

type EncounterSection =
  | 'Vitals'
  | 'History'
  | 'SOAP Notes'
  | 'Diagnoses'
  | 'Lab Results'
  | 'Admission'
  | 'Orders'
  | 'Prescriptions'
  | 'Procedures'
  | 'Timeline'
  | 'Close Encounter';

const sections: Array<{ name: EncounterSection; icon: typeof HeartPulse; available: boolean }> = [
  { name: 'Vitals', icon: HeartPulse, available: true },
  { name: 'History', icon: History, available: true },
  { name: 'SOAP Notes', icon: FileText, available: true },
  { name: 'Diagnoses', icon: Stethoscope, available: true },
  { name: 'Lab Results', icon: ClipboardList, available: true },
  { name: 'Admission', icon: UserRound, available: true },
  { name: 'Orders', icon: ClipboardList, available: true },
  { name: 'Prescriptions', icon: Pill, available: false },
  { name: 'Procedures', icon: Scissors, available: false },
  { name: 'Timeline', icon: Activity, available: false },
  { name: 'Close Encounter', icon: ClipboardCheck, available: true },
];

const waitMinutes = (arrivedTime: string) => {
  const parsed = new Date(arrivedTime.includes('T') ? arrivedTime : arrivedTime.replace(' ', 'T')).getTime();
  return Number.isFinite(parsed) ? Math.max(0, Math.floor((Date.now() - parsed) / 60000)) : 0;
};

const formatWait = (minutes: number) => minutes < 60 ? `${minutes}m` : `+${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}m`;

const displayValue = (value: string | number | null | undefined, suffix = '') =>
  value === null || value === undefined || value === '' ? 'Not recorded' : `${value}${suffix}`;

interface ConsultationModuleProps {
  onCallPatient?: (queueId: string) => void;
}

export const ConsultationModule = ({ onCallPatient }: ConsultationModuleProps) => {
  const [worklist, setWorklist] = useState<ConsultationWorklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [encounter, setEncounter] = useState<ConsultationEncounter | null>(null);
  const [activeSection, setActiveSection] = useState<EncounterSection>('SOAP Notes');
  const [loadingEncounter, setLoadingEncounter] = useState(false);
  const [diagnosisDialogOpen, setDiagnosisDialogOpen] = useState(false);
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [diagnosisType, setDiagnosisType] = useState<'Primary' | 'Secondary'>('Primary');
  const [catalog, setCatalog] = useState<DiagnosisCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<number | null>(null);
  const [diagnosisError, setDiagnosisError] = useState('');
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [notice, setNotice] = useState('');
  const [soapNotes, setSoapNotes] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
  const [savingSoapNotes, setSavingSoapNotes] = useState(false);
  const [soapNotesError, setSoapNotesError] = useState('');
  const [labSearch, setLabSearch] = useState('');
  const [labCatalog, setLabCatalog] = useState<LaboratoryCatalogItem[]>([]);
  const [labCatalogLoading, setLabCatalogLoading] = useState(false);
  const [labCatalogError, setLabCatalogError] = useState('');
  const [selectedLabTests, setSelectedLabTests] = useState<LaboratoryCatalogItem[]>([]);
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [savingLabOrders, setSavingLabOrders] = useState(false);
  const [labOrderError, setLabOrderError] = useState('');
  const [dispositionReason, setDispositionReason] = useState('');
  const [admissionUrgency, setAdmissionUrgency] = useState<'Routine' | 'Urgent' | 'Emergency'>('Routine');
  const [dischargeInstructions, setDischargeInstructions] = useState('');
  const [dispositionError, setDispositionError] = useState('');
  const [savingDisposition, setSavingDisposition] = useState(false);

  const loadWorklist = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setWorklist(await apiClient.getConsultationWorklist());
    } catch (error) {
      setLoadError((error as Error).message || 'The consultation worklist could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorklist();
  }, [loadWorklist]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return worklist;
    return worklist.filter((entry) =>
      [entry.patientName, entry.patientId, entry.ticketNumber, entry.consultationType]
        .some((value) => String(value || '').toLowerCase().includes(query)),
    );
  }, [search, worklist]);

  useEffect(() => {
    if (!diagnosisDialogOpen || diagnosisSearch.trim().length < 2) {
      setCatalog([]);
      setCatalogLoading(false);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setCatalogLoading(true);
      setDiagnosisError('');
      try {
        const rows = await apiClient.searchDiagnosisCatalog(diagnosisSearch);
        if (active) setCatalog(rows);
      } catch (error) {
        if (active) setDiagnosisError((error as Error).message || 'Diagnosis search failed.');
      } finally {
        if (active) setCatalogLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [diagnosisDialogOpen, diagnosisSearch]);

  useEffect(() => {
    if (activeSection !== 'Orders' || labSearch.trim().length < 2) {
      setLabCatalog([]);
      setLabCatalogLoading(false);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setLabCatalogLoading(true);
      setLabCatalogError('');
      try {
        const rows = await apiClient.searchLaboratoryCatalog(labSearch);
        if (active) setLabCatalog(rows);
      } catch (error) {
        if (active) setLabCatalogError((error as Error).message || 'Laboratory test search failed.');
      } finally {
        if (active) setLabCatalogLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [activeSection, labSearch]);

  const openEncounter = async (item: ConsultationWorklistEntry) => {
    setLoadingEncounter(true);
    setLoadError('');
    setNotice('');
    try {
      const data = await apiClient.getConsultationEncounter(item.queueId);
      setEncounter(data);
      setSoapNotes({
        subjective: data.consultation?.historyOfPresentIllness || data.consultation?.chiefComplaint || data.triage?.presentingComplaint || '',
        objective: data.consultation?.examinationFindings || '',
        assessment: data.consultation?.provisionalDiagnosis || '',
        plan: data.consultation?.managementPlan || '',
      });
      setClinicalIndication(data.consultation?.provisionalDiagnosis || '');
      setSelectedLabTests([]);
      setLabSearch('');
      setLabOrderError('');
      setSoapNotesError('');
      setDispositionReason('');
      setDischargeInstructions('');
      setDispositionError('');
      setActiveSection('SOAP Notes');
    } catch (error) {
      setLoadError((error as Error).message || 'The encounter could not be opened.');
    } finally {
      setLoadingEncounter(false);
    }
  };

  const addDiagnosis = async () => {
    if (!encounter || !selectedDiagnosisId || savingDiagnosis) return;
    setSavingDiagnosis(true);
    setDiagnosisError('');
    try {
      await apiClient.addConsultationDiagnosis(encounter.queue.id, { catalogId: selectedDiagnosisId, type: diagnosisType });
      setEncounter(await apiClient.getConsultationEncounter(encounter.queue.id));
      setDiagnosisDialogOpen(false);
      setDiagnosisSearch('');
      setSelectedDiagnosisId(null);
      setNotice('Diagnosis added to this encounter.');
    } catch (error) {
      setDiagnosisError((error as Error).message || 'The diagnosis could not be added.');
    } finally {
      setSavingDiagnosis(false);
    }
  };

  const saveSoapNotes = async () => {
    if (!encounter || savingSoapNotes) return;
    setSavingSoapNotes(true);
    setSoapNotesError('');
    try {
      await apiClient.saveConsultationNotes(encounter.queue.id, soapNotes);
      setEncounter(await apiClient.getConsultationEncounter(encounter.queue.id));
      setNotice('SOAP notes saved as a draft.');
    } catch (error) {
      setSoapNotesError((error as Error).message || 'SOAP notes could not be saved.');
    } finally {
      setSavingSoapNotes(false);
    }
  };

  const saveDisposition = async (outcome: 'Discharge' | 'Admission') => {
    if (!encounter || savingDisposition) return;
    setSavingDisposition(true);
    setDispositionError('');
    setNotice('');
    try {
      const result = await apiClient.saveConsultationDisposition(encounter.queue.id, outcome === 'Discharge'
        ? { outcome, instructions: dischargeInstructions.trim() }
        : { outcome, reason: dispositionReason.trim(), urgency: admissionUrgency });
      if (outcome === 'Discharge') {
        setEncounter(null);
        setNotice('Discharge recorded and visit closed. The patient has left the active queue.');
        await loadWorklist();
      } else {
        setEncounter(await apiClient.getConsultationEncounter(encounter.queue.id));
        setNotice(`Admission request recorded as ${result.status}. The visit remains open in Consultation until the admission team accepts the patient.`);
        await loadWorklist();
      }
    } catch (error) {
      setDispositionError((error as Error).message || 'The clinical disposition could not be saved.');
    } finally {
      setSavingDisposition(false);
    }
  };

  const placeLabOrders = async () => {
    if (!encounter || selectedLabTests.length === 0 || clinicalIndication.trim().length < 3 || savingLabOrders) return;
    setSavingLabOrders(true);
    setLabOrderError('');
    try {
      const result = await apiClient.orderLaboratoryTests(encounter.queue.id, {
        testIds: selectedLabTests.map((test) => test.id),
        clinicalIndication: clinicalIndication.trim(),
      });
      setLabSearch('');
      setSelectedLabTests([]);
      setClinicalIndication('');
      if (result.deferredForEmergency) {
        setEncounter(await apiClient.getConsultationEncounter(encounter.queue.id));
        setNotice(`${result.orders.length} laboratory order${result.orders.length === 1 ? '' : 's'} saved. The emergency patient remains in Consultation for immediate care; do not delay care for laboratory processing.`);
      } else {
        setEncounter(null);
        setNotice(`${result.orders.length} laboratory order${result.orders.length === 1 ? '' : 's'} placed. Patient routed to the Laboratory queue.`);
        await loadWorklist();
      }
    } catch (error) {
      setLabOrderError((error as Error).message || 'Laboratory orders could not be placed.');
    } finally {
      setSavingLabOrders(false);
    }
  };

  const emergency = encounter?.queue.priority === 'Emergency';
  const unresolvedLabOrders = encounter?.labOrders.filter((order) => !['Verified', 'Cancelled', 'Canceled'].includes(order.status || '')) || [];

  if (encounter) {
    const activeSectionMeta = sections.find((section) => section.name === activeSection);
    return (
      <div className="min-h-full bg-[#0b0c0e] p-3 text-slate-100 sm:p-5">
        <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-[1600px] overflow-hidden rounded-xl border border-slate-800 bg-[#222426]">
          <aside className="hidden w-56 shrink-0 border-r border-slate-800 bg-[#151719] p-3 md:block">
            <button type="button" onClick={() => setEncounter(null)} className="mb-5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Consultation Worklist
            </button>
            <nav className="space-y-1">
              {sections.map(({ name, icon: Icon, available }) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => {
                    if (available) {
                      setActiveSection(name);
                      setNotice('');
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm ${
                    activeSection === name ? 'bg-teal-800 text-white' : available ? 'text-slate-300 hover:bg-slate-800' : 'cursor-not-allowed text-slate-600'
                  }`}
                  title={available ? name : `${name} section is not implemented yet`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{name}</span>
                  {!available && <span className="ml-auto text-[9px] uppercase tracking-wide">Later</span>}
                </button>
              ))}
            </nav>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <header className="flex flex-wrap items-center justify-between gap-4 bg-teal-900 px-5 py-5 sm:px-7">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold">
                  {encounter.patient.name.split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold">{encounter.patient.name} — {encounter.patient.id}</h1>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded bg-black/20 px-2 py-1">{encounter.patient.allergies ? `Allergies: ${encounter.patient.allergies}` : 'Allergies: None on file'}</span>
                    <span className="rounded bg-black/20 px-2 py-1">{encounter.patient.bloodGroup ? `Blood group: ${encounter.patient.bloodGroup}` : 'Blood group: None recorded'}</span>
                    {emergency && <span className="rounded bg-red-700 px-2 py-1 font-bold text-white">EMERGENCY — do not delay care for payment</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded border border-white/20 px-2.5 py-1">{encounter.queue.ticketNumber}</span>
                <span className="rounded border border-white/20 px-2.5 py-1">{encounter.queue.consultationType || 'Consultation'}</span>
                <span className="rounded border border-white/20 px-2.5 py-1">Triage complete</span>
              </div>
            </header>

            <div className="border-b border-slate-800 bg-[#17191b] px-4 py-2 md:hidden">
              <label className="text-xs text-slate-400">Encounter section</label>
              <select value={activeSection} onChange={(event) => setActiveSection(event.target.value as EncounterSection)} className="mt-1 w-full rounded border border-slate-700 bg-[#222426] p-2 text-sm text-white">
                {sections.filter((section) => section.available).map((section) => <option key={section.name}>{section.name}</option>)}
              </select>
            </div>

            <main className="flex-1 p-4 sm:p-7">
              {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-200">{notice}</p>}
              {activeSection === 'Diagnoses' ? (
                <section className="overflow-hidden rounded-2xl border border-black/20 bg-[#171819] shadow-xl">
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/20 px-5 py-4 sm:px-7">
                    <div>
                      <h2 className="text-lg font-bold">Diagnosis List</h2>
                      <p className="mt-1 text-xs text-slate-400">Encounter diagnoses are saved against this visit.</p>
                    </div>
                    <button type="button" onClick={() => { setDiagnosisDialogOpen(true); setDiagnosisError(''); }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400">
                      <Plus className="h-4 w-4" /> Add Diagnosis
                    </button>
                  </header>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead className="bg-[#202123] text-xs font-semibold text-slate-400">
                        <tr>
                          <th className="px-5 py-3">ICD-11 Code</th>
                          <th className="px-5 py-3">Description</th>
                          <th className="px-5 py-3">Type</th>
                          <th className="px-5 py-3">Recorded</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {encounter.diagnoses.length ? encounter.diagnoses.map((diagnosis) => (
                          <tr key={diagnosis.id}>
                            <td className="px-5 py-4 font-mono text-teal-300">{diagnosis.code || '—'}</td>
                            <td className="px-5 py-4 text-slate-200">{diagnosis.title || '—'}</td>
                            <td className="px-5 py-4 text-slate-300">{diagnosis.type}</td>
                            <td className="px-5 py-4 text-slate-500">This encounter</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} className="px-5 py-14 text-center text-slate-400">No diagnoses recorded yet. Use “Add Diagnosis” to add one.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : activeSection === 'Orders' ? (
                <section className="space-y-5">
                  <header>
                    <h2 className="text-lg font-bold">Laboratory Orders</h2>
                    <p className="mt-1 text-sm text-slate-400">Select configured tests and provide a clinical indication. Placing these orders routes the patient to the Laboratory queue.</p>
                  </header>
                  {encounter.labOrders.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-[#171819] p-4">
                      <h3 className="text-sm font-semibold">Existing orders for this visit</h3>
                      <ul className="mt-2 space-y-2 text-sm text-slate-300">
                        {encounter.labOrders.map((order) => <li key={order.id}>{order.testName || order.code || 'Laboratory test'} <span className="text-slate-500">· {order.status || 'Pending'}</span></li>)}
                      </ul>
                    </div>
                  )}
                  <label className="block text-sm font-semibold text-slate-300">
                    Search configured laboratory tests
                    <span className="relative mt-1.5 block">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input value={labSearch} onChange={(event) => setLabSearch(event.target.value)} placeholder="Search by test name or code" className="w-full rounded-lg border border-slate-700 bg-[#17191b] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-600" />
                    </span>
                  </label>
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-[#171819]">
                    {labCatalogLoading ? <p className="p-4 text-sm text-slate-400">Searching laboratory catalogue…</p>
                      : labSearch.trim().length < 2 ? <p className="p-4 text-sm text-slate-500">Enter at least 2 characters to search.</p>
                        : labCatalog.length ? labCatalog.map((test) => {
                          const selected = selectedLabTests.some((item) => item.id === test.id);
                          return (
                            <button
                              type="button"
                              key={test.id}
                              aria-label={`${selected ? 'Remove' : 'Select'} ${test.name || test.code || 'laboratory test'}`}
                              onClick={() => setSelectedLabTests((current) => selected
                                ? current.filter((item) => item.id !== test.id)
                                : [...current, test])}
                              className={`block w-full border-b border-slate-800 px-4 py-3 text-left last:border-0 ${selected ? 'bg-teal-950/70 text-white' : 'text-slate-200 hover:bg-slate-800'}`}
                            >
                              <span className="font-mono text-xs text-teal-300">{test.code || 'No code'}</span>
                              <span className="ml-3 text-sm font-medium">{test.name || 'Unnamed test'}</span>
                              <span className="ml-3 text-xs text-slate-400">{[test.department, test.specimen_type].filter(Boolean).join(' · ')}</span>
                            </button>
                          );
                        }) : <p className="p-4 text-sm text-slate-400">No matching active laboratory tests found.</p>}
                  </div>
                  {labCatalogError && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{labCatalogError}</p>}
                  {selectedLabTests.length > 0 && (
                    <div className="rounded-xl border border-teal-900 bg-teal-950/30 p-4">
                      <h3 className="text-sm font-semibold">Selected tests ({selectedLabTests.length})</h3>
                      <ul className="mt-2 space-y-1 text-sm text-slate-300">
                        {selectedLabTests.map((test) => <li key={test.id}>{test.name || test.code}</li>)}
                      </ul>
                    </div>
                  )}
                  <label className="block text-sm font-semibold text-slate-300">
                    Clinical indication
                    <textarea value={clinicalIndication} onChange={(event) => setClinicalIndication(event.target.value)} rows={3} maxLength={2000} placeholder="Why is this test clinically indicated?" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#17191b] p-3 text-sm outline-none placeholder:text-slate-500 focus:border-teal-600" />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-2xl text-xs text-slate-400">{emergency ? 'This saves pending lab orders without moving an emergency patient out of Consultation. Immediate assessment and stabilization must not wait for laboratory processing.' : 'This creates pending lab orders and moves the visit to the Laboratory queue. Results are entered by the laboratory team; this action does not mark tests as completed.'}</p>
                    <button type="button" onClick={() => void placeLabOrders()} disabled={savingLabOrders || selectedLabTests.length === 0 || clinicalIndication.trim().length < 3} className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
                      {savingLabOrders ? 'Placing orders…' : emergency ? 'Place Orders (Keep in Consultation)' : 'Place Orders & Send to Laboratory'}
                    </button>
                  </div>
                  {labOrderError && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-200">{labOrderError}</p>}
                </section>
              ) : activeSection === 'SOAP Notes' ? (
                <section className="space-y-3">
                  <h2 className="sr-only">SOAP Notes</h2>
                  {([
                    { key: 'subjective', label: 'S — Subjective', hint: "Chief complaint in the patient's own words; history of the presenting illness, relevant history, and associated symptoms.", border: 'border-teal-900', heading: 'bg-teal-950/70', badge: 'bg-teal-700' },
                    { key: 'objective', label: 'O — Objective', hint: 'Examination findings and relevant observations. Triage vitals are available in the Vitals section.', border: 'border-blue-900', heading: 'bg-slate-900', badge: 'bg-blue-500' },
                    { key: 'assessment', label: 'A — Assessment', hint: 'Clinical impression, working diagnosis, differential diagnoses, and reasoning.', border: 'border-amber-900', heading: 'bg-amber-950/40', badge: 'bg-amber-500' },
                    { key: 'plan', label: 'P — Plan', hint: 'Management plan, investigations, treatment, referrals, follow-up, and safety-net advice.', border: 'border-purple-900', heading: 'bg-purple-950/40', badge: 'bg-purple-500' },
                  ] as const).map(({ key, label, hint, border, heading, badge }) => (
                    <label key={key} className={`block overflow-hidden rounded-xl border ${border} bg-[#2b2c2d]`}>
                      <span className={`flex items-center gap-3 px-4 py-3 text-sm font-bold text-white ${heading}`}>
                        <span className={`flex h-6 w-6 items-center justify-center rounded text-xs ${badge}`}>{label[0]}</span>
                        {label}
                      </span>
                      <textarea
                        aria-label={label}
                        value={soapNotes[key]}
                        onChange={(event) => setSoapNotes((current) => ({ ...current, [key]: event.target.value }))}
                        rows={4}
                        className="w-full resize-y bg-transparent px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600"
                        placeholder={hint}
                      />
                    </label>
                  ))}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-slate-400">Saving keeps this consultation as a draft. It does not close the encounter.</p>
                    <button type="button" onClick={() => void saveSoapNotes()} disabled={savingSoapNotes} className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
                      {savingSoapNotes ? 'Saving…' : 'Save SOAP Notes'}
                    </button>
                  </div>
                  {soapNotesError && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-200">{soapNotesError}</p>}
                </section>
              ) : activeSection === 'Vitals' ? (
                <section className="rounded-2xl border border-black/20 bg-[#171819] p-5 shadow-xl sm:p-7">
                  <h2 className="text-lg font-bold">Vitals & Triage Summary</h2>
                  {encounter.triage ? (
                    <>
                      <p className="mt-1 text-sm text-slate-400">Recorded {encounter.triage.recordedAt ? new Date(encounter.triage.recordedAt).toLocaleString() : ''} · urgency {encounter.triage.triageCategory || '—'}</p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          ['Blood pressure', `${displayValue(encounter.triage.systolic)}/${displayValue(encounter.triage.diastolic)} mmHg`],
                          ['Pulse', displayValue(encounter.triage.pulse, ' bpm')],
                          ['Temperature', displayValue(encounter.triage.temperature, ' °C')],
                          ['Respiratory rate', displayValue(encounter.triage.respiratoryRate, ' /min')],
                          ['Oxygen saturation', displayValue(encounter.triage.spo2, '%')],
                          ['Weight', displayValue(encounter.triage.weightKg, ' kg')],
                          ['Height', displayValue(encounter.triage.heightCm, ' cm')],
                          ['Presenting complaint', encounter.triage.presentingComplaint || 'Not recorded'],
                        ].map(([label, value]) => <div key={label} className="rounded-lg bg-[#232629] p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-sm font-semibold text-slate-100">{value}</div></div>)}
                      </div>
                      {encounter.triage.nurseNotes && <p className="mt-4 rounded-lg bg-[#232629] p-4 text-sm text-slate-300">{encounter.triage.nurseNotes}</p>}
                    </>
                  ) : <p className="mt-4 text-sm text-amber-300">No triage assessment is linked to this visit.</p>}
                </section>
              ) : activeSection === 'History' ? (
                <section className="rounded-2xl border border-black/20 bg-[#171819] p-5 shadow-xl sm:p-7">
                  <h2 className="text-lg font-bold">Patient History Summary</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-[#232629] p-4"><div className="text-xs text-slate-500">Date of birth</div><div className="mt-1 text-sm">{encounter.patient.dob || 'Not recorded'}</div></div>
                    <div className="rounded-lg bg-[#232629] p-4"><div className="text-xs text-slate-500">Phone</div><div className="mt-1 text-sm">{encounter.patient.phone || 'Not recorded'}</div></div>
                    <div className="rounded-lg bg-[#232629] p-4"><div className="text-xs text-slate-500">Allergies</div><div className="mt-1 text-sm">{encounter.patient.allergies || 'None on file'}</div></div>
                    <div className="rounded-lg bg-[#232629] p-4"><div className="text-xs text-slate-500">Blood group</div><div className="mt-1 text-sm">{encounter.patient.bloodGroup || 'Not recorded'}</div></div>
                  </div>
                </section>
              ) : activeSection === 'Admission' ? (
                <section className="space-y-5">
                  <header>
                    <h2 className="text-lg font-bold">Request Admission</h2>
                    <p className="mt-1 text-sm text-slate-400">Record the clinical reason and urgency. This creates a request; it does not assign a ward or bed.</p>
                  </header>
                  {encounter.disposition && (
                    <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-4">
                      <h3 className="font-semibold text-amber-200">Existing disposition: {encounter.disposition.status}</h3>
                      <p className="mt-1 text-sm text-slate-300">{encounter.disposition.reason || encounter.disposition.instructions}</p>
                      <p className="mt-2 text-xs text-slate-500">Recorded by {encounter.disposition.decidedBy || '—'} · {new Date(encounter.disposition.decidedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {!encounter.disposition && (
                    <div className="max-w-3xl space-y-4 rounded-2xl border border-slate-800 bg-[#171819] p-5 sm:p-7">
                      <label className="block text-sm font-semibold text-slate-300">Admission urgency
                        <select value={admissionUrgency} onChange={(event) => setAdmissionUrgency(event.target.value as typeof admissionUrgency)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#222426] px-3 py-2.5 text-sm text-white">
                          <option value="Routine">Routine</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Emergency">Emergency</option>
                        </select>
                      </label>
                      <label className="block text-sm font-semibold text-slate-300">Clinical reason for admission
                        <textarea value={dispositionReason} onChange={(event) => setDispositionReason(event.target.value)} rows={4} maxLength={2000} placeholder="Describe the clinical reason admission is needed" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#222426] p-3 text-sm text-white outline-none focus:border-teal-600" />
                      </label>
                      <p className="text-xs text-amber-200">The request will remain pending. The patient stays in the Consultation queue until an admission workflow accepts the request and arranges a bed.</p>
                      {dispositionError && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{dispositionError}</p>}
                      <div className="flex justify-end">
                        <button type="button" disabled={savingDisposition || dispositionReason.trim().length < 3} onClick={() => void saveDisposition('Admission')} className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-amber-950 disabled:cursor-not-allowed disabled:opacity-50">
                          {savingDisposition ? 'Saving…' : 'Request Admission'}
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              ) : activeSection === 'Close Encounter' ? (
                <section className="space-y-5">
                  <header>
                    <h2 className="text-lg font-bold">Discharge & Close Visit</h2>
                    <p className="mt-1 text-sm text-slate-400">Use this only when the clinician has decided the patient can leave. Save the SOAP plan and resolve outstanding laboratory orders first.</p>
                  </header>
                  {encounter.disposition ? (
                    <div className="rounded-xl border border-slate-700 bg-[#171819] p-5">
                      <h3 className="font-semibold">{encounter.disposition.outcome === 'Discharge' ? 'Discharged' : encounter.disposition.status}</h3>
                      <p className="mt-1 text-sm text-slate-300">{encounter.disposition.instructions || encounter.disposition.reason}</p>
                    </div>
                  ) : (
                    <div className="max-w-3xl space-y-4 rounded-2xl border border-slate-800 bg-[#171819] p-5 sm:p-7">
                      <div className="rounded-lg border border-slate-700 bg-[#222426] p-3 text-sm text-slate-300">
                        <span className="font-semibold">Saved plan:</span> {encounter.consultation?.managementPlan || 'No plan saved yet. Save a plan in SOAP Notes before discharge.'}
                      </div>
                      {unresolvedLabOrders.length > 0 && (
                        <p className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">
                          Discharge is blocked while {unresolvedLabOrders.length} laboratory order{unresolvedLabOrders.length === 1 ? '' : 's'} remain unresolved.
                        </p>
                      )}
                      <label className="block text-sm font-semibold text-slate-300">Discharge instructions and follow-up
                        <textarea value={dischargeInstructions} onChange={(event) => setDischargeInstructions(event.target.value)} rows={4} maxLength={5000} placeholder="Record advice, follow-up, and return precautions" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#222426] p-3 text-sm text-white outline-none focus:border-teal-600" />
                      </label>
                      {dispositionError && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{dispositionError}</p>}
                      <div className="flex justify-end">
                        <button type="button" disabled={savingDisposition || !encounter.consultation?.managementPlan?.trim() || unresolvedLabOrders.length > 0 || dischargeInstructions.trim().length < 3} onClick={() => void saveDisposition('Discharge')} className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 disabled:cursor-not-allowed disabled:opacity-50">
                          {savingDisposition ? 'Saving…' : 'Confirm Discharge & Close Visit'}
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              ) : activeSection === 'Lab Results' ? (
                <section className="rounded-2xl border border-black/20 bg-[#171819] p-5 shadow-xl sm:p-7">
                 <h2 className="text-lg font-bold">Verified Laboratory Results</h2>
                 <p className="mt-1 text-sm text-slate-400">Only results verified by authorized laboratory staff are shown here.</p>
                 <div className="mt-5 space-y-3">
                   {encounter.labOrders.filter((order) => order.status === 'Verified').length ? encounter.labOrders.filter((order) => order.status === 'Verified').map((order) => (
                     <article key={order.id} className="rounded-xl border border-emerald-900 bg-[#202426] p-4">
                       <div className="flex flex-wrap items-start justify-between gap-3">
                         <div>
                           <h3 className="font-semibold">{order.testName || 'Laboratory test'}{order.code ? ` (${order.code})` : ''}</h3>
                           <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{order.resultValue || 'No result value recorded'}</p>
                           {order.referenceRange && <p className="mt-1 text-xs text-slate-400">Reference range: {order.referenceRange}</p>}
                           {order.resultNotes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">{order.resultNotes}</p>}
                         </div>
                         <span className="rounded-full border border-emerald-800 bg-emerald-950 px-2.5 py-1 text-xs text-emerald-200">Verified</span>
                       </div>
                       <p className="mt-3 text-xs text-slate-500">Verified by {order.verifiedBy || '—'}{order.verifiedAt ? ` · ${new Date(order.verifiedAt).toLocaleString()}` : ''}</p>
                     </article>
                   )) : <p className="rounded-lg bg-[#232629] p-4 text-sm text-slate-400">No verified laboratory results are available for this visit yet.</p>}
                 </div>
                </section>
              ) : (
                <section className="rounded-2xl border border-dashed border-slate-700 bg-[#171819] p-10 text-center">
                  <AlertTriangle className="mx-auto h-9 w-9 text-amber-400" />
                  <h2 className="mt-3 text-lg font-bold">{activeSectionMeta?.name}</h2>
                  <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">This encounter section is not available yet. No clinical orders or treatment have been recorded from this screen.</p>
                </section>
              )}
            </main>
          </section>
        </div>

        {diagnosisDialogOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
            <section role="dialog" aria-modal="true" aria-labelledby="add-diagnosis-title" className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#17191b] p-5 shadow-2xl">
              <header className="flex items-start justify-between gap-4">
                <div><h2 id="add-diagnosis-title" className="text-lg font-bold">Add Diagnosis</h2><p className="mt-1 text-xs text-slate-400">Choose a diagnosis from the facility ICD-11 catalogue.</p></div>
                <button type="button" aria-label="Close diagnosis dialog" onClick={() => setDiagnosisDialogOpen(false)} className="rounded p-1 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
              </header>
              <label className="mt-5 block text-sm font-semibold text-slate-300">
                Search diagnosis
                <span className="relative mt-1.5 block">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input value={diagnosisSearch} onChange={(event) => { setDiagnosisSearch(event.target.value); setSelectedDiagnosisId(null); }} placeholder="Search by code or description" className="w-full rounded-lg border border-slate-700 bg-[#222426] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-600" />
                </span>
              </label>
              <label className="mt-4 block text-sm font-semibold text-slate-300">
                Diagnosis type
                <select value={diagnosisType} onChange={(event) => setDiagnosisType(event.target.value as 'Primary' | 'Secondary')} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#222426] px-3 py-2.5 text-sm">
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                </select>
              </label>
              <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-slate-800">
                {catalogLoading ? <p className="p-4 text-sm text-slate-400">Searching catalogue…</p>
                  : diagnosisSearch.trim().length < 2 ? <p className="p-4 text-sm text-slate-500">Enter at least 2 characters to search.</p>
                    : catalog.length ? catalog.map((item) => (
                      <button type="button" key={item.id} onClick={() => setSelectedDiagnosisId(item.id)} className={`block w-full border-b border-slate-800 px-4 py-3 text-left last:border-0 ${selectedDiagnosisId === item.id ? 'bg-teal-950 text-white' : 'text-slate-200 hover:bg-slate-800'}`}>
                        <span className="font-mono text-xs text-teal-300">{item.code || 'No code'}</span><span className="ml-3 text-sm">{item.title}</span>
                      </button>
                    )) : <p className="p-4 text-sm text-slate-400">No matching diagnoses found in the catalogue.</p>}
              </div>
              {diagnosisError && <p role="alert" className="mt-3 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{diagnosisError}</p>}
              <footer className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setDiagnosisDialogOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button>
                <button type="button" disabled={!selectedDiagnosisId || savingDiagnosis} onClick={() => void addDiagnosis()} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-emerald-950 disabled:opacity-40">{savingDiagnosis ? 'Adding…' : 'Add Diagnosis'}</button>
              </footer>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#0b0c0e] px-4 py-6 text-slate-100 sm:px-7">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-xl font-bold">Consultation Worklist</h1><p className="mt-1 text-sm text-slate-400">Patients waiting for a clinician encounter</p></div>
          <button type="button" onClick={() => void loadWorklist()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#17191d] px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
        </header>

        {notice && <p role="status" className="rounded-lg border border-emerald-800 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-[#17191d] p-4"><div className="text-2xl font-bold">{worklist.length}</div><div className="text-sm text-slate-400">Waiting for consultation</div></div>
          <div className="rounded-xl border border-red-900 bg-red-950/60 p-4"><div className="text-2xl font-bold text-red-200">{worklist.filter((item) => item.priority === 'Emergency').length}</div><div className="text-sm text-red-200/80">Emergency priority</div></div>
          <div className="rounded-xl border border-amber-900 bg-amber-950/40 p-4"><div className="text-2xl font-bold text-amber-200">{worklist.filter((item) => waitMinutes(item.arrivedTime) >= 30).length}</div><div className="text-sm text-amber-200/80">Waiting over 30 minutes</div></div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#141619]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
            <label className="relative block w-full sm:max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient, MRN, consultation..." className="w-full rounded-lg border border-slate-700 bg-[#1d2024] py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-slate-500 focus:border-teal-600" /></label>
            <span className="text-sm text-slate-400">{filtered.length} of {worklist.length} shown</span>
          </div>
          {loadError && <p role="alert" className="m-4 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">{loadError}</p>}
          {loadingEncounter && <p role="status" className="m-4 text-sm text-slate-400">Opening encounter…</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-800 bg-[#17191d] text-xs font-semibold text-slate-300"><tr><th className="px-5 py-3">Ticket</th><th className="px-5 py-3">Patient</th><th className="px-5 py-3">Consultation</th><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Wait</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {loading && worklist.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Loading consultation worklist…</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">{worklist.length ? 'No patients match your search.' : 'No patients are currently waiting for consultation.'}</td></tr>
                    : filtered.map((item) => (
                      <tr key={item.queueId} className="hover:bg-white/[0.025]">
                        <td className="px-5 py-4 font-mono text-teal-300">{item.ticketNumber}</td>
                        <td className="px-5 py-4"><div className="font-semibold">{item.patientName}</div><div className="text-xs text-slate-500">{item.patientId}</div></td>
                        <td className="px-5 py-4 text-slate-300">
                          <div>{item.consultationType || 'Consultation'}</div>
                          {item.dispositionStatus && <div className="mt-1 text-xs text-amber-300">{item.dispositionStatus}</div>}
                        </td>
                        <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs ${item.priority === 'Emergency' ? 'border-red-800 bg-red-950 text-red-200' : item.priority === 'Urgent' ? 'border-amber-800 bg-amber-950 text-amber-200' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>{item.priority}</span></td>
                        <td className="px-5 py-4 text-slate-300">{formatWait(waitMinutes(item.arrivedTime))}</td>
                        <td className="px-5 py-4 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => onCallPatient?.(item.queueId)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold hover:bg-slate-800">Call</button><button type="button" onClick={() => void openEncounter(item)} disabled={loadingEncounter} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold hover:bg-teal-600 disabled:opacity-50"><Stethoscope className="h-4 w-4" />Open Encounter</button></div></td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
