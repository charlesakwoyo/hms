import {
  Patient,
  VitalSign,
  ConsultationRecord,
  LabTestOrder,
  RadiologyOrder,
  Prescription,
  Bill,
  InventoryItem,
  QueueItem,
  StaffUser,
  Ward,
  Bed,
  InpatientAdmission,
  WardRoundNote,
  InpatientMedicationRecord,
  HospitalConfig,
  TariffPriceItem,
  SetupDiagnosis,
  SetupRadiologyItem,
  SetupNursingProcedure,
  SetupShaDailyRebate,
  AccessRight,
  SecurityRole,
} from '../types';

export const INITIAL_PATIENTS: Patient[] = [];

export const INITIAL_VITALS: VitalSign[] = [];

export const INITIAL_CONSULTATIONS: ConsultationRecord[] = [];

export const INITIAL_LAB_ORDERS: LabTestOrder[] = [];

export const INITIAL_RADIOLOGY_ORDERS: RadiologyOrder[] = [];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [];

export const INITIAL_BILLS: Bill[] = [];

export const INITIAL_INVENTORY: InventoryItem[] = [];

export const INITIAL_QUEUE: QueueItem[] = [];

export const INITIAL_USERS: StaffUser[] = [];

export const SYSTEM_ACCESS_RIGHTS: AccessRight[] = [
  {
    id: 'patients:read',
    name: 'View Patients Directory',
    description: 'Search and inspect patient demographic and medical records',
    category: 'Clinical & Consultation',
  },
  {
    id: 'patients:create',
    name: 'Register New Patients',
    description: 'Enroll new outpatient and inpatient profiles into HMIS',
    category: 'Clinical & Consultation',
  },
  {
    id: 'patients:edit',
    name: 'Edit Patient Records',
    description: 'Update patient demographics, insurance/SHA policies, and emergency contacts',
    category: 'Clinical & Consultation',
  },
  {
    id: 'appointments:manage',
    name: 'Appointments & SMS',
    description: 'Book appointments, change their status and send the patients SMS confirmations and reminders',
    category: 'Clinical & Consultation',
  },
  {
    id: 'queue:manage',
    name: 'Queue & Station Routing',
    description: 'Issue queue tokens and route patients between triage and doctor stations',
    category: 'Clinical & Consultation',
  },
  {
    id: 'triage:vitals',
    name: 'Record Vitals & Triage',
    description: 'Perform vitals measurements (BP, Pulse, SpO2, Temp), MEWS scoring, and triage categorization',
    category: 'Clinical & Consultation',
  },
  {
    id: 'consultation:read',
    name: 'View Clinical History',
    description: 'Access doctor consultation history, past notes, and diagnoses',
    category: 'Clinical & Consultation',
  },
  {
    id: 'consultation:write',
    name: 'Perform Doctor Consultation',
    description: 'Document patient clinical encounter, symptoms, physical examination, and management plans',
    category: 'Clinical & Consultation',
  },
  {
    id: 'consultation:diagnose',
    name: 'ICD-10 Diagnostic Coding',
    description: 'Assign primary and secondary ICD-10 medical diagnoses',
    category: 'Clinical & Consultation',
  },
  {
    id: 'walkin:manage',
    name: 'Walk-in Cash Services',
    description: 'Register walk-in clients and bill cash services without a consultation',
    category: 'Clinical & Consultation',
  },
  {
    id: 'queue:tv',
    name: 'Queue TV Console',
    description: 'Run the waiting-area queue display and call patients',
    category: 'Clinical & Consultation',
  },

  {
    id: 'inpatient:view',
    name: 'View Inpatient Wards & Beds',
    description: 'Monitor ward occupancy, bed status, and admitted patient censuses',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:admit',
    name: 'Direct Inpatient Admission',
    description: 'Admit patients from OPD consultation or emergency into wards and assign beds',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:rounds',
    name: 'Conduct Ward Rounds',
    description: 'Document ward round clinical findings, vitals checks, and consultant reviews',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:meds',
    name: 'Administer Inpatient Meds',
    description: 'Sign off medication administration records (MAR) and dosage schedules',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:transfer',
    name: 'Bed & Ward Transfers',
    description: 'Transfer patients between beds or wards (e.g. ICU to General)',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:discharge',
    name: 'Clinical Discharge Clearance',
    description: 'Approve medical discharge and trigger final inpatient billing',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:bookings',
    name: 'Bookings & Status',
    description: 'View theatre and dialysis bookings of admitted patients',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:beds',
    name: 'Ward & Bed Status',
    description: 'Monitor beds, mark beds ready and clean after discharge',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:admission-notes',
    name: 'Admission Clinical Notes',
    description: 'Admission clerking: examination, history, working diagnosis, investigations and the initial treatment plan',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:doctor-notes',
    name: 'Doctor Notes & ICD-11',
    description: 'Write SOAP progress notes and ICD-11 diagnoses for admitted patients',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:vitals',
    name: 'Patient Vitals Log',
    description: 'Record and review ward vitals (BP, pulse, temperature, SpO2)',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:io',
    name: 'Intake & Output (I/O)',
    description: 'Log fluid intake and output and the fluid balance',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:maternity',
    name: 'Maternity & Partograph',
    description: 'Maternity delivery records and partograph readings',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:orders',
    name: 'Orders & Nursing',
    description: 'Send ward orders to laboratory, radiology, pharmacy and procedures',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:billing',
    name: 'Inpatient Billing',
    description: 'View the interim bill, apply discounts and add miscellaneous items',
    category: 'Nursing & Inpatient Care',
  },
  {
    id: 'inpatient:efile',
    name: 'E-Inpatient File (PDF)',
    description: 'View and print the inpatient clinical file',
    category: 'Nursing & Inpatient Care',
  },

  {
    id: 'lab:order',
    name: 'Order Diagnostic Lab Tests',
    description: 'Request laboratory investigations from consultation or wards',
    category: 'Diagnostics & Laboratory',
  },
  {
    id: 'lab:collect',
    name: 'Collect & Barcode Samples',
    description: 'Acknowledge sample receipt, blood draw, or swab collection',
    category: 'Diagnostics & Laboratory',
  },
  {
    id: 'lab:results',
    name: 'Enter Lab Test Results',
    description: 'Record qualitative or quantitative test values and reference range notes',
    category: 'Diagnostics & Laboratory',
  },
  {
    id: 'lab:approve',
    name: 'Authorize & Verify Lab Reports',
    description: 'Final validation and clinical release of diagnostic reports',
    category: 'Diagnostics & Laboratory',
  },
  {
    id: 'radiology:order',
    name: 'Order Imaging & Scans',
    description: 'Order X-Ray, Ultrasound, CT, or MRI diagnostic imaging',
    category: 'Diagnostics & Laboratory',
  },
  {
    id: 'radiology:report',
    name: 'Upload & Finalize Radiology',
    description: 'Document radiological impressions and clinical findings',
    category: 'Diagnostics & Laboratory',
  },

  {
    id: 'dental:manage',
    name: 'Dental Clinic',
    description: 'Dental consultations: dental chart, treatment plan, Rx and the dental bill',
    category: 'Clinical & Consultation',
  },
  {
    id: 'cancer:manage',
    name: 'Cancer / Oncology — all forms',
    description: 'Every oncology form: treatment plans, cycles, sessions and billing',
    category: 'Cancer Treatment & Oncology',
  },
  {
    id: 'cancer:plans',
    name: 'Treatment Plans',
    description: 'Open new oncology treatment plans (protocol, diagnosis, stage, SHA pre-authorisation)',
    category: 'Cancer Treatment & Oncology',
  },
  {
    id: 'cancer:cycles',
    name: 'Chemotherapy Cycles',
    description: 'Create the next treatment cycle of a plan',
    category: 'Cancer Treatment & Oncology',
  },
  {
    id: 'cancer:sessions',
    name: 'Treatment Sessions & Items',
    description: 'Record treatment sessions and the drugs and services given',
    category: 'Cancer Treatment & Oncology',
  },
  {
    id: 'cancer:billing',
    name: 'Oncology Billing',
    description: 'Bill a treatment session and see the oncology invoices',
    category: 'Cancer Treatment & Oncology',
  },

  {
    id: 'theatre:manage',
    name: 'Operation Theatre — all forms',
    description: 'Every theatre form: bookings, theatre progress and the WHO checklist',
    category: 'Operation Theatre',
  },
  {
    id: 'theatre:book',
    name: 'Surgery Booking',
    description: 'Book a surgery (patient, procedure, surgeon, theatre, date)',
    category: 'Operation Theatre',
  },
  {
    id: 'theatre:progress',
    name: 'Theatre Progress',
    description: 'Move a surgery to In Theatre, Recovery and Completed',
    category: 'Operation Theatre',
  },
  {
    id: 'theatre:checklist',
    name: 'WHO Surgical Safety Checklist',
    description: 'Open and fill the WHO surgical safety checklist',
    category: 'Operation Theatre',
  },

  {
    id: 'dialysis:manage',
    name: 'Renal Dialysis — all forms',
    description: 'Every dialysis form: scheduling, starting and completing sessions',
    category: 'Renal & Dialysis',
  },
  {
    id: 'dialysis:schedule',
    name: 'Schedule Dialysis Session',
    description: 'Book a dialysis session (machine, pre-weight, target UF)',
    category: 'Renal & Dialysis',
  },
  {
    id: 'dialysis:start',
    name: 'Start Dialysis Session',
    description: 'Mark a scheduled session In Progress',
    category: 'Renal & Dialysis',
  },
  {
    id: 'dialysis:complete',
    name: 'Complete Dialysis Session',
    description: 'Complete a session with the post-dialysis weight, BP and UF volume',
    category: 'Renal & Dialysis',
  },

  {
    id: 'bloodbank:manage',
    name: 'Blood Bank — all forms',
    description: 'Every blood bank form: units, transfusion requests, crossmatch and issuing',
    category: 'Blood Bank',
  },
  {
    id: 'bloodbank:units',
    name: 'Register Blood Units',
    description: 'Add donated or received blood units to the inventory',
    category: 'Blood Bank',
  },
  {
    id: 'bloodbank:reserve',
    name: 'Reserve & Transfuse Units',
    description: 'Reserve a unit and mark it transfused',
    category: 'Blood Bank',
  },
  { id: 'bloodbank:requests', name: 'Transfusion Requests', description: 'Request blood for a patient', category: 'Blood Bank' },
  {
    id: 'bloodbank:crossmatch',
    name: 'Crossmatch & Issue',
    description: 'Record the crossmatch result and issue the blood',
    category: 'Blood Bank',
  },

  {
    id: 'morgue:manage',
    name: 'Mortuary — all forms',
    description: 'Every mortuary form: intake, embalming and release',
    category: 'Mortuary',
  },
  { id: 'morgue:intake', name: 'Body Intake', description: 'Admit a body into the mortuary and assign storage', category: 'Mortuary' },
  { id: 'morgue:embalm', name: 'Embalming', description: 'Mark a body embalmed', category: 'Mortuary' },
  { id: 'morgue:release', name: 'Body Release', description: 'Release a body with the burial permit number', category: 'Mortuary' },

  {
    id: 'pharmacy:prescribe',
    name: 'Prescribe Medications',
    description: 'Issue digital prescriptions with dosage, frequency, and duration',
    category: 'Pharmacy & Stock',
  },
  {
    id: 'pharmacy:dispense',
    name: 'Dispense Prescriptions',
    description: 'Verify, label, and dispense medication to outpatient or inpatient wards',
    category: 'Pharmacy & Stock',
  },
  {
    id: 'inventory:view',
    name: 'View Drug & Supply Stock',
    description: 'Inspect stock levels, batch numbers, reorder points, and unit costs',
    category: 'Stores, Pharmacy & Inventory',
  },
  {
    id: 'inventory:adjust',
    name: 'Adjust Stock & Replenish',
    description: 'Update inventory quantities, log supplier deliveries, and record batches',
    category: 'Stores, Pharmacy & Inventory',
  },
  { id: 'prescriptions:manage', name: 'Prescriptions', description: 'View and manage doctor prescriptions', category: 'Pharmacy & Stock' },
  {
    id: 'pharmacy:otc',
    name: 'Pharmacy OTC Sales (POS)',
    description: 'Sell over-the-counter items and print the sale receipt',
    category: 'Pharmacy & Stock',
  },

  {
    id: 'billing:view',
    name: 'View Patient Invoices',
    description: 'Inspect bill breakdowns, consultations, lab fees, and bed charges',
    category: 'Billing & Finance',
  },
  {
    id: 'billing:create',
    name: 'Generate Invoices & Tariffs',
    description: 'Apply hospital tariffs, room charges, and procedure fees',
    category: 'Billing & Finance',
  },
  {
    id: 'billing:collect',
    name: 'Process Payments & Receipts',
    description: 'Receive Cash, M-Pesa, Card, and print official fiscal receipts',
    category: 'Billing & Finance',
  },
  {
    id: 'billing:discount',
    name: 'Grant Bill Discounts',
    description: 'Give a discount on a bill at payment (printed as "Discount Amount by the Hospital Administrator")',
    category: 'Billing & Finance',
  },
  {
    id: 'billing:sha',
    name: 'SHA / NHIF Rebates & Claims',
    description: 'Apply Social Health Authority daily bed rebates and pre-authorization numbers',
    category: 'Billing & Finance',
  },
  {
    id: 'reports:financial',
    name: 'View Financial & Census Reports',
    description: 'Analyze revenue streams, departmental income, and inpatient stay metrics',
    category: 'Billing & Finance',
  },

  {
    id: 'sha:claims',
    name: 'SHA e-Claims — all pages',
    description: 'Every SHA page: patient visits, claims, pre-authorisations, payments from SHA and readiness',
    category: 'SHA e-Claims',
  },
  {
    id: 'sha:visits',
    name: 'SHA Patient Visits',
    description: 'Open SHA visits: eligibility, consent, diagnoses, services and closing the visit',
    category: 'SHA e-Claims',
  },
  { id: 'sha:claim-list', name: 'SHA Claims', description: 'Send, correct and follow claims at SHA', category: 'SHA e-Claims' },
  { id: 'sha:preauth', name: 'SHA Pre-authorisations', description: 'Ask for and follow pre-authorisations', category: 'SHA e-Claims' },
  {
    id: 'sha:remittance',
    name: 'Payments from SHA',
    description: 'SHA remittances and what each claim was paid',
    category: 'SHA e-Claims',
  },
  {
    id: 'sha:readiness',
    name: 'SHA Settings & Readiness',
    description: 'The link to the Connector, code mapping and go-live checks',
    category: 'SHA e-Claims',
  },

  {
    id: 'reprints:print',
    name: 'Document Reprints — all documents',
    description: 'Reprint every patient document',
    category: 'Document Reprints',
  },
  {
    id: 'reprints:summary',
    name: 'Outpatient Clinical Summary',
    description: 'Reprint outpatient clinical summaries',
    category: 'Document Reprints',
  },
  { id: 'reprints:discharge', name: 'Discharge Summary', description: 'Reprint discharge summaries', category: 'Document Reprints' },
  {
    id: 'reprints:admission-notes',
    name: 'Admission Clinical Notes',
    description: 'Reprint admission clinical notes',
    category: 'Document Reprints',
  },
  { id: 'reprints:lab', name: 'Laboratory Reports', description: 'Reprint laboratory reports', category: 'Document Reprints' },
  {
    id: 'reprints:external',
    name: 'External Requests & Referrals',
    description: 'Reprint external laboratory and radiology requests and referral letters',
    category: 'Document Reprints',
  },
  { id: 'reprints:invoices', name: 'Invoices', description: 'Reprint inpatient and outpatient invoices', category: 'Document Reprints' },
  { id: 'reprints:receipts', name: 'Receipts', description: 'Reprint payment receipts', category: 'Document Reprints' },
  {
    id: 'accounts:ledger',
    name: 'Finance — all pages',
    description: 'Accounts and ledger, revenue, petty cash, expenses and budget',
    category: 'Finance & HR',
  },
  {
    id: 'budget:manage',
    name: 'Budget Allocations',
    description: 'Departmental budget votes and fiscal allocations',
    category: 'Finance & HR',
  },
  {
    id: 'payroll:manage',
    name: 'HR & Payroll',
    description: 'Staff records, payroll, payslips and statutory deductions',
    category: 'Finance & HR',
  },
  {
    id: 'finance:revenue',
    name: 'Revenue & Department Income',
    description: 'Daily revenue by department and its posting to the ledger',
    category: 'Finance & HR',
  },
  {
    id: 'finance:petty',
    name: 'Petty Cash Manager',
    description: 'Petty cash vouchers, the float and replenishments',
    category: 'Finance & HR',
  },
  { id: 'finance:expenses', name: 'Expenses & Postings', description: 'Expense vouchers and expense heads', category: 'Finance & HR' },
  { id: 'finance:budget', name: 'Budget & Variance', description: 'Budget lines and spending against them', category: 'Finance & HR' },
  {
    id: 'finance:stock',
    name: 'Pharmacy Stock Glance',
    description: 'A quick look at pharmacy stock and reorder levels from Finance',
    category: 'Finance & HR',
  },
  {
    id: 'procurement:manage',
    name: 'Stores & Pharmacy — all pages',
    description: 'Every Stores page: stock, transfers, requisitions, procurement, audits, suppliers, supplier invoices and reports',
    category: 'Stores, Pharmacy & Inventory',
  },
  {
    id: 'stores:stock',
    name: 'Stock & Inventory',
    description: 'The item register, stock levels, batches and the pack calculator',
    category: 'Stores, Pharmacy & Inventory',
  },
  {
    id: 'stores:transfers',
    name: 'Inter-Store Transfers',
    description: 'Send stock between stores and receive it',
    category: 'Stores, Pharmacy & Inventory',
  },
  {
    id: 'stores:requisitions',
    name: 'Dept Requisitions',
    description: 'Department requisitions and stock issues from the stores',
    category: 'Stores, Pharmacy & Inventory',
  },
  {
    id: 'stores:procurement',
    name: 'Procurement & LPO',
    description: 'Local purchase orders and goods received notes',
    category: 'Stores, Pharmacy & Inventory',
  },
  {
    id: 'stores:audit',
    name: 'Stock Audit & Variances',
    description: 'Stock counts and variances',
    category: 'Stores, Pharmacy & Inventory',
  },
  {
    id: 'stores:suppliers',
    name: 'Supplier Registry',
    description: 'Suppliers and their details',
    category: 'Stores, Pharmacy & Inventory',
  },
  {
    id: 'stores:payables',
    name: 'Supplier Invoices (AP)',
    description: 'Supplier invoices and what is owed',
    category: 'Stores, Pharmacy & Inventory',
  },
  {
    id: 'stores:reports',
    name: 'Stores Reports & Dashboard',
    description: 'Stores reports and the stores dashboard',
    category: 'Stores, Pharmacy & Inventory',
  },

  {
    id: 'approve:procurement-l1',
    name: 'Approve LPOs — Level 1 (HOD)',
    description: 'First approval of local purchase orders in Procurement & LPO',
    category: 'Approvals',
  },
  {
    id: 'approve:procurement-l2',
    name: 'Approve LPOs — Level 2 (Finance)',
    description: 'Final (finance) authorisation of local purchase orders',
    category: 'Approvals',
  },
  {
    id: 'approve:inventory',
    name: 'Approve & Issue Requisitions',
    description: 'Approve department requisitions and issue the stock from the stores (the approver is printed on the issue note)',
    category: 'Approvals',
  },
  {
    id: 'approve:accounts',
    name: 'Approve Expenses & Petty Cash',
    description: 'Approve and pay expenses, petty cash vouchers and float replenishments in Accounts',
    category: 'Approvals',
  },
  {
    id: 'assets:manage',
    name: 'Fixed Assets',
    description: 'Fixed asset register, maintenance and depreciation',
    category: 'Finance & HR',
  },
  {
    id: 'reports:clinical',
    name: 'Clinical & Census Reports',
    description: 'Patient, admission, laboratory and service reports',
    category: 'Reports & Analytics',
  },
  {
    id: 'reports:stores',
    name: 'Stores & Inventory Reports',
    description: 'Stock, consumption and store movement reports',
    category: 'Reports & Analytics',
  },

  {
    id: 'users:view',
    name: 'View Staff Directory',
    description: 'Inspect list of authorized healthcare workers and stations',
    category: 'System & Security',
  },
  {
    id: 'users:manage',
    name: 'Manage Staff Credentials',
    description: 'Create user accounts, set usernames, passwords, and assigned roles',
    category: 'System & Security',
  },
  {
    id: 'roles:manage',
    name: 'Role Definition & Rights Selection',
    description: 'Create custom security roles and configure granular rights selection',
    category: 'System & Security',
  },
  { id: 'system:branches', name: 'Branches', description: 'Configure hospital branches', category: 'System & Security' },

  { id: 'system:setup', name: 'System Setup — all registers', description: 'Every setup register and Save All', category: 'System Setup' },
  {
    id: 'system:config',
    name: 'Hospital Profile',
    description: 'Hospital name, MFL code, level, KRA PIN, logo and letterhead',
    category: 'System Setup',
  },
  {
    id: 'system:tariffs',
    name: 'Sub-Category Tariffs & SHA Rebates',
    description: 'Bulk tariff prices per sub-category and the SHA daily rebates',
    category: 'System Setup',
  },
  { id: 'setup:patient-categories', name: 'Patient Categories', description: 'Patient categories', category: 'System Setup' },
  {
    id: 'setup:sub-categories',
    name: 'Sub-Categories & Schemes',
    description: 'Sub-categories, insurance schemes and their covers',
    category: 'System Setup',
  },
  { id: 'setup:departments', name: 'Hospital Departments', description: 'Departments of the hospital', category: 'System Setup' },
  {
    id: 'setup:consultations',
    name: 'Consultation Registers',
    description: 'Consultation services and their fees',
    category: 'System Setup',
  },
  { id: 'setup:wards', name: 'Ward Setup & Tariffs', description: 'Wards and their daily charges', category: 'System Setup' },
  { id: 'setup:beds', name: 'Inpatient Beds', description: 'Beds of each ward', category: 'System Setup' },
  { id: 'setup:packages', name: 'Inpatient Packages', description: 'Inpatient packages and what they include', category: 'System Setup' },
  {
    id: 'setup:lab-tests',
    name: 'Lab Tests & Parameters',
    description: 'Laboratory tests, specimens and their parameters',
    category: 'System Setup',
  },
  {
    id: 'setup:radiology',
    name: 'Radiology Studies & Templates',
    description: 'Radiology studies and report templates',
    category: 'System Setup',
  },
  {
    id: 'setup:nursing-procedures',
    name: 'Nursing Procedures',
    description: 'Nursing and minor procedures and their departments',
    category: 'System Setup',
  },
  { id: 'setup:icd11', name: 'ICD-11 Diagnostic Codes', description: 'The ICD-11 codes in use', category: 'System Setup' },
  {
    id: 'setup:cancer',
    name: 'Cancer / Oncology Setup',
    description: 'Oncology protocols, services and pre-authorisation rules',
    category: 'System Setup',
  },
  { id: 'setup:workflow', name: 'Workflow Mapping', description: 'Where each service sends the patient next', category: 'System Setup' },
  {
    id: 'system:developer',
    name: 'PHP & MySQL Hub',
    description: 'Database and source tools (administrators only)',
    category: 'System & Security',
  },
];

