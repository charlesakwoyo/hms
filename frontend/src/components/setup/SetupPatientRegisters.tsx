import React, { useEffect, useMemo, useState } from 'react';
import { askConfirm } from '../AppMessage';
import { Plus, Edit2, Trash2, ShieldCheck } from 'lucide-react';
import { SetupPatientCategory, SetupPatientSubCategory } from '../../types';
import { apiClient } from '../../services/apiClient';

interface SetupPatientRegistersProps {
  activeSubTab: 'categories' | 'sub_categories';
  categories: SetupPatientCategory[];
  onUpdateCategories: (cats: SetupPatientCategory[]) => void;
  subCategories: SetupPatientSubCategory[];
  onUpdateSubCategories: (subs: SetupPatientSubCategory[]) => void;
}

type SchemeConfig = {
  id?: number | string;
  subCategoryId?: number | string;
  providerName: string;
  schemeCode: string;
  schemeName: string;
  schemeType: 'Outpatient' | 'Inpatient' | 'Comprehensive';
  copayRule: string;
  copayAmount: number;
  creditLimit: number;
  preAuthRequired: boolean;
  contactPerson: string;
  contactPhone: string;
  status: 'Active' | 'Inactive';
};

type SubCategoryDraft = {
  id?: number | string;
  categoryCode: string;
  categoryName: string;
  subCategoryCode: string;
  name: string;
  isCash: boolean;
  status: 'Active' | 'Inactive';
};

const emptyScheme = (): SchemeConfig => ({
  providerName: '',
  schemeCode: '',
  schemeName: '',
  schemeType: 'Comprehensive',
  copayRule: '0%',
  copayAmount: 0,
  creditLimit: 500000,
  preAuthRequired: true,
  contactPerson: '',
  contactPhone: '',
  status: 'Active',
});

