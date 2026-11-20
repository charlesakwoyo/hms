import React from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { showMessage } from '../AppMessage';

export type Row = Record<string, any>;

export const erpList = async (type: string): Promise<Row[]> => (await apiClient.getEntity(type)) as Row[];
export const erpSave = async (type: string, row: Row): Promise<boolean> => {
  const r = await apiClient.persistEntity(type, row);
  if (!r.success) showMessage({ title: 'Not saved', message: r.error || 'The record could not be saved. Try again.', tone: 'warning' });
  return r.success;
};
export const erpDelete = async (type: string, id: string): Promise<boolean> => {
  const r = await apiClient.deleteEntity(type, id);
  if (!r.success) showMessage({ title: 'Not removed', message: r.error || 'The record could not be removed.', tone: 'warning' });
  return r.success;
};

export const storeApi = async (action: string, body?: Row, query = ''): Promise<any> => {
  const res = await fetch(`/api/stores/${action}${query}`, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j?.success === false) throw new Error(j?.error || `The store could not complete this (server answer ${res.status}).`);
  return j;
};

export const ksh = (n: unknown, dp = 0) =>
  `KSh ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
export const num = (n: unknown) => Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 });
export const today = () => new Date().toLocaleDateString('en-CA');
export const thisMonth = () => today().slice(0, 7);
export const dayOf = (v: unknown) => String(v ?? '').slice(0, 10);
export const newId = (prefix: string) =>
  `${prefix}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};
export const nextNumber = (rows: Row[], key: string, prefix: string, start = 1001) => {
  const nums = rows
    .map((r) =>
      Number(
        String(r[key] || '')
          .replace(/^\D+/, '')
          .replace(/\D.*$/, ''),
      ),
    )
    .filter((n) => Number.isFinite(n) && n > 0);
  return `${prefix}${Math.max(start - 1, ...nums) + 1}`;
};

export type ErpTheme = 'fin' | 'stores';
export const ErpThemeContext = React.createContext<ErpTheme>('fin');
const useTheme = () => React.useContext(ErpThemeContext);

type Tone = 'sky' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate' | 'blue' | 'cyan' | 'purple';
const iconTint: Record<Tone, string> = {
  sky: 'bg-sky-50 text-sky-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
  purple: 'bg-purple-50 text-purple-600',
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-50 text-blue-600',
  cyan: 'bg-cyan-50 text-cyan-700',
};
const iconText: Record<Tone, string> = {
  sky: 'text-sky-500',
  emerald: 'text-emerald-500',
  amber: 'text-amber-500',
  rose: 'text-rose-500',
  violet: 'text-violet-500',
  purple: 'text-purple-500',
  slate: 'text-slate-500',
  blue: 'text-blue-500',
  cyan: 'text-cyan-500',
};
const valueText: Record<Tone, string> = {
  sky: 'text-sky-700',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
  violet: 'text-violet-700',
  purple: 'text-purple-700',
  slate: 'text-slate-800',
  blue: 'text-blue-700',
  cyan: 'text-cyan-900',
};
const leftBar: Record<Tone, string> = {
  sky: 'border-l-sky-500',
  emerald: 'border-l-emerald-500',
  amber: 'border-l-amber-500',
  rose: 'border-l-rose-500',
  violet: 'border-l-violet-500',
  purple: 'border-l-purple-500',
  slate: 'border-l-slate-500',
  blue: 'border-l-blue-500',
  cyan: 'border-l-cyan-500',
};

