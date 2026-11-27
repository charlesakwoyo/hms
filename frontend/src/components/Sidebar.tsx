import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  UserRoundPlus,
  ListOrdered,
  HeartPulse,
  Stethoscope,
  BedDouble,
  FlaskConical,
  Pill,
  FileSpreadsheet,
  Radiation,
  CreditCard,
  Package,
  BarChart3,
  ShieldCheck,
  Heart,
  Ribbon,
  Sliders,
  Scissors,
  Building2,
  Activity,
  Droplet,
  Truck,
  Scale,
  Wrench,
  PieChart,
  ChevronDown,
  CalendarCheck,
  FilePlus2,
  Droplets,
  Baby,
  ClipboardCheck,
  Receipt,
  FileDown,
  NotebookPen,
  LogOut,
  Laptop,
  Printer,
  Smile,
} from 'lucide-react';
import { LaboratoryPage, ModuleType } from '../types';
import { IPD_LINKS, IpdView } from './inpatient/ipdViews';
import { FINANCE_LINKS, SHA_LINKS, STORES_LINKS, SuiteLink, SuiteModule, openSuiteTab, useShownSuiteTab } from './erp/suiteNav';

const IPD_ICON_COLOR: Record<IpdView, string> = {
  bookings: 'text-white',
  admitted: 'text-amber-300',
  beds: 'text-emerald-400',
  admission: 'text-blue-300',
  admission_notes: 'text-sky-300',
  doctor_notes: 'text-sky-300',
  vitals: 'text-rose-400',
  io: 'text-blue-400',
  maternity: 'text-pink-400',
  emar: 'text-purple-400',
  orders: 'text-teal-400',
  billing: 'text-amber-400',
  efile: 'text-rose-400',
  ward_rounds: 'text-amber-400',
  dialysis: 'text-cyan-400',
  theatre: 'text-rose-400',
  discharge: 'text-emerald-400',
};
const IPD_ICONS: Record<IpdView, React.ComponentType<{ className?: string }>> = {
  bookings: CalendarCheck,
  admitted: Users,
  beds: BedDouble,
  admission: FilePlus2,
  admission_notes: NotebookPen,
  doctor_notes: Stethoscope,
  vitals: HeartPulse,
  io: Droplets,
  maternity: Baby,
  emar: Pill,
  orders: ClipboardCheck,
  billing: Receipt,
  efile: FileDown,
  ward_rounds: NotebookPen,
  dialysis: Activity,
  theatre: Scissors,
  discharge: LogOut,
};

