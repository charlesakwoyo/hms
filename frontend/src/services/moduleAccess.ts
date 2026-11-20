import { ModuleType, SecurityRole } from '../types';
import { IpdView, IPD_LINKS } from '../components/inpatient/ipdViews';

export const ADMIN_ROLE = 'System Administrator';

export const MODULE_RIGHTS: Record<ModuleType, string[]> = {
  dashboard: [],
  patients: ['patients:read', 'patients:create', 'patients:edit'],
  walkin: ['walkin:manage'],
  appointments: ['appointments:manage'],
  queue: ['queue:manage', 'queue:tv'],
  triage: ['triage:vitals'],
  consultation: ['consultation:read', 'consultation:write', 'consultation:diagnose'],
  dental: ['dental:manage', 'consultation:write'],
  inpatient: [],
  cancer: ['cancer:manage', 'cancer:plans', 'cancer:cycles', 'cancer:sessions', 'cancer:billing'],
  theatre: ['theatre:manage', 'theatre:book', 'theatre:progress', 'theatre:checklist'],
  dialysis: ['dialysis:manage', 'dialysis:schedule', 'dialysis:start', 'dialysis:complete'],
  blood_bank: ['bloodbank:manage', 'bloodbank:units', 'bloodbank:reserve', 'bloodbank:requests', 'bloodbank:crossmatch'],
  morgue: ['morgue:manage', 'morgue:intake', 'morgue:embalm', 'morgue:release'],
  laboratory: ['lab:collect', 'lab:results', 'lab:approve'],
  pharmacy: ['pharmacy:dispense', 'pharmacy:otc'],
  prescriptions: ['prescriptions:manage', 'pharmacy:prescribe', 'pharmacy:dispense'],
  radiology: ['radiology:report'],
  billing: ['billing:view', 'billing:create', 'billing:collect'],
  sha_claims: ['sha:claims', 'billing:sha', 'sha:visits', 'sha:claim-list', 'sha:preauth', 'sha:remittance', 'sha:readiness'],
  accounts: ['accounts:ledger'],
  budget: ['budget:manage'],
  finance: [
    'accounts:ledger',
    'budget:manage',
    'payroll:manage',
    'reports:financial',
    'finance:revenue',
    'finance:petty',
    'finance:expenses',
    'finance:budget',
    'finance:stock',
  ],
  procurement_stores: [
    'procurement:manage',
    'stores:requisitions',
    'inventory:view',
    'inventory:adjust',
    'stores:stock',
    'stores:transfers',
    'stores:procurement',
    'stores:audit',
    'stores:suppliers',
    'stores:payables',
    'stores:reports',
  ],
  fixed_assets: ['assets:manage'],
  inventory: ['inventory:view', 'inventory:adjust'],
  reprints: [
    'reprints:print',
    'reprints:summary',
    'reprints:discharge',
    'reprints:admission-notes',
    'reprints:lab',
    'reprints:external',
    'reprints:invoices',
    'reprints:receipts',
  ],
  reports: ['reports:financial', 'reports:clinical', 'reports:stores'],
  users: ['users:view', 'users:manage', 'roles:manage'],
  system_setup: [
    'system:setup',
    'system:tariffs',
    'system:config',
    'system:branches',
    'setup:patient-categories',
    'setup:sub-categories',
    'setup:departments',
    'setup:consultations',
    'setup:wards',
    'setup:beds',
    'setup:packages',
    'setup:lab-tests',
    'setup:radiology',
    'setup:nursing-procedures',
    'setup:icd11',
    'setup:cancer',
    'setup:workflow',
  ],
  phpmysql: [],
};

export const IPD_VIEW_RIGHTS: Record<IpdView, string[]> = {
  bookings: ['inpatient:bookings'],
  admitted: ['inpatient:view'],
  beds: ['inpatient:beds', 'inpatient:view'],
  admission: ['inpatient:admit'],
  admission_notes: ['inpatient:admission-notes'],
  doctor_notes: ['inpatient:doctor-notes'],
  vitals: ['inpatient:vitals'],
  io: ['inpatient:io'],
  maternity: ['inpatient:maternity'],
  emar: ['inpatient:meds'],
  orders: ['inpatient:orders'],
  billing: ['inpatient:billing'],
  efile: ['inpatient:efile'],
  ward_rounds: ['inpatient:rounds'],
  dialysis: ['dialysis:manage', 'dialysis:schedule', 'dialysis:start', 'dialysis:complete'],
  theatre: ['theatre:manage', 'theatre:book', 'theatre:progress', 'theatre:checklist'],
  discharge: ['inpatient:discharge', 'inpatient:transfer'],
};

export interface Access {
  isAdmin: boolean;

  roleMissing: boolean;
  canOpen: (m: ModuleType) => boolean;
  canOpenIpd: (v: IpdView) => boolean;

  has: (right: string) => boolean;

  form: (all: string | string[], right: string) => boolean;
}

