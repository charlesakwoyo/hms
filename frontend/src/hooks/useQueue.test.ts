import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { getNextQueueStation, useQueue } from './useQueue';
import { apiClient } from '../services/apiClient';
import type { Patient } from '../types';

vi.mock('../services/apiClient', () => ({
  apiClient: {
    getEntity: vi.fn(),
    persistEntity: vi.fn(),
    createVisit: vi.fn(),
    createQueueEntry: vi.fn(),
    routeQueueEntry: vi.fn(),
    recordQueueConsultationPayment: vi.fn(),
    continueQueueAfterPayment: vi.fn(),
  },
}));

const patient: Patient = {
  id: 'P-1001',
  name: 'Mary Wanjiku',
  age: 32,
  dob: '1994-01-01',
  gender: 'Female',
  phone: '0712345678',
  nationalId: '31920844',
  address: 'Nairobi',
  emergencyContact: 'Peter Wanjiku',
  emergencyPhone: '0700000001',
  bloodGroup: 'O+',
  allergies: 'None',
  insuranceProvider: 'SHA / NHIF',
  registeredDate: '2026-11-20',
  status: 'Registered',
};

const service = { id: 4, code: 'CONS-GEN', name: 'General Consultation' };

describe('useQueue', () => {
  beforeEach(() => {
    vi.mocked(apiClient.createVisit).mockResolvedValue({ id: 'V-1001' });
    vi.mocked(apiClient.createQueueEntry).mockResolvedValue({
      id: 'Q-1001',
      ticketNumber: 'T-1001',
      destination: 'Triage',
      data: {
        id: 'Q-1001',
        ticket_number: 'T-1001',
        patient_id: patient.id,
        patient_name: patient.name,
        arrived_time: new Date().toISOString(),
        current_station: 'Triage',
        status: 'Waiting',
      },
    });
    vi.mocked(apiClient.routeQueueEntry).mockResolvedValue({
      id: 'Q-1001',
      current_station: 'Consultation',
      status: 'Waiting',
    });
  });

  it('routes unpaid routine cash visits from triage to billing and avoids automatic ancillary/discharge steps', () => {
    expect(getNextQueueStation('Registration')).toBe('Triage');
    expect(getNextQueueStation('Triage')).toBe('Consultation');
    expect(
      getNextQueueStation('Triage', {
        priority: 'Normal',
        paymentMethod: 'Cash / M-Pesa',
        consultationFeePaid: false,
      }),
    ).toBe('Billing');
    expect(
      getNextQueueStation('Triage', {
        priority: 'Emergency',
        paymentMethod: 'Cash / M-Pesa',
        consultationFeePaid: false,
      }),
    ).toBe('Consultation');
    expect(getNextQueueStation('Consultation')).toBeNull();
    expect(getNextQueueStation('Laboratory')).toBeNull();
    expect(getNextQueueStation('Pharmacy')).toBeNull();
    expect(getNextQueueStation('Billing')).toBeNull();
  });

  it('creates a server queue entry and opens a visit when needed', async () => {
    const { result } = renderHook(() => useQueue('Test Nurse'));

    let enqueueResult: Awaited<ReturnType<ReturnType<typeof useQueue>['enqueue']>> | undefined;
    await act(async () => {
      enqueueResult = await result.current.enqueue(patient, service, 0, 'SHA Inpatient');
    });

    expect(enqueueResult).toEqual({ success: true, destination: 'Triage' });
    expect(apiClient.createVisit).toHaveBeenCalledWith('P-1001', { source: 'Registration' });
    expect(apiClient.createQueueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 'P-1001', visitId: 'V-1001', consultationServiceId: 4 }),
    );
    expect(result.current.queue[0].currentStation).toBe('Triage');
  });

  it('routes queue movements through the server', async () => {
    const { result } = renderHook(() => useQueue('Test Nurse'));

    await act(async () => {
      await result.current.enqueue(patient, service, 0, 'SHA Inpatient');
    });
    await act(async () => {
      result.current.moveStation('Q-1001', 'Consultation', []);
      await Promise.resolve();
    });

    await waitFor(() => expect(apiClient.routeQueueEntry).toHaveBeenCalledWith('Q-1001', 'Consultation'));
    await waitFor(() => expect(result.current.queue[0].currentStation).toBe('Consultation'));
  });

  it('records cashier payment after triage and routes the patient from billing to consultation', async () => {
    const cashPatient = { ...patient, insuranceProvider: 'Cash / M-Pesa' };
    vi.mocked(apiClient.createQueueEntry).mockResolvedValueOnce({
      id: 'Q-CASH-1',
      ticketNumber: 'B-1001',
      destination: 'Triage',
      data: {
        id: 'Q-CASH-1',
        ticket_number: 'B-1001',
        patient_id: cashPatient.id,
        patient_name: cashPatient.name,
        arrived_time: new Date().toISOString(),
        current_station: 'Triage',
        payment_method: 'Cash / M-Pesa',
        consultation_fee_paid: 0,
        consultation_fee: 500,
        status: 'Waiting',
      },
    });
    vi.mocked(apiClient.routeQueueEntry).mockResolvedValueOnce({
      id: 'Q-CASH-1',
      current_station: 'Billing',
      status: 'Waiting',
    });
    vi.mocked(apiClient.recordQueueConsultationPayment).mockResolvedValueOnce({
      invoiceId: 'INV-1001',
      destination: 'Consultation',
      data: {
        id: 'Q-CASH-1',
        ticket_number: 'B-1001',
        patient_id: cashPatient.id,
        patient_name: cashPatient.name,
        arrived_time: new Date().toISOString(),
        current_station: 'Consultation',
        payment_method: 'Cash / M-Pesa',
        consultation_fee_paid: 1,
        consultation_fee: 500,
        status: 'Waiting',
      },
    });
    const { result } = renderHook(() => useQueue('Test Cashier'));
    let paymentResult: Awaited<ReturnType<ReturnType<typeof useQueue>['recordConsultationPayment']>> | undefined;

    await act(async () => {
      await result.current.enqueue(cashPatient, service, 500, 'Cash');
    });
    await act(async () => {
      result.current.completeAndNext('Q-CASH-1', []);
      await Promise.resolve();
    });
    await act(async () => {
      paymentResult = await result.current.recordConsultationPayment('Q-CASH-1', { paymentMethod: 'Cash' });
    });

    expect(apiClient.routeQueueEntry).toHaveBeenCalledWith('Q-CASH-1', 'Billing');
    expect(apiClient.recordQueueConsultationPayment).toHaveBeenCalledWith('Q-CASH-1', { paymentMethod: 'Cash' });
    expect(paymentResult).toMatchObject({ invoiceId: 'INV-1001', destination: 'Consultation' });
    expect(result.current.queue[0]).toMatchObject({
      id: 'Q-CASH-1',
      currentStation: 'Consultation',
      consultationFeePaid: true,
    });
  });

  it('can continue a confirmed paid queue entry from Billing after a stale state', async () => {
    vi.mocked(apiClient.getEntity).mockResolvedValueOnce([
      {
        id: 'Q-CASH-2',
        ticket_number: 'B-1002',
        patient_id: patient.id,
        patient_name: patient.name,
        arrived_time: new Date().toISOString(),
        current_station: 'Billing',
        payment_method: 'Cash / M-Pesa',
        consultation_fee_paid: 1,
        status: 'Waiting',
      },
    ]);
    vi.mocked(apiClient.continueQueueAfterPayment).mockResolvedValueOnce({
      destination: 'Consultation',
      data: {
        id: 'Q-CASH-2',
        ticket_number: 'B-1002',
        patient_id: patient.id,
        patient_name: patient.name,
        arrived_time: new Date().toISOString(),
        current_station: 'Consultation',
        payment_method: 'Cash / M-Pesa',
        consultation_fee_paid: 1,
        status: 'Waiting',
      },
    });
    const { result } = renderHook(() => useQueue('Test Nurse'));
    let response: Awaited<ReturnType<ReturnType<typeof useQueue>['continueAfterPayment']>> | undefined;

    await act(async () => {
      await result.current.load();
      response = await result.current.continueAfterPayment('Q-CASH-2');
    });

    expect(apiClient.continueQueueAfterPayment).toHaveBeenCalledWith('Q-CASH-2');
    expect(response?.destination).toBe('Consultation');
    expect(result.current.queue[0]).toMatchObject({ id: 'Q-CASH-2', currentStation: 'Consultation' });
  });

  it('keeps an active queue entry visible after it has been waiting over 24 hours', async () => {
    vi.mocked(apiClient.getEntity).mockResolvedValueOnce([
      {
        id: 'Q-OLD-1',
        ticket_number: 'T-OLD-1',
        patient_id: patient.id,
        patient_name: patient.name,
        arrived_time: '2026-11-20T08:00:00.000Z',
        current_station: 'Consultation',
        status: 'Waiting',
      },
    ]);
    const { result } = renderHook(() => useQueue('Test Nurse'));

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0]).toMatchObject({ id: 'Q-OLD-1', currentStation: 'Consultation' });
  });
});
