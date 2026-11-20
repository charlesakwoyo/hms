import React, { useState } from 'react';
import { X, FileText, CheckCircle2, Eye, Sparkles, Sliders } from 'lucide-react';
import { SetupRadiologyTemplate } from '../../types';

interface RadiologyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit: SetupRadiologyTemplate | null;
  onSaveTemplate: (template: SetupRadiologyTemplate) => void;
}

export const RadiologyTemplateModal: React.FC<RadiologyTemplateModalProps> = ({ isOpen, onClose, templateToEdit, onSaveTemplate }) => {
  if (!isOpen) return null;

  const [code, setCode] = useState(templateToEdit?.templateCode || `TPL-${Date.now().toString().slice(-4)}`);
  const [name, setName] = useState(templateToEdit?.templateName || '');
  const [modality, setModality] = useState<SetupRadiologyTemplate['modality']>(templateToEdit?.modality || 'X-Ray');
  const [indication, setIndication] = useState(
    templateToEdit?.indicationBoilerplate || 'Routine diagnostic evaluation without acute contraindications.',
  );
  const [technique, setTechnique] = useState(
    templateToEdit?.techniqueBoilerplate || 'Standard examination obtained in physiological projection.',
  );
  const [findings, setFindings] = useState(
    templateToEdit?.findingsTemplate ||
      `PRIMARY STRUCTURES:
Visualized anatomical regions demonstrate normal morphological architecture and preserved contours.

VASCULAR & PARENCHYMA:
No evidence of acute hemorrhage, focal mass effect, or pathological attenuation.

SKELETAL & SOFT TISSUE:
Visualized osseous structures are intact without fractures or cortical erosion.`,
  );
  const [impression, setImpression] = useState(
    templateToEdit?.impressionTemplate || 'Unremarkable study. No acute radiological abnormality detected.',
  );
  const [normalText, setNormalText] = useState(
    templateToEdit?.normalReportText || 'Normal morphological study with intact physiological architecture.',
  );
  const [isDefault, setIsDefault] = useState(templateToEdit?.isDefault ?? false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const saved: SetupRadiologyTemplate = {
      id: templateToEdit?.id || Date.now(),
      templateCode: code.trim(),
      templateName: name.trim(),
      modality,
      indicationBoilerplate: indication.trim(),
      techniqueBoilerplate: technique.trim(),
      findingsTemplate: findings.trim(),
      impressionTemplate: impression.trim(),
      normalReportText: normalText.trim(),
      isDefault,
    };

    onSaveTemplate(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {templateToEdit ? 'Edit Radiology Report Template' : 'Create New Radiology Report Template'}
              </h3>
              <p className="text-xs text-slate-300">
                Standardize radiology reporting findings, clinical indications, and diagnostic impressions.
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

        <div className="px-6 py-2.5 bg-slate-100 border-b border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                !previewMode ? 'bg-white text-[#0088cc] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Template Editor
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                previewMode ? 'bg-white text-[#0088cc] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Report Preview</span>
            </button>
          </div>
          <span className="text-gray-500 text-[11px]">
            Variables supported: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">{'{{PATIENT_NAME}}'}</code>,{' '}
            <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">{'{{AGE}}'}</code>,{' '}
            <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">{'{{REFERRING_DOC}}'}</code>
          </span>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {previewMode ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 font-mono text-xs text-slate-800 space-y-4 shadow-inner">
              <div className="border-b border-slate-300 pb-3 flex justify-between items-center text-[11px] text-slate-500">
                <div>
                  <span className="font-bold text-slate-900 block text-sm font-sans">{name || 'Radiology Template Title'}</span>
                  <span>
                    Modality: {modality} | Code: {code}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-sans font-bold">VERIFIED NORMAL TEMPLATE</span>
              </div>

              <div>
                <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">CLINICAL INDICATION:</p>
                <p className="bg-white p-2.5 rounded-lg border border-slate-200">{indication}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">TECHNIQUE & PROTOCOL:</p>
                <p className="bg-white p-2.5 rounded-lg border border-slate-200">{technique}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">DETAILED FINDINGS:</p>
                <pre className="bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed">
                  {findings}
                </pre>
              </div>

              <div>
                <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">IMPRESSION / CONCLUSION:</p>
                <p className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 font-bold text-emerald-900">{impression}</p>
              </div>
            </div>
          ) : (
            <form id="radiology-template-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chest X-Ray PA View - Normal Adult Study"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Template Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Imaging Modality *</label>
                  <select
                    value={modality}
                    onChange={(e) => setModality(e.target.value as SetupRadiologyTemplate['modality'])}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] bg-white"
                  >
                    <option value="X-Ray">X-Ray (Plain Radiography)</option>
                    <option value="Ultrasound">Ultrasound (Diagnostic Sonography)</option>
                    <option value="CT Scan">CT Scan (Computed Tomography)</option>
                    <option value="MRI">MRI (Magnetic Resonance Imaging)</option>
                    <option value="Mammography">Mammography</option>
                    <option value="ECG">ECG / Electrocardiogram</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Normal 1-Line Summary Text</label>
                  <input
                    type="text"
                    placeholder="Quick normal summary line for OPD discharge"
                    value={normalText}
                    onChange={(e) => setNormalText(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Default Clinical Indication</label>
                <input
                  type="text"
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Default Technique & Protocol</label>
                <input
                  type="text"
                  value={technique}
                  onChange={(e) => setTechnique(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Structured Findings Template (Boilerplate)</label>
                <textarea
                  rows={6}
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Impression / Conclusion Template</label>
                <textarea
                  rows={2}
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="default-template-check"
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-[#0088cc] focus:ring-[#0088cc]"
                />
                <label htmlFor="default-template-check" className="text-xs text-gray-700 cursor-pointer font-semibold">
                  Set as default reporting template for this modality
                </label>
              </div>
            </form>
          )}
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
            onClick={handleSubmit}
            className="px-5 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{templateToEdit ? 'Save Changes' : 'Create Template'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
