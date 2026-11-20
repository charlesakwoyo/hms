import React, { useEffect, useState } from 'react';
import {
  ListOrdered,
  Clock,
  ArrowRight,
  CheckCircle2,
  Users,
  Search,
  Filter,
  AlertTriangle,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  CreditCard,
  PhoneCall,
  Monitor,
} from 'lucide-react';
import { QueueItem, QueueStation, TriageCategory, SetupConsultationService } from '../types';
import { announcePatientTicket, announcesOnThisComputer, setAnnouncesOnThisComputer, hasSpeechVoices } from '../utils/queueAudio';
import { getFirstName } from '../utils/nameUtils';
import { apiClient } from '../services/apiClient';
import { TvDisplayPanel } from './TvDisplayPanel';
import { Patient } from '../types';

interface QueueModuleProps {
  queue: QueueItem[];
  onMoveStation: (queueId: string, nextStation: QueueStation) => void;
  onUpdatePriority: (queueId: string, newPriority: TriageCategory) => void;
  onCallPatient?: (queueId: string) => void;
  onRecallPatient?: (queueId: string) => void;
  onCompleteAndNext?: (queueId: string, nextStation?: QueueStation) => void;
  consultationServices?: SetupConsultationService[];
  patients?: Patient[];
  onSelectConsultationForQueue?: (
    item: QueueItem,
    service: SetupConsultationService,
    fee: number,
    patientSubCategory: string,
  ) => Promise<void> | void;
  onQueueRegisteredPatient?: (
    patient: Patient,
    service: SetupConsultationService,
    fee: number,
    patientSubCategory: string,
  ) => Promise<void> | void;

  focusPatientId?: string;
}

const priceLabel = (amount: number) => (amount > 0 ? `KSh ${amount.toLocaleString()}` : 'Free');

