import React, { useState } from 'react';
import { localDate } from '../utils/localTime';
import {
  Search,
  UserPlus,
  Filter,
  Eye,
  HeartPulse,
  Printer,
  ClipboardList,
  Shield,
  Phone,
  AlertTriangle,
  X,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Edit2,
} from 'lucide-react';
import { Patient, HospitalConfig } from '../types';
import { ReportHeader } from './ReportHeader';
import { printPatientSummary } from './PrintDocuments';
import { apiClient } from '../services/apiClient';

const calculateAgeFromDob = (dob: string) => {
  if (!dob) return 0;
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
};

const calculateDobFromAge = (ageValue: number) => {
  const age = Math.max(0, Math.min(130, Math.floor(Number(ageValue) || 0)));
  const now = new Date();
  const dob = new Date(now.getFullYear() - age, now.getMonth(), now.getDate());
  const yyyy = dob.getFullYear();
  const mm = String(dob.getMonth() + 1).padStart(2, '0');
  const dd = String(dob.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

interface PatientsModuleProps {
  patients: Patient[];

  consultations?: Array<{ patientId: string }>;
  onAddPatient: (newPatient: Omit<Patient, 'id' | 'registeredDate' | 'status'>) => Patient | boolean | Promise<Patient | boolean>;
  onUpdatePatient?: (patient: Patient) => boolean | Promise<boolean>;
  onSendToTriage: (patient: Patient) => void;
  onNavigateToShaOtp?: (patient: Patient) => void;
  hospitalConfig?: HospitalConfig;
  onOpenWalkIn?: (patient: Patient) => void;
}

interface RegistryPerson {
  name: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  dob: string;
  nationalId: string;
  shaNumber: string;
  address: string;
}
const ClientRegistryLookup: React.FC<{ onFound: (p: RegistryPerson) => void }> = ({ onFound }) => {
  const [types, setTypes] = useState<Record<string, string>>({ 'national-id': 'National ID' });
  const [type, setType] = useState('national-id');
  const [number, setNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: 'ok' | 'warn' | 'error'; text: string; people?: any[] } | null>(null);
  React.useEffect(() => {
    fetch('/api/sha/lists', { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.registryIdentifierTypes) setTypes(d.registryIdentifierTypes);
      })
      .catch(() => undefined);
  }, []);
  const toPerson = (e: any): RegistryPerson => {
    const id = (t: string) => (e.identifiers || []).find((x: any) => x.type === t)?.value || '';
    const a = e.address || {};
    return {
      name: [e.name?.given, e.name?.middle, e.name?.family].filter(Boolean).join(' '),
      gender: e.sex === 'male' ? 'Male' : e.sex === 'female' ? 'Female' : e.sex ? 'Other' : '',
      dob: e.birthDate || '',
      nationalId: id('national-id') || (type === 'national-id' ? number.trim() : ''),
      shaNumber: id('sha-member'),
      address: [a.village, a.ward, a.subCounty, a.county].filter(Boolean).join(', '),
    };
  };
  const use = (e: any) => {
    const p = toPerson(e);
    onFound(p);
    setResult({
      tone: 'ok',
      text: `Filled from the Client Registry: ${p.name}${e.crNumber ? ` (CR ${e.crNumber})` : ''}${p.shaNumber ? `, SHA ${p.shaNumber}` : ''}. Add the phone number and check the rest.`,
    });
  };
  const search = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/sha/registry-patient?identificationType=${encodeURIComponent(type)}&identificationNumber=${encodeURIComponent(number.trim())}`,
        { headers: { Accept: 'application/json' } },
      );
      const d = await res.json();
      if (!d.success) setResult({ tone: 'error', text: d.error || 'The Client Registry could not be searched.' });
      else {
        const s = d.data;
        if (s.outcome === 'match' && s.patients?.length) use(s.patients[0]);
        else if (s.outcome === 'multiple')
          setResult({ tone: 'warn', text: 'Several registry records share this ID; choose the right person:', people: s.patients });
        else if (s.outcome === 'no_match')
          setResult({
            tone: 'warn',
            text: 'The Client Registry does not know this person. Register them by hand; they must register with SHA, and WiseCare links them once they have.',
          });
        else
          setResult({
            tone: 'warn',
            text: s.message || 'The Client Registry cannot be reached now; register by hand and the link is made later.',
          });
      }
    } catch {
      setResult({ tone: 'error', text: 'Cannot reach the WiseCare server.' });
    }
    setBusy(false);
  };
  return (
    <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3 space-y-2">
      <p className="font-semibold text-emerald-900">Find the person in the national Client Registry (SHA / DHA)</p>
      <div className="flex flex-wrap gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg">
          {Object.entries(types).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (number.trim()) search();
            }
          }}
          placeholder="ID number"
          className="flex-1 min-w-[160px] px-3 py-2 border border-gray-200 rounded-lg"
        />
        <button
          type="button"
          onClick={search}
          disabled={busy || !number.trim()}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 disabled:opacity-50"
        >
          <Search className="w-3.5 h-3.5" /> {busy ? 'Searching…' : 'Find'}
        </button>
      </div>
      {result && (
        <div
          className={`rounded-lg px-3 py-2 ${result.tone === 'ok' ? 'bg-emerald-100 text-emerald-900' : result.tone === 'warn' ? 'bg-amber-50 text-amber-900' : 'bg-red-50 text-red-800'}`}
        >
          {result.text}
          {result.people?.map((e: any) => (
            <button key={e.crNumber} type="button" onClick={() => use(e)} className="block mt-1 text-left underline">
              {[e.name?.given, e.name?.middle, e.name?.family].filter(Boolean).join(' ')} · {e.sex} · born {e.birthDate} · CR {e.crNumber}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const PatientsModule: React.FC<PatientsModuleProps> = ({
  patients,
  consultations,
  onAddPatient,
  onUpdatePatient,
  onSendToTriage,
  onNavigateToShaOtp,
  hospitalConfig,
  onOpenWalkIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('All');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [setupCategories, setSetupCategories] = useState<any[]>([]);
  const [setupSubCategories, setSetupSubCategories] = useState<any[]>([]);
  const [setupSchemes, setSetupSchemes] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showIdCardModal, setShowIdCardModal] = useState<Patient | null>(null);
  const [registeredCashPatient, setRegisteredCashPatient] = useState<Patient | null>(null);

  const safePatients = (Array.isArray(patients) ? patients : []).map((raw: any) => ({
    ...raw,
    id: String(raw?.id ?? raw?.patient_code ?? ''),
    name: String(raw?.name ?? raw?.full_name ?? ''),
    age: raw?.dob ? calculateAgeFromDob(String(raw.dob)) : Number(raw?.age ?? 0),
    dob: String(raw?.dob ?? ''),
    gender: raw?.gender === 'Female' || raw?.gender === 'Other' ? raw.gender : 'Male',
    phone: String(raw?.phone ?? ''),
    email: String(raw?.email ?? ''),
    nationalId: String(raw?.nationalId ?? raw?.national_id ?? ''),
    birthCertificateNo: String(raw?.birthCertificateNo ?? raw?.birth_certificate_no ?? ''),
    address: String(raw?.address ?? ''),
    emergencyContact: String(raw?.emergencyContact ?? raw?.emergency_contact ?? ''),
    emergencyPhone: String(raw?.emergencyPhone ?? raw?.emergency_phone ?? ''),
    kinRelationship: String(raw?.kinRelationship ?? raw?.kin_relationship ?? ''),
    bloodGroup: raw?.bloodGroup ?? raw?.blood_group ?? '',
    allergies: String(raw?.allergies ?? ''),
    insuranceProvider: String(raw?.insuranceProvider ?? raw?.insurance_provider ?? 'Cash / M-Pesa'),
    insuranceScheme: String(raw?.insuranceScheme ?? raw?.insurance_scheme ?? ''),
    insurancePolicyNo: String(raw?.insurancePolicyNo ?? raw?.insurance_policy_no ?? ''),
    status: raw?.status ?? 'Registered',
    shaVerified: Boolean(raw?.shaVerified ?? raw?.sha_verified),
  })) as Patient[];

  const [formData, setFormData] = useState({
    name: '',
    age: 30,
    dob: '1996-01-01',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '',
    email: '',
    nationalId: '',
    birthCertificateNo: '',
    address: 'Nairobi, Kenya',
    emergencyContact: '',
    emergencyPhone: '',
    kinRelationship: '',

    bloodGroup: '' as Patient['bloodGroup'],
    allergies: '',
    patientCategory: '',
    patientSubCategory: '',
    insuranceProvider: 'Cash / M-Pesa',
    insurancePolicyNo: '',
    insuranceScheme: '',
  });

  const ageKnown = !!formData.dob || Number(formData.age) > 0;
  const isChild = ageKnown && (formData.dob ? calculateAgeFromDob(formData.dob) : Number(formData.age) || 0) < 18;

  React.useEffect(() => {
    const loadPatientSetup = async () => {
      const [cats, subs, schemes] = await Promise.all([
        apiClient.getSetupEntity('setup-patient-categories'),
        apiClient.getSetupEntity('setup-patient-subcategories'),
        apiClient.getSetupEntity('setup-patient-schemes'),
      ]);
      setSetupCategories(cats || []);
      setSetupSubCategories(subs || []);
      setSetupSchemes(schemes || []);
    };
    void loadPatientSetup();
  }, []);

  const calculateAge = calculateAgeFromDob;
  const consulted = React.useMemo(() => new Set((consultations || []).map((c) => String(c.patientId))), [consultations]);
  const hasConsultation = (id: string) => !consultations || consulted.has(String(id));

  const isCashLike = (x: any) =>
    !!x &&
    (!!x.isCash ||
      /^(CASH|MPESA|M-PESA)$/i.test(String(x.code || x.subCategoryCode || '')) ||
      /^(CASH|MPESA|M-PESA)$/i.test(String(x.name || '')));
  const selectedCategory = setupCategories.find(
    (c) => String(c.name) === String(formData.patientCategory) || String(c.code) === String(formData.patientCategory),
  );
  const categoryCode = selectedCategory?.code || '';
  const availableSubCategories = setupSubCategories.filter(
    (s) => !categoryCode || String(s.categoryCode) === String(categoryCode) || String(s.categoryName) === String(formData.patientCategory),
  );
  const selectedSubCategory = availableSubCategories.find(
    (s) => String(s.name) === String(formData.patientSubCategory) || String(s.subCategoryCode) === String(formData.patientSubCategory),
  );
  const availableSchemes = setupSchemes.filter((s) => String(s.subCategoryId) === String(selectedSubCategory?.id));
  const fallbackScheme = selectedSubCategory?.schemeName
    ? [
        {
          id: `legacy-${selectedSubCategory.id}`,
          providerName: selectedSubCategory.categoryName || formData.patientCategory,
          schemeCode: selectedSubCategory.schemeCode || '',
          schemeName: selectedSubCategory.schemeName,
          schemeType: selectedSubCategory.schemeType,
        },
      ]
    : [];
  const schemeOptions = availableSchemes.length ? availableSchemes : fallbackScheme;

  const filteredPatients = safePatients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      p.nationalId.includes(searchTerm);

    const matchesInsurance =
      insuranceFilter === 'All' ||
      (insuranceFilter === 'Cash' && p.insuranceProvider.includes('Cash')) ||
      (insuranceFilter === 'NHIF/SHA' && (p.insuranceProvider.includes('NHIF') || p.insuranceProvider.includes('SHA'))) ||
      (insuranceFilter === 'Private' && !p.insuranceProvider.includes('Cash') && !p.insuranceProvider.includes('NHIF'));

    return matchesSearch && matchesInsurance;
  });
  const pageCount = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagePatients = filteredPatients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pageNumbers = (() => {
    const set = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1].filter((n) => n >= 1 && n <= pageCount));
    const list = [...set].sort((a, z) => a - z);
    const out: (number | '…')[] = [];
    list.forEach((n, i) => {
      if (i && n - list[i - 1] > 1) out.push('…');
      out.push(n);
    });
    return out;
  })();

  const resetForm = () => {
    setDupCleared('');
    setDuplicates([]);
    setFormData({
      name: '',
      age: 0,
      dob: '',
      gender: 'Male',
      phone: '',
      email: '',
      nationalId: '',
      birthCertificateNo: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      kinRelationship: '',
      bloodGroup: '',
      allergies: '',
      patientCategory: '',
      patientSubCategory: '',
      insuranceProvider: 'Cash / M-Pesa',
      insurancePolicyNo: '',
      insuranceScheme: '',
    });
    setEditingPatient(null);
  };
  const openNewPatient = () => {
    resetForm();
    setShowRegisterModal(true);
  };
  const openEditPatient = (p: Patient) => {
    setEditingPatient(p);
    const editCategory = setupCategories.find(
      (c) => String(c.name) === String(p.patientCategory) || String(c.code) === String(p.patientCategory),
    );
    const editSubs = setupSubCategories.filter((s) => !editCategory || String(s.categoryCode) === String(editCategory.code));
    const editSub = editSubs.find(
      (s) => String(s.name) === String(p.patientSubCategory) || String(s.subCategoryCode) === String(p.patientSubCategory),
    );
    setFormData({
      name: p.name,
      age: calculateAge(p.dob),
      dob: p.dob || '',
      gender: p.gender,
      phone: p.phone,
      email: p.email || '',
      nationalId: p.nationalId || '',
      birthCertificateNo: p.birthCertificateNo || '',
      address: p.address || '',
      emergencyContact: p.emergencyContact || '',
      emergencyPhone: p.emergencyPhone || '',
      kinRelationship: p.kinRelationship || '',
      bloodGroup: p.bloodGroup || 'O+',
      allergies: p.allergies || 'None',
      patientCategory: editCategory?.name || p.patientCategory || '',
      patientSubCategory: editSub?.name || p.patientSubCategory || '',
      insuranceProvider: p.insuranceProvider || 'Cash / M-Pesa',
      insurancePolicyNo: p.insurancePolicyNo || '',
      insuranceScheme: p.insuranceScheme || '',
    });
    setShowRegisterModal(true);
  };

  const CAPS = [
    'name',
    'nationalId',
    'birthCertificateNo',
    'address',
    'emergencyContact',
    'kinRelationship',
    'allergies',
    'insurancePolicyNo',
  ] as const;
  const inCaps = (d: typeof formData) => {
    const o: any = { ...d };
    CAPS.forEach((k) => {
      if (typeof o[k] === 'string') o[k] = o[k].toUpperCase().trim();
    });
    o.phone = String(o.phone || '').trim();
    o.emergencyPhone = String(o.emergencyPhone || '').trim();
    return o as typeof formData;
  };

  const phoneKey = (v: unknown) =>
    String(v || '')
      .replace(/\D/g, '')
      .slice(-9);
  const samePhone = (phone: string) => {
    const k = phoneKey(phone);
    return k.length === 9 ? safePatients.filter((p) => phoneKey(p.phone) === k && (!editingPatient || p.id !== editingPatient.id)) : [];
  };
  const [duplicates, setDuplicates] = useState<Patient[]>([]);

  const [dupFrom, setDupFrom] = useState<'phone' | 'save'>('save');
  const [dupCleared, setDupCleared] = useState('');
  const phoneMatches = samePhone(formData.phone);
  const updateExisting = (p: Patient) => {
    const typed = inCaps(formData);
    openEditPatient(p);
    setFormData((cur) => {
      const o: any = { ...cur };
      Object.entries(typed).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined && !(k === 'age' && !Number(v))) o[k] = v;
      });
      return o;
    });
    setDuplicates([]);
  };
  const handleFormSubmit = async (e: React.FormEvent, proceed = false) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Please provide the patient name and phone number.');
      return;
    }
    if (!editingPatient && !proceed && dupCleared !== phoneKey(formData.phone)) {
      const dup = samePhone(formData.phone);
      if (dup.length) {
        setDupFrom('save');
        setDuplicates(dup);
        return;
      }
    }
    setDuplicates([]);
    const data = inCaps(formData);
    const age = data.dob ? calculateAge(data.dob) : Math.max(0, Math.min(130, Number(data.age) || 0));
    if (editingPatient) {
      const saved = onUpdatePatient ? await onUpdatePatient({ ...editingPatient, ...data, age }) : false;
      if (!saved) return;
    } else {
      const saved = await onAddPatient({ ...data, age });
      if (!saved) return;
      if (typeof saved === 'object') {
        setRegisteredCashPatient(saved as Patient);
        return;
      }
    }
    setShowRegisterModal(false);
    resetForm();
  };

  return (
    <div id="patients-module" className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Patient Registration & Directory</h2>
          <p className="text-xs text-gray-500">
            Total registered patients: <span className="font-bold text-blue-600">{patients.length}</span>
          </p>
        </div>
        <button
          id="btn-register-new-patient"
          onClick={openNewPatient}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#0b66b2] hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            id="input-patient-search"
            type="text"
            placeholder="Search by Patient Name, ID, Phone, or National ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Insurance:</span>
          <select
            id="select-insurance-filter"
            value={insuranceFilter}
            onChange={(e) => {
              setInsuranceFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="Cash">Cash / M-Pesa</option>
            <option value="NHIF/SHA">SHA / NHIF</option>
            <option value="Private">Private Insurers</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Patient Code</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Age / Sex</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">National ID</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Insurance</th>
                <th className="py-3 px-4 whitespace-nowrap">Date of Registration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-400">
                    No patients match your search query.
                  </td>
                </tr>
              ) : (
                pagePatients.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{p.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{p.name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {p.age} yrs • {p.gender}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{p.phone}</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{p.nationalId}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-red-50 text-red-700 border border-red-200 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        {p.bloodGroup}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-[11px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{p.insuranceProvider}</span>
                        {(p.insuranceProvider.includes('SHA') || p.insuranceProvider.includes('SHIF')) &&
                          (p.shaVerified ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              OTP Verified
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onNavigateToShaOtp && onNavigateToShaOtp(p)}
                              className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer"
                              title="Click to perform DHA SMS OTP verification"
                            >
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              Verify SMS OTP
                            </button>
                          ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap text-gray-600">
                      {(() => {
                        const m = String(p.registeredDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
                        return m ? `${m[3]}.${m[2]}.${m[1]}` : p.registeredDate || '—';
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'In Consultation'
                            ? 'bg-blue-100 text-blue-800'
                            : p.status === 'In Triage'
                              ? 'bg-amber-100 text-amber-800'
                              : p.status === 'At Lab'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {(p.insuranceProvider.includes('SHA') || p.insuranceProvider.includes('SHIF')) && (
                          <button
                            id={`btn-sha-otp-${p.id}`}
                            title="DHA SHA SMS OTP Verification"
                            onClick={() => onNavigateToShaOtp && onNavigateToShaOtp(p)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          id={`btn-edit-${p.id}`}
                          title="Edit Patient"
                          onClick={() => openEditPatient(p)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-triage-${p.id}`}
                          title="Send to Triage"
                          onClick={() => onSendToTriage(p)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <HeartPulse className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-view-${p.id}`}
                          title="View Details"
                          onClick={() => setSelectedPatient(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-summary-${p.id}`}
                          title={
                            hasConsultation(p.id)
                              ? 'Print Patient Summary (latest consultation)'
                              : 'No consultation yet — nothing to summarise'
                          }
                          disabled={!hasConsultation(p.id)}
                          onClick={() => void printPatientSummary({ patientId: p.id })}
                          className="px-2 py-1 text-[11px] font-bold text-sky-700 border border-sky-200 bg-sky-50 hover:bg-sky-100 rounded-lg transition flex items-center gap-1 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-sky-50"
                        >
                          <ClipboardList className="w-3.5 h-3.5" /> Summary
                        </button>
                        <button
                          id={`btn-card-${p.id}`}
                          title="Print Patient Card"
                          onClick={() => setShowIdCardModal(p)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredPatients.length > 0 && (
          <div
            id="patients-pagination"
            className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50/60 text-xs"
          >
            <div className="flex flex-wrap items-center gap-3 text-gray-600">
              <span>
                Showing <b>{(currentPage - 1) * pageSize + 1}</b>–<b>{Math.min(currentPage * pageSize, filteredPatients.length)}</b> of{' '}
                <b>{filteredPatients.length.toLocaleString()}</b> patients
              </span>
              <label className="flex items-center gap-1.5">
                Rows per page
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-200 rounded-md px-1.5 py-1 bg-white"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹ Previous
              </button>
              {pageNumbers.map((n, i) =>
                n === '…' ? (
                  <span key={`gap${i}`} className="px-1.5 text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    aria-current={n === currentPage ? 'page' : undefined}
                    className={`min-w-[2rem] px-2 py-1 rounded-md border text-xs font-semibold ${n === currentPage ? 'bg-[#0b66b2] border-[#0b66b2] text-white' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'}`}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= pageCount}
                className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  {editingPatient ? 'Edit & Update Patient' : 'New Patient Registration'}
                </h3>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {registeredCashPatient &&
              !editingPatient &&
              (() => {
                const p = registeredCashPatient;
                const cash = /cash|m-pesa/i.test(String(p.insuranceProvider || ''));
                const finish = () => {
                  setShowRegisterModal(false);
                  resetForm();
                  setRegisteredCashPatient(null);
                };
                return (
                  <div className="p-6">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="text-base font-black text-emerald-900">Patient registered</div>
                          <div className="text-sm text-emerald-800 mt-1">
                            <b>{p.name}</b> · patient number <b className="font-mono">{p.id}</b>
                            {cash ? ' · Cash' : ` · ${p.insuranceProvider || ''}`}
                          </div>
                          <div className="text-xs text-emerald-700 mt-3 font-semibold">What next?</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              id="btn-registered-send-triage"
                              onClick={() => {
                                onSendToTriage(p);
                                finish();
                              }}
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                            >
                              Add to queue (choose consultation)
                            </button>
                            {cash && onOpenWalkIn && (
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenWalkIn(p);
                                  finish();
                                }}
                                className="inline-flex items-center gap-2 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800 cursor-pointer"
                              >
                                Open Walk-in Cash Billing
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                resetForm();
                                setRegisteredCashPatient(null);
                              }}
                              className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 cursor-pointer"
                            >
                              Register another patient
                            </button>
                            <button
                              type="button"
                              onClick={finish}
                              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            {duplicates.length > 0 && (
              <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 text-xs">
                  <h4 className="font-bold text-gray-900 text-sm">This mobile number is already registered</h4>
                  <p className="text-gray-600">
                    {formData.phone} belongs to the patient{duplicates.length > 1 ? 's' : ''} below. Update the existing record instead of
                    registering the same person twice, or proceed if this is a different person.
                  </p>
                  <div className="divide-y border border-gray-200 rounded-xl">
                    {duplicates.map((p) => (
                      <div key={p.id} className="p-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-bold uppercase text-gray-900">{p.name}</div>
                          <div className="text-[11px] text-gray-500">
                            {p.id} • ID: {p.nationalId || '—'} • {p.gender}
                            {p.dob ? ` • DOB ${p.dob}` : ''} • {p.patientSubCategory || p.insuranceProvider || ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateExisting(p)}
                          className="px-3 py-1.5 bg-[#0b66b2] hover:bg-blue-700 text-white rounded-lg font-bold"
                        >
                          Update this patient's details
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDuplicates([])}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        setDupCleared(phoneKey(formData.phone));
                        if (dupFrom === 'save') void handleFormSubmit(e as any, true);
                        else setDuplicates([]);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                    >
                      Proceed — register as a new patient
                    </button>
                  </div>
                </div>
              </div>
            )}
            <form
              onSubmit={handleFormSubmit}
              hidden={!!registeredCashPatient && !editingPatient}
              className="p-6 space-y-4 text-xs [&_input[type=text]]:uppercase [&_input:not([type])]:uppercase [&_textarea]:uppercase"
            >
              <ClientRegistryLookup
                onFound={(p) =>
                  setFormData((f) => ({
                    ...f,
                    name: p.name || f.name,
                    gender: p.gender || f.gender,
                    dob: p.dob || f.dob,
                    age: p.dob ? calculateAge(p.dob) : f.age,
                    nationalId: p.nationalId || f.nationalId,
                    address: p.address || f.address,
                    insurancePolicyNo: p.shaNumber || f.insurancePolicyNo,
                  }))
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samuel Mutua Kilonzo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="07XX XXX XXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    onBlur={() => {
                      if (!editingPatient && phoneMatches.length && dupCleared !== phoneKey(formData.phone)) {
                        setDupFrom('phone');
                        setDuplicates(phoneMatches);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      max={localDate()}
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value, age: calculateAge(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Enter DOB to calculate age automatically.</p>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="130"
                      required
                      value={formData.age}
                      onChange={(e) => {
                        const age = Math.max(0, Math.min(130, Number(e.target.value) || 0));
                        setFormData({ ...formData, age, dob: calculateDobFromAge(age) });
                      }}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white font-bold"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Enter age to calculate DOB.</p>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Blood Group</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as Patient['bloodGroup'] })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    >
                      <option value="">Unknown</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">National ID / Passport</label>
                  <input
                    type="text"
                    placeholder="e.g. 31920844"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>

                {(isChild || formData.birthCertificateNo) && (
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Birth Certificate Number</label>
                    <input
                      type="text"
                      placeholder="From the child's birth certificate"
                      value={formData.birthCertificateNo}
                      onChange={(e) => setFormData({ ...formData, birthCertificateNo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Children are found in the national registry by this number until they get an ID.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2 border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-3">
                  <div className="font-bold text-blue-900">Patient Category & Coverage Configuration</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Patient Category *</label>
                      <select
                        required
                        value={formData.patientCategory}
                        onChange={(e) => {
                          const c = setupCategories.find((x) => String(x.name) === e.target.value);
                          setFormData({
                            ...formData,
                            patientCategory: e.target.value,
                            patientSubCategory: '',
                            insuranceProvider: isCashLike(c) ? 'Cash / M-Pesa' : '',
                            insuranceScheme: '',
                          });
                        }}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white"
                      >
                        <option value="">-- Select Patient Category --</option>
                        {setupCategories
                          .filter((c) => String(c.status || 'Active') === 'Active')
                          .map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Sub-Category Name *</label>
                      <select
                        required
                        value={formData.patientSubCategory}
                        onChange={(e) => {
                          const sc = availableSubCategories.find((x) => x.name === e.target.value);
                          setFormData({
                            ...formData,
                            patientSubCategory: e.target.value,
                            insuranceProvider: isCashLike(sc) ? 'Cash / M-Pesa' : formData.insuranceProvider,
                            insuranceScheme: '',
                          });
                        }}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white"
                      >
                        <option value="">-- Select Registered Sub-Category --</option>
                        {availableSubCategories.map((sc) => (
                          <option key={sc.id} value={sc.name}>
                            {sc.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">Sub-categories are managed in System Setup.</p>
                    </div>
                  </div>

                  {!isCashLike(selectedCategory) && !isCashLike(selectedSubCategory) && selectedSubCategory && schemeOptions.length > 0 && (
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Insurance / Corporate Scheme *</label>
                      <select
                        required
                        value={formData.insuranceScheme}
                        onChange={(e) => {
                          const sc = schemeOptions.find((x) => x.schemeName === e.target.value);
                          setFormData({
                            ...formData,
                            insuranceScheme: e.target.value,
                            insuranceProvider: sc?.providerName || formData.insuranceProvider,
                          });
                        }}
                        className="w-full px-3 py-2 border border-emerald-300 rounded-lg bg-white"
                      >
                        <option value="">-- Select Registered Scheme --</option>
                        {schemeOptions.map((sc) => (
                          <option key={sc.id} value={sc.schemeName}>
                            {sc.providerName ? `${sc.providerName} — ${sc.schemeName}` : sc.schemeName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Insurance / Payment Mode</label>
                      <input
                        readOnly
                        value={formData.insuranceProvider || (isCashLike(selectedCategory) ? 'Cash / M-Pesa' : '')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Policy / Member No.</label>
                      <input
                        type="text"
                        placeholder="e.g. SHA-84920194"
                        value={formData.insurancePolicyNo}
                        onChange={(e) => setFormData({ ...formData, insurancePolicyNo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                  {(formData.insuranceProvider.includes('SHA') || formData.insuranceScheme.toUpperCase().includes('SHA')) && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                      <strong>SHA:</strong> this patient can proceed to the SHA e-Claims / verification workflow after registration.
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Nairobi West, Langata Road"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>

                {isChild && (
                  <div className="sm:col-span-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
                    This patient is a child. Enter the parent or guardian below: SHA sends the child's consent code to them.
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isChild ? 'Parent / Guardian Name *' : 'Next of Kin Name'}
                  </label>
                  <input
                    type="text"
                    required={isChild}
                    placeholder={isChild ? 'e.g. Amina Otieno' : 'e.g. Grace Wanjiru'}
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isChild ? 'Parent / Guardian Phone *' : 'Next of Kin Phone'}
                  </label>
                  <input
                    type="text"
                    required={isChild}
                    placeholder="07XX XXX XXX"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isChild ? 'Relationship to the Child *' : 'Relationship to the Patient'}
                  </label>
                  <select
                    required={isChild}
                    value={formData.kinRelationship}
                    onChange={(e) => setFormData({ ...formData, kinRelationship: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="">Choose…</option>
                    {(isChild
                      ? ['Mother', 'Father', 'Guardian', 'Grandparent', 'Sibling', 'Other relative']
                      : ['Spouse', 'Parent', 'Child', 'Sibling', 'Guardian', 'Friend', 'Other relative']
                    ).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                {formData.insuranceProvider.includes('SHA') || formData.insuranceProvider.includes('SHIF') ? (
                  <button
                    id="btn-submit-registration"
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center space-x-2 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-100" />
                    <span>Register & Proceed to SHA OTP Verification</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <button
                    id="btn-submit-registration"
                    type="submit"
                    className="px-5 py-2 bg-[#0b66b2] hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition cursor-pointer"
                  >
                    {editingPatient ? 'Update Patient Details' : 'Save & Register Patient'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{selectedPatient.id}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{selectedPatient.name}</h3>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <p className="text-gray-400 text-[10px]">Age & Gender</p>
                <p className="font-semibold text-gray-800">
                  {selectedPatient.age} yrs • {selectedPatient.gender}
                </p>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <p className="text-gray-400 text-[10px]">Blood Group</p>
                <p className="font-bold text-red-600">{selectedPatient.bloodGroup}</p>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <p className="text-gray-400 text-[10px]">Phone Number</p>
                <p className="font-semibold text-gray-800">{selectedPatient.phone}</p>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <p className="text-gray-400 text-[10px]">National ID</p>
                <p className="font-semibold text-gray-800">{selectedPatient.nationalId}</p>
              </div>
              <div className="col-span-2 bg-gray-50 p-2.5 rounded-lg">
                <p className="text-gray-400 text-[10px]">Insurance Provider</p>
                <p className="font-semibold text-gray-800">
                  {selectedPatient.insuranceProvider} {selectedPatient.insurancePolicyNo && `(${selectedPatient.insurancePolicyNo})`}
                </p>
              </div>
              <div className="col-span-2 bg-red-50/60 border border-red-200 p-2.5 rounded-lg text-red-800">
                <p className="text-red-500 font-bold text-[10px]">Drug & Food Allergies</p>
                <p className="font-medium">{selectedPatient.allergies || 'None documented'}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  onSendToTriage(selectedPatient);
                  setSelectedPatient(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1"
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Add to Queue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showIdCardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-gray-800 text-sm">Patient Hospital Card</h4>
              <button onClick={() => setShowIdCardModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-[#0b66b2] rounded-xl p-5 bg-gradient-to-br from-blue-50/50 to-white relative overflow-hidden">
              <ReportHeader config={hospitalConfig} title="Patient Hospital Card" subtitle={`Patient ID: ${showIdCardModal.id}`} />
              <div className="space-y-1.5 text-xs">
                <p>
                  <span className="text-gray-500 font-medium">Name:</span>{' '}
                  <span className="font-bold text-gray-900">{showIdCardModal.name}</span>
                </p>
                <p>
                  <span className="text-gray-500 font-medium">Gender/Age:</span>{' '}
                  <span className="font-semibold text-gray-800">
                    {showIdCardModal.gender}, {showIdCardModal.age} yrs
                  </span>
                </p>
                <p>
                  <span className="text-gray-500 font-medium">Blood Group:</span>{' '}
                  <span className="font-bold text-red-600">{showIdCardModal.bloodGroup}</span>
                </p>
                <p>
                  <span className="text-gray-500 font-medium">Insurance:</span>{' '}
                  <span className="font-semibold text-gray-800">{showIdCardModal.insuranceProvider}</span>
                </p>
                <p>
                  <span className="text-gray-500 font-medium">Emergency:</span>{' '}
                  <span className="font-semibold text-gray-800">{showIdCardModal.emergencyPhone || showIdCardModal.phone}</span>
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                <span>{hospitalConfig?.hospitalName || ''}</span>
                <span>Emergency: 999{hospitalConfig?.emergencyHotline ? ` / ${hospitalConfig.emergencyHotline}` : ''}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0b66b2] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
