import { useCallback, useEffect, useMemo, useState } from 'react';
import { Construction } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { LoginPage, type SessionUser as LoginUser } from './components/LoginPage';
import { PatientsModule } from './components/PatientsModule';
import { QueueModule } from './components/QueueModule';
import { ConsultationModule } from './components/ConsultationModule';
import { LaboratoryModule } from './components/LaboratoryModule';
import { InpatientModule } from './components/InpatientModule';
import type { IpdView } from './components/inpatient/ipdViews';
import { Sidebar } from './components/Sidebar';
import { SystemSetupModule } from './components/SystemSetupModule';
import { TriageModule } from './components/TriageModule';
import { useQueue } from './hooks/useQueue';
import { useSession } from './hooks/useSession';
import { apiClient } from './services/apiClient';
import { accessFor, SETUP_TAB_RIGHTS } from './services/moduleAccess';
import type { HospitalConfig, LaboratoryPage, ModuleType, Patient, PatientSaveOutcome, QueueItem, SecurityRole, UserRole, Ward } from './types';

const BUILT_MODULES: ModuleType[] = ['dashboard', 'patients', 'queue', 'triage', 'consultation', 'laboratory', 'inpatient', 'system_setup'];

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
  const [wards, setWards] = useState<Ward[]>([]);
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [laboratoryPage, setLaboratoryPage] = useState<LaboratoryPage>('Visits');
  const [ipdView, setIpdView] = useState<IpdView>('admitted');
  const [previousModule, setPreviousModule] = useState<ModuleType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [queueFocusPatientId, setQueueFocusPatientId] = useState<string>();
  const queueState = useQueue(session.user?.name || '');

  const role = (session.user?.role || 'Receptionist') as UserRole;
  const access = useMemo(() => accessFor(role, roles), [role, roles]);

  const loadAll = useCallback(async () => {
    const [roleRows, patientPage, configRows, wardRows] = await Promise.all([
      apiClient.getEntity('security-roles'),
      apiClient.getPatients({ perPage: 100 }),
      apiClient.getEntity('hospital-config'),
      apiClient.getSetupEntity('wards'),
    ]);
    setRoles(roleRows.map(toRole));
    setPatients(patientPage.data);
    setHospitalConfig(toConfig(configRows[0]));
    setWards(wardRows);
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

  const addPatient = async (
    data: Omit<Patient, 'id' | 'registeredDate' | 'status'> & Record<string, any>,
  ): Promise<PatientSaveOutcome> => {
    const result = await apiClient.persistPatient({ ...data, status: 'Registered', shaVerified: false });
    if (result.success && result.patient) {
      setPatients((current) => [result.patient as Patient, ...current]);
    }
    return result;
  };

  const updatePatient = async (patient: Patient): Promise<PatientSaveOutcome> => {
    const result = await apiClient.persistPatient(patient);
    if (result.success && result.patient) {
      const saved = result.patient;
      setPatients((current) => current.map((p) => (p.id === saved.id ? saved : p)));
    }
    return result;
  };

  const changePatientStatus = async (patient: Patient, status: 'Active' | 'Inactive'): Promise<Patient> => {
    const saved = await apiClient.setPatientStatus(patient.id, status);
    setPatients((current) => current.map((p) => (p.id === saved.id ? saved : p)));
    return saved;
  };

  const refreshPatientAndQueue = useCallback(async () => {
    const [patientPage, wardRows] = await Promise.all([
      apiClient.getPatients({ perPage: 100 }),
      apiClient.getSetupEntity('wards'),
      queueState.load(),
    ]);
    setPatients(patientPage.data);
    setWards(wardRows);
  }, [queueState.load]);

  const updateWards = async (nextWards: Ward[]) => {
    const removed = wards.filter((ward) => !nextWards.some((next) => next.id === ward.id));
    setWards(nextWards);
    const results = await Promise.all([
      ...nextWards.map((ward) => apiClient.persistEntity('wards', ward)),
      ...removed.map((ward) => apiClient.deleteEntity('wards', ward.id)),
    ]);
    const failed = results.filter((result) => !result.success);
    if (failed.length) {
      window.alert(`Some ward changes were not saved. ${failed.map((result) => result.error).filter(Boolean).join('; ')}`);
      const savedWards = await apiClient.getSetupEntity('wards');
      setWards(savedWards);
    }
  };

  const queuePatient = async (patient: Patient, service: any, fee: number, subCategory: string) => {
    const result = await queueState.enqueue(patient, service, fee, subCategory);
    if (result.success === false) {
      window.alert(result.error);
      return;
    }
    const status: Patient['status'] = result.destination === 'Billing' ? 'At Billing' : 'In Triage';
    setPatients((current) => current.map((p) => (p.id === patient.id ? { ...p, status } : p)));
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
        laboratoryPage={laboratoryPage}
        ipdView={ipdView}
        onSelectIpdView={(view) => {
          setIpdView(view);
          navigate('inpatient');
        }}
        onSelectLaboratoryPage={(page) => {
          setLaboratoryPage(page);
          navigate('laboratory');
        }}
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
              can={(rights) => access.anyOf(Array.isArray(rights) ? rights : [rights])}
              onSetPatientStatus={changePatientStatus}
              onPatientsChanged={() => void loadAll()}
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
              canRecordPayment={access.anyOf(['billing:collect'])}
              onRecordConsultationPayment={queueState.recordConsultationPayment}
              onContinueAfterPayment={queueState.continueAfterPayment}
              onSelectConsultationForQueue={selectConsultation}
              onQueueRegisteredPatient={queuePatient}
              focusPatientId={queueFocusPatientId}
            />
          )}
          {activeModule === 'triage' && <TriageModule queue={queueState.queue} onRoute={queueState.route} />}
          {activeModule === 'consultation' && <ConsultationModule onCallPatient={queueState.call} />}
          {activeModule === 'laboratory' && <LaboratoryModule page={laboratoryPage} onWorkflowUpdated={queueState.load} />}
          {activeModule === 'inpatient' && <InpatientModule view={ipdView} onWorkflowUpdated={refreshPatientAndQueue} />}
          {activeModule === 'system_setup' && (
            <SystemSetupModule
              can={(tab) =>
                tab === 'mpesa_api' || tab === 'sha_connection' ? access.isAdmin : access.form('system:setup', SETUP_TAB_RIGHTS[tab] || '')
              }
              canSaveAll={access.has('system:setup')}
              hospitalConfig={hospitalConfig}
              wards={wards}
              onUpdateWards={(next) => void updateWards(next)}
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
