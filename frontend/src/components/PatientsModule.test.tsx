import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PatientsModule } from './PatientsModule';
import { apiClient } from '../services/apiClient';
import type { Patient, PatientSaveOutcome } from '../types';

vi.mock('../services/apiClient', () => ({
  apiClient: {
    getPatients: vi.fn(),
    getSetupEntity: vi.fn(),
    getPatient: vi.fn(),
    getPatientActivity: vi.fn(),
    setPatientStatus: vi.fn(),
    createVisit: vi.fn(),
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
  insuranceProvider: 'Cash / M-Pesa',
  registeredDate: '2026-11-20',
  status: 'Registered',
};

const page = {
  data: [patient],
  meta: { currentPage: 1, lastPage: 1, perPage: 25, total: 1, from: 1, to: 1 },
};

const duplicate: PatientSaveOutcome = {
  success: false,
  code: 'duplicate_patient',
  error: 'Possible duplicate patient found.',
  overrideToken: 'override-token',
  matches: [
    {
      id: 'P-1002',
      patientNumber: 'P-1002',
      name: 'Mary Wanjiku',
      phone: '0712345678',
      dob: '1994-01-01',
      nationalId: '31920844',
      lastVisit: null,
      reasons: ['Exact phone'],
    },
  ],
};

describe('PatientsModule', () => {
  beforeEach(() => {
    vi.mocked(apiClient.getPatients).mockResolvedValue(page);
    vi.mocked(apiClient.getSetupEntity).mockResolvedValue([]);
    vi.mocked(apiClient.getPatient).mockResolvedValue(patient);
    vi.mocked(apiClient.getPatientActivity).mockResolvedValue([]);
  });

  it('uses server pagination results', async () => {
    render(
      <PatientsModule
        patients={[]}
        onAddPatient={vi.fn()}
        onSendToTriage={vi.fn()}
        can={() => true}
      />,
    );

    expect(await screen.findByText('Mary Wanjiku')).toBeTruthy();
    expect(vi.mocked(apiClient.getPatients).mock.calls[0][0]).toMatchObject({ page: 1, perPage: 25 });
    expect(screen.getByText(/Showing/)).toBeTruthy();
  });

  it('requires patient.merge before allowing a duplicate override', async () => {
    const onAddPatient = vi
      .fn()
      .mockResolvedValueOnce(duplicate)
      .mockResolvedValueOnce({ success: true, patient });
    const can = (right: string | string[]) => {
      const rights = Array.isArray(right) ? right : [right];
      return !rights.includes('patient.merge') && !rights.includes('patient:merge');
    };

    render(
      <PatientsModule
        patients={[]}
        onAddPatient={onAddPatient}
        onSendToTriage={vi.fn()}
        can={can}
      />,
    );

    await screen.findByText('Mary Wanjiku');
    fireEvent.click(screen.getByText('Register New Patient'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Samuel Mutua Kilonzo'), { target: { value: 'Mary Wanjiku' } });
    fireEvent.change(screen.getAllByPlaceholderText('07XX XXX XXX')[0], { target: { value: '0712345678' } });
    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    expect(await screen.findByText('Possible duplicate patient found')).toBeTruthy();
    expect(screen.queryByText('Proceed — register as a new patient')).toBeNull();
    expect(screen.getByText(/Only a System Administrator/)).toBeTruthy();
  });

  it('sends the duplicate override token when an authorized user confirms', async () => {
    const onAddPatient = vi
      .fn()
      .mockResolvedValueOnce(duplicate)
      .mockResolvedValueOnce({ success: true, patient });

    render(
      <PatientsModule
        patients={[]}
        onAddPatient={onAddPatient}
        onSendToTriage={vi.fn()}
        can={() => true}
      />,
    );

    await screen.findByText('Mary Wanjiku');
    fireEvent.click(screen.getByText('Register New Patient'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Samuel Mutua Kilonzo'), { target: { value: 'Mary Wanjiku' } });
    fireEvent.change(screen.getAllByPlaceholderText('07XX XXX XXX')[0], { target: { value: '0712345678' } });
    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    const proceed = await screen.findByText('Proceed — register as a new patient');
    fireEvent.click(proceed);

    await waitFor(() => expect(onAddPatient).toHaveBeenCalledTimes(2));
    expect(onAddPatient.mock.calls[1][0]).toMatchObject({ duplicateOverrideToken: 'override-token', overrideConfirmed: true });
  });
});