export const Kpi: React.FC<{
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  tone?: Tone;
  valueTone?: Tone;
  noteTone?: Tone;
  icon?: React.ReactNode;
  bar?: boolean;
  children?: React.ReactNode;
}> = ({ label, value, note, tone = 'slate', valueTone, noteTone, icon, bar, children }) => {
  const theme = useTheme();
  if (theme === 'stores')
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-w-0">
        <div className="flex items-center justify-between gap-2 text-slate-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
          {icon && <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconTint[tone]}`}>{icon}</div>}
        </div>
        <div className="mt-3 min-w-0">
          <h3 className={`text-2xl font-extrabold break-words ${valueTone ? valueText[valueTone] : 'text-slate-900'}`}>{value}</h3>
          {note && <p className={`text-[11px] mt-0.5 ${noteTone ? `${valueText[noteTone]} font-medium` : 'text-slate-500'}`}>{note}</p>}
          {children}
        </div>
      </div>
    );
  return (
    <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm min-w-0 ${bar ? `border-l-4 ${leftBar[tone]}` : ''}`}>
      <div className="flex items-center justify-between gap-2 text-slate-500 mb-2">
        <span className="text-xs font-semibold uppercase">{label}</span>
        {icon && <span className={`shrink-0 ${iconText[tone]}`}>{icon}</span>}
      </div>
      <p className={`text-2xl font-bold truncate ${valueTone ? valueText[valueTone] : 'text-slate-800'}`}>{value}</p>
      {note && <p className={`text-xs mt-1 ${noteTone ? `${valueText[noteTone]} font-semibold` : 'text-slate-500'}`}>{note}</p>}
      {children}
    </div>
  );
};

export const Badge: React.FC<{
  tone?: 'green' | 'amber' | 'rose' | 'sky' | 'slate' | 'violet' | 'blue' | 'cyan';
  children: React.ReactNode;
  square?: boolean;
}> = ({ tone = 'slate', children, square }) => {
  const c = {
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-800',
    sky: 'bg-sky-100 text-sky-800',
    slate: 'bg-slate-100 text-slate-700',
    violet: 'bg-violet-100 text-violet-800',
    blue: 'bg-blue-100 text-blue-800',
    cyan: 'bg-cyan-50 text-cyan-800 border border-cyan-200',
  }[tone];
  const stores = useTheme() === 'stores';
  return (
    <span
      className={`inline-block whitespace-nowrap text-[10px] font-bold ${square ? 'px-2 py-0.5 rounded' : stores ? 'px-2.5 py-1 rounded-full' : 'px-2 py-0.5 rounded'} ${c}`}
    >
      {children}
    </span>
  );
};

