export type ModuleType =
  | 'dashboard'
  | 'patients'
  | 'walkin'
  | 'appointments'
  | 'queue'
  | 'triage'
  | 'consultation'
  | 'dental'
  | 'inpatient'
  | 'cancer'
  | 'theatre'
  | 'morgue'
  | 'dialysis'
  | 'blood_bank'
  | 'laboratory'
  | 'pharmacy'
  | 'prescriptions'
  | 'radiology'
  | 'billing'
  | 'sha_claims'
  | 'procurement_stores'
  | 'accounts'
  | 'fixed_assets'
  | 'budget'
  | 'finance'
  | 'inventory'
  | 'reports'
  | 'users'
  | 'system_setup'
  | 'reprints'
  | 'phpmysql';

export type LaboratoryPage = 'Visits' | 'Orders' | 'Specimen' | 'Results';

export type UserRole =
  | 'System Administrator'
  | 'Medical Doctor'
  | 'Triage Nurse'
  | 'Pharmacist'
  | 'Laboratory Technician'
  | 'Radiologist'
  | 'Billing Cashier'
  | 'Receptionist';

export type TriageCategory = 'Normal' | 'Urgent' | 'Emergency';

export type QueueStation =
  'Registration' | 'Triage' | 'Consultation' | 'Inpatient Ward' | 'Laboratory' | 'Radiology' | 'Pharmacy' | 'Billing' | 'Discharged';

export type PaymentMethod = 'Cash' | 'M-Pesa' | 'NHIF / SHA' | 'Private Insurance' | 'Card' | 'Bank Transfer' | 'Multiple Modes';

export interface BillPaymentSplit {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  phone?: string;
  notes?: string;
}

export interface CancerTreatmentProtocol {
  id: string;
  code: string;
  name: string;
  treatmentType: string;
  regimen?: string;
  intent?: string;
  route?: string;
  cycleDays: number;
  defaultCycles: number;
  department?: string;
  preauthRequired: boolean;
  shaBenefitCode?: string;
  description?: string;
  status: string;
}
export interface CancerTreatmentPlan {
  id: string;
  patientId: string;
  protocolId?: string;
  diagnosisCode?: string;
  diagnosisName?: string;
  stage?: string;
  intent?: string;
  startDate?: string;
  oncologist?: string;
  shaPreauthId?: string;
  shaPreauthNumber?: string;
  totalCyclesPlanned: number;
  currentCycle: number;
  status: string;
  notes?: string;
}
export interface CancerTreatmentCycle {
  id: string;
  planId: string;
  patientId: string;
  cycleNumber: number;
  scheduledDate?: string;
  actualDate?: string;
  status: string;
  shaPreauthId?: string;
  shaPreauthNumber?: string;
  notes?: string;
}
export interface CancerTreatmentSession {
  id: string;
  cycleId: string;
  planId: string;
  patientId: string;
  sessionType: string;
  startTime?: string;
  endTime?: string;
  clinician?: string;
  status: string;
  vitalsSummary?: string;
  clinicalNotes?: string;
  shaPreauthId?: string;
  shaPreauthNumber?: string;
}
export interface CancerTreatmentItem {
  id: string;
  sessionId: string;
  patientId: string;
  sourceEntity?: string;
  sourceId?: string;
  itemCode?: string;
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  shaRebate: number;
  patientCopay: number;
  billedAmount: number;
  preauthRef?: string;
  invoiceId?: string;
  shaClaimId?: string;
  status: string;
}
export interface CancerBillingLink {
  id: string;
  patientId: string;
  planId: string;
  cycleId?: string;
  sessionId?: string;
  invoiceId: string;
  billingStage: string;
  amount: number;
  shaRebate: number;
  patientCopay: number;
  status: string;
}

export interface DuplicateMatch {
  id: string;
  patientNumber: string;
  name: string;
  phone: string;
  dob: string | null;
  nationalId: string | null;
  lastVisit: string | null;
  reasons: string[];
}

export interface PatientPageMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PatientListResponse {
  data: Patient[];
  meta: PatientPageMeta;
}

