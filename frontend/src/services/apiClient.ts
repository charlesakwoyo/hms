import type { DuplicateMatch, Patient, PatientListResponse, PatientSaveOutcome } from '../types';
import { packRichText, unpackRichText } from '../utils/richText';

type Json = Record<string, unknown>;
type SaveResult = { success: boolean; id?: string; error?: string; data?: unknown };

export interface PatientSearchParams {
  search?: string;
  page?: number;
  perPage?: number;
  nationalId?: string;
  phone?: string;
  birthCertificateNo?: string;
  email?: string;
  branchId?: number | string;
  status?: string;
  patientCategoryId?: number | string;
}

export interface QueueEntryResult {
  id: string;
  ticketNumber: string;
  destination: string;
  data: Record<string, any>;
}

export interface TriageAssessment {
  id: string;
  presentingComplaint: string;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  temperature: number | null;
  respiratoryRate: number | null;
  spo2: number | null;
  weightKg: number | null;
  heightCm: number | null;
  bmi: number | null;
  triageCategory: 'Normal' | 'Urgent' | 'Emergency';
  nurseNotes: string | null;
  recordedBy: string;
  recordedAt: string;
}

export interface TriageWorklistEntry {
  queueId: string;
  ticketNumber: string;
  patientId: string;
  patientName: string;
  visitId: string;
  arrivedTime: string;
  priority: 'Normal' | 'Urgent' | 'Emergency';
  paymentMethod: string;
  consultationFeePaid: boolean;
  status: 'Waiting' | 'Triaged';
  age: number | null;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  assessment: TriageAssessment | null;
}

export interface ConsultationWorklistEntry {
  queueId: string;
  ticketNumber: string;
  patientId: string;
  patientName: string;
  visitId: string;
  arrivedTime: string;
  priority: 'Normal' | 'Urgent' | 'Emergency';
  paymentMethod: string;
  consultationFeePaid: boolean;
  consultationType: string | null;
  age: number | null;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  dispositionOutcome?: 'Discharge' | 'Admission' | null;
  dispositionStatus?: string | null;
}

export interface ConsultationEncounter {
  patient: {
    id: string;
    name: string;
    age: number | null;
    dob: string | null;
    gender: string | null;
    phone: string | null;
    bloodGroup: string | null;
    allergies: string | null;
  };
  queue: {
    id: string;
    ticketNumber: string;
    visitId: string;
    priority: 'Normal' | 'Urgent' | 'Emergency';
    paymentMethod: string;
    consultationFeePaid: boolean;
    consultationType: string | null;
  };
  triage: {
    presentingComplaint: string | null;
    systolic: number | null;
    diastolic: number | null;
    pulse: number | null;
    temperature: number | null;
    respiratoryRate: number | null;
    spo2: number | null;
    weightKg: number | null;
    heightCm: number | null;
    triageCategory: string | null;
    nurseNotes: string | null;
    recordedAt: string | null;
  } | null;
  consultation: {
    id: string;
    chiefComplaint: string | null;
    historyOfPresentIllness: string | null;
    examinationFindings: string | null;
    provisionalDiagnosis: string | null;
    icdCode: string | null;
    managementPlan: string | null;
    status: string | null;
  } | null;
  diagnoses: Array<{ id: number; code: string | null; title: string | null; type: string }>;
  labOrders: Array<{
    id: string;
    testName: string | null;
    code: string | null;
    status: string | null;
    clinicalIndication: string | null;
    requestedAt: string | null;
    resultValue: string | null;
    referenceRange: string | null;
    resultNotes: string | null;
    resultEnteredBy: string | null;
    verifiedBy: string | null;
    verifiedAt: string | null;
  }>;
  disposition: {
    outcome: 'Discharge' | 'Admission';
    reason: string | null;
    urgency: 'Routine' | 'Urgent' | 'Emergency' | null;
    instructions: string | null;
    status: string;
    decidedBy: string | null;
    decidedAt: string;
  } | null;
}