export const Modal: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  wide?: boolean;
  head?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, onClose, wide, head, icon, children }) => {
  const stores = React.useContext(ErpThemeContext) === 'stores';
  const bar = head || (stores ? 'bg-cyan-700' : 'bg-slate-800');
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white ${stores ? 'rounded-2xl shadow-xl' : 'rounded-xl shadow-2xl border border-slate-200'} w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto`}
      >
        <div className={`${bar} text-white ${stores ? 'px-6 py-4' : 'p-4'} flex items-start justify-between gap-3 sticky top-0 z-10`}>
          <div className="min-w-0">
            <h3 className="font-bold text-sm flex items-center gap-2">
              {icon}
              {title}
            </h3>
            {subtitle && <p className="text-[11px] text-white/75 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white shrink-0" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={`${stores ? 'p-6' : 'p-5'} text-xs`}>{children}</div>
      </div>
    </div>
  );
};

export const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <label className={`block text-xs font-semibold text-slate-700 ${className}`}>
    <span className="block mb-1">{label}</span>
    {children}
  </label>
);
export const inputCls =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500';
const b = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow disabled:opacity-50 whitespace-nowrap';
export const btn = {
  primary: `${b} bg-sky-600 hover:bg-sky-700 text-white`,
  green: `${b} bg-emerald-600 hover:bg-emerald-700 text-white`,
  dark: `${b} bg-slate-800 hover:bg-slate-900 text-white`,
  slate: `${b} bg-slate-700 hover:bg-slate-800 text-white`,
  amber: `${b} bg-amber-600 hover:bg-amber-700 text-white`,
  rose: `${b} bg-rose-600 hover:bg-rose-700 text-white`,
  cyan: `${b} bg-cyan-700 hover:bg-cyan-800 text-white`,
  purple: `${b} bg-purple-700 hover:bg-purple-800 text-white`,
  light:
    'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-50 whitespace-nowrap',
  mini: 'inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold whitespace-nowrap',
  link: 'inline-flex items-center gap-1 text-sky-600 hover:underline text-xs font-semibold whitespace-nowrap',

  sCyan:
    'inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm disabled:opacity-50 whitespace-nowrap',
  sBlue:
    'inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm disabled:opacity-50 whitespace-nowrap',
  sGreen:
    'inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm disabled:opacity-50 whitespace-nowrap',
  sLight:
    'inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 disabled:opacity-50 whitespace-nowrap',
};
export const FormButtons: React.FC<{ onCancel: () => void; label: string; busy?: boolean; color?: string }> = ({
  onCancel,
  label,
  busy,
  color = 'bg-sky-600 hover:bg-sky-700',
}) => (
  <div className="flex justify-end gap-2 pt-3 mt-3 border-t">
    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border text-slate-600 font-semibold hover:bg-slate-50 text-xs">
      Cancel
    </button>
    <button
      type="submit"
      disabled={busy}
      className={`px-4 py-2 rounded-lg text-white font-bold shadow text-xs disabled:opacity-50 ${color}`}
    >
      {busy ? 'Saving…' : label}
    </button>
  </div>
);

export const Panel: React.FC<{
  title?: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, sub, right, children, className = '' }) => {
  const stores = useTheme() === 'stores';
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {(title || right) &&
        (stores ? (
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-xs uppercase text-slate-700">{title}</h4>
            {right}
          </div>
        ) : (
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800">{title}</h3>
              {sub && <p className="text-xs text-slate-500">{sub}</p>}
            </div>
            {right}
          </div>
        ))}
      {children}
    </div>
  );
};

export const SectionHead: React.FC<{ title: string; text: string; children?: React.ReactNode }> = ({ title, text, children }) => {
  const stores = useTheme() === 'stores';
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="min-w-0">
        <h2 className={stores ? 'text-base font-bold text-slate-800' : 'text-xl font-bold text-slate-800'}>{title}</h2>
        <p className="text-xs text-slate-500">{text}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; tone?: 'slate' | 'amber' }> = ({ children, tone = 'slate' }) => (
  <span
    className={
      tone === 'amber'
        ? 'text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full whitespace-nowrap'
        : 'text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded whitespace-nowrap'
    }
  >
    {children}
  </span>
);

export const TableWrap: React.FC<{ children: React.ReactNode; soft?: boolean }> = ({ children, soft }) => {
  const theme = useTheme();
  const head =
    theme === 'stores'
      ? '[&_thead_th]:bg-slate-50 [&_thead_th]:text-slate-500 [&_thead_th]:text-[11px] [&_thead_th]:p-3.5 [&_thead_th]:border-slate-200 [&_tbody_td]:p-3.5 [&_tbody_td]:border-slate-200 text-slate-600'
      : soft
        ? '[&_thead_th]:bg-slate-100 [&_thead_th]:text-slate-600 [&_thead_th]:text-xs [&_thead_th]:font-semibold [&_thead_th]:tracking-normal [&_thead_th]:p-2.5 [&_thead_th]:border-0 [&_tbody_td]:p-2.5 text-slate-700'
        : '[&_thead_th]:bg-slate-800 [&_thead_th]:text-white [&_thead_th]:text-xs [&_thead_th]:p-3 [&_thead_th]:border-0 [&_tbody_td]:p-3 [&_tbody_td]:border-slate-200 text-slate-700';
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-xs ${head} [&_tbody_tr:hover]:bg-slate-50`}>{children}</table>
    </div>
  );
};
export const th = 'px-3 py-2.5 font-bold uppercase tracking-wider border-b whitespace-nowrap';
export const td = 'px-3 py-2.5 border-b border-slate-100 align-middle';
export const Empty: React.FC<{ cols: number; text: string }> = ({ cols, text }) => (
  <tr>
    <td colSpan={cols} className="px-3 py-10 text-center text-slate-400 text-xs">
      {text}
    </td>
  </tr>
);

