import React, { useRef, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { Plus, Trash2, Building2, Stethoscope, Clock, DollarSign, Check, Edit2 } from 'lucide-react';
import { SetupDepartment, SetupConsultationService, SetupPatientSubCategory } from '../../types';

interface SetupDepartmentConsultationProps {
  activeSubTab: 'departments' | 'consultations';
  departments: SetupDepartment[];
  onUpdateDepartments: (deps: SetupDepartment[]) => void;
  consultations: SetupConsultationService[];
  onUpdateConsultations: (conss: SetupConsultationService[]) => void;
  subCategories: SetupPatientSubCategory[];
}

export const SetupDepartmentConsultation: React.FC<SetupDepartmentConsultationProps> = ({
  activeSubTab,
  departments,
  onUpdateDepartments,
  consultations,
  onUpdateConsultations,
  subCategories,
}) => {
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptType, setDeptType] = useState<SetupDepartment['type']>('Clinical');
  const [deptHead, setDeptHead] = useState('');
  const [deptExt, setDeptExt] = useState('');
  const [deptLoc, setDeptLoc] = useState('');

  const [showConsModal, setShowConsModal] = useState(false);
  const [consCode, setConsCode] = useState('');
  const [consName, setConsName] = useState('');
  const [consDept, setConsDept] = useState(departments[0]?.name || 'Outpatient Department');
  const [consDuration, setConsDuration] = useState(20);
  const [consCashPrice, setConsCashPrice] = useState(500);
  const [consDesc, setConsDesc] = useState('');

  const [selectedSubCode, setSelectedSubCode] = useState<string>(subCategories[0]?.subCategoryCode || 'SHA-COMP');
  const [priceSaveState, setPriceSaveState] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});
  const priceTimers = useRef<Record<string, number>>({});

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode.trim() || !deptName.trim()) return;

    const newDept: SetupDepartment = {
      id: Date.now(),
      code: deptCode.trim().toUpperCase(),
      name: deptName.trim(),
      type: deptType,
      headOfDepartment: deptHead.trim() || 'Unassigned',
      phoneExt: deptExt.trim() || '—',
      location: deptLoc.trim() || 'Main Hospital Building',
      status: 'Active',
    };
    onUpdateDepartments([...departments, newDept]);
    setShowDeptModal(false);
    setDeptCode('');
    setDeptName('');
    setDeptHead('');
    setDeptExt('');
    setDeptLoc('');
  };

  const handleAddConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consCode.trim() || !consName.trim()) return;

    const initialSubPrices: Record<string, number> = {};
    subCategories.forEach((s) => {
      initialSubPrices[s.subCategoryCode] = s.isCash ? consCashPrice : Math.round(consCashPrice * 1.25);
    });

    const newCons: SetupConsultationService = {
      id: Date.now(),
      code: consCode.trim().toUpperCase(),
      name: consName.trim(),
      department: consDept,
      description: consDesc.trim() || 'Routine clinical assessment and care plan',
      durationMinutes: consDuration,
      cashPrice: consCashPrice,
      subCategoryPrices: initialSubPrices,
      status: 'Active',
    };

    onUpdateConsultations([...consultations, newCons]);
    setShowConsModal(false);
    setConsCode('');
    setConsName('');
    setConsDesc('');
  };

  const saveConsultationPrice = async (consultation: SetupConsultationService, subCode: string) => {
    const key = `${consultation.id}:${subCode}`;
    setPriceSaveState((prev) => ({ ...prev, [key]: 'saving' }));
    const result = await apiClient.persistEntity('setup-consultation-services', consultation);
    setPriceSaveState((prev) => ({ ...prev, [key]: result.success ? 'saved' : 'error' }));
    window.setTimeout(
      () =>
        setPriceSaveState((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        }),
      2500,
    );
  };

  const scheduleConsultationPriceSave = (consultation: SetupConsultationService, subCode: string) => {
    const key = `${consultation.id}:${subCode}`;
    if (priceTimers.current[key]) window.clearTimeout(priceTimers.current[key]);
    priceTimers.current[key] = window.setTimeout(() => {
      void saveConsultationPrice(consultation, subCode);
    }, 500);
  };

  const handleUpdateConsSubPrice = (consId: number, subCode: string, newPrice: number) => {
    const updated = consultations.map((c) =>
      c.id === consId ? { ...c, subCategoryPrices: { ...(c.subCategoryPrices || {}), [subCode]: newPrice } } : c,
    );
    onUpdateConsultations(updated);
    const changed = updated.find((c) => c.id === consId);
    if (changed) scheduleConsultationPriceSave(changed, subCode);
  };

  const handleUpdateConsCashPrice = (consId: number, newCashPrice: number) => {
    const updated = consultations.map((c) =>
      c.id === consId
        ? { ...c, cashPrice: newCashPrice, subCategoryPrices: { ...(c.subCategoryPrices || {}), 'CASH-GEN': newCashPrice } }
        : c,
    );
    onUpdateConsultations(updated);
    const changed = updated.find((c) => c.id === consId);
    if (changed) scheduleConsultationPriceSave(changed, 'CASH-GEN');
  };

  if (activeSubTab === 'departments') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900">Hospital Department Register</h2>
            <p className="text-xs text-gray-500">
              Configure clinical specialties, diagnostic units, inpatient wards, and administrative wings
            </p>
          </div>
          <button
            onClick={() => setShowDeptModal(true)}
            className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>

        <div className="border border-gray-200 bg-white rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Department Name</th>
                <th className="px-4 py-3">Classification Type</th>
                <th className="px-4 py-3">Head of Department</th>
                <th className="px-4 py-3">Phone Ext</th>
                <th className="px-4 py-3">Physical Location</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{dept.code}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{dept.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        dept.type === 'Clinical'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : dept.type === 'Diagnostic'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : dept.type === 'Inpatient'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {dept.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{dept.headOfDepartment}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{dept.phoneExt}</td>
                  <td className="px-4 py-3 text-gray-500">{dept.location}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">{dept.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onUpdateDepartments(departments.filter((d) => d.id !== dept.id))}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                      title="Delete department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showDeptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Add New Hospital Department</h3>
              <form onSubmit={handleAddDepartment} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Dept Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. OPD, LAB"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Type</label>
                    <select
                      value={deptType}
                      onChange={(e) => setDeptType(e.target.value as any)}
                      className="w-full px-3 py-1.5 border rounded-lg bg-white"
                    >
                      <option value="Clinical">Clinical</option>
                      <option value="Diagnostic">Diagnostic</option>
                      <option value="Inpatient">Inpatient</option>
                      <option value="Support">Support</option>
                      <option value="Administrative">Administrative</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ophthalmology & Eye Clinic"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Head of Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Doe, MMed"
                    value={deptHead}
                    onChange={(e) => setDeptHead(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Phone Extension</label>
                    <input
                      type="text"
                      placeholder="e.g. 108"
                      value={deptExt}
                      onChange={(e) => setDeptExt(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Location / Room</label>
                    <input
                      type="text"
                      placeholder="e.g. Ground Floor, Block B"
                      value={deptLoc}
                      onChange={(e) => setDeptLoc(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeptModal(false)}
                    className="px-4 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-lg cursor-pointer"
                  >
                    Save Department
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <h2 className="text-base font-bold text-gray-900">Consultation Register & Sub-Category Pricing Matrix</h2>
          <p className="text-xs text-gray-500">
            Configure clinical consultation tariffs for General OPD, Specialist Clinics, and Emergency Reviews across all patient
            sub-categories.
          </p>
        </div>
        <button
          onClick={() => setShowConsModal(true)}
          className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Consultation Service</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <span className="font-bold text-slate-700 shrink-0">Show Scheme Tariff Column:</span>
        <select
          value={selectedSubCode}
          onChange={(e) => setSelectedSubCode(e.target.value)}
          className="w-full sm:w-auto max-w-full min-w-0 px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold text-[#0088cc] focus:ring-2 focus:ring-[#0088cc]"
        >
          {subCategories.map((s) => (
            <option key={s.id} value={s.subCategoryCode}>
              {s.subCategoryCode} ({s.name})
            </option>
          ))}
        </select>
        <span className="text-gray-500 text-[11px]">
          Edit prices directly. Changes are automatically saved to MySQL by patient sub-category.
        </span>
      </div>

      <div className="border border-gray-200 bg-white rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-3.5 py-3">Code</th>
              <th className="px-3.5 py-3">Consultation Service</th>
              <th className="px-3.5 py-3">Department</th>
              <th className="px-3.5 py-3 text-center">Duration</th>
              <th className="px-3.5 py-3 text-right">Cash Price (KSh)</th>
              <th className="px-3.5 py-3 text-right text-indigo-700 bg-indigo-50/50">{selectedSubCode} Tariff (KSh)</th>
              <th className="px-3.5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {consultations.map((cons) => {
              const subPrice = cons.subCategoryPrices?.[selectedSubCode] ?? cons.cashPrice;
              return (
                <tr key={cons.id} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-800">{cons.code}</td>
                  <td className="px-3.5 py-3">
                    <span className="font-bold text-gray-900 block">{cons.name}</span>
                    <span className="text-[10px] text-gray-500">{cons.description}</span>
                  </td>
                  <td className="px-3.5 py-3 text-gray-600">{cons.department}</td>
                  <td className="px-3.5 py-3 text-center font-mono text-gray-700">{cons.durationMinutes} min</td>
                  <td className="px-3.5 py-3 text-right">
                    <input
                      type="number"
                      value={cons.cashPrice}
                      onChange={(e) => handleUpdateConsCashPrice(cons.id, parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-right border border-gray-200 rounded font-mono font-bold text-gray-900 focus:border-[#0088cc]"
                    />
                  </td>
                  <td className="px-3.5 py-3 text-right bg-indigo-50/30">
                    <input
                      type="number"
                      value={subPrice}
                      onChange={(e) => handleUpdateConsSubPrice(cons.id, selectedSubCode, parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-right border border-indigo-200 rounded font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-300"
                    />
                    {priceSaveState[`${cons.id}:${selectedSubCode}`] === 'saving' && (
                      <span className="text-[9px] text-amber-600 ml-1">Saving…</span>
                    )}
                    {priceSaveState[`${cons.id}:${selectedSubCode}`] === 'saved' && (
                      <span className="text-[9px] text-emerald-600 ml-1">Saved</span>
                    )}
                    {priceSaveState[`${cons.id}:${selectedSubCode}`] === 'error' && (
                      <span className="text-[9px] text-rose-600 ml-1">Save failed</span>
                    )}
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <button
                      onClick={() => onUpdateConsultations(consultations.filter((c) => c.id !== cons.id))}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                      title="Delete consultation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showConsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Add New Consultation Service</h3>
            <form onSubmit={handleAddConsultation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Service Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CONS-DENT-01"
                    value={consCode}
                    onChange={(e) => setConsCode(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Standard Duration (Mins)</label>
                  <input
                    type="number"
                    value={consDuration}
                    onChange={(e) => setConsDuration(parseInt(e.target.value) || 15)}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Consultation Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Specialist Dental Consultation"
                  value={consName}
                  onChange={(e) => setConsName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Hosting Department</label>
                  <select
                    value={consDept}
                    onChange={(e) => setConsDept(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Base Cash Tariff (KSh) *</label>
                  <input
                    type="number"
                    required
                    value={consCashPrice}
                    onChange={(e) => setConsCashPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Clinical Scope / Description</label>
                <textarea
                  rows={2}
                  placeholder="Clinical procedures, review scope, and standard history taking included."
                  value={consDesc}
                  onChange={(e) => setConsDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConsModal(false)}
                  className="px-4 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Consultation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
