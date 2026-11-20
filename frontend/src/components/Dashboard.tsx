import React, { useMemo, useState } from 'react';
import {
  Activity,
  BedDouble,
  Building2,
  CalendarCheck,
  ClipboardList,
  Layers,
  PieChart,
  ShieldCheck,
  Truck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { Patient, Bill, LabTestOrder, QueueItem, ModuleType, InpatientAdmission, Bed, InventoryItem } from '../types';
import { dayPostings } from './erp/finance/RevenueTab';

interface DashboardProps {
  patients: Patient[];
  bills: Bill[];
  labOrders: LabTestOrder[];
  queue: QueueItem[];
  inpatientAdmissions?: InpatientAdmission[];
  beds?: Bed[];
  inventory?: InventoryItem[];
  setActiveModule: (module: ModuleType) => void;
  onQuickRegister: () => void;

  canOpen?: (module: ModuleType) => boolean;

  roleMissing?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayOf = (v: unknown) => String(v ?? '').slice(0, 10);
const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString('en-KE')}`;
const short = (n: number) =>
  n >= 1e6 ? `KSh ${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, '')}M` : n >= 1e4 ? `KSh ${Math.round(n / 1000)}k` : ksh(n);
const isIpd = (b: Bill) =>
  /^IPD-/i.test(b.id) || /inpatient/i.test(String((b as any).invoiceType || '')) || (b as any).encounterType === 'IP';

type PayerKind = 'Direct Cash' | 'SHA Scheme' | 'Corporate';
const payerOf = (b: Bill): { name: string; kind: PayerKind } => {
  const named = String(b.billingPayer || b.insuranceProvider || '').trim();
  const method = String(b.paymentMethod || '');
  if (!named || /^(cash|self|patient|private cash|walk)/i.test(named))
    return /sha|nhif/i.test(method) ? { name: 'SHA', kind: 'SHA Scheme' } : { name: 'Cash / M-Pesa', kind: 'Direct Cash' };
  if (/\bsha\b|shif|nhif|social health|phc|primary health/i.test(named)) return { name: named, kind: 'SHA Scheme' };
  return { name: named, kind: 'Corporate' };
};
const DEPT_OF_CATEGORY: Record<string, string> = {
  Consultation: 'OPD',
  Laboratory: 'Laboratory',
  Pharmacy: 'Pharmacy',
  Radiology: 'Radiology',
  Procedure: 'Procedures',
  'Nursing / Bed': 'Inpatient',
};

const SHORT_DEPT: Record<string, string> = {
  'IPD Billing & Wards': 'IPD',
  'Procedures & Theatre': 'Procedures',
  'OPD Consultation': 'OPD',
  'Radiology & Imaging': 'Radiology',
  'Other Income': 'Other',
  'Dental & Eye Clinic': 'Dental & Eye',
};
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const startOfWeek = (d: Date) => {
  const x = new Date(d);
  const k = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - k);
  x.setHours(0, 0, 0, 0);
  return x;
};

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
};
const Bars: React.FC<{
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  stacked?: boolean;
  money?: boolean;
  height?: number;
  width?: number;
}> = ({ labels, series, stacked, money, height = 220, width = 600 }) => {
  const [hover, setHover] = useState<number | null>(null);
  const totals = labels.map((_, i) =>
    stacked ? series.reduce((s, x) => s + (x.values[i] || 0), 0) : Math.max(0, ...series.map((x) => x.values[i] || 0)),
  );
  const max = niceMax(Math.max(0, ...totals));
  const W = width,
    H = height,
    L = money ? 64 : 36,
    B = 26,
    T = 8;
  const plotW = W - L - 8,
    plotH = H - B - T,
    slot = plotW / Math.max(1, labels.length);
  const fmt = (v: number) => (money ? short(v).replace('KSh ', '') : Math.round(v).toLocaleString());
  return (
    <div className="relative">
      {series.length > 1 && (
        <div className="flex flex-wrap justify-center gap-4 mb-2 text-[11px] font-semibold text-slate-600">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 inline-block" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" onMouseLeave={() => setHover(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = T + plotH * (1 - f);
          return (
            <g key={f}>
              <line x1={L} x2={W - 8} y1={y} y2={y} stroke="#e2e8f0" />
              <text x={L - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#64748b">
                {fmt(max * f)}
              </text>
            </g>
          );
        })}
        {labels.map((lab, i) => {
          const x0 = L + slot * i;
          const bw = stacked ? slot * 0.5 : (slot * 0.62) / series.length;
          let acc = 0;
          return (
            <g key={lab} onMouseEnter={() => setHover(i)}>
              <rect x={x0} y={T} width={slot} height={plotH} fill={hover === i ? '#f1f5f9' : 'transparent'} />
              {series.map((s, k) => {
                const v = s.values[i] || 0;
                const h = (v / max) * plotH;
                const x = stacked ? x0 + (slot - bw) / 2 : x0 + slot * 0.19 + bw * k;
                const y = stacked ? T + plotH - acc - h : T + plotH - h;
                acc += stacked ? h : 0;
                return h > 0 ? <rect key={s.name} x={x} y={y} width={bw * 0.92} height={h} rx={stacked ? 0 : 4} fill={s.color} /> : null;
              })}
              <text x={x0 + slot / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#475569" fontWeight="600">
                {lab}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="absolute top-6 right-2 bg-slate-900 text-white text-[11px] rounded-lg px-3 py-2 shadow-lg pointer-events-none">
          <div className="font-bold mb-0.5">{labels[hover]}</div>
          {series.map((s) => (
            <div key={s.name}>
              {s.name}: <b>{money ? ksh(s.values[hover] || 0) : (s.values[hover] || 0).toLocaleString()}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
const Ring: React.FC<{ rows: { label: string; value: number; color: string }[] }> = ({ rows }) => {
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!total) return <p className="text-xs text-slate-400 py-20 text-center">No payments recorded this month yet.</p>;
  let a = -Math.PI / 2;
  const R = 50,
    r0 = 34;
  const pt = (rad: number, ang: number) => `${(60 + rad * Math.cos(ang)).toFixed(3)},${(60 + rad * Math.sin(ang)).toFixed(3)}`;
  return (
    <div className="space-y-4">
      <svg viewBox="0 0 120 120" className="w-56 h-56 mx-auto block" role="img" aria-label="Revenue streams">
        {rows
          .filter((r) => r.value > 0)
          .map((r) => {
            const sweep = (r.value / total) * Math.PI * 2;
            const a0 = a;
            const a1 = a + Math.min(sweep, Math.PI * 2 - 0.0001);
            a += sweep;
            const big = a1 - a0 > Math.PI ? 1 : 0;
            return (
              <path
                key={r.label}
                d={`M${pt(R, a0)} A${R},${R} 0 ${big} 1 ${pt(R, a1)} L${pt(r0, a1)} A${r0},${r0} 0 ${big} 0 ${pt(r0, a0)} Z`}
                fill={r.color}
                stroke="#fff"
                strokeWidth={1}
              >
                <title>{`${r.label}: ${ksh(r.value)}`}</title>
              </path>
            );
          })}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-700">
        {rows.map((r) => (
          <span key={r.label} className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: r.color }} />
            {r.label} {Math.round((r.value / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
};
const Card: React.FC<{
  title: React.ReactNode;
  icon: React.ReactNode;
  right?: React.ReactNode;
  sub?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, right, sub, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_rgba(11,20,32,0.06)] p-5 ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
      <div>
        <h3 className="font-extrabold text-slate-900 text-[15px] flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);
const Pill: React.FC<{ tone: string; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tone}`}>{children}</span>
);

