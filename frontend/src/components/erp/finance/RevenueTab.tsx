import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BedDouble, CheckCheck, CircleDollarSign, IdCard, PlusCircle, Printer, Store } from 'lucide-react';
import { Bill } from '../../../types';
import { apiClient } from '../../../services/apiClient';
import { printCashReceipt, printOfficeDocument, officeEsc as e, officeMoney as m, officeSection } from '../../PrintDocuments';
import {
  Badge,
  Chip,
  Doughnut,
  Empty,
  Field,
  FormButtons,
  Kpi,
  Modal,
  Panel,
  Row,
  SectionHead,
  TableWrap,
  btn,
  dayOf,
  erpList,
  erpSave,
  inputCls,
  ksh,
  newId,
  td,
  th,
  today,
} from '../erpShared';

export const REVENUE_DEPTS = [
  'OPD Consultation',
  'Pharmacy',
  'Laboratory',
  'Radiology & Imaging',
  'Procedures & Theatre',
  'IPD Billing & Wards',
  'Dental & Eye Clinic',
  'Other Income',
];
const CHANNELS = ['Cash', 'M-Pesa', 'Card / Bank', 'Insurance / SHA'] as const;
type Channel = (typeof CHANNELS)[number];

const isIpd = (b: Bill) => /^IPD-/i.test(b.id) || /inpatient/i.test(String(b.invoiceType || ''));
const channelOf = (method: string): Channel =>
  /sha|nhif|insur/i.test(method)
    ? 'Insurance / SHA'
    : /m-?pesa/i.test(method)
      ? 'M-Pesa'
      : /card|bank|cheque|eft/i.test(method)
        ? 'Card / Bank'
        : 'Cash';
const insuredBill = (b: Bill) =>
  /sha|nhif|insur/i.test(String(b.paymentMethod || '')) ||
  (!!b.billingPayer && !/^(cash|self|patient|private cash)/i.test(String(b.billingPayer)));

export type ProcDepts = { byId: Map<string, string>; byName: Map<string, string> };
const plainProc = (t: unknown) =>
  String(t ?? '')
    .replace(/^\s*(nursing\s+)?procedure\s*:\s*/i, '')
    .replace(/\s*\[.*?\]\s*$/, '')
    .trim()
    .toLowerCase();
const procDeptOf = (i: any, procs?: ProcDepts) => {
  if (!procs) return '';
  for (const k of [i.sourceEntityId, i.sourceId, i.code, i.itemCode]) {
    const d = k != null && k !== '' ? procs.byId.get(String(k)) : undefined;
    if (d) return d;
  }
  return procs.byName.get(plainProc(i.description)) || '';
};
const deptOf = (b: Bill, item: any, procs?: ProcDepts) => {
  if (isIpd(b)) return 'IPD Billing & Wards';
  const category = String(item?.category || '');

  if (category === 'Procedure' || /theatre|surg/i.test(category)) {
    const d = /theatre|surg/i.test(category) ? 'Theatre' : procDeptOf(item, procs);
    return d ? `Procedures — ${d}` : 'Procedures & Theatre';
  }
  return (
    (
      {
        Consultation: 'OPD Consultation',
        Pharmacy: 'Pharmacy',
        Laboratory: 'Laboratory',
        Radiology: 'Radiology & Imaging',
        'Nursing / Bed': 'IPD Billing & Wards',
      } as Record<string, string>
    )[category] || 'Other Income'
  );
};

export interface Posting {
  ref: string;
  date: string;
  department: string;
  payer: string;
  channel: string;
  amount: number;
  servedBy: string;
  kind: 'bill' | 'manual';
  byChannel: Partial<Record<Channel, number>>;
  byDept: Record<string, { cash: number; insurance: number }>;
  record?: Row;
}

