import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InpatientModule } from './InpatientModule';
import { apiClient } from '../services/apiClient';

vi.mock('../services/apiClient', () => ({
  apiClient: {
    getInpatientAdmissionRequests: vi.fn(),
    getAvailableInpatientBeds: vi.fn(),
    getInpatientAdmissions: vi.fn(),
    acceptInpatientAdmission: vi.fn(),
    declineInpatientAdmission: vi.fn(),
    dischargeInpatientAdmission: vi.fn(),
    getInpatientClinicalChart: vi.fn(),
    saveInpatientAdmissionNotes: vi.fn(),
    signInpatientAdmissionNotes: vi.fn(),
    saveInpatientDoctorNote: vi.fn(),
    saveInpatientWardRound: vi.fn(),
    saveInpatientVitals: vi.fn(),
  },
}));

const request = {
  id: 'DISP-1',
  queueId: 'Q-1',
  ticketNumber: 'T-1',
  patientId: 'P-1',
  patientName: 'Jane Doe',
  visitId: 'V-1',
  age: 40,
  gender: 'Female',
  phone: '0700000000',
  reason: 'Requires inpatient observation.',
  urgency: 'Urgent' as const,
  requestedBy: 'Dr Test',
  requestedAt: new Date().toISOString(),
  queueStation: 'Consultation',
};

const bed = {
  id: 101,
  bedNumber: 'B-01',
  wardId: 'WARD-1',
  wardName: 'Medical Ward',
  bedType: 'Standard',
  dailyCharge: 1000,
};

const admission = {
  id: 'IPD-1',
  patientId: 'P-1',
  patientName: 'Jane Doe',
  wardId: 'WARD-1',
  wardName: 'Medical Ward',
  bedId: 101,
  bedNumber: 'B-01',
  admittedAt: new Date().toISOString(),
  admittingDoctor: 'Dr Test',
  diagnosis: 'Requires inpatient observation.',
  visitId: 'V-1',
};

describe('InpatientModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.getInpatientAdmissionRequests).mockResolvedValue([request]);
    vi.mocked(apiClient.getAvailableInpatientBeds).mockResolvedValue([bed]);
    vi.mocked(apiClient.getInpatientAdmissions).mockResolvedValue([admission]);
    vi.mocked(apiClient.acceptInpatientAdmission).mockResolvedValue({
      id: 'IPD-1',
      status: 'Admitted',
      wardName: 'Medical Ward',
      bedNumber: 'B-01',
    });
    vi.mocked(apiClient.declineInpatientAdmission).mockResolvedValue({ id: 'DISP-1', status: 'Declined' });
    vi.mocked(apiClient.dischargeInpatientAdmission).mockResolvedValue({
      id: 'IPD-1',
      status: 'Discharged',
      visitId: 'V-1',
    });
    vi.mocked(apiClient.getInpatientClinicalChart).mockResolvedValue({
      admission: {
        id: 'IPD-1',
        patientId: 'P-1',
        patientName: 'Jane Doe',
        wardName: 'Medical Ward',
        bedNumber: 'B-01',
        admittedAt: new Date().toISOString(),
        diagnosis: 'Requires inpatient observation.',
        status: 'Admitted',
      },
      admissionNotes: null,
      doctorNotes: [],
      wardRounds: [],
      vitals: [],
    });
    vi.mocked(apiClient.saveInpatientDoctorNote).mockResolvedValue({ id: 'NOTE-1', notedAt: new Date().toISOString() });
  });

  it('accepts a pending request only after selecting an available bed', async () => {
    render(<InpatientModule view="admission" />);
    await screen.findByRole('heading', { name: 'Jane Doe' });
    fireEvent.change(screen.getByLabelText('Assign an available bed'), { target: { value: '101' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm admission' }));

    await waitFor(() => expect(apiClient.acceptInpatientAdmission).toHaveBeenCalledWith('DISP-1', 101));
    expect((await screen.findByRole('status')).textContent).toContain('assigned to Medical Ward, bed B-01.');
  });

  it('discharges an admitted patient with a saved summary', async () => {
    render(<InpatientModule view="admitted" />);
    await screen.findByRole('heading', { name: 'Jane Doe (P-1)' });
    fireEvent.change(screen.getByLabelText('Inpatient discharge summary and instructions'), {
      target: { value: 'Stable at discharge; follow up in one week.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Discharge patient & close visit' }));

    await waitFor(() => expect(apiClient.dischargeInpatientAdmission).toHaveBeenCalledWith(
      'IPD-1',
      'Stable at discharge; follow up in one week.',
    ));
    expect((await screen.findByRole('status')).textContent).toContain('has been discharged and the visit closed.');
  });

  it('records a doctor progress note in the selected active inpatient chart', async () => {
    render(<InpatientModule view="doctor_notes" />);
    await screen.findByRole('button', { name: 'Record progress note' });
    fireEvent.change(screen.getByLabelText('Diagnosis *'), { target: { value: 'Pneumonia' } });
    fireEvent.change(screen.getByLabelText('Subjective *'), { target: { value: 'Patient reports less cough.' } });
    fireEvent.change(screen.getByLabelText('Objective *'), { target: { value: 'Temperature 37.2 C.' } });
    fireEvent.change(screen.getByLabelText('Assessment *'), { target: { value: 'Clinically improving.' } });
    fireEvent.change(screen.getByLabelText('Plan *'), { target: { value: 'Continue current treatment.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record progress note' }));

    await waitFor(() => expect(apiClient.saveInpatientDoctorNote).toHaveBeenCalledWith('IPD-1', {
      icdCode: undefined,
      diagnosis: 'Pneumonia',
      subjective: 'Patient reports less cough.',
      objective: 'Temperature 37.2 C.',
      assessment: 'Clinically improving.',
      plan: 'Continue current treatment.',
    }));
    expect((await screen.findByRole('status')).textContent).toContain('Doctor progress note recorded.');
  });
});
