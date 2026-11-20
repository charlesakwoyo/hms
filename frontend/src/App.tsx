import { useCallback, useEffect, useMemo, useState } from 'react';
import { Construction } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { LoginPage, type SessionUser as LoginUser } from './components/LoginPage';
import { PatientsModule } from './components/PatientsModule';
import { QueueModule } from './components/QueueModule';
import { Sidebar } from './components/Sidebar';
import { SystemSetupModule } from './components/SystemSetupModule';
import { useQueue } from './hooks/useQueue';
import { useSession } from './hooks/useSession';
import { apiClient } from './services/apiClient';
import { accessFor, SETUP_TAB_RIGHTS } from './services/moduleAccess';
import type { HospitalConfig, ModuleType, Patient, QueueItem, SecurityRole, UserRole } from './types';

const BUILT_MODULES: ModuleType[] = ['dashboard', 'patients', 'queue', 'system_setup'];

const DEFAULT_CONFIG = {
  hospitalName: 'WiseCare Hospital',
  mflCode: '',
  facilityLevel: '',
} as HospitalConfig;

const toRole = (row: Record<string, any>): SecurityRole => {
  let rights: string[] = [];
  try {
    rights = JSON.parse(String(row.rights_json || '[]'));
  } catch {
    rights = [];
  }
  return {
    id: String(row.id),
    name: String(row.name || ''),
    description: String(row.description || ''),
    isSystem: Number(row.is_system) === 1,
    rights: Array.isArray(rights) ? rights : [],
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
};

const toConfig = (row: Record<string, any> | undefined): HospitalConfig => {
  if (!row) return DEFAULT_CONFIG;
  const camel: Record<string, any> = {};
  Object.entries(row).forEach(([key, value]) => {
    camel[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = value;
  });
  return { ...DEFAULT_CONFIG, ...camel, timezone: camel.timezoneName || camel.timezone } as HospitalConfig;
};

const LaterPhase = ({ module }: { module: ModuleType }) => (
  <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
    <Construction className="mx-auto h-10 w-10 text-amber-500" />
    <h2 className="mt-3 text-lg font-bold text-gray-900">Coming in a later phase</h2>
    <p className="mt-1 text-sm text-gray-600">
      The {module.replace(/_/g, ' ')} module is being moved to the Laravel version. Dashboard, Patients, Queue & Encounters and System Setup
      are ready now.
    </p>
  </div>
);

export default function App() {
  const session = useSession();
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hospitalConfig, setHospitalConfig] = useState<HospitalConfig>(DEFAULT_CONFIG);
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [previousModule, setPreviousModule] = useState<ModuleType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [queueFocusPatientId, setQueueFocusPatientId] = useState<string>();
  const queueState = useQueue(session.user?.name || '');

  const role = (session.user?.role || 'Receptionist') as UserRole;
  const access = useMemo(() => accessFor(role, roles), [role, roles]);

  const loadAll = useCallback(async () => {
    const [roleRows, patientRows, configRows] = await Promise.all([
      apiClient.getEntity('security-roles'),
      apiClient.getPatients(),
      apiClient.getEntity('hospital-config'),
    ]);
    setRoles(roleRows.map(toRole));
    setPatients(patientRows);
    setHospitalConfig(toConfig(configRows[0]));
    await queueState.load();
  }, [queueState.load]);

  useEffect(() => {
    if (session.state === 'signed-in') void loadAll();
  }, [session.state, loadAll]);

  const navigate = useCallback(
    (module: ModuleType) => {
      setPreviousModule(activeModule);
      setActiveModule(module);
      setMobileMenuOpen(false);
    },
    [activeModule],
  );

  const addPatient = async (data: Omit<Patient, 'id' | 'registeredDate' | 'status'>): Promise<Patient | boolean> => {
    const result = await apiClient.persistPatient({ ...data, status: 'Registered', shaVerified: false });
    if (!result.success) {
      window.alert(`The patient was not saved.\n\n${result.error || 'Try again; if it keeps happening, tell the System Administrator.'}`);
      return false;
    }
    const saved = result.data as Patient;
    setPatients((current) => [saved, ...current]);
    return saved;
  };

  const updatePatient = async (patient: Patient): Promise<boolean> => {
    const result = await apiClient.persistPatient(patient);
    if (!result.success) {
      window.alert(
        `The patient's changes were not saved.\n\n${result.error || 'Try again; if it keeps happening, tell the System Administrator.'}`,
      );
      return false;
    }
    const saved = result.data as Patient;
    setPatients((current) => current.map((p) => (p.id === saved.id ? saved : p)));
    return true;
  };

  const queuePatient = async (patient: Patient, service: any, fee: number, subCategory: string) => {
    if (queueState.enqueue(patient, service, fee, subCategory)) {
      setPatients((current) => current.map((p) => (p.id === patient.id ? { ...p, status: 'In Triage' } : p)));
    }
  };

  const selectConsultation = async (item: QueueItem, service: any, fee: number, subCategory: string) => {
    const patient = patients.find((p) => p.id === item.patientId);
    const method = String(patient?.insuranceProvider || item.paymentMethod || '').trim();
    const cash = /cash|m-pesa/i.test(method);
    if (cash && Number(fee) <= 0) {
      window.alert(
        `No consultation price is configured for ${service.name} under patient sub-category ${subCategory || 'this patient'}. Configure the price in System Setup before billing.`,
      );
      return;
    }
    await apiClient.persistQueueItem({
      ...item,
      consultationServiceId: Number(service.id),
      consultationServiceCode: service.code,
      consultationType: service.name,
      consultationFee: Number(fee),
      patientSubCategory: subCategory,
      paymentMethod: method || item.paymentMethod,
      consultationFeePaid: !cash,
    });
    await queueState.load();
  };

  if (session.state === 'checking') {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">Loading WiseCare…</div>;
  }

  if (session.state === 'signed-out' || !session.user) {
    return (
      <LoginPage
        pendingUser={session.user?.mustChangePassword ? (session.user as LoginUser) : null}
        onLogin={(user) => session.signIn(user as unknown as Parameters<typeof session.signIn>[0])}
      />
    );
  }

  const activeQueueCount = queueState.queue.filter((q) => q.currentStation !== 'Discharged').length;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/60 font-sans text-gray-900 antialiased">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        activeModule={activeModule}
        setActiveModule={navigate}
        canOpen={access.canOpen}
        canOpenIpd={access.canOpenIpd}
        pendingLabCount={0}
        queueCount={activeQueueCount}
      />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <Header
          onOpenMenu={() => setMobileMenuOpen(true)}
          hospitalName={hospitalConfig.hospitalName}
          activeModule={activeModule}
          setActiveModule={navigate}
          currentUserRole={role}
          setCurrentUserRole={() => undefined}
          userName={session.user.name}
          availableRoles={[session.user.role]}
          onLogout={() => void session.signOut()}
          mySqlConnected
        />
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          {activeModule === 'dashboard' && (
            <Dashboard
              patients={patients}
              bills={[]}
              labOrders={[]}
              queue={queueState.queue}
              setActiveModule={navigate}
              canOpen={access.canOpen}
              roleMissing={access.roleMissing ? role : ''}
              onQuickRegister={() => navigate('patients')}
            />
          )}
          {activeModule === 'patients' && (
            <PatientsModule
              hospitalConfig={hospitalConfig}
              patients={patients}
              onAddPatient={addPatient}
              onUpdatePatient={updatePatient}
              onSendToTriage={(patient) => {
                setQueueFocusPatientId(patient.id);
                navigate('queue');
              }}
            />
          )}
          {activeModule === 'queue' && (
            <QueueModule
              queue={queueState.queue}
              patients={patients}
              onMoveStation={(id, station) => queueState.moveStation(id, station, patients)}
              onUpdatePriority={queueState.setPriority}
              onCallPatient={queueState.call}
              onRecallPatient={queueState.call}
              onCompleteAndNext={(id, station) => queueState.completeAndNext(id, patients, station)}
              onSelectConsultationForQueue={selectConsultation}
              onQueueRegisteredPatient={queuePatient}
              focusPatientId={queueFocusPatientId}
            />
          )}
          {activeModule === 'system_setup' && (
            <SystemSetupModule
              can={(tab) =>
                tab === 'mpesa_api' || tab === 'sha_connection' ? access.isAdmin : access.form('system:setup', SETUP_TAB_RIGHTS[tab] || '')
              }
              canSaveAll={access.has('system:setup')}
              hospitalConfig={hospitalConfig}
              onUpdateHospitalConfig={(config) => {
                setHospitalConfig(config);
                void apiClient.persistEntity('hospital-config', config);
              }}
              onGoBack={() => navigate(previousModule)}
            />
          )}
          {!BUILT_MODULES.includes(activeModule) && <LaterPhase module={activeModule} />}
        </main>
      </div>
    </div>
  );
}