export interface PatientSaveOutcome {
  success: boolean;
  patient?: Patient;
  error?: string;
  status?: number;
  code?: string;
  matches?: DuplicateMatch[];
  overrideToken?: string;
  visitId?: string | null;
}

export interface Patient {
  id: string;
  visitId?: string;
  visitNumber?: string;
  branchId?: number;
  patientCategoryId?: number;
  patientSubCategoryId?: number;
  schemeId?: number;
  name: string;
  age: number;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  nationalId: string;
  birthCertificateNo?: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  kinRelationship?: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | '';
  allergies: string;
  insuranceProvider: string;
  insuranceScheme?: string;
  insurancePolicyNo?: string;
  insuranceNumber?: string;
  patientCategory?: string;
  patientSubCategory?: string;
  registeredDate: string;
  status:
    | 'Active'
    | 'Inactive'
    | 'Registered'
    | 'In Consultation'
    | 'In Triage'
    | 'Admitted'
    | 'At Lab'
    | 'At Radiology'
    | 'At Pharmacy'
    | 'At Billing'
    | 'Pending Consultation Payment'
    | 'Pending SHA Verification'
    | 'Discharged';
  currentBed?: string;
  currentWard?: string;
  shaVerified?: boolean;
  shaAttendanceToken?: string;
  activeVisits?: Array<{ id: string; visitId: string; visitNumber: string; status: string | null }>;
  recentVisits?: any[];
  queueStatus?: { id: string; ticketNumber: string; currentStation: string | null; status: string | null } | null;
}

export interface VitalSign {
  visitId?: string;
  id: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  temperature: number;

  respiratoryRate: number | null;
  spO2: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bmiCategory: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  triageCategory: TriageCategory;
  nurseNotes?: string;
  takenBy: string;
}

export interface ConsultationRecord {
  dischargingOfficer?: string;
  officerDesignation?: string;
  officerRegNo?: string;
  visitId?: string;

  followUpAt?: string;
  followUpDepartmentId?: number;
  followUpDepartment?: string;
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  timestamp: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  examinationFindings: string;
  provisionalDiagnosis: string;
  provisionalDiagnoses?: string[];
  icdCode: string;
  paymentScheme?: string;
  setupConsultationServiceId?: number;
  setupConsultationServiceCode?: string;
  consultationType?: string;
  consultationFee?: number;
  patientCategory?: string;
  patientSubCategory?: string;
  consultationPriceSource?: string;
  orderedLabTests: string[];
  orderedRadiology: string[];
  orderedNursingProcedures?: string[];
  prescribedDrugs: {
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  managementPlan: string;
  status: 'Draft' | 'Completed';
}

export interface LabTestOrder {
  visitId?: string;
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  category: 'Hematology' | 'Parasitology' | 'Biochemistry' | 'Microbiology' | 'Urinalysis' | 'Serology';
  sampleType: string;
  requestedBy: string;
  requestedAt: string;
  cost: number;
  setupLabTestId?: number;
  setupLabTestCode?: string;
  billingStatus?: 'Unpaid' | 'Paid' | 'Waived' | 'Inpatient';
  invoiceId?: string;
  resultParameters?: Record<string, string>;
  status: 'Pending' | 'Sample Collected' | 'In Progress' | 'Completed' | 'Rejected';

  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  resultValue?: string;
  referenceRange?: string;
  resultNotes?: string;
  conductedBy?: string;
  completedAt?: string;
  sampleCollectedAt?: string;
}

export interface RadiologyOrder {
  visitId?: string;
  id: string;
  patientId: string;
  patientName: string;
  modality: 'X-Ray' | 'Ultrasound' | 'CT Scan' | 'MRI' | 'Mammography' | 'ECG';
  bodyPart: string;
  clinicalIndication: string;
  requestedBy: string;
  requestedAt: string;
  cost: number;
  setupRadiologyTestId?: number;
  setupRadiologyTestCode?: string;
  setupRadiologyTemplateId?: number;
  billingStatus?: 'Unpaid' | 'Paid' | 'Waived' | 'Inpatient';
  invoiceId?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  radiologyReport?: string;
  conductedBy?: string;
  completedAt?: string;
}

export interface Prescription {
  visitId?: string;
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unitPrice: number;
  setupPharmacyDrugId?: number;
  setupPharmacyDrugCode?: string;
  billingStatus?: 'Unpaid' | 'Paid' | 'Waived' | 'Inpatient';
  invoiceId?: string;
  instructions: string;
  status: 'Pending' | 'Dispensed' | 'Partially Dispensed';
  dispensedBy?: string;
  dispensedAt?: string;
}

export interface BillItem {
  description: string;
  sourceEntity?:
    | 'lab-orders'
    | 'radiology-orders'
    | 'inpatient-orders'
    | 'inpatient-package'
    | 'prescriptions'
    | 'consultations'
    | 'nursing-procedure'
    | 'setup-lab-tests'
    | 'setup-radiology-tests'
    | 'setup-consultation-services'
    | 'setup-nursing-procedures';
  sourceId?: string;
  category: 'Consultation' | 'Laboratory' | 'Pharmacy' | 'Radiology' | 'Nursing / Bed' | 'Procedure';
  unitCost: number;
  quantity: number;
  total: number;
  payer?: string;
  sourceEntityId?: number;
  lineDiscount?: number;
  lineDiscountType?: 'fixed' | 'percent';
  discountReason?: string;
  allocationGroup?: string;
  payerAllocation?: { gross: number; lineDiscount: number; billDiscount: number; primary: number; secondary: number; patient: number };

