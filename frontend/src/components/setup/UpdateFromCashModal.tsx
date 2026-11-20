import React, { useState } from 'react';
import { Zap, X, Check, Calculator, ArrowRight, Percent } from 'lucide-react';

interface UpdateFromCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryTitle: string;
  subCategoryCode: string;
  subCategoryName: string;
  sampleItems: { name: string; cashPrice: number; currentSubPrice?: number }[];
  onApply: (multiplier: number, roundToTen: boolean) => void;
}

export const UpdateFromCashModal: React.FC<UpdateFromCashModalProps> = ({
  isOpen,
  onClose,
  categoryTitle,
  subCategoryCode,
  subCategoryName,
  sampleItems,
  onApply,
}) => {
  const [selectedFormula, setSelectedFormula] = useState<string>('same');
  const [customPercent, setCustomPercent] = useState<number>(10);
  const [roundToTen, setRoundToTen] = useState<boolean>(true);

  if (!isOpen) return null;

  const getMultiplier = (): number => {
    switch (selectedFormula) {
      case 'same':
        return 1.0;
      case 'plus_10':
        return 1.1;
      case 'plus_15':
        return 1.15;
      case 'plus_20':
        return 1.2;
      case 'plus_25':
        return 1.25;
      case 'plus_30':
        return 1.3;
      case 'minus_10':
        return 0.9;
      case 'minus_15':
        return 0.85;
      case 'custom':
        return 1.0 + customPercent / 100;
      default:
        return 1.0;
    }
  };

  const calculatePrice = (cashPrice: number): number => {
    const raw = cashPrice * getMultiplier();
    if (roundToTen) {
      return Math.round(raw / 10) * 10;
    }
    return Math.round(raw);
  };

  const handleConfirm = () => {
    onApply(getMultiplier(), roundToTen);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Update All Prices from Cash Price</h3>
              <p className="text-xs text-slate-300">
                Bulk calculate {categoryTitle} prices for <span className="text-amber-300 font-semibold">{subCategoryName}</span>
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

        <div className="p-6 space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500 block uppercase text-[10px] font-bold tracking-wider">Target Patient Sub-Category</span>
              <span className="text-sm font-black text-slate-900">{subCategoryName}</span>
              <span className="ml-2 font-mono text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-semibold">
                {subCategoryCode}
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 block uppercase text-[10px] font-bold tracking-wider">Source Baseline</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">Standard Cash Tariff</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Price Calculation Rule:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'same', label: 'Same as Cash (100%)', desc: 'No markup or discount' },
                { id: 'plus_10', label: '+10% Markup', desc: '1.10x of Cash price' },
                { id: 'plus_15', label: '+15% Markup', desc: '1.15x of Cash price' },
                { id: 'plus_20', label: '+20% Markup', desc: '1.20x of Cash price' },
                { id: 'plus_25', label: '+25% Markup', desc: '1.25x of Cash price' },
                { id: 'minus_10', label: '-10% Discount', desc: '0.90x of Cash price' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedFormula(opt.id)}
                  className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                    selectedFormula === opt.id
                      ? 'border-[#0088cc] bg-sky-50 text-[#0088cc] ring-2 ring-sky-300/30'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="formula"
                  checked={selectedFormula === 'custom'}
                  onChange={() => setSelectedFormula('custom')}
                  className="text-[#0088cc] focus:ring-[#0088cc]"
                />
                <span className="font-semibold">Custom Markup / Discount:</span>
              </label>
              {selectedFormula === 'custom' && (
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    value={customPercent}
                    onChange={(e) => setCustomPercent(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc]"
                    step="1"
                  />
                  <span className="text-xs text-gray-500 font-bold">%</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center space-x-2">
              <input
                id="round-to-ten-checkbox"
                type="checkbox"
                checked={roundToTen}
                onChange={(e) => setRoundToTen(e.target.checked)}
                className="rounded border-gray-300 text-[#0088cc] focus:ring-[#0088cc]"
              />
              <label htmlFor="round-to-ten-checkbox" className="text-xs text-gray-600 cursor-pointer">
                Round calculated prices to nearest 10 KSh (e.g. 523 → 520, 528 → 530)
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs text-gray-600">
              <span className="font-bold flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-gray-500" />
                Preview of Updated Prices:
              </span>
              <span className="text-[11px] text-gray-400">Sample of catalog items</span>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 text-gray-700 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-3 py-2 text-left">Item Name</th>
                    <th className="px-3 py-2 text-right">Cash Baseline</th>
                    <th className="px-3 py-2 text-center">Formula</th>
                    <th className="px-3 py-2 text-right text-[#0088cc]">New {subCategoryCode} Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sampleItems.slice(0, 4).map((item, idx) => {
                    const newPrice = calculatePrice(item.cashPrice);
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800">{item.name}</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-600">KSh {item.cashPrice.toLocaleString()}</td>
                        <td className="px-3 py-2 text-center text-gray-400">
                          <ArrowRight className="w-3.5 h-3.5 inline text-gray-400" />
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-[#0088cc]">KSh {newPrice.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
            onClick={handleConfirm}
            className="px-5 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply to All {categoryTitle}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
