import React, { useState } from 'react';
import {
  FlaskConical,
  Radiation,
  Syringe,
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  FileText,
  Sliders,
  CheckCircle2,
  Eye,
  AlertCircle,
} from 'lucide-react';
import {
  SetupLabTestItem,
  SetupLabParameter,
  SetupRadiologyTestItem,
  SetupRadiologyTemplate,
  SetupNursingProcedureItem,
  SetupIcd11Item,
  SetupDepartment,
} from '../../types';
import { LabParametersModal } from './LabParametersModal';
import { RadiologyTemplateModal } from './RadiologyTemplateModal';
import { apiClient } from '../../services/apiClient';

interface SetupDiagnosticRegistersProps {
  activeSubTab: 'lab_tests' | 'radiology_tests' | 'radiology_templates' | 'nursing_procedures' | 'icd11_codes';
  labTests: SetupLabTestItem[];
  onUpdateLabTests: (tests: SetupLabTestItem[]) => void;
  radiologyTests: SetupRadiologyTestItem[];
  onUpdateRadiologyTests: (tests: SetupRadiologyTestItem[]) => void;
  radiologyTemplates: SetupRadiologyTemplate[];
  onUpdateRadiologyTemplates: (templates: SetupRadiologyTemplate[]) => void;
  nursingProcedures: SetupNursingProcedureItem[];
  onUpdateNursingProcedures: (procs: SetupNursingProcedureItem[]) => void;
  icd11Codes: SetupIcd11Item[];
  onUpdateIcd11Codes: (codes: SetupIcd11Item[]) => void;

  departments?: SetupDepartment[];
}