  fromBillId?: string;
  fromIndex?: number;
}

export interface Bill {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentSplits?: BillPaymentSplit[];
  paidItemIndexes?: number[];
  status: 'Unpaid' | 'Partial' | 'Paid' | 'Waived';
  cashierName: string;
  billingPayer?: string;
  parentInvoiceId?: string;
  discountReason?: string;
  primaryMemberNo?: string;
  primaryPreAuth?: string;
  secondaryMemberNo?: string;
  secondaryApprovalRef?: string;
  secondaryPatientType?: string;
  secondaryPatientSubType?: string;
  secondaryScheme?: string;
  encounterType?: 'OP' | 'IP';
  attendingDoctor?: string;
  department?: string;
  encounterReference?: string;
  wardBed?: string;
  admissionDate?: string;
  dischargeDate?: string;
  insuranceProvider?: string;
  invoiceType?: string;
  isAmended?: boolean;
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  category: 'Antibiotic' | 'Analgesic' | 'Antimalarial' | 'Antihypertensive' | 'Consumable' | 'Reagent';
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Vial' | 'Box' | 'Piece';
  stockQuantity: number;
  reorderLevel: number;
  unitCostKSh: number;
  sellingPriceKSh: number;
  expiryDate: string;
  batchNumber: string;
  supplier: string;
}

export interface QueueItem {
  id: string;
  freeConsultation?: boolean;
  freeConsultationAllowedBy?: string;
  ticketNumber: string;
  patientId: string;
  patientName: string;
  arrivedTime: string;
  currentStation: QueueStation;
  priority: TriageCategory;
  assignedTo?: string;
  paymentMethod?: string;
  consultationFeePaid?: boolean;
  status?: 'Waiting' | 'Calling' | 'Serving' | 'Completed' | 'Skipped';
  callCount?: number;
  lastCalledAt?: string;
  servicePointNote?: string;
  consultationServiceId?: number;
  consultationServiceCode?: string;
  consultationType?: string;
  consultationFee?: number;
  patientCategory?: string;
  patientSubCategory?: string;
  consultationPriceSource?: string;
  referredDepartment?: string;
  referredConsultationServiceId?: number;
  referredConsultationServiceCode?: string;
  referredConsultationType?: string;
  referredConsultationFee?: number;
}

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  email: string;
  phone: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  licenseNumber: string;
  createdAt?: string;
  lastLogin?: string;
}

export type RightCategory =
  | 'Clinical & Consultation'
  | 'Nursing & Inpatient Care'
  | 'Diagnostics & Laboratory'
  | 'Pharmacy & Stock'
  | 'Cancer Treatment & Oncology'
  | 'Operation Theatre'
  | 'Renal & Dialysis'
  | 'Blood Bank'
  | 'Mortuary'
  | 'Billing & Finance'
  | 'SHA e-Claims'
  | 'Finance & HR'
  | 'Stores, Pharmacy & Inventory'
  | 'Document Reprints'
  | 'Approvals'
  | 'Reports & Analytics'
  | 'System Setup'
  | 'System & Security';