export const QueueModule: React.FC<QueueModuleProps> = ({
  queue,
  onMoveStation,
  onUpdatePriority,
  onCallPatient,
  onRecallPatient,
  onCompleteAndNext,
  consultationServices = [],
  patients = [],
  onSelectConsultationForQueue,
  onQueueRegisteredPatient,
  focusPatientId,
}) => {
  const [stationFilter, setStationFilter] = useState<string>('All');
  const [tvPanelOpen, setTvPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [consultationSelections, setConsultationSelections] = useState<Record<string, string>>({});
  const [loadedConsultationServices, setLoadedConsultationServices] = useState<SetupConsultationService[]>(consultationServices);
  const [registeredSearch, setRegisteredSearch] = useState(focusPatientId || '');
  useEffect(() => {
    if (focusPatientId) setRegisteredSearch(focusPatientId);
  }, [focusPatientId]);
  const [registeredSelections, setRegisteredSelections] = useState<Record<string, string>>({});
  const [queueingPatientId, setQueueingPatientId] = useState<string | null>(null);
  const [editingQueueConsultationId, setEditingQueueConsultationId] = useState<string | null>(null);
  const [savingQueueConsultationId, setSavingQueueConsultationId] = useState<string | null>(null);

  const normalizePhone = (value: string = '') => {
    const digits = String(value).replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('254')) return digits;
    if (digits.startsWith('0') && digits.length >= 10) return `254${digits.slice(1)}`;
    if (digits.startsWith('7') && digits.length === 9) return `254${digits}`;
    return digits;
  };

  const phoneCore = (value: string = '') => String(value).replace(/\D/g, '').replace(/^254/, '').replace(/^0+/, '');
  const registeredPatientMatches = (patient: Patient, query: string) => {
    const q = String(query || '')
      .trim()
      .toLowerCase();
    if (!q) return true;
    const name = String(patient.name || '').toLowerCase();
    const code = String(patient.id || '').toLowerCase();
    const idNumber = String(patient.nationalId || (patient as any).national_id || '').toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    if (words.every((w) => name.includes(w))) return true;
    if (code.includes(q) || (idNumber && idNumber.includes(q.replace(/\s+/g, '')))) return true;
    const qDigits = q.replace(/\D/g, '');
    if (qDigits.length >= 3 && qDigits.length === q.replace(/[\s+\-()]/g, '').length) {
      const qCore = phoneCore(qDigits);
      const phone = phoneCore(String(patient.phone || ''));
      if (qCore && phone.includes(qCore)) return true;
      if (idNumber.replace(/\D/g, '').includes(qDigits)) return true;
    }
    return false;
  };

  useEffect(() => {
    let active = true;

    apiClient.getConsultationCatalog().then((rows) => {
      if (!active) return;
      const authoritative = (rows || [])
        .filter((r: any) => String(r.status || 'Active').toLowerCase() !== 'inactive')
        .map((r: any) => ({
          ...r,
          id: Number(r.id),
          cashPrice: Number(r.cashPrice ?? r.cash_price ?? 0),
          subCategoryPrices: r.subCategoryPrices || {},
          durationMinutes: Number(r.durationMinutes ?? r.duration_minutes ?? 0),
          status: 'Active',
        }));
      setLoadedConsultationServices(authoritative.length ? authoritative : consultationServices);
    });
    return () => {
      active = false;
    };
  }, [consultationServices]);

  const isWithinOperationalCycle = (item: QueueItem) => {
    const raw = item.arrivedTime;
    if (!raw) return false;
    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const parsed = new Date(normalized).getTime();
    if (!Number.isFinite(parsed)) return false;
    return Date.now() - parsed < 24 * 60 * 60 * 1000;
  };

  const isFinished = (item: QueueItem) => item.currentStation === 'Discharged' || item.status === 'Completed';
  const activeQueue = queue.filter(isWithinOperationalCycle);

  const inQueueNow = new Map(activeQueue.filter((item) => !isFinished(item)).map((item) => [item.patientId, item] as const));
  const queueablePatients = patients.sort((a, b) => String(b.registeredDate || '').localeCompare(String(a.registeredDate || '')));
  const matchingPatients = queueablePatients.filter((p) => registeredPatientMatches(p, registeredSearch));

  const stations: QueueStation[] = [
    'Registration',
    'Triage',
    'Consultation',
    'Laboratory',
    'Radiology',
    'Pharmacy',
    'Billing',
    'Discharged',
  ];

  const filteredQueue = activeQueue.filter((item) => {
    const matchesStation = stationFilter === 'All' || item.currentStation === stationFilter;
    const q = searchTerm.trim().toLowerCase();
    const patient = patients.find((p) => p.id === item.patientId);
    const matchesSearch =
      !q ||
      String(item.ticketNumber || '')
        .toLowerCase()
        .includes(q) ||
      registeredPatientMatches(patient || ({ id: item.patientId, name: item.patientName } as Patient), q);
    return matchesStation && matchesSearch;
  });

  const resolveConsultationPrice = (service: SetupConsultationService | any, patient?: Patient, queueItem?: QueueItem) => {
    const patientCategory = String(patient?.patientCategory || '').trim();
    const patientSubCategory = String(patient?.patientSubCategory || queueItem?.patientSubCategory || '').trim();
    const categoryKey = patientCategory.toLowerCase();
    const subCategoryKey = patientSubCategory.toLowerCase();
    const rows = Array.isArray(service?.subCategoryPriceRows) ? service.subCategoryPriceRows : [];

    const exact = rows.find((r: any) => {
      if (String(r.status || 'Active').toLowerCase() === 'inactive') return false;
      const rowCategoryCode = String(r.categoryCode || '')
        .trim()
        .toLowerCase();
      const rowCategoryName = String(r.categoryName || '')
        .trim()
        .toLowerCase();
      const rowSubCode = String(r.subCategoryCode || '')
        .trim()
        .toLowerCase();
      const rowSubName = String(r.subCategoryName || '')
        .trim()
        .toLowerCase();
      const categoryMatches = !!categoryKey && (rowCategoryCode === categoryKey || rowCategoryName === categoryKey);
      const subCategoryMatches = !!subCategoryKey && (rowSubCode === subCategoryKey || rowSubName === subCategoryKey);
      return categoryMatches && subCategoryMatches;
    });

    return {
      price: exact ? Number(exact.price || 0) : 0,
      row: exact || null,
      source: 'setup_consultation_prices' as const,
      patientCategory,
      patientSubCategory,
    };
  };

  const handleConsultationTypeChange = async (item: QueueItem, serviceId: string) => {
    const patient = patients.find((p) => p.id === item.patientId);
    const service = loadedConsultationServices.find((s) => String(s.id) === String(serviceId));
    if (!service) return;
    const resolved = resolveConsultationPrice(service, patient, item);
    const subCode = resolved.patientSubCategory;
    const fee = resolved.price;
    const updated = {
      ...item,
      consultationServiceId: Number(service.id),
      consultationServiceCode: service.code,
      consultationType: service.name,
      consultationFee: fee,
      patientCategory: resolved.patientCategory,
      patientSubCategory: subCode,
      consultationPriceSource: 'setup_consultation_prices',
    };
    setConsultationSelections((prev) => ({ ...prev, [item.id]: String(service.id) }));
    await apiClient.persistQueueItem(updated);
    window.dispatchEvent(new CustomEvent('wisecare:queue-consultation-type', { detail: updated }));
    await onSelectConsultationForQueue?.(updated, service, fee, subCode);
  };

  const getNextStation = (curr: QueueStation): QueueStation => {
    switch (curr) {
      case 'Registration':
        return 'Triage';
      case 'Triage':
        return 'Consultation';
      case 'Consultation':
        return 'Laboratory';
      case 'Laboratory':
        return 'Pharmacy';
      case 'Pharmacy':
        return 'Billing';
      case 'Billing':
        return 'Discharged';
      default:
        return 'Discharged';
    }
  };

  const [announceHere, setAnnounceHere] = useState(announcesOnThisComputer());

  const [voicesHere, setVoicesHere] = useState(true);
  useEffect(() => {
    const check = () => setVoicesHere(hasSpeechVoices());
    const t = window.setTimeout(check, 1500);
    try {
      window.speechSynthesis?.addEventListener?.('voiceschanged', check);
    } catch {}
    return () => {
      window.clearTimeout(t);
      try {
        window.speechSynthesis?.removeEventListener?.('voiceschanged', check);
      } catch {}
    };
  }, []);
  useEffect(() => {
    const f = (e: Event) => setAnnounceHere(!!(e as CustomEvent).detail);
    window.addEventListener('wisecare:announce-setting', f);
    return () => window.removeEventListener('wisecare:announce-setting', f);
  }, []);

  return (
    <div id="queue-module" className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Live Patient Queue & Station Encounters</h2>
          <p className="text-xs text-gray-500">Track patient throughput and routing across outpatient hospital care points</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTvPanelOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Monitor className="w-4 h-4" /> TV display
          </button>

          <button
            type="button"
            onClick={() => {
              const on = !announceHere;
              setAnnouncesOnThisComputer(on);
              setAnnounceHere(on);
            }}
            title={
              announceHere
                ? 'Calls you make are also spoken on this computer. Select to leave announcing to the TV.'
                : 'Calls are announced on the waiting-area TV. Select to also speak them on this computer (a desk with no TV nearby).'
            }
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${announceHere ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {announceHere ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {announceHere ? 'Also announcing on this computer' : 'Calls announced on the TV'}
          </button>
        </div>
      </div>
      <TvDisplayPanel open={tvPanelOpen} onClose={() => setTvPanelOpen(false)} />
      {announceHere && !voicesHere && (
        <div className="p-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs">
          <b>This browser has no voice, so calls play only a chime.</b> On Ubuntu/Linux, open WiseCare with the{' '}
          <b>"WiseCare (with voice)"</b> icon (it starts Chrome with speech switched on), or use Microsoft Edge. Windows and Android
          browsers have voices built in.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {stations.slice(0, 7).map((st) => {
          const count = activeQueue.filter((q) => q.currentStation === st).length;
          return (
            <div
              key={st}
              onClick={() => setStationFilter(st)}
              className={`p-3 rounded-xl border text-center cursor-pointer transition ${
                stationFilter === st
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-800 border-gray-200 hover:border-blue-400'
              }`}
            >
              <p className={`text-[10px] font-semibold uppercase ${stationFilter === st ? 'text-blue-100' : 'text-gray-400'}`}>{st}</p>
              <h4 className="text-xl font-black mt-0.5">{count}</h4>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search ticket, name, mobile or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Filter Station:</span>
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium"
          >
            <option value="All">All Active Stations</option>
            {stations.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Registered Patients — Queue for Consultation</h3>
            <p className="text-[10px] text-gray-500">
              Search registered patients, select a consultation, then WiseCare routes Cash patients to Billing and other categories to
              Triage.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              value={registeredSearch}
              onChange={(e) => setRegisteredSearch(e.target.value)}
              placeholder="Search by name, mobile number or ID number..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        {registeredSearch.trim() && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b text-gray-600">
                <tr>
                  <th className="p-2">Patient</th>
                  <th className="p-2">Sub-category</th>
                  <th className="p-2">Consultation</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {matchingPatients.slice(0, 10).map((patient) => {
                  const selectedId = registeredSelections[patient.id] || '';
                  const service = loadedConsultationServices.find((s) => String(s.id) === selectedId);
                  const resolvedSelected = service ? resolveConsultationPrice(service, patient) : null;
                  const fee = resolvedSelected?.price || 0;
                  const isFree = !!service && fee <= 0;
                  return (
                    <tr key={patient.id} className="border-b last:border-0">
                      <td className="p-2">
                        <div className="font-semibold">{patient.name}</div>
                        <div className="text-[9px] text-gray-500">
                          {patient.id} • {patient.phone || 'No phone'}
                        </div>
                      </td>
                      <td className="p-2">
                        <div>{patient.patientCategory || 'Not set'}</div>
                        <div className="text-[10px] text-gray-500">{patient.patientSubCategory || 'Sub-category not set'}</div>
                      </td>
                      <td className="p-2">
                        <select
                          value={selectedId}
                          onChange={(e) => setRegisteredSelections((prev) => ({ ...prev, [patient.id]: e.target.value }))}
                          className="w-full min-w-[220px] border rounded px-2 py-1.5"
                        >
                          <option value="">Select consultation...</option>
                          {loadedConsultationServices.map((s) => {
                            const r = resolveConsultationPrice(s, patient).row;
                            const amount = r ? Number(r.price || 0) : 0;
                            return (
                              <option key={s.id} value={String(s.id)}>
                                {s.name} — {priceLabel(amount)}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="p-2 font-bold">
                        {service ? isFree ? <span className="text-emerald-700">Free</span> : priceLabel(fee) : '—'}
                      </td>
                      <td className="p-2 text-center">
                        {inQueueNow.has(patient.id) ? (
                          <span className="inline-block px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                            In queue — {inQueueNow.get(patient.id)?.currentStation}
                            {inQueueNow.get(patient.id)?.ticketNumber ? ` (${inQueueNow.get(patient.id)?.ticketNumber})` : ''}
                          </span>
                        ) : String(patient.status) === 'Admitted' ? (
                          <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-600 text-[10px] font-bold">Admitted</span>
                        ) : (
                          <button
                            disabled={!service || queueingPatientId === patient.id}
                            onClick={async () => {
                              if (!service || !onQueueRegisteredPatient) return;
                              setQueueingPatientId(patient.id);
                              try {
                                await onQueueRegisteredPatient(patient, service, fee, String(patient.patientSubCategory || '').trim());
                              } finally {
                                setQueueingPatientId(null);
                              }
                            }}
                            className="px-3 py-1.5 rounded bg-blue-600 text-white font-bold disabled:opacity-50"
                          >
                            {queueingPatientId === patient.id ? 'Queueing...' : 'Queue Patient'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {matchingPatients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-400">
                      No registered patient found. Try the patient name or mobile number (e.g. 0700..., 0712..., or +254700...).
                    </td>
                  </tr>
                )}
                {matchingPatients.length > 10 && (
                  <tr>
                    <td colSpan={5} className="p-2 text-center text-[10px] text-gray-500">
                      Showing 10 of {matchingPatients.length} matching patients. Type more of the name, ID, phone or national ID to narrow
                      it down.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticket & Status</th>
                <th className="py-3 px-4">Patient & Payment Scheme</th>
                <th className="py-3 px-4">Consultation Type</th>
                <th className="py-3 px-4">Station</th>
                <th className="py-3 px-4">Acuity</th>
                <th className="py-3 px-4">Calls</th>
                <th className="py-3 px-4">Attending Staff</th>
                <th className="py-3 px-4 text-center">Service Point Queue Actions</th>
                <th className="py-3 px-4 text-right">Station Routing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-400">
                    No patients currently in this queue station.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => {
                  const isCash = item.paymentMethod?.toLowerCase().includes('cash');
                  const isPreTriageUnpaid = isCash && item.consultationFeePaid === false;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/20 transition ${
                        item.status === 'Calling'
                          ? 'bg-amber-50/60 ring-1 ring-amber-300'
                          : item.status === 'Serving'
                            ? 'bg-emerald-50/40'
                            : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-blue-700 text-xs">{item.ticketNumber}</div>
                        <div className="mt-0.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              item.status === 'Calling'
                                ? 'bg-amber-500 text-white animate-pulse'
                                : item.status === 'Serving'
                                  ? 'bg-emerald-600 text-white'
                                  : item.status === 'Completed'
                                    ? 'bg-gray-200 text-gray-700'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.status || 'Waiting'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{getFirstName(item.patientName)}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{item.patientId}</div>
                        {isPreTriageUnpaid ? (
                          <div className="inline-flex items-center space-x-1 mt-0.5 px-2 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-bold">
                            <CreditCard className="w-3 h-3" />
                            <span>Cash: Pay Consultation at Billing Before Triage</span>
                          </div>
                        ) : item.paymentMethod ? (
                          <div className="text-[10px] text-gray-500 font-medium mt-0.5">{item.paymentMethod}</div>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 min-w-[260px]">
                        {loadedConsultationServices.length > 0 ? (
                          (() => {
                            const patient = patients.find((p) => p.id === item.patientId);
                            const currentId =
                              consultationSelections[item.id] || (item.consultationServiceId ? String(item.consultationServiceId) : '');
                            const currentService = loadedConsultationServices.find((s) => String(s.id) === String(currentId));
                            const method = String(patient?.insuranceProvider || item.paymentMethod || '').toLowerCase();
                            const isCash = method.includes('cash') || method.includes('m-pesa');
                            const code = String(patient?.patientSubCategory || item.patientSubCategory || '').trim();
                            const currentRow = currentService?.subCategoryPriceRows?.find(
                              (r: any) =>
                                String(r.subCategoryCode).trim() === code && String(r.status || 'Active').toLowerCase() !== 'inactive',
                            );
                            const displayedFee =
                              item.consultationFee !== undefined
                                ? Number(item.consultationFee)
                                : currentService
                                  ? isCash
                                    ? Number(currentService.cashPrice ?? currentService.cash_price ?? 0)
                                    : Number(currentRow?.price ?? currentService.subCategoryPrices?.[code] ?? 0)
                                  : 0;
                            return (
                              <div className="space-y-1.5">
                                {editingQueueConsultationId === item.id ? (
                                  <>
                                    <select
                                      aria-label={`Edit consultation type for ${item.patientName}`}
                                      value={currentId}
                                      onChange={(e) => setConsultationSelections((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                      className="w-full text-[11px] border border-blue-300 bg-blue-50 rounded-lg px-2 py-1.5 font-semibold text-blue-900"
                                    >
                                      <option value="">Select consultation type…</option>
                                      {loadedConsultationServices.map((service) => {
                                        const priceRow = (service.subCategoryPriceRows || []).find(
                                          (r: any) =>
                                            String(r.subCategoryCode).trim() === code &&
                                            String(r.status || 'Active').toLowerCase() !== 'inactive',
                                        );
                                        const price = isCash
                                          ? Number(service.cashPrice ?? (service as any).cash_price ?? 0)
                                          : Number(priceRow?.price ?? service.subCategoryPrices?.[code] ?? 0);
                                        return (
                                          <option key={service.id} value={String(service.id)}>
                                            {service.name} — {priceLabel(price)}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <div className="flex gap-1">
                                      <button
                                        disabled={!currentId || savingQueueConsultationId === item.id}
                                        onClick={async () => {
                                          if (!currentId) return;
                                          setSavingQueueConsultationId(item.id);
                                          try {
                                            await handleConsultationTypeChange(item, currentId);
                                            setEditingQueueConsultationId(null);
                                          } finally {
                                            setSavingQueueConsultationId(null);
                                          }
                                        }}
                                        className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold disabled:opacity-50"
                                      >
                                        {savingQueueConsultationId === item.id ? 'Saving...' : 'Update'}
                                      </button>
                                      <button
                                        onClick={() => setEditingQueueConsultationId(null)}
                                        className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-[10px] font-bold"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="font-bold text-emerald-800">
                                      {item.consultationType || currentService?.name || 'Not selected'}
                                    </div>
                                    <div className="text-[10px] text-gray-600">
                                      {item.consultationType ? priceLabel(displayedFee) : 'Consultation not selected'}
                                    </div>
                                    {item.patientSubCategory && (
                                      <div className="text-[9px] text-slate-500">Sub-category: {item.patientSubCategory}</div>
                                    )}
                                    <button
                                      onClick={() => setEditingQueueConsultationId(item.id)}
                                      className="text-[10px] px-2 py-1 rounded border border-blue-200 text-blue-700 bg-blue-50 font-bold"
                                    >
                                      Edit & Update
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-[11px] font-semibold text-slate-700">
                            {item.consultationType || '—'}
                            {item.consultationFee !== undefined ? ` • ${priceLabel(Number(item.consultationFee))}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            item.currentStation === 'Billing' && isPreTriageUnpaid
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.currentStation}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={item.priority}
                          onChange={(e) => onUpdatePriority(item.id, e.target.value as TriageCategory)}
                          className={`text-[10px] font-bold rounded-full px-2 py-0.5 border cursor-pointer ${
                            item.priority === 'Emergency'
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : item.priority === 'Urgent'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <option value="Normal">Normal</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Emergency">Emergency</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-semibold text-gray-700">{item.callCount || 0}x</div>
                        {item.lastCalledAt && <div className="text-[9px] text-gray-400">At {item.lastCalledAt}</div>}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{item.assignedTo || 'Unassigned'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-1">
                          {item.currentStation !== 'Discharged' && (
                            <>
                              <button
                                type="button"
                                title="Call patient to station"
                                onClick={() => {
                                  onCallPatient?.(item.id);
                                  announcePatientTicket(item.ticketNumber, item.patientName, item.currentStation);
                                }}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-[10px] flex items-center space-x-1 shadow-2xs"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>Call</span>
                              </button>
                              <button
                                type="button"
                                title="Re-call patient"
                                onClick={() => {
                                  onRecallPatient?.(item.id);
                                  announcePatientTicket(item.ticketNumber, item.patientName, item.currentStation, true);
                                }}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] flex items-center space-x-1 shadow-2xs"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Re-Call</span>
                              </button>
                              <button
                                type="button"
                                title="Complete consultation/encounter and forward to next station"
                                onClick={() => {
                                  const nextSt = getNextStation(item.currentStation);
                                  onCompleteAndNext?.(item.id, nextSt);
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] flex items-center space-x-1 shadow-2xs"
                              >
                                <Check className="w-3 h-3" />
                                <span>Complete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.currentStation !== 'Discharged' ? (
                          <button
                            onClick={() => onMoveStation(item.id, getNextStation(item.currentStation))}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-bold text-[11px] border border-blue-200 transition"
                          >
                            <span>Forward to {getNextStation(item.currentStation)}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center justify-end space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Discharged</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