export const SetupPatientRegisters: React.FC<SetupPatientRegistersProps> = ({
  activeSubTab,
  categories,
  onUpdateCategories,
  subCategories,
  onUpdateSubCategories,
}) => {
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | string | null>(null);
  const [catCode, setCatCode] = useState('');
  const [catName, setCatName] = useState('');
  const [isCash, setIsCash] = useState(false);
  const [catDiscount, setCatDiscount] = useState(0);
  const [categorySubDrafts, setCategorySubDrafts] = useState<SubCategoryDraft[]>([]);

  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [selectedParentCode, setSelectedParentCode] = useState(categories[0]?.code || '');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('');
  const [schemes, setSchemes] = useState<SchemeConfig[]>([]);
  const [schemeDraft, setSchemeDraft] = useState<SchemeConfig>(emptyScheme());
  const [editingSchemeId, setEditingSchemeId] = useState<number | string | null>(null);
  const [savingScheme, setSavingScheme] = useState(false);

  const availableSubCategories = useMemo(
    () => subCategories.filter((s) => String(s.categoryCode) === String(selectedParentCode)),
    [subCategories, selectedParentCode],
  );

  const selectedSubCategory = useMemo(
    () => subCategories.find((s) => String(s.id) === String(selectedSubCategoryId)),
    [subCategories, selectedSubCategoryId],
  );

  const selectedSubSchemes = useMemo(
    () => schemes.filter((s) => String(s.subCategoryId) === String(selectedSubCategoryId)),
    [schemes, selectedSubCategoryId],
  );

  useEffect(() => {
    let cancelled = false;
    void apiClient.getSetupEntity('setup-patient-schemes').then((rows) => {
      if (!cancelled) setSchemes((rows || []) as SchemeConfig[]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!categories.length) return;
    if (!categories.some((c) => c.code === selectedParentCode)) setSelectedParentCode(categories[0].code);
  }, [categories, selectedParentCode]);

  useEffect(() => {
    const first = availableSubCategories[0];
    if (!availableSubCategories.some((s) => String(s.id) === String(selectedSubCategoryId))) {
      setSelectedSubCategoryId(first ? String(first.id) : '');
    }
  }, [availableSubCategories, selectedSubCategoryId]);

  const resetCategoryModal = () => {
    setEditingCategoryId(null);
    setCatCode('');
    setCatName('');
    setIsCash(false);
    setCatDiscount(0);
    setCategorySubDrafts([]);
  };

  const openAddCategory = () => {
    resetCategoryModal();
    setShowCatModal(true);
  };

  const openEditCategory = (cat: SetupPatientCategory) => {
    setEditingCategoryId(cat.id);
    setCatCode(cat.code);
    setCatName(cat.name);
    setIsCash(!!cat.isCash);
    setCatDiscount(Number(cat.defaultDiscount || 0));
    setCategorySubDrafts(
      subCategories
        .filter((s) => String(s.categoryCode) === String(cat.code))
        .map((s) => ({
          id: s.id,
          categoryCode: cat.code,
          categoryName: cat.name,
          subCategoryCode: s.subCategoryCode,
          name: s.name,
          isCash: !!cat.isCash,
          status: s.status || 'Active',
        })),
    );
    setShowCatModal(true);
  };

  const addSubDraft = () => {
    if (!catCode.trim() || !catName.trim()) {
      alert('Enter the Patient Category Code and Category Name first.');
      return;
    }
    setCategorySubDrafts((prev) => [
      ...prev,
      {
        categoryCode: catCode.trim().toUpperCase(),
        categoryName: catName.trim(),
        subCategoryCode: '',
        name: '',
        isCash,
        status: 'Active',
      },
    ]);
  };

  const updateSubDraft = (index: number, patch: Partial<SubCategoryDraft>) => {
    setCategorySubDrafts((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeNewSubDraft = (index: number) => {
    const row = categorySubDrafts[index];

    if (row.id !== undefined) return;
    setCategorySubDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catCode.trim() || !catName.trim()) return;

    const code = catCode.trim().toUpperCase();
    const name = catName.trim();
    const categoryId = editingCategoryId ?? Date.now();
    const category: SetupPatientCategory = {
      id: Number(categoryId),
      code,
      name,
      isCash,
      defaultDiscount: catDiscount,
      status: 'Active',
    };

    const categoryResult = await apiClient.persistEntity('setup-patient-categories', category);
    if (!categoryResult.success) {
      alert(categoryResult.error || 'Could not save the Patient Category.');
      return;
    }

    const nextSubs = [...subCategories];
    for (const draft of categorySubDrafts) {
      if (!draft.subCategoryCode.trim() || !draft.name.trim()) {
        alert('Every sub-category row must have a Sub-Category Code and Sub-Category Name.');
        return;
      }
      const row: SetupPatientSubCategory = {
        id: Number(draft.id ?? Date.now() + Math.floor(Math.random() * 100000)),
        categoryCode: code,
        categoryName: name,
        subCategoryCode: draft.subCategoryCode.trim().toUpperCase(),
        name: draft.name.trim(),
        isCash,
        status: draft.status || 'Active',
      };
      const result = await apiClient.persistEntity('setup-patient-subcategories', row);
      if (!result.success) {
        alert(result.error || `Could not save sub-category ${row.name}.`);
        return;
      }
      const idx = nextSubs.findIndex((s) => String(s.id) === String(row.id));
      if (idx >= 0) nextSubs[idx] = row;
      else nextSubs.push(row);
    }

    const nextCats =
      editingCategoryId === null ? [...categories, category] : categories.map((c) => (String(c.id) === String(category.id) ? category : c));
    onUpdateCategories(nextCats);
    onUpdateSubCategories(nextSubs);
    setShowCatModal(false);
    resetCategoryModal();
  };

  const handleDeleteCategory = (id: number) => {
    const hasSubs = subCategories.some((s) => String(s.categoryCode) === String(categories.find((c) => c.id === id)?.code));
    if (hasSubs) {
      alert('This Patient Category has registered sub-categories and is used by other forms. Edit/deactivate it instead of deleting it.');
      return;
    }
    onUpdateCategories(categories.filter((c) => c.id !== id));
  };

  const openSchemeManager = (sub?: SetupPatientSubCategory) => {
    const parentCode = sub?.categoryCode || categories[0]?.code || '';
    setSelectedParentCode(parentCode);
    setSelectedSubCategoryId(sub ? String(sub.id) : '');
    setSchemeDraft(emptyScheme());
    setEditingSchemeId(null);
    setShowSchemeModal(true);
  };

  const startAddScheme = () => {
    setEditingSchemeId(null);
    setSchemeDraft(emptyScheme());
  };

  const startEditScheme = (row: SchemeConfig) => {
    setEditingSchemeId(row.id ?? null);
    setSchemeDraft({ ...row });
  };

  const saveScheme = async () => {
    if (!selectedSubCategory || !schemeDraft.schemeCode.trim() || !schemeDraft.schemeName.trim()) {
      alert('Select a registered Sub-Category and enter the Scheme Code and Scheme / Principal Name.');
      return;
    }
    setSavingScheme(true);
    try {
      const row: SchemeConfig = {
        ...schemeDraft,
        id: editingSchemeId ?? Date.now() + Math.floor(Math.random() * 100000),
        subCategoryId: selectedSubCategory.id,
        status: schemeDraft.status || 'Active',
      };
      const result = await apiClient.persistEntity('setup-patient-schemes', row);
      if (!result.success) {
        alert(result.error || 'Could not save the scheme.');
        return;
      }
      setSchemes((prev) => {
        const idx = prev.findIndex((s) => String(s.id) === String(row.id));
        if (idx >= 0) return prev.map((s, i) => (i === idx ? row : s));
        return [...prev, row];
      });
      setSchemeDraft(emptyScheme());
      setEditingSchemeId(null);
    } finally {
      setSavingScheme(false);
    }
  };

  const deleteScheme = async (row: SchemeConfig) => {
    if (!row.id) return;
    if (
      !(await askConfirm({
        title: `Deactivate ${row.schemeName}?`,
        message: 'New patients can no longer be put on this scheme.',
        confirmLabel: 'Deactivate',
        danger: true,
      }))
    )
      return;
    const updated = { ...row, status: 'Inactive' as const };
    const result = await apiClient.persistEntity('setup-patient-schemes', updated);
    if (!result.success) {
      alert(result.error || 'Could not update the scheme.');
      return;
    }
    setSchemes((prev) => prev.map((s) => (String(s.id) === String(row.id) ? updated : s)));
  };

  if (activeSubTab === 'categories') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900">Patient Category & Sub-Category Register</h2>
            <p className="text-xs text-gray-500">
              Register and update Patient Categories and their Sub-Categories. The sub-category master table is retained for use by all
              hospital forms.
            </p>
          </div>
          <button
            onClick={openAddCategory}
            className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Patient Category</span>
          </button>
        </div>

        <div className="border border-gray-200 bg-white rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Category Code</th>
                <th className="px-4 py-3">Category Name</th>
                <th className="px-4 py-3">Payment Model</th>
                <th className="px-4 py-3">Sub-Categories</th>
                <th className="px-4 py-3 text-center">Default Discount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => {
                const count = subCategories.filter((s) => String(s.categoryCode) === String(cat.code)).length;
                return (
                  <tr key={cat.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{cat.code}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{cat.name}</td>
                    <td className="px-4 py-3">
                      {cat.isCash ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Cash / Out-of-Pocket
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Credit / Insurance / Scheme
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-700">{count}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">{cat.defaultDiscount}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">{cat.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="text-blue-600 hover:text-blue-800 p-1 mr-1 rounded hover:bg-blue-50 cursor-pointer"
                        title="Edit and update category/sub-categories"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                        title="Delete category"
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

        {showCatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">
                  {editingCategoryId === null ? 'Add Patient Category & Sub-Categories' : 'Edit & Update Patient Category & Sub-Categories'}
                </h3>
                <button type="button" onClick={() => setShowCatModal(false)} className="text-gray-500 text-lg">
                  ×
                </button>
              </div>
              <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Category Code *</label>
                    <input
                      required
                      value={catCode}
                      onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border rounded-lg uppercase"
                      placeholder="e.g. SHA, CORP, CASH"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Category Name *</label>
                    <input
                      required
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g. Insurance"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 font-semibold text-gray-700">
                    <input type="checkbox" checked={isCash} onChange={(e) => setIsCash(e.target.checked)} /> Is Cash / Self-Pay category
                  </label>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Default Discount %</label>
                    <input
                      type="number"
                      value={catDiscount}
                      onChange={(e) => setCatDiscount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-indigo-900">Patient Sub-Category Registration</h4>
                      <p className="text-[10px] text-indigo-700">
                        Sub-categories remain in the master table because registration, billing, claims and other modules use them.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addSubDraft}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Sub-Category
                    </button>
                  </div>
                  {categorySubDrafts.length === 0 && (
                    <div className="bg-white border rounded-lg p-3 text-gray-500">
                      No sub-categories registered. Click <b>Add Sub-Category</b> to register one.
                    </div>
                  )}
                  {categorySubDrafts.map((row, index) => (
                    <div
                      key={String(row.id ?? `new-${index}`)}
                      className="bg-white border rounded-lg p-3 grid grid-cols-[1fr_1.6fr_auto] gap-2 items-end"
                    >
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Sub-Category Code *</label>
                        <input
                          required
                          value={row.subCategoryCode}
                          onChange={(e) => updateSubDraft(index, { subCategoryCode: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border rounded-lg font-mono"
                          placeholder="e.g. SHA-COMP"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Sub-Category Name *</label>
                        <input
                          required
                          value={row.name}
                          onChange={(e) => updateSubDraft(index, { name: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="e.g. SHA Comprehensive"
                        />
                      </div>
                      {row.id === undefined ? (
                        <button
                          type="button"
                          onClick={() => removeNewSubDraft(index)}
                          className="px-3 py-2 border border-rose-200 text-rose-600 rounded-lg font-bold"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="px-3 py-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-lg">
                          Existing / Editable
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowCatModal(false)} className="px-4 py-2 border rounded-lg text-gray-700">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-lg">
                    {editingCategoryId === null ? 'Save Category & Sub-Categories' : 'Update Category & Sub-Categories'}
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
          <h2 className="text-base font-bold text-gray-900">Insurance / Corporate Scheme Configuration</h2>
          <p className="text-xs text-gray-500">
            Select an existing Patient Category and Sub-Category, then add, edit and update multiple registered schemes.
          </p>
        </div>
        <button
          onClick={() => openSchemeManager()}
          className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Manage Schemes</span>
        </button>
      </div>

      <div className="border border-gray-200 bg-white rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-3.5 py-3">Sub-Category Code</th>
              <th className="px-3.5 py-3">Sub-Category Name</th>
              <th className="px-3.5 py-3">Parent Category</th>
              <th className="px-3.5 py-3 text-center">Registered Schemes</th>
              <th className="px-3.5 py-3">Schemes</th>
              <th className="px-3.5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subCategories.map((sub) => {
              const rows = schemes.filter((s) => String(s.subCategoryId) === String(sub.id) && s.status !== 'Inactive');
              return (
                <tr key={sub.id} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-800">{sub.subCategoryCode}</td>
                  <td className="px-3.5 py-3 font-semibold text-gray-900">{sub.name}</td>
                  <td className="px-3.5 py-3">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium">{sub.categoryCode}</span>
                  </td>
                  <td className="px-3.5 py-3 text-center font-bold text-indigo-700">{rows.length}</td>
                  <td className="px-3.5 py-3">
                    {rows.length ? (
                      rows.map((s) => (
                        <span
                          key={String(s.id)}
                          className="inline-block mr-1 mb-1 px-2 py-1 bg-indigo-50 text-indigo-800 rounded border border-indigo-100 text-[10px] font-semibold"
                        >
                          {s.providerName ? `${s.providerName} — ` : ''}
                          {s.schemeName}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">No scheme configured</span>
                    )}
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <button
                      onClick={() => openSchemeManager(sub)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit / Update
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showSchemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl border border-gray-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Manage Insurance / Corporate Schemes</h3>
                <p className="text-xs text-gray-500">
                  Choose a registered Patient Category and existing Sub-Category. The master sub-category is not removed or recreated here.
                </p>
              </div>
              <button onClick={() => setShowSchemeModal(false)} className="text-gray-500 text-lg">
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Patient Category *</label>
                <select
                  value={selectedParentCode}
                  onChange={(e) => {
                    setSelectedParentCode(e.target.value);
                    setSelectedSubCategoryId('');
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Registered Sub-Category *</label>
                <select
                  value={selectedSubCategoryId}
                  onChange={(e) => {
                    setSelectedSubCategoryId(e.target.value);
                    setEditingSchemeId(null);
                    setSchemeDraft(emptyScheme());
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">-- Select Sub-Category --</option>
                  {availableSubCategories.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.subCategoryCode} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSubCategory && !selectedSubCategory.isCash && (
              <div className="border border-indigo-200 bg-indigo-50/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    Multiple Scheme Configurations
                  </div>
                  <button
                    type="button"
                    onClick={startAddScheme}
                    disabled={!selectedSubCategoryId}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Scheme
                  </button>
                </div>
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2 text-left">Provider</th>
                        <th className="p-2 text-left">Scheme Code</th>
                        <th className="p-2 text-left">Scheme Name</th>
                        <th className="p-2 text-left">Type</th>
                        <th className="p-2 text-left">Co-Pay</th>
                        <th className="p-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedSubSchemes
                        .filter((s) => s.status !== 'Inactive')
                        .map((s) => (
                          <tr key={String(s.id)}>
                            <td className="p-2">{s.providerName || '—'}</td>
                            <td className="p-2 font-mono font-bold">{s.schemeCode}</td>
                            <td className="p-2 font-semibold">{s.schemeName}</td>
                            <td className="p-2">{s.schemeType}</td>
                            <td className="p-2">{s.copayRule}</td>
                            <td className="p-2 text-right">
                              <button onClick={() => startEditScheme(s)} className="text-blue-700 font-bold mr-2">
                                Edit
                              </button>
                              <button onClick={() => deleteScheme(s)} className="text-rose-600 font-bold">
                                Deactivate
                              </button>
                            </td>
                          </tr>
                        ))}
                      {selectedSubSchemes.filter((s) => s.status !== 'Inactive').length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400">
                            No schemes configured for this Sub-Category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-indigo-200 rounded-xl p-4 space-y-3">
                  <div className="font-bold text-indigo-900">{editingSchemeId ? 'Edit & Update Scheme' : 'New Scheme Configuration'}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Insurance / Corporate Provider</label>
                      <input
                        value={schemeDraft.providerName}
                        onChange={(e) => setSchemeDraft({ ...schemeDraft, providerName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="e.g. SHA, Jubilee, Britam"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Scheme Code *</label>
                      <input
                        required
                        value={schemeDraft.schemeCode}
                        onChange={(e) => setSchemeDraft({ ...schemeDraft, schemeCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Scheme / Principal Name *</label>
                      <input
                        required
                        value={schemeDraft.schemeName}
                        onChange={(e) => setSchemeDraft({ ...schemeDraft, schemeName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Scheme Type</label>
                      <select
                        value={schemeDraft.schemeType}
                        onChange={(e) => setSchemeDraft({ ...schemeDraft, schemeType: e.target.value as SchemeConfig['schemeType'] })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="Comprehensive">Comprehensive (Inpatient + Outpatient)</option>
                        <option value="Outpatient">Outpatient Only</option>
                        <option value="Inpatient">Inpatient Only</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Co-Pay Rule</label>
                      <input
                        value={schemeDraft.copayRule}
                        onChange={(e) => setSchemeDraft({ ...schemeDraft, copayRule: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="0%, 10%, KSh 200"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Credit Limit (KSh)</label>
                      <input
                        type="number"
                        value={schemeDraft.creditLimit}
                        onChange={(e) => setSchemeDraft({ ...schemeDraft, creditLimit: Number(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Contact Person</label>
                      <input
                        value={schemeDraft.contactPerson}
                        onChange={(e) => setSchemeDraft({ ...schemeDraft, contactPerson: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Contact Phone</label>
                      <input
                        value={schemeDraft.contactPhone}
                        onChange={(e) => setSchemeDraft({ ...schemeDraft, contactPhone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-semibold">
                      <input
                        type="checkbox"
                        checked={schemeDraft.preAuthRequired}
                        onChange={(e) => setSchemeDraft({ ...schemeDraft, preAuthRequired: e.target.checked })}
                      />{' '}
                      Requires Pre-Authorization
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSchemeId(null);
                          setSchemeDraft(emptyScheme());
                        }}
                        className="px-4 py-2 border rounded-lg"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        disabled={savingScheme}
                        onClick={saveScheme}
                        className="px-4 py-2 bg-[#0088cc] text-white font-bold rounded-lg"
                      >
                        {savingScheme ? 'Saving…' : editingSchemeId ? 'Update Scheme' : 'Save Scheme'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {selectedSubCategory?.isCash && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                This is a Cash / Self-Pay Sub-Category. Insurance / Corporate Scheme configuration is not required.
              </div>
            )}
            {!selectedSubCategory && (
              <div className="p-4 bg-slate-50 border rounded-xl text-gray-500 text-xs">
                Select a registered Patient Sub-Category to manage its schemes.
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={() => setShowSchemeModal(false)} className="px-4 py-2 border rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