export interface AccessRight {
  id: string;
  name: string;
  description: string;
  category: RightCategory;
}

export interface SecurityRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  rights: string[];
  createdAt: string;
  updatedAt: string;
}

export type BedStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance' | 'Reserved';

export interface Ward {
  id: string;
  name: string;
  category: 'Male Medical' | 'Female Medical' | 'Pediatric' | 'Maternity' | 'Surgical' | 'ICU / HDU' | 'Private Amenity';
  totalBeds: number;
  occupiedBeds: number;
  dailyRate: number;
  nurseInCharge: string;
  floor: string;
  subCategoryChargeComponents?: Record<
    string,
    { bedCharge: number; nursingCareCharge: number; mealsNutritionCharge: number; dailyReviewCharge: number }
  >;
}

export interface Bed {
  id: string;
  bedNumber: string;
  wardId: string;
  wardName: string;
  status: BedStatus;
  patientId?: string;
  patientName?: string;
  admissionId?: string;
  dailyRate: number;
  hasOxygen: boolean;
  notes?: string;
}

export interface InpatientAdmission {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  wardId: string;
  wardName: string;
  bedNumber: string;
  admittedDate: string;
  admittedTime: string;
  admittingDoctor: string;
  primaryNurse: string;
  admittingDiagnosis: string;
  icdCode?: string;
  insuranceProvider: string;
  shaPreAuthNumber?: string;
  shaRebatePackage?: string;
  shaDailyRebate?: number;
  netDailyBedCharge?: number;
  status: 'Admitted' | 'Discharge Pending' | 'Discharged';
  dischargeDate?: string;
  dischargeSummary?: string;
  emergencyContact: string;
  emergencyPhone: string;
  dailyBedCharge: number;
  totalDaysStayed: number;
  dietInstructions: string;
  attendingSpecialist: string;
  setupBedId?: number;
  tariffScheme?: string;
  tariffSubCategoryId?: number;
  tariffSubCategoryCode?: string;
  tariffSubCategoryName?: string;
  bedCharge?: number;
  nursingCareCharge?: number;
  mealsNutritionCharge?: number;
  dailyReviewCharge?: number;
  dailyAccommodationCharge?: number;
  inpatientPackageId?: number;
  inpatientPackageName?: string;
  inpatientPackagePrice?: number;
  inpatientPackageIncludedDays?: number;
}

export interface WardRoundNote {
  id: string;
  admissionId: string;
  patientId: string;
  doctorName: string;
  timestamp: string;
  subjective: string;
  objective: string;
  assessment: 'Critical' | 'Guarded' | 'Stable' | 'Improving';
  plan: string;
}

export interface InpatientMedicationRecord {
  id: string;
  admissionId: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  route: 'Oral' | 'IV' | 'IM' | 'SC' | 'Inhalation' | 'Topical';
  frequency: string;
  scheduledTime: string;
  administeredStatus: 'Given' | 'Due' | 'Omitted' | 'Refused';
  administeredBy?: string;
  administeredAt?: string;
  notes?: string;
  orderedBy?: string;
  createdAt?: string;
}

export interface TariffPriceItem {
  id: number;
  department: string;
  testName: string;
  code: string;
  price: number;
  shaPrice?: number;
  corporatePrice?: number;
  isSaved: boolean;
}

export interface SetupDiagnosis {
  id: string;
  code: string;
  name: string;
  chapter: string;
  category: string;
  isCommon?: boolean;
}

export interface SetupRadiologyItem {
  id: string;
  code: string;
  name: string;
  modality: 'X-Ray' | 'Ultrasound' | 'CT Scan' | 'MRI';
  bodyPart: string;
  cashPrice: number;
  shaPrice: number;
  corporatePrice: number;
}

