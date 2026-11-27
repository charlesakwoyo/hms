import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsultationModule } from './ConsultationModule';
import { apiClient } from '../services/apiClient';

vi.mock('../services/apiClient', () => ({
  apiClient: {
    getConsultationWorklist: vi.fn(),
    getConsultationEncounter: vi.fn(),
    searchDiagnosisCatalog: vi.fn(),
    addConsultationDiagnosis: vi.fn(),
    saveConsultationNotes: vi.fn(),
    saveConsultationDisposition: vi.fn(),
    searchLaboratoryCatalog: vi.fn(),
    orderLaboratoryTests: vi.fn(),
  },
}));

const worklistEntry = {
  queueId: 'Q-CONSULT-1',
  ticketNumber: 'T-1001',
  patientId: 'P-1001',
  patientName: 'Lucy Nyambura',
  visitId: 'V-1001',
  arrivedTime: new Date().toISOString(),
  priority: 'Normal' as const,
  paymentMethod: 'SHA',
  consultationFeePaid: true,
  consultationType: 'General Consultation',
  age: 34,
  dob: '1992-01-01',
  gender: 'Female',
  phone: '0700000000',
  bloodGroup: 'O+',
  allergies: 'None',
  dispositionOutcome: null,
  dispositionStatus: null,
};

const encounter = {
  patient: {
    id: 'P-1001',
    name: 'Lucy Nyambura',
    age: 34,
    dob: '1992-01-01',
    gender: 'Female',
    phone: '0700000000',
    bloodGroup: 'O+',
    allergies: 'None',
  },
  queue: {
    id: 'Q-CONSULT-1',
    ticketNumber: 'T-1001',
    visitId: 'V-1001',
    priority: 'Normal' as const,
    paymentMethod: 'SHA',
    consultationFeePaid: true,
    consultationType: 'General Consultation',
  },
  triage: {
    presentingComplaint: 'Headache',
    systolic: 120,
    diastolic: 80,
    pulse: 70,
    temperature: 36.7,
    respiratoryRate: 16,
    spo2: 99,
    weightKg: 60,
    heightCm: 165,
    triageCategory: 'Normal',
    nurseNotes: 'Alert',
    recordedAt: new Date().toISOString(),
  },
  consultation: null,
  diagnoses: [],
  labOrders: [],
  disposition: null,
};

