import { useCallback, useState } from 'react';
import { apiClient } from '../services/apiClient';
import type { Patient, QueueItem, QueueStation, TriageCategory } from '../types';

const STAFF_FOR_STATION: Partial<Record<QueueStation, string>> = {
  Triage: 'Triage Nurse',
  Consultation: 'Consulting Doctor',
  Laboratory: 'Laboratory',
  Radiology: 'Radiology',
  Pharmacy: 'Pharmacy',
  Billing: 'Cashier',
};

const NEXT_STATION: Partial<Record<QueueStation, QueueStation>> = {
  Registration: 'Triage',
  Triage: 'Consultation',
  Consultation: 'Pharmacy',
  Laboratory: 'Consultation',
  Radiology: 'Consultation',
  Pharmacy: 'Billing',
  Billing: 'Discharged',
};

export const isWithin24Hours = (raw: string) => {
  if (!raw) return false;
  const time = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T')).getTime();
  return Number.isFinite(time) && Date.now() - time < 24 * 60 * 60 * 1000;
};

const isCash = (method: string) => {
  const lower = method.toLowerCase();
  return lower.includes('cash') || lower.includes('m-pesa');
};

export const toQueueItem = (row: Record<string, any>): QueueItem => ({
  id: String(row.id),
  ticketNumber: String(row.ticket_number || ''),
  patientId: String(row.patient_id || ''),
  patientName: String(row.patient_name || ''),
  arrivedTime: String(row.arrived_time || row.created_at || ''),
  currentStation: (row.current_station || 'Triage') as QueueStation,
  priority: (row.priority || 'Normal') as TriageCategory,
  assignedTo: row.assigned_to || undefined,
  paymentMethod: row.payment_method || undefined,
  consultationFeePaid: Number(row.consultation_fee_paid) === 1,
  status: row.status || 'Waiting',
  callCount: Number(row.call_count || 0),
  lastCalledAt: row.last_called_at || undefined,
  servicePointNote: row.service_point_note || undefined,
  consultationServiceId: row.consultation_service_id ? Number(row.consultation_service_id) : undefined,
  consultationServiceCode: row.consultation_service_code || undefined,
  consultationType: row.consultation_type || undefined,
  consultationFee: row.consultation_fee !== null && row.consultation_fee !== undefined ? Number(row.consultation_fee) : undefined,
  patientSubCategory: row.patient_sub_category || undefined,
});

export function useQueue(staffName: string) {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const load = useCallback(async () => {
    const rows = await apiClient.getEntity('queue');
    setQueue(rows.map(toQueueItem).filter((item) => isWithin24Hours(item.arrivedTime)));
  }, []);

  const save = useCallback((item: QueueItem) => {
    setQueue((current) => {
      const exists = current.some((q) => q.id === item.id);
      return exists ? current.map((q) => (q.id === item.id ? item : q)) : [item, ...current];
    });
    void apiClient.persistQueueItem(item);
  }, []);

  const update = useCallback(
    (id: string, change: (item: QueueItem) => QueueItem) => {
      const target = queue.find((q) => q.id === id);
      if (target) save(change(target));
    },
    [queue, save],
  );

  const blockedAtBilling = (item: QueueItem, patients: Patient[], next?: QueueStation) => {
    const patient = patients.find((p) => p.id === item.patientId);
    const method = String(patient?.insuranceProvider || item.paymentMethod || '');
    return (
      isCash(method) &&
      item.currentStation === 'Billing' &&
      next !== 'Billing' &&
      (!item.consultationServiceId || item.consultationFeePaid === false)
    );
  };

  const moveTo = (item: QueueItem, station: QueueStation): QueueItem => ({
    ...item,
    currentStation: station,
    status: station === 'Discharged' ? 'Completed' : 'Waiting',
    assignedTo: STAFF_FOR_STATION[station],
  });

  const call = useCallback(
    (id: string) => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      update(id, (q) => ({ ...q, status: 'Calling', callCount: (q.callCount || 0) + 1, lastCalledAt: time }));
    },
    [update],
  );

  const moveStation = useCallback(
    (id: string, station: QueueStation, patients: Patient[]) => {
      const target = queue.find((q) => q.id === id);
      if (!target) return;
      if (blockedAtBilling(target, patients, station)) {
        window.alert('Select the consultation type and complete Cashier payment before moving this cash patient from Billing.');
        return;
      }
      save(moveTo(target, station));
    },
    [queue, save],
  );

  const completeAndNext = useCallback(
    (id: string, patients: Patient[], station?: QueueStation) => {
      const target = queue.find((q) => q.id === id);
      if (!target) return;
      if (blockedAtBilling(target, patients)) {
        window.alert('Select the consultation type and complete Cashier payment before moving this cash patient from Billing.');
        return;
      }
      save(moveTo(target, station || NEXT_STATION[target.currentStation] || 'Discharged'));
    },
    [queue, save],
  );

  const setPriority = useCallback((id: string, priority: TriageCategory) => update(id, (q) => ({ ...q, priority })), [update]);

  const enqueue = useCallback(
    (patient: Patient, service: any, fee: number, patientSubCategory: string): boolean => {
      if (!service) return false;
      if (queue.some((q) => q.patientId === patient.id && q.currentStation !== 'Discharged' && isWithin24Hours(q.arrivedTime))) {
        window.alert(`${patient.name} is already in the active patient queue.`);
        return false;
      }
      const method = String(patient.insuranceProvider || '').trim();
      const free = Number(fee) <= 0;
      const cash = isCash(method) && !free;
      const number = queue.length + 1;
      const note = free
        ? `Free consultation: ${service.name}, queued by ${staffName || 'staff'}. Proceed to Triage.`
        : cash
          ? `Cash patient: ${service.name} selected at KSh ${Number(fee).toLocaleString()}. Payment required at Billing before Triage.`
          : `${service.name} selected for ${patientSubCategory || 'patient sub-category'}. Proceed to Triage.`;
      save({
        id: `Q-${Date.now()}-${number}`,
        ticketNumber: cash ? `B-${500 + number}` : `T-${100 + number}`,
        patientId: patient.id,
        patientName: patient.name,
        arrivedTime: new Date().toISOString(),
        currentStation: cash ? 'Billing' : 'Triage',
        priority: 'Normal',
        assignedTo: cash ? 'Cashier' : 'Triage Nurse',
        paymentMethod: method,
        consultationFeePaid: !cash,
        status: 'Waiting',
        callCount: 0,
        consultationServiceId: Number(service.id),
        consultationServiceCode: service.code,
        consultationType: service.name,
        consultationFee: Number(fee),
        patientCategory: patient.patientCategory,
        patientSubCategory,
        consultationPriceSource: 'setup_consultation_prices',
        ...(free ? { freeConsultation: true, freeConsultationAllowedBy: staffName } : {}),
        servicePointNote: note,
      });
      return true;
    },
    [queue, save, staffName],
  );

  return { queue, load, call, moveStation, completeAndNext, setPriority, enqueue };
}
