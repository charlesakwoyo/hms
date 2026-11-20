import { ShaRebateSetup } from './ShaRebateSetup';
import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Users,
  Layers,
  FolderTree,
  Stethoscope,
  Sliders,
  FlaskConical,
  TestTube,
  ListChecks,
  Banknote,
  Radiation,
  FileText,
  Activity,
  Syringe,
  Package,
  Pill,
  BookOpen,
  Search,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  RotateCcw,
  ArrowLeft,
  BedDouble,
  ShieldCheck,
  Zap,
  Check,
  Smartphone,
} from 'lucide-react';
import {
  HospitalConfig,
  TariffPriceItem,
  SetupShaDailyRebate,
  SetupPatientCategory,
  SetupPatientSubCategory,
  SetupDepartment,
  SetupConsultationService,
  SetupBedItem,
  SetupInpatientPackage,
  SetupLabTestItem,
  SetupRadiologyTestItem,
  SetupRadiologyTemplate,
  SetupNursingProcedureItem,
  SetupPharmacyItem,
  SetupIcd11Item,
  Ward,
} from '../types';
import {
  INITIAL_PATIENT_CATEGORIES,
  INITIAL_PATIENT_SUB_CATEGORIES,
  INITIAL_DEPARTMENTS,
  INITIAL_CONSULTATION_SERVICES,
  INITIAL_INPATIENT_BEDS,
  INITIAL_INPATIENT_PACKAGES,
  INITIAL_LAB_TESTS,
  INITIAL_RADIOLOGY_TESTS,
  INITIAL_RADIOLOGY_TEMPLATES,
  INITIAL_NURSING_PROCEDURES,
  INITIAL_PHARMACY_DRUGS,
  INITIAL_ICD11_CODES,
} from '../data/systemSetupData';
import { INITIAL_SETUP_SHA_REBATES } from '../data/initialData';
import { SetupPatientRegisters } from './setup/SetupPatientRegisters';
import { SetupDepartmentConsultation } from './setup/SetupDepartmentConsultation';
import { SetupInpatientRegisters } from './setup/SetupInpatientRegisters';
import { SetupDiagnosticRegisters } from './setup/SetupDiagnosticRegisters';
import { SetupPricingRegisters } from './setup/SetupPricingRegisters';
import { ExcelImportModal } from './setup/ExcelImportModal';
import { downloadSetupSampleTemplate } from '../utils/setupExcelUtils';
import { apiClient } from '../services/apiClient';
import { CancerSetupRegisters } from './setup/CancerSetupRegisters';
import { SetupWardRegisters } from './setup/SetupWardRegisters';
import { MpesaApiSetup } from './setup/MpesaApiSetup';
import { ShaConnectionSetup } from './setup/ShaConnectionSetup';
import { SetupWorkflowMappings } from './setup/SetupWorkflowMappings';

interface SystemSetupModuleProps {
  onGoBack: () => void;
  hospitalConfig?: HospitalConfig;
  onUpdateHospitalConfig?: (config: HospitalConfig) => void;
  tariffPrices?: TariffPriceItem[];
  onUpdateTariffPrices?: (prices: TariffPriceItem[]) => void;
  shaRebates?: SetupShaDailyRebate[];
  onUpdateShaRebates?: (rebates: SetupShaDailyRebate[]) => void;
  wards?: Ward[];
  onUpdateWards?: (wards: Ward[]) => void;
  setupBeds?: SetupBedItem[];
  onUpdateSetupBeds?: (beds: SetupBedItem[]) => void;

  can?: (tab: SetupTabKey) => boolean;
  canSaveAll?: boolean;
}

export type SetupTabKey =
  | 'hospital_data'
  | 'mpesa_api'
  | 'sha_connection'
  | 'patient_categories'
  | 'sub_categories'
  | 'departments'
  | 'consultations'
  | 'wards'
  | 'inpatient_beds'
  | 'inpatient_packages'
  | 'sub_category_pricing'
  | 'lab_tests'
  | 'radiology_tests'
  | 'radiology_templates'
  | 'nursing_procedures'
  | 'icd11_codes'
  | 'sha_rebates'
  | 'cancer_setup'
  | 'workflow_mappings';

