import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BedDouble, Check, RefreshCw, ShieldAlert, X } from 'lucide-react';
import {
  apiClient,
  type InpatientAdmissionRequest,
  type InpatientAdmissionSummary,
  type InpatientBedOption,
} from '../services/apiClient';
import type { IpdView } from './inpatient/ipdViews';
import { InpatientClinicalChart } from './inpatient/InpatientClinicalChart';

interface InpatientModuleProps {
  view: IpdView;
  onWorkflowUpdated?: () => Promise<void>;
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export const InpatientModule = ({ view, onWorkflowUpdated }: InpatientModuleProps) => {
  const [requests, setRequests] = useState<InpatientAdmissionRequest[]>([]);
  const [beds, setBeds] = useState<InpatientBedOption[]>([]);
  const [admissions, setAdmissions] = useState<InpatientAdmissionSummary[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [dischargeSummaries, setDischargeSummaries] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');

  const requestView = view === 'bookings' || view === 'admission';
  const bedView = view === 'beds';
  const admissionView = view === 'admitted' || view === 'discharge';
  const selectedRequest = requests.find((request) => request.id === selectedRequestId) || requests[0] || null;
  const filteredAdmissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return admissions;
    return admissions.filter((admission) =>
      [admission.patientName, admission.patientId, admission.wardName, admission.bedNumber]
        .some((value) => String(value || '').toLowerCase().includes(query)),
    );
  }, [admissions, search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (requestView) {
        const [requestRows, bedRows] = await Promise.all([
          apiClient.getInpatientAdmissionRequests(),
          apiClient.getAvailableInpatientBeds(),
        ]);
        setRequests(requestRows);
        setBeds(bedRows);
        setSelectedRequestId((current) => requestRows.some((row) => row.id === current) ? current : requestRows[0]?.id || '');
      } else if (bedView) {
        setBeds(await apiClient.getAvailableInpatientBeds());
      } else if (admissionView) {
        setAdmissions(await apiClient.getInpatientAdmissions());
      }
    } catch (loadError) {
      setError(errorMessage(loadError, 'The inpatient data could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [admissionView, bedView, requestView]);

  const refreshAfterWorkflow = async () => {
    await loadData();
    if (!onWorkflowUpdated) return;
    try {
      await onWorkflowUpdated();
    } catch (refreshError) {
      setError(`The inpatient change was saved, but other screens could not be refreshed. ${errorMessage(refreshError, '')}`);
    }
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setError('');
    setNotice('');
    setSearch('');
    setSelectedBedId('');
    setDeclineReason('');
  }, [view]);

  const acceptRequest = async () => {
    if (!selectedRequest || !selectedBedId || savingId) return;
    setSavingId(selectedRequest.id);
    setError('');
    setNotice('');
    try {
      const result = await apiClient.acceptInpatientAdmission(selectedRequest.id, Number(selectedBedId));
      setNotice(`Admission confirmed for ${selectedRequest.patientName}; assigned to ${result.wardName}, bed ${result.bedNumber}.`);
      setSelectedBedId('');
      await refreshAfterWorkflow();
    } catch (saveError) {
      setError(errorMessage(saveError, 'The admission could not be confirmed.'));
    } finally {
      setSavingId('');
    }
  };

  const declineRequest = async () => {
    if (!selectedRequest || declineReason.trim().length < 3 || savingId) return;
    setSavingId(selectedRequest.id);
    setError('');
    setNotice('');
    try {
      await apiClient.declineInpatientAdmission(selectedRequest.id, declineReason.trim());
      setNotice(`Admission request declined for ${selectedRequest.patientName}. The patient remains in Consultation.`);
      setDeclineReason('');
      await refreshAfterWorkflow();
    } catch (saveError) {
      setError(errorMessage(saveError, 'The admission request could not be declined.'));
    } finally {
      setSavingId('');
    }
  };

  const discharge = async (admission: InpatientAdmissionSummary) => {
    const summary = String(dischargeSummaries[admission.id] || '').trim();
    if (summary.length < 3 || savingId) return;
    setSavingId(admission.id);
    setError('');
    setNotice('');
    try {
      await apiClient.dischargeInpatientAdmission(admission.id, summary);
      setNotice(`${admission.patientName} has been discharged and the visit closed.`);
      await refreshAfterWorkflow();
    } catch (saveError) {
      setError(errorMessage(saveError, 'The inpatient discharge could not be completed.'));
    } finally {
      setSavingId('');
    }
  };

  if (view === 'admission_notes' || view === 'doctor_notes' || view === 'ward_rounds' || view === 'vitals') {
    return <InpatientClinicalChart view={view} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Inpatient care</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {requestView ? 'Admission Requests' : bedView ? 'Available Ward Beds' : admissionView ? 'Admitted Patients' : 'Inpatient'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {requestView
              ? 'Review clinician requests, assign an available bed, or decline with a documented reason.'
              : bedView
                ? 'Availability is checked against active admissions when a bed is assigned.'
                : admissionView
                  ? 'Review current inpatients and record a discharge when inpatient care is complete.'
                  : 'This inpatient workflow screen is not available yet.'}
          </p>
        </div>
        {(requestView || bedView || admissionView) && (
          <button type="button" onClick={() => void loadData()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        )}
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      {requestView && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="font-bold text-slate-900">Pending requests <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">{requests.length}</span></h2>
            </div>
            {loading ? <p className="p-5 text-sm text-slate-500">Loading admission requests…</p> : requests.length === 0 ? (
              <div className="p-8 text-center">
                <Check className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-2 font-semibold text-slate-800">No pending admission requests</p>
                <p className="mt-1 text-sm text-slate-500">New requests from Consultation will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {requests.map((request) => (
                  <button type="button" key={request.id} onClick={() => { setSelectedRequestId(request.id); setSelectedBedId(''); setDeclineReason(''); }}
                    className={`w-full px-4 py-4 text-left hover:bg-slate-50 ${selectedRequest?.id === request.id ? 'bg-teal-50 ring-1 ring-inset ring-teal-200' : ''}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{request.patientName}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${request.urgency === 'Emergency' ? 'bg-red-100 text-red-800' : request.urgency === 'Urgent' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>{request.urgency}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{request.patientId} · {request.ticketNumber} · {formatDate(request.requestedAt)}</div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-700">{request.reason}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            {selectedRequest ? (
              <>
                <div>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-slate-900">{selectedRequest.patientName}</h2>
                      <p className="mt-1 text-sm text-slate-600">{selectedRequest.patientId} · {selectedRequest.age ?? 'Age not recorded'} · {selectedRequest.gender || 'Gender not recorded'}</p>
                      <p className="text-sm text-slate-600">{selectedRequest.phone || 'No phone recorded'} · Visit {selectedRequest.visitId}</p>
                    </div>
                    {selectedRequest.urgency === 'Emergency' && <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />}
                  </div>
                  <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Clinical reason</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{selectedRequest.reason}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Requested by {selectedRequest.requestedBy || 'Clinical staff'} · {formatDate(selectedRequest.requestedAt)}</p>
                </div>

                <label className="block text-sm font-semibold text-slate-700">
                  Assign an available bed
                  <select value={selectedBedId} onChange={(event) => setSelectedBedId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
                    <option value="">Select a ward and bed</option>
                    {beds.map((bed) => <option key={bed.id} value={bed.id}>{bed.wardName} · {bed.bedNumber}{bed.bedType ? ` · ${bed.bedType}` : ''}</option>)}
                  </select>
                </label>
                {beds.length === 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">No available beds are configured. The request remains pending; add or free a bed before accepting.</p>}

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void acceptRequest()} disabled={!selectedBedId || Boolean(savingId) || loading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
                    <Check className="h-4 w-4" /> {savingId === selectedRequest.id ? 'Confirming…' : 'Confirm admission'}
                  </button>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Reason if declining
                  <textarea value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} rows={2} maxLength={2000} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Document why this request is declined" />
                </label>
                <button type="button" onClick={() => void declineRequest()} disabled={declineReason.trim().length < 3 || Boolean(savingId)} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <X className="h-4 w-4" /> Decline request
                </button>
                <p className="text-xs text-slate-500">Confirming transfers the patient from Consultation into inpatient care. Declining leaves the queue in Consultation.</p>
              </>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">Select a pending request to review.</div>
            )}
          </section>
        </div>
      )}

      {bedView && (
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <h2 className="font-bold text-slate-900">Bed availability</h2>
          </div>
          {loading ? <p className="p-5 text-sm text-slate-500">Loading beds…</p> : beds.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-600">No beds are currently available. Check System Setup or active admissions.</div>
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {beds.map((bed) => (
                <article key={bed.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-3"><BedDouble className="h-5 w-5 text-teal-700" /><div><h3 className="font-bold text-slate-900">{bed.wardName} · {bed.bedNumber}</h3><p className="text-xs text-slate-500">{bed.bedType || 'Bed'} · Available</p></div></div>
                  <p className="mt-3 text-sm text-slate-600">Daily bed charge: KSh {bed.dailyCharge.toLocaleString()}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {admissionView && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-bold text-slate-900">Current inpatients <span className="ml-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-900">{admissions.length}</span></h2>
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:max-w-xs" placeholder="Search patient, ward, or bed" />
          </div>
          {loading ? <p className="p-5 text-sm text-slate-500">Loading admitted patients…</p> : filteredAdmissions.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldAlert className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 font-semibold text-slate-800">{admissions.length ? 'No patients match this search' : 'No active inpatient admissions'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAdmissions.map((admission) => (
                <article key={admission.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)]">
                  <div>
                    <h3 className="font-bold text-slate-900">{admission.patientName} <span className="font-normal text-slate-500">({admission.patientId})</span></h3>
                    <p className="mt-1 text-sm text-slate-700">{admission.wardName} · Bed {admission.bedNumber}</p>
                    <p className="mt-1 text-xs text-slate-500">Admitted {formatDate(admission.admittedAt)} · Dr. {admission.admittingDoctor || 'Not recorded'}</p>
                    <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">Admission diagnosis:</span> {admission.diagnosis}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600">
                      Inpatient discharge summary and instructions
                      <textarea value={dischargeSummaries[admission.id] || ''} onChange={(event) => setDischargeSummaries((current) => ({ ...current, [admission.id]: event.target.value }))} rows={2} maxLength={5000} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Enter diagnosis at discharge, treatment, follow-up, and return precautions" />
                    </label>
                    <button type="button" onClick={() => void discharge(admission)} disabled={(dischargeSummaries[admission.id] || '').trim().length < 3 || Boolean(savingId)} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                      {savingId === admission.id ? 'Discharging…' : 'Discharge patient & close visit'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {!requestView && !bedView && !admissionView && (
        <section className="flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <p>This section is not part of the admission handoff yet. Admission requests, bed assignment, inpatient census, and discharge are available under Bookings, Beds, Admitted Patients, and Discharge.</p>
        </section>
      )}
    </div>
  );
};