interface SidebarProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  pendingLabCount: number;
  laboratoryPage: LaboratoryPage;
  onSelectLaboratoryPage: (page: LaboratoryPage) => void;
  queueCount: number;
  inpatientCount?: number;

  mobileOpen?: boolean;
  onCloseMobile?: () => void;

  ipdView?: IpdView;
  onSelectIpdView?: (view: IpdView) => void;

  canOpen?: (module: ModuleType) => boolean;
  canOpenIpd?: (view: IpdView) => boolean;

  financeLinks?: SuiteLink[];
  storesLinks?: SuiteLink[];
  shaLinks?: SuiteLink[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  pendingLabCount,
  laboratoryPage,
  onSelectLaboratoryPage,
  queueCount,
  inpatientCount = 0,
  mobileOpen = false,
  onCloseMobile,
  ipdView,
  onSelectIpdView,
  canOpen = () => true,
  canOpenIpd = () => true,
  financeLinks = FINANCE_LINKS,
  storesLinks = STORES_LINKS,
  shaLinks = SHA_LINKS,
}) => {
  const choose = (m: ModuleType) => {
    setActiveModule(m);
    onCloseMobile?.();
  };

  const ipdActive = activeModule === 'inpatient';
  const [ipdOpen, setIpdOpen] = useState(ipdActive);
  useEffect(() => {
    if (ipdActive) setIpdOpen(true);
  }, [ipdActive]);
  const laboratoryActive = activeModule === 'laboratory';
  const [laboratoryOpen, setLaboratoryOpen] = useState(laboratoryActive);
  useEffect(() => {
    if (laboratoryActive) setLaboratoryOpen(true);
  }, [laboratoryActive]);
  const chooseIpd = (v: IpdView) => {
    onSelectIpdView?.(v);
    onCloseMobile?.();
  };
  const ipdLinkActive = (l: (typeof IPD_LINKS)[number]) => (l.module ? false : ipdActive && ipdView === l.id);
  const renderIpdLink = (l: (typeof IPD_LINKS)[number]) => {
    const Icon = IPD_ICONS[l.id];
    const on = ipdLinkActive(l);
    return (
      <button
        key={l.id}
        id={`nav-ipd-${l.id}`}
        onClick={() => chooseIpd(l.id)}
        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-[11px] transition cursor-pointer ${on ? 'bg-[#1e5288] text-white font-semibold' : 'text-slate-200 hover:bg-[#064477] hover:text-white font-medium'}`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${IPD_ICON_COLOR[l.id]}`} />
        <span className="truncate">{l.label}</span>
      </button>
    );
  };

  const shownTab: Record<SuiteModule, string> = {
    finance: useShownSuiteTab('finance'),
    procurement_stores: useShownSuiteTab('procurement_stores'),
    sha_claims: useShownSuiteTab('sha_claims'),
  };
  const [suiteOpen, setSuiteOpen] = useState<Record<SuiteModule, boolean>>({
    finance: activeModule === 'finance',
    procurement_stores: activeModule === 'procurement_stores',
    sha_claims: activeModule === 'sha_claims',
  });
  useEffect(() => {
    if (activeModule === 'finance' || activeModule === 'procurement_stores' || activeModule === 'sha_claims')
      setSuiteOpen((o) => ({ ...o, [activeModule]: true }));
  }, [activeModule]);
  const suiteLinks: Record<SuiteModule, SuiteLink[]> = { finance: financeLinks, procurement_stores: storesLinks, sha_claims: shaLinks };
  const chooseSuite = (m: SuiteModule, tab: string) => {
    openSuiteTab(m, tab);
    setActiveModule(m);
    onCloseMobile?.();
  };
  const renderSuite = (m: SuiteModule, label: string, Icon: React.ComponentType<{ className?: string }>) => {
    const open = suiteOpen[m];
    const links = suiteLinks[m];
    let lastGroup = '';
    return (
      <div key={m}>
        <button
          id={`nav-${m}`}
          onClick={() => setSuiteOpen((o) => ({ ...o, [m]: !o[m] }))}
          aria-expanded={open}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-all cursor-pointer bg-[#084F8A] border-b border-[#064477] hover:text-white ${activeModule === m ? 'text-white' : 'text-sky-300'} ${open ? 'rounded-t-lg' : 'rounded-lg'}`}
        >
          <div className="flex items-center gap-2 min-w-0 text-left">
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="leading-tight">{label}</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-blue-200 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="bg-[#095A9D] p-1.5 rounded-b-lg space-y-1 border-x border-b border-[#084F8A] mb-1">
            {links.map((l) => {
              const LIcon = l.icon;
              const on = activeModule === m && shownTab[m] === l.id;
              const head = l.group !== lastGroup ? (lastGroup = l.group) : '';
              return (
                <React.Fragment key={l.id}>
                  {head && (
                    <div className="px-2.5 pt-1.5 pb-0.5 text-[9px] font-bold text-blue-200/70 uppercase tracking-wider">{head}</div>
                  )}
                  <button
                    id={`nav-${m}-${l.id}`}
                    onClick={() => chooseSuite(m, l.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-[11px] transition cursor-pointer ${on ? 'bg-[#1e5288] text-white font-semibold' : 'text-slate-200 hover:bg-[#064477] hover:text-white font-medium'}`}
                  >
                    <LIcon className={`w-4 h-4 flex-shrink-0 ${l.color}`} />
                    <span className="truncate">{l.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  const clinicalItems = [
    { id: 'dashboard' as ModuleType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients' as ModuleType, label: 'Patients', icon: Users },
    { id: 'walkin' as ModuleType, label: 'Walk-in Cash Services', icon: UserRoundPlus },
    { id: 'appointments' as ModuleType, label: 'Appointments & SMS', icon: CalendarClock },
    {
      id: 'queue' as ModuleType,
      label: 'Queue & Encounters',
      icon: ListOrdered,
      badge: queueCount > 0 ? queueCount : undefined,
    },
    { id: 'triage' as ModuleType, label: 'Vitals & Triage', icon: HeartPulse },
    { id: 'consultation' as ModuleType, label: 'Consultation', icon: Stethoscope },
    { id: 'dental' as ModuleType, label: 'Dental Clinic', icon: Smile },
    {
      id: 'inpatient' as ModuleType,
      label: 'Inpatient (IPD)',
      icon: BedDouble,
      badge: inpatientCount > 0 ? inpatientCount : undefined,
    },
    { id: 'cancer' as ModuleType, label: 'Cancer / Oncology', icon: Ribbon },
    { id: 'theatre' as ModuleType, label: 'Operation Theatre', icon: Scissors },
    { id: 'dialysis' as ModuleType, label: 'Renal Dialysis', icon: Activity },
    { id: 'blood_bank' as ModuleType, label: 'Blood Bank', icon: Droplet },
    { id: 'morgue' as ModuleType, label: 'Mortuary / Morgue', icon: Building2 },
  ];

  const diagnosticItems = [
    {
      id: 'laboratory' as ModuleType,
      label: 'Laboratory',
      icon: FlaskConical,
      badge: pendingLabCount > 0 ? pendingLabCount : undefined,
    },
    { id: 'pharmacy' as ModuleType, label: 'Pharmacy', icon: Pill },
    { id: 'prescriptions' as ModuleType, label: 'Prescriptions', icon: FileSpreadsheet },
    { id: 'radiology' as ModuleType, label: 'Radiology', icon: Radiation },
  ];

  const financeItems = [
    { id: 'billing' as ModuleType, label: 'Billing & Cashier', icon: CreditCard },
    { id: 'sha_claims' as ModuleType, label: 'SHA e-Claims (DHA)', icon: ShieldCheck },
    { id: 'accounts' as ModuleType, label: 'Accounts & Ledger', icon: Scale },
    { id: 'finance' as ModuleType, label: 'Finance, HR & Payroll', icon: PieChart },
  ];

  const opsItems = [
    { id: 'procurement_stores' as ModuleType, label: 'Stores & Pharmacy Inventory', icon: Truck },
    { id: 'fixed_assets' as ModuleType, label: 'Fixed Assets', icon: Wrench },
    { id: 'reprints' as ModuleType, label: 'Document Reprints', icon: Printer },
    { id: 'reports' as ModuleType, label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'users' as ModuleType, label: 'Users & Security', icon: ShieldCheck },
    { id: 'system_setup' as ModuleType, label: 'System Setup', icon: Sliders },
  ];

  const ipdLinks = IPD_LINKS.filter((l) => canOpenIpd(l.id));
  const ipdMain = ipdLinks.filter((l) => l.group !== 'emr');
  const ipdEmr = ipdLinks.filter((l) => l.group === 'emr');
  const ipdHead = ipdMain.filter((l) => IPD_LINKS.indexOf(l) <= IPD_LINKS.findIndex((x) => x.id === 'admission_notes'));
  const ipdTail = ipdMain.filter((l) => !ipdHead.includes(l));
  const renderNavGroup = (title: string, allItems: typeof clinicalItems) => {
    const items = allItems.filter((i) => canOpen(i.id));
    return !items.length ? null : (
      <div>
        <p className="px-3 text-[10px] font-black text-blue-200/70 uppercase tracking-wider mb-1.5">{title}</p>
        <nav className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            if (item.id === 'finance' || item.id === 'procurement_stores' || item.id === 'sha_claims')
              return renderSuite(item.id, item.label, Icon);
            if (item.id === 'laboratory')
              return (
                <div key={item.id}>
                  <button
                    id="nav-laboratory"
                    type="button"
                    onClick={() => setLaboratoryOpen((open) => !open)}
                    aria-expanded={laboratoryOpen}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all cursor-pointer ${
                      isActive ? 'bg-[#272727] text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {item.badge !== undefined && <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-gray-900">{item.badge}</span>}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${laboratoryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {laboratoryOpen && (
                    <div className="ml-5 space-y-0.5 border-l border-white/10 py-1 pl-2">
                      {(['Visits', 'Orders', 'Specimen', 'Results'] as LaboratoryPage[]).map((page) => (
                        <button
                          key={page}
                          id={`nav-laboratory-${page.toLowerCase()}`}
                          type="button"
                          aria-current={laboratoryActive && laboratoryPage === page ? 'page' : undefined}
                          onClick={() => {
                            onSelectLaboratoryPage(page);
                            onCloseMobile?.();
                          }}
                          className={`w-full rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                            laboratoryActive && laboratoryPage === page
                              ? 'bg-[#272727] font-semibold text-white'
                              : 'text-blue-100 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            if (item.id === 'inpatient')
              return (
                <div key={item.id}>
                  <button
                    id="nav-inpatient"
                    onClick={() => setIpdOpen((o) => !o)}
                    aria-expanded={ipdOpen}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-sky-300 uppercase tracking-wider transition-all cursor-pointer bg-[#084F8A] border-b border-[#064477] hover:text-white ${ipdOpen ? 'rounded-t-lg' : 'rounded-lg'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label} Forms</span>
                    </div>
                    <span className="flex items-center gap-1.5">
                      {item.badge !== undefined && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-gray-900 shadow-xs">
                          {item.badge}
                        </span>
                      )}
                      <ChevronDown className={`w-3.5 h-3.5 text-blue-200 transition-transform ${ipdOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {ipdOpen && (
                    <div className="bg-[#095A9D] p-1.5 rounded-b-lg space-y-1 border-x border-b border-[#084F8A] mb-1">
                      {ipdHead.map(renderIpdLink)}
                      {ipdEmr.length > 0 && (
                        <div className="pt-1 pb-1">
                          <div className="px-2.5 py-1 text-[10px] font-bold text-purple-300 uppercase tracking-wider bg-[#064477] rounded flex items-center gap-1.5">
                            <Laptop className="w-3.5 h-3.5" /> Patient EMR & Clinical Suite
                          </div>
                          <div className="pl-2 space-y-1 mt-1 border-l-2 border-purple-400 ml-1">{ipdEmr.map(renderIpdLink)}</div>
                        </div>
                      )}
                      {ipdTail.map(renderIpdLink)}
                    </div>
                  )}
                </div>
              );
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => choose(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-left transition-all cursor-pointer ${
                  isActive ? 'bg-white text-[#0b66b2] shadow-md font-semibold' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0b66b2]' : 'text-blue-200'}`} />
                  <span className="truncate text-xs">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-[#0b66b2] text-white' : 'bg-amber-400 text-gray-900 shadow-xs'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <>
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/40 z-30" onClick={onCloseMobile} aria-hidden="true" />}
      <aside
        id="sidebar-container"
        className={`w-64 bg-[#0b66b2] text-white flex flex-col h-screen select-none flex-shrink-0 shadow-xl z-40 fixed inset-y-0 left-0 transition-transform duration-200 lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          id="sidebar-brand"
          onClick={() => choose('dashboard')}
          className="p-4 flex items-center space-x-3 cursor-pointer border-b border-blue-600/50 hover:bg-blue-700/40 transition"
        >
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
            <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-extrabold text-lg tracking-tight text-white">WiseCare</span>
            </div>
            <p className="text-[10px] font-bold tracking-widest text-cyan-200 uppercase -mt-0.5">HMIS • Level 4/5</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 text-xs scrollbar-thin">
          {renderNavGroup('Clinical Services', clinicalItems)}
          {renderNavGroup('Diagnostics & Pharmacy', diagnosticItems)}
          {renderNavGroup('Finance & SHA Claims', financeItems)}
          {renderNavGroup('Procurement & Admin', opsItems)}
        </div>
      </aside>
    </>
  );
};