export const BarList: React.FC<{ rows: { label: string; value: number }[]; format?: (n: number) => string; empty?: string }> = ({
  rows,
  format = (n) => ksh(n),
  empty = 'Nothing to show yet.',
}) => {
  const max = Math.max(0, ...rows.map((r) => r.value));
  if (!rows.length || max <= 0) return <p className="text-xs text-slate-400 py-8 text-center">{empty}</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} title={`${r.label}: ${format(r.value)}`} className="group">
          <div className="flex justify-between gap-2 text-[11px] mb-1">
            <span className="font-semibold text-slate-700 truncate">{r.label}</span>
            <span className="text-slate-600 font-bold whitespace-nowrap">{format(r.value)}</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-600 group-hover:bg-sky-700 rounded-full"
              style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const Doughnut: React.FC<{
  rows: { label: string; value: number }[];
  colors: string[];
  format?: (n: number) => string;
  legend?: 'top' | 'bottom';
  empty?: string;
  size?: number;
}> = ({ rows, colors, format = (n) => ksh(n), legend = 'bottom', empty = 'Nothing to show yet.', size = 200 }) => {
  const [hover, setHover] = React.useState<number | null>(null);
  const shown = rows.filter((r) => r.value > 0);
  const total = shown.reduce((s, r) => s + r.value, 0);
  if (!total) return <p className="text-xs text-slate-400 py-16 text-center">{empty}</p>;
  const R = 50,
    r0 = 25;
  let a = -Math.PI / 2;
  const arcs = shown.map((row, i) => {
    const sweep = (row.value / total) * Math.PI * 2;
    const a0 = a;
    const a1 = a + Math.min(sweep, Math.PI * 2 - 0.0001);
    a += sweep;
    const pt = (rad: number, ang: number) => `${(60 + rad * Math.cos(ang)).toFixed(3)},${(60 + rad * Math.sin(ang)).toFixed(3)}`;
    const big = a1 - a0 > Math.PI ? 1 : 0;
    return { row, i, d: `M${pt(R, a0)} A${R},${R} 0 ${big} 1 ${pt(R, a1)} L${pt(r0, a1)} A${r0},${r0} 0 ${big} 0 ${pt(r0, a0)} Z` };
  });
  const colorOf = (label: string) => colors[rows.findIndex((x) => x.label === label) % colors.length];
  const Legend = (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-slate-600">
      {shown.map((x, i) => (
        <span
          key={x.label}
          className="inline-flex items-center gap-1.5 cursor-default"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <span className="w-3 h-2.5 inline-block" style={{ background: colorOf(x.label) }} />
          {x.label}
        </span>
      ))}
    </div>
  );
  const h = hover !== null ? shown[hover] : null;
  return (
    <div className="space-y-3">
      {legend === 'top' && Legend}
      <div className="relative mx-auto" style={{ maxWidth: size }}>
        <svg viewBox="0 0 120 120" className="w-full h-auto" role="img" aria-label="Share chart" onMouseLeave={() => setHover(null)}>
          {arcs.map(({ row, i, d }) => (
            <path
              key={row.label}
              d={d}
              fill={colorOf(row.label)}
              stroke="#fff"
              strokeWidth={0.8}
              opacity={hover === null || hover === i ? 1 : 0.55}
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>
        {h && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-2 bg-slate-900/90 text-white text-[11px] px-2 py-1 rounded-md pointer-events-none whitespace-nowrap">
            {h.label}: {format(h.value)} ({((h.value / total) * 100).toFixed(1)}%)
          </div>
        )}
      </div>
      {legend === 'bottom' && Legend}
    </div>
  );
};

export const LineChart: React.FC<{
  points: { label: string; value: number }[];
  format?: (n: number) => string;
  height?: number;
  series?: string;
  color?: string;
}> = ({ points, format = (n) => num(n), height = 230, series, color = '#009cf0' }) => {
  const [hover, setHover] = React.useState<number | null>(null);
  const W = 520,
    H = height,
    L = 52,
    R = 14,
    T = 10,
    B = 24;
  const vals = points.map((p) => p.value);
  const hi = Math.max(1, ...vals),
    lo = Math.min(...vals, hi);
  const span = hi - lo || hi;
  const step0 = span / 9;
  const mag = Math.pow(10, Math.floor(Math.log10(step0 || 1)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) || mag * 10;
  const bottom = Math.max(0, Math.floor(lo / step) * step),
    top = Math.ceil(hi / step) * step || step;
  const ticks: number[] = [];
  for (let v = bottom; v <= top + step / 2; v += step) ticks.push(v);
  const x = (i: number) => L + (points.length <= 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (points.length - 1));
  const y = (v: number) => T + (H - T - B) * (1 - (v - bottom) / (top - bottom || 1));

  const P = points.map((p, i) => [x(i), y(p.value)]);
  let path = P.length ? `M${P[0][0]},${P[0][1]}` : '';
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i],
      p1 = P[i],
      p2 = P[i + 1],
      p3 = P[i + 2] || p2;
    const t = 0.15;
    const cy = (v: number) => Math.min(H - B, Math.max(T, v));
    path += ` C${p1[0] + (p2[0] - p0[0]) * t},${cy(p1[1] + (p2[1] - p0[1]) * t)} ${p2[0] - (p3[0] - p1[0]) * t},${cy(p2[1] - (p3[1] - p1[1]) * t)} ${p2[0]},${p2[1]}`;
  }
  return (
    <div className="relative">
      {series && (
        <div className="flex justify-center items-center gap-2 text-xs text-slate-600 mb-1">
          <span className="inline-block w-10 h-3 border-2" style={{ borderColor: color, background: `${color}1a` }} />
          {series}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Trend chart" onMouseLeave={() => setHover(null)}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#e5e7eb" strokeWidth={1} />
            <text x={L - 6} y={y(v) + 3} textAnchor="end" fontSize={11} fill="#666">
              {num(v)}
            </text>
          </g>
        ))}
        {points.map((p, i) => (
          <line key={`g${p.label}`} x1={x(i)} x2={x(i)} y1={T} y2={H - B} stroke="#e5e7eb" strokeWidth={1} />
        ))}
        {P.length > 1 && <path d={`${path} L${x(points.length - 1)},${H - B} L${x(0)},${H - B} Z`} fill={color} opacity={0.1} />}
        <path d={path} fill="none" stroke={color} strokeWidth={2.5} />
        {points.map((p, i) => (
          <g key={p.label}>
            <text x={x(i)} y={H - 6} textAnchor="middle" fontSize={11} fill="#666">
              {p.label}
            </text>
            <circle cx={x(i)} cy={y(p.value)} r={hover === i ? 5 : 3} fill={`${color}1a`} stroke={color} strokeWidth={1.5} />
            <rect x={x(i) - 25} y={T} width={50} height={H - T - B} fill="transparent" onMouseEnter={() => setHover(i)} />
          </g>
        ))}
      </svg>
      {hover !== null && points[hover] && (
        <div
          className="absolute bg-slate-900/85 text-white text-[11px] px-2 py-1 rounded-md pointer-events-none whitespace-nowrap"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(points[hover].value) / H) * 100}%`, transform: 'translate(-50%, -130%)' }}
        >
          <b>{points[hover].label}</b>
          <br />
          {series ? `${series}: ` : ''}
          {format(points[hover].value)}
        </div>
      )}
    </div>
  );
};

export const downloadCsv = (fileName: string, rows: (string | number)[][]) => {
  const text = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