export const Dashboard: React.FC<DashboardProps> = ({
  patients,
  bills,
  queue,
  inpatientAdmissions = [],
  beds = [],
  inventory = [],
  setActiveModule,
  onQuickRegister,
  canOpen = () => true,
  roleMissing = '',
}) => {
  const now = new Date();
  const today = ymd(now);
  const go = (m: ModuleType) => {
    if (canOpen(m)) setActiveModule(m);
  };
  const [period, setPeriod] = useState<'week' | 'today' | 'month'>('week');
  const [payerTab, setPayerTab] = useState<'all' | 'SHA Scheme' | 'Corporate'>('all');

  const yesterday = ymd(new Date(now.getTime() - 86400000));
  const newToday = patients.filter((p) => dayOf((p as any).registeredDate || (p as any).registrationDate) === today).length;
  const newYesterday = patients.filter((p) => dayOf((p as any).registeredDate || (p as any).registrationDate) === yesterday).length;
  const visitsToday = queue.filter((q) => q.currentStation !== 'Discharged').length;
  const admitted = inpatientAdmissions.filter((a) => a.status === 'Admitted').length;
  const occupied = beds.filter((b) => b.status === 'Occupied').length;
  const bedsTotal = beds.length;
  const postingsToday = useMemo(() => dayPostings(bills, [], today), [bills, today]);
  const revenueToday = postingsToday.reduce((s, p) => s + p.amount, 0);
  const shaPending = useMemo(
    () =>
      bills
        .filter(
          (b) => payerOf(b).kind === 'SHA Scheme' && Number(b.balance || 0) > 0 && !/cancel|void|waived/i.test(String(b.status || '')),
        )
        .reduce((s, b) => s + Number(b.balance || 0), 0),
    [bills],
  );

  const weekVolume = useMemo(() => {
    const from = ymd(new Date(now.getTime() - 6 * 86400000));
    const sets: Record<string, Set<string>> = {};
    bills
      .filter((b) => dayOf(b.date) >= from && dayOf(b.date) <= today)
      .forEach((b) => {
        (b.items || []).forEach((i) => {
          const d = isIpd(b) ? 'Inpatient' : DEPT_OF_CATEGORY[String(i.category)] || 'Other';
          (sets[d] ||= new Set()).add(b.patientId || b.id);
        });
      });
    const order = ['OPD', 'Laboratory', 'Pharmacy', 'Radiology', 'Procedures', 'Inpatient', 'Other'];
    return order.filter((d) => sets[d]?.size).map((d) => ({ label: d, value: sets[d].size }));
  }, [bills, today]);

  const month = today.slice(0, 7);
  const streams = useMemo(() => {
    const t = { cash: 0, sha: 0, corp: 0 };
    bills
      .filter((b) => dayOf(b.date).slice(0, 7) === month)
      .forEach((b) => {
        const p = payerOf(b);
        const paid = Number(b.amountPaid || 0);
        if (p.kind === 'Direct Cash') t.cash += paid;
        else {
          const covered = Math.max(0, Number(b.totalAmount || 0) - Number(b.balance || 0));
          if (p.kind === 'SHA Scheme') t.sha += covered || paid;
          else t.corp += covered || paid;
        }
      });
    return [
      { label: 'M-Pesa & Cash', value: t.cash, color: '#0288d1' },
      { label: 'SHA', value: t.sha, color: '#10b981' },
      { label: 'Corporate Insurance', value: t.corp, color: '#8b5cf6' },
    ];
  }, [bills, month]);

  const ipdOpd = useMemo(() => {
    const paid = (b: Bill) =>
      Number(b.amountPaid || 0) +
      (payerOf(b).kind !== 'Direct Cash'
        ? Math.max(0, Number(b.totalAmount || 0) - Number(b.amountPaid || 0) - Number(b.balance || 0))
        : 0);
    if (period === 'today') {
      const day = bills.filter((b) => dayOf(b.date) === today);
      return {
        labels: ['Today'],
        opd: [day.filter((b) => !isIpd(b)).reduce((s, b) => s + paid(b), 0)],
        ipd: [day.filter(isIpd).reduce((s, b) => s + paid(b), 0)],
      };
    }
    if (period === 'month') {
      const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
      const opd = [0, 0, 0, 0, 0],
        ipd = [0, 0, 0, 0, 0];
      bills
        .filter((b) => dayOf(b.date).slice(0, 7) === month)
        .forEach((b) => {
          const w = Math.min(4, Math.floor((Number(dayOf(b.date).slice(8, 10)) - 1) / 7));
          (isIpd(b) ? ipd : opd)[w] += paid(b);
        });
      return { labels, opd, ipd };
    }
    const start = startOfWeek(now);
    const opd = [0, 0, 0, 0, 0, 0, 0],
      ipd = [0, 0, 0, 0, 0, 0, 0];
    bills.forEach((b) => {
      const d = new Date(`${dayOf(b.date)}T12:00:00`);
      const k = Math.floor((d.getTime() - start.getTime()) / 86400000);
      if (k >= 0 && k < 7) (isIpd(b) ? ipd : opd)[k] += paid(b);
    });
    return { labels: WEEKDAYS, opd, ipd };
  }, [bills, period, today, month]);

  const payers = useMemo(() => {
    const t: Record<
      string,
      { name: string; kind: PayerKind; opd: number; ipd: number; pending: number; billed: number; patients: Set<string> }
    > = {};
    bills
      .filter((b) => dayOf(b.date).slice(0, 7) === month && !/cancel|void/i.test(String(b.status || '')))
      .forEach((b) => {
        const p = payerOf(b);
        const row = (t[p.name] ||= { name: p.name, kind: p.kind, opd: 0, ipd: 0, pending: 0, billed: 0, patients: new Set() });
        const got = Math.max(0, Number(b.totalAmount || 0) - Number(b.balance || 0));
        if (isIpd(b)) row.ipd += got;
        else row.opd += got;
        row.pending += Math.max(0, Number(b.balance || 0));
        row.billed += Number(b.totalAmount || 0);
        row.patients.add(b.patientId || b.id);
      });
    return Object.values(t).sort((a, z) => z.opd + z.ipd - (a.opd + a.ipd));
  }, [bills, month]);
  const payersShown = payers.filter((p) => payerTab === 'all' || p.kind === payerTab);
  const kindTone: Record<PayerKind, { badge: string; card: string; text: string; dot: string }> = {
    'Direct Cash': {
      badge: 'bg-emerald-600 text-white',
      card: 'bg-emerald-50/40 border-emerald-200',
      text: 'text-emerald-800',
      dot: 'bg-emerald-500',
    },
    'SHA Scheme': {
      badge: 'bg-purple-600 text-white',
      card: 'bg-purple-50/40 border-purple-200',
      text: 'text-purple-800',
      dot: 'bg-purple-500',
    },
    Corporate: { badge: 'bg-blue-600 text-white', card: 'bg-blue-50/40 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
  };

  const minutesWaiting = (q: QueueItem) => {
    const raw = String(q.arrivedTime || '');
    const t = /^\d{1,2}:\d{2}/.test(raw) ? new Date(`${today}T${raw.slice(0, 5)}:00`) : new Date(raw.replace(' ', 'T'));
    const m = (now.getTime() - t.getTime()) / 60000;
    return Number.isFinite(m) && m >= 0 ? m : 0;
  };
  const waiting = queue.filter((q) => q.currentStation !== 'Discharged' && q.status !== 'Completed');
  const triageLevels = (
    [
      ['Emergency', 'Emergency', 'bg-rose-50 border-rose-200 text-rose-700'],
      ['Urgent', 'Urgent', 'bg-amber-50 border-amber-200 text-amber-700'],
      ['Normal', 'Normal / Non-urgent', 'bg-emerald-50 border-emerald-200 text-emerald-700'],
    ] as const
  ).map(([key, label, tone]) => {
    const list = waiting.filter((q) => (q.priority || 'Normal') === key);
    return {
      key,
      label,
      tone,
      n: list.length,
      wait: list.length ? Math.round(list.reduce((s, q) => s + minutesWaiting(q), 0) / list.length) : 0,
    };
  });
  const atTriage = waiting.filter((q) => q.currentStation === 'Triage').length;
  const atDoctor = waiting.filter((q) => q.currentStation === 'Consultation').length;

  const wards = useMemo(() => {
    const t: Record<string, { name: string; used: number; total: number }> = {};
    beds.forEach((b) => {
      const k = b.wardName || b.wardId || 'Ward';
      const w = (t[k] ||= { name: k, used: 0, total: 0 });
      w.total++;
      if (b.status === 'Occupied') w.used++;
    });
    return Object.values(t).sort((a, z) => z.total - a.total);
  }, [beds]);
  const wardColors = ['bg-emerald-500', 'bg-indigo-600', 'bg-blue-600', 'bg-amber-500', 'bg-purple-600', 'bg-cyan-600'];

  const reorders = useMemo(
    () =>
      inventory
        .filter((i) => Number(i.reorderLevel) > 0 && Number(i.stockQuantity) <= Number(i.reorderLevel))
        .sort(
          (a, z) =>
            Number(a.stockQuantity) / Math.max(1, Number(a.reorderLevel)) - Number(z.stockQuantity) / Math.max(1, Number(z.reorderLevel)),
        ),
    [inventory],
  );

  const deptToday = useMemo(() => {
    const t: Record<string, { cash: number; ins: number }> = {};
    postingsToday.forEach((p) =>
      Object.entries(p.byDept).forEach(([d, v]) => {
        const x = (t[d] ||= { cash: 0, ins: 0 });
        x.cash += v.cash;
        x.ins += v.insurance;
      }),
    );
    return Object.entries(t)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, z) => z.cash + z.ins - (a.cash + a.ins))
      .slice(0, 7);
  }, [postingsToday]);

  const headline = [
    {
      label: 'Total Patients',
      value: patients.length.toLocaleString(),
      note: newToday || newYesterday ? `${newToday} registered today (${newYesterday} yesterday)` : 'Registered in WiseCare',
      bg: 'bg-[#1d82db]',
      icon: Users,
      m: 'patients' as ModuleType,
    },
    {
      label: "Today's Visits",
      value: visitsToday.toLocaleString(),
      note: 'OPD & Specialty Clinics',
      bg: 'bg-[#2e8b3b]',
      icon: CalendarCheck,
      m: 'queue' as ModuleType,
    },
    {
      label: 'Inpatients (IPD)',
      value: admitted.toLocaleString(),
      note: bedsTotal ? `${occupied}/${bedsTotal} Beds (${Math.round((occupied / bedsTotal) * 100)}%)` : 'No beds set up',
      bg: 'bg-[#4739cc]',
      icon: BedDouble,
      m: 'inpatient' as ModuleType,
    },
    {
      label: 'Today Revenue',
      value: short(revenueToday),
      note: 'Cash + M-Pesa + SHA',
      bg: 'bg-[#ed6c02]',
      icon: Wallet,
      m: 'finance' as ModuleType,
    },
    {
      label: 'Pending SHA Claims',
      value: short(shaPending),
      note: 'Awaiting SHA payment',
      bg: 'bg-[#7b1fa2]',
      icon: ShieldCheck,
      m: 'sha_claims' as ModuleType,
    },
  ];

  return (
    <div id="dashboard-view" className="p-6 max-w-[1440px] mx-auto space-y-6 bg-[#f4f7fa]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 text-sm">Welcome to WiseCare HMIS</p>
        </div>
        {canOpen('patients') && (
          <button
            id="btn-quick-register-dashboard"
            onClick={onQuickRegister}
            className="text-xs font-bold text-white bg-[#005bb5] hover:bg-[#00468e] px-4 py-2 rounded-lg inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Register New Patient
          </button>
        )}
      </div>
      {roleMissing && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-sm">
          <b>Your role "{roleMissing}" has no access rights set up yet.</b> Ask the System Administrator to create this role in Users &amp;
          Security → Roles and tick the modules you work in.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {headline.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => go(c.m)}
              className={`${c.bg} text-left text-white rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between gap-3`}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/85">{c.label}</p>
                <p className="text-3xl font-black mt-1 truncate">{c.value}</p>
                <p className="text-[11px] text-white/85 mt-1">{c.note}</p>
              </div>
              <span className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" />
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Weekly Departmental Patient Volume"
          icon={<Activity className="w-4 h-4 text-blue-600" />}
          right={<span className="text-xs text-slate-400">Last 7 days</span>}
        >
          {weekVolume.length ? (
            <Bars
              labels={weekVolume.map((x) => x.label)}
              series={[{ name: 'Patients', color: '#0288d1', values: weekVolume.map((x) => x.value) }]}
            />
          ) : (
            <p className="text-xs text-slate-400 py-20 text-center">No patients billed in the last 7 days.</p>
          )}
        </Card>
        <Card
          title="Revenue Stream Breakdown (KSh)"
          icon={<PieChart className="w-4 h-4 text-emerald-600" />}
          right={<Pill tone="bg-slate-100 text-slate-700">This Month</Pill>}
        >
          <Ring rows={streams} />
        </Card>
      </div>

      <Card
        title="Inpatient (IPD) vs Outpatient (OPD) Collection Analysis"
        icon={<Wallet className="w-4 h-4 text-emerald-600" />}
        sub="Revenue split comparison across care delivery channels"
        right={
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
            Filter Period:
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 bg-white"
            >
              <option value="week">This Week</option>
              <option value="today">Today</option>
              <option value="month">This Month</option>
            </select>
          </label>
        }
      >
        <Bars
          money
          labels={ipdOpd.labels}
          series={[
            { name: 'Outpatient (OPD) Collections', color: '#0288d1', values: ipdOpd.opd },
            { name: 'Inpatient (IPD) Collections', color: '#10b981', values: ipdOpd.ipd },
          ]}
          height={300}
          width={1300}
        />
      </Card>

      <Card
        title="Collections by Patient Sub-Category & Payer"
        icon={<Layers className="w-4 h-4 text-indigo-600" />}
        sub="Breakdown across Cash, Corporate Insurances & SHA Statutory Schemes (this month)"
        right={
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'All Scheme Types'],
                ['SHA Scheme', 'SHA Schemes'],
                ['Corporate', 'Corporate Insurances'],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPayerTab(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${payerTab === k ? 'bg-[#005bb5] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {l}
              </button>
            ))}
          </div>
        }
      >
        {payersShown.length ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
              {payersShown.slice(0, 8).map((p) => {
                const tone = kindTone[p.kind];
                const got = p.opd + p.ipd;
                return (
                  <div key={p.name} className={`border rounded-xl p-4 ${tone.card}`}>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${tone.badge}`}>{p.kind}</span>
                    <p className="mt-2 font-bold text-slate-800 truncate" title={p.name}>
                      {p.name}
                    </p>
                    <p className={`text-xl font-black ${tone.text}`}>{ksh(got)}</p>
                    <div className="flex justify-between text-[11px] mt-1 text-slate-600">
                      <span>{p.kind === 'Direct Cash' ? `Patients: ${p.patients.size}` : `Pending: ${short(p.pending)}`}</span>
                      <b className={tone.text}>
                        {p.billed ? `${Math.round((got / p.billed) * 100)}% ${p.kind === 'Direct Cash' ? 'Cleared' : 'Collected'}` : ''}
                      </b>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs min-w-[760px]">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
                  <tr>
                    {[
                      'Payer Sub-Category',
                      'Category Type',
                      'Outpatient Revenue',
                      'Inpatient Revenue',
                      'Total Collections',
                      'Pending Reconciliation',
                      'Action',
                    ].map((h) => (
                      <th key={h} className="px-3 py-3 text-left font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payersShown.map((p) => {
                    const tone = kindTone[p.kind];
                    return (
                      <tr key={p.name} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-bold text-slate-800">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${tone.dot}`} />
                          {p.name}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tone.card} ${tone.text}`}>{p.kind}</span>
                        </td>
                        <td className="px-3 py-2.5">{ksh(p.opd)}</td>
                        <td className="px-3 py-2.5">{ksh(p.ipd)}</td>
                        <td className={`px-3 py-2.5 font-black ${p.kind === 'Direct Cash' ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {ksh(p.opd + p.ipd)}
                        </td>
                        <td className={`px-3 py-2.5 ${p.pending > 0 ? 'text-orange-700 font-semibold' : 'text-slate-400'}`}>
                          {p.pending > 0 ? ksh(p.pending) : 'KSh 0 (Settled)'}
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => go(p.kind === 'SHA Scheme' ? 'sha_claims' : 'billing')}
                            className="text-blue-700 font-bold hover:underline"
                          >
                            {p.kind === 'SHA Scheme' ? 'Audit Batch' : 'View'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-400 py-10 text-center">No bills for this payer type this month.</p>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Outpatient & Triage Management"
          icon={<ClipboardList className="w-4 h-4 text-blue-600" />}
          right={<Pill tone="bg-blue-50 text-blue-700">{visitsToday} Visits Today</Pill>}
        >
          <div className="grid grid-cols-3 gap-3 mb-4">
            {triageLevels.map((t) => (
              <button key={t.key} type="button" onClick={() => go('queue')} className={`border rounded-xl p-3 text-center ${t.tone}`}>
                <p className="text-[10px] font-black uppercase">{t.label}</p>
                <p className="text-2xl font-black">{t.n}</p>
                <p className="text-[10px]">{t.n ? `${t.wait} min avg wait` : 'none waiting'}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => go('triage')}
            className="w-full flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 mb-2 text-sm font-bold text-slate-800"
          >
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2" />
              Active Triage Queue
            </span>
            <Pill tone="bg-amber-100 text-amber-800">
              {atTriage} Patient{atTriage === 1 ? '' : 's'}
            </Pill>
          </button>
          <button
            type="button"
            onClick={() => go('consultation')}
            className="w-full flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 text-sm font-bold text-slate-800"
          >
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-2" />
              Doctor Consultation Desk
            </span>
            <Pill tone="bg-blue-100 text-blue-800">{atDoctor} Waiting</Pill>
          </button>
        </Card>
        <Card
          title="Inpatient (IPD) & Ward Occupancy"
          icon={<BedDouble className="w-4 h-4 text-indigo-600" />}
          right={
            <Pill tone="bg-purple-50 text-purple-700">
              {occupied}/{bedsTotal} Beds{bedsTotal ? ` (${Math.round((occupied / bedsTotal) * 100)}%)` : ''}
            </Pill>
          }
        >
          {wards.length ? (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {wards.map((w, i) => {
                const pct = w.total ? Math.round((w.used / w.total) * 100) : 0;
                return (
                  <div key={w.name}>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700">{w.name}</span>
                      <span className="font-bold text-slate-900">
                        {w.used} / {w.total} Beds <span className="text-slate-500 font-semibold">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full mt-1">
                      <div className={`h-2.5 rounded-full ${wardColors[i % wardColors.length]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-10 text-center">No wards or beds set up yet.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Procurement & Critical Reorders"
          icon={<Truck className="w-4 h-4 text-orange-600" />}
          right={
            <Pill tone="bg-orange-50 text-orange-700">
              {reorders.length} Reorder Alert{reorders.length === 1 ? '' : 's'}
            </Pill>
          }
        >
          {reorders.length ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {reorders.slice(0, 20).map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-3 border border-amber-200 bg-amber-50/40 rounded-xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{i.name}</p>
                    <p className="text-xs text-slate-500">
                      Stock: {Number(i.stockQuantity).toLocaleString()} {String(i.form || 'units').toLowerCase()} (Min:{' '}
                      {Number(i.reorderLevel).toLocaleString()})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => go('procurement_stores')}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0"
                  >
                    Create PO
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-10 text-center">Every item is above its reorder level.</p>
          )}
        </Card>
        <Card
          title="Revenue Collections & Claims"
          icon={<Building2 className="w-4 h-4 text-emerald-700" />}
          right={<Pill tone="bg-emerald-50 text-emerald-800">{ksh(revenueToday)} Today</Pill>}
        >
          {deptToday.length ? (
            <Bars
              money
              stacked
              labels={deptToday.map((d) => SHORT_DEPT[d.name] || d.name.replace(/^Procedures — /, '').split(/\s[&/]\s/)[0])}
              series={[
                { name: 'Cash/M-Pesa', color: '#10b981', values: deptToday.map((d) => d.cash) },
                { name: 'SHA/Insurance', color: '#8b5cf6', values: deptToday.map((d) => d.ins) },
              ]}
            />
          ) : (
            <p className="text-xs text-slate-400 py-16 text-center">No collections recorded today yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
};
