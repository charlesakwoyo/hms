import React, { useState } from 'react';
import { X, Plus, Trash2, Pencil, Sliders, CheckCircle2, AlertCircle, Sparkles, MessageSquareText } from 'lucide-react';
import { RichTextEditor } from '../RichTextEditor';
import { richTextIsEmpty } from '../../utils/richText';
import { SetupLabTestItem, SetupLabParameter } from '../../types';

interface LabParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  testItem: SetupLabTestItem | null;
  onSaveParameters: (testId: number, updatedParameters: SetupLabParameter[], testComment?: string) => void;
}

export const LabParametersModal: React.FC<LabParametersModalProps> = ({ isOpen, onClose, testItem, onSaveParameters }) => {
  const [parameters, setParameters] = useState<SetupLabParameter[]>([...(testItem?.parameters || [])]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [editingParamId, setEditingParamId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newRangeMale, setNewRangeMale] = useState('');
  const [newRangeFemale, setNewRangeFemale] = useState('');
  const [newRangePediatric, setNewRangePediatric] = useState('');
  const [newCritLow, setNewCritLow] = useState<string>('');
  const [newCritHigh, setNewCritHigh] = useState<string>('');
  const [newQualitative, setNewQualitative] = useState('');
  const [newMandatory, setNewMandatory] = useState(true);
  const [newComment, setNewComment] = useState('');

  const [testComment, setTestComment] = useState(testItem?.clinicalComment || '');

  const [commentFor, setCommentFor] = useState<string | null>(null);

  if (!isOpen || !testItem) return null;

  const handleAddParameter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newParam: SetupLabParameter = {
      id: editingParamId || `p-${Date.now()}`,
      name: newName.trim(),
      unit: newUnit.trim(),
      normalRangeMale: newRangeMale.trim() || 'Normal',
      normalRangeFemale: newRangeFemale.trim() || newRangeMale.trim() || 'Normal',
      normalRangePediatric: newRangePediatric.trim() || undefined,
      criticalLow: newCritLow ? parseFloat(newCritLow) : undefined,
      criticalHigh: newCritHigh ? parseFloat(newCritHigh) : undefined,
      qualitativeOptions: newQualitative.trim()
        ? newQualitative
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      isMandatory: newMandatory,
      clinicalComment: richTextIsEmpty(newComment) ? undefined : newComment,
    };

    setParameters(
      editingParamId ? parameters.map((p) => (p.id === editingParamId ? { ...p, ...newParam } : p)) : [...parameters, newParam],
    );
    setEditingParamId(null);

    setNewName('');
    setNewUnit('');
    setNewRangeMale('');
    setNewRangeFemale('');
    setNewRangePediatric('');
    setNewCritLow('');
    setNewCritHigh('');
    setNewQualitative('');
    setNewComment('');
    setShowAddForm(false);
  };

  const handleEditParameter = (p: SetupLabParameter) => {
    setEditingParamId(p.id);
    setNewName(p.name || '');
    setNewUnit(p.unit || '');
    setNewRangeMale(p.normalRangeMale || '');
    setNewRangeFemale(p.normalRangeFemale || '');
    setNewRangePediatric(p.normalRangePediatric || '');
    setNewCritLow(p.criticalLow !== undefined && p.criticalLow !== null ? String(p.criticalLow) : '');
    setNewCritHigh(p.criticalHigh !== undefined && p.criticalHigh !== null ? String(p.criticalHigh) : '');
    setNewQualitative((p.qualitativeOptions || []).join(', '));
    setNewMandatory(p.isMandatory !== false);
    setNewComment(p.clinicalComment || '');
    setShowAddForm(true);
  };
  const handleDeleteParameter = (paramId: string) => {
    setParameters(parameters.filter((p) => p.id !== paramId));
  };

  const handleSave = () => {
    onSaveParameters(testItem.id, parameters, richTextIsEmpty(testComment) ? '' : testComment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Lab Test Parameters Configuration</h3>
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-800 text-sky-400 rounded-md font-semibold">{testItem.code}</span>
              </div>
              <p className="text-xs text-slate-300">
                {testItem.name} — <span className="text-emerald-400">{parameters.length} parameters configured</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Configure analyte parameters, standard SI units, demographic biological reference ranges, and panic value alert limits.
            </p>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3.5 py-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Parameter</span>
              </button>
            )}
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquareText className="w-4 h-4 text-emerald-600" />
              Clinical Comment for {testItem.name} (printed under Clinical Comment on the lab report)
            </div>
            <RichTextEditor
              value={testComment}
              onChange={setTestComment}
              placeholder="e.g. A positive result indicates… A negative result means…"
              minHeight={110}
            />
            <p className="text-[10px] text-gray-500">
              One comment for the whole test, whatever its parameters. A comment for a single parameter can still be added with 💬 on its
              row.
            </p>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddParameter} className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4.5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  {editingParamId ? 'Edit Analyte Parameter' : 'Define New Analyte Parameter'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingParamId(null);
                  }}
                  className="text-xs text-sky-700 hover:text-sky-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Parameter Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hemoglobin (Hb)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">SI Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. g/dL, x10^9/L, µmol/L"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Reference Range (Male) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 13.0 - 17.5"
                    value={newRangeMale}
                    onChange={(e) => setNewRangeMale(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Reference Range (Female)</label>
                  <input
                    type="text"
                    placeholder="e.g. 12.0 - 15.5"
                    value={newRangeFemale}
                    onChange={(e) => setNewRangeFemale(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Pediatric Range (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 11.0 - 14.0"
                    value={newRangePediatric}
                    onChange={(e) => setNewRangePediatric(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Qualitative Options (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Negative, Trace, 1+, 2+"
                    value={newQualitative}
                    onChange={(e) => setNewQualitative(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rose-700 uppercase mb-1">Critical Panic Low (Alert)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 7.0"
                    value={newCritLow}
                    onChange={(e) => setNewCritLow(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rose-700 uppercase mb-1">Critical Panic High (Alert)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 20.0"
                    value={newCritHigh}
                    onChange={(e) => setNewCritHigh(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-400 bg-white"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMandatory}
                      onChange={(e) => setNewMandatory(e.target.checked)}
                      className="rounded border-gray-300 text-[#0088cc] focus:ring-[#0088cc]"
                    />
                    <span className="font-semibold">Mandatory for Test Completion</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Clinical Comments (printed on the lab report)
                </label>
                <RichTextEditor
                  value={newComment}
                  onChange={setNewComment}
                  placeholder="e.g. Elevated levels indicate liver-cell injury, commonly due to hepatitis, medications, or fatty liver disease."
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  {editingParamId ? 'Save Changes' : 'Confirm & Add Analyte'}
                </button>
              </div>
            </form>
          )}

          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-3 py-2.5 text-left">#</th>
                  <th className="px-3 py-2.5 text-left">Analyte / Parameter</th>
                  <th className="px-3 py-2.5 text-left">SI Unit</th>
                  <th className="px-3 py-2.5 text-left">Male Normal Range</th>
                  <th className="px-3 py-2.5 text-left">Female Normal Range</th>
                  <th className="px-3 py-2.5 text-left">Panic Critical Alerts</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parameters.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-xs">
                      No parameters defined yet. Click "Add New Parameter" above to configure analytes for this test.
                    </td>
                  </tr>
                ) : (
                  parameters.map((param, index) => (
                    <React.Fragment key={param.id}>
                      <tr className="hover:bg-slate-50/60 transition">
                        <td className="px-3 py-2.5 text-gray-400 font-mono">{index + 1}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold text-gray-900 block">{param.name}</span>
                          {param.qualitativeOptions && (
                            <span className="text-[10px] text-gray-500">Options: {param.qualitativeOptions.join(', ')}</span>
                          )}
                          {param.clinicalComment && !richTextIsEmpty(param.clinicalComment) && (
                            <span className="block text-[10px] text-sky-700 mt-0.5">✓ Clinical comment</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-gray-600 font-semibold">{param.unit || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-700">{param.normalRangeMale}</td>
                        <td className="px-3 py-2.5 text-gray-700">{param.normalRangeFemale}</td>
                        <td className="px-3 py-2.5">
                          {param.criticalLow !== undefined || param.criticalHigh !== undefined ? (
                            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-bold">
                              &lt; {param.criticalLow ?? '—'} / &gt; {param.criticalHigh ?? '—'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {param.isMandatory ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">
                              Required
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">Optional</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setCommentFor(commentFor === param.id ? null : param.id)}
                            className="p-1.5 text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                            title="Clinical comment"
                          >
                            <MessageSquareText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditParameter(param)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Edit Analyte"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteParameter(param.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Analyte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                      {commentFor === param.id && (
                        <tr className="bg-sky-50/60">
                          <td colSpan={8} className="px-3 py-3">
                            <div className="text-[11px] font-bold text-gray-700 uppercase mb-1">
                              Clinical Comments for {param.name} (printed on the lab report)
                            </div>
                            <RichTextEditor
                              value={param.clinicalComment || ''}
                              onChange={(html) =>
                                setParameters((prev) =>
                                  prev.map((p) =>
                                    p.id === param.id ? { ...p, clinicalComment: richTextIsEmpty(html) ? undefined : html } : p,
                                  ),
                                )
                              }
                              placeholder="Type the interpretation for this parameter…"
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                type="button"
                                onClick={() => setCommentFor(null)}
                                className="px-3 py-1 text-xs font-bold text-sky-800 border border-sky-300 rounded-lg bg-white hover:bg-sky-50"
                              >
                                Done
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Click "Save Parameters" at the bottom to keep the change.</p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Parameters ({parameters.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