export interface SetupNursingProcedure {
  id: string;
  code: string;
  name: string;
  department: string;
  consumables: string;
  cashPrice: number;
  shaPrice: number;
  corporatePrice: number;
  subCategoryPrices?: Record<string, number>;
}

export interface SetupShaDailyRebate {
  id: string;
  code: string;
  packageName: string;
  dailyRebateAmount: number;
  wardCategory: string;
  description: string;
  isActive: boolean;

  facilityLevel?: string;
  benefitCategory?: string;
  shaMaxPerDay?: number;
  maxDaysPerYear?: number;
  requiresPreauth?: boolean;
  fund?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  legalReference?: string;

  discountPerDay?: number;
  discountLabel?: string;
}

export interface HREmployee {
  id: string;
  employeeNo: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  employmentType: string;
  status: string;
  basicSalary: number;
  payMethod: string;
  bankName?: string;
  bankBranch?: string;
  bankAccount?: string;
  kraPin?: string;
  nssfNo?: string;
  shaNo?: string;
  housingLevyEligible?: boolean;
  pensionable?: boolean;
  insuranceRelief?: number;
  taxRelief?: number;
  startDate?: string;
  staffUserId?: string;
  notes?: string;
}
export interface PayrollComponent {
  id: string;
  name: string;
  code: string;
  type: 'Earning' | 'Deduction' | 'Employer Contribution' | 'Benefit';
  calculation: 'Fixed' | 'Percentage';
  value: number;
  basis: 'Basic Salary' | 'Gross Pay' | 'Taxable Pay';
  taxable: boolean;
  pensionable: boolean;
  active: boolean;
}
export interface PayrollSetup {
  id: string;
  payFrequency: string;
  currency: string;
  standardWorkingDays: number;
  standardWorkingHours: number;
  overtimeRateMultiplier: number;
  personalRelief: number;
  shifRate: number;
  shifMinimum: number;
  housingLevyRate: number;
  nssfTier1Limit: number;
  nssfTier2Limit: number;
  nssfRate: number;
  payrollEmailSubject: string;
  payslipFooter: string;
}
export interface PayrollRun {
  id: string;
  period: string;
  status: string;
  processedBy?: string;
  createdAt?: string;
  runDate?: string;
  employeeCount?: number;
  grossTotal?: number;
  deductionsTotal?: number;
  netTotal?: number;
  employerCostTotal?: number;
  totalGross?: number;
  totalNet?: number;
}
export interface PayslipRecord {
  id: string;
  payrollRunId?: string;
  employeeId?: string;
  period: string;
  employeeNo: string;
  employeeName: string;
  email?: string;
  grossPay: number;
  taxablePay?: number;
  netPay: number;
  earnings: any[];
  deductions: any[];
  benefits?: any[];
  employerContributions: any[];
  employerCost?: number;
  createdAt?: string;
  emailedAt?: string;
}

export interface HospitalConfig {
  hospitalName: string;
  mflCode: string;
  facilityLevel: string;
  kraPin: string;
  shaProviderCode: string;
  county: string;
  subCounty: string;
  address: string;
  phone: string;
  emergencyHotline: string;
  email: string;
  website: string;
  currency: string;
  timezone?: string;

  logo?: string;

  slogan?: string;

  letterheadLogo?: 'standard' | 'tall';
}

export interface SetupPatientCategory {
  id: number;
  code: string;
  name: string;
  isCash: boolean;
  defaultDiscount: number;
  status: 'Active' | 'Inactive';
}

export interface SetupPatientSubCategory {
  id: number;
  categoryCode: string;
  categoryName: string;
  subCategoryCode: string;
  name: string;
  isCash: boolean;

  schemeCode?: string;
  schemeName?: string;
  schemeType?: 'Outpatient' | 'Inpatient' | 'Comprehensive';
  copayRule?: string;
  copayAmount?: number;
  creditLimit?: number;
  preAuthRequired?: boolean;
  contactPerson?: string;
  contactPhone?: string;
  status: 'Active' | 'Inactive';
}

export interface SetupDepartment {
  id: number;
  code: string;
  name: string;
  type: 'Clinical' | 'Diagnostic' | 'Inpatient' | 'Administrative' | 'Support';
  headOfDepartment: string;
  phoneExt: string;
  location: string;
  status: 'Active' | 'Inactive';
}

