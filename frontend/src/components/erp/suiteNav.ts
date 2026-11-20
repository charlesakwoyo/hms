import type React from 'react';
import { useEffect, useState } from 'react';
import { FINANCE_PAGE_RIGHTS, STORES_ALL, STORES_PAGE_RIGHTS } from '../../services/moduleAccess';
import {
  Activity,
  ArrowRightLeft,
  Building2,
  Calculator,
  ClipboardList,
  DollarSign,
  FileText,
  HandCoins,
  LayoutDashboard,
  LineChart,
  Package,
  PieChart,
  Pill,
  Receipt,
  Search,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
  Wifi,
} from 'lucide-react';

export type SuiteModule = 'finance' | 'procurement_stores' | 'sha_claims';
export interface SuiteLink {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  group: string;
}

export const FINANCE_LINKS: SuiteLink[] = [
  { id: 'revenue', label: 'Revenue & Department Income', icon: HandCoins, color: 'text-emerald-300', group: 'Hospital Revenue & Care' },
  { id: 'petty', label: 'Petty Cash Manager', icon: Wallet, color: 'text-amber-400', group: 'Accounts & Finance' },
  { id: 'expenses', label: 'Expenses & Postings', icon: Receipt, color: 'text-rose-400', group: 'Accounts & Finance' },
  { id: 'budget', label: 'Budget & Variance', icon: PieChart, color: 'text-cyan-400', group: 'Accounts & Finance' },
  { id: 'payroll', label: 'HR & Payroll Suite', icon: Users, color: 'text-purple-400', group: 'Human Resources' },
  { id: 'stock', label: 'Pharmacy Stock & Requisitions', icon: Pill, color: 'text-emerald-400', group: 'Inventory & Stores' },
];

export const STORES_LINKS: SuiteLink[] = [
  { id: 'stock', label: 'Stock & Inventory', icon: Package, color: 'text-cyan-300', group: 'Core Modules' },
  { id: 'transfers', label: 'Inter-Store Transfers', icon: ArrowRightLeft, color: 'text-sky-300', group: 'Core Modules' },
  { id: 'requisitions', label: 'Dept Requisitions', icon: ClipboardList, color: 'text-amber-300', group: 'Core Modules' },
  { id: 'procurement', label: 'Procurement & LPO', icon: Truck, color: 'text-blue-300', group: 'Core Modules' },
  { id: 'audit', label: 'Stock Audit & Variances', icon: Calculator, color: 'text-emerald-300', group: 'Core Modules' },
  { id: 'suppliers', label: 'Supplier Registry', icon: Building2, color: 'text-teal-300', group: 'Finance & Suppliers' },
  { id: 'payables', label: 'Supplier Invoices (AP)', icon: FileText, color: 'text-rose-300', group: 'Finance & Suppliers' },
  { id: 'reports', label: 'Reports & Dashboard', icon: LineChart, color: 'text-purple-300', group: 'Analytics' },
];

export const SHA_LINKS: SuiteLink[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-green-300', group: 'SHA e-Claims' },
  { id: 'eligibility', label: 'Eligibility', icon: Search, color: 'text-green-300', group: 'SHA e-Claims' },
  { id: 'claims', label: 'Claims', icon: FileText, color: 'text-green-300', group: 'SHA e-Claims' },
  { id: 'phc_claims', label: 'PHC Claims', icon: Building2, color: 'text-green-300', group: 'SHA e-Claims' },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill, color: 'text-green-300', group: 'SHA e-Claims' },
  { id: 'drugs', label: 'Drug registry', icon: Package, color: 'text-green-300', group: 'SHA e-Claims' },
  { id: 'preauth', label: 'Preauthorizations', icon: ShieldCheck, color: 'text-green-300', group: 'SHA e-Claims' },
  { id: 'authorizations', label: 'Authorizations', icon: ArrowRightLeft, color: 'text-green-300', group: 'SHA e-Claims' },
  { id: 'pricelist', label: 'Pricelist', icon: ClipboardList, color: 'text-green-300', group: 'SHA e-Claims' },
  { id: 'diagnoses', label: 'PHC Diagnoses', icon: Activity, color: 'text-green-300', group: 'SHA e-Claims' },
  { id: 'invoices', label: 'Invoices', icon: Receipt, color: 'text-green-300', group: 'SHA e-Claims' },
  { id: 'reports', label: 'Reports', icon: LineChart, color: 'text-green-300', group: 'SHA e-Claims' },
  { id: 'remittance', label: 'Payments from SHA', icon: DollarSign, color: 'text-green-300', group: 'More' },
  { id: 'gateway', label: 'Settings & readiness', icon: Wifi, color: 'text-green-300', group: 'More' },
];