export const accessFor = (roleName: string, roles: SecurityRole[]): Access => {
  const isAdmin = roleName === ADMIN_ROLE;
  const role = roles.find(
    (r) =>
      r.name.trim().toLowerCase() ===
      String(roleName || '')
        .trim()
        .toLowerCase(),
  );
  const rights = new Set(isAdmin ? [] : role?.rights || []);
  const any = (list: string[]) => list.some((r) => rights.has(r));
  const canOpenIpd = (v: IpdView) => {
    if (isAdmin) return true;
    const link = IPD_LINKS.find((l) => l.id === v);
    if (!link) return false;
    return any(IPD_VIEW_RIGHTS[v] || []);
  };
  const canOpen = (m: ModuleType) => {
    if (isAdmin || m === 'dashboard') return true;
    if (m === 'phpmysql') return false;
    if (m === 'inpatient') return IPD_LINKS.some((l) => !l.module && canOpenIpd(l.id));
    return any(MODULE_RIGHTS[m] || []);
  };
  const has = (right: string) => isAdmin || rights.has(right);
  const form = (all: string | string[], right: string) => has(right) || ([] as string[]).concat(all).some(has);
  return { isAdmin, roleMissing: !isAdmin && !role, canOpen, canOpenIpd, has, form };
};

export const STARTER_RIGHTS: Record<string, string[]> = {
  'medical doctor': [
    'patients:read',
    'patients:edit',
    'queue:manage',
    'consultation:read',
    'consultation:write',
    'consultation:diagnose',
    'lab:order',
    'radiology:order',
    'pharmacy:prescribe',
    'prescriptions:manage',
    'inpatient:view',
    'inpatient:admit',
    'inpatient:rounds',
    'inpatient:admission-notes',
    'inpatient:doctor-notes',
    'inpatient:orders',
    'inpatient:discharge',
    'inpatient:efile',
    'inpatient:vitals',
    'reports:clinical',
  ],
  'triage nurse': [
    'patients:read',
    'queue:manage',
    'triage:vitals',
    'consultation:read',
    'inpatient:view',
    'inpatient:beds',
    'inpatient:vitals',
    'inpatient:io',
    'inpatient:meds',
    'inpatient:orders',
    'inpatient:maternity',
    'inpatient:transfer',
  ],
  nurse: [
    'patients:read',
    'queue:manage',
    'triage:vitals',
    'consultation:read',
    'inpatient:view',
    'inpatient:beds',
    'inpatient:vitals',
    'inpatient:io',
    'inpatient:meds',
    'inpatient:orders',
    'inpatient:maternity',
    'inpatient:transfer',
  ],
  pharmacist: [
    'patients:read',
    'pharmacy:dispense',
    'pharmacy:otc',
    'prescriptions:manage',
    'inventory:view',
    'inventory:adjust',
    'stores:requisitions',
    'approve:inventory',
    'reports:stores',
  ],
  'laboratory technician': ['patients:read', 'lab:collect', 'lab:results', 'lab:approve', 'reports:clinical'],
  radiologist: ['patients:read', 'radiology:report', 'reports:clinical'],
  'billing cashier': [
    'patients:read',
    'billing:view',
    'billing:create',
    'billing:collect',
    'billing:sha',
    'sha:claims',
    'inpatient:billing',
    'reprints:print',
    'reports:financial',
  ],
  cashier: ['patients:read', 'billing:view', 'billing:create', 'billing:collect', 'reprints:print'],
  receptionist: [
    'patients:read',
    'patients:create',
    'patients:edit',
    'appointments:manage',
    'queue:manage',
    'queue:tv',
    'walkin:manage',
    'reprints:print',
  ],
};
export const starterRightsFor = (roleName: string) =>
  STARTER_RIGHTS[
    String(roleName || '')
      .trim()
      .toLowerCase()
  ] || ['patients:read'];

export const FINANCE_PAGE_RIGHTS: Record<string, string> = {
  revenue: 'finance:revenue',
  petty: 'finance:petty',
  expenses: 'finance:expenses',
  budget: 'finance:budget',
  payroll: 'payroll:manage',
  stock: 'finance:stock',
};
export const STORES_PAGE_RIGHTS: Record<string, string> = {
  stock: 'stores:stock',
  transfers: 'stores:transfers',
  requisitions: 'stores:requisitions',
  procurement: 'stores:procurement',
  audit: 'stores:audit',
  suppliers: 'stores:suppliers',
  payables: 'stores:payables',
  reports: 'stores:reports',
};

export const STORES_ALL = ['procurement:manage', 'inventory:view', 'inventory:adjust'];
export const SETUP_TAB_RIGHTS: Record<string, string> = {
  patient_categories: 'setup:patient-categories',
  sub_categories: 'setup:sub-categories',
  departments: 'setup:departments',
  consultations: 'setup:consultations',
  wards: 'setup:wards',
  inpatient_beds: 'setup:beds',
  inpatient_packages: 'setup:packages',
  sub_category_pricing: 'system:tariffs',
  sha_rebates: 'system:tariffs',
  lab_tests: 'setup:lab-tests',
  radiology_tests: 'setup:radiology',
  radiology_templates: 'setup:radiology',
  nursing_procedures: 'setup:nursing-procedures',
  icd11_codes: 'setup:icd11',
  cancer_setup: 'setup:cancer',
  workflow_mappings: 'setup:workflow',
  hospital_data: 'system:config',
};
export const REPRINT_RIGHTS: Record<string, string> = {
  summary: 'reprints:summary',
  discharge: 'reprints:discharge',
  'admission-notes': 'reprints:admission-notes',
  lab: 'reprints:lab',
  'ext-laboratory': 'reprints:external',
  'ext-radiology': 'reprints:external',
  'ext-referral': 'reprints:external',
  'ipd-invoice': 'reprints:invoices',
  'op-invoice': 'reprints:invoices',
  receipt: 'reprints:receipts',
};