export const SystemSetupModule: React.FC<SystemSetupModuleProps> = ({
  onGoBack,
  hospitalConfig,
  onUpdateHospitalConfig,
  tariffPrices,
  onUpdateTariffPrices,
  shaRebates: propShaRebates,
  onUpdateShaRebates,
  wards = [],
  onUpdateWards,
  setupBeds: propSetupBeds,
  onUpdateSetupBeds,
  can = () => true,
  canSaveAll = true,
}) => {
  const [tabWanted, setActiveTab] = useState<SetupTabKey>('patient_categories');
  const NAV_ITEMS: { key: SetupTabKey; label: string; icon: any }[] = [
    { key: 'patient_categories', label: 'Patient Categories', icon: Users },
    { key: 'sub_categories', label: 'Sub-Categories & Schemes', icon: Layers },
    { key: 'departments', label: 'Hospital Departments', icon: FolderTree },
    { key: 'consultations', label: 'Consultation Registers', icon: Stethoscope },
    { key: 'wards', label: 'Ward Setup & Tariffs', icon: Building2 },
    { key: 'inpatient_beds', label: 'Inpatient Beds', icon: BedDouble },
    { key: 'inpatient_packages', label: 'Inpatient Packages', icon: Package },
    { key: 'sub_category_pricing', label: 'Sub-Category Tariffs (Bulk Update)', icon: Zap },
    { key: 'lab_tests', label: 'Lab Tests & Parameters', icon: FlaskConical },
    { key: 'radiology_tests', label: 'Radiology Studies', icon: Radiation },
    { key: 'radiology_templates', label: 'Radiology Report Templates', icon: FileText },
    { key: 'nursing_procedures', label: 'Nursing Procedures', icon: Syringe },
    { key: 'icd11_codes', label: 'ICD-11 Diagnostic Codes', icon: BookOpen },
    { key: 'sha_rebates', label: 'SHA Daily Rebates', icon: Banknote },
    { key: 'cancer_setup', label: 'Cancer / Oncology Setup', icon: Activity },
    { key: 'workflow_mappings', label: 'Workflow Mapping', icon: Activity },
    { key: 'hospital_data', label: 'Hospital Profile', icon: Building2 },
    { key: 'mpesa_api', label: 'M-PESA / Daraja API', icon: Smartphone },
    { key: 'sha_connection', label: 'SHA connection', icon: ShieldCheck },
  ];
  const navItems = NAV_ITEMS.filter((n) => can(n.key));
  const activeTab: SetupTabKey | '' = navItems.some((n) => n.key === tabWanted) ? tabWanted : (navItems[0]?.key ?? '');

  const [showImportModal, setShowImportModal] = useState(false);
  const [importSuccessToast, setImportSuccessToast] = useState<string | null>(null);

  const [hospitalData, setHospitalData] = useState({
    hospitalName: hospitalConfig?.hospitalName || '',
    mflCode: hospitalConfig?.mflCode || '',
    facilityLevel: hospitalConfig?.facilityLevel || '',
    kraPin: hospitalConfig?.kraPin || '',
    shaProviderCode: hospitalConfig?.shaProviderCode || '',
    county: hospitalConfig?.county || '',
    subCounty: hospitalConfig?.subCounty || '',
    address: hospitalConfig?.address || '',
    phone: hospitalConfig?.phone || '',
    emergencyHotline: hospitalConfig?.emergencyHotline || '',
    email: hospitalConfig?.email || '',
    website: hospitalConfig?.website || '',
    currency: hospitalConfig?.currency || 'KES',
    timezone: hospitalConfig?.timezone || 'Africa/Nairobi (UTC+3)',
    logo: hospitalConfig?.logo || '',
    slogan: hospitalConfig?.slogan || '',
    letterheadLogo: hospitalConfig?.letterheadLogo || 'standard',
  });
  const [hospitalSaveToast, setHospitalSaveToast] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupSaving, setSetupSaving] = useState(false);
  const [setupDbMessage, setSetupDbMessage] = useState('Loading System Setup…');

  const [categories, setCategories] = useState<SetupPatientCategory[]>(INITIAL_PATIENT_CATEGORIES);
  const [subCategories, setSubCategories] = useState<SetupPatientSubCategory[]>(INITIAL_PATIENT_SUB_CATEGORIES);

  const [departments, setDepartments] = useState<SetupDepartment[]>(INITIAL_DEPARTMENTS);
  const [consultations, setConsultations] = useState<SetupConsultationService[]>(INITIAL_CONSULTATION_SERVICES);

  const [beds, setBeds] = useState<SetupBedItem[]>(propSetupBeds && propSetupBeds.length ? propSetupBeds : INITIAL_INPATIENT_BEDS);

  useEffect(() => {
    if (!propSetupBeds) return;
    if (JSON.stringify(propSetupBeds) === JSON.stringify(beds)) return;
    setupInitialSnapshots.current.beds = new Map(propSetupBeds.map((x: any) => [String(x.id), JSON.stringify(x)]));
    setBeds(propSetupBeds);
  }, [propSetupBeds]);
  const updateSetupBeds = (next: SetupBedItem[]) => {
    setBeds(next);
    onUpdateSetupBeds?.(next);
  };
  const normalizeInpatientPackage = (raw: any): SetupInpatientPackage => {
    const parseJson = (value: any, fallback: any) => {
      if (Array.isArray(value) || (value && typeof value === 'object')) return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return fallback;
        }
      }
      return fallback;
    };
    const procedures = parseJson(raw?.includedProcedures ?? raw?.included_procedures_json, []);
    const prices = parseJson(raw?.subCategoryPrices ?? raw?.sub_category_prices_json, {});
    return {
      id: Number(raw?.id ?? Date.now()),
      packageCode: String(raw?.packageCode ?? raw?.package_code ?? ''),
      packageName: String(raw?.packageName ?? raw?.package_name ?? ''),
      wardType: String(raw?.wardType ?? raw?.ward_type ?? ''),
      includedDays: Number(raw?.includedDays ?? raw?.included_days ?? 0),
      includedProcedures: Array.isArray(procedures) ? procedures.map((x: any) => String(x)) : [],
      cashPrice: Number(raw?.cashPrice ?? raw?.cash_price ?? 0),
      subCategoryPrices:
        prices && typeof prices === 'object' && !Array.isArray(prices)
          ? Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, Number(v) || 0]))
          : {},
      overstayDailyRate: Number(raw?.overstayDailyRate ?? raw?.overstay_daily_rate ?? 0),
      description: String(raw?.description ?? ''),
      status: raw?.status === 'Inactive' ? 'Inactive' : 'Active',
    };
  };
  const [packages, setPackages] = useState<SetupInpatientPackage[]>(INITIAL_INPATIENT_PACKAGES.map(normalizeInpatientPackage));

  const [labTests, setLabTests] = useState<SetupLabTestItem[]>(INITIAL_LAB_TESTS);
  const [radiologyTests, setRadiologyTests] = useState<SetupRadiologyTestItem[]>(INITIAL_RADIOLOGY_TESTS);
  const [radiologyTemplates, setRadiologyTemplates] = useState<SetupRadiologyTemplate[]>(INITIAL_RADIOLOGY_TEMPLATES);
  const [nursingProcedures, setNursingProcedures] = useState<SetupNursingProcedureItem[]>(INITIAL_NURSING_PROCEDURES);
  const [pharmacyItems, setPharmacyItems] = useState<SetupPharmacyItem[]>(INITIAL_PHARMACY_DRUGS);
  const [icd11Codes, setIcd11Codes] = useState<SetupIcd11Item[]>(INITIAL_ICD11_CODES);

  const [shaRebates, setShaRebates] = useState<SetupShaDailyRebate[]>(
    propShaRebates && propShaRebates.length > 0 ? propShaRebates : INITIAL_SETUP_SHA_REBATES,
  );

  const setupInitialSnapshots = useRef({
    categories: new Map(INITIAL_PATIENT_CATEGORIES.map((x) => [String(x.id), JSON.stringify(x)])),
    subCategories: new Map(INITIAL_PATIENT_SUB_CATEGORIES.map((x) => [String(x.id), JSON.stringify(x)])),
    departments: new Map(INITIAL_DEPARTMENTS.map((x) => [String(x.id), JSON.stringify(x)])),
    consultations: new Map(INITIAL_CONSULTATION_SERVICES.map((x) => [String(x.id), JSON.stringify(x)])),

    beds: new Map(
      (propSetupBeds && propSetupBeds.length ? propSetupBeds : INITIAL_INPATIENT_BEDS).map((x) => [String(x.id), JSON.stringify(x)]),
    ),
    packages: new Map(INITIAL_INPATIENT_PACKAGES.map((x) => [String(x.id), JSON.stringify(x)])),
    labTests: new Map(INITIAL_LAB_TESTS.map((x) => [String(x.id), JSON.stringify(x)])),
    radiologyTests: new Map(INITIAL_RADIOLOGY_TESTS.map((x) => [String(x.id), JSON.stringify(x)])),
    radiologyTemplates: new Map(INITIAL_RADIOLOGY_TEMPLATES.map((x) => [String(x.id), JSON.stringify(x)])),
    nursingProcedures: new Map(INITIAL_NURSING_PROCEDURES.map((x) => [String(x.id), JSON.stringify(x)])),
    pharmacyItems: new Map(INITIAL_PHARMACY_DRUGS.map((x) => [String(x.id), JSON.stringify(x)])),
    icd11Codes: new Map(INITIAL_ICD11_CODES.map((x) => [String(x.id), JSON.stringify(x)])),
    shaRebates: new Map(
      (propShaRebates && propShaRebates.length > 0 ? propShaRebates : INITIAL_SETUP_SHA_REBATES).map((x) => [
        String(x.id),
        JSON.stringify(x),
      ]),
    ),
  });

  const persistChangedSetup = (entity: string, rows: any[], initial: Map<string, string>) => {
    rows
      .filter((x) => initial.get(String(x.id)) !== JSON.stringify(x))
      .forEach((x) => {
        initial.set(String(x.id), JSON.stringify(x));
        void apiClient.persistEntity(entity, x);
      });
  };

  const setupEntityConfig: Array<[string, string, any[], (rows: any[]) => void]> = [
    ['setup-patient-categories', 'categories', categories, setCategories as any],
    ['setup-patient-subcategories', 'subCategories', subCategories, setSubCategories as any],
    ['setup-departments', 'departments', departments, setDepartments as any],
    ['setup-consultation-services', 'consultations', consultations, setConsultations as any],
    ['setup-bed-items', 'beds', beds, setBeds as any],
    ['setup-inpatient-packages', 'packages', packages, setPackages as any],
    ['setup-lab-tests', 'labTests', labTests, setLabTests as any],
    ['setup-radiology-tests', 'radiologyTests', radiologyTests, setRadiologyTests as any],
    ['setup-radiology-templates', 'radiologyTemplates', radiologyTemplates, setRadiologyTemplates as any],
    ['setup-nursing-procedures', 'nursingProcedures', nursingProcedures, setNursingProcedures as any],
    ['setup-pharmacy-drugs', 'pharmacyItems', pharmacyItems, setPharmacyItems as any],
    ['setup-icd11', 'icd11Codes', icd11Codes, setIcd11Codes as any],
  ];

  const loadSetupFromDatabase = async () => {
    setSetupLoading(true);
    setSetupDbMessage('Loading System Setup…');
    try {
      const dbStatus = await apiClient.getStatus();
      if (!dbStatus?.connected) {
        setSetupDbMessage('Cannot reach the WiseCare server right now; System Setup will load as soon as it answers.');
        setSetupLoading(false);
        return;
      }
      const [results, inventoryRows] = await Promise.all([
        Promise.all(setupEntityConfig.map(async ([entity]) => [entity, await apiClient.getSetupEntity(entity)] as const)),
        apiClient.getEntity('inventory'),
      ]);
      const loaded: Record<string, any[]> = {};
      for (const [entity, rows] of results) loaded[entity] = rows;

      if (Array.isArray(inventoryRows) && inventoryRows.length) {
        const existing = loaded['setup-pharmacy-drugs'] || [];
        const byCode = new Map(
          existing.map((row: any) => [
            String(row.code || '')
              .trim()
              .toUpperCase(),
            row,
          ]),
        );
        let nextId = existing.reduce((m: number, row: any) => Math.max(m, Number(row.id) || 0), 0) + 1;
        const inventoryMapped = inventoryRows.map((row: any) => {
          const code = String(row.item_code || row.itemCode || row.id || '').trim();
          const key = code.toUpperCase();
          const prior = byCode.get(key);
          if (prior) {
            return {
              ...prior,
              code,
              brandName: prior.brandName || row.name || '',
              genericName: prior.genericName || row.name || '',
              formulation: prior.formulation || row.dosage_form || '',
              category: prior.category || row.category || 'Pharmacy',
              cashPrice: Number(row.selling_price ?? row.sellingPrice ?? prior.cashPrice ?? 0),
              status: prior.status || 'Active',
            };
          }
          return {
            id: nextId++,
            code,
            brandName: String(row.name || ''),
            genericName: String(row.name || ''),
            formulation: String(row.dosage_form || ''),
            strength: '',
            category: String(row.category || 'Pharmacy'),
            cashPrice: Number(row.selling_price ?? row.sellingPrice ?? row.unit_cost ?? row.unitCost ?? 0),
            subCategoryPrices: {},
            status: 'Active',
          };
        });
        const inventoryCodes = new Set(inventoryMapped.map((row: any) => String(row.code || '').toUpperCase()));
        const setupOnly = existing.filter((row: any) => !inventoryCodes.has(String(row.code || '').toUpperCase()));
        loaded['setup-pharmacy-drugs'] = [...inventoryMapped, ...setupOnly];
      }

      const defaults: Record<string, any[]> = {
        'setup-patient-categories': INITIAL_PATIENT_CATEGORIES,
        'setup-patient-subcategories': INITIAL_PATIENT_SUB_CATEGORIES,
        'setup-departments': INITIAL_DEPARTMENTS,
        'setup-consultation-services': INITIAL_CONSULTATION_SERVICES,
        'setup-bed-items': INITIAL_INPATIENT_BEDS,
        'setup-inpatient-packages': INITIAL_INPATIENT_PACKAGES,
        'setup-lab-tests': INITIAL_LAB_TESTS,
        'setup-radiology-tests': INITIAL_RADIOLOGY_TESTS,
        'setup-radiology-templates': INITIAL_RADIOLOGY_TEMPLATES,
        'setup-nursing-procedures': INITIAL_NURSING_PROCEDURES,
        'setup-pharmacy-drugs': INITIAL_PHARMACY_DRUGS,
        'setup-icd11': INITIAL_ICD11_CODES,
      };
      let seeded = 0;
      for (const [entity, key, currentRows, setter] of setupEntityConfig) {
        const dbRows = loaded[entity] || [];
        const sourceRows = dbRows;
        const rows = entity === 'setup-inpatient-packages' ? sourceRows.map((row: any) => normalizeInpatientPackage(row)) : sourceRows;
        if (!dbRows.length && rows.length) {
          for (const row of rows) {
            const r = await apiClient.persistEntity(entity, row);
            if (r.success) seeded++;
          }
        }
        (setter as any)(rows);
        (setupInitialSnapshots.current as any)[key] = new Map(rows.map((x: any) => [String(x.id), JSON.stringify(x)]));
      }

      const shaRows = await apiClient.getSetupEntity('sha-rebates');
      const sha = shaRows;

      setShaRebates(sha);
      setupInitialSnapshots.current.shaRebates = new Map(sha.map((x: any) => [String(x.id), JSON.stringify(x)]));

      const hospitalRows = await apiClient.getSetupEntity('hospital-config');
      if (hospitalRows[0]) {
        const h: any = hospitalRows[0];
        const normalized: any = {
          ...hospitalData,
          ...h,
          hospitalName: h.hospitalName || h.hospital_name || hospitalData.hospitalName,
          mflCode: h.mflCode || h.mfl_code || hospitalData.mflCode,
        };
        setHospitalData(normalized);
      }
      setSetupDbMessage(`System Setup loaded${seeded ? ` • ${seeded} starting records added` : ''}`);
    } catch (e: any) {
      setSetupDbMessage(`Part of System Setup could not be loaded: ${e?.message || 'try again in a moment'}`);
    } finally {
      setSetupLoading(false);
    }
  };

  useEffect(() => {
    void loadSetupFromDatabase();
  }, []);

  useEffect(() => {
    persistChangedSetup('setup-patient-categories', categories, setupInitialSnapshots.current.categories);
  }, [categories]);
  useEffect(() => {
    persistChangedSetup('setup-patient-subcategories', subCategories, setupInitialSnapshots.current.subCategories);
  }, [subCategories]);
  useEffect(() => {
    persistChangedSetup('setup-departments', departments, setupInitialSnapshots.current.departments);
  }, [departments]);
  useEffect(() => {
    persistChangedSetup('setup-consultation-services', consultations, setupInitialSnapshots.current.consultations);
  }, [consultations]);
  useEffect(() => {
    const changed = beds.filter((x: any) => setupInitialSnapshots.current.beds.get(String(x.id)) !== JSON.stringify(x));
    persistChangedSetup('setup-bed-items', beds, setupInitialSnapshots.current.beds);
    changed.forEach((x: any) => {
      if (x?.subCategoryChargeComponents) void apiClient.saveBedChargeComponents(Number(x.id), x.subCategoryChargeComponents);
    });
  }, [beds]);
  useEffect(() => {
    persistChangedSetup('setup-inpatient-packages', packages, setupInitialSnapshots.current.packages);
  }, [packages]);
  useEffect(() => {
    persistChangedSetup('setup-lab-tests', labTests, setupInitialSnapshots.current.labTests);
  }, [labTests]);
  useEffect(() => {
    persistChangedSetup('setup-radiology-tests', radiologyTests, setupInitialSnapshots.current.radiologyTests);
  }, [radiologyTests]);
  useEffect(() => {
    persistChangedSetup('setup-radiology-templates', radiologyTemplates, setupInitialSnapshots.current.radiologyTemplates);
  }, [radiologyTemplates]);
  useEffect(() => {
    persistChangedSetup('setup-nursing-procedures', nursingProcedures, setupInitialSnapshots.current.nursingProcedures);
  }, [nursingProcedures]);
  useEffect(() => {
    persistChangedSetup('setup-pharmacy-drugs', pharmacyItems, setupInitialSnapshots.current.pharmacyItems);
  }, [pharmacyItems]);
  useEffect(() => {
    persistChangedSetup('setup-icd11', icd11Codes, setupInitialSnapshots.current.icd11Codes);
  }, [icd11Codes]);

  useEffect(() => {
    if (onUpdateShaRebates) return;
    persistChangedSetup('sha-rebates', shaRebates, setupInitialSnapshots.current.shaRebates);
  }, [shaRebates]);

  const saveAllSetupToDatabase = async () => {
    setSetupSaving(true);
    setSetupDbMessage('Saving System Setup…');
    const groups: Array<[string, any[]]> = [
      ['setup-patient-categories', categories],
      ['setup-patient-subcategories', subCategories],
      ['setup-departments', departments],
      ['setup-consultation-services', consultations],
      ['setup-bed-items', beds],
      ['setup-inpatient-packages', packages],
      ['setup-lab-tests', labTests],
      ['setup-radiology-tests', radiologyTests],
      ['setup-radiology-templates', radiologyTemplates],
      ['setup-nursing-procedures', nursingProcedures],
      ['setup-pharmacy-drugs', pharmacyItems],
      ['setup-icd11', icd11Codes],
      ['sha-rebates', propShaRebates || shaRebates],
    ];
    let ok = 0,
      failed = 0;
    for (const [entity, rows] of groups)
      for (const row of rows) {
        const r = await apiClient.persistEntity(entity, row);
        r.success ? ok++ : failed++;
      }
    setSetupSaving(false);
    setSetupDbMessage(`System Setup saved: ${ok} saved${failed ? `, ${failed} not saved (try again)` : ''}.`);
  };

  const showToast = (msg: string) => {
    setImportSuccessToast(msg);
    setTimeout(() => setImportSuccessToast(null), 4000);
  };

  const handleSaveHospitalConfig = (e: React.FormEvent) => {
    e.preventDefault();

    const one = (v: unknown) =>
      String(v ?? '')
        .replace(/[\t\r\n]+/g, ' ')
        .trim();
    const clean = {
      ...hospitalData,
      hospitalName: one(hospitalData.hospitalName),
      mflCode: one(hospitalData.mflCode).replace(/\s+/g, ''),
      kraPin: one(hospitalData.kraPin),
      shaProviderCode: one(hospitalData.shaProviderCode),
      facilityLevel: one(hospitalData.facilityLevel),
    };
    setHospitalData(clean);
    if (onUpdateHospitalConfig) {
      onUpdateHospitalConfig(clean as any);
    }
    setHospitalSaveToast(true);
    setTimeout(() => setHospitalSaveToast(false), 3000);
  };

  const getTabTitle = (tab: SetupTabKey): string => {
    switch (tab) {
      case 'patient_categories':
        return 'Patient Categories';
      case 'sub_categories':
        return 'Patient Sub-Categories & Schemes';
      case 'departments':
        return 'Hospital Departments';
      case 'consultations':
        return 'Consultation Services';
      case 'wards':
        return 'Ward Setup & Tariffs';
      case 'inpatient_beds':
        return 'Inpatient Beds';
      case 'inpatient_packages':
        return 'Inpatient Packages';
      case 'lab_tests':
        return 'Lab Tests & Analytes';
      case 'radiology_tests':
        return 'Radiology Studies';
      case 'nursing_procedures':
        return 'Nursing Procedures';
      case 'icd11_codes':
        return 'ICD-11 Diagnostic Codes';
      case 'cancer_setup':
        return 'Cancer / Oncology Setup';
      default:
        return 'Register';
    }
  };

  const getImportValue = (row: any, ...keys: string[]): any => {
    const normalized: Record<string, any> = {};
    Object.keys(row || {}).forEach((k) => {
      normalized[
        String(k)
          .replace(/[^a-z0-9]/gi, '')
          .toLowerCase()
      ] = row[k];
    });
    for (const key of keys) {
      const value =
        normalized[
          String(key)
            .replace(/[^a-z0-9]/gi, '')
            .toLowerCase()
        ];
      if (value !== undefined && value !== '') return value;
    }
    return '';
  };
  const numberImport = (row: any, ...keys: string[]): number => {
    const n = Number.parseFloat(String(getImportValue(row, ...keys)));
    return Number.isFinite(n) ? n : 0;
  };
  const makeSubCategoryPrices = (row: any, cash: number): Record<string, number> => {
    const result: Record<string, number> = {};
    subCategories.forEach((sc) => {
      const direct = numberImport(row, sc.subCategoryCode, sc.subCategoryCode.replace(/-/g, '_'));
      if (direct > 0) result[sc.subCategoryCode] = direct;
    });
    const sha = numberImport(row, 'shaPrice', 'shaPriceKSh', 'sha');
    const corp = numberImport(row, 'corporatePrice', 'corporatePriceKSh', 'corporate', 'insurancePrice');
    const shaSub = subCategories.find((sc) => sc.subCategoryCode.toUpperCase().includes('SHA') || sc.schemeType === 'Comprehensive');
    const corpSub = subCategories.find(
      (sc) =>
        sc.categoryCode.toUpperCase().includes('CORP') ||
        (sc.schemeType === 'Comprehensive' && sc.subCategoryCode.toUpperCase().includes('CORP')),
    );
    if (sha > 0 && shaSub) result[shaSub.subCategoryCode] = sha;
    if (corp > 0 && corpSub) result[corpSub.subCategoryCode] = corp;
    const cashSub = subCategories.find((sc) => sc.isCash) || subCategories.find((sc) => sc.subCategoryCode === 'CASH-GEN');
    if (cashSub) result[cashSub.subCategoryCode] = cash;
    return result;
  };

  const parseLabParameters = (row: any): SetupLabTestItem['parameters'] => {
    const detailedName = getImportValue(row, 'parameterName', 'analyteName', 'Parameter Name');
    if (detailedName) {
      const options = getImportValue(row, 'qualitativeOptions', 'options', 'Qualitative Options');
      const low = getImportValue(row, 'criticalLow', 'Critical Low');
      const high = getImportValue(row, 'criticalHigh', 'Critical High');
      return [
        {
          id: String(getImportValue(row, 'parameterId', 'Parameter ID') || `LP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
          name: String(detailedName).trim(),
          unit: String(getImportValue(row, 'unit', 'SI Unit', 'Parameter Unit') || '').trim(),
          normalRangeMale: String(getImportValue(row, 'normalRangeMale', 'maleRange', 'Male Range', 'Normal Range') || '').trim(),
          normalRangeFemale: String(getImportValue(row, 'normalRangeFemale', 'femaleRange', 'Female Range', 'Normal Range') || '').trim(),
          normalRangePediatric:
            String(getImportValue(row, 'normalRangePediatric', 'pediatricRange', 'Pediatric Range') || '').trim() || undefined,
          criticalLow: low === '' ? undefined : Number(low),
          criticalHigh: high === '' ? undefined : Number(high),
          qualitativeOptions: options
            ? String(options)
                .split(/[|,;]/)
                .map((x) => x.trim())
                .filter(Boolean)
            : undefined,
          isMandatory: ['true', 'yes', '1'].includes(String(getImportValue(row, 'isMandatory', 'Mandatory')).toLowerCase()),
        },
      ];
    }

    const raw = getImportValue(
      row,
      'parameters',
      'parametersJson',
      'parameterList',
      'analyteParameters',
      'Parameters (name:unit:normalRange separated by semicolon)',
      'Parameters JSON (optional)',
    );
    if (raw === null || raw === undefined || String(raw).trim() === '') return [];
    if (typeof raw === 'string') {
      const text = raw.trim();
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed))
          return parsed
            .map((p: any, i: number) => ({
              id: String(p.id || `LP-${Date.now()}-${i}`),
              name: String(p.name || p.parameterName || ''),
              unit: String(p.unit || ''),
              normalRangeMale: String(p.normalRangeMale || p.maleRange || p.normalRange || ''),
              normalRangeFemale: String(p.normalRangeFemale || p.femaleRange || p.normalRange || ''),
              normalRangePediatric: p.normalRangePediatric ? String(p.normalRangePediatric) : undefined,
              criticalLow: p.criticalLow === '' || p.criticalLow == null ? undefined : Number(p.criticalLow),
              criticalHigh: p.criticalHigh === '' || p.criticalHigh == null ? undefined : Number(p.criticalHigh),
              qualitativeOptions: Array.isArray(p.qualitativeOptions)
                ? p.qualitativeOptions.map(String)
                : p.qualitativeOptions
                  ? String(p.qualitativeOptions)
                      .split('|')
                      .map((x: string) => x.trim())
                      .filter(Boolean)
                  : undefined,
              isMandatory: p.isMandatory === true || ['true', 'yes', '1'].includes(String(p.isMandatory).toLowerCase()),
              clinicalComment: p.clinicalComment ? String(p.clinicalComment) : undefined,
            }))
            .filter((p: any) => p.name);
      } catch {}
      return text
        .split(';')
        .map((entry, i) => {
          const parts = entry.split(':').map((x) => x.trim());
          const name = parts.shift() || '';
          const unit = parts.shift() || '';
          const range = parts.join(':') || '';
          return { id: `LP-${Date.now()}-${i}`, name, unit, normalRangeMale: range, normalRangeFemale: range, isMandatory: false };
        })
        .filter((p) => p.name);
    }
    return [];
  };

  const handleImportData = async (parsedRows: any[]) => {
    if (parsedRows.length === 0) return;

    if (activeTab === 'patient_categories') {
      const newItems: SetupPatientCategory[] = parsedRows.map((r, i) => ({
        id: Date.now() + i,
        code: String(getImportValue(r, 'code', 'categoryCode', 'CategoryCode') || `CAT-${i + 1}`).toUpperCase(),
        name: String(getImportValue(r, 'name', 'categoryName', 'Name') || 'Custom Category'),
        isCash: ['true', 'yes', '1'].includes(String(getImportValue(r, 'isCash', 'cash')).toLowerCase()),
        defaultDiscount: numberImport(r, 'defaultDiscount', 'discount'),
        status: 'Active',
      }));
      setCategories([...categories, ...newItems]);
      showToast(`Imported ${newItems.length} Patient Categories from file!`);
    } else if (activeTab === 'sub_categories') {
      const newItems: SetupPatientSubCategory[] = parsedRows.map((r, i) => ({
        id: Date.now() + i,
        categoryCode: String(r.categoryCode || r.CategoryCode || 'SHA').toUpperCase(),
        categoryName: String(r.categoryName || r.CategoryName || 'Insurance Scheme'),
        subCategoryCode: String(r.subCategoryCode || r.SubCode || `SUB-${i + 1}`).toUpperCase(),
        name: String(r.name || r.Name || 'Sub Category'),
        isCash: false,
        schemeCode: String(r.schemeCode || r.SchemeCode || `SCH-${i + 1}`).toUpperCase(),
        schemeName: String(r.schemeName || r.SchemeName || r.name || 'Insurance Scheme'),
        schemeType: 'Comprehensive',
        copayRule: String(r.copayRule || '0%'),
        copayAmount: parseFloat(r.copayAmount) || 0,
        creditLimit: parseFloat(r.creditLimit) || 500000,
        preAuthRequired: true,
        status: 'Active',
      }));
      setSubCategories([...subCategories, ...newItems]);
      showToast(`Imported ${newItems.length} Sub-Categories & Schemes from file!`);
    } else if (activeTab === 'departments') {
      const newItems: SetupDepartment[] = parsedRows.map((r, i) => ({
        id: Date.now() + i,
        code: String(r.code || `DEPT-${i + 1}`).toUpperCase(),
        name: String(r.name || 'Department'),
        type: 'Clinical',
        headOfDepartment: String(r.headOfDepartment || 'Unassigned'),
        phoneExt: String(r.phoneExt || '—'),
        location: String(r.location || 'Main Hospital'),
        status: 'Active',
      }));
      setDepartments([...departments, ...newItems]);
      showToast(`Imported ${newItems.length} Departments from file!`);
    } else if (activeTab === 'consultations') {
      const newItems: SetupConsultationService[] = parsedRows.map((r, i) => {
        const cashP = numberImport(r, 'cashPrice', 'cashPriceKSh', 'price') || 500;
        return {
          id: Date.now() + i,
          code: String(getImportValue(r, 'code', 'serviceCode') || `CONS-${i + 1}`).toUpperCase(),
          name: String(getImportValue(r, 'name', 'serviceName') || 'Consultation Service'),
          department: String(getImportValue(r, 'department') || 'Outpatient Department'),
          durationMinutes: Number.parseInt(String(getImportValue(r, 'durationMinutes', 'duration'))) || 20,
          cashPrice: cashP,
          subCategoryPrices: makeSubCategoryPrices(r, cashP),
          description: String(getImportValue(r, 'description') || 'Clinical assessment'),
          status: 'Active',
        };
      });
      setConsultations([...consultations, ...newItems]);
      showToast(`Imported ${newItems.length} Consultation Services from file!`);
    } else if (activeTab === 'wards') {
      const newWards: Ward[] = parsedRows.map((r, i) => ({
        id: String(getImportValue(r, 'wardId', 'id') || `WARD-${Date.now()}-${i}`),
        name: String(getImportValue(r, 'wardName', 'name') || 'General Ward'),
        category: (getImportValue(r, 'category', 'wardCategory') || 'Male Medical') as Ward['category'],
        totalBeds: numberImport(r, 'totalBeds', 'beds'),
        occupiedBeds: numberImport(r, 'occupiedBeds', 'occupied'),
        dailyRate: numberImport(r, 'cashDailyRate', 'dailyRate', 'cashPrice'),
        nurseInCharge: String(getImportValue(r, 'nurseInCharge', 'nurse') || ''),
        floor: String(getImportValue(r, 'floor', 'location') || ''),
        subCategoryChargeComponents: Object.fromEntries(
          subCategories.map((sc) => [
            sc.subCategoryCode,
            {
              bedCharge: numberImport(r, `${sc.subCategoryCode}_bed`, 'bedCharge') || numberImport(r, 'cashDailyRate', 'dailyRate'),
              nursingCareCharge: numberImport(r, `${sc.subCategoryCode}_nursing`, 'nursingCare'),
              mealsNutritionCharge: numberImport(r, `${sc.subCategoryCode}_meals`, 'mealsNutrition'),
              dailyReviewCharge: numberImport(r, `${sc.subCategoryCode}_review`, 'dailyReview'),
            },
          ]),
        ),
      }));
      onUpdateWards?.([...(wards || []), ...newWards]);
      showToast(`Imported ${newWards.length} wards with tariff charges!`);
    } else if (activeTab === 'inpatient_beds') {
      const newItems: SetupBedItem[] = parsedRows.map((r, i) => {
        const cashR = numberImport(r, 'bedCharge', 'cashDailyRate', 'cashPrice') || 1500;
        const nursing = numberImport(r, 'nursingCareCharge', 'nursingCare', 'nursing') || 0;
        const meals = numberImport(r, 'mealsNutritionCharge', 'mealsNutrition', 'meals', 'nutrition') || 0;
        const review = numberImport(r, 'dailyReviewCharge', 'dailyReview', 'review') || 0;
        const components: any = {};
        subCategories.forEach((sc) => {
          const total = numberImport(r, `${sc.subCategoryCode}_total`, `${sc.subCategoryCode}Total`);
          if (total > 0)
            components[sc.subCategoryCode] = {
              bedCharge: numberImport(r, `${sc.subCategoryCode}_bed`) || cashR,
              nursingCareCharge: numberImport(r, `${sc.subCategoryCode}_nursing`) || nursing,
              mealsNutritionCharge: numberImport(r, `${sc.subCategoryCode}_meals`) || meals,
              dailyReviewCharge: numberImport(r, `${sc.subCategoryCode}_review`) || review,
            };
        });
        return {
          id: Date.now() + i,
          bedNumber: String(getImportValue(r, 'bedNumber', 'bedNo') || `BED-${i + 1}`).toUpperCase(),
          wardName: String(getImportValue(r, 'wardName', 'ward') || 'General Ward'),
          wardId: String(getImportValue(r, 'wardId') || ''),
          bedType: (getImportValue(r, 'bedType', 'classification') || 'General') as any,
          cashDailyRate: cashR,
          bedCharge: cashR,
          nursingCareCharge: nursing,
          mealsNutritionCharge: meals,
          dailyReviewCharge: review,
          subCategoryDailyRates: makeSubCategoryPrices(r, cashR),
          subCategoryChargeComponents: components,
          oxygenEquipped: ['true', 'yes', '1'].includes(String(getImportValue(r, 'oxygenEquipped', 'oxygen')).toLowerCase()),
          cardiacMonitorEquipped: ['true', 'yes', '1'].includes(
            String(getImportValue(r, 'cardiacMonitorEquipped', 'cardiacMonitor')).toLowerCase(),
          ),
          status: 'Available',
        };
      });
      setBeds([...beds, ...newItems]);
      showToast(`Imported ${newItems.length} Inpatient Beds with charge components from file!`);
    } else if (activeTab === 'inpatient_packages') {
      const newItems: SetupInpatientPackage[] = parsedRows.map((r, i) => {
        const cashP = numberImport(r, 'cashPrice', 'cashPriceKSh', 'price') || 25000;
        return {
          id: Date.now() + i,
          packageCode: String(getImportValue(r, 'packageCode', 'code') || `PKG-${i + 1}`).toUpperCase(),
          packageName: String(getImportValue(r, 'packageName', 'name') || 'Inpatient Package'),
          wardType: String(getImportValue(r, 'wardType', 'ward') || 'General Ward'),
          includedDays: Number.parseInt(String(getImportValue(r, 'includedDays', 'days'))) || 3,
          includedProcedures: String(getImportValue(r, 'includedProcedures', 'procedures') || 'Ward Care & Surgical Bundle')
            .split(';')
            .map((x) => x.trim())
            .filter(Boolean),
          cashPrice: cashP,
          subCategoryPrices: makeSubCategoryPrices(r, cashP),
          overstayDailyRate: numberImport(r, 'overstayDailyRate', 'overstayRate') || 2500,
          description: String(getImportValue(r, 'description') || 'Clinical package'),
          status: 'Active',
        };
      });
      setPackages([...packages, ...newItems]);
      showToast(`Imported ${newItems.length} Inpatient Packages from file!`);
    } else if (activeTab === 'lab_tests') {
      const grouped = new Map<string, SetupLabTestItem>();
      parsedRows.forEach((r, i) => {
        const code = String(getImportValue(r, 'code', 'testCode') || `LAB-${i + 1}`)
          .trim()
          .toUpperCase();
        const cashP = numberImport(r, 'cashPrice', 'cashPriceKSh', 'price') || 500;
        const parameterRows = parseLabParameters(r);
        const existing = grouped.get(code);
        if (existing) {
          existing.parameters = [...(existing.parameters || []), ...parameterRows];
          if (numberImport(r, 'cashPrice', 'cashPriceKSh', 'price') > 0) existing.cashPrice = cashP;
          existing.subCategoryPrices = makeSubCategoryPrices(r, existing.cashPrice);
        } else {
          grouped.set(code, {
            id: Date.now() + i,
            code,
            name: String(getImportValue(r, 'name', 'testName') || 'Laboratory Test'),
            department: String(getImportValue(r, 'department') || 'Clinical Chemistry'),
            specimenType: String(getImportValue(r, 'specimenType') || 'Whole Blood'),
            turnaroundMinutes: Number.parseInt(String(getImportValue(r, 'turnaroundMinutes', 'turnaroundMins'))) || 45,
            cashPrice: cashP,
            subCategoryPrices: makeSubCategoryPrices(r, cashP),
            parameters: parameterRows,
            status: 'Active',
          });
        }
      });
      const newItems = Array.from(grouped.values());
      const byCode = new Map(
        labTests.map((x) => [
          String(x.code || '')
            .trim()
            .toUpperCase(),
          x,
        ]),
      );
      newItems.forEach((item) => {
        const key = String(item.code || '')
          .trim()
          .toUpperCase();
        const existing = byCode.get(key);
        if (existing)
          byCode.set(key, {
            ...existing,
            ...item,
            id: existing.id,
            parameters: item.parameters?.length ? item.parameters : existing.parameters || [],
          });
        else byCode.set(key, item);
      });
      const merged = Array.from(byCode.values());
      setLabTests(merged);
      for (const item of newItems) {
        const key = String(item.code || '')
          .trim()
          .toUpperCase();
        const existing = labTests.find(
          (x) =>
            String(x.code || '')
              .trim()
              .toUpperCase() === key,
        );
        const row = existing
          ? { ...existing, ...item, id: existing.id, parameters: item.parameters?.length ? item.parameters : existing.parameters || [] }
          : item;
        await apiClient.persistEntity('setup-lab-tests', row);
      }
      showToast(`Imported and saved ${newItems.length} lab tests with their parameters.`);
    } else if (activeTab === 'radiology_tests') {
      const newItems: SetupRadiologyTestItem[] = parsedRows.map((r, i) => {
        const cashP = parseFloat(r.cashPrice) || 1500;
        return {
          id: Date.now() + i,
          code: String(getImportValue(r, 'code', 'testCode') || `RAD-${i + 1}`).toUpperCase(),
          name: String(getImportValue(r, 'name', 'testName') || 'Radiology Study'),
          category: String(getImportValue(r, 'category') || 'X-Ray'),
          modality: (getImportValue(r, 'modality') as any) || 'X-Ray',
          preparationInstructions: String(getImportValue(r, 'preparationInstructions', 'preparation') || 'Standard procedure'),
          requiresContrast: ['true', 'yes', '1'].includes(String(getImportValue(r, 'requiresContrast', 'contrastRequired')).toLowerCase()),
          cashPrice: cashP,
          subCategoryPrices: makeSubCategoryPrices(r, cashP),
          status: 'Active',
        };
      });
      setRadiologyTests([...radiologyTests, ...newItems]);
      showToast(`Imported ${newItems.length} Radiology Studies from file!`);
    } else if (activeTab === 'nursing_procedures') {
      const newItems: SetupNursingProcedureItem[] = parsedRows.map((r, i) => {
        const cashP = numberImport(r, 'cashPrice', 'cashPriceKSh', 'price') || 400;
        return {
          id: Date.now() + i,
          code: String(getImportValue(r, 'code', 'procedureCode') || `NUR-${i + 1}`).toUpperCase(),
          name: String(getImportValue(r, 'name', 'procedureName') || 'Nursing Procedure'),
          department: String(getImportValue(r, 'department') || 'Nursing OPD'),
          consumables: String(getImportValue(r, 'consumables', 'consumablesRequired') || 'Standard dressing pack'),
          cashPrice: cashP,
          subCategoryPrices: makeSubCategoryPrices(r, cashP),
          status: 'Active',
        };
      });
      setNursingProcedures([...nursingProcedures, ...newItems]);
      showToast(`Imported ${newItems.length} Nursing Procedures from file!`);
    } else if (activeTab === 'icd11_codes') {
      const newItems: SetupIcd11Item[] = parsedRows
        .map((r, i) => {
          const code = String(getImportValue(r, 'code', 'ICD-11 Code', 'ICD11 Code') || '')
            .trim()
            .toUpperCase();
          const title = String(getImportValue(r, 'title', 'Official Diagnostic Title', 'diagnostic title') || '').trim();
          const chapter = String(getImportValue(r, 'chapter', 'WHO Chapter', 'ChapterNo', 'Chapter') || '').trim();
          const block = String(getImportValue(r, 'block', 'Block Grouping', 'BlockId', 'Grouping1') || 'General').trim();
          const category = String(getImportValue(r, 'category', 'ClassKind') || 'Both').trim() || 'Both';
          if (!code || code === '_NOCODEASSIGNED' || !title) return null;
          return {
            id: Date.now() + i,
            code,
            title,
            chapter: chapter || 'Clinical Diagnosis',
            block: block || 'General',
            category: ['Morbidity', 'Mortality', 'Both'].includes(category) ? (category as SetupIcd11Item['category']) : 'Both',
            description: String(getImportValue(r, 'description') || ''),
          } as SetupIcd11Item;
        })
        .filter((x): x is SetupIcd11Item => Boolean(x));
      setIcd11Codes([...icd11Codes, ...newItems]);
      showToast(`Imported ${newItems.length} ICD-11 Diagnostic Codes from file!`);
    } else if (activeTab === 'radiology_templates') {
      const newItems: SetupRadiologyTemplate[] = parsedRows.map((r, i) => ({
        id: Date.now() + i,
        templateCode: String(getImportValue(r, 'templateCode', 'code') || `RAD-TPL-${i + 1}`).toUpperCase(),
        templateName: String(getImportValue(r, 'templateName', 'name') || 'Radiology Report Template'),
        modality: (getImportValue(r, 'modality') || 'X-Ray') as any,
        indicationBoilerplate: String(getImportValue(r, 'indicationBoilerplate', 'indication') || ''),
        techniqueBoilerplate: String(getImportValue(r, 'techniqueBoilerplate', 'technique') || ''),
        findingsTemplate: String(getImportValue(r, 'findingsTemplate', 'findings') || ''),
        impressionTemplate: String(getImportValue(r, 'impressionTemplate', 'impression') || ''),
        normalReportText: String(getImportValue(r, 'normalReportText', 'normalReport') || ''),
        isDefault: ['true', 'yes', '1'].includes(String(getImportValue(r, 'isDefault', 'default')).toLowerCase()),
      }));
      setRadiologyTemplates([...radiologyTemplates, ...newItems]);
      showToast(`Imported ${newItems.length} Radiology Report Templates from file!`);
    } else if (activeTab === 'cancer_setup') {
      const rows = parsedRows.map((r, i) => ({
        id: String(getImportValue(r, 'id', 'protocolId') || `ONC-SET-${Date.now()}-${i}`),
        code: String(getImportValue(r, 'code', 'protocolCode') || `ONC-${i + 1}`).toUpperCase(),
        name: String(getImportValue(r, 'name', 'protocolName') || 'Cancer Treatment Protocol'),
        treatmentType: String(getImportValue(r, 'treatmentType', 'type') || 'Chemotherapy'),
        regimen: String(getImportValue(r, 'regimen') || ''),
        intent: String(getImportValue(r, 'intent') || 'Curative'),
        route: String(getImportValue(r, 'route') || 'IV'),
        cycleDays: Number(getImportValue(r, 'cycleDays', 'cycleLengthDays')) || 21,
        defaultCycles: Number(getImportValue(r, 'defaultCycles', 'cycles')) || 1,
        department: String(getImportValue(r, 'department') || 'Oncology'),
        preauthRequired: !['false', 'no', '0'].includes(String(getImportValue(r, 'preauthRequired', 'requiresPreauth')).toLowerCase()),
        shaBenefitCode: String(getImportValue(r, 'shaBenefitCode', 'shaBenefit') || 'SHA-ONC'),
        description: String(getImportValue(r, 'description') || ''),
        status: 'Active',
      }));
      for (const row of rows) await apiClient.persistEntity('setup-cancer-protocols', row);
      showToast(`Imported ${rows.length} Cancer / Oncology protocols from file!`);
    } else if (activeTab === 'sha_rebates') {
      const newItems: SetupShaDailyRebate[] = parsedRows.map((r, i) => ({
        id: String(getImportValue(r, 'id', 'benefitCode') || `SHA-${Date.now()}-${i}`),
        code: String(getImportValue(r, 'code', 'benefitCode') || `SHA-REB-${i + 1}`).toUpperCase(),
        packageName: String(getImportValue(r, 'packageName', 'package', 'description') || 'SHA Inpatient Rebate'),
        dailyRebateAmount: numberImport(r, 'dailyRebateAmount', 'dailyRebate', 'amount') || 0,
        wardCategory: String(getImportValue(r, 'wardCategory', 'ward') || 'General Ward'),
        description: String(getImportValue(r, 'description') || ''),
        isActive: !['false', 'no', '0'].includes(String(getImportValue(r, 'isActive', 'status')).toLowerCase()),
      }));
      setShaRebates([...shaRebates, ...newItems]);
      if (onUpdateShaRebates) onUpdateShaRebates([...shaRebates, ...newItems]);
      showToast(`Imported ${newItems.length} SHA rebate schedules from file!`);
    } else if (activeTab === 'sub_category_pricing') {
      let changed = 0;
      const byCode = (items: any[]) =>
        items.map((item) => {
          const row = parsedRows.find(
            (r) =>
              String(getImportValue(r, 'code', 'itemCode', 'testCode', 'drugCode', 'procedureCode')).toUpperCase() ===
              String(item.code || '').toUpperCase(),
          );
          if (!row) return item;
          const cash = numberImport(row, 'cashPrice', 'cashPriceKSh', 'price') || item.cashPrice || 0;
          changed++;
          return { ...item, cashPrice: cash, subCategoryPrices: makeSubCategoryPrices(row, cash) };
        });
      setLabTests(byCode(labTests));
      setRadiologyTests(byCode(radiologyTests));
      setNursingProcedures(byCode(nursingProcedures));
      setPharmacyItems(byCode(pharmacyItems));
      showToast(`Updated ${changed} matching tariff records from the spreadsheet. Only matching master records were changed.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <div className="bg-[#0088cc] text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onGoBack}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
              title="Return to previous module"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="p-2 bg-white/15 rounded-xl">
              <Sliders className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">System Setup & Master Configuration</h1>
              <p className="text-xs text-sky-100">
                Hospital Registers, Diagnostic Analytes, Radiology Templates, Sub-Category Pricing & Excel Batch Engine
              </p>
            </div>
          </div>

          {activeTab !== 'hospital_data' &&
            activeTab !== 'sub_category_pricing' &&
            activeTab !== 'radiology_templates' &&
            activeTab !== 'workflow_mappings' &&
            activeTab !== 'mpesa_api' &&
            activeTab !== 'sha_connection' && (
              <div className="flex items-center space-x-2 shrink-0">
                {canSaveAll && (
                  <button
                    onClick={() => void saveAllSetupToDatabase()}
                    disabled={setupSaving || setupLoading}
                    className="px-3.5 py-1.5 bg-emerald-600 disabled:bg-emerald-300 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                    title="Save all current System Setup master registers to MySQL"
                  >
                    <Save className="w-4 h-4" />
                    <span>{setupSaving ? 'Saving…' : 'Save All'}</span>
                  </button>
                )}
                <button
                  onClick={() => downloadSetupSampleTemplate(activeTab)}
                  className="px-3.5 py-1.5 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                  title="Download Excel / CSV template with sample data"
                >
                  <Download className="w-4 h-4 text-[#0088cc]" />
                  <span>Sample Template (.CSV / Excel)</span>
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                  title="Upload and batch import data from Excel or CSV file"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Excel / CSV</span>
                </button>
              </div>
            )}
        </div>
      </div>

      {importSuccessToast && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-4">
          <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{importSuccessToast}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 flex-1 flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Setup Modules & Registers</div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive ? 'bg-[#0088cc] text-white shadow-xs' : 'text-gray-700 hover:bg-slate-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-xs space-y-2 mt-4 text-xs">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <Zap className="w-4 h-4" />
              <span>Bulk Pricing Tip</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Use the <strong className="text-white font-semibold">Sub-Category Tariffs</strong> tab to recalculate all Lab, Radiology,
              Nursing, and Pharmacy prices automatically from standard Cash baselines with one click.
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {(activeTab === 'patient_categories' || activeTab === 'sub_categories') && (
            <SetupPatientRegisters
              activeSubTab={activeTab === 'patient_categories' ? 'categories' : 'sub_categories'}
              categories={categories}
              onUpdateCategories={setCategories}
              subCategories={subCategories}
              onUpdateSubCategories={setSubCategories}
            />
          )}

          {(activeTab === 'departments' || activeTab === 'consultations') && (
            <SetupDepartmentConsultation
              activeSubTab={activeTab === 'departments' ? 'departments' : 'consultations'}
              departments={departments}
              onUpdateDepartments={setDepartments}
              consultations={consultations}
              onUpdateConsultations={setConsultations}
              subCategories={subCategories}
            />
          )}

          {activeTab === 'wards' && onUpdateWards && (
            <SetupWardRegisters wards={wards} onUpdateWards={onUpdateWards} subCategories={subCategories} />
          )}

          {(activeTab === 'inpatient_beds' || activeTab === 'inpatient_packages') && (
            <SetupInpatientRegisters
              activeSubTab={activeTab === 'inpatient_beds' ? 'inpatient_beds' : 'inpatient_packages'}
              beds={beds}
              onUpdateBeds={updateSetupBeds}
              packages={packages}
              onUpdatePackages={setPackages}
              subCategories={subCategories}
              wards={(wards || []).map((w: any) => ({ id: String(w.id), name: String(w.name) }))}
            />
          )}

          {activeTab === 'sub_category_pricing' && (
            <SetupPricingRegisters
              subCategories={subCategories}
              labTests={labTests}
              onUpdateLabTests={setLabTests}
              radiologyTests={radiologyTests}
              onUpdateRadiologyTests={setRadiologyTests}
              nursingProcedures={nursingProcedures}
              onUpdateNursingProcedures={setNursingProcedures}
              pharmacyItems={pharmacyItems}
              onUpdatePharmacyItems={setPharmacyItems}
            />
          )}

          {(activeTab === 'lab_tests' ||
            activeTab === 'radiology_tests' ||
            activeTab === 'radiology_templates' ||
            activeTab === 'nursing_procedures' ||
            activeTab === 'icd11_codes') && (
            <SetupDiagnosticRegisters
              activeSubTab={activeTab as any}
              labTests={labTests}
              onUpdateLabTests={setLabTests}
              radiologyTests={radiologyTests}
              onUpdateRadiologyTests={setRadiologyTests}
              radiologyTemplates={radiologyTemplates}
              onUpdateRadiologyTemplates={setRadiologyTemplates}
              nursingProcedures={nursingProcedures}
              onUpdateNursingProcedures={setNursingProcedures}
              icd11Codes={icd11Codes}
              onUpdateIcd11Codes={setIcd11Codes}
              departments={departments}
            />
          )}

          {activeTab === 'sha_rebates' && (
            <ShaRebateSetup
              rebates={shaRebates}
              hospitalLevel={hospitalData.facilityLevel}
              onChange={(rows) => {
                setShaRebates(rows);
                if (onUpdateShaRebates) onUpdateShaRebates(rows);
              }}
            />
          )}

          {activeTab === 'cancer_setup' && <CancerSetupRegisters />}

          {activeTab === 'workflow_mappings' && <SetupWorkflowMappings />}

          {activeTab === 'mpesa_api' && <MpesaApiSetup />}
          {activeTab === 'sha_connection' && <ShaConnectionSetup />}

          {activeTab === 'hospital_data' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-base font-bold text-gray-900">Hospital Profile & Facility Identification</h2>
                <p className="text-xs text-gray-500">Official Ministry of Health identifiers, licensing, and contact details</p>
              </div>

              {hospitalSaveToast && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl flex items-center space-x-2 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hospital Profile successfully updated and saved!</span>
                </div>
              )}

              <form onSubmit={handleSaveHospitalConfig} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Facility Official Name *</label>
                    <input
                      type="text"
                      required
                      value={hospitalData.hospitalName}
                      onChange={(e) => setHospitalData({ ...hospitalData, hospitalName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Master Facility List (MFL) Code *</label>
                    <input
                      type="text"
                      required
                      value={hospitalData.mflCode}
                      onChange={(e) => setHospitalData({ ...hospitalData, mflCode: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0088cc] font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Facility Level</label>
                    <input
                      type="text"
                      value={hospitalData.facilityLevel}
                      onChange={(e) => setHospitalData({ ...hospitalData, facilityLevel: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">KRA PIN Number</label>
                    <input
                      type="text"
                      value={hospitalData.kraPin}
                      onChange={(e) => setHospitalData({ ...hospitalData, kraPin: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0088cc] font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">SHA Provider Code</label>
                    <input
                      type="text"
                      value={hospitalData.shaProviderCode}
                      onChange={(e) => setHospitalData({ ...hospitalData, shaProviderCode: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0088cc] font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">County</label>
                    <input
                      type="text"
                      value={hospitalData.county}
                      onChange={(e) => setHospitalData({ ...hospitalData, county: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Sub-County / Constituency</label>
                    <input
                      type="text"
                      value={hospitalData.subCounty}
                      onChange={(e) => setHospitalData({ ...hospitalData, subCounty: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Official Telephone <span className="font-normal text-gray-500">(several: separate with |)</span>
                    </label>
                    <input
                      type="text"
                      value={hospitalData.phone}
                      onChange={(e) => setHospitalData({ ...hospitalData, phone: e.target.value })}
                      placeholder="0712 345 678 | 0733 456 789"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Official Email (printed on reports)</label>
                    <input
                      type="email"
                      value={hospitalData.email}
                      onChange={(e) => setHospitalData({ ...hospitalData, email: e.target.value })}
                      placeholder="info@hospital.co.ke"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Emergency 24/7 Hotline</label>
                    <input
                      type="text"
                      value={hospitalData.emergencyHotline}
                      onChange={(e) => setHospitalData({ ...hospitalData, emergencyHotline: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0088cc] text-rose-700 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Physical & Postal Address <span className="font-normal text-gray-500">(each line prints as a line on reports)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={hospitalData.address}
                    onChange={(e) => setHospitalData({ ...hospitalData, address: e.target.value })}
                    placeholder={'P.O Box 12345-00100, Nairobi\nTown / Estate\nStreet or landmark'}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Logo for printouts (lab reports, invoices, patient summaries)
                  </label>
                  <div className="flex items-center gap-3">
                    {hospitalData.logo ? (
                      <img src={hospitalData.logo} alt="Hospital logo" className="h-14 w-auto border rounded bg-white p-1" />
                    ) : (
                      <span className="text-[11px] text-gray-500">No logo yet. The printouts show the hospital name only.</span>
                    )}
                    <label className="px-3 py-2 border rounded-lg font-bold text-[#0088cc] hover:bg-sky-50 cursor-pointer">
                      {hospitalData.logo ? 'Change logo' : 'Upload logo'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;

                          const reader = new FileReader();
                          reader.onload = () => {
                            const img = new Image();
                            img.onload = () => {
                              const scale = Math.min(1, 400 / img.width);
                              const canvas = document.createElement('canvas');
                              canvas.width = Math.round(img.width * scale);
                              canvas.height = Math.round(img.height * scale);
                              canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);

                              canvas.toBlob(async (blob) => {
                                if (!blob) return;
                                const form = new FormData();
                                form.append('logo', blob, 'logo.png');
                                try {
                                  const res = await fetch('/api/settings/logo', { method: 'POST', credentials: 'include', body: form });
                                  const out = await res.json().catch(() => null);
                                  if (!res.ok || !out?.success)
                                    throw new Error(out?.error || `The server did not accept the logo (HTTP ${res.status}).`);
                                  setHospitalData((prev) => ({ ...prev, logo: out.url }));
                                } catch (err: any) {
                                  window.alert(err?.message || 'The logo could not be uploaded. Try again.');
                                }
                              }, 'image/png');
                            };
                            img.src = String(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {hospitalData.logo && (
                      <button
                        type="button"
                        onClick={() => {
                          const form = new FormData();
                          form.append('action', 'remove');
                          void fetch('/api/settings/logo', { method: 'POST', credentials: 'include', body: form }).catch(() => undefined);
                          setHospitalData({ ...hospitalData, logo: '' });
                        }}
                        className="text-[11px] text-red-600 font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Click Save after choosing the logo.</p>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Letterhead logo (how the logo sits on printouts)</label>
                  <select
                    value={hospitalData.letterheadLogo || 'standard'}
                    onChange={(e) => setHospitalData({ ...hospitalData, letterheadLogo: e.target.value as 'standard' | 'tall' })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="standard">Standard: the logo beside the name</option>
                    <option value="tall">Tall: a taller logo that runs past the header line (for tall, portrait logos)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Slogan (printed in the footer of lab reports, invoices and patient summaries)
                  </label>
                  <input
                    type="text"
                    maxLength={160}
                    value={hospitalData.slogan}
                    onChange={(e) => setHospitalData({ ...hospitalData, slogan: e.target.value })}
                    placeholder="e.g. Quality care, close to you"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-xl shadow-sm flex items-center space-x-2 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Hospital Settings</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        tabKey={activeTab}
        tabTitle={activeTab ? getTabTitle(activeTab) : ''}
        onImportConfirmed={handleImportData}
      />
    </div>
  );
};