export interface InpatientAdmissionRequest {
  id: string;
  queueId: string;
  ticketNumber: string;
  patientId: string;
  patientName: string;
  visitId: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  reason: string;
  urgency: 'Routine' | 'Urgent' | 'Emergency';
  requestedBy: string | null;
  requestedAt: string;
  queueStation: string;
}

export interface InpatientBedOption {
  id: number;
  bedNumber: string;
  wardId: string;
  wardName: string;
  bedType: string | null;
  dailyCharge: number;
}

export interface InpatientAdmissionSummary {
  id: string;
  patientId: string;
  patientName: string;
  wardId: string;
  wardName: string;
  bedId: number | null;
  bedNumber: string;
  admittedAt: string;
  admittingDoctor: string | null;
  diagnosis: string;
  visitId: string | null;
}

export interface InpatientAdmissionClinicalNote {
  id: string;
  chiefComplaint: string;
  historyPresentIllness: string;
  pastHistory: string;
  examination: string;
  preMedications: string;
  tobaccoUse: 'Yes' | 'No' | 'Unknown' | null;
  alcoholUse: 'Yes' | 'No' | 'Unknown' | null;
  substanceNotes: string;
  primaryDiagnosis: string;
  differentialDiagnoses: string;
  orders: string;
  managementPlan: string;
  clinicianName: string | null;
  designation: string | null;
  status: 'Draft' | 'Signed';
  signedAt: string | null;
}

export interface InpatientClinicalChart {
  admission: {
    id: string;
    patientId: string;
    patientName: string;
    wardName: string;
    bedNumber: string;
    admittedAt: string;
    diagnosis: string;
    status: string;
  };
  admissionNotes: InpatientAdmissionClinicalNote | null;
  doctorNotes: Array<{
    id: string;
    clinician: string | null;
    icdCode: string | null;
    diagnosis: string | null;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    notedAt: string | null;
  }>;
  wardRounds: Array<{
    id: string;
    doctorName: string | null;
    timestamp: string | null;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
  }>;
  vitals: Array<{
    id: string;
    systolic: number | null;
    diastolic: number | null;
    pulse: number | null;
    temperature: number | null;
    respiratoryRate: number | null;
    spo2: number | null;
    fbs: number | null;
    rbs: number | null;
    remarks: string | null;
    recordedBy: string | null;
    recordedAt: string | null;
  }>;
}

export interface DiagnosisCatalogItem {
  id: number;
  code: string | null;
  title: string;
  chapter: string | null;
}

export interface LaboratoryCatalogItem {
  id: number;
  code: string | null;
  name: string | null;
  department: string | null;
  specimen_type: string | null;
}

export interface LaboratoryWorklistOrder {
  orderId: string;
  patientId: string;
  patientName: string;
  visitId: string;
  ticketNumber: string;
  testName: string | null;
  testCode: string | null;
  department: string | null;
  specimenType: string | null;
  clinicalIndication: string | null;
  status: string | null;
  accessionNo: string | null;
  recollectionCount: number;
  rejectionReason: string | null;
  resultValue: string | null;
  referenceRange: string | null;
  resultNotes: string | null;
  collectedBy: string | null;
  receivedBy: string | null;
  collectedAt: string | null;
  resultEnteredBy: string | null;
  conductedBy: string | null;
  completedAt: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  requestedBy: string | null;
  requestedAt: string | null;
  priority: 'Normal' | 'Urgent' | 'Emergency' | string;
}

const JSON_FIELDS = ['subCategoryPrices', 'parameters', 'subCategoryDailyRates', 'subCategoryChargeComponents', 'includedProcedures'];
const BOOLEAN_FIELDS = [
  'isCash',
  'preauthRequired',
  'isActive',
  'isDefault',
  'requiresContrast',
  'oxygenEquipped',
  'cardiacMonitorEquipped',
];
const NUMBER_FIELDS = [
  'cashPrice',
  'dailyRebateAmount',
  'defaultDiscount',
  'copayAmount',
  'creditLimit',
  'durationMinutes',
  'turnaroundMinutes',
  'includedDays',
  'overstayDailyRate',
  'bedCharge',
  'nursingCareCharge',
  'mealsNutritionCharge',
  'dailyReviewCharge',
];

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: any = null,
  ) {
    super(message);
  }
}

