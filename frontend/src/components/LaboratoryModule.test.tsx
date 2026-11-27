import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LaboratoryModule } from './LaboratoryModule';
import { apiClient } from '../services/apiClient';

vi.mock('../services/apiClient', () => ({
  apiClient: {
    getLaboratoryWorklist: vi.fn(),
    collectLaboratorySpecimen: vi.fn(),
    rejectLaboratorySpecimen: vi.fn(),
    enterLaboratoryResult: vi.fn(),
    verifyLaboratoryResult: vi.fn(),
  },
}));

describe('LaboratoryModule', () => {
  const order = {
    orderId: 'LAB-1',
    patientId: 'P-1001',
    patientName: 'Lucy Nyambura',
    visitId: 'V-1001',
    ticketNumber: 'T-1001',
    testName: 'Full Blood Count',
    testCode: 'FBC',
    department: 'Haematology',
    specimenType: 'Blood',
    clinicalIndication: 'Evaluate persistent fever',
    status: 'Pending',
    accessionNo: null,
    recollectionCount: 0,
    rejectionReason: null,
    resultValue: null,
    referenceRange: null,
    resultNotes: null,
    collectedBy: null,
    receivedBy: null,
    collectedAt: null,
    resultEnteredBy: null,
    conductedBy: null,
    completedAt: null,
    verifiedBy: null,
    verifiedAt: null,
    requestedBy: 'Doctor Test User',
    requestedAt: new Date().toISOString(),
    priority: 'Normal',
  } as const;

  beforeEach(() => {
    vi.mocked(apiClient.getLaboratoryWorklist).mockResolvedValue([order]);
    vi.mocked(apiClient.collectLaboratorySpecimen).mockResolvedValue({ orderId: 'LAB-1', accessionNo: 'SPC-1', status: 'Collected' });
    vi.mocked(apiClient.rejectLaboratorySpecimen).mockResolvedValue({ orderId: 'LAB-1', status: 'Awaiting Recollection' });
    vi.mocked(apiClient.enterLaboratoryResult).mockResolvedValue({ orderId: 'LAB-1', status: 'Result Entered' });
    vi.mocked(apiClient.verifyLaboratoryResult).mockResolvedValue({
      orderId: 'LAB-1',
      status: 'Verified',
      destination: 'Consultation',
      returnedToConsultation: true,
    });
  });

  it('shows pending lab orders and filters by test name', async () => {
    render(<LaboratoryModule page="Orders" />);
    expect(await screen.findByText('Lucy Nyambura')).toBeTruthy();
    expect(screen.getByText('Evaluate persistent fever')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Search patient, order, ticket, or test'), { target: { value: 'unmatched' } });
    expect(screen.getByText('No matching orders found for your search or current status.')).toBeTruthy();
  });

  it('shows a laboratory visit summary', async () => {
    render(<LaboratoryModule page="Visits" />);
    expect(await screen.findByText('V-1001')).toBeTruthy();
    expect(screen.getByText('Lucy Nyambura')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
  });

  it('receives a specimen and records the generated accession number', async () => {
    render(<LaboratoryModule page="Specimen" />);
    await screen.findByText('Lucy Nyambura');
    fireEvent.click(screen.getByRole('button', { name: 'Receive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Receipt' }));

    expect((await screen.findByRole('status')).textContent).toContain('Specimen received. Accession number: SPC-1.');
    expect(apiClient.collectLaboratorySpecimen).toHaveBeenCalledWith('LAB-1', undefined);
  });

  it('requires a rejection reason and requests recollection', async () => {
    vi.mocked(apiClient.getLaboratoryWorklist).mockResolvedValue([{ ...order, status: 'Collected', accessionNo: 'SPC-1' }]);
    render(<LaboratoryModule page="Specimen" />);
    await screen.findByText('Lucy Nyambura');
    fireEvent.click(screen.getByRole('button', { name: 'Reject / Recollect' }));
    expect(screen.getByRole('button', { name: 'Reject & Request Recollection' }).hasAttribute('disabled')).toBe(true);
    fireEvent.change(screen.getByPlaceholderText('Document why recollection is required'), { target: { value: 'Specimen haemolysed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reject & Request Recollection' }));

    expect((await screen.findByRole('status')).textContent).toContain('Order is awaiting recollection');
    expect(apiClient.rejectLaboratorySpecimen).toHaveBeenCalledWith('LAB-1', 'Specimen haemolysed');
  });

  it('saves entered results for verification, then verifies them', async () => {
    vi.mocked(apiClient.getLaboratoryWorklist)
      .mockResolvedValueOnce([{ ...order, status: 'Collected', accessionNo: 'SPC-1' }])
      .mockResolvedValueOnce([{ ...order, status: 'Result Entered', accessionNo: 'SPC-1', resultValue: 'Within expected range' }])
      .mockResolvedValueOnce([]);
    render(<LaboratoryModule page="Results" />);
    await screen.findByText('Lucy Nyambura');
    fireEvent.click(screen.getByRole('button', { name: 'Enter Result' }));
    fireEvent.change(screen.getByPlaceholderText('Enter the observed result'), { target: { value: 'Within expected range' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Result for Verification' }));

    expect((await screen.findByRole('status')).textContent).toContain('Result saved and awaiting authorized verification.');
    expect(apiClient.enterLaboratoryResult).toHaveBeenCalledWith('LAB-1', {
      resultValue: 'Within expected range',
      referenceRange: undefined,
      notes: undefined,
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Verify Result' }));
    expect((await screen.findByRole('status')).textContent).toContain('All visit laboratory orders are complete');
    expect(apiClient.verifyLaboratoryResult).toHaveBeenCalledWith('LAB-1');
  });
});
