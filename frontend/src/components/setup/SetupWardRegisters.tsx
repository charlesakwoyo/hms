import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, Building2 } from 'lucide-react';
import { Ward, SetupPatientSubCategory } from '../../types';

interface Props {
  wards: Ward[];
  onUpdateWards: (wards: Ward[]) => void;
  subCategories: SetupPatientSubCategory[];
}
const blank = {
  id: '',
  name: '',
  category: 'Male Medical' as Ward['category'],
  totalBeds: 0,
  occupiedBeds: 0,
  dailyRate: 0,
  nurseInCharge: '',
  floor: '',
  subCategoryChargeComponents: {},
};

export const SetupWardRegisters: React.FC<Props> = ({ wards, onUpdateWards, subCategories }) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>(blank);
  const [show, setShow] = useState(false);
  const [scheme, setScheme] = useState(subCategories[0]?.subCategoryCode || 'CASH-GEN');
  const begin = (w?: Ward) => {
    setForm(w ? JSON.parse(JSON.stringify(w)) : { ...blank, id: `WARD-${Date.now()}` });
    setEditing(w?.id || null);
    setShow(true);
  };
  const save = () => {
    if (!form.name.trim()) return;
    const next = {
      ...form,
      dailyRate: Number(form.dailyRate) || 0,
      totalBeds: Number(form.totalBeds) || 0,
      occupiedBeds: Number(form.occupiedBeds) || 0,
    };
    onUpdateWards(editing ? wards.map((w) => (w.id === editing ? next : w)) : [...wards, next]);
    setShow(false);
    setEditing(null);
  };
  const updateScheme = (code: string, key: string, val: number) => {
    setForm((f: any) => ({
      ...f,
      subCategoryChargeComponents: {
        ...(f.subCategoryChargeComponents || {}),
        [code]: {
          bedCharge: 0,
          nursingCareCharge: 0,
          mealsNutritionCharge: 0,
          dailyReviewCharge: 0,
          ...((f.subCategoryChargeComponents || {})[code] || {}),
          [key]: val,
        },
      },
    }));
  };
  const current = (form.subCategoryChargeComponents || {})[scheme] || {
    bedCharge: form.dailyRate || 0,
    nursingCareCharge: 0,
    mealsNutritionCharge: 0,
    dailyReviewCharge: 0,
  };
  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">Ward Setup & Tariff Schemes</h2>
          <p className="text-xs text-gray-500">
            Maintain wards and edit bed, nursing, meals & nutrition, and daily review prices independently for every tariff scheme.
          </p>
        </div>
        <button onClick={() => begin()} className="px-4 py-2 bg-[#0088cc] text-white rounded-lg text-xs font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Ward
        </button>
      </div>
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Ward</th>
              <th>Category</th>
              <th>Beds</th>
              <th>Occupied</th>
              <th>Cash Daily Rate</th>
              <th>Selected Scheme Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {wards.map((w) => {
              const c = w.subCategoryChargeComponents?.[scheme] || {
                bedCharge: w.dailyRate,
                nursingCareCharge: 0,
                mealsNutritionCharge: 0,
                dailyReviewCharge: 0,
              };
              const total = c.bedCharge + c.nursingCareCharge + c.mealsNutritionCharge + c.dailyReviewCharge;
              return (
                <tr key={w.id} className="border-t">
                  <td className="p-3 font-bold">{w.name}</td>
                  <td>{w.category}</td>
                  <td>{w.totalBeds}</td>
                  <td>{w.occupiedBeds}</td>
                  <td>KSh {Number(w.dailyRate || 0).toLocaleString()}</td>
                  <td className="font-bold">KSh {total.toLocaleString()}</td>
                  <td>
                    <button onClick={() => begin(w)} className="text-blue-600 p-1">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onUpdateWards(wards.filter((x) => x.id !== w.id))} className="text-rose-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {show && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold mb-4">{editing ? 'Edit Ward' : 'Add Ward'}</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label>
                Ward Name
                <input
                  className="w-full border rounded p-2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Category
                <select
                  className="w-full border rounded p-2"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {['Male Medical', 'Female Medical', 'Pediatric', 'Maternity', 'Surgical', 'ICU / HDU', 'Private Amenity'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Total Beds
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={form.totalBeds}
                  onChange={(e) => setForm({ ...form, totalBeds: e.target.value })}
                />
              </label>
              <label>
                Occupied Beds
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={form.occupiedBeds}
                  onChange={(e) => setForm({ ...form, occupiedBeds: e.target.value })}
                />
              </label>
              <label>
                Cash Daily Rate
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={form.dailyRate}
                  onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                />
              </label>
              <label>
                Nurse In Charge
                <input
                  className="w-full border rounded p-2"
                  value={form.nurseInCharge}
                  onChange={(e) => setForm({ ...form, nurseInCharge: e.target.value })}
                />
              </label>
              <label>
                Floor
                <input
                  className="w-full border rounded p-2"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-5 border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold">Tariff Scheme Charges</div>
                <select className="border rounded p-2 text-xs" value={scheme} onChange={(e) => setScheme(e.target.value)}>
                  {subCategories.map((s) => (
                    <option key={s.subCategoryCode}>{s.subCategoryCode}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                {[
                  ['bedCharge', 'Bed Charge'],
                  ['nursingCareCharge', 'Nursing Care'],
                  ['mealsNutritionCharge', 'Meals & Nutrition'],
                  ['dailyReviewCharge', 'Daily Review'],
                ].map(([k, l]) => (
                  <label key={k}>
                    {l}
                    <input
                      type="number"
                      className="w-full border rounded p-2 font-mono"
                      value={current[k]}
                      onChange={(e) => updateScheme(scheme, k, Number(e.target.value) || 0)}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 text-right font-black">
                Daily Total: KSh{' '}
                {(
                  Number(current.bedCharge) +
                  Number(current.nursingCareCharge) +
                  Number(current.mealsNutritionCharge) +
                  Number(current.dailyReviewCharge)
                ).toLocaleString()}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShow(false)} className="px-4 py-2 border rounded-lg text-xs">
                Cancel
              </button>
              <button onClick={save} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex gap-2">
                <Save className="w-4 h-4" />
                Save Ward
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
