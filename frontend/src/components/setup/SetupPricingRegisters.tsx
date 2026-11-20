import React, { useEffect, useState } from 'react';
import {
  Zap,
  FlaskConical,
  Radiation,
  Syringe,
  Pill,
  Search,
  CheckCircle2,
  Sliders,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  SetupLabTestItem,
  SetupRadiologyTestItem,
  SetupNursingProcedureItem,
  SetupPharmacyItem,
  SetupPatientSubCategory,
} from '../../types';
import { UpdateFromCashModal } from './UpdateFromCashModal';

interface SetupPricingRegistersProps {
  subCategories: SetupPatientSubCategory[];
  labTests: SetupLabTestItem[];
  onUpdateLabTests: (tests: SetupLabTestItem[]) => void;
  radiologyTests: SetupRadiologyTestItem[];
  onUpdateRadiologyTests: (tests: SetupRadiologyTestItem[]) => void;
  nursingProcedures: SetupNursingProcedureItem[];
  onUpdateNursingProcedures: (procs: SetupNursingProcedureItem[]) => void;
  pharmacyItems: SetupPharmacyItem[];
  onUpdatePharmacyItems: (items: SetupPharmacyItem[]) => void;
}

export const SetupPricingRegisters: React.FC<SetupPricingRegistersProps> = ({
  subCategories,
  labTests,
  onUpdateLabTests,
  radiologyTests,
  onUpdateRadiologyTests,
  nursingProcedures,
  onUpdateNursingProcedures,
  pharmacyItems,
  onUpdatePharmacyItems,
}) => {
  const [selectedCategoryType, setSelectedCategoryType] = useState<'lab' | 'radiology' | 'nursing' | 'pharmacy'>('lab');
  const [selectedSubCode, setSelectedSubCode] = useState<string>(subCategories[0]?.subCategoryCode || 'SHA-COMP');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => {
    setPage(1);
  }, [selectedCategoryType, selectedSubCode, searchQuery, pageSize]);

  const selectedSub = subCategories.find((s) => s.subCategoryCode === selectedSubCode) || subCategories[0];

  const showToast = (msg: string, error = false) => {
    setToastError(error);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApplyCashCalculation = (multiplier: number, roundToTen: boolean) => {
    const calc = (cash: number) => {
      const raw = cash * multiplier;
      return roundToTen ? Math.round(raw / 10) * 10 : Math.round(raw);
    };

    if (selectedCategoryType === 'lab') {
      const updated = labTests.map((t) => ({
        ...t,
        subCategoryPrices: {
          ...t.subCategoryPrices,
          [selectedSubCode]: calc(t.cashPrice),
        },
      }));
      onUpdateLabTests(updated);
      showToast(`Successfully updated all ${labTests.length} Lab Test prices for ${selectedSub?.name}!`);
    } else if (selectedCategoryType === 'radiology') {
      const updated = radiologyTests.map((r) => ({
        ...r,
        subCategoryPrices: {
          ...r.subCategoryPrices,
          [selectedSubCode]: calc(r.cashPrice),
        },
      }));
      onUpdateRadiologyTests(updated);
      showToast(`Successfully updated all ${radiologyTests.length} Radiology Study prices for ${selectedSub?.name}!`);
    } else if (selectedCategoryType === 'nursing') {
      const updated = nursingProcedures.map((n) => ({
        ...n,
        subCategoryPrices: {
          ...n.subCategoryPrices,
          [selectedSubCode]: calc(n.cashPrice),
        },
      }));
      onUpdateNursingProcedures(updated);
      showToast(`Successfully updated all ${nursingProcedures.length} Nursing Procedure prices for ${selectedSub?.name}!`);
    } else if (selectedCategoryType === 'pharmacy') {
      const updated = pharmacyItems.map((p) => ({
        ...p,
        subCategoryPrices: {
          ...p.subCategoryPrices,
          [selectedSubCode]: calc(p.cashPrice),
        },
      }));
      onUpdatePharmacyItems(updated);
      showToast(`Successfully updated all ${pharmacyItems.length} Pharmacy Item prices for ${selectedSub?.name}!`);
    }
  };

  const handleUpdateSinglePrice = (itemId: number, newPrice: number) => {
    if (selectedCategoryType === 'lab') {
      onUpdateLabTests(
        labTests.map((t) => (t.id === itemId ? { ...t, subCategoryPrices: { ...t.subCategoryPrices, [selectedSubCode]: newPrice } } : t)),
      );
    } else if (selectedCategoryType === 'radiology') {
      onUpdateRadiologyTests(
        radiologyTests.map((r) =>
          r.id === itemId ? { ...r, subCategoryPrices: { ...r.subCategoryPrices, [selectedSubCode]: newPrice } } : r,
        ),
      );
    } else if (selectedCategoryType === 'nursing') {
      onUpdateNursingProcedures(
        nursingProcedures.map((n) =>
          n.id === itemId ? { ...n, subCategoryPrices: { ...n.subCategoryPrices, [selectedSubCode]: newPrice } } : n,
        ),
      );
    } else if (selectedCategoryType === 'pharmacy') {
      onUpdatePharmacyItems(
        pharmacyItems.map((p) =>
          p.id === itemId ? { ...p, subCategoryPrices: { ...p.subCategoryPrices, [selectedSubCode]: newPrice } } : p,
        ),
      );
    }
  };

  const itemName = (item: any) => String(item.name ?? item.brandName ?? item.genericName ?? item.code ?? '');
  const itemClass = (item: any) =>
    String(item.department || item.modality || item.dosageForm || item.formulation || item.category || 'General');
  const cashFollowsInventory = selectedCategoryType === 'pharmacy';

  const plainText = (v: unknown) =>
    String(v ?? '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\n{2,}/g, '\n')
      .trim();
  const detailRows = (item: any): [string, string | number][] => {
    const yes = (b: unknown) => (b ? 'Yes' : 'No');
    if (selectedCategoryType === 'lab')
      return [
        ['Item Code', item.code],
        ['Test Name', item.name],
        ['Department', item.department],
        ['Specimen Type', item.specimenType],
        ['Turnaround Time (minutes)', Number(item.turnaroundMinutes || 0)],
        ['Number of Parameters', (item.parameters || []).length],
        ['Clinical Comment', plainText(item.clinicalComment)],
        ['Status', item.status || 'Active'],
      ];
    if (selectedCategoryType === 'radiology')
      return [
        ['Item Code', item.code],
        ['Study Name', item.name],
        ['Category', item.category],
        ['Modality', item.modality],
        ['Requires Contrast', yes(item.requiresContrast)],
        ['Preparation Instructions', plainText(item.preparationInstructions)],
        ['Status', item.status || 'Active'],
      ];
    if (selectedCategoryType === 'nursing')
      return [
        ['Item Code', item.code],
        ['Procedure Name', item.name],
        ['Department', item.department],
        ['Consumables', item.consumables],
        ['Status', item.status || 'Active'],
      ];
    return [
      ['Item Code', item.code],
      ['Brand Name', item.brandName],
      ['Generic Name', item.genericName],
      ['Formulation', item.formulation],
      ['Strength', item.strength],
      ['Category', item.category],
      ['Status', item.status || 'Active'],
    ];
  };
  const downloadItem = (item: any) => {
    const aoa: (string | number)[][] = [
      [`${categoryLabels[selectedCategoryType]} — Item Details`, '', ''],
      ['Field', 'Value', 'Notes'],
      ...detailRows(item).map(([f, v]) => [f, v ?? '', '']),
      ['', '', ''],
      ['PRICES', '', 'Change the prices below and upload this file to replace them'],
      [
        'Cash Price (KSh)',
        Number(item.cashPrice || 0),
        cashFollowsInventory ? 'Follows the Inventory selling price (not changed by upload)' : 'Standard cash baseline',
      ],
      ...subCategories.map((s) => [
        `${s.subCategoryCode} Price (KSh)`,
        Number(item.subCategoryPrices?.[s.subCategoryCode] ?? item.cashPrice ?? 0),
        s.name || '',
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 50 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Item Details');
    if (selectedCategoryType === 'lab' && (item.parameters || []).length) {
      const ps = XLSX.utils.json_to_sheet(
        (item.parameters || []).map((p: any) => ({
          Parameter: p.name,
          Unit: p.unit || '',
          'Normal Range (Male)': p.normalRangeMale || '',
          'Normal Range (Female)': p.normalRangeFemale || '',
          'Normal Range (Paediatric)': p.normalRangePediatric || '',
          'Critical Low': p.criticalLow ?? '',
          'Critical High': p.criticalHigh ?? '',
          'Result Options': (p.qualitativeOptions || []).join(', '),
          Mandatory: p.isMandatory ? 'Yes' : 'No',
        })),
      );
      ps['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ps, 'Parameters');
    }
    XLSX.writeFile(
      wb,
      `${String(item.code || item.id).replace(/[^\w.-]+/g, '_')}_${itemName(item)
        .replace(/[^\w.-]+/g, '_')
        .slice(0, 40)}_details.xlsx`,
    );
  };
  const uploadFor = React.useRef<any>(null);
  const uploadInput = React.useRef<HTMLInputElement>(null);
  const startUpload = (item: any) => {
    uploadFor.current = item;
    if (uploadInput.current) {
      uploadInput.current.value = '';
      uploadInput.current.click();
    }
  };
  const onUploadFile = async (file?: File | null) => {
    const item = uploadFor.current;
    uploadFor.current = null;
    if (!file || !item) return;
    try {
      const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
      const grid: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
      const cell = (v: unknown) => String(v ?? '').trim();
      const headerAt = grid.findIndex((r) => r.map(cell).includes('Item Code') && r.some((c) => /price|name/i.test(cell(c))));
      const rows: Record<string, any>[] =
        headerAt >= 0
          ? grid
              .slice(headerAt + 1)
              .filter((r) => r.some(cell))
              .map((r) => Object.fromEntries(grid[headerAt].map((h, i) => [cell(h), r[i]]).filter(([h]) => h)))
          : [Object.fromEntries(grid.filter((r) => cell(r[0]) && cell(r[0]) !== 'Field').map((r) => [cell(r[0]), r[1]]))];
      const norm = (v: unknown) =>
        String(v ?? '')
          .trim()
          .toUpperCase();
      const codeOf = (r: Record<string, any>) => norm(r['Item Code'] ?? r['Code'] ?? r['code']);
      const row = rows.find((r) => codeOf(r) === norm(item.code)) || (rows.length === 1 && !codeOf(rows[0]) ? rows[0] : null);
      if (!row) {
        showToast(`The file has no row for item code ${item.code}. Download this item, change the prices and upload that file.`, true);
        return;
      }
      const num = (v: unknown) => {
        const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
        return String(v ?? '').trim() !== '' && Number.isFinite(n) ? n : null;
      };
      const prices = { ...(item.subCategoryPrices || {}) } as Record<string, number>;
      let changed = 0;
      Object.entries(row).forEach(([header, value]) => {
        const h = header.replace(/\s*\(KSh\)\s*$/i, '').trim();
        const m = h.match(/^(.+?)\s+Price$/i);
        const code = m && subCategories.find((s) => norm(s.subCategoryCode) === norm(m[1]))?.subCategoryCode;
        const n = num(value);
        if (code && n !== null) {
          prices[code] = n;
          changed++;
        }
      });
      const cashCell = num(row['Cash Price (KSh)'] ?? row['Cash Price']);
      const newCash = !cashFollowsInventory && cashCell !== null ? cashCell : Number(item.cashPrice || 0);
      if (!changed && newCash === Number(item.cashPrice || 0)) {
        showToast('No prices were found in the file (expected columns such as "Cash Price (KSh)" and "<sub-category> Price (KSh)").', true);
        return;
      }
      const apply = (list: any[]) => list.map((x) => (x.id === item.id ? { ...x, cashPrice: newCash, subCategoryPrices: prices } : x));
      if (selectedCategoryType === 'lab') onUpdateLabTests(apply(labTests));
      else if (selectedCategoryType === 'radiology') onUpdateRadiologyTests(apply(radiologyTests));
      else if (selectedCategoryType === 'nursing') onUpdateNursingProcedures(apply(nursingProcedures));
      else onUpdatePharmacyItems(apply(pharmacyItems));
      showToast(
        `${itemName(item)}: prices replaced from ${file.name} (${changed} sub-categor${changed === 1 ? 'y' : 'ies'}${cashFollowsInventory ? '; the cash price follows the Inventory selling price' : ', cash price'}).`,
      );
    } catch (e: any) {
      showToast(e?.message || 'Could not read the file.', true);
    }
  };

  const currentItems =
    selectedCategoryType === 'lab'
      ? labTests
      : selectedCategoryType === 'radiology'
        ? radiologyTests
        : selectedCategoryType === 'nursing'
          ? nursingProcedures
          : pharmacyItems;

  const filteredItems = currentItems.filter((item: any) => {
    const itemName = String(item.name ?? item.brandName ?? item.genericName ?? '').toLowerCase();
    const itemCode = String(item.code ?? '').toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    return !q || itemName.includes(q) || itemCode.includes(q);
  });
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageNumbers = Array.from(new Set([1, currentPage - 1, currentPage, currentPage + 1, pageCount]))
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b);

  const sampleItemsForModal = currentItems.slice(0, 5).map((item: any) => ({
    name: item.name ?? item.brandName ?? item.genericName ?? item.code,
    cashPrice: item.cashPrice,
    currentSubPrice: item.subCategoryPrices?.[selectedSubCode] ?? item.cashPrice,
  }));

  const categoryLabels = {
    lab: 'Lab Tests',
    radiology: 'Radiology Imaging',
    nursing: 'Nursing Procedures',
    pharmacy: 'Pharmacy Medications',
  };

  return (
    <div className="space-y-4">
      {toastMessage && (
        <div
          className={`${toastError ? 'bg-rose-600' : 'bg-emerald-600'} text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 text-xs font-bold animate-in fade-in`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Sub-Category Tariff Management & Bulk Price Engine
          </h2>
          <p className="text-xs text-gray-500">
            Define tariffs for each patient sub-category with one-click bulk pricing derived from cash rates.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">Target Sub-Category:</span>
          <select
            value={selectedSubCode}
            onChange={(e) => setSelectedSubCode(e.target.value)}
            className="w-full sm:w-auto max-w-full min-w-0 px-3 py-1 text-xs border border-slate-300 rounded-lg bg-white font-bold text-[#0088cc] focus:ring-2 focus:ring-[#0088cc]"
          >
            {subCategories.map((s) => (
              <option key={s.id} value={s.subCategoryCode}>
                {s.subCategoryCode} — {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategoryType('lab')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
              selectedCategoryType === 'lab' ? 'bg-[#0088cc] text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Lab Tests ({labTests.length})</span>
          </button>

          <button
            onClick={() => setSelectedCategoryType('radiology')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
              selectedCategoryType === 'radiology' ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Radiation className="w-3.5 h-3.5" />
            <span>Radiology ({radiologyTests.length})</span>
          </button>

          <button
            onClick={() => setSelectedCategoryType('nursing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
              selectedCategoryType === 'nursing' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Syringe className="w-3.5 h-3.5" />
            <span>Nursing Procedures ({nursingProcedures.length})</span>
          </button>

          <button
            onClick={() => setSelectedCategoryType('pharmacy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
              selectedCategoryType === 'pharmacy' ? 'bg-amber-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Pharmacy Items ({pharmacyItems.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] w-full sm:w-56 bg-white"
            />
          </div>

          <button
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer shrink-0"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Update All from Cash Price</span>
          </button>
        </div>
      </div>

      <div className="border border-gray-200 bg-white rounded-xl shadow-xs overflow-hidden" data-wc-own-paging="true">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[820px]">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-3.5 py-3">Item Code</th>
                <th className="px-3.5 py-3">Item Name</th>
                <th className="px-3.5 py-3">Classification / Form</th>
                <th className="px-3.5 py-3 text-right">Standard Cash Baseline (KSh)</th>
                <th className="px-3.5 py-3 text-right text-indigo-700 bg-indigo-50/50">{selectedSubCode} Active Tariff (KSh)</th>
                <th className="px-3.5 py-3 text-center">Variance vs Cash</th>
                <th className="px-3.5 py-3 text-center">Uploads / Downloads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No items match this search.
                  </td>
                </tr>
              )}
              {pageItems.map((item: any) => {
                const cash = Number(item.cashPrice || 0);
                const subPrice = item.subCategoryPrices?.[selectedSubCode] ?? cash;
                const variance = cash > 0 ? Math.round(((subPrice - cash) / cash) * 100) : 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-800">{item.code}</td>
                    <td className="px-3.5 py-3 font-semibold text-gray-900">
                      {item.name ?? item.brandName ?? item.genericName ?? item.code}
                    </td>
                    <td className="px-3.5 py-3 text-gray-600 text-[11px]">
                      {item.department || item.modality || item.dosageForm || item.formulation || item.category || 'General'}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-bold text-gray-700">KSh {cash.toLocaleString()}</td>
                    <td className="px-3.5 py-3 text-right bg-indigo-50/30">
                      <input
                        type="number"
                        value={subPrice}
                        onChange={(e) => handleUpdateSinglePrice(item.id, parseFloat(e.target.value) || 0)}
                        className="w-28 px-2 py-1 text-right border border-indigo-200 rounded font-mono font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-300 bg-white"
                      />
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      {variance === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Same as Cash (100%)</span>
                      ) : variance > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          +{variance}% Markup
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">{variance}% Discount</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => downloadItem(item)}
                        title="Download this item's details and its price for every sub-category"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 text-[10px] font-bold"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                      <button
                        type="button"
                        onClick={() => startUpload(item)}
                        title="Upload this item's details file (with changed prices) to replace its prices"
                        className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold"
                      >
                        <Upload className="w-3 h-3" />
                        Upload
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-slate-50/60 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <span>
              Showing <b>{filteredItems.length ? ((currentPage - 1) * pageSize + 1).toLocaleString() : 0}</b>–
              <b>{Math.min(filteredItems.length, currentPage * pageSize).toLocaleString()}</b> of{' '}
              <b>{filteredItems.length.toLocaleString()}</b>
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded-md px-1.5 py-1 bg-white"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="p-1.5 rounded-md border bg-white disabled:opacity-40"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pageNumbers.map((n, i) => (
              <React.Fragment key={n}>
                {i > 0 && n - pageNumbers[i - 1] > 1 && <span className="px-1 text-gray-400">…</span>}
                <button
                  type="button"
                  onClick={() => setPage(n)}
                  className={`min-w-[32px] px-2 py-1 rounded-md border font-bold ${n === currentPage ? 'bg-[#0088cc] text-white border-[#0088cc]' : 'bg-white text-gray-700 hover:bg-sky-50'}`}
                >
                  {n}
                </button>
              </React.Fragment>
            ))}
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
              className="p-1.5 rounded-md border bg-white disabled:opacity-40"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <input
        ref={uploadInput}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => void onUploadFile(e.target.files?.[0])}
      />

      <UpdateFromCashModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        categoryTitle={categoryLabels[selectedCategoryType]}
        subCategoryCode={selectedSubCode}
        subCategoryName={selectedSub?.name || selectedSubCode}
        sampleItems={sampleItemsForModal}
        onApply={handleApplyCashCalculation}
      />
    </div>
  );
};
