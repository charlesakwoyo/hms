import React, { useMemo, useState } from 'react';
import { Banknote, Plus, Pencil, Trash2, Power, AlertTriangle, X, Info } from 'lucide-react';
import { SetupShaDailyRebate } from '../types';
import { apiClient } from '../services/apiClient';
import { showMessage } from './AppMessage';

export const SHA_INPATIENT_RATES: { level: string; perDay: number; note: string }[] = [
  { level: 'Level 2', perDay: 0, note: 'Dispensaries / clinics: Primary Health Care Fund (outpatient). No inpatient per-day rebate.' },
  { level: 'Level 3', perDay: 2240, note: 'Health centres, maternity & nursing homes' },
  { level: 'Level 4', perDay: 3360, note: 'Sub-county / primary referral hospitals' },
  { level: 'Level 5', perDay: 3920, note: 'County referral hospitals' },
  { level: 'Level 6', perDay: 4480, note: 'National referral hospitals' },
];
export const SHA_MAX_DAYS_PER_YEAR = 180;
const DEFAULT_REFERENCE = 'SHA Tariffs 2026 (Legal Notice No. 78 of 2026) — SHIF inpatient per-day rate';
const BENEFITS = [
  'General Inpatient (Medical / Surgical)',
  'Maternity Ward Stay',
  'Paediatric Ward Stay',
  'Mental Health Inpatient',
  'Other Inpatient Stay',
];
const WARD_CATEGORIES = [
  'All Wards',
  'Male Medical',
  'Female Medical',
  'Surgical',
  'Pediatric',
  'Maternity',
  'ICU / HDU',
  'Private Amenity',
];

const levelOf = (raw: unknown): string => {
  const m = String(raw ?? '').match(/[2-6]/);
  return m ? `Level ${m[0]}` : '';
};
export const shaCeiling = (level: unknown): number | null => {
  const r = SHA_INPATIENT_RATES.find((x) => x.level === levelOf(level));
  return r ? r.perDay : null;
};
const today = () => new Date().toLocaleDateString('en-CA');
const ksh = (n: number) => `KSh ${Number(n || 0).toLocaleString()}`;

type Draft = Required<
  Pick<SetupShaDailyRebate, 'id' | 'code' | 'packageName' | 'dailyRebateAmount' | 'wardCategory' | 'description' | 'isActive'>
> & {
  facilityLevel: string;
  benefitCategory: string;
  maxDaysPerYear: number;
  requiresPreauth: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  legalReference: string;
  discountPerDay: number;
  discountLabel: string;
};
const blank = (level: string): Draft => ({
  id: '',
  code: '',
  packageName: '',
  dailyRebateAmount: shaCeiling(level) || 0,
  wardCategory: 'All Wards',
  description: '',
  isActive: true,
  facilityLevel: level || 'Level 4',
  benefitCategory: BENEFITS[0],
  maxDaysPerYear: SHA_MAX_DAYS_PER_YEAR,
  requiresPreauth: true,
  effectiveFrom: today(),
  effectiveTo: '',
  legalReference: DEFAULT_REFERENCE,
  discountPerDay: 0,
  discountLabel: 'Hospital Discount',
});
const fromRow = (r: SetupShaDailyRebate, level: string): Draft => ({
  ...blank(r.facilityLevel || level),
  ...r,
  code: r.code || r.id,
  description: r.description || '',
  isActive: r.isActive !== false,
  facilityLevel: levelOf(r.facilityLevel) || levelOf(r.packageName) || levelOf(r.wardCategory) || level || 'Level 4',
  benefitCategory: r.benefitCategory || BENEFITS[0],
  wardCategory: r.wardCategory || 'All Wards',
  maxDaysPerYear: Number(r.maxDaysPerYear || SHA_MAX_DAYS_PER_YEAR),
  requiresPreauth: r.requiresPreauth !== false,
  effectiveFrom: String(r.effectiveFrom || '').slice(0, 10) || today(),
  effectiveTo: String(r.effectiveTo || '').slice(0, 10),
  legalReference: r.legalReference || DEFAULT_REFERENCE,
  discountPerDay: Number(r.discountPerDay || 0),
  discountLabel: r.discountLabel || 'Hospital Discount',
});