function readCookie(name: string): string {
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : '';
}

function snakeToCamel(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(snakeToCamel);
  if (!value || typeof value !== 'object') return value;
  const out: Json = {};
  Object.entries(value as Json).forEach(([key, val]) => {
    out[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = snakeToCamel(val);
  });
  return out;
}

class ApiClient {
  private csrfReady = false;

  private async ensureCsrf(): Promise<void> {
    if (this.csrfReady && readCookie('XSRF-TOKEN')) return;
    await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
    this.csrfReady = true;
  }

  async request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET') await this.ensureCsrf();
    const response = await fetch(`/api/${path.replace(/^\//, '')}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...(method !== 'GET' ? { 'X-XSRF-TOKEN': readCookie('XSRF-TOKEN') } : {}),
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { success: false, error: `The server did not answer properly (HTTP ${response.status})` };
    }
    if (response.status === 401 && !path.startsWith('auth/login')) {
      window.dispatchEvent(new CustomEvent('wisecare:signed-out'));
    }
    if (!response.ok || data?.success === false) {
      throw new ApiError(String(data?.error || data?.message || `HTTP ${response.status}`), response.status, data);
    }
    return data as T;
  }

  get<T = any>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T = any>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
  }

  put<T = any>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) });
  }

  delete<T = any>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  async login(username: string, password: string) {
    await this.ensureCsrf();
    return this.post<{ success: boolean; user: any; rights: string[] }>('auth/login', { username, password });
  }

  async me() {
    return this.get<{ success: boolean; user: any; rights: string[] }>('auth/me');
  }

  async logout() {
    try {
      await this.post('auth/logout', {});
    } finally {
      this.csrfReady = false;
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.post<{ success: boolean; user: any }>('auth/change-password', { currentPassword, newPassword });
  }

  async getEntity(entity: string): Promise<any[]> {
    try {
      const json = await this.get<{ data: any[] }>(`records/${entity}`);
      return Array.isArray(json.data) ? json.data : [];
    } catch (error) {
      console.error(`WiseCare load ${entity}:`, error);
      return [];
    }
  }

  async getEntityOrError(entity: string): Promise<{ rows: any[]; error: string | null }> {
    try {
      const json = await this.get<{ data: any[] }>(`records/${entity}`);
      return { rows: Array.isArray(json.data) ? json.data : [], error: null };
    } catch (error) {
      return { rows: [], error: (error as Error).message };
    }
  }

  async getSetupEntity(entity: string): Promise<any[]> {
    const rows = await this.getEntity(entity);
    return rows.map((row) => this.parseSetupValue(entity, row));
  }

  async persistEntity(entity: string, data: any): Promise<SaveResult> {
    let payload = data;
    if (entity === 'setup-lab-tests') {
      payload = {
        ...payload,
        ...(payload?.clinicalComment ? { clinicalComment: packRichText(unpackRichText(payload.clinicalComment)) } : {}),
        ...(Array.isArray(payload?.parameters)
          ? {
              parameters: payload.parameters.map((p: any) =>
                p?.clinicalComment ? { ...p, clinicalComment: packRichText(unpackRichText(p.clinicalComment)) } : p,
              ),
            }
          : {}),
      };
    }
    try {
      const json = await this.post<{ id: string }>(`records/${entity}`, payload);
      window.dispatchEvent(new CustomEvent('wisecare:save-success', { detail: { entity, id: json.id } }));
      return { success: true, id: json.id };
    } catch (error) {
      const message = (error as Error).message || `Failed to save ${entity}`;
      window.dispatchEvent(new CustomEvent('wisecare:save-error', { detail: { entity, error: message } }));
      return { success: false, error: message };
    }
  }

  async deleteEntity(entity: string, id: string): Promise<SaveResult> {
    try {
      await this.delete(`records/${entity}/${encodeURIComponent(id)}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  persistQueueItem(item: any) {
    return this.persistEntity('queue', {
      id: item.id,
      priority: item.priority,
      callCount: item.callCount,
      lastCalledAt: item.lastCalledAt,
      consultationServiceId: item.consultationServiceId,
      consultationServiceCode: item.consultationServiceCode,
      consultationType: item.consultationType,
      consultationFee: item.consultationFee,
      patientSubCategory: item.patientSubCategory,
      servicePointNote: item.servicePointNote,
    });
  }

  private patientQuery(params: PatientSearchParams | string): string {
    const source: PatientSearchParams = typeof params === 'string' ? { search: params } : params || {};
    const query = new URLSearchParams();
    const values: Array<[string, unknown]> = [
      ['search', source.search],
      ['national_id', source.nationalId],
      ['phone', source.phone],
      ['birth_certificate_no', source.birthCertificateNo],
      ['email', source.email],
      ['branch_id', source.branchId],
      ['status', source.status],
      ['patient_category_id', source.patientCategoryId],
      ['page', source.page],
      ['per_page', source.perPage],
    ];
    values.forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== '') query.set(key, String(value));
    });
    const suffix = query.toString();
    return suffix ? `patients?${suffix}` : 'patients';
  }

  async getPatients(params: PatientSearchParams | string = {}): Promise<PatientListResponse> {
    const json = await this.get<any>(this.patientQuery(params));
    const data = Array.isArray(json?.data) ? (json.data as Patient[]) : [];
    const meta = json?.meta || {};
    return {
      data,
      meta: {
        currentPage: Number(meta.current_page ?? 1),
        lastPage: Number(meta.last_page ?? 1),
        perPage: Number(meta.per_page ?? data.length ?? 25),
        total: Number(meta.total ?? data.length),
        from: meta.from === null || meta.from === undefined ? null : Number(meta.from),
        to: meta.to === null || meta.to === undefined ? null : Number(meta.to),
      },
    };
  }

  async getPatient(id: string): Promise<Patient> {
    const json = await this.get<{ data: Patient }>(`patients/${encodeURIComponent(id)}`);
    return json.data;
  }

  async getPatientVisits(id: string): Promise<any[]> {
    const json = await this.get<{ data: any[] }>(`patients/${encodeURIComponent(id)}/visits`);
    return Array.isArray(json.data) ? json.data : [];
  }

  async getPatientQueueStatus(id: string): Promise<any | null> {
    const json = await this.get<{ data: any | null }>(`patients/${encodeURIComponent(id)}/queue-status`);
    return json.data ?? null;
  }

  async getPatientActivity(id: string): Promise<any[]> {
    const json = await this.get<{ data: any[] }>(`patients/${encodeURIComponent(id)}/activity`);
    return Array.isArray(json.data) ? json.data : [];
  }

  async checkPatientDuplicates(patient: any, excludeId?: string): Promise<DuplicateMatch[]> {
    const query = excludeId ? `?excludeId=${encodeURIComponent(excludeId)}` : '';
    const json = await this.post<{ data: DuplicateMatch[] }>(`patients/duplicate-check${query}`, patient);
    return Array.isArray(json.data) ? json.data : [];
  }

  async persistPatient(patient: any): Promise<PatientSaveOutcome> {
    try {
      const exists = typeof patient?.id === 'string' && patient.id.startsWith('P-');
      const payload = exists ? patient : { ...patient, branchId: patient.branchId ?? this.getCurrentBranchId() };
      const json = exists
        ? await this.put<any>(`patients/${encodeURIComponent(patient.id)}`, patient)
        : await this.post<any>('patients', payload);
      window.dispatchEvent(
        new CustomEvent('wisecare:save-success', { detail: { entity: 'patients', id: json.id, message: 'Patient saved.' } }),
      );
      return {
        success: true,
        patient: (json.data ?? json) as Patient,
        visitId: json.visitId ?? null,
      };
    } catch (error) {
      const apiError = error as ApiError;
      const message = apiError.message || 'Failed to save patient';
      const payload = apiError.data || {};
      const duplicate = payload?.code === 'duplicate_patient' || payload?.data?.matches;
      if (!duplicate) {
        window.dispatchEvent(new CustomEvent('wisecare:save-error', { detail: { entity: 'patients', error: message } }));
      }
      return {
        success: false,
        error: message,
        status: apiError.status,
        code: payload?.code,
        matches: Array.isArray(payload?.data?.matches) ? payload.data.matches : undefined,
        overrideToken: payload?.data?.overrideToken,
      };
    }
  }

  async setPatientStatus(id: string, status: 'Active' | 'Inactive'): Promise<Patient> {
    const path = status === 'Inactive' ? 'deactivate' : 'reactivate';
    const json = await this.post<{ data: Patient }>(`patients/${encodeURIComponent(id)}/${path}`, {});
    return json.data;
  }

  async createVisit(patientId: string, data: Record<string, unknown> = {}): Promise<any> {
    const json = await this.post<{ data: any }>(`patients/${encodeURIComponent(patientId)}/visits`, data);
    return json.data;
  }

  async cancelVisit(visitId: string): Promise<any> {
    const json = await this.post<{ data: any }>(`visits/${encodeURIComponent(visitId)}/cancel`, {});
    return json.data;
  }

  async closeVisit(visitId: string): Promise<any> {
    const json = await this.post<{ data: any }>(`visits/${encodeURIComponent(visitId)}/close`, {});
    return json.data;
  }

  async createQueueEntry(item: any): Promise<QueueEntryResult> {
    return this.post<QueueEntryResult>('queue', item);
  }

  async routeQueueEntry(queueId: string, station: string): Promise<Record<string, any>> {
    const json = await this.post<{ data: Record<string, any> }>(`queue/${encodeURIComponent(queueId)}/route`, { station });
    return json.data;
  }

  async recordQueueConsultationPayment(
    queueId: string,
    payment: { paymentMethod: 'Cash' | 'M-Pesa' | 'Card' | 'Bank Transfer'; reference?: string },
  ): Promise<{ invoiceId: string; destination: string; data: Record<string, any> }> {
    const json = await this.post<{ data: { invoiceId: string; destination: string; data: Record<string, any> } }>(
      `queue/${encodeURIComponent(queueId)}/consultation-payment`,
      payment,
    );
    return json.data;
  }

  async continueQueueAfterPayment(queueId: string): Promise<{ destination: string; data: Record<string, any> }> {
    const json = await this.post<{ data: { destination: string; data: Record<string, any> } }>(
      `queue/${encodeURIComponent(queueId)}/continue-after-payment`,
      {},
    );
    return json.data;
  }

  async getTriageWorklist(): Promise<TriageWorklistEntry[]> {
    const json = await this.get<{ data: TriageWorklistEntry[] }>('triage/worklist');
    return Array.isArray(json.data) ? json.data : [];
  }

  async saveTriageAssessment(
    queueId: string,
    assessment: {
      presentingComplaint: string;
      systolic?: number;
      diastolic?: number;
      pulse?: number;
      temperature?: number;
      respiratoryRate?: number;
      spo2?: number;
      weightKg?: number;
      heightCm?: number;
      triageCategory: 'Normal' | 'Urgent' | 'Emergency';
      nurseNotes?: string;
    },
  ): Promise<TriageAssessment> {
    const json = await this.post<{ data: TriageAssessment }>(
      `triage/${encodeURIComponent(queueId)}/assessment`,
      assessment,
    );
    return json.data;
  }

  async getConsultationWorklist(): Promise<ConsultationWorklistEntry[]> {
    const json = await this.get<{ data: ConsultationWorklistEntry[] }>('consultation/worklist');
    return Array.isArray(json.data) ? json.data : [];
  }

  async getConsultationEncounter(queueId: string): Promise<ConsultationEncounter> {
    const json = await this.get<{ data: ConsultationEncounter }>(`consultation/${encodeURIComponent(queueId)}/encounter`);
    return json.data;
  }

  async searchDiagnosisCatalog(search: string): Promise<DiagnosisCatalogItem[]> {
    const query = new URLSearchParams({ search: search.trim() });
    const json = await this.get<{ data: DiagnosisCatalogItem[] }>(`consultation/diagnosis-catalog?${query.toString()}`);
    return Array.isArray(json.data) ? json.data : [];
  }

  async searchLaboratoryCatalog(search: string): Promise<LaboratoryCatalogItem[]> {
    const query = new URLSearchParams({ search: search.trim() });
    const json = await this.get<{ data: LaboratoryCatalogItem[] }>(`consultation/laboratory-catalog?${query.toString()}`);
    return Array.isArray(json.data) ? json.data : [];
  }

  async getLaboratoryWorklist(): Promise<LaboratoryWorklistOrder[]> {
    const json = await this.get<{ data: LaboratoryWorklistOrder[] }>('laboratory/worklist');
    return Array.isArray(json.data) ? json.data : [];
  }

  async collectLaboratorySpecimen(orderId: string, accessionNo?: string): Promise<{ orderId: string; accessionNo: string; status: string }> {
    const json = await this.post<{ data: { orderId: string; accessionNo: string; status: string } }>(
      `laboratory/orders/${encodeURIComponent(orderId)}/collect`,
      { accessionNo },
    );
    return json.data;
  }

  async rejectLaboratorySpecimen(orderId: string, reason: string): Promise<{ orderId: string; status: string }> {
    const json = await this.post<{ data: { orderId: string; status: string } }>(
      `laboratory/orders/${encodeURIComponent(orderId)}/reject-specimen`,
      { reason },
    );
    return json.data;
  }

  async enterLaboratoryResult(
    orderId: string,
    data: { resultValue: string; referenceRange?: string; notes?: string },
  ): Promise<{ orderId: string; status: string }> {
    const json = await this.put<{ data: { orderId: string; status: string } }>(
      `laboratory/orders/${encodeURIComponent(orderId)}/result`,
      data,
    );
    return json.data;
  }

  async verifyLaboratoryResult(orderId: string): Promise<{ orderId: string; status: string; destination: string; returnedToConsultation: boolean }> {
    const json = await this.post<{ data: { orderId: string; status: string; destination: string; returnedToConsultation: boolean } }>(
      `laboratory/orders/${encodeURIComponent(orderId)}/verify`,
      {},
    );
    return json.data;
  }

  async orderLaboratoryTests(
    queueId: string,
    data: { testIds: number[]; clinicalIndication: string },
  ): Promise<{ orders: Array<{ id: string; testName: string | null; code: string | null; status: string }>; destination: string; deferredForEmergency: boolean }> {
    const json = await this.post<{ data: { orders: Array<{ id: string; testName: string | null; code: string | null; status: string }>; destination: string; deferredForEmergency: boolean } }>(
      `consultation/${encodeURIComponent(queueId)}/laboratory-orders`,
      data,
    );
    return json.data;
  }

  async addConsultationDiagnosis(
    queueId: string,
    data: { catalogId: number; type: 'Primary' | 'Secondary' },
  ): Promise<{ consultationId: string; diagnosis: ConsultationEncounter['diagnoses'][number] }> {
    const json = await this.post<{ data: { consultationId: string; diagnosis: ConsultationEncounter['diagnoses'][number] } }>(
      `consultation/${encodeURIComponent(queueId)}/diagnoses`,
      data,
    );
    return json.data;
  }

  async saveConsultationNotes(
    queueId: string,
    data: { subjective: string; objective: string; assessment: string; plan: string },
  ): Promise<{ consultationId: string; status: string }> {
    const json = await this.put<{ data: { consultationId: string; status: string } }>(
      `consultation/${encodeURIComponent(queueId)}/notes`,
      data,
    );
    return json.data;
  }

  async saveConsultationDisposition(
    queueId: string,
    data: {
      outcome: 'Discharge' | 'Admission';
      instructions?: string;
      reason?: string;
      urgency?: 'Routine' | 'Urgent' | 'Emergency';
    },
  ): Promise<{ id: string; outcome: 'Discharge' | 'Admission'; status: string; visitId: string }> {
    const json = await this.post<{ data: { id: string; outcome: 'Discharge' | 'Admission'; status: string; visitId: string } }>(
      `consultation/${encodeURIComponent(queueId)}/disposition`,
      data,
    );
    return json.data;
  }

  async getInpatientAdmissionRequests(): Promise<InpatientAdmissionRequest[]> {
    const json = await this.get<{ data: InpatientAdmissionRequest[] }>('inpatient/admission-requests');
    return Array.isArray(json.data) ? json.data : [];
  }

  async getAvailableInpatientBeds(): Promise<InpatientBedOption[]> {
    const json = await this.get<{ data: InpatientBedOption[] }>('inpatient/available-beds');
    return Array.isArray(json.data) ? json.data : [];
  }

  async getInpatientAdmissions(): Promise<InpatientAdmissionSummary[]> {
    const json = await this.get<{ data: InpatientAdmissionSummary[] }>('inpatient/admissions');
    return Array.isArray(json.data) ? json.data : [];
  }

  async acceptInpatientAdmission(dispositionId: string, bedId: number): Promise<{ id: string; status: string; wardName: string; bedNumber: string }> {
    const json = await this.post<{ data: { id: string; status: string; wardName: string; bedNumber: string } }>(
      `inpatient/admission-requests/${encodeURIComponent(dispositionId)}/accept`,
      { bedId },
    );
    return json.data;
  }

  async declineInpatientAdmission(dispositionId: string, reason: string): Promise<{ id: string; status: string }> {
    const json = await this.post<{ data: { id: string; status: string } }>(
      `inpatient/admission-requests/${encodeURIComponent(dispositionId)}/decline`,
      { reason },
    );
    return json.data;
  }

  async dischargeInpatientAdmission(admissionId: string, summary: string): Promise<{ id: string; status: string; visitId: string }> {
    const json = await this.post<{ data: { id: string; status: string; visitId: string } }>(
      `inpatient/admissions/${encodeURIComponent(admissionId)}/discharge`,
      { summary },
    );
    return json.data;
  }

  async getInpatientClinicalChart(admissionId: string): Promise<InpatientClinicalChart> {
    const json = await this.get<{ data: InpatientClinicalChart }>(
      `inpatient/admissions/${encodeURIComponent(admissionId)}/clinical-chart`,
    );
    return json.data;
  }

  async saveInpatientAdmissionNotes(
    admissionId: string,
    data: Omit<InpatientAdmissionClinicalNote, 'id' | 'clinicianName' | 'signedAt' | 'status'>,
  ): Promise<{ id: string; status: string }> {
    const json = await this.put<{ data: { id: string; status: string } }>(
      `inpatient/admissions/${encodeURIComponent(admissionId)}/admission-notes`,
      data,
    );
    return json.data;
  }

  async signInpatientAdmissionNotes(admissionId: string): Promise<{ id: string; status: string }> {
    const json = await this.post<{ data: { id: string; status: string } }>(
      `inpatient/admissions/${encodeURIComponent(admissionId)}/admission-notes/sign`,
      {},
    );
    return json.data;
  }

  async saveInpatientDoctorNote(
    admissionId: string,
    data: { icdCode?: string; diagnosis: string; subjective: string; objective: string; assessment: string; plan: string },
  ): Promise<{ id: string; notedAt: string }> {
    const json = await this.post<{ data: { id: string; notedAt: string } }>(
      `inpatient/admissions/${encodeURIComponent(admissionId)}/doctor-notes`,
      data,
    );
    return json.data;
  }

  async saveInpatientWardRound(
    admissionId: string,
    data: { subjective: string; objective: string; assessment: 'Critical' | 'Guarded' | 'Stable' | 'Improving'; plan: string },
  ): Promise<{ id: string; timestamp: string }> {
    const json = await this.post<{ data: { id: string; timestamp: string } }>(
      `inpatient/admissions/${encodeURIComponent(admissionId)}/ward-rounds`,
      data,
    );
    return json.data;
  }

  async saveInpatientVitals(
    admissionId: string,
    data: {
      systolic?: number;
      diastolic?: number;
      pulse?: number;
      temperature?: number;
      respiratoryRate?: number;
      spo2?: number;
      fbs?: number;
      rbs?: number;
      remarks?: string;
    },
  ): Promise<{ id: string; recordedAt: string }> {
    const json = await this.post<{ data: { id: string; recordedAt: string } }>(
      `inpatient/admissions/${encodeURIComponent(admissionId)}/vitals`,
      data,
    );
    return json.data;
  }

  async getQueueStatus(patientId: string): Promise<any | null> {
    const json = await this.get<{ data: any | null }>(`queue/status/${encodeURIComponent(patientId)}`);
    return json.data ?? null;
  }

  async getConsultationCatalog(): Promise<any[]> {
    try {
      const json = await this.get<{ data: any[] }>('catalog/consultations');
      return json.data || [];
    } catch {
      return [];
    }
  }

  async getBranches(): Promise<any[]> {
    try {
      const json = await this.get<{ data: any[] }>('branches');
      return json.data || [];
    } catch {
      return [];
    }
  }

  getCurrentBranchId(): number {
    const value = Number(window.localStorage.getItem('wisecare.branchId') || 1);
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  setCurrentBranchId(id: number): void {
    if (Number(id) > 0) window.localStorage.setItem('wisecare.branchId', String(Number(id)));
  }

  async getStatus(): Promise<{ connected: boolean } | null> {
    try {
      await this.get('auth/me');
      return { connected: true };
    } catch {
      return { connected: false };
    }
  }

  async notAvailable(): Promise<any> {
    return { success: false, error: 'This feature arrives in a later phase of the Laravel version.' };
  }

  getMpesaConfig() {
    return this.notAvailable();
  }

  saveMpesaConfig(_data: unknown) {
    return this.notAvailable();
  }

  testMpesaConfig() {
    return this.notAvailable();
  }

  saveBedChargeComponents(_bedId: number, _components: Record<string, unknown>) {
    return this.notAvailable();
  }

  async getPharmacyOtcSales(_status?: string): Promise<any[]> {
    return [];
  }

  private parseSetupValue(entity: string, row: any): any {
    const x = snakeToCamel(row || {}) as any;
    JSON_FIELDS.forEach((key) => {
      if (x[key] === undefined && typeof x[`${key}Json`] === 'string') x[key] = x[`${key}Json`];
      if (typeof x[key] === 'string') {
        try {
          x[key] = JSON.parse(x[key]);
        } catch {
          x[key] = x[key];
        }
      }
    });
    if (entity === 'setup-lab-tests') {
      if (x.clinicalComment) x.clinicalComment = unpackRichText(x.clinicalComment);
      x.parameters = Array.isArray(x.parameters)
        ? x.parameters.map((p: any) => (p?.clinicalComment ? { ...p, clinicalComment: unpackRichText(p.clinicalComment) } : p))
        : [];
    }
    BOOLEAN_FIELDS.forEach((key) => {
      if (key in x && typeof x[key] !== 'boolean') x[key] = Number(x[key]) === 1 || String(x[key]).toLowerCase() === 'true';
    });
    NUMBER_FIELDS.forEach((key) => {
      if (key in x && x[key] !== null && x[key] !== '') x[key] = Number(x[key]);
    });
    if (entity === 'setup-pharmacy-drugs') x.formulation = x.formulation || x.dosageForm || '';
    return x;
  }
}

export const apiClient = new ApiClient();