const SHA_PAGE_RIGHTS: Record<string, string> = {
  eligibility: 'sha:visits',
  claims: 'sha:claim-list',
  preauth: 'sha:preauth',
  remittance: 'sha:remittance',
  gateway: 'sha:readiness',
};
export const shaPageOk = (id: string, form: (all: string | string[], right: string) => boolean) => {
  const one = (t: string) => form(['sha:claims', 'billing:sha'], SHA_PAGE_RIGHTS[t] || '');
  if (id === 'phc_claims' || id === 'reports' || id === 'invoices') return one('claims');
  if (id === 'authorizations') return one('eligibility') || one('claims');
  return ['dashboard', 'pricelist', 'diagnoses', 'prescriptions', 'drugs'].includes(id) ? one('claims') || one('eligibility') : one(id);
};
export const shaLinksFor = (form: (all: string | string[], right: string) => boolean) => SHA_LINKS.filter((l) => shaPageOk(l.id, form));

export const financeAll = (has: (right: string) => boolean, role: string) =>
  has('accounts:ledger') || has('budget:manage') || has('reports:financial') || role === 'Billing Cashier';
export const financePageOk = (id: string, has: (right: string) => boolean, role: string) =>
  id === 'payroll' ? has('payroll:manage') : financeAll(has, role) || has(FINANCE_PAGE_RIGHTS[id] || '');
export const financeLinksFor = (has: (right: string) => boolean, role: string) =>
  FINANCE_LINKS.filter((l) => financePageOk(l.id, has, role));

export const storesPageOk = (id: string, has: (right: string) => boolean, role: string) =>
  role === 'Pharmacist' || STORES_ALL.some(has) || has(STORES_PAGE_RIGHTS[id] || '');
export const storesLinksFor = (has: (right: string) => boolean, role: string) => STORES_LINKS.filter((l) => storesPageOk(l.id, has, role));

const KEY: Record<SuiteModule, string> = { finance: 'wcFinanceTab', procurement_stores: 'wcStoresTab', sha_claims: 'wcShaTab' };
const OPEN = 'wisecare:open-suite-tab';
const SHOWN = 'wisecare:suite-tab';

export const savedSuiteTab = (suite: SuiteModule) => {
  try {
    return sessionStorage.getItem(KEY[suite]) || '';
  } catch {
    return '';
  }
};

export const openSuiteTab = (suite: SuiteModule, tab: string) => {
  try {
    sessionStorage.setItem(KEY[suite], tab);
  } catch {}
  window.dispatchEvent(new CustomEvent(OPEN, { detail: { suite, tab } }));
};

export const announceSuiteTab = (suite: SuiteModule, tab: string) => {
  try {
    sessionStorage.setItem(KEY[suite], tab);
  } catch {}
  window.dispatchEvent(new CustomEvent(SHOWN, { detail: { suite, tab } }));
};

export const useOpenSuiteTab = (suite: SuiteModule, setTab: (tab: string) => void) => {
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.suite === suite) setTab(d.tab);
    };
    window.addEventListener(OPEN, on);
    return () => window.removeEventListener(OPEN, on);
  }, [suite, setTab]);
};

export const useShownSuiteTab = (suite: SuiteModule) => {
  const [tab, setTab] = useState(() => savedSuiteTab(suite));
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.suite === suite) setTab(d.tab);
    };
    window.addEventListener(SHOWN, on);
    window.addEventListener(OPEN, on);
    return () => {
      window.removeEventListener(SHOWN, on);
      window.removeEventListener(OPEN, on);
    };
  }, [suite]);
  return tab;
};
