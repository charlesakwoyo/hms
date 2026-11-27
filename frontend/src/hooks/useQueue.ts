import { useCallback, useState } from 'react';
import { apiClient } from '../services/apiClient';
import type { Patient, QueueItem, QueueStation, TriageCategory } from '../types';

const STAFF_FOR_STATION: Partial<Record<QueueStation, string>> = {
  Triage: 'Triage Nurse',
  Consultation: 'Consulting Doctor',
  Laboratory: 'Laboratory',
  Radiology: 'Radiology',
  Pharmacy: 'Pharmacy',
  'Inpatient Ward': 'Inpatient Ward',
  Billing: 'Cashier',
};

const NEXT_STATION: Partial<Record<QueueStation, QueueStation>> = {
  Registration: 'Triage',
  Triage: 'Consultation',
};

export type EnqueueResult = { success: true; destination: string } | { success: false; error: string };

export const isWithin24Hours = (raw: string) => {
  if (!raw) return false;
  const time = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T')).getTime();
  return Number.isFinite(time) && Date.now() - time < 24 * 60 * 60 * 1000;
};

const isCash = (method: string) => {
  const lower = method.toLowerCase();
  return lower.includes('cash') || lower.includes('m-pesa') || lower.includes('mpesa');
};

export const getNextQueueStation = (
  station: QueueStation,
  item?: Pick<QueueItem, 'priority' | 'paymentMethod' | 'consultationFeePaid'>,
): QueueStation | null => {
  if (
    station === 'Triage' &&
    item?.priority !== 'Emergency' &&
    item?.consultationFeePaid === false &&
    isCash(String(item.paymentMethod || ''))
  ) {
    return 'Billing';
  }
  return NEXT_STATION[station] ?? null;
};

export const toQueueItem = (row: Record<string, any>): QueueItem => {
  const value = (...keys: string[]) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
    }
    return undefined;
  };
  return {
    id: String(value('id') || ''),
    ticketNumber: String(value('ticketNumber', 'ticket_number') || ''),
    patientId: String(value('patientId', 'patient_id') || ''),
    patientName: String(value('patientName', 'patient_name') || ''),
    arrivedTime: String(value('arrivedTime', 'arrived_time', 'createdAt', 'created_at') || ''),
    currentStation: (value('currentStation', 'current_station') || 'Triage') as QueueStation,
    priority: (value('priority') || 'Normal') as TriageCategory,
    assignedTo: value('assignedTo', 'assigned_to') || undefined,
    paymentMethod: value('paymentMethod', 'payment_method') || undefined,
    consultationFeePaid: Number(value('consultationFeePaid', 'consultation_fee_paid')) === 1,
    status: (value('status') || 'Waiting') as QueueItem['status'],
    callCount: Number(value('callCount', 'call_count') || 0),
    lastCalledAt: value('lastCalledAt', 'last_called_at') || undefined,
    servicePointNote: value('servicePointNote', 'service_point_note') || undefined,
    consultationServiceId: value('consultationServiceId', 'consultation_service_id')
      ? Number(value('consultationServiceId', 'consultation_service_id'))
      : undefined,
    consultationServiceCode: value('consultationServiceCode', 'consultation_service_code') || undefined,
    consultationType: value('consultationType', 'consultation_type') || undefined,
    consultationFee:
      value('consultationFee', 'consultation_fee') !== undefined ? Number(value('consultationFee', 'consultation_fee')) : undefined,
    patientCategory: value('patientCategory', 'patient_category') || undefined,
    patientSubCategory: value('patientSubCategory', 'patient_sub_category') || undefined,
    consultationPriceSource: value('consultationPriceSource', 'consultation_price_source') || undefined,
    freeConsultation: Boolean(value('freeConsultation', 'free_consultation')),
    freeConsultationAllowedBy: value('freeConsultationAllowedBy', 'free_consultation_allowed_by') || undefined,
  };
};