const problems = (d: Draft, all: SetupShaDailyRebate[]): string[] => {
  const out: string[] = [];
  const cap = shaCeiling(d.facilityLevel);
  if (!d.code.trim()) out.push('Enter a rebate code.');
  else if (!/^[A-Za-z0-9_-]{2,40}$/.test(d.code.trim())) out.push('The code may use letters, numbers, "-" and "_" only (2–40 characters).');
  else if (all.some((r) => (r.code || r.id).toLowerCase() === d.code.trim().toLowerCase() && r.id !== d.id))
    out.push(`The code ${d.code.trim()} is already used by another rebate.`);
  if (!d.packageName.trim()) out.push('Enter the package name.');
  if (cap === null) out.push('Choose the facility level.');
  else if (cap === 0)
    out.push('Level 2 facilities have no SHA inpatient per-day rebate (they are paid through the Primary Health Care Fund).');
  else if (!(d.dailyRebateAmount > 0)) out.push('Enter the daily rebate amount.');
  else if (d.dailyRebateAmount > cap)
    out.push(`${d.facilityLevel}: SHA pays at most ${ksh(cap)} per day; the rebate cannot be ${ksh(d.dailyRebateAmount)}.`);
  if (d.discountPerDay < 0) out.push('The discount cannot be below zero.');
  if (d.discountPerDay > 0 && !d.discountLabel.trim()) out.push('Name the discount (e.g. Hospital Discount).');
  if (!(d.maxDaysPerYear >= 1 && d.maxDaysPerYear <= SHA_MAX_DAYS_PER_YEAR))
    out.push(`Days covered must be between 1 and ${SHA_MAX_DAYS_PER_YEAR} per household per year.`);
  if (!d.effectiveFrom) out.push('Enter the date the rebate takes effect.');
  if (d.effectiveTo && d.effectiveFrom && d.effectiveTo < d.effectiveFrom) out.push('The end date is before the start date.');
  return out;
};

