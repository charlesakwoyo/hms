import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlaskConical, RefreshCw, Search, X } from 'lucide-react';
import { apiClient, type LaboratoryWorklistOrder } from '../services/apiClient';
import type { LaboratoryPage } from '../types';

type DialogAction = 'collect' | 'reject' | 'result' | null;

const priorityClass = (priority: string) => {
  if (priority === 'Emergency') return 'border-red-800 bg-red-950 text-red-200';
  if (priority === 'Urgent') return 'border-amber-800 bg-amber-950 text-amber-200';
  return 'border-slate-700 bg-slate-900 text-slate-300';
};

const dateTime = (value: string | null) => value ? new Date(value).toLocaleString() : '—';

interface LaboratoryModuleProps {
  page?: LaboratoryPage;
  onWorkflowUpdated?: () => Promise<void>;
}

export const LaboratoryModule = ({ page = 'Visits', onWorkflowUpdated }: LaboratoryModuleProps) => {
  const [orders, setOrders] = useState<LaboratoryWorklistOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<LaboratoryWorklistOrder | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [accessionNo, setAccessionNo] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [resultValue, setResultValue] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  const loadWorklist = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await apiClient.getLaboratoryWorklist());
    } catch (loadError) {
      setError((loadError as Error).message || 'The laboratory worklist could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorklist();
  }, [loadWorklist]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) =>
      !query || [order.patientName, order.patientId, order.ticketNumber, order.testName, order.testCode, order.accessionNo]
        .some((value) => String(value || '').toLowerCase().includes(query)),
    );
  }, [orders, search]);

  const orderRows = filtered;
  const specimenRows = filtered.filter((order) => ['Pending', 'Awaiting Recollection', 'Collected'].includes(order.status || ''));
  const resultRows = filtered.filter((order) => ['Collected', 'Result Entered'].includes(order.status || ''));
  const visitRows = useMemo(() => {
    const visits = new Map<string, LaboratoryWorklistOrder[]>();
    filtered.forEach((order) => {
      const key = order.visitId || order.ticketNumber || order.patientId;
      visits.set(key, [...(visits.get(key) || []), order]);
    });
    return [...visits.entries()].map(([visitId, visitOrders]) => ({
      visitId,
      patientName: visitOrders[0].patientName,
      patientId: visitOrders[0].patientId,
      ticketNumber: visitOrders[0].ticketNumber,
      orders: visitOrders.length,
      status: visitOrders.every((order) => order.status === 'Verified' || order.status === 'Cancelled')
        ? 'Complete'
        : visitOrders.some((order) => order.status === 'Result Entered')
          ? 'Results awaiting verification'
          : visitOrders.some((order) => order.status === 'Collected')
            ? 'In progress'
            : 'Pending',
    }));
  }, [filtered]);

  const openAction = (order: LaboratoryWorklistOrder, action: Exclude<DialogAction, null>) => {
    setSelectedOrder(order);
    setDialogAction(action);
    setAccessionNo('');
    setRejectionReason('');
    setResultValue(order.resultValue || '');
    setReferenceRange(order.referenceRange || '');
    setResultNotes(order.resultNotes || '');
    setError('');
  };

  const closeAction = () => {
    if (savingAction) return;
    setSelectedOrder(null);
    setDialogAction(null);
  };

  const submitAction = async () => {
    if (!selectedOrder || !dialogAction || savingAction) return;
    setSavingAction(true);
    setError('');
    setNotice('');
    try {
      if (dialogAction === 'collect') {
        const result = await apiClient.collectLaboratorySpecimen(selectedOrder.orderId, accessionNo.trim() || undefined);
        setNotice(`Specimen received. Accession number: ${result.accessionNo}.`);
      } else if (dialogAction === 'reject') {
        await apiClient.rejectLaboratorySpecimen(selectedOrder.orderId, rejectionReason.trim());
        setNotice('Specimen rejected. Order is awaiting recollection; the rejection reason has been recorded.');
      } else {
        await apiClient.enterLaboratoryResult(selectedOrder.orderId, {
          resultValue: resultValue.trim(),
          referenceRange: referenceRange.trim() || undefined,
          notes: resultNotes.trim() || undefined,
        });
        setNotice('Result saved and awaiting authorized verification.');
      }
      setSelectedOrder(null);
      setDialogAction(null);
      await loadWorklist();
    } catch (actionError) {
      setError((actionError as Error).message || 'The laboratory action could not be saved.');
    } finally {
      setSavingAction(false);
    }
  };

  const verifyResult = async (order: LaboratoryWorklistOrder) => {
    setSavingAction(true);
    setError('');
    setNotice('');
    try {
      const result = await apiClient.verifyLaboratoryResult(order.orderId);
      setNotice(result.returnedToConsultation
        ? `Result verified. All visit laboratory orders are complete; the patient has returned to the Consultation worklist.`
        : 'Result verified. It is now available to the clinician; other visit orders remain in Laboratory.');
      await loadWorklist();
      if (result.returnedToConsultation) await onWorkflowUpdated?.();
    } catch (actionError) {
      setError((actionError as Error).message || 'The laboratory result could not be verified.');
    } finally {
      setSavingAction(false);
    }
  };

  const rows = page === 'Orders' ? orderRows : page === 'Specimen' ? specimenRows : resultRows;

  return (
    <div className="min-h-full bg-[#0b0c0e] px-4 py-6 text-slate-100 sm:px-7">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#141619] p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-teal-950 p-3 text-teal-300"><FlaskConical className="h-6 w-6" /></span>
            <div>
              <h1 className="text-xl font-bold">Laboratory</h1>
              <p className="mt-1 text-sm text-slate-400">Orders, specimen collection, and results</p>
            </div>
          </div>
          <button type="button" onClick={() => void loadWorklist()} disabled={loading || savingAction} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#17191d] px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
        </header>

        {notice && <p role="status" className="rounded-lg border border-emerald-800 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-200">{notice}</p>}
        {error && !dialogAction && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">{error}</p>}

        <section className="rounded-2xl border border-slate-800 bg-[#141619]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
            <label className="relative block w-full sm:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient, order, ticket, or test" className="w-full rounded-lg border border-slate-700 bg-[#1d2024] py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-slate-500 focus:border-teal-600" />
            </label>
            <span className="text-sm text-slate-400">{page === 'Visits' ? visitRows.length : rows.length} {page === 'Visits' ? 'visits' : page === 'Results' ? 'result tasks' : page === 'Specimen' ? 'specimen tasks' : 'orders'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              {page === 'Visits' ? (
                <>
                  <thead className="border-b border-slate-800 bg-[#17191d] text-xs font-semibold text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Visit / Ticket</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Laboratory orders</th>
                      <th className="px-4 py-3">Workflow status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading && orders.length === 0 ? <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">Loading laboratory visits…</td></tr>
                      : visitRows.length === 0 ? <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">{orders.length ? 'No matching visits found for your search.' : 'No visits with laboratory orders are currently routed to Laboratory.'}</td></tr>
                        : visitRows.map((visit) => (
                          <tr key={visit.visitId} className="hover:bg-white/[0.025]">
                            <td className="px-4 py-4"><div className="font-mono text-teal-300">{visit.visitId}</div><div className="mt-1 text-xs text-slate-500">{visit.ticketNumber || '—'}</div></td>
                            <td className="px-4 py-4"><div className="font-semibold">{visit.patientName}</div><div className="text-xs text-slate-500">{visit.patientId}</div></td>
                            <td className="px-4 py-4">{visit.orders}</td>
                            <td className="px-4 py-4 text-amber-200">{visit.status}</td>
                          </tr>
                        ))}
                  </tbody>
                </>
              ) : (
                <>
              <thead className="border-b border-slate-800 bg-[#17191d] text-xs font-semibold text-slate-300">
                <tr>
                  <th className="px-4 py-3">Priority / Ticket</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Order / Test</th>
                  <th className="px-4 py-3">Specimen</th>
                  <th className="px-4 py-3">Workflow</th>
                  <th className="px-4 py-3">Clinical indication / Result</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading && orders.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">Loading laboratory worklist…</td></tr>
                  : rows.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">{orders.length ? `No matching ${page.toLowerCase()} found for your search or current status.` : 'No orders are currently routed to Laboratory.'}</td></tr>
                    : rows.map((order) => (
                      <tr key={order.orderId} className="align-top hover:bg-white/[0.025]">
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${priorityClass(order.priority)}`}>{order.priority}</span>
                          <div className="mt-2 font-mono text-teal-300">{order.ticketNumber || '—'}</div>
                        </td>
                        <td className="px-4 py-4"><div className="font-semibold">{order.patientName}</div><div className="text-xs text-slate-500">{order.patientId}</div></td>
                        <td className="px-4 py-4"><div className="font-mono text-xs text-teal-300">{order.orderId}</div><div className="mt-1 font-medium">{order.testName || 'Unnamed test'}</div><div className="text-xs text-slate-500">{order.testCode || 'No code'}{order.department ? ` · ${order.department}` : ''}</div></td>
                        <td className="px-4 py-4"><div>{order.specimenType || 'Not specified'}</div>{order.accessionNo && <div className="mt-1 font-mono text-xs text-slate-500">{order.accessionNo}</div>}</td>
                        <td className="px-4 py-4">
                          <div className="text-amber-200">{order.status || 'Pending'}</div>
                          {order.collectedAt && <div className="mt-1 text-xs text-slate-500">Collected {dateTime(order.collectedAt)} by {order.collectedBy || order.receivedBy || '—'}</div>}
                          {order.rejectionReason && <div className="mt-1 max-w-xs text-xs text-red-300">Rejected: {order.rejectionReason} · recollections {order.recollectionCount}</div>}
                          {order.verifiedAt && <div className="mt-1 text-xs text-emerald-400">Verified {dateTime(order.verifiedAt)} by {order.verifiedBy || '—'}</div>}
                        </td>
                        <td className="max-w-sm whitespace-pre-wrap px-4 py-4 text-slate-300">
                          {page === 'Results' && order.resultValue ? <><div className="font-semibold text-white">{order.resultValue}</div>{order.referenceRange && <div className="mt-1 text-xs text-slate-400">Reference: {order.referenceRange}</div>}{order.resultNotes && <div className="mt-1 text-xs text-slate-400">{order.resultNotes}</div>}{order.resultEnteredBy && <div className="mt-1 text-xs text-slate-500">Entered by {order.resultEnteredBy} · {dateTime(order.completedAt)}</div>}</> : order.clinicalIndication || 'Not recorded'}
                        </td>
                        <td className="px-4 py-4">
                          {page === 'Orders' && <span className="text-xs text-slate-500">View in Specimen or Results</span>}
                          {page === 'Specimen' && order.status === 'Pending' && <button type="button" onClick={() => openAction(order, 'collect')} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold hover:bg-teal-600">Receive</button>}
                          {page === 'Specimen' && order.status === 'Awaiting Recollection' && <button type="button" onClick={() => openAction(order, 'collect')} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold hover:bg-teal-600">Record Recollection</button>}
                          {page === 'Specimen' && order.status === 'Collected' && <button type="button" onClick={() => openAction(order, 'reject')} className="rounded-lg border border-red-800 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-950">Reject / Recollect</button>}
                          {page === 'Results' && order.status === 'Collected' && <button type="button" onClick={() => openAction(order, 'result')} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold hover:bg-teal-600">Enter Result</button>}
                          {page === 'Results' && order.status === 'Result Entered' && <button type="button" disabled={savingAction} onClick={() => void verifyResult(order)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50">Verify Result</button>}
                        </td>
                      </tr>
                    ))}
              </tbody>
                </>
              )}
            </table>
          </div>
        </section>
        <p className="text-xs text-slate-500">Status changes are recorded with the staff member and timestamp. Only verified results complete an order; a verified final result returns the visit to Consultation.</p>
      </div>

      {selectedOrder && dialogAction && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="lab-action-title" className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#17191b] p-5 shadow-2xl">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 id="lab-action-title" className="text-lg font-bold">{dialogAction === 'collect' ? 'Receive Specimen' : dialogAction === 'reject' ? 'Reject Specimen' : 'Enter Laboratory Result'}</h2>
                <p className="mt-1 text-sm text-slate-400">{selectedOrder.patientName} · {selectedOrder.patientId} · {selectedOrder.testName}</p>
              </div>
              <button type="button" aria-label="Close dialog" disabled={savingAction} onClick={closeAction} className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-50"><X className="h-5 w-5" /></button>
            </header>
            {dialogAction === 'collect' && (
              <label className="mt-5 block text-sm font-semibold text-slate-300">Accession / specimen label number (optional)
                <input value={accessionNo} onChange={(event) => setAccessionNo(event.target.value)} maxLength={80} placeholder="Leave blank to generate one" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#222426] px-3 py-2.5 text-sm outline-none focus:border-teal-600" />
              </label>
            )}
            {dialogAction === 'reject' && (
              <label className="mt-5 block text-sm font-semibold text-slate-300">Reason specimen is unusable
                <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={4} maxLength={2000} placeholder="Document why recollection is required" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#222426] p-3 text-sm outline-none focus:border-teal-600" />
              </label>
            )}
            {dialogAction === 'result' && (
              <div className="mt-5 space-y-4">
                <label className="block text-sm font-semibold text-slate-300">Result
                  <textarea value={resultValue} onChange={(event) => setResultValue(event.target.value)} rows={3} maxLength={20000} required placeholder="Enter the observed result" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#222426] p-3 text-sm outline-none focus:border-teal-600" />
                </label>
                <label className="block text-sm font-semibold text-slate-300">Reference range (optional)
                  <input value={referenceRange} onChange={(event) => setReferenceRange(event.target.value)} maxLength={180} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#222426] px-3 py-2.5 text-sm outline-none focus:border-teal-600" />
                </label>
                <label className="block text-sm font-semibold text-slate-300">Result notes (optional)
                  <textarea value={resultNotes} onChange={(event) => setResultNotes(event.target.value)} rows={2} maxLength={5000} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#222426] p-3 text-sm outline-none focus:border-teal-600" />
                </label>
              </div>
            )}
            {error && <p role="alert" className="mt-4 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
            <footer className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={savingAction} onClick={closeAction} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button>
              <button
                type="button"
                disabled={savingAction || (dialogAction === 'reject' && rejectionReason.trim().length < 3) || (dialogAction === 'result' && resultValue.trim().length === 0)}
                onClick={() => void submitAction()}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-emerald-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingAction ? 'Saving…' : dialogAction === 'collect' ? 'Confirm Receipt' : dialogAction === 'reject' ? 'Reject & Request Recollection' : 'Save Result for Verification'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};