const billPosting = (b: Bill, procs?: ProcDepts): Posting | null => {
  if (b.status === 'Waived') return null;
  const byChannel: Partial<Record<Channel, number>> = {};
  const add = (c: Channel, n: number) => {
    if (n > 0) byChannel[c] = (byChannel[c] || 0) + n;
  };
  if (b.paymentSplits?.length) b.paymentSplits.forEach((s) => add(channelOf(String(s.method || '')), Number(s.amount || 0)));
  else if (!insuredBill(b)) add(channelOf(String(b.paymentMethod || 'Cash')), Number(b.amountPaid || 0));
  const cash = (byChannel.Cash || 0) + (byChannel['M-Pesa'] || 0) + (byChannel['Card / Bank'] || 0);
  if (insuredBill(b)) add('Insurance / SHA', Math.max(0, Number(b.totalAmount || 0) - cash - (byChannel['Insurance / SHA'] || 0)));
  const insurance = byChannel['Insurance / SHA'] || 0;
  if (cash + insurance <= 0) return null;
  const items = (b.items || []).filter((i) => Number(i.total || 0) > 0);
  const weight = items.reduce((s, i) => s + Number(i.total || 0), 0);
  const byDept: Posting['byDept'] = {};
  if (!weight) byDept[isIpd(b) ? 'IPD Billing & Wards' : 'Other Income'] = { cash, insurance };
  items.forEach((i) => {
    const d = deptOf(b, i, procs);
    const share = Number(i.total || 0) / weight;
    byDept[d] = byDept[d] || { cash: 0, insurance: 0 };
    byDept[d].cash += cash * share;
    byDept[d].insurance += insurance * share;
  });
  const main = Object.entries(byDept).sort((a, z) => z[1].cash + z[1].insurance - (a[1].cash + a[1].insurance));
  return {
    ref: b.id,
    date: dayOf(b.date),
    department: main.length > 1 ? `${main[0][0]} +${main.length - 1}` : main[0]?.[0] || 'Other Income',
    payer: `${b.patientId} - ${b.patientName}`,
    channel: Object.keys(byChannel).join(' + '),
    amount: cash + insurance,
    servedBy: b.cashierName || '',
    kind: 'bill',
    byChannel,
    byDept,
  };
};
const manualPosting = (r: Row): Posting => {
  const c = channelOf(String(r.channel || 'Cash'));
  const amt = Number(r.amount || 0);
  return {
    ref: r.id,
    date: dayOf(r.date),
    department: r.department,
    payer: r.payer,
    channel: r.channel,
    amount: amt,
    servedBy: r.servedBy || r.createdBy || '',
    kind: 'manual',
    byChannel: { [c]: amt },
    byDept: { [r.department]: c === 'Insurance / SHA' ? { cash: 0, insurance: amt } : { cash: amt, insurance: 0 } },
    record: r,
  };
};

export const dayPostings = (bills: Bill[], manual: Row[], date: string, procs?: ProcDepts) => [
  ...manual.filter((r) => dayOf(r.date) === date && r.status !== 'Cancelled').map(manualPosting),
  ...(bills
    .filter((b) => dayOf(b.date) === date)
    .map((b) => billPosting(b, procs))
    .filter(Boolean) as Posting[]),
];

const otcAsBills = (sales: any[], bills: Bill[]): Bill[] => {
  const known = new Set(bills.map((b) => b.id));
  return sales
    .filter((x) => x.invoice_id && !known.has(x.invoice_id) && x.paid)
    .map(
      (x) =>
        ({
          id: x.invoice_id,
          patientId: 'OTC',
          patientName: x.customer_name || 'OTC Client',
          patientPhone: x.customer_phone || '',
          date: String(x.sale_date || '').slice(0, 10),
          items: (x.items || []).map((i: any) => ({
            description: `${i.item_name} [OTC]`,
            category: 'Pharmacy',
            unitCost: Number(i.unit_price || 0),
            quantity: Number(i.quantity || 0),
            total: Number(i.total || 0),
          })),
          subtotal: Number(x.subtotal || 0),
          discount: Number(x.discount || 0),
          tax: 0,
          totalAmount: Number(x.total_amount || 0),
          amountPaid: Number(x.amount_paid || x.total_amount || 0),
          balance: 0,
          paymentMethod: x.payment_method || 'Cash',
          status: 'Paid',
          cashierName: x.billed_by || '',
          billingPayer: 'Cash / M-Pesa',
        }) as any,
    );
};
const shiftDay = (d: string, n: number) => {
  const x = new Date(`${d}T12:00:00`);
  x.setDate(x.getDate() + n);
  return x.toLocaleDateString('en-CA');
};

