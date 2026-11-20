export type ShaSchemeType = 'SHIF' | 'PHIF' | 'ECCIF' | 'Civil Servant Scheme' | 'Police & Prisons Scheme';

export type ShaClaimType =
  'Outpatient' | 'Inpatient' | 'Emergency' | 'Day-Case Surgery' | 'Maternity Package' | 'Oncology & Chemotherapy' | 'Renal Dialysis';

export type ShaClaimStatus =
  | 'Draft'
  | 'Validated'
  | 'Queued for HIE'
  | 'Submitted to DHA'
  | 'Adjudicated - Approved'
  | 'Adjudicated - Partial'
  | 'Rejected'
  | 'Pended / Clinical Audit'
  | 'Settled / Remitted'
  | 'Withdrawn';

export type ShaPreauthStatus = 'Draft' | 'Submitted to DHA' | 'Approved' | 'Rejected' | 'Additional Info Required';

export interface DhaHieConfig {
  gatewayUrl: string;
  environment: 'sandbox' | 'production';
  facilityKmhflCode: string;
  facilityName: string;
  facilityLevel: 'Level 2' | 'Level 3' | 'Level 4' | 'Level 5' | 'Level 6';
  shaContractNumber: string;
  clientId: string;
  clientSecret: string;
  apiKey: string;
  bearerToken?: string;
  tokenExpiresAt?: string;
  lastPingTimestamp?: string;
  connectionStatus: 'Connected' | 'Disconnected' | 'Testing' | 'Error';
  lastPingLatencyMs?: number;
}

export interface ShaMemberEligibility {
  nationalId: string;
  memberNumber: string;
  fullName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  schemeType: ShaSchemeType;
  subCategory?: string;
  status: 'Active' | 'Inactive' | 'Defaulted' | 'Exempted';
  verifiedAt: string;
  biometricVerified: boolean;
  fingerprintMatchConfidence?: number;
  biometricProvider?: 'SecuGen' | 'Suprema' | 'Other';
  biometricDevice?: string;
  biometricTemplateFormat?: 'ISO' | 'ANSI' | 'vendor';
  biometricVerifiedAt?: string;
  opdAvailable: boolean;
  opdDailyCap: number;
  ipdDailyLimit: number;
  maternityCovered: boolean;
  chronicCovered: boolean;
  dialysisSessionsRemaining: number;
  preauthRequiredProcedures: string[];
  attendanceToken?: string;
  otpVerified?: boolean;
}

export interface ShaPreauthorization {
  id: string;
  preauthNumber: string;
  patientId: string;
  visitNumber?: string;
  patientName: string;
  nationalId: string;
  shaMemberNumber: string;
  scheme: ShaSchemeType;
  requestedDate: string;
  validityExpiry: string;
  procedureCode: string;
  procedureName: string;
  department: string;
  estimatedCost: number;
  approvedAmount: number;
  diagnosisCode: string;
  diagnosisName: string;
  clinicianName: string;
  kmdcNumber: string;
  status: ShaPreauthStatus;
  urgency: 'Routine' | 'Urgent' | 'Emergency';
  notes: string;
  dhaApprovalNotes?: string;
  attachments: { name: string; type: string; url?: string; size: string }[];
}

export interface ShaClaimItem {
  id: string;
  itemCode: string;
  description: string;
  category: 'Consultation' | 'Laboratory' | 'Radiology' | 'Pharmacy' | 'Inventory' | 'Procedure' | 'Accommodation' | 'Surgical Package';
  quantity: number;
  unitPrice: number;
  totalCost: number;
  shaRebate: number;
  patientCopay: number;
  preauthRef?: string;
  adjudicationStatus?: 'Approved' | 'Adjusted' | 'Disallowed';
  disallowanceReason?: string;
}

export interface ShaClaimDiagnosis {
  id: string;
  code: string;
  name: string;
  type: 'Primary' | 'Secondary' | 'Comorbidity';
}

export interface ShaClaimSupportingDoc {
  id: string;
  title: string;
  documentType: 'Discharge Summary' | 'Lab Report' | 'Radiology Report' | 'Operation Notes' | 'Pharmacy Slip' | 'Clinical Notes';
  fileName: string;
  dateAttached: string;
  fileSize: string;
}

export interface ShaClaim {
  id: string;
  claimNumber: string;
  fhirClaimId: string;
  patientId: string;
  patientName: string;
  nationalId: string;
  shaMemberNumber: string;
  schemeType: ShaSchemeType;
  claimType: ShaClaimType;
  encounterType: 'Outpatient' | 'Inpatient' | 'Emergency';
  visitDate: string;
  dischargeDate?: string;
  admittingDoctor: string;
  kmdcNumber: string;
  diagnoses: ShaClaimDiagnosis[];
  items: ShaClaimItem[];
  totalClaimAmount: number;
  approvedAmount: number;
  patientCopay: number;
  deductionAmount: number;
  status: ShaClaimStatus;
  preauthNumber?: string;
  dhaHieTransactionId?: string;
  dhaSubmissionTimestamp?: string;
  dhaAdjudicationTimestamp?: string;
  rejectionCode?: string;
  rejectionReason?: string;
  clinicalAuditNotes?: string;
  supportingDocs: ShaClaimSupportingDoc[];
  fhirBundleJson?: string;
  resubmissionCount: number;
  lastUpdated: string;

  visitId?: string | null;
  invoiceId?: string | null;
  mwavuliEnvironment?: string | null;
  mwavuliStatus?: string | null;
  mwavuliHoldCode?: string | null;
  mwavuliHoldReason?: string | null;
  mwavuliSubmittedAt?: string | null;
  mwavuliCheckedAt?: string | null;
  serviceType?: string | null;
}

export interface ShaRemittanceAdvice {
  id: string;
  voucherNumber: string;
  batchId: string;
  paymentDate: string;
  bankReference: string;
  scheme: ShaSchemeType;
  totalClaimsCount: number;
  totalClaimedAmount: number;
  totalApprovedAmount: number;
  totalDisallowedAmount: number;
  withholdingTax: number;
  netDisbursedAmount: number;
  status: 'Disbursed' | 'Processing' | 'Reconciled';
  claimIds: string[];
}