export interface SetupConsultationService {
  id: number;
  code: string;
  name: string;
  department: string;
  description: string;
  durationMinutes: number;
  cashPrice: number;
  cash_price?: number;
  subCategoryPrices: Record<string, number>;
  subCategoryPriceRows?: Array<{
    priceId: number;
    subCategoryId: number;
    subCategoryCode: string;
    subCategoryName: string;
    categoryCode?: string;
    categoryName?: string;
    schemeCode?: string;
    schemeName?: string;
    price: number;
    status?: string;
  }>;
  status: 'Active' | 'Inactive';
}

export interface SetupBedChargeComponents {
  bedCharge: number;
  nursingCareCharge: number;
  mealsNutritionCharge: number;
  dailyReviewCharge: number;
}

export interface SetupBedItem {
  id: number;
  bedNumber: string;
  wardName: string;
  wardId?: string;
  bedType: 'General' | 'Semi-Private' | 'Private' | 'ICU' | 'HDU' | 'Pediatric Cot' | 'Neonatal Incubator' | 'Isolation';
  cashDailyRate: number;
  bedCharge?: number;
  nursingCareCharge?: number;
  mealsNutritionCharge?: number;
  dailyReviewCharge?: number;
  subCategoryDailyRates: Record<string, number>;
  subCategoryChargeComponents?: Record<string, SetupBedChargeComponents>;
  oxygenEquipped: boolean;
  cardiacMonitorEquipped: boolean;
  status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';
}

export interface SetupInpatientPackage {
  id: number;
  packageCode: string;
  packageName: string;
  wardType: string;
  includedDays: number;
  includedProcedures: string[];
  cashPrice: number;
  subCategoryPrices: Record<string, number>;
  overstayDailyRate: number;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface SetupRadiologyTemplate {
  id: number;
  templateCode: string;
  templateName: string;
  modality: 'X-Ray' | 'Ultrasound' | 'CT Scan' | 'MRI' | 'Mammography' | 'ECG';
  indicationBoilerplate: string;
  techniqueBoilerplate: string;
  findingsTemplate: string;
  impressionTemplate: string;
  normalReportText: string;
  isDefault: boolean;
}

export interface SetupRadiologyTestItem {
  id: number;
  code: string;
  name: string;
  category: string;
  modality: 'X-Ray' | 'Ultrasound' | 'CT Scan' | 'MRI' | 'Mammography' | 'ECG';
  preparationInstructions: string;
  requiresContrast: boolean;
  cashPrice: number;
  subCategoryPrices: Record<string, number>;
  defaultTemplateId?: number;
  status: 'Active' | 'Inactive';
}

export interface SetupLabParameter {
  id: string;
  name: string;
  unit: string;
  normalRangeMale: string;
  normalRangeFemale: string;
  normalRangePediatric?: string;
  criticalLow?: number;
  criticalHigh?: number;
  qualitativeOptions?: string[];
  isMandatory: boolean;

  clinicalComment?: string;
}

export interface SetupLabTestItem {
  id: number;
  code: string;
  name: string;
  department: string;
  specimenType: string;
  turnaroundMinutes: number;
  cashPrice: number;
  subCategoryPrices: Record<string, number>;
  parameters: SetupLabParameter[];
  status: 'Active' | 'Inactive';

