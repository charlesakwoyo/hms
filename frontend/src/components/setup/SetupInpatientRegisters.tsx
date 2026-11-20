import React, { useState } from 'react';
import { Plus, Trash2, BedDouble, Package, CheckCircle2, Sliders, Activity, Edit2, Save, X } from 'lucide-react';
import { SetupBedItem, SetupInpatientPackage, SetupPatientSubCategory } from '../../types';
import { apiClient } from '../../services/apiClient';

interface SetupInpatientRegistersProps {
  activeSubTab: 'inpatient_beds' | 'inpatient_packages';
  beds: SetupBedItem[];
  onUpdateBeds: (beds: SetupBedItem[]) => void;
  packages: SetupInpatientPackage[];
  onUpdatePackages: (pkgs: SetupInpatientPackage[]) => void;
  subCategories: SetupPatientSubCategory[];

  wards?: { id: string; name: string }[];
}

export const SetupInpatientRegisters: React.FC<SetupInpatientRegistersProps> = ({
  activeSubTab,
  beds,
  onUpdateBeds,
  packages,
  onUpdatePackages,
  subCategories,
  wards = [],
}) => {
  const wardChoices: { id: string; name: string }[] = wards.length
    ? wards
    : [
        'Male Medical Ward',
        'Female Medical Ward',
        'Maternity Ward',
        'Pediatric Ward',
        'Intensive Care Unit (ICU)',
        'Executive Private Wing',
      ].map((n) => ({ id: '', name: n }));

  const safeSubCategories = Array.isArray(subCategories) ? subCategories : [];
  const safeBeds = Array.isArray(beds) ? beds : [];
  const [selectedSubCode, setSelectedSubCode] = useState<string>(safeSubCategories[0]?.subCategoryCode || 'CASH-GEN');
  const safePackages = (Array.isArray(packages) ? packages : []).map((pkg: any) => ({
    ...pkg,
    includedProcedures: Array.isArray(pkg?.includedProcedures)
      ? pkg.includedProcedures
      : typeof pkg?.includedProcedures === 'string'
        ? (() => {
            try {
              const v = JSON.parse(pkg.includedProcedures);
              return Array.isArray(v) ? v : [pkg.includedProcedures];
            } catch {
              return [pkg.includedProcedures];
            }
          })()
        : [],
    subCategoryPrices:
      pkg?.subCategoryPrices && typeof pkg.subCategoryPrices === 'object' && !Array.isArray(pkg.subCategoryPrices)
        ? pkg.subCategoryPrices
        : {},
    cashPrice: Number(pkg?.cashPrice || 0),
    overstayDailyRate: Number(pkg?.overstayDailyRate || 0),
  }));

  const [showBedModal, setShowBedModal] = useState(false);
  const [editingBedId, setEditingBedId] = useState<number | null>(null);
  const [editBed, setEditBed] = useState<SetupBedItem | null>(null);
  const [bedNumber, setBedNumber] = useState('');
  const [wardName, setWardName] = useState(wards[0]?.name || 'Male Medical Ward');
  const [bedType, setBedType] = useState<SetupBedItem['bedType']>('General');
  const [bedCashRate, setBedCashRate] = useState(1500);
  const [nursingCareCharge, setNursingCareCharge] = useState(500);
  const [mealsNutritionCharge, setMealsNutritionCharge] = useState(300);
  const [dailyReviewCharge, setDailyReviewCharge] = useState(300);
  const [oxygenEquipped, setOxygenEquipped] = useState(true);
  const [monitorEquipped, setMonitorEquipped] = useState(false);

  const [showPkgModal, setShowPkgModal] = useState(false);
  const [pkgCode, setPkgCode] = useState('');
  const [pkgName, setPkgName] = useState('');
  const [pkgWard, setPkgWard] = useState('');
  const [pkgDays, setPkgDays] = useState(2);
  const [pkgProcedures, setPkgProcedures] = useState('');
  const [pkgCashPrice, setPkgCashPrice] = useState(30000);
  const [pkgOverstayRate, setPkgOverstayRate] = useState(0);
  const [pkgDesc, setPkgDesc] = useState('');

  const openEditBed = (bed: SetupBedItem) => {
    setEditingBedId(bed.id);
    setEditBed(JSON.parse(JSON.stringify(bed)));
    setShowBedModal(false);
  };

  const updateEditComponent = (
    schemeCode: string,
    key: 'bedCharge' | 'nursingCareCharge' | 'mealsNutritionCharge' | 'dailyReviewCharge',
    value: number,
  ) => {
    setEditBed((prev) => {
      if (!prev) return prev;
      const existing = prev.subCategoryChargeComponents?.[schemeCode] || {
        bedCharge: 0,
        nursingCareCharge: 0,
        mealsNutritionCharge: 0,
        dailyReviewCharge: 0,
      };
      const nextParts = { ...existing, [key]: value };
      const nextComponents = { ...(prev.subCategoryChargeComponents || {}), [schemeCode]: nextParts };
      const nextDailyRates = {
        ...(prev.subCategoryDailyRates || {}),
        [schemeCode]: nextParts.bedCharge + nextParts.nursingCareCharge + nextParts.mealsNutritionCharge + nextParts.dailyReviewCharge,
      };
      return {
        ...prev,
        subCategoryChargeComponents: nextComponents,
        subCategoryDailyRates: nextDailyRates,
        ...(schemeCode === 'CASH-GEN'
          ? {
              cashDailyRate: nextParts.bedCharge,
              bedCharge: nextParts.bedCharge,
              nursingCareCharge: nextParts.nursingCareCharge,
              mealsNutritionCharge: nextParts.mealsNutritionCharge,
              dailyReviewCharge: nextParts.dailyReviewCharge,
            }
          : {}),
      };
    });
  };

  const saveEditedBed = () => {
    if (!editBed || !editBed.bedNumber.trim()) return;
    onUpdateBeds(safeBeds.map((b) => (b.id === editingBedId ? editBed : b)));
    setEditingBedId(null);
    setEditBed(null);
  };

  const currentEditParts = (schemeCode: string) =>
    editBed?.subCategoryChargeComponents?.[schemeCode] || {
      bedCharge: editBed?.subCategoryDailyRates?.[schemeCode] || editBed?.cashDailyRate || 0,
      nursingCareCharge: 0,
      mealsNutritionCharge: 0,
      dailyReviewCharge: 0,
    };

  const handleAddBed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedNumber.trim()) return;

    const initialDailyRates: Record<string, number> = {};
    safeSubCategories.forEach((s) => {
      initialDailyRates[s.subCategoryCode] =
        (s.isCash ? bedCashRate : Math.round(bedCashRate * 1.5)) +
        (s.isCash ? nursingCareCharge : Math.round(nursingCareCharge * 1.5)) +
        (s.isCash ? mealsNutritionCharge : Math.round(mealsNutritionCharge * 1.5)) +
        (s.isCash ? dailyReviewCharge : Math.round(dailyReviewCharge * 1.5));
    });

    const newBed: SetupBedItem = {
      id: Date.now(),
      bedNumber: bedNumber.trim().toUpperCase(),
      wardName,
      wardId: wardChoices.find((w) => w.name === wardName)?.id || undefined,
      bedType,
      cashDailyRate: bedCashRate,
      bedCharge: bedCashRate,
      nursingCareCharge,
      mealsNutritionCharge,
      dailyReviewCharge,
      subCategoryDailyRates: initialDailyRates,
      subCategoryChargeComponents: Object.fromEntries(
        safeSubCategories.map((s) => [
          s.subCategoryCode,
          {
            bedCharge: s.isCash ? bedCashRate : Math.round(bedCashRate * 1.5),
            nursingCareCharge: s.isCash ? nursingCareCharge : Math.round(nursingCareCharge * 1.5),
            mealsNutritionCharge: s.isCash ? mealsNutritionCharge : Math.round(mealsNutritionCharge * 1.5),
            dailyReviewCharge: s.isCash ? dailyReviewCharge : Math.round(dailyReviewCharge * 1.5),
          },
        ]),
      ),
      oxygenEquipped,
      cardiacMonitorEquipped: monitorEquipped,
      status: 'Available',
    };

    onUpdateBeds([...beds, newBed]);
    setShowBedModal(false);
    setBedNumber('');
    setMonitorEquipped(false);
  };

  const persistPackage = async (pkg: SetupInpatientPackage) => {
    const result = await apiClient.persistEntity('setup-inpatient-packages', pkg);
    if (!result.success)
      window.alert(
        `The inpatient package was not saved.\n\n${result.error || 'Try again; if it keeps happening, tell the System Administrator.'}`,
      );
    return result.success;
  };

  const handleUpdatePackagePrice = (pkgId: number, subCode: string, price: number) => {
    const next = (Array.isArray(packages) ? packages : []).map((p) =>
      p.id === pkgId ? { ...p, subCategoryPrices: { ...(p.subCategoryPrices || {}), [subCode]: price } } : p,
    );
    onUpdatePackages(next);
    const changed = next.find((p) => p.id === pkgId);
    if (changed) void persistPackage(changed);
  };

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgCode.trim() || !pkgName.trim()) return;

    const initialPrices: Record<string, number> = {};
    safeSubCategories.forEach((s) => {
      initialPrices[s.subCategoryCode] = s.isCash ? pkgCashPrice : Math.round(pkgCashPrice * 1.2);
    });

    const proceduresList = pkgProcedures
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean);

    const newPkg: SetupInpatientPackage = {
      id: Date.now(),
      packageCode: pkgCode.trim().toUpperCase(),
      packageName: pkgName.trim(),
      wardType: pkgWard,
      includedDays: pkgDays,
      includedProcedures: proceduresList.length > 0 ? proceduresList : ['Ward Stay & Routine Care'],
      cashPrice: pkgCashPrice,
      subCategoryPrices: initialPrices,
      overstayDailyRate: pkgOverstayRate,
      description: pkgDesc.trim() || 'Comprehensive inpatient surgical and nursing bundle',
      status: 'Active',
    };

    onUpdatePackages([...(Array.isArray(packages) ? packages : []), newPkg]);
    void persistPackage(newPkg);
    setShowPkgModal(false);
    setPkgCode('');
    setPkgName('');
    setPkgProcedures('');
    setPkgDesc('');
  };

  const handleUpdateBedCashRate = (bedId: number, rate: number) => {
    onUpdateBeds(
      beds.map((b) =>
        b.id === bedId
          ? {
              ...b,
              cashDailyRate: rate,
              bedCharge: rate,
              subCategoryDailyRates: {
                ...b.subCategoryDailyRates,
                'CASH-GEN': rate + (b.nursingCareCharge ?? 0) + (b.mealsNutritionCharge ?? 0) + (b.dailyReviewCharge ?? 0),
              },
            }
          : b,
      ),
    );
  };

  const handleUpdateBedSubRate = (bedId: number, subCode: string, rate: number) => {
    onUpdateBeds(
      beds.map((b) =>
        b.id === bedId
          ? {
              ...b,
              subCategoryDailyRates: { ...b.subCategoryDailyRates, [subCode]: rate },
            }
          : b,
      ),
    );
  };

  if (activeSubTab === 'inpatient_beds') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900">Inpatient Bed Register & Accommodation Tariffs</h2>
            <p className="text-xs text-gray-500">
              Configure ward beds, oxygen outlets, cardiac monitors, and daily accommodation rates for each patient category.
            </p>
          </div>
          <button
            onClick={() => setShowBedModal(true)}
            className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Inpatient Bed</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <span className="font-bold text-slate-700 shrink-0">View Scheme Tariff:</span>
          <select
            value={selectedSubCode}
            onChange={(e) => setSelectedSubCode(e.target.value)}
            className="w-full sm:w-auto max-w-full min-w-0 px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold text-[#0088cc]"
          >
            {safeSubCategories.map((s) => (
              <option key={s.id} value={s.subCategoryCode}>
                {s.subCategoryCode} ({s.name})
              </option>
            ))}
          </select>
          <span className="text-gray-500 text-[11px]">Daily accommodation rate billed per 24-hour cycle</span>
        </div>

        <div className="border border-gray-200 bg-white rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-3.5 py-3">Bed No</th>
                <th className="px-3.5 py-3">Ward Name</th>
                <th className="px-3.5 py-3">Bed Classification</th>
                <th className="px-3.5 py-3 text-center">Equipment</th>
                <th className="px-3.5 py-3 text-right">Bed Charge</th>
                <th className="px-3.5 py-3 text-right">Nursing Care</th>
                <th className="px-3.5 py-3 text-right">Meals & Nutrition</th>
                <th className="px-3.5 py-3 text-right">Daily Review</th>
                <th className="px-3.5 py-3 text-right font-extrabold">Cash Daily Total</th>
                <th className="px-3.5 py-3 text-right text-indigo-700 bg-indigo-50/50">{selectedSubCode} Daily Total</th>
                <th className="px-3.5 py-3 text-center">Occupancy Status</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {beds.map((bed) => {
                const subRate = bed.subCategoryDailyRates?.[selectedSubCode] ?? bed.cashDailyRate;
                return (
                  <tr key={bed.id} className="hover:bg-slate-50/50">
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-800">{bed.bedNumber}</td>
                    <td className="px-3.5 py-3 font-semibold text-gray-900">{bed.wardName}</td>
                    <td className="px-3.5 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">{bed.bedType}</span>
                    </td>
                    <td className="px-3.5 py-3 text-center space-x-1.5">
                      {bed.oxygenEquipped && (
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px] font-bold">
                          O₂ Outlet
                        </span>
                      )}
                      {bed.cardiacMonitorEquipped && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">
                          Cardiac Monitor
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono">KSh {(bed.bedCharge ?? bed.cashDailyRate).toLocaleString()}</td>
                    <td className="px-3.5 py-3 text-right font-mono">KSh {(bed.nursingCareCharge ?? 0).toLocaleString()}</td>
                    <td className="px-3.5 py-3 text-right font-mono">KSh {(bed.mealsNutritionCharge ?? 0).toLocaleString()}</td>
                    <td className="px-3.5 py-3 text-right font-mono">KSh {(bed.dailyReviewCharge ?? 0).toLocaleString()}</td>
                    <td className="px-3.5 py-3 text-right font-mono font-extrabold">
                      KSh{' '}
                      {(
                        (bed.bedCharge ?? bed.cashDailyRate) +
                        (bed.nursingCareCharge ?? 0) +
                        (bed.mealsNutritionCharge ?? 0) +
                        (bed.dailyReviewCharge ?? 0)
                      ).toLocaleString()}
                    </td>
                    <td className="px-3.5 py-3 text-right bg-indigo-50/30 font-mono font-extrabold text-indigo-900">
                      KSh {subRate.toLocaleString()}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          bed.status === 'Available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : bed.status === 'Occupied'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {bed.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <button
                        onClick={() => openEditBed(bed)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 cursor-pointer"
                        title="Edit bed prices and tariff schemes"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onUpdateBeds(beds.filter((b) => b.id !== bed.id))}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                        title="Delete bed"
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

        {editBed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-6 max-w-5xl w-full shadow-2xl border border-gray-200 space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Edit Inpatient Bed & Tariffs</h3>
                  <p className="text-[11px] text-gray-500">
                    Changes are saved to System Setup and are used for new admissions to this bed.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditBed(null);
                    setEditingBedId(null);
                  }}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <label className="font-bold">
                  Bed Number
                  <input
                    className="w-full border rounded p-2 mt-1"
                    value={editBed.bedNumber}
                    onChange={(e) => setEditBed({ ...editBed, bedNumber: e.target.value.toUpperCase() })}
                  />
                </label>
                <label className="font-bold">
                  Ward
                  <select
                    className="w-full border rounded p-2 mt-1 bg-white"
                    value={wardChoices.find((w) => (editBed as any).wardId && w.id === (editBed as any).wardId)?.name || editBed.wardName}
                    onChange={(e) => {
                      const w = wardChoices.find((x) => x.name === e.target.value);
                      setEditBed({ ...editBed, wardName: e.target.value, wardId: w?.id || undefined } as any);
                    }}
                  >
                    {!wardChoices.some(
                      (w) => w.name === editBed.wardName || ((editBed as any).wardId && w.id === (editBed as any).wardId),
                    ) && <option value={editBed.wardName}>{editBed.wardName || '— choose the ward —'} (not a ward in Ward Setup)</option>}
                    {wardChoices.map((w) => (
                      <option key={w.id || w.name} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="font-bold">
                  Bed Type
                  <select
                    className="w-full border rounded p-2 mt-1"
                    value={editBed.bedType}
                    onChange={(e) => setEditBed({ ...editBed, bedType: e.target.value as any })}
                  >
                    {['General', 'Semi-Private', 'Private', 'ICU', 'HDU', 'Pediatric Cot', 'Neonatal Incubator', 'Isolation'].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="font-bold">
                  Cash Bed Charge
                  <input
                    type="number"
                    className="w-full border rounded p-2 mt-1"
                    value={editBed.cashDailyRate}
                    onChange={(e) =>
                      setEditBed({ ...editBed, cashDailyRate: Number(e.target.value) || 0, bedCharge: Number(e.target.value) || 0 })
                    }
                  />
                </label>
              </div>
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-3 text-xs font-bold">Tariff Scheme Prices — edit each component independently</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-white border-b">
                      <tr>
                        <th className="p-2 text-left">Scheme</th>
                        <th className="p-2">Bed</th>
                        <th className="p-2">Nursing</th>
                        <th className="p-2">Meals & Nutrition</th>
                        <th className="p-2">Daily Review</th>
                        <th className="p-2">Daily Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subCategories.map((sc) => {
                        const c = currentEditParts(sc.subCategoryCode);
                        const total =
                          Number(c.bedCharge) + Number(c.nursingCareCharge) + Number(c.mealsNutritionCharge) + Number(c.dailyReviewCharge);
                        return (
                          <tr key={sc.id} className="border-b last:border-0">
                            <td className="p-2 font-bold text-indigo-700">
                              {sc.subCategoryCode}
                              <div className="font-normal text-[10px] text-gray-500">{sc.name}</div>
                            </td>
                            {(['bedCharge', 'nursingCareCharge', 'mealsNutritionCharge', 'dailyReviewCharge'] as const).map((k) => (
                              <td key={k} className="p-2">
                                <input
                                  type="number"
                                  className="w-full border rounded p-2 text-right"
                                  value={c[k]}
                                  onChange={(e) => updateEditComponent(sc.subCategoryCode, k, Number(e.target.value) || 0)}
                                />
                              </td>
                            ))}
                            <td className="p-2 text-right font-black">KSh {total.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditBed(null);
                    setEditingBedId(null);
                  }}
                  className="px-4 py-2 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedBed}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Bed Tariffs
                </button>
              </div>
            </div>
          </div>
        )}

        {showBedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Add New Inpatient Bed</h3>
              <form onSubmit={handleAddBed} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Bed Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MMW-B03"
                      value={bedNumber}
                      onChange={(e) => setBedNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Bed Type</label>
                    <select
                      value={bedType}
                      onChange={(e) => setBedType(e.target.value as any)}
                      className="w-full px-3 py-1.5 border rounded-lg bg-white"
                    >
                      <option value="General">General Ward</option>
                      <option value="Semi-Private">Semi-Private</option>
                      <option value="Private">Executive Private</option>
                      <option value="ICU">Intensive Care Unit (ICU)</option>
                      <option value="HDU">High Dependency Unit (HDU)</option>
                      <option value="Pediatric Cot">Pediatric Cot</option>
                      <option value="Neonatal Incubator">Neonatal Incubator</option>
                      <option value="Isolation">Isolation Cubicle</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Assigned Ward *</label>
                  <select
                    value={wardName}
                    onChange={(e) => setWardName(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white"
                  >
                    {wardChoices.map((w) => (
                      <option key={w.id || w.name} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Bed Charge (KSh) *</label>
                    <input
                      type="number"
                      required
                      value={bedCashRate}
                      onChange={(e) => setBedCashRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nursing Care / Day</label>
                    <input
                      type="number"
                      value={nursingCareCharge}
                      onChange={(e) => setNursingCareCharge(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Meals & Nutrition / Day</label>
                    <input
                      type="number"
                      value={mealsNutritionCharge}
                      onChange={(e) => setMealsNutritionCharge(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Daily Review / Day</label>
                    <input
                      type="number"
                      value={dailyReviewCharge}
                      onChange={(e) => setDailyReviewCharge(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border rounded-lg font-mono"
                    />
                  </div>
                </div>
                <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                  Cash daily total: KSh {(bedCashRate + nursingCareCharge + mealsNutritionCharge + dailyReviewCharge).toLocaleString()}
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center space-x-2 text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={oxygenEquipped}
                      onChange={(e) => setOxygenEquipped(e.target.checked)}
                      className="rounded text-[#0088cc]"
                    />
                    <span className="font-semibold">Equipped with Wall Medical Oxygen Port</span>
                  </label>
                  <label className="flex items-center space-x-2 text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={monitorEquipped}
                      onChange={(e) => setMonitorEquipped(e.target.checked)}
                      className="rounded text-[#0088cc]"
                    />
                    <span className="font-semibold">Equipped with Dedicated Multi-Para Cardiac Monitor</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBedModal(false)}
                    className="px-4 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-lg cursor-pointer"
                  >
                    Save Bed
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
          <h2 className="text-base font-bold text-gray-900">Inpatient Clinical Packages Register</h2>
          <p className="text-xs text-gray-500">
            Configure surgical bundles, maternity delivery packages, HDU bundles, and overstay tariffs for each scheme.
          </p>
        </div>
        <button
          onClick={() => setShowPkgModal(true)}
          className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Clinical Package</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <span className="font-bold text-slate-700 shrink-0">View Scheme Package Price:</span>
        <select
          value={selectedSubCode}
          onChange={(e) => setSelectedSubCode(e.target.value)}
          className="w-full sm:w-auto max-w-full min-w-0 px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold text-[#0088cc]"
        >
          {safeSubCategories.map((s) => (
            <option key={s.id} value={s.subCategoryCode}>
              {s.subCategoryCode} ({s.name})
            </option>
          ))}
        </select>
        <span className="text-gray-500 text-[11px]">Includes all bed days, theatre, surgeon, and initial labs</span>
      </div>

      <div className="border border-gray-200 bg-white rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-3.5 py-3">Package Code</th>
              <th className="px-3.5 py-3">Package Name & Scope</th>
              <th className="px-3.5 py-3">Ward Category</th>
              <th className="px-3.5 py-3 text-center">Included Days</th>
              <th className="px-3.5 py-3 text-right">Cash Price (KSh)</th>
              <th className="px-3.5 py-3 text-right text-indigo-700 bg-indigo-50/50">{selectedSubCode} Price (KSh)</th>
              <th className="px-3.5 py-3 text-right">Overstay Rate (KSh/day)</th>
              <th className="px-3.5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {safePackages.map((pkg) => {
              const subPrice = pkg.subCategoryPrices?.[selectedSubCode] ?? pkg.cashPrice;
              return (
                <tr key={pkg.id} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-800">{pkg.packageCode}</td>
                  <td className="px-3.5 py-3 max-w-sm">
                    <span className="font-bold text-gray-900 block">{pkg.packageName}</span>
                    <p className="text-[11px] text-gray-500 mt-0.5">{pkg.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {pkg.includedProcedures.map((proc: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9.5px]">
                          {proc}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-gray-600 font-medium">{pkg.wardType}</td>
                  <td className="px-3.5 py-3 text-center font-bold text-gray-800">{pkg.includedDays} Days</td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-gray-900">KSh {pkg.cashPrice.toLocaleString()}</td>
                  <td className="px-3.5 py-3 text-right bg-indigo-50/30">
                    <input
                      type="number"
                      min="0"
                      value={subPrice}
                      onChange={(e) => handleUpdatePackagePrice(pkg.id, selectedSubCode, Number(e.target.value) || 0)}
                      className="w-28 px-2 py-1 text-right border border-indigo-200 rounded font-mono font-bold text-indigo-900"
                      aria-label={`${pkg.packageName} ${selectedSubCode} price`}
                    />
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono text-gray-600">KSh {pkg.overstayDailyRate.toLocaleString()}</td>
                  <td className="px-3.5 py-3 text-right">
                    <button
                      onClick={() => onUpdatePackages(packages.filter((p) => p.id !== pkg.id))}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                      title="Delete package"
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

      {showPkgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-900">Add New Inpatient Clinical Package</h3>
            <form onSubmit={handleAddPackage} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Package Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PKG-MAT-NVD"
                    value={pkgCode}
                    onChange={(e) => setPkgCode(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Included Ward Days *</label>
                  <input
                    type="number"
                    required
                    value={pkgDays}
                    onChange={(e) => setPkgDays(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Normal Vaginal Delivery (NVD) Bundle"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ward Category</label>
                  <input
                    type="text"
                    value={pkgWard}
                    onChange={(e) => setPkgWard(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Base Cash Price (KSh) *</label>
                  <input
                    type="number"
                    required
                    value={pkgCashPrice}
                    onChange={(e) => setPkgCashPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Overstay Daily Surcharge (KSh/day)</label>
                <input
                  type="number"
                  value={pkgOverstayRate}
                  onChange={(e) => setPkgOverstayRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Included Procedures / Services (Separate by semicolon ;)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Operating Theatre; Surgeon Fee; 3 Days Ward Stay; Routine Post-op Meds"
                  value={pkgProcedures}
                  onChange={(e) => setPkgProcedures(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Clinical Scope & Description</label>
                <textarea
                  rows={2}
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPkgModal(false)}
                  className="px-4 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
