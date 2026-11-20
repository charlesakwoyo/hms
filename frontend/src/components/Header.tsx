import React, { useState } from 'react';
import { User, LogOut, ChevronDown, Database, Download, CheckCircle2, Bell, UserRound, KeyRound, Trash2 } from 'lucide-react';
import { UserRole, ModuleType } from '../types';

interface HeaderProps {
  activeModule: ModuleType;
  setActiveModule: (m: ModuleType) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (r: UserRole) => void;
  userName?: string;
  availableRoles?: string[];
  onLogout?: () => void;
  onOpenProfile?: (tab: 'details' | 'password' | 'delete') => void;
  onOpenDownloadModal?: () => void;
  onOpenMySqlModal?: () => void;
  mySqlConnected?: boolean;

  onOpenMenu?: () => void;

  hospitalName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  setActiveModule,
  currentUserRole,
  setCurrentUserRole,
  userName = 'System Administrator',
  availableRoles,
  onLogout,
  onOpenProfile,
  onOpenMySqlModal,
  mySqlConnected = false,
  onOpenMenu,
  hospitalName,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'dashboard':
        return 'Dashboard';
      case 'patients':
        return 'Patients Registration & Reception';
      case 'queue':
        return 'Live Patient Queue & Station Encounters';
      case 'triage':
        return 'Nursing Vitals & Triage Assessment';
      case 'consultation':
        return 'Doctor Clinical Consultation Room';
      case 'inpatient':
        return 'Inpatient Department (IPD) & Ward Management';
      case 'laboratory':
        return 'Clinical Laboratory & Pathology Diagnostics';
      case 'pharmacy':
        return 'Pharmacy Dispensary & Stock Dispensing';
      case 'prescriptions':
        return 'Doctor Prescriptions Management';
      case 'radiology':
        return 'Radiology & Medical Imaging';
      case 'billing':
        return 'Billing, Invoicing & Cashier (KSh)';
      case 'inventory':
        return 'Pharmacy & Supplies Inventory Stock';
      case 'reports':
        return 'Hospital Analytics & Financial Reports';
      case 'users':
        return 'Staff Directory, Roles & Security';
      case 'system_setup':
        return 'System Setup & Institutional Configuration';
      case 'reprints':
        return 'Patient Document Reprints';
      case 'phpmysql':
        return 'PHP & MySQL Full Stack Code Hub & Schema';
      default:
        return hospitalName?.trim() || 'WiseCare HMIS';
    }
  };

  const defaultRoles: UserRole[] = [
    'System Administrator',
    'Medical Doctor',
    'Triage Nurse',
    'Pharmacist',
    'Laboratory Technician',
    'Radiologist',
    'Billing Cashier',
    'Receptionist',
  ];

  const roles = availableRoles && availableRoles.length > 0 ? availableRoles : defaultRoles;

  return (
    <header
      id="app-header"
      className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-2 shadow-xs sticky top-0 z-10"
    >
      <div className="flex items-center gap-2 min-w-0">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="lg:hidden p-2 -ml-1 rounded-lg text-gray-700 hover:bg-gray-100 shrink-0"
            aria-label="Open menu"
            title="Menu"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <h1 className="text-sm sm:text-lg font-bold text-gray-800 tracking-tight truncate">{getModuleTitle()}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button
          id="header-btn-mysql-sync"
          onClick={onOpenMySqlModal}
          className={`hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-xs ${
            mySqlConnected
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
          }`}
          title="Database connection"
        >
          <Database className={`w-3.5 h-3.5 ${mySqlConnected ? 'text-emerald-600' : 'text-blue-600'}`} />
          <span>{mySqlConnected ? 'Database Connected' : 'Database Connecting…'}</span>
          <span className={`w-2 h-2 rounded-full ${mySqlConnected ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}></span>
        </button>

        <div
          id="header-mwavuli360-logo"
          className="hidden sm:flex items-center h-10 px-2.5 rounded-lg border border-gray-200 bg-white shadow-xs"
          title="Mwavuli 360"
        >
          <img src="images/mwavuli360-logo.png" alt="Mwavuli 360" className="h-7 w-auto object-contain" />
        </div>

        <div className="hidden md:flex items-center space-x-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Online</span>
        </div>

        <div className="relative sm:border-l sm:pl-4 border-gray-200">
          <button
            id="user-role-dropdown-btn"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-2.5 text-gray-700 hover:text-blue-600 transition"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-gray-900 leading-tight">{userName}</p>
              <p className="text-[10px] text-blue-600 font-semibold">{currentUserRole}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showRoleMenu && (
            <div
              id="user-role-dropdown-menu"
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
            >
              {onOpenProfile && (
                <div className="py-1 border-b border-gray-100">
                  {(
                    [
                      ['details', 'Edit my profile', UserRound],
                      ['password', 'Change password', KeyRound],
                      ['delete', 'Delete my account', Trash2],
                    ] as const
                  ).map(([tab, text, Icon]) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenProfile(tab);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 cursor-pointer ${
                        tab === 'delete' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {text}
                    </button>
                  ))}
                </div>
              )}
              <div className="px-3 py-1.5 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Switch Active Role</p>
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setCurrentUserRole(r as UserRole);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition ${
                    currentUserRole === r ? 'font-bold text-blue-700 bg-blue-50/60' : 'text-gray-700'
                  }`}
                >
                  <span>{r}</span>
                  {currentUserRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1 px-3">
                <p className="text-[11px] text-gray-400 py-1">Logged in as {userName}</p>
              </div>
            </div>
          )}
        </div>

        <button
          id="header-logout-btn"
          title="Sign Out / Lock Session"
          onClick={onLogout || (() => alert('Session locked.'))}
          className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