  clinicalComment?: string;
}

export interface SetupNursingProcedureItem {
  id: number;
  code: string;
  name: string;
  department: string;
  consumables: string;
  cashPrice: number;
  subCategoryPrices: Record<string, number>;
  status: 'Active' | 'Inactive';
}

export interface SetupPharmacyDrugItem {
  id: number;
  code: string;
  brandName: string;
  genericName: string;
  formulation: string;
  strength: string;
  category: string;
  cashPrice: number;
  subCategoryPrices: Record<string, number>;
  status: 'Active' | 'Inactive';
}

export type SetupPharmacyItem = SetupPharmacyDrugItem;

export interface SetupIcd11Item {
  id: number;
  code: string;
  title: string;
  chapter: string;
  block: string;
  category: 'Morbidity' | 'Mortality' | 'Both';
  description?: string;
}

export interface TheatreSurgeryBooking {
  id: string;
  bookingNumber: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  procedureName: string;
  procedureCode: string;
  surgeryType: 'Elective' | 'Emergency' | 'Day-Case';
  theatreRoom: string;
  scheduledDate: string;
  scheduledTime: string;
  leadSurgeon: string;
  assistantSurgeon?: string;
  anesthesiologist: string;
  scrubNurse: string;
  anesthesiaType: 'General' | 'Spinal' | 'Epidural' | 'Local' | 'Sedation';
  status: 'Scheduled' | 'In Theatre' | 'Recovery' | 'Completed' | 'Cancelled';
  preOpChecklistComplete: boolean;
  bloodCrossmatchedUnits?: number;
  shaPreAuthNumber?: string;
  notes?: string;
}

export interface MorgueDeceasedRecord {
  id: string;
  tagNumber: string;
  deceasedName: string;
  age: number;
  gender: 'Male' | 'Female';
  dateOfDeath: string;
  timeOfDeath: string;
  intakeDate: string;
  intakeTime: string;
  sourceType: 'Hospital Inpatient' | 'Brought In Dead (BID)' | 'Police Case' | 'Referral';
  wardOrLocation: string;
  attendingDoctor: string;
  coldRoomNumber: string;
  slotNumber: string;
  causeOfDeath: string;
  autopsyRequired: boolean;
  autopsyStatus: 'Pending' | 'Completed' | 'Waived';
  embalmingStatus: 'Pending' | 'Completed' | 'Not Requested';
  dailyStorageRateKSh: number;
  totalAccruedStorageKSh: number;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  status: 'In Storage' | 'Autopsy Scheduled' | 'Embalmed' | 'Cleared for Release' | 'Released';
  releaseDate?: string;
  burialPermitNumber?: string;
}

export interface DialysisSession {
  id: string;
  sessionNumber: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  shaMemberNumber?: string;
  date: string;
  shift: 'Morning' | 'Afternoon' | 'Evening' | 'Night Emergency';
  stationNumber: string;
  dialyzerModel: string;
  accessType: 'AV Fistula' | 'AV Graft' | 'Temporary Femoral' | 'Permcath';
  accessSite: string;
  preWeightKg: number;
  postWeightKg?: number;
  targetUfVolumeMl: number;
  actualUfVolumeMl?: number;
  preBp: string;
  postBp?: string;
  prePulse: number;
  heparinDoseUnits: number;
  durationHours: number;
  nephrologist: string;
  dialysisNurse: string;
  status: 'Scheduled' | 'Connecting' | 'In Progress' | 'Completed' | 'Cancelled';
  shaApproved: boolean;
  notes?: string;
}

export interface BloodUnitRecord {
  id: string;
  unitNumber: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  componentType: 'Whole Blood' | 'Packed Red Cells (PRBC)' | 'Fresh Frozen Plasma (FFP)' | 'Platelets Concentrates' | 'Cryoprecipitate';
  collectionDate: string;
  expiryDate: string;
  volumeMl: number;
  storageLocation: string;
  screenings: {
    hiv: 'Negative' | 'Positive';
    hepB: 'Negative' | 'Positive';
    hepC: 'Negative' | 'Positive';
    syphilis: 'Negative' | 'Positive';
  };
  status: 'In Quarantine' | 'Available' | 'Reserved' | 'Transfused' | 'Expired' | 'Discarded';
  donorId?: string;
  assignedPatientId?: string;
  assignedPatientName?: string;
}

export interface BloodTransfusionRequest {
  id: string;
  requestNumber: string;
  patientId: string;
  patientName: string;
  wardOrClinic: string;
  bloodGroupRequired: string;
  component: string;
  unitsRequested: number;
  urgency: 'Routine' | 'Urgent' | 'Emergency Immediate';
  hemoglobinLevel: number;
  clinicalIndication: string;
  crossmatchStatus: 'Pending' | 'Compatible' | 'Incompatible' | 'Issued';
  issuingDoctor: string;
  requestDate: string;
}

export interface PurchaseOrderItem {
  id: string;
  inventoryId?: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQty: number;
}

export interface PurchaseOrder {
  id: string;
  lpoNumber: string;
  supplierName: string;
  supplierContact: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'Draft' | 'Approved' | 'Sent to Supplier' | 'Partially Received' | 'Completed' | 'Cancelled';
  approvedBy: string;
  notes?: string;