export const ShaRebateSetup: React.FC<{
  rebates: SetupShaDailyRebate[];
  onChange: (rows: SetupShaDailyRebate[]) => void;
  hospitalLevel?: string;
}> = ({ rebates, onChange, hospitalLevel }) => {
  const level = levelOf(hospitalLevel);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const issues = useMemo(() => (draft ? problems(draft, rebates) : []), [draft, rebates]);
  const cap = draft ? shaCeiling(draft.facilityLevel) : null;

  const suggest = (d: Draft): Partial<Draft> => {
    const lv = levelOf(d.facilityLevel).replace('Level ', 'L');
    const ben = d.benefitCategory.split(' ')[0].slice(0, 4).toUpperCase();
    const ward =
      d.wardCategory === 'All Wards'
        ? 'ALL'
        : d.wardCategory
            .replace(/[^A-Za-z]/g, '')
            .slice(0, 4)
            .toUpperCase();
    return { code: `SHA-${lv}-${ben}-${ward}`, packageName: `SHA ${d.benefitCategory} — ${d.facilityLevel} (${d.wardCategory})` };
  };
  const [autoText, setAutoText] = useState(true);
  const change = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => {
      if (!d) return d;
      let next = { ...d, [k]: v } as Draft;
      if (k === 'facilityLevel') {
        const c = shaCeiling(v);
        if (
          c !== null &&
          (next.dailyRebateAmount > c || next.dailyRebateAmount === 0 || next.dailyRebateAmount === shaCeiling(d.facilityLevel))
        )
          next.dailyRebateAmount = c;
      }
      if (autoText && !d.id && (k === 'facilityLevel' || k === 'benefitCategory' || k === 'wardCategory'))
        next = { ...next, ...suggest(next) };
      return next;
    });

  const openNew = () => {
    const d = blank(level);
    setAutoText(true);
    setTouched(false);
    setDraft({ ...d, ...suggest(d) });
  };
  const openEdit = (r: SetupShaDailyRebate) => {
    setAutoText(false);
    setTouched(false);
    setDraft(fromRow(r, level));
  };
  const save = () => {
    setTouched(true);
    if (!draft || issues.length) return;
    const code = draft.code.trim();
    const row: SetupShaDailyRebate = {
      id: draft.id || code,
      code,
      packageName: draft.packageName.trim(),
      dailyRebateAmount: Number(draft.dailyRebateAmount),
      wardCategory: draft.wardCategory,
      description: draft.description.trim(),
      isActive: draft.isActive,
      facilityLevel: draft.facilityLevel,
      benefitCategory: draft.benefitCategory,
      shaMaxPerDay: shaCeiling(draft.facilityLevel) || 0,
      maxDaysPerYear: Number(draft.maxDaysPerYear),
      requiresPreauth: draft.requiresPreauth,
      fund: 'SHIF',
      effectiveFrom: draft.effectiveFrom,
      effectiveTo: draft.effectiveTo || '',
      legalReference: draft.legalReference.trim(),
      discountPerDay: Number(draft.discountPerDay || 0),
      discountLabel: draft.discountLabel.trim(),
    };
    const exists = rebates.some((r) => r.id === row.id);
    onChange(exists ? rebates.map((r) => (r.id === row.id ? row : r)) : [row, ...rebates]);
    setDraft(null);
    showMessage({
      title: exists ? 'SHA rebate updated' : 'SHA rebate created',
      message: `${row.packageName}: ${ksh(row.dailyRebateAmount)}${row.discountPerDay ? ` + ${ksh(row.discountPerDay)} discount` : ''} per day.`,
      tone: 'success',
    });
  };
  const toggle = (r: SetupShaDailyRebate) => onChange(rebates.map((x) => (x.id === r.id ? { ...x, isActive: x.isActive === false } : x)));
  const remove = async (r: SetupShaDailyRebate) => {
    if (!window.confirm(`Delete the SHA rebate "${r.packageName}"? Admissions already using it keep their rebate.`)) return;
    const res = await apiClient.deleteEntity('sha-rebates', r.id);
    if (!res.success) {
      showMessage({ title: 'Not deleted', message: res.error || 'The rebate could not be deleted.', tone: 'warning' });
      return;
    }
    onChange(rebates.filter((x) => x.id !== r.id));
  };

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/30';
  const lbl = 'block text-[11px] font-bold text-gray-700 mb-1';
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-blue-600" />
            Social Health Authority (SHA) Inpatient Daily Rebate Schedules
          </h2>
          <p className="text-xs text-gray-500">
            The amount SHA pays per inpatient day, chosen on the admission form and deducted on the inpatient bill. Limited to SHA's rate
            for the facility level.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New SHA Rebate
        </button>
      </div>

      <div className="border border-gray-200 bg-white rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-3 py-3">Code</th>
              <th className="px-3 py-3">Package / Benefit</th>
              <th className="px-3 py-3">Level</th>
              <th className="px-3 py-3">Ward</th>
              <th className="px-3 py-3 text-right">Daily Rebate</th>
              <th className="px-3 py-3 text-right">Discount / Day</th>
              <th className="px-3 py-3 text-right">Total / Day</th>
              <th className="px-3 py-3 text-right">SHA Limit</th>
              <th className="px-3 py-3 text-center">Days / Yr</th>
              <th className="px-3 py-3">Effective</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rebates.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-400">
                  No SHA rebates set up yet. Select “New SHA Rebate”.
                </td>
              </tr>
            )}
            {rebates.map((r) => {
              const lv = levelOf(r.facilityLevel) || levelOf(r.packageName) || levelOf(r.wardCategory);
              const c = shaCeiling(lv);
              const over = c !== null && c > 0 && Number(r.dailyRebateAmount) > c;
              return (
                <tr key={r.id} className={`hover:bg-slate-50/50 ${r.isActive === false ? 'opacity-60' : ''}`}>
                  <td className="px-3 py-3 font-mono font-bold text-slate-800">{r.code || r.id}</td>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-gray-900">{r.packageName}</div>
                    <div className="text-[10px] text-gray-500">
                      {r.benefitCategory || '—'}
                      {r.requiresPreauth ? ' • Pre-authorization' : ''}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-medium text-gray-700">
                    {lv || <span className="text-amber-700 font-bold">Not set — edit</span>}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{r.wardCategory || '—'}</td>
                  <td className={`px-3 py-3 text-right font-mono font-bold ${over ? 'text-red-700' : 'text-blue-800'}`}>
                    {ksh(r.dailyRebateAmount)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-gray-700">
                    {Number(r.discountPerDay || 0) > 0 ? ksh(Number(r.discountPerDay)) : '—'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-black text-gray-900">
                    {ksh(Number(r.dailyRebateAmount || 0) + Number(r.discountPerDay || 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-gray-500">
                    {c ? ksh(c) : '—'}
                    {over && (
                      <div className="text-[10px] font-sans font-bold text-red-700 flex items-center justify-end gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Above SHA limit
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">{r.maxDaysPerYear || SHA_MAX_DAYS_PER_YEAR}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                    {r.effectiveFrom ? String(r.effectiveFrom).slice(0, 10) : '—'}
                    {r.effectiveTo ? ` → ${String(r.effectiveTo).slice(0, 10)}` : ''}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.isActive === false ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'}`}
                    >
                      {r.isActive === false ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap space-x-1">
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => openEdit(r)}
                      className="p-1.5 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 inline-flex"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title={r.isActive === false ? 'Activate' : 'Deactivate'}
                      onClick={() => toggle(r)}
                      className="p-1.5 rounded border border-amber-200 text-amber-700 hover:bg-amber-50 inline-flex"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => void remove(r)}
                      className="p-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 inline-flex"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {draft && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-start sm:items-center justify-center p-3 overflow-y-auto"
          onClick={() => setDraft(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-700 text-white px-5 py-3.5 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                {draft.id ? 'Edit SHA Daily Rebate' : 'New SHA Daily Rebate'}
              </h3>
              <button type="button" onClick={() => setDraft(null)} aria-label="Close" className="p-1 rounded hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5 text-xs">
              <section className="space-y-3">
                <p className="text-[11px] font-black text-blue-800 uppercase tracking-wide">1. Facility & benefit</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={lbl}>Facility level (KEPH) *</label>
                    <select className={inp} value={draft.facilityLevel} onChange={(e) => change('facilityLevel', e.target.value)}>
                      {SHA_INPATIENT_RATES.map((r) => (
                        <option key={r.level} value={r.level}>
                          {r.level} — {r.perDay ? `${ksh(r.perDay)}/day` : 'not covered'}
                        </option>
                      ))}
                    </select>
                    {level && draft.facilityLevel !== level && (
                      <p className="text-[10px] text-amber-700 mt-1">Hospital Profile says {level}.</p>
                    )}
                  </div>
                  <div>
                    <label className={lbl}>Benefit category *</label>
                    <select className={inp} value={draft.benefitCategory} onChange={(e) => change('benefitCategory', e.target.value)}>
                      {BENEFITS.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Ward category *</label>
                    <select className={inp} value={draft.wardCategory} onChange={(e) => change('wardCategory', e.target.value)}>
                      {(WARD_CATEGORIES.includes(draft.wardCategory) ? WARD_CATEGORIES : [draft.wardCategory, ...WARD_CATEGORIES]).map(
                        (w) => (
                          <option key={w}>{w}</option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-[11px] font-black text-blue-800 uppercase tracking-wide">2. Identification</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={lbl}>Rebate code *</label>
                    <input
                      className={`${inp} font-mono uppercase`}
                      value={draft.code}
                      disabled={!!draft.id}
                      onChange={(e) => {
                        setAutoText(false);
                        set('code', e.target.value.toUpperCase());
                      }}
                    />
                    {draft.id && <p className="text-[10px] text-gray-500 mt-1">The code of a saved rebate cannot change.</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={lbl}>Package name *</label>
                    <input
                      className={inp}
                      value={draft.packageName}
                      onChange={(e) => {
                        setAutoText(false);
                        set('packageName', e.target.value);
                      }}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-[11px] font-black text-blue-800 uppercase tracking-wide">3. Rebate amount & limits</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={lbl}>SHA maximum per day</label>
                    <div className={`${inp} bg-gray-50 font-mono font-bold ${cap ? 'text-blue-800' : 'text-gray-400'}`}>
                      {cap ? ksh(cap) : 'Not covered'}
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Daily rebate amount (KSh) *</label>
                    <input
                      type="number"
                      min={0}
                      max={cap || 0}
                      step={10}
                      className={`${inp} font-mono font-bold ${cap !== null && draft.dailyRebateAmount > (cap || 0) ? 'border-red-400 text-red-700' : 'text-blue-800'}`}
                      value={draft.dailyRebateAmount || ''}
                      disabled={!cap}
                      onChange={(e) => set('dailyRebateAmount', Math.max(0, Number(e.target.value) || 0))}
                    />
                    {!!cap && (
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-500">
                          {Math.round((draft.dailyRebateAmount / cap) * 100) || 0}% of SHA rate
                        </span>
                        <button
                          type="button"
                          onClick={() => set('dailyRebateAmount', cap)}
                          className="text-[10px] font-bold text-blue-700 hover:underline"
                        >
                          Use SHA maximum
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={lbl}>Days covered per household / year *</label>
                    <input
                      type="number"
                      min={1}
                      max={SHA_MAX_DAYS_PER_YEAR}
                      className={inp}
                      value={draft.maxDaysPerYear || ''}
                      onChange={(e) => set('maxDaysPerYear', Number(e.target.value) || 0)}
                    />
                    <p className="text-[10px] text-gray-500 mt-1">SHA limit: {SHA_MAX_DAYS_PER_YEAR} days.</p>
                  </div>
                </div>
                {!!cap && draft.dailyRebateAmount > 0 && (
                  <div className="bg-slate-50 border rounded-lg p-3 grid grid-cols-3 gap-2 text-center">
                    {[3, 7, 14].map((n) => (
                      <div key={n}>
                        <div className="text-[10px] text-gray-500">{n}-day stay (rebate + discount)</div>
                        <div className="font-mono font-bold text-gray-900">
                          {ksh(
                            Math.min(n, draft.maxDaysPerYear) * (Number(draft.dailyRebateAmount || 0) + Number(draft.discountPerDay || 0)),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-3 space-y-2">
                  <p className="text-[11px] font-black text-blue-900">Hospital discount included with this rebate</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={lbl}>Discount per day (KSh)</label>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        className={`${inp} font-mono font-bold`}
                        value={draft.discountPerDay || ''}
                        placeholder="0"
                        onChange={(e) => set('discountPerDay', Math.max(0, Number(e.target.value) || 0))}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Discount name</label>
                      <input
                        className={inp}
                        value={draft.discountLabel}
                        onChange={(e) => set('discountLabel', e.target.value)}
                        placeholder="e.g. Hospital Discount"
                      />
                    </div>
                    <div>
                      <label className={lbl}>Total deducted per day</label>
                      <div className={`${inp} bg-white font-mono font-black text-blue-900`}>
                        {ksh(Number(draft.dailyRebateAmount || 0) + Number(draft.discountPerDay || 0))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-900">
                    SHA rebate {ksh(draft.dailyRebateAmount)} + discount {ksh(draft.discountPerDay)} are deducted together, once, for each
                    inpatient day. The discount is already included, so it is not deducted again on the bill.
                  </p>
                </div>
                <label className="flex items-center gap-2 font-semibold text-gray-700">
                  <input type="checkbox" checked={draft.requiresPreauth} onChange={(e) => set('requiresPreauth', e.target.checked)} />
                  Requires SHA pre-authorization before admission
                </label>
              </section>

              <section className="space-y-3">
                <p className="text-[11px] font-black text-blue-800 uppercase tracking-wide">4. Validity & reference</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={lbl}>Effective from *</label>
                    <input type="date" className={inp} value={draft.effectiveFrom} onChange={(e) => set('effectiveFrom', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Effective to (optional)</label>
                    <input type="date" className={inp} value={draft.effectiveTo} onChange={(e) => set('effectiveTo', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Fund</label>
                    <div className={`${inp} bg-gray-50 font-bold`}>SHIF (Social Health Insurance Fund)</div>
                  </div>
                  <div className="sm:col-span-3">
                    <label className={lbl}>Tariff / gazette reference</label>
                    <input className={inp} value={draft.legalReference} onChange={(e) => set('legalReference', e.target.value)} />
                  </div>
                  <div className="sm:col-span-3">
                    <label className={lbl}>Description / notes</label>
                    <textarea
                      rows={2}
                      className={inp}
                      value={draft.description}
                      onChange={(e) => set('description', e.target.value)}
                      placeholder="e.g. Applies to all general medical and surgical admissions"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 font-semibold text-gray-700">
                  <input type="checkbox" checked={draft.isActive} onChange={(e) => set('isActive', e.target.checked)} />
                  Active (offered on the admission form)
                </label>
              </section>

              {touched && issues.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 space-y-1">
                  {issues.map((t) => (
                    <div key={t} className="flex gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              )}
              {!touched && cap === 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 flex gap-1.5">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Level 2 facilities have no SHA inpatient per-day rebate.
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-t rounded-b-2xl">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="px-4 py-2 bg-white border text-gray-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
              >
                {draft.id ? 'Save Changes' : 'Create SHA Rebate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
