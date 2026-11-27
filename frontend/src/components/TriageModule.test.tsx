import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TriageModule } from './TriageModule';
import { apiClient } from '../services/apiClient';

vi.mock('../services/apiClient', () => ({
  apiClient: {
    getTriageWorklist: vi.fn(),
    saveTriageAssessment: vi.fn(),
  },
}));

const entry = {
  queueId: 'Q-TRIAGE-1',
  ticketNumber: 'T-1001',
  patientId: 'P-1001',
  patientName: 'Mary Wanjiku',
  visitId: 'V-1001',
  arrivedTime: new Date().toISOString(),
  priority: 'Normal' as const,
  paymentMethod: 'Cash / M-Pesa',
  consultationFeePaid: false,
  status: 'Waiting' as const,
  age: 32,
  dob: '1994-01-01',
  gender: 'Female',
  phone: '0700000000',
  bloodGroup: 'O+',
  allergies: 'None',
  assessment: null,
};

describe('TriageModule', () => {
  beforeEach(() => {
    vi.mocked(apiClient.getTriageWorklist).mockResolvedValue([entry]);
    vi.mocked(apiClient.saveTriageAssessment).mockResolvedValue({
      id: 'TRI-1',
      presentingComplaint: 'Headache',
      systolic: 120,
      diastolic: 80,
      pulse: 72,
      temperature: 36.8,
      respiratoryRate: 16,
      spo2: 98,
      weightKg: null,
      heightCm: null,
      bmi: null,
      triageCategory: 'Normal',
      nurseNotes: null,
      recordedBy: 'Triage Nurse',
      recordedAt: new Date().toISOString(),
    });
  });

  it('opens a waiting patient assessment, saves it, then routes unpaid cash to billing', async () => {
    const onRoute = vi.fn().mockResolvedValue(true);
    render(<TriageModule queue={[]} onRoute={onRoute} />);

    await screen.findByText('Mary Wanjiku');
    fireEvent.click(screen.getByRole('button', { name: 'Open Triage' }));
    fireEvent.change(screen.getByLabelText(/Presenting complaint/), { target: { value: 'Headache' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Assessment' }));

    await waitFor(() => expect(apiClient.saveTriageAssessment).toHaveBeenCalledWith(
      'Q-TRIAGE-1',
      expect.objectContaining({ presentingComplaint: 'Headache', triageCategory: 'Normal' }),
    ));
    fireEvent.click(await screen.findByRole('button', { name: 'Complete Triage' }));

    await waitFor(() => expect(onRoute).toHaveBeenCalledWith('Q-TRIAGE-1', 'Billing'));
  });

  it('routes emergency patients onward without requiring payment', async () => {
    const onRoute = vi.fn().mockResolvedValue(true);
    render(<TriageModule queue={[]} onRoute={onRoute} />);

    await screen.findByText('Mary Wanjiku');
    fireEvent.click(screen.getByRole('button', { name: 'Open Triage' }));
    fireEvent.change(screen.getByLabelText(/Presenting complaint/), { target: { value: 'Urgent concern' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Emergency' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Assessment' }));

    await screen.findByText('Assessment saved.');
    fireEvent.click(screen.getByRole('button', { name: 'Send to Consultation (Emergency)' }));
    await waitFor(() => expect(onRoute).toHaveBeenCalledWith('Q-TRIAGE-1', 'Consultation'));
  });
});