export const INITIAL_SECURITY_ROLES: SecurityRole[] = [];

export const INITIAL_HOSPITAL_CONFIG: HospitalConfig = {
  hospitalName: '',
  mflCode: '',
  facilityLevel: '',
  kraPin: '',
  shaProviderCode: '',
  county: '',
  subCounty: '',
  address: '',
  phone: '',
  emergencyHotline: '',
  email: '',
  website: '',
  currency: 'KES',
  timezone: 'Africa/Nairobi (UTC+3)',
};

export const INITIAL_WARDS: Ward[] = [];

export const INITIAL_BEDS: Bed[] = [];

export const INITIAL_ADMISSIONS: InpatientAdmission[] = [];

export const INITIAL_WARD_ROUNDS: WardRoundNote[] = [];

export const INITIAL_INPATIENT_MEDS: InpatientMedicationRecord[] = [];

export const INITIAL_TARIFF_PRICES: TariffPriceItem[] = [];

export const INITIAL_SETUP_DIAGNOSES: SetupDiagnosis[] = [];

export const INITIAL_SETUP_RADIOLOGY: SetupRadiologyItem[] = [];

export const INITIAL_SETUP_NURSING_PROCEDURES: SetupNursingProcedure[] = [];

export const INITIAL_SETUP_SHA_REBATES: SetupShaDailyRebate[] = [];