export const SetupDiagnosticRegisters: React.FC<SetupDiagnosticRegistersProps> = ({
  activeSubTab,
  labTests,
  onUpdateLabTests,
  radiologyTests,
  onUpdateRadiologyTests,
  radiologyTemplates,
  onUpdateRadiologyTemplates,
  nursingProcedures,
  onUpdateNursingProcedures,
  icd11Codes,
  onUpdateIcd11Codes,
  departments = [],
}) => {
  const [selectedLabTestForParams, setSelectedLabTestForParams] = useState<SetupLabTestItem | null>(null);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<SetupRadiologyTemplate | null>(null);

  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [newLabCode, setNewLabCode] = useState('');
  const [newLabName, setNewLabName] = useState('');
  const [newLabDept, setNewLabDept] = useState('Hematology');
  const [newLabSpecimen, setNewLabSpecimen] = useState('Whole Blood (EDTA)');
  const [newLabTAT, setNewLabTAT] = useState(30);
  const [newLabCashPrice, setNewLabCashPrice] = useState(500);

  const [editingLabId, setEditingLabId] = useState<number | null>(null);
  const openLabForm = (t?: SetupLabTestItem) => {
    setEditingLabId(t ? t.id : null);
    setNewLabCode(t?.code || '');
    setNewLabName(t?.name || '');
    setNewLabDept(t?.department || 'Hematology');
    setNewLabSpecimen(t?.specimenType || 'Whole Blood (EDTA)');
    setNewLabTAT(Number(t?.turnaroundMinutes ?? 30));
    setNewLabCashPrice(Number(t?.cashPrice ?? 500));
    setShowAddLabModal(true);
  };

  const [showAddRadModal, setShowAddRadModal] = useState(false);
  const [newRadCode, setNewRadCode] = useState('');
  const [newRadName, setNewRadName] = useState('');
  const [newRadModality, setNewRadModality] = useState<SetupRadiologyTestItem['modality']>('X-Ray');
  const [newRadCategory, setNewRadCategory] = useState('X-Ray');
  const [newRadPrep, setNewRadPrep] = useState('No special preparation required.');
  const [newRadContrast, setNewRadContrast] = useState(false);
  const [newRadCashPrice, setNewRadCashPrice] = useState(1500);

  const [showAddNurModal, setShowAddNurModal] = useState(false);
  const [newNurCode, setNewNurCode] = useState('');
  const [newNurName, setNewNurName] = useState('');
  const [newNurDept, setNewNurDept] = useState('Nursing OPD / Triage');
  const [newNurConsumables, setNewNurConsumables] = useState('');
  const [newNurCashPrice, setNewNurCashPrice] = useState(400);

  const [showAddIcdModal, setShowAddIcdModal] = useState(false);
  const [newIcdCode, setNewIcdCode] = useState('');
  const [newIcdTitle, setNewIcdTitle] = useState('');
  const [newIcdChapter, setNewIcdChapter] = useState('01 Certain infectious diseases');
  const [newIcdBlock, setNewIcdBlock] = useState('');
  const [newIcdDesc, setNewIcdDesc] = useState('');

  const [icdSearch, setIcdSearch] = useState('');

  const handleAddRadiologyStudy = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newRadCode.trim().toUpperCase();
    const name = newRadName.trim();
    if (!code || !name) return;

    const duplicate = radiologyTests.some((r) => r.code.trim().toUpperCase() === code);
    if (duplicate) {
      window.alert(`Radiology study code ${code} already exists.`);
      return;
    }

    const newStudy: SetupRadiologyTestItem = {
      id: Date.now(),
      code,
      name,
      category: newRadCategory.trim() || newRadModality,
      modality: newRadModality,
      preparationInstructions: newRadPrep.trim() || 'No special preparation required.',
      requiresContrast: newRadContrast,
      cashPrice: Number(newRadCashPrice) || 0,
      subCategoryPrices: { 'CASH-GEN': Number(newRadCashPrice) || 0 },
      status: 'Active',
    };

    onUpdateRadiologyTests([...radiologyTests, newStudy]);
    setShowAddRadModal(false);
    setNewRadCode('');
    setNewRadName('');
    setNewRadModality('X-Ray');
    setNewRadCategory('X-Ray');
    setNewRadPrep('No special preparation required.');
    setNewRadContrast(false);
    setNewRadCashPrice(1500);
  };

  const handleAddNursingProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newNurCode.trim().toUpperCase();
    const name = newNurName.trim();
    if (!code || !name) return;

    const duplicate = nursingProcedures.some((n) => n.code.trim().toUpperCase() === code);
    if (duplicate) {
      window.alert(`Nursing procedure code ${code} already exists.`);
      return;
    }

    const price = Number(newNurCashPrice) || 0;
    const newProcedure: SetupNursingProcedureItem = {
      id: Date.now(),
      code,
      name,
      department: newNurDept.trim() || departments[0]?.name || 'Nursing OPD / Triage',
      consumables: newNurConsumables.trim(),
      cashPrice: price,
      subCategoryPrices: { 'CASH-GEN': price },
      status: 'Active',
    };

    onUpdateNursingProcedures([...nursingProcedures, newProcedure]);
    setShowAddNurModal(false);
    setNewNurCode('');
    setNewNurName('');
    setNewNurDept('Nursing OPD / Triage');
    setNewNurConsumables('');
    setNewNurCashPrice(400);
  };

  const handleSaveParameters = (testId: number, updatedParameters: SetupLabParameter[], testComment?: string) => {
    onUpdateLabTests(
      labTests.map((t) => (t.id === testId ? { ...t, parameters: updatedParameters, clinicalComment: testComment || undefined } : t)),
    );
  };

  const handleSaveTemplate = (savedTemplate: SetupRadiologyTemplate) => {
    const existingIndex = radiologyTemplates.findIndex((t) => t.id === savedTemplate.id);
    if (existingIndex >= 0) {
      const updated = [...radiologyTemplates];
      updated[existingIndex] = savedTemplate;
      onUpdateRadiologyTemplates(updated);
    } else {
      onUpdateRadiologyTemplates([...radiologyTemplates, savedTemplate]);
    }
  };

  if (activeSubTab === 'lab_tests') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[#0088cc]" />
              Laboratory Test Master & Analyte Parameters Register
            </h2>
            <p className="text-xs text-gray-500">
              Configure diagnostic laboratory tests and define detailed sub-analyte parameters with biological reference ranges.
            </p>
          </div>
          <button
            onClick={() => openLabForm()}
            className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lab Test</span>
          </button>
        </div>

        <div className="border border-gray-200 bg-white rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-3.5 py-3">Code</th>
                <th className="px-3.5 py-3">Test Name</th>
                <th className="px-3.5 py-3">Department</th>
                <th className="px-3.5 py-3">Specimen Tube</th>
                <th className="px-3.5 py-3 text-center">TAT</th>
                <th className="px-3.5 py-3 text-right">Cash Price</th>
                <th className="px-3.5 py-3 text-center">Parameters Defined</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labTests.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-800">{t.code}</td>
                  <td className="px-3.5 py-3 font-bold text-gray-900">{t.name}</td>
                  <td className="px-3.5 py-3 text-gray-600">{t.department}</td>
                  <td className="px-3.5 py-3 text-gray-600 font-mono text-[11px]">{t.specimenType}</td>
                  <td className="px-3.5 py-3 text-center text-gray-700">{t.turnaroundMinutes}m</td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-gray-900">KSh {t.cashPrice.toLocaleString()}</td>
                  <td className="px-3.5 py-3 text-center">
                    <button
                      onClick={() => setSelectedLabTestForParams(t)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-[#0088cc] border border-sky-200 hover:bg-sky-100 transition cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{t.parameters?.length || 0} Analytes (Configure)</span>
                    </button>
                  </td>
                  <td className="px-3.5 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => openLabForm(t)}
                      className="text-amber-600 hover:text-amber-800 p-1 rounded hover:bg-amber-50 cursor-pointer mr-1"
                      title="Edit test"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onUpdateLabTests(labTests.filter((item) => item.id !== t.id))}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                      title="Delete test"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedLabTestForParams && (
          <LabParametersModal
            key={selectedLabTestForParams.id}
            isOpen={selectedLabTestForParams !== null}
            onClose={() => setSelectedLabTestForParams(null)}
            testItem={selectedLabTestForParams}
            onSaveParameters={handleSaveParameters}
          />
        )}

        {showAddLabModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-900">{editingLabId ? 'Edit Laboratory Test' : 'Add New Laboratory Test'}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newLabCode || !newLabName) return;
                  const code = newLabCode.trim().toUpperCase();
                  if (
                    labTests.some(
                      (x) =>
                        x.id !== editingLabId &&
                        String(x.code || '')
                          .trim()
                          .toUpperCase() === code,
                    )
                  ) {
                    window.alert(`Lab test code ${code} already exists.`);
                    return;
                  }
                  if (editingLabId) {
                    onUpdateLabTests(
                      labTests.map((x) =>
                        x.id === editingLabId
                          ? {
                              ...x,
                              code,
                              name: newLabName.trim(),
                              department: newLabDept,
                              specimenType: newLabSpecimen,
                              turnaroundMinutes: newLabTAT,
                              cashPrice: newLabCashPrice,
                            }
                          : x,
                      ),
                    );
                    setShowAddLabModal(false);
                    setEditingLabId(null);
                    return;
                  }
                  const newT: SetupLabTestItem = {
                    id: Date.now(),
                    code: newLabCode.trim().toUpperCase(),
                    name: newLabName.trim(),
                    department: newLabDept,
                    specimenType: newLabSpecimen,
                    turnaroundMinutes: newLabTAT,
                    cashPrice: newLabCashPrice,
                    subCategoryPrices: { 'CASH-GEN': newLabCashPrice },
                    parameters: [],
                    status: 'Active',
                  };
                  onUpdateLabTests([...labTests, newT]);
                  setShowAddLabModal(false);
                }}
                className="space-y-3 text-xs"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Test Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LAB-LIP-01"
                      value={newLabCode}
                      onChange={(e) => setNewLabCode(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={newLabDept}
                      onChange={(e) => setNewLabDept(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Test Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lipid Profile Complete"
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Specimen Tube</label>
                    <input
                      type="text"
                      value={newLabSpecimen}
                      onChange={(e) => setNewLabSpecimen(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Turnaround (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      value={newLabTAT}
                      onChange={(e) => setNewLabTAT(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Base Cash Price (KSh)</label>
                    <input
                      type="number"
                      value={newLabCashPrice}
                      onChange={(e) => setNewLabCashPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLabModal(false)}
                    className="px-4 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-lg cursor-pointer"
                  >
                    Save Lab Test
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeSubTab === 'radiology_tests') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Radiation className="w-5 h-5 text-purple-600" />
              Radiology & Diagnostic Imaging Studies Register
            </h2>
            <p className="text-xs text-gray-500">
              Configure radiological modalities (X-Ray, Ultrasound, CT Scan, MRI) and patient preparation requirements.
            </p>
          </div>
          <button
            onClick={() => setShowAddRadModal(true)}
            className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Radiology Study</span>
          </button>
        </div>

        <div className="border border-gray-200 bg-white rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-3.5 py-3">Code</th>
                <th className="px-3.5 py-3">Study Name</th>
                <th className="px-3.5 py-3">Modality</th>
                <th className="px-3.5 py-3">Preparation Instructions</th>
                <th className="px-3.5 py-3 text-center">IV Contrast</th>
                <th className="px-3.5 py-3 text-right">Cash Price</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {radiologyTests.map((rad) => (
                <tr key={rad.id} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-800">{rad.code}</td>
                  <td className="px-3.5 py-3 font-bold text-gray-900">{rad.name}</td>
                  <td className="px-3.5 py-3">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-semibold text-[10px]">{rad.modality}</span>
                  </td>
                  <td className="px-3.5 py-3 text-gray-500 max-w-xs truncate">{rad.preparationInstructions}</td>
                  <td className="px-3.5 py-3 text-center">
                    {rad.requiresContrast ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">Required</span>
                    ) : (
                      <span className="text-gray-400 text-[10px]">No</span>
                    )}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-gray-900">KSh {rad.cashPrice.toLocaleString()}</td>
                  <td className="px-3.5 py-3 text-right">
                    <button
                      onClick={() => onUpdateRadiologyTests(radiologyTests.filter((r) => r.id !== rad.id))}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                      title="Delete study"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showAddRadModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-radiology-study-title"
          >
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-gray-200">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 id="add-radiology-study-title" className="text-base font-bold text-gray-900">
                    Add Radiology Study
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Register the study here so it becomes available to Radiology ordering and billing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddRadModal(false)}
                  className="text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddRadiologyStudy} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Study Code *</label>
                    <input
                      type="text"
                      required
                      value={newRadCode}
                      onChange={(e) => setNewRadCode(e.target.value)}
                      placeholder="e.g. RAD-CXR-001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase font-mono focus:outline-none focus:ring-2 focus:ring-sky-200"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Study Name *</label>
                    <input
                      type="text"
                      required
                      value={newRadName}
                      onChange={(e) => setNewRadName(e.target.value)}
                      placeholder="e.g. Chest X-Ray PA View"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Modality *</label>
                    <select
                      value={newRadModality}
                      onChange={(e) => {
                        const value = e.target.value as SetupRadiologyTestItem['modality'];
                        setNewRadModality(value);
                        if (!newRadCategory || newRadCategory === 'X-Ray') setNewRadCategory(value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="X-Ray">X-Ray</option>
                      <option value="Ultrasound">Ultrasound</option>
                      <option value="CT Scan">CT Scan</option>
                      <option value="MRI">MRI</option>
                      <option value="Mammography">Mammography</option>
                      <option value="ECG">ECG</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={newRadCategory}
                      onChange={(e) => setNewRadCategory(e.target.value)}
                      placeholder="e.g. General Radiography"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Cash Price (KSh)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newRadCashPrice}
                      onChange={(e) => setNewRadCashPrice(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Preparation Instructions</label>
                  <textarea
                    rows={3}
                    value={newRadPrep}
                    onChange={(e) => setNewRadPrep(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                    placeholder="Enter patient preparation instructions..."
                  />
                </div>

                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRadContrast}
                    onChange={(e) => setNewRadContrast(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="font-semibold text-gray-700">IV contrast required</span>
                </label>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddRadModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-lg cursor-pointer shadow-sm"
                  >
                    Save Radiology Study
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeSubTab === 'radiology_templates') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Radiology Report Templates Builder
            </h2>
            <p className="text-xs text-gray-500">
              Create and manage standardized clinical report templates for chest radiographs, sonography scans, and CT examinations.
            </p>
          </div>
          <button
            onClick={() => {
              setTemplateToEdit(null);
              setShowTemplateModal(true);
            }}
            className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Report Template</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {radiologyTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-[#0088cc] transition flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-gray-400 block">{tpl.templateCode}</span>
                    <h3 className="text-sm font-bold text-gray-900">{tpl.templateName}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold shrink-0">{tpl.modality}</span>
                </div>

                <div className="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700">
                  <span className="font-bold block text-slate-900 mb-0.5">Impression Preview:</span>
                  <p className="italic">{tpl.impressionTemplate}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Clinical Template
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setTemplateToEdit(tpl);
                      setShowTemplateModal(true);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer"
                  >
                    Edit / Preview
                  </button>
                  <button
                    title="Delete template"
                    onClick={async () => {
                      if (!window.confirm(`Delete the template "${tpl.templateName}"?`)) return;
                      const r = await apiClient.deleteEntity('setup-radiology-templates', String(tpl.id));
                      if (!r.success) {
                        window.alert(`The template was not deleted.\n\n${r.error || 'Try again.'}`);
                        return;
                      }
                      onUpdateRadiologyTemplates(radiologyTemplates.filter((t) => t.id !== tpl.id));
                    }}
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <RadiologyTemplateModal
          key={`${templateToEdit?.id ?? 'new'}-${showTemplateModal}`}
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          templateToEdit={templateToEdit}
          onSaveTemplate={handleSaveTemplate}
        />
      </div>
    );
  }

  if (activeSubTab === 'nursing_procedures') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Syringe className="w-5 h-5 text-emerald-600" />
              Nursing Procedures & Clinical Interventions Register
            </h2>
            <p className="text-xs text-gray-500">
              Configure minor theatre interventions, wound dressings, IV catheterization, and sterile nursing procedures.
            </p>
          </div>
          <button
            onClick={() => setShowAddNurModal(true)}
            className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Nursing Procedure</span>
          </button>
        </div>

        <div className="border border-gray-200 bg-white rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-3.5 py-3">Code</th>
                <th className="px-3.5 py-3">Procedure Name</th>
                <th className="px-3.5 py-3">Department</th>
                <th className="px-3.5 py-3">Sterile Consumables Required</th>
                <th className="px-3.5 py-3 text-right">Cash Price</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {nursingProcedures.map((nur) => (
                <tr key={nur.id} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-800">{nur.code}</td>
                  <td className="px-3.5 py-3 font-bold text-gray-900">{nur.name}</td>
                  <td className="px-3.5 py-3 text-gray-600">{nur.department}</td>
                  <td className="px-3.5 py-3 text-gray-500 max-w-sm">{nur.consumables}</td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-gray-900">KSh {nur.cashPrice.toLocaleString()}</td>
                  <td className="px-3.5 py-3 text-right">
                    <button
                      onClick={() => onUpdateNursingProcedures(nursingProcedures.filter((n) => n.id !== nur.id))}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                      title="Delete procedure"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showAddNurModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
            <form
              onSubmit={handleAddNursingProcedure}
              className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-black text-slate-900">Add Nursing Procedure</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Create a billable nursing procedure and save it to the master register.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddNurModal(false)}
                  className="text-slate-500 hover:text-slate-900 text-xl font-bold px-2 cursor-pointer"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-xs font-bold text-slate-700">
                  Procedure Code *
                  <input
                    required
                    value={newNurCode}
                    onChange={(e) => setNewNurCode(e.target.value)}
                    placeholder="NUR-001"
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Procedure Name *
                  <input
                    required
                    value={newNurName}
                    onChange={(e) => setNewNurName(e.target.value)}
                    placeholder="Wound Dressing"
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Department
                  <select
                    value={newNurDept}
                    onChange={(e) => setNewNurDept(e.target.value)}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Select a department…</option>
                    {departments
                      .filter((d) => d.status !== 'Inactive')
                      .map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                          {d.code ? ` (${d.code})` : ''}
                        </option>
                      ))}
                    {newNurDept && !departments.some((d) => d.name === newNurDept) && <option value={newNurDept}>{newNurDept}</option>}
                  </select>
                  {departments.length === 0 && (
                    <span className="block mt-1 text-[10px] font-normal text-amber-700">
                      Add the hospital's departments in System Setup → Hospital Departments first.
                    </span>
                  )}
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Cash Price (KSh)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newNurCashPrice}
                    onChange={(e) => setNewNurCashPrice(Number(e.target.value))}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 md:col-span-2">
                  Sterile Consumables Required
                  <textarea
                    value={newNurConsumables}
                    onChange={(e) => setNewNurConsumables(e.target.value)}
                    placeholder="Gloves, dressing pack, antiseptic, gauze..."
                    rows={3}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </label>
                <div className="md:col-span-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
                  The entered cash price is also stored as the <strong>CASH-GEN</strong> sub-category price and is immediately available to
                  billing and clinical workflows.
                </div>
              </div>

              <div className="flex justify-end gap-2 px-5 py-4 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddNurModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Save Nursing Procedure
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            WHO ICD-11 Diagnostic Classification Codes Register
          </h2>
          <p className="text-xs text-gray-500">
            Standardized international diagnostic coding catalog with instant search, chapter classification, and Excel upload.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search ICD-11 code, title, chapter..."
            value={icdSearch}
            onChange={(e) => setIcdSearch(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] w-60 bg-white"
          />
          <button
            onClick={() => setShowAddIcdModal(true)}
            className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add ICD-11 Code</span>
          </button>
        </div>
      </div>

      <div className="border border-gray-200 bg-white rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-3.5 py-3">ICD-11 Code</th>
              <th className="px-3.5 py-3">Official Diagnostic Title</th>
              <th className="px-3.5 py-3">WHO Chapter</th>
              <th className="px-3.5 py-3">Block Grouping</th>
              <th className="px-3.5 py-3 text-center">Category</th>
              <th className="px-3.5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {icd11Codes
              .filter(
                (c) =>
                  c.code.toLowerCase().includes(icdSearch.toLowerCase()) ||
                  c.title.toLowerCase().includes(icdSearch.toLowerCase()) ||
                  c.chapter.toLowerCase().includes(icdSearch.toLowerCase()),
              )
              .map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-3 font-mono font-bold text-blue-700">{c.code}</td>
                  <td className="px-3.5 py-3 font-bold text-gray-900">{c.title}</td>
                  <td className="px-3.5 py-3 text-gray-600">{c.chapter}</td>
                  <td className="px-3.5 py-3 text-gray-500 font-mono text-[11px]">{c.block}</td>
                  <td className="px-3.5 py-3 text-center">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold text-[10px]">{c.category}</span>
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <button
                      onClick={() => onUpdateIcd11Codes(icd11Codes.filter((item) => item.id !== c.id))}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                      title="Delete code"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showAddIcdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Add ICD-11 Diagnostic Code</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newIcdCode || !newIcdTitle) return;
                const newC: SetupIcd11Item = {
                  id: Date.now(),
                  code: newIcdCode.trim().toUpperCase(),
                  title: newIcdTitle.trim(),
                  chapter: newIcdChapter.trim(),
                  block: newIcdBlock.trim() || 'General',
                  category: 'Both',
                  description: newIcdDesc.trim(),
                };
                onUpdateIcd11Codes([...icd11Codes, newC]);
                setShowAddIcdModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-gray-700 mb-1">ICD-11 Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1A00, BA00"
                  value={newIcdCode}
                  onChange={(e) => setNewIcdCode(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Diagnostic Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute appendicitis"
                  value={newIcdTitle}
                  onChange={(e) => setNewIcdTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">WHO Chapter</label>
                <input
                  type="text"
                  value={newIcdChapter}
                  onChange={(e) => setNewIcdChapter(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Block / Group</label>
                <input
                  type="text"
                  placeholder="e.g. DC10 Appendicitis"
                  value={newIcdBlock}
                  onChange={(e) => setNewIcdBlock(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddIcdModal(false)}
                  className="px-4 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