export const RevenueTab: React.FC<{ bills: Bill[]; userName: string; canWrite: boolean }> = ({ bills, userName, canWrite }) => {
  const [date, setDate] = useState(today());
  const [manual, setManual] = useState<Row[]>([]);
  const [recs, setRecs] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [showPost, setShowPost] = useState(false);
  const [showRec, setShowRec] = useState(false);
  const load = async () => {
    const [a, b] = await Promise.all([erpList('revenue-postings'), erpList('revenue-reconciliations')]);
    setManual(a);
    setRecs(b);
  };
  useEffect(() => {
    void load();
  }, []);

  const [procs, setProcs] = useState<ProcDepts>({ byId: new Map(), byName: new Map() });
  const [otcSales, setOtcSales] = useState<any[]>([]);
  useEffect(() => {
    apiClient
      .getSetupEntity('setup-nursing-procedures')
      .then((rows: any[]) => {
        const byId = new Map<string, string>();
        const byName = new Map<string, string>();
        (rows || []).forEach((r: any) => {
          const d = String(r.department || '').trim();
          if (!d) return;
          [r.id, r.code].forEach((k) => {
            if (k != null && k !== '') byId.set(String(k), d);
          });
          if (r.name) byName.set(plainProc(r.name), d);
        });
        setProcs({ byId, byName });
      })
      .catch(() => undefined);
    apiClient
      .getPharmacyOtcSales()
      .then(setOtcSales)
      .catch(() => undefined);
  }, []);
  const allBills = useMemo(() => [...bills, ...otcAsBills(otcSales, bills)], [bills, otcSales]);

  const postings = useMemo(() => dayPostings(allBills, manual, date, procs), [allBills, manual, date, procs]);
  const yesterday = useMemo(() => dayPostings(allBills, manual, shiftDay(date, -1), procs), [allBills, manual, date, procs]);
  const sum = (ps: Posting[], f: (p: Posting) => number) => ps.reduce((s, p) => s + f(p), 0);
  const total = sum(postings, (p) => p.amount);
  const totalY = sum(yesterday, (p) => p.amount);
  const cashOf = (p: Posting) => (p.byChannel.Cash || 0) + (p.byChannel['M-Pesa'] || 0) + (p.byChannel['Card / Bank'] || 0);
  const opdCash = sum(postings, (p) => Math.max(0, cashOf(p) - (p.byDept['IPD Billing & Wards']?.cash || 0)));
  const insurance = sum(postings, (p) => p.byChannel['Insurance / SHA'] || 0);
  const ipd = sum(postings, (p) => p.byDept['IPD Billing & Wards']?.cash || 0);
  const change = totalY > 0 ? ((total - totalY) / totalY) * 100 : null;
  const rec = recs.find((r) => r.date === date);

  const depts = useMemo(() => {
    const t: Record<string, { cash: number; insurance: number }> = {};
    postings.forEach((p) =>
      Object.entries(p.byDept).forEach(([d, v]) => {
        t[d] = t[d] || { cash: 0, insurance: 0 };
        t[d].cash += v.cash;
        t[d].insurance += v.insurance;
      }),
    );
    return Object.entries(t)
      .map(([name, v]) => ({ name, ...v, total: v.cash + v.insurance }))
      .sort((a, z) => z.total - a.total);
  }, [postings]);
  const channels = CHANNELS.map((c) => ({ c, v: sum(postings, (p) => p.byChannel[c] || 0) }));
  const shown = postings.filter(
    (p) =>
      (!dept || p.byDept[dept]) &&
      (!q || `${p.ref} ${p.payer} ${p.department} ${p.channel} ${p.servedBy}`.toLowerCase().includes(q.toLowerCase())),
  );

  const printAudit = () => {
    const rows = depts
      .map(
        (d) =>
          `<tr><td>${e(d.name)}</td><td class="r">${m(d.cash)}</td><td class="r">${m(d.insurance)}</td><td class="r"><b>${m(d.total)}</b></td></tr>`,
      )
      .join('');
    const list = postings
      .map(
        (p, i) =>
          `<tr><td class="c">${i + 1}</td><td>${e(p.ref)}</td><td>${e(p.department)}</td><td>${e(p.payer)}</td><td>${e(p.channel)}</td><td>${e(p.servedBy)}</td><td class="r">${m(p.amount)}</td></tr>`,
      )
      .join('');
    void printOfficeDocument(
      'Daily Revenue & Shift Audit Report',
      `
      <div class="ofc-meta"><span>Business date: <b>${e(date)}</b></span><span>Status: <b>${rec ? 'Reconciled by ' + e(rec.reconciledBy || '') : 'Not yet reconciled'}</b></span></div>
      ${officeSection('Departmental revenue counters')}
      <table class="ofc"><thead><tr><th>Department</th><th class="r">Cash / M-Pesa / Card (KSh)</th><th class="r">Insurance / SHA (KSh)</th><th class="r">Total (KSh)</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No revenue for this date.</td></tr>'}</tbody>
      <tfoot><tr class="grand"><td>Total income</td><td class="r">${m(sum(depts as any, (d: any) => d.cash))}</td><td class="r">${m(insurance)}</td><td class="r">${m(total)}</td></tr></tfoot></table>
      ${officeSection('Collections by payment channel')}
      <table class="ofc"><thead><tr>${channels.map((c) => `<th class="r">${e(c.c)}</th>`).join('')}</tr></thead><tbody><tr>${channels.map((c) => `<td class="r">${m(c.v)}</td>`).join('')}</tr></tbody></table>
      ${rec ? `${officeSection('Counter reconciliation')}<table class="ofc"><thead><tr><th>Channel</th><th class="r">Expected</th><th class="r">Counted</th><th class="r">Variance</th></tr></thead><tbody>${['Cash', 'M-Pesa', 'Card / Bank'].map((c) => `<tr><td>${c}</td><td class="r">${m(rec.expected?.[c])}</td><td class="r">${m(rec.counted?.[c])}</td><td class="r">${m(Number(rec.counted?.[c] || 0) - Number(rec.expected?.[c] || 0))}</td></tr>`).join('')}</tbody></table>${rec.notes ? `<p class="ofc-note">Notes: ${e(rec.notes)}</p>` : ''}` : ''}
      ${officeSection('Revenue postings')}
      <table class="ofc"><thead><tr><th class="c">#</th><th>Ref</th><th>Department</th><th>Patient / payer</th><th>Channel</th><th>Served by</th><th class="r">Amount (KSh)</th></tr></thead><tbody>${list || '<tr><td colspan="7">None</td></tr>'}</tbody></table>
      <div class="ofc-signs"><div><b>Cashier</b><div class="line"></div><div class="cap">Name, sign & date</div></div><div><b>Accountant</b><div class="line"></div><div class="cap">Sign & date</div></div><div><b>Finance Manager</b><div class="line"></div><div class="cap">Sign & stamp</div></div></div>`,
    );
  };
  const printManualReceipt = (r: Row) =>
    void printOfficeDocument(
      'Official Revenue Receipt',
      `
    <div class="ofc-grid"><div class="ofc-box"><div class="cap">Receipt No.</div><div class="big">${e(r.id)}</div>Date: ${e(dayOf(r.date))}</div><div class="ofc-box"><div class="cap">Received from</div><div class="big">${e(r.payer)}</div>${e(r.department)}</div></div>
    <table class="ofc"><thead><tr><th>Particulars</th><th>Channel</th><th>Reference</th><th class="r">Amount (KSh)</th></tr></thead><tbody><tr><td>${e(r.description || r.department)}</td><td>${e(r.channel)}</td><td>${e(r.reference || '')}</td><td class="r"><b>${m(r.amount)}</b></td></tr></tbody></table>
    <div class="ofc-signs two"><div><b>Received by</b><div class="line"></div><div class="cap">${e(r.servedBy || '')}</div></div><div><b>Payer</b><div class="line"></div><div class="cap">Sign</div></div></div>`,
    );

  return (
    <div className="space-y-5">
      <SectionHead
        title="Hospital Revenue & Income Counter"
        text="Capture daily departmental postings, counter collections, and corporate/insurance batch invoicing"
      >
        <input
          type="date"
          value={date}
          max={today()}
          onChange={(x) => setDate(x.target.value || today())}
          title="Business date"
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        {canWrite && (
          <button onClick={() => setShowPost(true)} className={btn.primary}>
            <PlusCircle className="w-4 h-4" />
            Post Department Revenue
          </button>
        )}
        {canWrite && (
          <button onClick={() => setShowRec(true)} className={btn.green}>
            <CheckCheck className="w-4 h-4" />
            Reconcile Batch Counter
          </button>
        )}
      </SectionHead>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi
          tone="emerald"
          icon={<CircleDollarSign className="w-5 h-5" />}
          label={date === today() ? "Total Today's Income" : `Total Income ${date}`}
          value={ksh(total)}
          noteTone={change !== null && change < 0 ? 'rose' : change !== null ? 'emerald' : undefined}
          note={
            change === null ? (
              'No income the day before'
            ) : (
              <span className="inline-flex items-center gap-1">
                {change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {change >= 0 ? '+' : ''}
                {change.toFixed(1)}% vs yesterday
              </span>
            )
          }
        />
        <Kpi
          tone="sky"
          icon={<Store className="w-5 h-5" />}
          label="OPD & Pharmacy Cash"
          value={ksh(opdCash)}
          note="Direct M-Pesa & Cash Collections"
        />
        <Kpi
          tone="purple"
          icon={<IdCard className="w-5 h-5" />}
          label="Insurance Claims Invoiced"
          value={ksh(insurance)}
          note="SHA and insurance companies"
        />
        <Kpi
          tone="amber"
          icon={<BedDouble className="w-5 h-5" />}
          label="IPD Hospitalization Receipts"
          value={ksh(ipd)}
          note="Ward Deposits & Discharge Bills"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">Revenue Distribution by Department</h3>
          <Doughnut
            rows={depts.map((d) => ({ label: d.name, value: d.total }))}
            colors={['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b']}
            empty="No revenue on this date."
          />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {channels.map((c) => (
              <div key={c.c} className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">{c.c}</p>
                <p className="text-sm font-bold text-slate-800">{ksh(c.v)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-w-0">
          <div>
            <div className="flex justify-between items-center gap-2 mb-3">
              <h3 className="font-bold text-slate-800 text-sm">Departmental Revenue Counters ({date === today() ? 'Today' : date})</h3>
              <Chip>All shifts combined</Chip>
            </div>
            <TableWrap soft>
              <thead>
                <tr>
                  <th className={th}>Department</th>
                  <th className={`${th} text-right`}>Cash / M-Pesa</th>
                  <th className={`${th} text-right`}>Corporate / SHA Insurance</th>
                  <th className={`${th} text-right`}>Total Income</th>
                  <th className={`${th} text-center`}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {depts.length ? (
                  depts.map((d) => (
                    <tr key={d.name}>
                      <td className="p-2.5 font-semibold text-slate-800">{d.name}</td>
                      <td className="p-2.5 text-right whitespace-nowrap">{ksh(d.cash)}</td>
                      <td className="p-2.5 text-right whitespace-nowrap">{ksh(d.insurance)}</td>
                      <td className="p-2.5 text-right font-bold text-sky-700 whitespace-nowrap">{ksh(d.total)}</td>
                      <td className="p-2.5 text-center">
                        {rec ? <Badge tone="green">Reconciled</Badge> : <Badge tone="amber">Pending Audit</Badge>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <Empty cols={5} text="No revenue recorded on this date." />
                )}
              </tbody>
            </TableWrap>
            {rec && (
              <p className="mt-2 text-[11px] text-emerald-700">
                Counter reconciled by {rec.reconciledBy} · variance {ksh(rec.variance)}
                {rec.notes ? ` · ${rec.notes}` : ''}
              </p>
            )}
          </div>
          <div className="mt-3 text-right">
            <span className="text-xs text-slate-500">
              Need counter audit?{' '}
              <button onClick={printAudit} className="text-sky-600 font-semibold hover:underline">
                Download Detailed Shift Audit PDF
              </button>
            </span>
          </div>
        </div>
      </div>

      <Panel
        title="Recent Revenue & Income Postings"
        right={
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              value={q}
              onChange={(x) => setQ(x.target.value)}
              placeholder="Search ref, patient, or dept..."
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <select
              value={dept}
              onChange={(x) => setDept(x.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Departments</option>
              {REVENUE_DEPTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        }
      >
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Posting Ref #</th>
              <th className={th}>Department Head</th>
              <th className={th}>Patient / Payer Details</th>
              <th className={th}>Payment Channel</th>
              <th className={`${th} text-right`}>Amount (KSh)</th>
              <th className={th}>Served By</th>
              <th className={`${th} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {shown.length ? (
              shown.map((p) => (
                <tr key={p.ref}>
                  <td className="p-3 font-bold text-sky-700 whitespace-nowrap">{p.ref}</td>
                  <td className="p-3 font-medium">{p.department}</td>
                  <td className="p-3">{p.payer}</td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border whitespace-nowrap">{p.channel}</span>
                  </td>
                  <td className="p-3 text-right font-bold whitespace-nowrap">{ksh(p.amount)}</td>
                  <td className="p-3 text-slate-500">{p.servedBy}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => (p.kind === 'bill' ? printCashReceipt(p.ref) : printManualReceipt(p.record!))}
                      className="text-sky-600 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <Empty cols={7} text="No postings match." />
            )}
          </tbody>
        </TableWrap>
      </Panel>
      {showPost && (
        <PostRevenue
          userName={userName}
          onClose={() => setShowPost(false)}
          onSaved={(r) => {
            setManual((x) => [r, ...x]);
            setShowPost(false);
            setDate(dayOf(r.date));
          }}
        />
      )}
      {showRec && (
        <Reconcile
          date={date}
          channels={channels}
          userName={userName}
          existing={rec}
          onClose={() => setShowRec(false)}
          onSaved={(r) => {
            setRecs((x) => [r, ...x.filter((y) => y.id !== r.id)]);
            setShowRec(false);
          }}
        />
      )}
    </div>
  );
};

const PostRevenue: React.FC<{ userName: string; onClose: () => void; onSaved: (r: Row) => void }> = ({ userName, onClose, onSaved }) => {
  const [f, setF] = useState<Row>({
    department: REVENUE_DEPTS[0],
    channel: 'M-Pesa',
    amount: '',
    payer: '',
    description: '',
    reference: '',
    servedBy: userName,
    date: today(),
  });
  const [busy, setBusy] = useState(false);
  const submit = async (x: React.FormEvent) => {
    x.preventDefault();
    if (!(Number(f.amount) > 0)) return;
    setBusy(true);
    const r = { ...f, id: newId('REV'), amount: Number(f.amount), status: 'Posted' };
    if (await erpSave('revenue-postings', r)) onSaved(r);
    setBusy(false);
  };
  const set = (k: string) => (x: React.ChangeEvent<any>) => setF({ ...f, [k]: x.target.value });
  return (
    <Modal
      head="bg-sky-700"
      title="Post Department Revenue Entry"
      subtitle="Income not billed through a patient invoice (e.g. medical reports, rent, other services)."
      onClose={onClose}
    >
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Revenue Department Head" className="col-span-2">
          <select value={f.department} onChange={set('department')} className={inputCls}>
            {REVENUE_DEPTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Patient Name / Description *" className="col-span-2">
          <input
            required
            value={f.payer}
            onChange={set('payer')}
            className={inputCls}
            placeholder="e.g. OP-4821 James Njuguna / Medical report fee"
          />
        </Field>
        <Field label="Payment Mode Channel">
          <select value={f.channel} onChange={set('channel')} className={inputCls}>
            <option>M-Pesa</option>
            <option>Cash</option>
            <option>Insurance / SHA Claim</option>
            <option>Bank Transfer</option>
            <option>Card</option>
          </select>
        </Field>
        <Field label="Amount Collected (KSh) *">
          <input required type="number" min={1} step="0.01" value={f.amount} onChange={set('amount')} className={inputCls} />
        </Field>
        <Field label="Transaction Reference">
          <input value={f.reference} onChange={set('reference')} className={inputCls} placeholder="M-Pesa code / slip no." />
        </Field>
        <Field label="Date">
          <input type="date" max={today()} value={f.date} onChange={set('date')} className={inputCls} />
        </Field>
        <Field label="Served By Staff" className="col-span-2">
          <input value={f.servedBy} onChange={set('servedBy')} className={inputCls} />
        </Field>
        <div className="col-span-2">
          <FormButtons color="bg-sky-600 hover:bg-sky-700" onCancel={onClose} label="Submit Revenue Voucher" busy={busy} />
        </div>
      </form>
    </Modal>
  );
};

const Reconcile: React.FC<{
  date: string;
  channels: { c: string; v: number }[];
  userName: string;
  existing?: Row;
  onClose: () => void;
  onSaved: (r: Row) => void;
}> = ({ date, channels, userName, existing, onClose, onSaved }) => {
  const expected: Record<string, number> = Object.fromEntries(
    channels.filter((c) => c.c !== 'Insurance / SHA').map((c) => [c.c, Math.round(c.v * 100) / 100]),
  );
  const [counted, setCounted] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.keys(expected).map((k) => [k, String(existing?.counted?.[k] ?? expected[k])])),
  );
  const [notes, setNotes] = useState(existing?.notes || '');
  const [busy, setBusy] = useState(false);
  const variance = Object.keys(expected).reduce((s, k) => s + (Number(counted[k] || 0) - expected[k]), 0);
  const submit = async (x: React.FormEvent) => {
    x.preventDefault();
    setBusy(true);
    const r = {
      id: `REC-${date}`,
      date,
      expected,
      counted: Object.fromEntries(Object.entries(counted).map(([k, v]) => [k, Number(v || 0)])),
      variance,
      notes,
      reconciledBy: userName,
      status: 'Reconciled',
    };
    if (await erpSave('revenue-reconciliations', r)) onSaved(r);
    setBusy(false);
  };
  return (
    <Modal
      head="bg-emerald-700"
      title={`Reconcile Counter — ${date}`}
      subtitle="Count the cash and check the M-Pesa and bank statements against what WiseCare recorded."
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-3">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-1">Channel</th>
              <th className="text-right py-1">Expected (system)</th>
              <th className="text-right py-1">Counted / statement</th>
              <th className="text-right py-1">Variance</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(expected).map((k) => (
              <tr key={k} className="border-t">
                <td className="py-2 font-semibold">{k}</td>
                <td className="py-2 text-right">{ksh(expected[k], 2)}</td>
                <td className="py-2 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={counted[k]}
                    onChange={(x) => setCounted({ ...counted, [k]: x.target.value })}
                    className="w-32 px-2 py-1 border rounded text-right"
                  />
                </td>
                <td
                  className={`py-2 text-right font-bold ${Number(counted[k] || 0) - expected[k] < 0 ? 'text-rose-600' : 'text-emerald-700'}`}
                >
                  {ksh(Number(counted[k] || 0) - expected[k], 2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          className={`rounded-lg px-3 py-2 text-sm font-bold ${variance < 0 ? 'bg-rose-50 text-rose-700' : variance > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}
        >
          Overall variance: {ksh(variance, 2)} {variance < 0 ? '(shortage)' : variance > 0 ? '(excess)' : '(balanced)'}
        </div>
        <Field label="Notes (explain any variance)">
          <textarea rows={2} value={notes} onChange={(x) => setNotes(x.target.value)} className={inputCls} />
        </Field>
        <FormButtons color="bg-emerald-600 hover:bg-emerald-700" onCancel={onClose} label="Close & Reconcile Batch" busy={busy} />
      </form>
    </Modal>
  );
};