  l1?: { by: string; at: string };
  l2?: { by: string; at: string };
  vatRate?: number;
  supplierKraPin?: string;
  paymentTerms?: string;
  requestedBy?: string;
  deliverToStoreId?: string;
  cancelledBy?: string;
}

export interface StoreRequisition {
  id: string;
  requisitionNumber: string;
  sourceStoreId?: string;
  destinationStoreId?: string;
  approvedBy?: string;
  approvalDate?: string;
  receivedBy?: string;
  receivedDate?: string;
  department: string;
  requestedBy: string;
  requestDate: string;
  items: {
    inventoryId?: string;
    itemCode: string;
    description: string;
    qtyRequested: number;
    qtyApproved: number;
    unit: string;
  }[];
  urgency: string;
  status: 'Pending' | 'Approved' | 'Issued' | 'Rejected';
  issuedBy?: string;
  issueDate?: string;
}

export interface GoodsReceivedNoteItem {
  id: string;
  inventoryId: string;
  itemCode: string;
  description: string;
  unit: string;
  orderedQty: number;
  previouslyReceivedQty: number;
  receivedQty: number;
  unitCost: number;
  batchNumber: string;
  expiryDate: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  lpoNumber: string;
  supplierName: string;
  receiptDate: string;
  receivedBy: string;
  invoiceNumber?: string;
  notes?: string;
  status: 'Posted' | 'Cancelled';
  receivingStoreId?: string;
  items: GoodsReceivedNoteItem[];
}

export interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  narration: string;
}

export interface JournalEntry {
  id: string;
  voucherNumber: string;
  date: string;
  referenceType:
    | 'Patient Billing'
    | 'Supplier Invoice'
    | 'Payroll'
    | 'Petty Cash'
    | 'SHA Reimbursement'
    | 'Bank Deposit'
    | 'Expense Voucher'
    | 'Stock Adjustment';
  referenceNumber: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  status: 'Draft' | 'Posted';
  postedBy: string;
}

export interface FixedAssetItem {
  id: string;
  assetTag: string;
  name: string;
  category:
    'Biomedical & Clinical' | 'Radiology & Imaging' | 'IT & Communications' | 'Hospital Furniture' | 'Plant & Machinery' | 'Motor Vehicles';
  modelOrSerial: string;
  department: string;
  purchaseDate: string;
  purchaseCostKSh: number;
  currentBookValueKSh: number;
  depreciationRatePercent: number;
  condition: 'Optimal' | 'Requires Service' | 'Under Repair' | 'Decommissioned';
  lastServiceDate?: string;
  nextServiceDate?: string;
  responsibleOfficer: string;
}

export interface BudgetAllocation {
  id: string;
  fiscalYear: string;
  department: string;
  costCenterCode: string;
  budgetCategory:
    | 'Clinical Supplies & Drugs'
    | 'Staff Salaries & Benefits'
    | 'Equipment & Maintenance'
    | 'Utilities & Facility'
    | 'SHA & Insurance Operations'
    | 'Admin & Training';
  allocatedAmountKSh: number;
  utilizedAmountKSh: number;
  balanceAmountKSh: number;
  utilizationRatePercent: number;
  status: 'On Track' | 'Warning' | 'Exceeded';
}

export * from './shaClaims';

export interface RefundRequest {
  id: string;
  patientId: string;
  patientName: string;
  invoiceId: string;
  description: string;
  amount: number;
  reason: string;
  source: string;
  sourceEntity?: string;
  sourceId?: string;
  requestedBy: string;
  requestedAt: string;
  status: 'Pending' | 'Refunded';
  refundMethod?: string;
  refundReference?: string;
  refundedBy?: string;
  refundedAt?: string;
}