export function useQueue(staffName: string) {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const load = useCallback(async () => {
    const rows = await apiClient.getEntity('queue');
    setQueue(rows.map(toQueueItem));
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

  const route = useCallback(
    async (id: string, station: QueueStation) => {
      try {
        const result = await apiClient.routeQueueEntry(id, station);
        setQueue((current) => current.map((q) => (q.id === id ? { ...moveTo(q, station), ...toQueueItem(result) } : q)));
        return true;
      } catch (error) {
        window.alert((error as Error).message || 'The queue route could not be saved.');
        return false;
      }
    },
    [],
  );

  const moveStation = useCallback(
    (id: string, station: QueueStation, patients: Patient[]) => {
      const target = queue.find((q) => q.id === id);
      if (!target) return;
      if (blockedAtBilling(target, patients, station)) {
        window.alert('Select the consultation type and complete Cashier payment before moving this cash patient from Billing.');
        return;
      }
      void route(id, station);
    },
    [queue, route],
  );

  const completeAndNext = useCallback(
    (id: string, patients: Patient[], station?: QueueStation) => {
      const target = queue.find((q) => q.id === id);
      if (!target) return;
      if (blockedAtBilling(target, patients)) {
        window.alert('Select the consultation type and complete Cashier payment before moving this cash patient from Billing.');
        return;
      }
      const nextStation = station || getNextQueueStation(target.currentStation, target);
      if (nextStation) void route(id, nextStation);
    },
    [queue, route],
  );

  const recordConsultationPayment = useCallback(
    async (
      id: string,
      payment: { paymentMethod: 'Cash' | 'M-Pesa' | 'Card' | 'Bank Transfer'; reference?: string },
    ) => {
      const result = await apiClient.recordQueueConsultationPayment(id, payment);
      setQueue((current) => current.map((item) => (item.id === id ? toQueueItem(result.data) : item)));
      return result;
    },
    [],
  );

  const continueAfterPayment = useCallback(async (id: string) => {
    const result = await apiClient.continueQueueAfterPayment(id);
    setQueue((current) => current.map((item) => (item.id === id ? toQueueItem(result.data) : item)));
    return result;
  }, []);

  const setPriority = useCallback((id: string, priority: TriageCategory) => update(id, (q) => ({ ...q, priority })), [update]);

  const enqueue = useCallback(
    async (patient: Patient, service: any, fee: number, patientSubCategory: string): Promise<EnqueueResult> => {
      if (!service) return { success: false, error: 'Select a consultation service first.' };
      if (queue.some((q) => q.patientId === patient.id && q.currentStation !== 'Discharged' && isWithin24Hours(q.arrivedTime))) {
        return { success: false, error: `${patient.name} is already in the active patient queue.` };
      }
      const method = String(patient.insuranceProvider || '').trim();
      const free = Number(fee) <= 0;
      const cash = isCash(method) && !free;
      const note = free
        ? `Free consultation: ${service.name}, queued by ${staffName || 'staff'}. Proceed to Triage.`
        : cash
          ? `Cash patient: ${service.name} selected at KSh ${Number(fee).toLocaleString()}. Triage first; payment is due at Billing afterward.`
          : `${service.name} selected for ${patientSubCategory || 'patient sub-category'}. Proceed to Triage.`;
      try {
        let visitId = patient.visitId ? String(patient.visitId) : '';
        if (!visitId) {
          const visit = await apiClient.createVisit(patient.id, { source: 'Registration' });
          visitId = String(visit?.id || '');
        }
        if (!visitId) return { success: false, error: 'No visit was found for this patient.' };
        const result = await apiClient.createQueueEntry({
          patientId: patient.id,
          visitId,
          consultationServiceId: Number(service.id),
          consultationServiceCode: service.code,
          consultationServiceName: service.name,
          consultationType: service.name,
          consultationFee: Number(fee),
          consultationFeePaid: !cash,
          paymentMethod: method,
          patientSubCategory,
          patientCategory: patient.patientCategory,
          ...(patient.schemeId ? { schemeId: Number(patient.schemeId) } : {}),
          ...(free ? { freeConsultation: true } : {}),
          servicePointNote: note,
        });
        setQueue((current) => [toQueueItem(result.data), ...current]);
        return { success: true, destination: result.destination };
      } catch (error) {
        return { success: false, error: (error as Error).message || 'The patient could not be added to the queue.' };
      }
    },
    [queue, staffName],
  );

  return {
    queue,
    load,
    call,
    route,
    moveStation,
    completeAndNext,
    recordConsultationPayment,
    continueAfterPayment,
    setPriority,
    enqueue,
  };
}