describe('ConsultationModule', () => {
  beforeEach(() => {
    vi.mocked(apiClient.getConsultationWorklist).mockResolvedValue([worklistEntry]);
    vi.mocked(apiClient.getConsultationEncounter).mockResolvedValue(encounter);
    vi.mocked(apiClient.searchDiagnosisCatalog).mockResolvedValue([
      { id: 8, code: 'TEST-HEADACHE', title: 'Headache', chapter: 'Symptoms' },
    ]);
    vi.mocked(apiClient.addConsultationDiagnosis).mockResolvedValue({
      consultationId: 'CON-1',
      diagnosis: { id: 1, code: 'TEST-HEADACHE', title: 'Headache', type: 'Primary' },
    });
    vi.mocked(apiClient.saveConsultationNotes).mockResolvedValue({ consultationId: 'CON-1', status: 'Draft' });
    vi.mocked(apiClient.saveConsultationDisposition).mockResolvedValue({
      id: 'DISP-1',
      outcome: 'Admission',
      status: 'Admission Requested',
      visitId: 'V-1001',
    });
    vi.mocked(apiClient.searchLaboratoryCatalog).mockResolvedValue([
      { id: 21, code: 'FBC', name: 'Full Blood Count', department: 'Haematology', specimen_type: 'Blood' },
      { id: 22, code: 'CRP', name: 'C-Reactive Protein', department: 'Chemistry', specimen_type: 'Blood' },
    ]);
    vi.mocked(apiClient.orderLaboratoryTests).mockResolvedValue({
      orders: [
        { id: 'LAB-1', code: 'FBC', testName: 'Full Blood Count', status: 'Pending' },
        { id: 'LAB-2', code: 'CRP', testName: 'C-Reactive Protein', status: 'Pending' },
      ],
      destination: 'Laboratory',
      deferredForEmergency: false,
    });
  });

  it('opens the patient encounter and adds a diagnosis from the catalogue', async () => {
    render(<ConsultationModule />);
    await screen.findByText('Lucy Nyambura');
    fireEvent.click(screen.getByRole('button', { name: /Open Encounter/ }));

    await screen.findByRole('heading', { name: 'SOAP Notes' });
    fireEvent.click(screen.getByRole('button', { name: 'Vitals' }));
    expect(await screen.findByText('Headache')).toBeTruthy();
    expect(screen.getByText('120/80 mmHg')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Diagnoses' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
    fireEvent.change(screen.getByPlaceholderText('Search by code or description'), { target: { value: 'headache' } });
    fireEvent.click(await screen.findByRole('button', { name: /TEST-HEADACHE Headache/ }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add Diagnosis' }));

    await waitFor(() => expect(apiClient.addConsultationDiagnosis).toHaveBeenCalledWith(
      'Q-CONSULT-1',
      { catalogId: 8, type: 'Primary' },
    ));
    expect((await screen.findByRole('status')).textContent).toContain('Diagnosis added to this encounter.');
  });

  it('opens admission and discharge workflow sections', async () => {
    render(<ConsultationModule />);
    await screen.findByText('Lucy Nyambura');
    fireEvent.click(screen.getByRole('button', { name: /Open Encounter/ }));
    await screen.findByRole('heading', { name: 'SOAP Notes' });

    expect(screen.getByTitle('Prescriptions section is not implemented yet')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Admission' }));
    expect(await screen.findByRole('heading', { name: 'Request Admission' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close Encounter' }));
    expect(await screen.findByRole('heading', { name: 'Discharge & Close Visit' })).toBeTruthy();
  });

  it('records an admission request with urgency and reason without closing the visit', async () => {
    render(<ConsultationModule />);
    await screen.findByText('Lucy Nyambura');
    fireEvent.click(screen.getByRole('button', { name: /Open Encounter/ }));
    await screen.findByRole('heading', { name: 'SOAP Notes' });
    fireEvent.click(screen.getByRole('button', { name: 'Admission' }));
    fireEvent.change(screen.getByLabelText('Admission urgency'), { target: { value: 'Urgent' } });
    fireEvent.change(screen.getByLabelText('Clinical reason for admission'), { target: { value: 'Needs inpatient observation' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request Admission' }));

    await waitFor(() => expect(apiClient.saveConsultationDisposition).toHaveBeenCalledWith('Q-CONSULT-1', {
      outcome: 'Admission',
      reason: 'Needs inpatient observation',
      urgency: 'Urgent',
    }));
    expect((await screen.findByRole('status')).textContent).toContain('The visit remains open in Consultation');
  });

  it('discharges only with a saved plan and discharge instructions', async () => {
    vi.mocked(apiClient.getConsultationEncounter).mockResolvedValue({
      ...encounter,
      consultation: {
        id: 'CON-1',
        chiefComplaint: 'Headache',
        historyOfPresentIllness: 'Headache since yesterday',
        examinationFindings: 'No focal deficit',
        provisionalDiagnosis: 'Headache',
        icdCode: null,
        managementPlan: 'Rest and return if symptoms worsen.',
        status: 'Draft',
      },
    });
    render(<ConsultationModule />);
    await screen.findByText('Lucy Nyambura');
    fireEvent.click(screen.getByRole('button', { name: /Open Encounter/ }));
    await screen.findByRole('heading', { name: 'SOAP Notes' });
    fireEvent.click(screen.getByRole('button', { name: 'Close Encounter' }));
    fireEvent.change(screen.getByLabelText('Discharge instructions and follow-up'), {
      target: { value: 'Return if symptoms worsen; follow up in one week.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Discharge & Close Visit' }));

    await waitFor(() => expect(apiClient.saveConsultationDisposition).toHaveBeenCalledWith('Q-CONSULT-1', {
      outcome: 'Discharge',
      instructions: 'Return if symptoms worsen; follow up in one week.',
    }));
    expect((await screen.findByRole('status')).textContent).toContain('visit closed');
  });

  it('lets the clinician record and save all four SOAP sections as a draft', async () => {
    vi.mocked(apiClient.getConsultationEncounter)
      .mockResolvedValueOnce(encounter)
      .mockResolvedValueOnce({
        ...encounter,
        consultation: {
          id: 'CON-1',
          chiefComplaint: 'Headache',
          historyOfPresentIllness: 'Headache since yesterday',
          examinationFindings: 'No focal deficit',
          provisionalDiagnosis: 'Working diagnosis under review',
          icdCode: null,
          managementPlan: 'Review after investigations',
          status: 'Draft',
        },
      });
    render(<ConsultationModule />);
    await screen.findByText('Lucy Nyambura');
    fireEvent.click(screen.getByRole('button', { name: /Open Encounter/ }));
    await screen.findByRole('heading', { name: 'SOAP Notes' });

    fireEvent.click(screen.getByRole('button', { name: 'SOAP Notes' }));

    expect((screen.getByRole('textbox', { name: 'S — Subjective' }) as HTMLTextAreaElement).value).toBe('Headache');
    fireEvent.change(screen.getByRole('textbox', { name: 'S — Subjective' }), { target: { value: 'Headache since yesterday' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'O — Objective' }), { target: { value: 'No focal deficit' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'A — Assessment' }), { target: { value: 'Working diagnosis under review' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'P — Plan' }), { target: { value: 'Review after investigations' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save SOAP Notes' }));

    await waitFor(() => expect(apiClient.saveConsultationNotes).toHaveBeenCalledWith('Q-CONSULT-1', {
      subjective: 'Headache since yesterday',
      objective: 'No focal deficit',
      assessment: 'Working diagnosis under review',
      plan: 'Review after investigations',
    }));
    expect((await screen.findByRole('status')).textContent).toContain('SOAP notes saved as a draft.');
  });

  it('shows verified laboratory results to the clinician', async () => {
    vi.mocked(apiClient.getConsultationEncounter).mockResolvedValue({
      ...encounter,
      labOrders: [{
        id: 'LAB-1',
        testName: 'Full Blood Count',
        code: 'FBC',
        status: 'Verified',
        clinicalIndication: 'Evaluate persistent fever',
        requestedAt: new Date().toISOString(),
        resultValue: 'Within expected range',
        referenceRange: '4.0-10.0',
        resultNotes: 'Sample processed.',
        resultEnteredBy: 'Lab technician',
        verifiedBy: 'Lab supervisor',
        verifiedAt: new Date().toISOString(),
      }],
    });
    render(<ConsultationModule />);
    await screen.findByText('Lucy Nyambura');
    fireEvent.click(screen.getByRole('button', { name: /Open Encounter/ }));
    await screen.findByRole('heading', { name: 'SOAP Notes' });
    fireEvent.click(screen.getByRole('button', { name: 'Lab Results' }));

    expect(await screen.findByText('Verified Laboratory Results')).toBeTruthy();
    expect(screen.getByText('Within expected range')).toBeTruthy();
    expect(screen.getByText(/Verified by Lab supervisor/)).toBeTruthy();
  });

  it('places configured lab orders and routes the patient to the Laboratory queue', async () => {
    render(<ConsultationModule />);
    await screen.findByText('Lucy Nyambura');
    fireEvent.click(screen.getByRole('button', { name: /Open Encounter/ }));
    await screen.findByRole('heading', { name: 'SOAP Notes' });
    fireEvent.click(screen.getByRole('button', { name: 'Orders' }));
    fireEvent.change(screen.getByPlaceholderText('Search by test name or code'), { target: { value: 'blood' } });

    fireEvent.click(await screen.findByRole('button', { name: 'Select Full Blood Count' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select C-Reactive Protein' }));
    fireEvent.change(screen.getByPlaceholderText('Why is this test clinically indicated?'), { target: { value: 'Evaluate persistent fever' } });
    fireEvent.click(screen.getByRole('button', { name: 'Place Orders & Send to Laboratory' }));

    await waitFor(() => expect(apiClient.orderLaboratoryTests).toHaveBeenCalledWith('Q-CONSULT-1', {
      testIds: [21, 22],
      clinicalIndication: 'Evaluate persistent fever',
    }));
    expect((await screen.findByRole('status')).textContent).toContain('2 laboratory orders placed. Patient routed to the Laboratory queue.');
    expect(apiClient.getConsultationWorklist).toHaveBeenCalledTimes(2);
  });
});
