import qrcode from 'qrcode-generator';
import { EGFR_CATEGORIES, EGFR_REFERENCE, EGFR_UNIT, classifyEgfr } from '../utils/egfr';
import { hospitalAddressLines } from '../utils/hospitalAddress';
import { showMessage } from './AppMessage';
import { sanitizeRichText, richTextIsEmpty } from '../utils/richText';

type Json = Record<string, any>;

const esc = (v: unknown): string =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const dash = (v: unknown): string => {
  const t = String(v ?? '').trim();
  return !t || /^(-+|—|–|n\/?a|null|undefined)$/i.test(t) ? '' : esc(t);
};
const money = (n: unknown): string => Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 });
const qty = (n: unknown): string => Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 });

const clock = (h: number, min: string): string => `${h % 12 || 12}:${min} ${h < 12 ? 'AM' : 'PM'}`;

const dmy = (v: unknown): string => {
  const m = String(v ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : String(v ?? '').trim();
};

const labTime = (v: unknown): string => {
  const m = String(v ?? '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]} ${clock(Number(m[4]), m[5])}` : dmy(v);
};
const minuteTime = (v: unknown): string => labTime(v);

const C128 = [
  '212222',
  '222122',
  '222221',
  '121223',
  '121322',
  '131222',
  '122213',
  '122312',
  '132212',
  '221213',
  '221312',
  '231212',
  '112232',
  '122132',
  '122231',
  '113222',
  '123122',
  '123221',
  '223211',
  '221132',
  '221231',
  '213212',
  '223112',
  '312131',
  '311222',
  '321122',
  '321221',
  '312212',
  '322112',
  '322211',
  '212123',
  '212321',
  '232121',
  '111323',
  '131123',
  '131321',
  '112313',
  '132113',
  '132311',
  '211313',
  '231113',
  '231311',
  '112133',
  '112331',
  '132131',
  '113123',
  '113321',
  '133121',
  '313121',
  '211331',
  '231131',
  '213113',
  '213311',
  '213131',
  '311123',
  '311321',
  '331121',
  '312113',
  '312311',
  '332111',
  '314111',
  '221411',
  '431111',
  '111224',
  '111422',
  '121124',
  '121421',
  '141122',
  '141221',
  '112214',
  '112412',
  '122114',
  '122411',
  '142112',
  '142211',
  '241211',
  '221114',
  '413111',
  '241112',
  '134111',
  '111242',
  '121142',
  '121241',
  '114212',
  '124112',
  '124211',
  '411212',
  '421112',
  '421211',
  '212141',
  '214121',
  '412121',
  '111143',
  '111341',
  '131141',
  '114113',
  '114311',
  '411113',
  '411311',
  '113141',
  '114131',
  '311141',
  '411131',
  '211412',
  '211214',
  '211232',
  '2331112',
];
const barcodeSvg = (text: string): string => {
  const chars = Array.from(text).filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126);
  if (!chars.length) return '';
  const codes = [104, ...chars.map((c) => c.charCodeAt(0) - 32)];
  const check = codes.reduce((sum, c, i) => sum + c * (i === 0 ? 1 : i), 0) % 103;
  const pattern = [...codes, check, 106].map((c) => C128[c]).join('');
  let x = 10;
  let bars = '';
  Array.from(pattern).forEach((w, i) => {
    const width = Number(w);
    if (i % 2 === 0) bars += `<rect x="${x}" y="2" width="${width}" height="36" fill="#000"/>`;
    x += width;
  });
  return `<svg class="barcode-svg" viewBox="0 0 ${x + 10} 40" preserveAspectRatio="none"><rect x="0" y="0" width="${x + 10}" height="40" fill="#ffffff"/>${bars}</svg>`;
};

const printedAt = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${clock(d.getHours(), p(d.getMinutes()))}`;
};

qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
const qrBlock = (d: Json): string => {
  const qr = qrcode(0, 'M');
  qr.addData(
    [d.hospital?.name || '', `Patient: ${d.patient?.name || d.invoice?.patientName || ''}`, `Date & Time: ${printedAt()}`].join('\n'),
  );
  qr.make();
  return `<div class="qr-box">${qr.createSvgTag({ cellSize: 2, margin: 0, scalable: true })}</div>`;
};

const BASE_CSS = `
@page { size: A4; margin: 10mm 12mm 20mm 12mm; }
body { font-family: Arial, Helvetica, sans-serif; color: #111111; margin: 0; padding: 0; font-size: 11px; background-color: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.top-stripe { display: flex; height: 6px; width: 100%; margin-bottom: 8px; }
.stripe-blue { background-color: #00a8ff; flex: 1; } .stripe-green { background-color: #8bc34a; flex: 1; } .stripe-orange { background-color: #ff6f00; flex: 1; }
.header-container { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 3px solid #ff6f00; }
.header-left { display: flex; align-items: center; gap: 20px; }
.header-logo { width: auto; max-width: 155px; height: auto; max-height: 95px; }
.header-title-box { text-align: center; }
.header-title-box h1 { margin: 0; font-size: 40px; color: #00a8ff; font-weight: 800; letter-spacing: 1.2px; line-height: 1.05; }
.header-title-box h2 { margin: 4px 0 0 0; font-size: 20px; color: #8bc34a; font-weight: 700; letter-spacing: 0.8px; }
.header-divider { width: 3px; height: 90px; background-color: #ff6f00; margin: 0 15px; }
.header-tall-logo .header-logo { position: relative; z-index: 1; max-height: 118px; max-width: 135px; margin-bottom: -26px; padding-bottom: 6px; background: #fff; }
.header-tall-logo .header-title-box h1 { font-size: 30px; white-space: nowrap; }
.header-tall-logo .header-title-box h2 { font-size: 19px; }
.header-right { text-align: right; font-size: 12px; line-height: 1.5; color: #333333; font-weight: 600; }
.doc-title-banner { text-align: center; background-color: #f8f9fa; border: 1px solid #d0d0d0; padding: 5px; margin: 10px 0 10px 0; font-size: 13px; font-weight: 800; color: #003366; letter-spacing: 1px; text-transform: uppercase; }
.patient-bio-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
.patient-bio-table td { border: 1px solid #000000; padding: 5px 8px; vertical-align: middle; }
.patient-bio-table .label { font-weight: bold; width: 11%; background-color: #ffffff; white-space: nowrap; text-transform: uppercase; font-size: 10px; }
.patient-bio-table td, .info-table td { text-transform: uppercase; }
.patient-bio-table .val-col1, .patient-bio-table .val-col2, .patient-bio-table .val-col3 { width: 26%; }
.barcode-box { text-align: center; padding: 2px !important; }
.barcode-svg { height: 32px; width: 85%; }
.barcode-text { font-family: 'Courier New', Courier, monospace; font-size: 9px; letter-spacing: 4px; margin-top: -2px; }
.section-header { display: flex; align-items: center; background-color: #33b5e5; color: #ffffff; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 10px 0 8px 0; border-radius: 2px; overflow: hidden; }
.section-header { break-after: avoid; page-break-after: avoid; }
.report-table tr, .clinical-box { break-inside: avoid; page-break-inside: avoid; }
.section-header .accent-bar { width: 6px; height: 100%; background-color: #ff6f00; align-self: stretch; }
.section-header .title-text { padding: 6px 10px; text-align: center; flex-grow: 1; }
.report-table { width: 100%; border-collapse: collapse; margin-top: 5px; border: 1px solid #d0d0d0; }
.report-table th { background-color: #f1f3f5; color: #333; text-align: left; padding: 6px 10px; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #33b5e5; font-weight: 700; }
.report-table td { padding: 6px 10px; border-bottom: 1px solid #e9ecef; font-size: 11px; }
.report-table tr:nth-child(even) { background-color: #fafafa; }
.footer-container { margin-top: 25px; padding-top: 10px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #666; background-color: #ffffff; page-break-inside: avoid; }
.certification-stamp { border: 1px dashed #8bc34a; background-color: #f1f8e9; padding: 6px 10px; border-radius: 4px; color: #2e7d32; font-weight: 600; font-size: 10px; line-height: 1.4; }
.page-footer { margin-top: 30px; text-align: center; page-break-inside: avoid; }
.page-footer .top-stripe { margin: 0 0 5px 0; height: 4px; }
.page-footer .slogan { font-size: 11px; font-style: italic; font-weight: 700; color: #003366; letter-spacing: 0.5px; }
@media print { .page-footer { position: fixed; left: 0; right: 0; bottom: 0; margin: 0; background: #ffffff; } body { padding-bottom: 16mm; } }
.footer-right { display: flex; align-items: flex-end; gap: 18px; }
.qr-box { text-align: center; width: 84px; min-width: 84px; flex-shrink: 0; }
.qr-box svg { width: 80px; height: 80px; display: block; margin: 0 auto; }
.lab-footer { display: grid; grid-template-columns: minmax(0, 1fr) 84px minmax(0, 1fr); align-items: center; gap: 12px; }
.lab-footer .officer { text-align: left; justify-self: start; }
.lab-footer .certification-stamp { justify-self: end; }
.sign-label, .sign-row > span:first-child, .signature-box .sign-label { text-transform: uppercase; font-weight: 700; }
.tech-signature { text-align: right; font-weight: 600; color: #333; font-size: 11px; line-height: 1.4; }


@media screen {
  body { max-width: 210mm; margin: 0 auto; padding: 16px; box-sizing: border-box; }
  .report-table, .invoice-table, .patient-bio-table, .info-table { word-break: break-word; }
}
@media screen and (max-width: 760px) {
  body { padding: 10px; }
  .header-container { flex-wrap: wrap; gap: 10px; }
  .header-left { gap: 12px; }
  .header-logo { max-height: 60px; }
  .header-title-box h1 { font-size: 26px; } .header-title-box h2 { font-size: 14px; }
  .header-divider { display: none; }
  .header-right { text-align: left; font-size: 11px; width: 100%; }
  .patient-bio-table, .patient-bio-table tbody, .info-table, .info-table tbody { display: block; width: 100%; }
  .patient-bio-table tr, .info-table tr { display: grid; grid-template-columns: 40% 60%; }
  .patient-bio-table td, .info-table td { width: auto !important; border-width: 0 1px 1px 1px; }
  .patient-bio-table tr:first-child td:nth-child(-n+2), .info-table tr:first-child td:nth-child(-n+2) { border-top-width: 1px; }
  .patient-bio-table .barcode-box { grid-column: 1 / -1; }
  .report-table th, .report-table td, .invoice-table th, .invoice-table td { padding: 5px 4px; font-size: 10px; }
  .vitals-table thead { display: none; }
  .vitals-table, .vitals-table tbody, .vitals-table tr { display: block; width: 100%; }
  .vitals-table td { display: flex; justify-content: space-between; text-align: right; }
  .vitals-table td::before { content: attr(data-label); font-weight: 700; color: #333; text-align: left; }
  .wc-viewer-bar { margin: -10px -10px 12px -10px !important; }
  .invoice-meta-row { flex-wrap: wrap; gap: 4px; }
  .summary-container { justify-content: stretch; } .summary-table { width: 100%; }
  .lab-footer, .invoice-footer, .summary-footer { grid-template-columns: 1fr !important; justify-items: center; text-align: center; }
  .lab-footer > *, .invoice-footer > *, .summary-footer > * { justify-self: center !important; text-align: center !important; }
  .badge-container { gap: 4px; }
}
`;

const LAB_CSS = `
.egfr-table td, .egfr-table th { padding: 4px 10px; }
.egfr-table tr.egfr-current td { background: #f3e8ff; font-weight: 700; color: #581c87; }
.egfr-note { font-size: 11px; margin: 4px 2px 8px; color: #333; }
.keep-case { text-transform: none; }
.clinical-comments-box { border: 1px solid #d0d0d0; background-color: #fcfcfc; padding: 10px 12px; margin-top: 10px; border-radius: 4px; font-size: 10.5px; line-height: 1.45; }
.comment-item { margin-bottom: 6px; } .comment-item:last-child { margin-bottom: 0; }
.comment-item strong { color: #003366; }
.flagged { font-weight: 700; }
.flag-high { color: #c62828; font-weight: 800; } .flag-low { color: #1565c0; font-weight: 800; }

.comment-item .rich p, .comment-item .rich div { display: inline; margin: 0; }
.comment-item.rich-block p { margin: 0 0 4px 0; } .comment-item.rich-block ul, .comment-item.rich-block ol { margin: 3px 0; padding-left: 18px; }
.comment-item .rich ul, .comment-item .rich ol { margin: 3px 0 0 0; padding-left: 18px; }


.header-container { padding-bottom: 6px; }
.header-logo { max-height: 72px; } .header-divider { height: 70px; }
.header-title-box h1 { font-size: 34px; } .header-title-box h2 { font-size: 17px; }
.header-right { font-size: 11px; line-height: 1.35; }
.top-stripe { margin-bottom: 5px; }
.doc-title-banner { margin: 6px 0; padding: 3px; font-size: 12px; }
.patient-bio-table { margin-bottom: 6px; } .patient-bio-table td { padding: 3px 6px; }
.section-header { margin: 6px 0 4px 0; font-size: 11px; } .section-header .title-text { padding: 4px 10px; }
.report-table { margin-top: 2px; }
.report-table th { padding: 3px 8px; }
.report-table td { padding: 2px 8px; }
.clinical-comments-box { padding: 6px 10px; margin-top: 4px; line-height: 1.35; }
.comment-item { margin-bottom: 3px; }
.footer-container { margin-top: 12px; padding-top: 6px; }
.qr-box svg { width: 70px; height: 70px; }


.lab-report-footer { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.lab-results td { font-family: 'Bahnschrift Light', 'Bahnschrift', 'Segoe UI', Arial, sans-serif; font-weight: 300; font-size: 11.5px; font-stretch: normal; }
`;

const FIT_ONE_PAGE = `<script>(function(){
  var MM = 96 / 25.4, WIDTH = 186 * MM, HEIGHT = 249 * MM;
  function fit() {
    var page = document.querySelector('.fit-page'); if (!page) return;
    page.style.zoom = ''; var b = document.body, w = b.style.width, mw = b.style.maxWidth, pd = b.style.padding;
    b.style.width = WIDTH + 'px'; b.style.maxWidth = 'none'; b.style.padding = '0';
    var h = page.getBoundingClientRect().height;
    b.style.width = w; b.style.maxWidth = mw; b.style.padding = pd;
    var z = h > HEIGHT ? HEIGHT / h : 1;
    document.documentElement.style.setProperty('--fit', String(z >= 0.6 ? Math.floor(z * 1000) / 1000 : 1));
  }
  window.addEventListener('beforeprint', fit);
  var css = document.createElement('style'); css.textContent = '@media print { .fit-page { zoom: var(--fit, 1); } }';
  document.head.appendChild(css);
})();</script>`;

const SUMMARY_CSS = `
.clinical-box { border: 1px solid #d0d0d0; background-color: #fcfcfc; padding: 10px 12px; margin-bottom: 8px; border-radius: 4px; font-size: 11px; line-height: 1.5; white-space: pre-line; }
.complaint-text { font-weight: bold; color: #111111; }
.badge-container { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 0; white-space: normal; }
.diagnosis-badge { background-color: #e3f2fd; color: #0d47a1; border: 1px solid #90caf9; padding: 4px 10px; border-radius: 12px; font-weight: 600; font-size: 10.5px; }
.status-dispensed { color: #2e7d32; font-weight: 700; background-color: #e8f5e9; padding: 2px 6px; border-radius: 3px; display: inline-block; }
.vitals-table th, .vitals-table td { text-align: center; }
.vitals-table .unit { color: #666; font-size: 9.5px; }
.vitals-note { font-size: 9.5px; color: #666; margin: 3px 0 0 2px; }
.plain-list { margin: 0; padding-left: 18px; } .plain-list li { margin: 1px 0; }
.lab-footer .officer { line-height: 2.2; }
.write-line { display: inline-block; width: 150px; border-bottom: 1px solid #333; vertical-align: bottom; }
.sign-row { display: flex; align-items: flex-end; gap: 6px; margin: 2px 0; white-space: nowrap; }
.sign-row .write-line { flex: 1; width: auto; min-width: 110px; height: 14px; }
.lab-footer .officer { min-width: 0; }
.lab-footer .sign-row { white-space: normal; }

.summary-footer { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); align-items: end; gap: 24px; }
.summary-footer .officer { text-align: left; line-height: 2.2; min-width: 0; }
.summary-footer .sign-row { white-space: normal; }
.summary-footer .reg-label { text-transform: uppercase; font-weight: 600; margin-left: 6px; white-space: nowrap; }
.summary-footer .stamp-column { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.status-pending { color: #a15c00; font-weight: 700; background-color: #fff4e0; padding: 2px 6px; border-radius: 3px; display: inline-block; }
`;

const DISCHARGE_CSS = `
.discharge-bio td { width: auto; }
.discharge-bio .label { background-color: #dbe8fb; width: 13%; }
`;

const INVOICE_CSS = `
@page { size: A4; margin: 10mm 12mm; }
.invoice-meta-row { display: flex; justify-content: space-between; align-items: center; margin: 0 0 12px 0; padding: 0 2px; }
.invoice-meta { text-align: right; font-size: 12px; }
.invoice-meta.left { text-align: left; }
.invoice-number { font-weight: 800; color: #003366; font-size: 13px; }
.info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
.info-table td { border: 1px solid #000000; padding: 6px 10px; vertical-align: middle; }
.info-table .label { font-weight: bold; width: 16%; background-color: #ffffff; white-space: nowrap; text-transform: uppercase; }
.info-table .val-col { width: 34%; }
.invoice-table { width: 100%; border-collapse: collapse; margin-top: 5px; border: 1px solid #d0d0d0; }
.invoice-table td.text-center, .invoice-table td.text-right { white-space: nowrap; }
.invoice-table tr.group-row td { text-transform: uppercase; }
.invoice-table th { background-color: #f1f3f5; color: #333; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #33b5e5; font-weight: 700; }
.invoice-table td { padding: 8px 10px; border-bottom: 1px solid #e9ecef; font-size: 11px; }
.invoice-table tr:nth-child(even) { background-color: #fafafa; }
.text-center { text-align: center; } .text-right { text-align: right; }
.invoice-table tr.group-row td { background: #e8f4fb; color: #003366; font-weight: 800; font-size: 11px; letter-spacing: 0.4px; border-top: 1px solid #b9dcef; padding: 6px 10px; }
.invoice-table tr.item-row td:first-child { padding-left: 22px; }
.invoice-table tr.group-total td { font-weight: 700; color: #333; background: #fbfbfb; border-bottom: 1px solid #d0d0d0; font-size: 10.5px; }
.invoice-table tr:nth-child(even).group-row td, .invoice-table tr:nth-child(even).group-total td { background-clip: padding-box; }
.invoice-table th.text-center { text-align: center; } .invoice-table th.text-right { text-align: right; }
.summary-container { margin-top: 15px; display: flex; justify-content: flex-end; }
.summary-table { width: 320px; border-collapse: collapse; font-size: 12px; }
.summary-table td { padding: 6px 12px; }
.summary-label { font-weight: 700; color: #444; text-align: right; }
.summary-value { text-align: right; font-weight: 700; color: #111; }
.total-row { border-top: 2px solid #33b5e5; border-bottom: 2px solid #33b5e5; background-color: #f8f9fa; }
.total-row .summary-label, .total-row .summary-value { font-size: 14px; font-weight: 800; color: #003366; padding: 8px 12px; }
.invoice-footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; display: grid; grid-template-columns: minmax(0, 1fr) 84px minmax(0, 1fr); align-items: end; gap: 12px; font-size: 11px; color: #333; }
.invoice-footer > .signature-box:first-child { justify-self: start; } .invoice-footer > .signature-box:last-child { justify-self: end; }
.signature-section { display: flex; gap: 30px; margin-left: auto; margin-right: 18px; }
.signature-box { text-align: center; font-weight: 600; min-width: 140px; }
.signature-line { border-bottom: 1px solid #333; height: 30px; margin-bottom: 4px; }
`;

const logoSrc = (logo: string): string => {
  if (/^(data:|https?:)/i.test(logo)) return logo;
  try {
    return new URL(logo, window.location.href).href;
  } catch {
    return logo;
  }
};

const header = (h: Json): string => {
  const words = String(h?.name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const cut = words.findIndex(
    (w, i) =>
      i > 0 &&
      /^(nursing|medical|hospital|health|clinic|maternity|mission|memorial|healthcare|centre|center|dispensary|limited|ltd)$/i.test(w),
  );
  const first = cut > 0 ? words.slice(0, cut).join(' ') : words[0] || '';
  const rest = cut > 0 ? words.slice(cut).join(' ') : words.slice(1).join(' ');

  const tall = String(h?.letterheadLogo || '') === 'tall';
  const lines = hospitalAddressLines(h);
  return `
  <div class="top-stripe"><div class="stripe-blue"></div><div class="stripe-green"></div><div class="stripe-orange"></div></div>
  <div class="header-container${tall ? ' header-tall-logo' : ''}">
    <div class="header-left">
      ${h?.logo ? `<img src="${esc(logoSrc(h.logo))}" alt="${esc(h.name)} logo" class="header-logo">` : ''}
      <div class="header-title-box"><h1>${esc(first)}</h1>${rest ? `<h2>${esc(rest)}</h2>` : ''}</div>
    </div>
    <div class="header-divider"></div>
    <div class="header-right">${lines.map(esc).join('<br>')}</div>
  </div>`;
};

const section = (title: string): string =>
  `<div class="section-header"><div class="accent-bar"></div><div class="title-text">${esc(title)}</div></div>`;

const bioRows = (d: Json, row3: [string, string][], row4: [string, string][], lastCell?: [string, string], unitLabel = 'Unit'): string => {
  const p = d.patient || {};
  const v = d.visit || {};
  const cell = ([label, value]: [string, string], cls = '') =>
    `<td class="label">${esc(label)}</td><td${cls ? ` class="${cls}"` : ''}>${dash(value)}</td>`;
  const idText = String(p.nationalId || p.id || '');
  return `
  <table class="patient-bio-table"><tbody>
    <tr><td class="label">Patient</td><td class="val-col1">${esc(p.name)}</td>
        <td class="label">OP Number</td><td class="val-col2">${dash(p.id)}</td>
        <td class="label">Age</td><td class="val-col3">${dash(p.age)}</td></tr>
    <tr>${cell(['Account', p.account])}${cell([unitLabel, v.unit])}${cell(['Sex', p.sex])}</tr>
    <tr>${row3.map((c, n) => (n === row3.length - 1 && row3.length < 3 ? `<td class="label">${esc(c[0])}</td><td colspan="${7 - row3.length * 2}">${dash(c[1])}</td>` : cell(c))).join('')}</tr>
    <tr>${row4.map((c) => cell(c)).join('')}
        ${lastCell ? cell(lastCell) : `<td colspan="2" class="barcode-box">${barcodeSvg(idText)}<div class="barcode-text">${esc(idText)}</div></td>`}</tr>
  </tbody></table>`;
};

const pageFooter = (h?: Json): string =>
  String(h?.slogan || '').trim()
    ? `<div class="page-footer"><div class="top-stripe"><div class="stripe-blue"></div><div class="stripe-green"></div><div class="stripe-orange"></div></div><div class="slogan">${esc(h?.slogan)}</div></div>`
    : '';

const page = (title: string, css: string, body: string, h?: Json, onePage = false): string =>
  `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(title)}</title><style>${BASE_CSS}${css}</style>${onePage ? FIT_ONE_PAGE : ''}</head><body>${onePage ? `<div class="fit-page">${body}</div>` : body}${pageFooter(h)}</body></html>`;

const resultFlag = (value: unknown, reference: unknown): 'High' | 'Low' | '' => {
  const v = String(value ?? '').trim();
  const ref = String(reference ?? '')
    .replace(/,/g, '')
    .trim();
  if (!/^[<>]?\s*-?\d+(\.\d+)?$/.test(v)) return '';
  const n = parseFloat(v.replace(/^[<>]\s*/, ''));
  let m = ref.match(/^(-?\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(-?\d+(?:\.\d+)?)/i);
  if (m) return n < parseFloat(m[1]) ? 'Low' : n > parseFloat(m[2]) ? 'High' : '';
  if ((m = ref.match(/^(?:<|≤|<=|up to|less than)\s*(-?\d+(?:\.\d+)?)/i))) return n > parseFloat(m[1]) ? 'High' : '';
  if ((m = ref.match(/^(?:>|≥|>=|more than|greater than)\s*(-?\d+(?:\.\d+)?)/i))) return n < parseFloat(m[1]) ? 'Low' : '';
  return '';
};

const blankIfNone = (v: unknown): string => {
  const t = String(v ?? '').trim();
  return /^(-+|—|–|n\/?a|none|null|undefined)$/i.test(t) ? '' : esc(t);
};

const egfrRow = (o: Json): Json | null =>
  classifyEgfr(o.egfr) ? { name: 'eGFR', value: String(o.egfr).trim(), unit: EGFR_UNIT, reference: EGFR_REFERENCE } : null;
const egfrReference = (o: Json): string => {
  const c = classifyEgfr(o.egfr);
  if (!c) return '';

  const k = (t: string) => `<span class="keep-case">${esc(t)}</span>`;
  return `<div class="section-header"><div class="accent-bar"></div><div class="title-text">${k('eGFR')} Reference Categories</div></div>
  <table class="report-table egfr-table">
    <thead><tr><th>Category</th><th>${k('eGFR')} Value (${k(EGFR_UNIT)})</th><th>Description/Term</th></tr></thead>
    <tbody>${EGFR_CATEGORIES.map((x) => `<tr${x.code === c.code ? ' class="egfr-current"' : ''}><td>${esc(x.code)}</td><td>${esc(x.range)}</td><td>${esc(x.term)}</td></tr>`).join('')}</tbody>
  </table>
  <div class="egfr-note">eGFR <strong>${esc(String(o.egfr).trim())}</strong> ${esc(EGFR_UNIT)}: <strong>${esc(c.code)} — ${esc(c.term)}</strong></div>`;
};
const labReport = (d: Json, blanks = false): string => {
  void blanks;
  const cellText = (v: unknown, _missing: (x: unknown) => string) => blankIfNone(v);
  const o = d.order || {};
  const egfr = egfrRow(o);
  const rows = [...((o.parameters || []) as Json[]), ...(egfr ? [egfr] : [])];

  const testComment =
    o.testComment && !richTextIsEmpty(o.testComment) ? `<div class="comment-item rich-block">${sanitizeRichText(o.testComment)}</div>` : '';
  const setupComments =
    testComment +
    rows
      .filter((r) => r.comment && !richTextIsEmpty(r.comment))
      .map(
        (r) => `<div class="comment-item"><strong>${esc(r.name)}:</strong> <span class="rich">${sanitizeRichText(r.comment)}</span></div>`,
      )
      .join('');

  const comments =
    setupComments +
    String(o.notes || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^([^:]{1,40}):\s*(.+)$/);
        return m
          ? `<div class="comment-item"><strong>${esc(m[1])}:</strong> ${esc(m[2])}</div>`
          : `<div class="comment-item">${esc(line)}</div>`;
      })
      .join('');
  return page(
    `Laboratory Diagnostic Report - ${d.hospital?.name || ''}`,
    LAB_CSS,
    `
  ${header(d.hospital)}
  <div class="doc-title-banner">LABORATORY DIAGNOSTIC REPORT</div>
  ${bioRows(
    d,
    [
      ['Lab No.', o.id],
      ['Requesting Doctor/Clinician', o.requestedBy],
      ['Tel', d.patient?.phone],
    ],
    [
      ['Sample Rcvd', labTime(o.sampleCollectedAt)],
      ['Reported On', labTime(o.reportedAt)],
    ],
    ['Sample Type', o.sampleType],
  )}
  <div class="doc-title-banner">TEST RESULT</div>
  ${section(o.testName || 'Laboratory Test')}
  <table class="report-table lab-results">
    <thead><tr><th>Parameter</th><th>Result</th><th>Unit</th><th>Reference Range</th><th>Status</th></tr></thead>
    <tbody>${
      rows.length
        ? rows
            .map((r) => {
              const f = resultFlag(r.value, r.reference);
              return `<tr><td>${cellText(r.name, esc)}</td><td${f ? ' class="flagged"' : ''}>${cellText(r.value, dash)}</td><td>${cellText(r.unit, esc)}</td><td>${cellText(r.reference, esc)}</td><td>${f ? `<span class="flag-${f.toLowerCase()}">${f}</span>` : ''}</td></tr>`;
            })
            .join('')
        : '<tr><td colspan="5">No findings have been recorded for this test yet.</td></tr>'
    }</tbody>
  </table>
  ${egfrReference(o)}
  ${section('Clinical Comment')}
  <div class="clinical-comments-box">${comments || '<div class="comment-item">No clinical comments were recorded with this result.</div>'}</div>
  <div class="footer-container lab-report-footer">
    <div class="certification-stamp">✓ Electronically Certified by Medical Laboratory Officer<br><span style="font-size: 9px; font-weight: normal;">Certified Digital Stamp Valid Without Manual Signature</span></div>
    ${qrBlock(d)}
  </div>`,
    d.hospital,
    true,
  );
};

const dayOnly = (v: unknown): string => dmy(v);

const respSpo2 = (vt: Json): string => {
  const rr = String(vt?.respiratoryRate ?? '').trim();
  const o2 = String(vt?.spo2 ?? '').trim();
  return [rr && `${rr} /min`, o2 && `${o2.replace(/%$/, '')}%`].filter(Boolean).join(' / ');
};

const noPieces = (v: unknown): string =>
  String(v ?? '')
    .replace(/(^|[-–·,;]\s*)\d+(\.\d+)?\s*(pieces?|pcs?)\b\s*[-–·,;]?\s*/gi, '$1')
    .replace(/^\s*[-–·,;]\s*/, '')
    .trim();

const patientSummary = (d: Json): string => {
  const c = d.consultation || {};
  const v = d.visit || {};
  const vt = d.vitals || null;
  const meds = (c.prescriptions || []) as Json[];
  const dx = (c.diagnoses || []) as string[];
  const inv = (d.investigations || []) as Json[];
  const procs = (d.procedures || []) as string[];
  const fu = d.followUp || {};
  const dis = d.discharge || {};
  const officer = d.officer || {};
  const visitDate = v.date ? labTime(`${v.date} ${String(v.time || '').slice(0, 5)}`.trim()) : labTime(c.date);
  const vitalCols: [string, string, string][] = vt
    ? [
        ['Blood Pressure', vt.bp, 'mmHg'],
        ['Pulse', vt.pulse, 'bpm'],
        ['Temperature', vt.temperature, '°C'],
        ['Resp. Rate / SpO₂', respSpo2(vt), ''],
        ['Weight', vt.weight, 'kg'],
        ['Height', vt.height, 'cm'],
        ['BMI', vt.bmi, ''],
      ]
    : [];
  const box = (text: unknown, empty: string) => `<div class="clinical-box">${String(text ?? '').trim() ? esc(text) : empty}</div>`;

  return page(
    `Outpatient Clinical Summary Report - ${d.hospital?.name || ''}`,
    SUMMARY_CSS + OUTPATIENT_SUMMARY_CSS + DISCHARGE_AS_BEFORE_CSS,
    `
  ${header(d.hospital)}
  <div class="doc-title-banner">OUTPATIENT CLINICAL SUMMARY REPORT</div>
  ${bioRows(
    d,
    [
      ['Scheme', c.scheme],
      ['Attending Doctor / Clinician', c.doctor],
      ['ID Number', d.patient?.nationalId],
    ],
    [
      ['Visit Date', visitDate],
      ['Contact Number', d.patient?.phone],
    ],
    ['Residential Address', d.patient?.address],
    'Department',
  )}
  ${section('Vital Signs')}
  ${
    vt
      ? `<table class="report-table vitals-table">
    <thead><tr>${vitalCols.map(([l]) => `<th>${esc(l)}</th>`).join('')}</tr></thead>
    <tbody><tr>${vitalCols.map(([label, val, unit]) => `<td data-label="${esc(label)}">${String(val ?? '').trim() ? `<span>${esc(val)}${unit ? ` <span class="unit">${esc(unit)}</span>` : ''}</span>` : '<span></span>'}</td>`).join('')}</tr></tbody>
  </table>${vt.recordedAt ? `<div class="vitals-note">Taken ${esc(labTime(vt.recordedAt))}${vt.recordedBy ? ` by ${esc(vt.recordedBy)}` : ''}</div>` : ''}`
      : '<div class="clinical-box">No vital signs were recorded for this visit.</div>'
  }
  ${section('Diagnosis')}
  <div class="clinical-box"><div class="badge-container">${dx.length ? dx.map((t) => `<span class="diagnosis-badge">${esc(t)}</span>`).join('') : 'No diagnosis was recorded.'}</div></div>
  ${section('Chief Complaints')}
  <div class="clinical-box complaint-text">${dash(c.chiefComplaint)}</div>
  ${section('Examination Findings')}
  ${box(c.examinationFindings, 'No examination findings were recorded.')}
  ${section('Investigations')}
  ${
    inv.length
      ? `<table class="report-table">
    <thead><tr><th>Investigation</th><th>Type</th></tr></thead>
    <tbody>${inv.map((i) => `<tr><td><strong>${esc(i.name)}</strong></td><td>${dash(i.type)}</td></tr>`).join('')}</tbody>
  </table>`
      : '<div class="clinical-box">No laboratory or imaging investigations were ordered.</div>'
  }
  ${section('Procedures')}
  ${procs.length ? `<div class="clinical-box"><ul class="plain-list">${procs.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>` : '<div class="clinical-box">No procedures were ordered.</div>'}
  ${section('Treatment Given')}
  ${
    meds.length
      ? medTable(
          meds.map((m) => ({
            name: m.name,
            dose: m.dose !== undefined ? noPieces(m.dose) : noPieces(m.dosage),
            route: m.route,
            frequency: m.frequency,
            duration: m.durationOnly ?? m.duration,
          })),
        )
      : '<div class="clinical-box">No medication was prescribed in this visit.</div>'
  }
  ${section('Return Date')}
  <div class="clinical-box">${fu.at ? `<strong>${esc(labTime(fu.at))}</strong>${fu.department ? ` &nbsp;—&nbsp; ${esc(fu.department)}` : ''}` : 'No follow-up review was scheduled.'}</div>
  <div class="footer-container summary-footer">
    <div class="tech-signature officer">
      <div class="sign-row"><span>Discharging Officer:</span>${officer.name ? `<strong>${esc(officer.name)}</strong>` : '<span class="write-line"></span>'}</div>
      <div class="sign-row"><span>Designation:</span>${officer.designation ? `<strong>${esc(officer.designation)}</strong>` : '<span class="write-line"></span>'}<span class="reg-label">Reg. No</span>${officer.regNo ? `<strong>${esc(officer.regNo)}</strong>` : '<span class="write-line"></span>'}</div>
      <div class="sign-row"><span>Date:</span><strong>${dash(dayOnly(dis.date))}</strong></div>
    </div>
    <div class="stamp-column">
      ${qrBlock(d)}
      <div class="certification-stamp">✓ Electronically Certified Clinical Encounter Summary<br><span style="font-size: 9px; font-weight: normal;">Generated via WiseCare Hospital Information System</span></div>
    </div>
  </div>`,
    d.hospital,
  );
};

const OUTPATIENT_SUMMARY_CSS = `
.doc-title-banner { text-align: center; }
.section-header .title-text { text-align: left; }
`;

const nameOnce = (v: unknown): string =>
  [
    ...new Set(
      String(v ?? '')
        .split('•')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.toLowerCase()),
    ),
  ]
    .map(
      (low) =>
        String(v ?? '')
          .split('•')
          .map((t) => t.trim())
          .find((t) => t.toLowerCase() === low) as string,
    )
    .join(' • ');
const medTable = (
  rows: Json[],
) => `<table class="report-table med-table"><colgroup><col class="c-name"><col class="c-dose"><col class="c-route"><col class="c-freq"><col class="c-dur"></colgroup><thead><tr><th>Medication / Treatment</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Duration</th></tr></thead>
    <tbody>${rows.map((m) => `<tr><td><strong>${esc(nameOnce(m.name))}</strong>${m.notes && !/^\s*(take as directed|taken prior to admission)\.?\s*$/i.test(String(m.notes)) ? `<div class="med-note">${esc(m.notes)}</div>` : ''}</td><td>${dash(m.dose)}</td><td>${dash(m.route)}</td><td>${dash(m.frequency)}</td><td>${dash(m.duration)}</td></tr>`).join('')}</tbody></table>`;

const dischargeSummary = (d: Json): string => {
  const p = d.patient || {};
  const a = d.admission || {};
  const x = d.discharge || {};
  const off = d.officer || {};

  const reviewText = String(x.instructions || '').replace(/^(review at .*?)\s+with\s+/i, '$1 by ');
  const cell = (label: string, value: unknown) => `<td class="label">${esc(label)}</td><td>${dash(value)}</td>`;
  const list = (items: string[], empty: string) =>
    items.length
      ? `<div class="clinical-box"><ul class="plain-list">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`
      : `<div class="clinical-box">${empty}</div>`;
  const inv = (x.investigations || []) as Json[];
  const tx = (x.treatment || []) as Json[];
  const dm = (x.medicationRows || []) as Json[];

  const vt = d.vitals || null;
  const vitalCols: [string, string, string][] = vt
    ? [
        ['Blood Pressure', vt.bp, 'mmHg'],
        ['Pulse', vt.pulse, 'bpm'],
        ['Temperature', vt.temperature, '°C'],
        ['Resp. Rate / SpO₂', respSpo2(vt), ''],
        ['Weight', vt.weight, 'kg'],
        ['Height', vt.height, 'cm'],
        ['BMI', vt.bmi, ''],
      ]
    : [];
  return page(
    `Inpatient Discharge Summary - ${d.hospital?.name || ''}`,
    SUMMARY_CSS + DISCHARGE_CSS + DISCHARGE_AS_BEFORE_CSS,
    `
  ${header(d.hospital)}
  <div class="doc-title-banner">INPATIENT DISCHARGE SUMMARY</div>
  <table class="patient-bio-table discharge-bio"><tbody>
    <tr>${cell('Patient Name', `${p.name || ''}${p.id ? ` (${p.id})` : ''}`)}${cell('IP No.', a.ipNo)}${cell('Age', p.age)}</tr>
    <tr>${cell('Patient Type', p.category)}${cell('Department', a.department)}${cell('Sex', p.sex)}</tr>
    <tr>${cell('Patient Sub-Type', p.subCategory)}${cell('Attending Doctor', a.doctor)}${cell('Residence', p.address)}</tr>
    <tr>${cell('Scheme', a.scheme)}${cell('Contact No.', p.phone)}${cell('Admission Date', labTime(a.admittedOn))}</tr>
    <tr>${cell('Ward Name', a.ward)}${cell('Status', a.status)}${cell('Discharge Date', labTime(a.dischargedOn))}</tr>
  </tbody></table>
  ${section('Vital Signs')}
  ${
    vt
      ? `<table class="report-table vitals-table">
    <thead><tr>${vitalCols.map(([l]) => `<th>${esc(l)}</th>`).join('')}</tr></thead>
    <tbody><tr>${vitalCols.map(([label, val, unit]) => `<td data-label="${esc(label)}">${String(val ?? '').trim() ? `<span>${esc(val)}${unit ? ` <span class="unit">${esc(unit)}</span>` : ''}</span>` : '<span></span>'}</td>`).join('')}</tr></tbody>
  </table>${vt.recordedAt ? `<div class="vitals-note">Taken ${esc(labTime(vt.recordedAt))}${vt.recordedBy ? ` by ${esc(vt.recordedBy)}` : ''}</div>` : ''}`
      : '<div class="clinical-box">No vital signs were recorded.</div>'
  }
  ${section('Diagnosis')}
  <div class="clinical-box"><div class="badge-container">${(x.diagnoses || []).length ? (x.diagnoses as string[]).map((t) => `<span class="diagnosis-badge">${esc(t)}</span>`).join('') : 'No diagnosis was recorded.'}</div></div>
  ${section('Chief Complaint(s)')}
  <div class="clinical-box complaint-text">${dash(x.chiefComplaint)}</div>
  ${section('Examination Findings')}
  <div class="clinical-box">${String(x.examinationFindings || '').trim() ? esc(x.examinationFindings) : 'No examination findings were recorded.'}</div>
  ${section('Investigations Done')}
  ${inv.length ? `<table class="report-table"><thead><tr><th>Investigation</th><th>Type</th></tr></thead><tbody>${inv.map((i) => `<tr><td><strong>${esc(i.name)}</strong></td><td>${dash(i.type)}</td></tr>`).join('')}</tbody></table>` : '<div class="clinical-box">No investigations were done.</div>'}
  ${section('Procedures (Medical & Surgical)')}
  ${list((x.procedures || []) as string[], 'No procedures were done during the stay.')}
  ${section('Treatment Given')}
  ${tx.length ? medTable(tx) : '<div class="clinical-box">No treatment was recorded.</div>'}
  ${section('Discharge Medication')}
  ${dm.length ? medTable(dm) : (x.medications || []).length ? list(x.medications as string[], '') : '<div class="clinical-box">No discharge medication.</div>'}
  ${section('Return Date / Review Date')}
  <div class="clinical-box">${x.returnAt ? `<strong>${esc(labTime(x.returnAt))}</strong>` : 'No review date was set.'}${reviewText ? `<br>${esc(reviewText)}` : ''}</div>
  <div class="footer-container lab-footer">
    <div class="tech-signature officer">
      <div class="sign-row"><span>Discharging Officer's Name:</span>${off.name ? `<strong>${esc(off.name)}</strong>` : '<span class="write-line"></span>'}</div>
      <div class="sign-row"><span>Designation:</span>${off.designation ? `<strong>${esc(off.designation)}</strong>` : '<span class="write-line"></span>'}</div>
      <div class="sign-row"><span>Reg. No:</span>${off.regNo ? `<strong>${esc(off.regNo)}</strong>` : '<span class="write-line"></span>'}</div>
      <div class="sign-row"><span>Date:</span><strong>${dash(dmy(x.date))}</strong></div>
    </div>
    ${qrBlock(d)}
    <div class="certification-stamp">✓ Electronically Certified Inpatient Discharge Summary<br><span style="font-size: 9px; font-weight: normal;">Generated via WiseCare Hospital Information System</span></div>
  </div>`,
    d.hospital,
  );
};

const DISCHARGE_AS_BEFORE_CSS = `
.section-header { background-color: #0a3d7a; }
.section-header .title-text { text-align: left; }

body, body * { font-weight: 700 !important; }

.med-table { table-layout: fixed; width: 100%; }
.med-table col.c-name { width: 34%; } .med-table col.c-dose { width: 14%; } .med-table col.c-route { width: 11%; }
.med-table col.c-freq { width: 27%; } .med-table col.c-dur { width: 14%; }
.med-table td, .med-table th { vertical-align: top; overflow-wrap: anywhere; } .med-note { font-size: 9px; color: #555; }
.doc-title-banner { text-align: center; color: #003366; border-color: #d0d0d0; }
.report-table th { border-bottom-color: #0a3d7a; }
`;

const ADMISSION_NOTES_CSS = `
.acn-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; margin: 3px 0; font-size: 11px; }
.acn-row > b { white-space: nowrap; }
.acn-opt { white-space: nowrap; }
.acn-opt.on { font-weight: 700; color: #0d47a1; }
.acn-cb { display: inline-block; width: 10px; height: 10px; border: 1px solid #333; margin-right: 3px; vertical-align: -1px; text-align: center; font-size: 9px; line-height: 10px; font-weight: 800; }
.acn-opt.on .acn-cb { background: #0d47a1; border-color: #0d47a1; color: #fff; }
.acn-detail { flex: 1; min-width: 40%; border-bottom: 1px dotted #777; min-height: 13px; }
.acn-sub { font-size: 10px; font-weight: 800; color: #003366; text-transform: uppercase; margin: 6px 0 2px; letter-spacing: 0.3px; }
.acn-tag { font-size: 9px; color: #555; background: #eef2f6; border-radius: 3px; padding: 1px 4px; margin-left: 4px; text-transform: uppercase; }
.acn-yn { margin-right: 18px; }
`;
const admissionNotesDoc = (d: Json, n: Json): string => {
  const p = d.patient || {};
  const a = d.admission || {};
  const vt = d.vitals || null;
  const vitalCols: [string, string, string][] = vt
    ? [
        ['Blood Pressure', vt.bp, 'mmHg'],
        ['Pulse', vt.pulse, 'bpm'],
        ['Temperature', vt.temperature, '°C'],
        ['Resp. Rate / SpO₂', respSpo2(vt), ''],
        ['Weight', vt.weight, 'kg'],
        ['Height', vt.height, 'cm'],
        ['BMI', vt.bmi, ''],
      ]
    : [];
  const cell = (label: string, value: unknown) => `<td class="label">${esc(label)}</td><td>${dash(value)}</td>`;
  const box = (t: unknown) => `<div class="clinical-box">${String(t ?? '').trim() ? esc(t) : 'Not recorded.'}</div>`;
  const tick = (on: boolean) => `<span class="acn-cb">${on ? '✓' : ''}</span>`;
  const exam = ((n.exam || []) as Json[])
    .map(
      (e) => `
    <div class="acn-row"><b>${esc(e.label)}:</b> ${((e.options || []) as Json[]).map((o) => `<span class="acn-opt${o.on ? ' on' : ''}">${tick(!!o.on)}${esc(o.name)}</span>`).join(' ')}</div>
    ${e.detailLabel || e.notes ? `<div class="acn-row"><b>${esc(e.detailLabel || 'Details')}:</b> <span class="acn-detail">${esc(e.notes || '')}</span></div>` : ''}`,
    )
    .join('');

  const table = (all: Json[], cols0: [string, string][], empty: string, withOpd = false) => {
    const rows = all.filter((r) => withOpd || !r.opd);
    const cols = cols0.filter((c) => c[0] !== 'status');
    return rows.length
      ? `<table class="report-table"><thead><tr>${cols.map((c) => `<th>${esc(c[1])}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c, i) => `<td>${i === 0 ? `<strong>${esc(r[c[0]])}</strong>` : dash(r[c[0]])}</td>`).join('')}</tr>`).join('')}</tbody></table>`
      : `<div class="clinical-box">${empty}</div>`;
  };
  const badges = (list: string[], empty: string) =>
    list.length
      ? `<div class="badge-container">${list.map((t) => `<span class="diagnosis-badge">${esc(t)}</span>`).join('')}</div>`
      : empty;
  const yn = (v: string) => `${tick(v === 'Yes')}Yes &nbsp; ${tick(v === 'No')}No`;

  return page(
    `Admission Clinical Notes - ${p.name || ''}`,
    SUMMARY_CSS + DISCHARGE_CSS + ADMISSION_NOTES_CSS + DISCHARGE_AS_BEFORE_CSS,
    `
  ${header(d.hospital)}
  <div class="doc-title-banner">INPATIENT ADMISSION CLINICAL NOTES</div>
  <table class="patient-bio-table discharge-bio"><tbody>
    <tr>${cell('Patient Name', p.name)}${cell('IP No.', a.ipNo)}${cell('Age', p.age)}</tr>
    <tr>${cell('Patient Type', p.category)}${cell('Department', a.department)}${cell('Sex', p.sex)}</tr>
    <tr>${cell('Scheme', a.scheme)}${cell('Attending Doctor / Clinician', n.clinician || a.doctor)}${cell('Residence', p.address)}</tr>
    <tr>${cell('Ward Name', a.ward)}${cell('Contact No.', p.phone)}${cell('Adm. Date', labTime(a.admittedOn))}</tr>
  </tbody></table>
  ${section('Vital Signs')}
  ${
    vt
      ? `<table class="report-table vitals-table">
    <thead><tr>${vitalCols.map(([l]) => `<th>${esc(l)}</th>`).join('')}</tr></thead>
    <tbody><tr>${vitalCols.map(([label, val, unit]) => `<td data-label="${esc(label)}">${String(val ?? '').trim() ? `<span>${esc(val)}${unit ? ` <span class="unit">${esc(unit)}</span>` : ''}</span>` : ''}</td>`).join('')}</tr></tbody>
  </table>${vt.recordedAt ? `<div class="vitals-note">Taken ${esc(labTime(vt.recordedAt))}${vt.recordedBy ? ` by ${esc(vt.recordedBy)}` : ''}</div>` : ''}`
      : '<div class="clinical-box">No vital signs were recorded.</div>'
  }
  ${section('Reason for Admission & Chief Complaint (CC)')}
  ${box(n.chiefComplaint)}
  ${section('Physical Examination on Admission')}
  <div class="clinical-box" style="white-space:normal">${exam}</div>
  ${section('History of Present Illness (HPI)')}
  ${box(n.hpi)}
  ${section('Past Medical & Surgical History (PMH / PSH)')}
  ${box(n.pastHistory)}
  ${section('Current Medications & Substance Use')}
  <div class="clinical-box" style="white-space:normal">
    <div class="acn-sub">Regular medications</div>
    ${((n.currentMedRows || []) as Json[]).length ? medTable(n.currentMedRows) : ((n.currentMeds || []) as string[]).length ? `<ul class="plain-list">${(n.currentMeds as string[]).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : 'None recorded.'}
    <div class="acn-row" style="margin-top:6px"><span class="acn-yn"><b>Alcohol:</b> ${yn(n.alcohol)}</span><span class="acn-yn"><b>Tobacco:</b> ${yn(n.tobacco)}</span><b>Other:</b> <span class="acn-detail">${esc(n.other || '')}</span></div>
  </div>
  ${section('Provisional / Working Diagnosis')}
  <div class="clinical-box" style="white-space:normal">
    <div class="acn-sub">Primary diagnosis</div>${badges(n.primary || [], 'Not recorded.')}
    <div class="acn-sub">Differential / secondary diagnoses</div>${badges(n.differentials || [], 'None.')}
  </div>
  ${section('Investigations Ordered')}
  <div class="acn-sub">Laboratory</div>${table(
    (n.labs || []).map((r: Json) => ({ ...r, urgency: r.opd ? '' : String(r.detail || '').replace(/^Urgency:\s*/i, '') })),
    [
      ['name', 'Test'],
      ['urgency', 'Urgency'],
    ],
    'No laboratory tests.',
    true,
  )}
  <div class="acn-sub">Radiology &amp; imaging</div>${table(
    n.rads || [],
    [
      ['name', 'Examination'],
      ['detail', 'Clinical indication'],
      ['status', 'Status'],
    ],
    'No imaging.',
    true,
  )}
  ${section('Initial Management & Treatment Plan')}
  <div class="acn-sub">Nursing &amp; bedside procedures</div>${table(
    n.procs || [],
    [
      ['name', 'Procedure'],
      ['detail', 'Instructions'],
      ['status', 'Status'],
    ],
    'No procedures.',
  )}
  <div class="acn-sub">Medications</div>${
    ((n.medRows || []) as Json[]).length
      ? medTable(n.medRows)
      : table(
          n.meds || [],
          [
            ['name', 'Drug'],
            ['detail', 'Dose · Route · Frequency · Duration'],
            ['status', 'Status'],
          ],
          'No medications prescribed.',
        )
  }
  ${String(n.plan || '').trim() ? `<div class="acn-sub">Other plan</div>${box(n.plan)}` : ''}
  <div class="footer-container lab-footer">
    <div class="tech-signature officer">
      <div class="sign-row"><span>Doctor / Clinician:</span><strong>${dash(n.clinician)}</strong></div>
      <div class="sign-row"><span>Designation:</span>${n.designation ? `<strong>${esc(n.designation)}</strong>` : '<span class="write-line"></span>'}</div>
      <div class="sign-row"><span>Reg. / License No:</span>${n.licenseNo ? `<strong>${esc(n.licenseNo)}</strong>` : '<span class="write-line"></span>'}</div>
      <div class="sign-row"><span>Signature:</span><span class="write-line"></span></div>
      <div class="sign-row"><span>Date &amp; Time:</span><strong>${dash(labTime(n.signedAt))}</strong></div>
    </div>
    ${qrBlock(d)}
    <div class="certification-stamp">✓ Electronically Certified Admission Clinical Notes<br><span style="font-size: 9px; font-weight: normal;">Generated via WiseCare Hospital Information System</span></div>
  </div>`,
    d.hospital,
  );
};

const EXT_CSS = `
.section-header { background-color: #0a3d7a; }
.section-header .title-text { text-align: left; }
.doc-title-banner { text-align: left; color: #0a2f5e; border-color: #0a3d7a; }
.report-table th { border-bottom-color: #0a3d7a; }
.ext-meta { display: flex; justify-content: space-between; font-size: 10.5px; font-weight: 700; margin: 0 0 6px; }
.ext-priority { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 22px; border: 1px solid #9fb3cc; border-radius: 4px; padding: 5px 10px; margin-bottom: 6px; font-size: 10.5px; font-weight: 700; }
.ext-priority .lbl { color: #0a2f5e; text-transform: uppercase; }
.ext-priority .stat { color: #b71c1c; }
.ext-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px 8px; margin: 4px 0 6px; }
.ext-grid .f { min-width: 0; } .ext-grid .f.w2 { grid-column: span 2; } .ext-grid .f.w4 { grid-column: span 4; }
.ext-grid .f b { display: block; font-size: 9px; text-transform: uppercase; color: #222; margin-bottom: 1px; }
.ext-grid .f div { border: 1px solid #9fb3cc; border-radius: 3px; padding: 3px 6px; min-height: 15px; font-size: 10.5px; white-space: pre-line; word-break: break-word; }
.ext-box { display: inline-block; width: 9px; height: 9px; border: 1px solid #333; margin-right: 4px; vertical-align: -1px; text-align: center; font-size: 8px; line-height: 9px; font-weight: 800; }
.ext-on .ext-box { background: #0a3d7a; border-color: #0a3d7a; color: #fff; }
.ext-on { font-weight: 800; color: #0a2f5e; }
.ext-safety { display: flex; flex-wrap: wrap; gap: 4px 16px; border: 1px solid #f0b46a; background: #fff8ec; border-radius: 4px; padding: 5px 10px; font-size: 10px; margin-bottom: 6px; }
.ext-safety .lbl { font-weight: 800; color: #a15c00; text-transform: uppercase; }
.ext-group { border: 1px solid #9fb3cc; border-radius: 4px; padding: 4px 8px 5px; margin-bottom: 5px; break-inside: avoid; }
.ext-group h4 { margin: 0 0 3px; font-size: 9.5px; color: #0a3d7a; text-transform: uppercase; letter-spacing: 0.3px; }
.ext-tests { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 2px 8px; font-size: 9.5px; }
.ext-vitals { width: 100%; border-collapse: collapse; text-align: center; font-size: 10px; margin: 4px 0 6px; }
.ext-vitals th { background: #eef2f7; border: 1px solid #9fb3cc; padding: 3px; font-size: 9px; text-transform: uppercase; }
.ext-vitals td { border: 1px solid #9fb3cc; padding: 4px; height: 14px; }
.ext-consent { border: 1px solid #9fb3cc; background: #f6f8fb; border-radius: 4px; padding: 5px 8px; font-size: 10px; margin: 4px 0; }
.ext-sign { border: 1px solid #9fb3cc; border-radius: 3px; height: 30px; }
.ext-foot { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin-top: 8px; }
.ext-footline { display: flex; justify-content: space-between; font-size: 9px; color: #666; border-top: 1px solid #ccc; padding-top: 3px; margin-top: 8px; }
@media screen and (max-width: 760px) { .ext-grid, .ext-tests { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;
const EXT_LAB: [string, string[]][] = [
  [
    'Haematology & Blood Banking',
    [
      'Full Blood Count (FBC/CBC)',
      'Haemoglobin (Hb) Only',
      'Peripheral Blood Film (PBF)',
      'Erythrocyte Sedimentation Rate (ESR)',
      'Blood Grouping & Rh Factor',
      'Crossmatch (Compatibility)',
      'Coombs Test (Direct/Indirect)',
      'Sickling Test',
      'Prothrombin Time (PT/INR)',
      'APTT',
      'Reticulocyte Count',
      'Bleeding & Clotting Time',
    ],
  ],
  [
    'Clinical Biochemistry & Endocrinology',
    [
      'Renal Function Tests (U&Es/Cr)',
      'Liver Function Tests (LFTs)',
      'Lipid Profile',
      'Fasting Blood Sugar (FBS)',
      'Random Blood Sugar (RBS)',
      'Glycated Haemoglobin (HbA1c)',
      'Serum Electrolytes (Na+, K+, Cl-)',
      'Serum Calcium & Phosphate',
      'Uric Acid',
      'Cardiac Enzymes (Troponin T/I)',
      'Serum Amylase / Lipase',
      'Thyroid Profile (T3, T4, TSH)',
      'Prostate Specific Antigen (PSA)',
      'Beta-hCG (Serum Quantitative)',
      'Vitamin B12 / Folate',
      'Serum Ferritin / Iron Studies',
    ],
  ],
  [
    'Parasitology, Microbiology & Serology',
    [
      'Blood Slide for Malaria (BS)',
      'Malaria Rapid Test (mRDT)',
      'Stool Microscopy (Ova & Cysts)',
      'Stool Occult Blood',
      'Urine Microscopy (Urinalysis)',
      'H. Pylori Antigen (Stool/Blood)',
      'Widal Test (Typhoid)',
      'Brucella Screen (SAT)',
      'Rheumatoid Factor (RF)',
      'ASOT (Anti-Streptolysin O)',
      'C-Reactive Protein (CRP)',
      'VDRL / RPR (Syphilis)',
      'HIV 1 & 2 Screening Test',
      'Hepatitis B Surface Ag (HBsAg)',
      'Hepatitis C Antibodies (HCV)',
      'High Vaginal Swab (HVS) C/S',
    ],
  ],
  [
    'Specialized Cultures, Molecular & Histopathology',
    [
      'Urine Culture & Sensitivity (C/S)',
      'Blood Culture & Sensitivity',
      'Sputum GeneXpert (TB / RIF)',
      'Sputum AFB Microscopy',
      'Wound / Pus Swab C/S',
      'Stool Culture & Sensitivity',
      'Pap Smear Cytology',
      'Histopathology (Biopsy Tissue)',
      'Fine Needle Aspiration (FNAC)',
    ],
  ],
];
const EXT_RAD: [string, string[]][] = [
  [
    'Digital Radiography (X-Ray)',
    [
      'Chest PA / AP',
      'Chest Lateral',
      'Abdomen Erect & Supine',
      'KUB (Kidneys, Ureter, Bladder)',
      'Skull AP / Lateral',
      'Paranasal Sinuses (PNS)',
      'Cervical Spine AP / Lat',
      'Thoracic Spine AP / Lat',
      'Lumbar Spine AP / Lat',
      'Pelvic & Both Hips AP',
      'Shoulder Joint (R / L)',
      'Humerus / Elbow (R / L)',
      'Wrist / Forearm (R / L)',
      'Hand / Fingers (R / L)',
      'Femur / Knee Joint (R / L)',
      'Tibia/Fibula & Ankle (R / L)',
      'Foot / Toes (R / L)',
      'Post-Reduction X-Ray',
      'HSG (Hysterosalpingography)',
      'Barium Meal / Swallow',
    ],
  ],
  [
    'Ultrasonography (Ultrasound)',
    [
      'Abdomen & Pelvis (Full)',
      'Upper Abdomen (Hepatobiliary)',
      'Pelvic Ultrasound',
      'Obstetric Ultrasound (Early/Routine)',
      'Obstetric Anomaly Scan',
      'Transvaginal Scan (TVS)',
      'KUB & Prostate (Transrectal/TA)',
      'Thyroid / Neck Ultrasound',
      'Breast Ultrasound (Bilateral)',
      'Scrotal / Testicular Doppler',
      'Venous Doppler (Lower/Upper Limb)',
      'Arterial Doppler Limb Scan',
      'Carotid Doppler Scan',
      'Musculoskeletal (MSK) Ultrasound',
      'Paediatric Cranial Ultrasound',
      'Focused FAST Scan (Trauma)',
    ],
  ],
  [
    'Computed Tomography (CT Scan)',
    [
      'CT Brain / Head (Plain)',
      'CT Brain (Contrast Enhanced)',
      'CT Chest (Plain / HRCT)',
      'CT Pulmonary Angiogram (CTPA)',
      'CT Abdomen & Pelvis (Plain)',
      'CT Abdomen & Pelvis (Triple Phase)',
      'CT Urogram (KUB Protocol)',
      'CT Cervical / Thoracic / Lumbar',
      'CT Paranasal Sinuses (PNS)',
      'CT Angiography (Brain / Limb)',
      'CT Coronary Angiogram',
      'CT Temporal Bone / Orbit',
    ],
  ],
  [
    'Magnetic Resonance Imaging (MRI)',
    [
      'MRI Brain (Plain / Contrast)',
      'MRI Spine (Cervical/Thoracic/Lumbar)',
      'MRI Knee Joint (R / L)',
      'MRI Shoulder Joint (R / L)',
      'MRI Pelvis / Prostate',
      'MRI Abdomen / MRCP',
      'MR Angiography (MRA / MRV)',
      'MRI Musculoskeletal / Soft Tissue',
    ],
  ],
];
const EXT_PRIORITIES: Record<string, string[]> = {
  laboratory: ['Routine', 'Urgent', 'STAT / Emergency'],
  radiology: ['Routine', 'Urgent', 'STAT / Emergency'],
  referral: ['Emergency (Immediate life-threat)', 'Urgent (Within 24 Hours)', 'Routine / Normal (Elective)'],
};
const EXT_TITLE: Record<string, string> = {
  laboratory: 'Laboratory Test Request Form',
  radiology: 'Radiology & Imaging Request Form',
  referral: 'Patient Referral Form',
};
const externalDoc = (d: Json, r: Json): string => {
  const kind = String(r.kind || 'laboratory');
  const p = d.patient || {};
  const box = (on: boolean, text: string, cls = '') =>
    `<span class="${on ? 'ext-on ' : ''}${cls}"><span class="ext-box">${on ? '✓' : ''}</span>${esc(text)}</span>`;
  const f = (label: string, value: unknown, w = '') =>
    `<div class="f${w ? ` ${w}` : ''}"><b>${esc(label)}</b><div>${esc(String(value ?? '').trim()) || '&nbsp;'}</div></div>`;
  const tests = new Set<string>((r.tests || []) as string[]);
  const groups = kind === 'laboratory' ? EXT_LAB : kind === 'radiology' ? EXT_RAD : [];
  const name = r.patientName || p.name;
  const sx = r.safety || {};
  const vt = r.vitals || {};
  const priority = `<div class="ext-priority"><span class="lbl">${kind === 'referral' ? 'Priority level' : 'Priority level'}:</span>${(EXT_PRIORITIES[kind] || []).map((x) => box(r.priority === x, x, /stat|emergency/i.test(x) ? 'stat' : '')).join('')}</div>`;
  const demo =
    kind === 'referral'
      ? `${f('Full patient name', name, 'w2')}${f('National ID / Birth Cert No', r.nationalId || p.nationalId, 'w2')}${f('Age', r.age || p.age)}${f('Sex', r.sex || p.sex)}${f('Patient phone number', r.phone || p.phone, 'w2')}${f('Residential address / village / county', r.residence || p.address, 'w2')}${f('Next of kin name & contact details', r.nextOfKin, 'w2')}`
      : `${f('Full patient name', name, 'w2')}${f('Patient Reg / OP-IP No', r.regNo || p.id)}${f('Request date & time', labTime(r.createdAt))}${f('Age', r.age || p.age)}${f('Sex', r.sex || p.sex)}${f('Contact / phone no', r.phone || p.phone)}${f('Residence / address', r.residence || p.address)}`;
  const body =
    kind === 'referral'
      ? `
  ${section('3. Vital Signs at Time of Referral')}
  <table class="ext-vitals"><thead><tr><th>BP (mmHg)</th><th>Pulse (bpm)</th><th>Temp (°C)</th><th>Resp Rate (/min)</th><th>SpO₂ (%)</th><th>GCS Score (/15)</th><th>RBS (mmol/L)</th></tr></thead>
    <tbody><tr>${['bp', 'pulse', 'temp', 'rr', 'spo2', 'gcs', 'rbs'].map((k) => `<td>${esc(vt[k] || '')}</td>`).join('')}</tr></tbody></table>
  ${section('4. Clinical Presentation & Reason for Referral')}
  <div class="ext-grid">${f('Chief complaint(s) & history of presenting illness', r.complaint, 'w4')}${f('Investigations done (lab, X-ray, ECG, ultrasound, etc.)', r.investigationsDone, 'w2')}${f('Procedures done & treatment given (medications & doses)', r.treatmentGiven, 'w2')}${f('Provisional / working diagnosis', r.diagnosis, 'w2')}${f('Specific reason for referral', r.reason, 'w2')}</div>
  ${section('5. Medical Authorization & Patient / Relative Consent')}
  <div class="ext-grid">${f('Referring doctor / medical officer name', r.doctor, 'w2')}${f('Reg. number (KMPDC / COC)', r.doctorReg)}<div class="f"><b>Signature &amp; official stamp</b><div class="ext-sign"></div></div></div>
  <div class="ext-consent"><b>Patient / Relative Informed Consent:</b> I confirm that the reasons for, and risks of, referral have been explained to me. I hereby consent to be transferred to the receiving facility.</div>
  <div class="ext-grid">${f('Patient / next of kin name', r.consentName, 'w2')}${f('Relationship to patient', r.consentRelationship)}<div class="f"><b>Signature / thumbprint</b><div class="ext-sign"></div></div></div>`
      : `
  ${section(`2. ${kind === 'laboratory' ? 'Laboratory' : 'Imaging'} Investigations Requested (Tick as Appropriate)`)}
  ${groups.map(([g, list]) => `<div class="ext-group"><h4>${esc(g)}</h4><div class="ext-tests">${list.map((t) => box(tests.has(t), t)).join('')}</div></div>`).join('')}
  ${
    [...tests].filter((t) => !groups.some(([, l]) => l.includes(t))).length
      ? `<div class="ext-group"><h4>Other</h4><div class="ext-tests">${[...tests]
          .filter((t) => !groups.some(([, l]) => l.includes(t)))
          .map((t) => box(true, t))
          .join('')}</div></div>`
      : ''
  }
  <div class="ext-grid">${f(kind === 'laboratory' ? 'Brief clinical history / diagnosis' : 'Clinical history & working diagnosis', r.history, 'w2')}${f(kind === 'laboratory' ? 'Other unlisted tests / specific instructions' : 'Specific anatomical region / special instructions', r.instructions, 'w2')}</div>
  ${section('3. Requesting Doctor / Clinician Authorization')}
  <div class="ext-grid">${f('Name of requesting doctor / clinician', r.doctor, 'w2')}${f('Cadre / reg. number', r.doctorReg)}<div class="f"><b>Signature &amp; stamp</b><div class="ext-sign"></div></div></div>`;
  return page(
    `${EXT_TITLE[kind]} - ${name || ''}`,
    SUMMARY_CSS + EXT_CSS,
    `
  ${header(d.hospital)}
  <div class="doc-title-banner">${esc(EXT_TITLE[kind].toUpperCase())}</div>
  <div class="ext-meta"><span>Ref: ${esc(r.id)}</span><span>${kind === 'referral' ? `Receiving facility: ${esc(r.receivingFacility || '')} &nbsp;·&nbsp; ` : ''}Date &amp; time: ${esc(labTime(r.createdAt))}</span></div>
  ${kind === 'referral' ? section('1. Referral Category / Priority Status') : ''}${priority}
  ${section(kind === 'referral' ? '2. Patient Identification & Contact Information' : `1. Patient Demographics & ${kind === 'radiology' ? 'Clinical Details' : 'Identification'}`)}
  <div class="ext-grid">${demo}</div>
  ${kind === 'radiology' ? `<div class="ext-safety"><span class="lbl">Safety / pregnancy check:</span><span>LMP: <b>${esc(sx.lmp || '______')}</b></span><span>Pregnant: <b>${esc(sx.pregnant || '___')}</b></span>${box(!!sx.renal, 'Renal failure / high Cr')}<span class="lbl">Contrast safety:</span>${box(!!sx.pacemaker, 'Pacemaker / metal implants')}${box(!!sx.contrastAllergy, 'Contrast allergy history')}</div>` : ''}
  ${body}
  <div class="ext-foot"><div class="certification-stamp">✓ Generated via WiseCare Hospital Information System</div>${qrBlock({ ...d, patient: { ...p, name } })}</div>
  <div class="ext-footline"><span>${esc(EXT_TITLE[kind])}</span><span>${kind === 'referral' ? 'Confidential Medical Document' : kind === 'laboratory' ? 'Confidential Diagnostic Requisition' : 'Confidential Requisition Document'}</span><span>Page 1 of 1</span></div>`,
    d.hospital,
    true,
  );
};

const GROUP_NAMES: Record<string, string> = {
  'nursing / bed': 'Inpatient (Bed & Ward Care)',
  drug: 'Pharmacy',
  drugs: 'Pharmacy',
  consultation: 'Consultation',
  laboratory: 'Laboratory',
  lab: 'Laboratory',
  radiology: 'Radiology & Imaging',
  imaging: 'Radiology & Imaging',
  pharmacy: 'Pharmacy',
  procedure: 'Procedures',
  'nursing procedure': 'Procedures',
  nursing: 'Procedures',
  inpatient: 'Inpatient',
  ward: 'Inpatient',
  bed: 'Inpatient',
};
const invoiceGroups = (items: Json[]) => {
  const groups: { name: string; total: number; items: (Json & { label: string })[] }[] = [];
  for (const it of items) {
    const desc = String(it.description || '').trim();

    const m = desc.match(/^([A-Za-z][A-Za-z &/-]{1,30}?)(?:\s*\([^)]*\))?\s*:\s*(.+)$/);
    const kindRaw = String(it.category || (m ? m[1] : '') || 'Other services').trim();
    const name = GROUP_NAMES[kindRaw.toLowerCase()] || kindRaw.replace(/\b\w/g, (c) => c.toUpperCase());
    let label =
      m && (!it.category || GROUP_NAMES[m[1].toLowerCase()] === name || m[1].toLowerCase() === kindRaw.toLowerCase()) ? m[2] : desc;
    label = sentence(
      label
        .replace(/^(Nursing Procedure|Procedure|Laboratory|Pharmacy|Radiology|Drug|Lab)\s*:\s*/i, '')
        .replace(/\s*\(Qty:\s*[\d.]+\)\s*$/i, '')
        .trim() || desc,
    );
    let g = groups.find((x) => x.name === name);
    if (!g) {
      g = { name, total: 0, items: [] };
      groups.push(g);
    }
    g.items.push({ ...it, label });
    g.total += Number(it.total || 0);
  }
  return groups;
};

const INVOICE_V2_CSS = `
.inv-title { border: 1px solid #111827; background: #f3f4f6; text-align: center; font-weight: 900; padding: 4px 0; margin: 10px 0 8px; letter-spacing: 0.1em; font-size: 12px; }
.inv-meta { display: flex; justify-content: space-between; align-items: center; border: 1px solid #9ca3af; background: #f9fafb; padding: 5px 8px; margin-bottom: 8px; font-weight: 700; font-size: 12px; }
.inv-meta .no { font-family: 'Courier New', Courier, monospace; color: #1e40af; }
.inv-bio { width: 100%; border-collapse: collapse; border: 1px solid #6b7280; margin-bottom: 12px; font-size: 10px; }
.inv-bio tr { border-bottom: 1px solid #9ca3af; } .inv-bio tr:last-child { border-bottom: 0; }
.inv-bio td { border-right: 1px solid #9ca3af; padding: 4px; text-transform: uppercase; } .inv-bio td:last-child { border-right: 0; }
.inv-bio td.label { font-weight: 700; background: #f3f4f6; white-space: nowrap; }
.inv-bar { background: #0b66b2; color: #fff; font-weight: 900; text-align: center; padding: 4px 0; margin-bottom: 4px; font-size: 10px; }
.inv-cats { width: 100%; border-collapse: collapse; border: 1px solid #6b7280; text-align: center; font-size: 10px; margin-bottom: 12px; }
.inv-cats th { background: #f3f4f6; color: #1f2937; font-weight: 700; padding: 4px; border-right: 1px solid #9ca3af; border-bottom: 1px solid #9ca3af; }
.inv-cats td { padding: 4px; font-weight: 700; border-right: 1px solid #9ca3af; }
.inv-cats th:last-child, .inv-cats td:last-child { border-right: 0; } .inv-cats td.grand { color: #1e3a8a; font-weight: 900; }

.inv-items { margin-bottom: 20px; }
.inv-items table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10.5px; border: 1px solid #0b66b2; }
.inv-items th { background: #0b66b2; color: #fff; font-weight: 800; letter-spacing: 0.4px; padding: 7px 8px; border: 1px solid #0b66b2; text-align: left; }
.inv-items td { padding: 6px 8px; border: 1px solid #cfd8e3; vertical-align: middle; }
.inv-items tbody tr:nth-child(even) td { background: #f4f8fc; }
.inv-items td.d { font-weight: 600; color: #111827; word-break: break-word; }
.inv-items .c { text-align: center; } .inv-items .r { text-align: right; }
.inv-items td.n { font-variant-numeric: tabular-nums; white-space: nowrap; } .inv-items td.t { font-weight: 700; }
.inv-items th.c { text-align: center; } .inv-items th.r { text-align: right; }

.inv-items tfoot { display: table-row-group; }
.inv-items tfoot tr { break-inside: avoid; page-break-inside: avoid; }
.inv-items tfoot td { background: #f8fafc; border-color: #cfd8e3; }
.inv-items tfoot td.fl { text-align: right; white-space: normal; overflow-wrap: anywhere; font-weight: 700; letter-spacing: 0.3px; color: #374151; }
.inv-items tbody tr.dept td { background: #e8f0fa; color: #0b3d7a; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase; font-size: 10px; padding: 5px 8px; }
.inv-items td.d.sub { padding-left: 20px; }
.inv-items tfoot td.blank { background: #fff; border-left: hidden; border-bottom: hidden; }
.inv-items tfoot tr:not(.f1) td.blank { border-top: hidden; }
.inv-items tfoot tr.f5 td.blank { background: #fff; padding: 0; }
.inv-items tfoot td.fv { font-weight: 800; color: #111827; }
.inv-items tfoot tr.f1 td { border-top: 2px solid #0b66b2; }
.inv-items tfoot tr.f2 td.fv { color: #6b21a8; } .inv-items tfoot tr.f3 td.fv { color: #b91c1c; } .inv-items tfoot tr.f4 td.fv { color: #065f46; }
.inv-items tfoot tr.f5 td { background: #0b3d7a; color: #fff; font-weight: 900; font-size: 12px; border-color: #0b3d7a; padding: 8px; }
.inv-items tfoot tr.f5 td.fv { color: #fff; }
.inv-sum { width: 360px; font-size: 11px; } .inv-sum .summary-label { white-space: nowrap; }
.inv-sum tr.t2 td { color: #6b21a8; } .inv-sum tr.t3 td { color: #b91c1c; } .inv-sum tr.t4 td { color: #065f46; }
.inv-split { display: flex; align-items: stretch; border: 1px solid #6b7280; margin-bottom: 24px; }
.inv-split .items { width: 60%; border-right: 1px solid #6b7280; }
.inv-split .items table { width: 100%; border-collapse: collapse; font-size: 10px; text-align: left; }
.inv-split .items th { background: #f3f4f6; font-weight: 700; padding: 6px; border-bottom: 1px solid #9ca3af; border-right: 1px solid #9ca3af; }
.inv-split .items td { padding: 6px; border-right: 1px solid #9ca3af; border-bottom: 1px solid #d1d5db; }
.inv-split .items th:last-child, .inv-split .items td:last-child { border-right: 0; }
.inv-split .items .c { text-align: center; } .inv-split .items .r { text-align: right; } .inv-split .items td.d { font-weight: 600; } .inv-split .items td.t { font-weight: 700; }
.inv-split .totals { width: 40%; display: flex; flex-direction: column; font-size: 10px; }
.inv-split .totals > div { flex: 1 1 0; display: flex; justify-content: space-between; align-items: center; padding: 6px; border-bottom: 1px solid #9ca3af; }
.inv-split .totals > div:last-child { border-bottom: 0; }
.inv-split .totals .t1 { font-weight: 700; background: #f9fafb; }
.inv-split .totals .t2 { font-weight: 600; color: #6b21a8; } .inv-split .totals .t3 { font-weight: 600; color: #b91c1c; }
.inv-split .totals .t4 { font-weight: 600; color: #065f46; } .inv-split .totals .t5 { font-weight: 900; color: #1e3a8a; background: #eff6ff; font-size: 12px; }
.inv-foot { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: end; text-align: center; border-top: 1px solid #9ca3af; padding-top: 16px; margin-top: 16px; }
.inv-foot .l { text-align: left; } .inv-foot .rt { text-align: right; }
.inv-foot p { font-size: 9px; font-weight: 700; color: #374151; margin: 0 0 24px; }
.inv-foot .line { border-bottom: 1px solid #1f2937; width: 144px; } .inv-foot .rt .line { margin-left: auto; }
.inv-foot .mid { display: flex; flex-direction: column; align-items: center; }
.inv-foot .mid .qr-box { width: 64px; min-width: 64px; border: 1px solid #9ca3af; background: #f9fafb; padding: 4px; }
.inv-foot .mid .qr-box svg { width: 56px; height: 56px; }
.inv-foot .mid span { font-size: 8px; font-family: 'Courier New', Courier, monospace; color: #047857; font-weight: 700; margin-top: 4px; }
@media screen and (max-width: 760px) { .inv-split { flex-direction: column; } .inv-split .items, .inv-split .totals { width: 100%; } .inv-split .items { border-right: 0; border-bottom: 1px solid #6b7280; } }
`;
const invoice = (d: Json): string => {
  const i = d.invoice || {};
  const v = d.visit || {};
  const p = d.patient || {};

  const isRebate = (it: Json) => Number(it.total) < 0 && /rebate/i.test(String(it.description || ''));
  const rebates = ((i.items || []) as Json[]).filter(isRebate);

  const plain = (t: unknown) =>
    String(t ?? '')
      .replace(/^\s*\d{4}-\d{2}-\d{2}\s*[—–-]\s*/, '')
      .replace(/\s*[—–-]\s*[^—–]*\/\s*Bed\b.*$/i, '')
      .trim();
  const items: Json[] = [];
  ((i.items || []) as Json[])
    .filter((it) => !isRebate(it))
    .forEach((it) => {
      const description = plain(it.description);
      const price = Number(it.price || 0);
      const same = items.find((x) => x.description.toLowerCase() === description.toLowerCase() && Number(x.price || 0) === price);
      if (same) {
        same.quantity = Number(same.quantity || 0) + Number(it.quantity || 0);
        same.total = Number(same.total || 0) + Number(it.total || 0);
      } else items.push({ ...it, description });
    });

  const rebateDiscount = -rebates
    .filter((it) => /discount/i.test(String(it.description || '')))
    .reduce((a, it) => a + Number(it.total || 0), 0);
  const rebateTotal = -rebates
    .filter((it) => !/discount/i.test(String(it.description || '')))
    .reduce((a, it) => a + Number(it.total || 0), 0);
  const subtotal = rebates.length ? items.reduce((a, it) => a + Number(it.total || 0), 0) : Number(i.subtotal || 0);
  const ipd = /inpatient/i.test(String(i.visitType || ''));

  const cat = { consultation: 0, laboratory: 0, radiology: 0, procedures: 0, pharmacy: 0, inpatient: 0 };
  invoiceGroups(items).forEach((g) => {
    const n = g.name.toLowerCase();
    if (/consult/.test(n)) cat.consultation += g.total;
    else if (/lab/.test(n)) cat.laboratory += g.total;
    else if (/radiol|imaging/.test(n)) cat.radiology += g.total;
    else if (/pharm|drug/.test(n)) cat.pharmacy += g.total;
    else if (ipd && /inpatient|bed|ward/.test(n)) cat.inpatient += g.total;
    else cat.procedures += g.total;
  });
  const cell = (label: string, value: unknown) => `<td class="label">${esc(label)}</td><td>${dash(value)}</td>`;
  const phone = i.phone || p.phone;
  return page(
    `Invoice - ${d.hospital?.name || ''}`,
    INVOICE_CSS + INVOICE_V2_CSS,
    `
  ${header(d.hospital)}
  <div class="inv-title">${esc(i.docTitle || (ipd ? 'INPATIENT INVOICE' : 'OUTPATIENT INVOICE'))}</div>
  <div class="inv-meta"><div>Invoice No: <span class="no">${esc(i.id)}</span></div><div>Invoice Date: <span>${dash(dmy(i.date))}</span></div></div>
  <table class="inv-bio"><tbody>
    ${
      ipd
        ? `
    <tr>${cell('Patient Name', i.patientName)}${cell('Patient No.', p.id)}${cell('IP Visit No.', i.admissionNo || i.visitNo)}</tr>
    <tr>${cell('Payment Mode', p.category || i.paymentMode)}${cell('Sex', p.sex)}${cell('Age', p.age)}</tr>
    <tr>${cell('Patient Type', p.account || i.insuranceCompany)}${cell('Mobile No.', p.phone || i.phone)}${cell('Residence', p.address)}</tr>
    <tr>${cell('Scheme', i.scheme || v.scheme)}${cell('Member No (ID)', i.memberNo || p.memberNo)}${cell('Date of Admission', dmy(i.admittedOn))}</tr>
    <tr>${cell('Ward Name', i.ward)}${cell('Status', i.admissionStatus)}${cell('Discharge Date', dmy(i.dischargedOn))}</tr>
    `
        : `
    <tr>${cell('Patient Name', i.patientName)}${cell('Patient No.', p.id)}${cell('OP Visit No.', i.visitNo)}</tr>
    <tr>${cell('Payment Mode', p.category || i.paymentMode)}${cell('Sex', p.sex)}${cell('Age', p.age)}</tr>
    <tr>${cell('Patient Type', p.account || i.insuranceCompany)}${cell('Visit Date', dmy(v.date || i.date))}${cell('Residence', p.address)}</tr>
    <tr>${cell('Scheme', i.scheme || v.scheme)}${cell('Visit Type', 'Outpatient')}${cell('Member No (ID)', i.memberNo || p.memberNo)}</tr>
    `
    }
  </tbody></table>
  <div class="inv-bar">DEPARTMENTAL INVOICE SUMMARY</div>
  <table class="inv-cats"><thead><tr><th>CONSULTATION</th><th>LABORATORY</th><th>RADIOLOGY</th><th>PROCEDURES</th><th>PHARMACY</th>${ipd ? '<th>INPATIENT (BED &amp; WARD CARE)</th>' : ''}<th>TOTAL</th></tr></thead>
    <tbody><tr><td>${money2(cat.consultation)}</td><td>${money2(cat.laboratory)}</td><td>${money2(cat.radiology)}</td><td>${money2(cat.procedures)}</td><td>${money2(cat.pharmacy)}</td>${ipd ? `<td>${money2(cat.inpatient)}</td>` : ''}<td class="grand">${money2(subtotal)}</td></tr></tbody></table>
  <div class="inv-bar">ITEMIZED BREAKDOWN</div>
  <div class="inv-items"><table>
    <colgroup><col><col style="width:56px"><col style="width:200px"><col style="width:120px"></colgroup>
    <thead><tr><th>DESCRIPTION</th><th class="c">QTY</th><th class="r">PRICE</th><th class="r">TOTAL</th></tr></thead>
    <tbody>${invoiceGroups(items)
      .map(
        (g) =>
          `<tr class="dept"><td colspan="4">${esc(g.name)}</td></tr>${g.items.map((it) => `<tr><td class="d sub">${esc(it.label)}</td><td class="c n">${qty(it.quantity)}</td><td class="r n">${money2(it.price)}</td><td class="r n t">${money2(it.total)}</td></tr>`).join('')}`,
      )
      .join('')}</tbody>
    <tfoot>
      <tr class="f1"><td class="blank"></td><td colspan="2" class="fl">TOTAL AMOUNT</td><td class="r n fv">${money2(subtotal)}</td></tr>
      <tr class="f2"><td class="blank"></td><td colspan="2" class="fl">${ipd ? (i.pomsf ? 'SHA APPROVED AMOUNT' : 'TOTAL INPATIENT SHA REBATE') : 'SHA NEGOTIATED RATE'}</td><td class="r n fv">${money2(ipd ? (i.pomsf && i.shaApprovedAmount != null ? Number(i.shaApprovedAmount || 0) : Number(i.schemePaid || 0) + rebateTotal) : /\bsha\b|shif|social health|nhif/i.test(`${p.subCategory || ''} ${p.account || ''}`) ? Number(v.creditLimit || 0) : 0)}</td></tr>
      ${ipd && i.preauthCode ? `<tr class="f2"><td class="blank"></td><td colspan="2" class="fl">PREAUTH CODE</td><td class="r fv">${esc(i.preauthCode)}</td></tr>` : ''}
      <tr class="f3"><td class="blank"></td><td colspan="2" class="fl">DISCOUNTED AMOUNT BY HOSPITAL MANAGEMENT</td><td class="r n fv">${money2(Number(i.discount || 0) + rebateDiscount)}</td></tr>
      ${''}
      <tr class="f5"><td class="blank"></td><td colspan="2" class="fl">BALANCE</td><td class="r n fv">${money2(i.balance)}</td></tr>
    </tfoot>
  </table></div>
  <div class="inv-foot">
    <div class="l"><p>PATIENT SIGNATURE</p><div class="line"></div></div>
    <div class="mid">${qrBlock(d)}<span>✓ Electronically Certified Document</span></div>
    <div class="rt"><p>CASHIER</p><div class="line"></div></div>
  </div>`,
    d.hospital,
  );
};

const money2 = (n: unknown): string => Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const invoiceClassic = (d: Json): string => {
  const i = d.invoice || {};
  const v = d.visit || {};

  const isRebate = (it: Json) => Number(it.total) < 0 && /rebate/i.test(String(it.description || ''));
  const rebates = ((i.items || []) as Json[]).filter(isRebate);
  const items = ((i.items || []) as Json[]).filter((it) => !isRebate(it));
  const rebateTotal = -rebates.reduce((a, it) => a + Number(it.total || 0), 0);
  const rebateRate = rebates.length ? Math.abs(Number(rebates[0].price || rebates[0].total || 0)) : 0;
  const subtotal = rebates.length ? items.reduce((a, it) => a + Number(it.total || 0), 0) : i.subtotal;
  const extra = (label: string, n: number) =>
    n ? `<tr><td class="summary-label">${label}:</td><td class="summary-value">KSh ${money(n)}</td></tr>` : '';
  const less = (label: string, n: number) =>
    n ? `<tr><td class="summary-label">${label}:</td><td class="summary-value">- KSh ${money(n)}</td></tr>` : '';
  return page(
    `Invoice - ${d.hospital?.name || ''}`,
    INVOICE_CSS,
    `
  ${header(d.hospital)}
  <div class="doc-title-banner">${esc(i.docTitle || 'INVOICE')}</div>
  <div class="invoice-meta-row">
    <div class="invoice-meta left">${i.docTitle ? 'Receipt for Invoice No' : 'Invoice No'}: <span class="invoice-number">${esc(i.id)}</span></div>
    <div class="invoice-meta">Date: <strong>${dash(dmy(i.date))}</strong></div>
  </div>
  <table class="info-table">
    <tr><td class="label">Patient Name</td><td class="val-col">${dash(i.patientName)}</td><td class="label">Phone</td><td class="val-col">${dash(i.phone)}</td></tr>
    <tr><td class="label">Insurance Company</td><td class="val-col">${dash(i.insuranceCompany)}</td><td class="label">Scheme</td><td class="val-col">${dash(i.scheme)}</td></tr>
    <tr><td class="label">OP Number</td><td class="val-col">${dash(d.patient?.id)}</td><td class="label">Visit Date</td><td class="val-col">${dash(dmy(v.date || i.date))}</td></tr>
    <tr><td class="label">Cashier</td><td>${dash(i.cashier)}</td><td class="label">Payment Mode</td><td>${dash(i.paymentMode)}</td></tr>
  </table>
  ${section('Itemized Breakdown')}
  <table class="invoice-table">
    <thead><tr><th>Description</th><th class="text-center" style="width: 10%;">Qty</th><th class="text-right" style="width: 20%;">Price (KSh)</th><th class="text-right" style="width: 20%;">Total (KSh)</th></tr></thead>
    <tbody>${invoiceGroups(items)
      .map(
        (g) =>
          `<tr class="group-row"><td colspan="4">${esc(g.name)}</td></tr>${g.items.map((it) => `<tr class="item-row"><td>${esc(it.label)}</td><td class="text-center">${qty(it.quantity)}</td><td class="text-right">${money(it.price)}</td><td class="text-right">${money(it.total)}</td></tr>`).join('')}`,
      )
      .join('')}</tbody>
  </table>
  <div class="summary-container"><table class="summary-table">
    <tr><td class="summary-label">Subtotal:</td><td class="summary-value">KSh ${money(subtotal)}</td></tr>
    ${less(`SHA Daily Rebate (${rebates.length} day${rebates.length === 1 ? '' : 's'} × KSh ${money(rebateRate)})`, rebateTotal)}
    ${rebates.length || i.discountLabel ? less(esc(i.discountLabel || 'Discount'), i.discount) : extra('Discount', i.discount)}${extra('Tax', i.tax)}
    <tr class="total-row"><td class="summary-label">Total Due:</td><td class="summary-value">KSh ${money(i.total)}</td></tr>
    ${i.paid ? `${extra('Amount Paid', i.paid)}<tr><td class="summary-label">Balance:</td><td class="summary-value">KSh ${money(i.balance)}</td></tr>` : ''}
    ${i.docTitle && i.paymentReference ? `<tr><td class="summary-label">Payment Ref:</td><td class="summary-value">${esc(i.paymentReference)}</td></tr>` : ''}
  </table></div>
  <div class="invoice-footer">
    <div class="signature-box">
      <div class="signature-line"></div><span class="sign-label">Patient Signature</span></div>
    ${qrBlock(d)}
    <div class="signature-box"><div class="signature-line"></div><span class="sign-label">Cashier</span>${i.cashier ? ` (${esc(personName(String(i.cashier).replace(/\s*\(cashier\)\s*$/i, '')))})` : ''}</div>
  </div>`,
    d.hospital,
  );
};

const ABBREVIATIONS = new Set(
  (
    'SHA SHIF NHIF KMLTTB KMPDC NCK PPB LTD PLC MOH OPD IPD ICU HDU NICU CCU ANC PNC CWC MCH PHC ENT OB GYN ' +
    'CBC FHG FBC WBC RBC HB HGB HCT PCV MCV MCH MCHC RDW PLT ESR CRP ALT AST ALP GGT LFT LFTS RFT UEC TFT TSH HBA1C RBS FBS OGTT ' +
    'HIV TB VDRL RPR HBSAG HCV PSA BHCG UTI URTI LRTI DM HTN CCF COPD PUD GERD BP SPO2 BMI RR HR ECG EEG CT MRI USS XRAY PA AP ' +
    'RDT BS MPS H.PYLORI OD BD TDS QID QDS PRN STAT NOCTE MANE Q4H Q6H Q8H Q12H IV IM SC PO PR SL INH KSH ICD ICD11 DNA RNA ' +
    'CASH M-PESA MPESA OTC POS ID NO NO. REF ADM IP OP RN BSN KRCHN KECHN GBM POMSF PHF ECCIF CCP ASOT ANA AFB PSA HCG PCR UECS UECS. EGFR KFT U/E/C'
  ).split(/\s+/),
);

const PLAIN_WORDS = new Set(['NO', 'NO.', 'PA', 'AP', 'PR', 'SC', 'PO', 'SL', 'HR', 'RR', 'BS', 'INH', 'REF', 'ADM', 'POS']);
const abbrKey = (w: string) => w.toUpperCase().replace(/[^A-Z0-9.\-]/g, '');
const isAbbr = (w: string) => ABBREVIATIONS.has(abbrKey(w)) && !PLAIN_WORDS.has(abbrKey(w));
const keepToken = (w: string) =>
  /\d/.test(w) || isAbbr(w) || (w.includes('-') && w.split('-').every((p) => ABBREVIATIONS.has(p.toUpperCase())));

const keptForm = (w: string) => (/\d/.test(w) ? w : abbrKey(w) === 'EGFR' ? w.replace(/egfr/i, 'eGFR') : isAbbr(w) ? w.toUpperCase() : w);
const recase = (text: string, word: (w: string, first: boolean) => string): string => {
  let first = true;

  return String(text)
    .split(/(\s+|[()\[\],;:/–|]+)/)
    .map((tok) => {
      if (!/[A-Za-z]/.test(tok)) {
        if (/[.!?]\s*$|\n/.test(tok)) first = true;
        return tok;
      }
      const out = keepToken(tok) ? keptForm(tok) : word(tok, first);
      first = /[.!?]$/.test(tok);
      return out;
    })
    .join('');
};
const sentence = (v: unknown): string => {
  const t = String(v ?? '').trim();
  if (!t || !/[a-z]/i.test(t)) return t;

  return recase(t, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
};
const personName = (v: unknown): string => {
  const t = String(v ?? '').trim();
  return t ? recase(t, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) : t;
};

const tidy = (d: Json): Json => {
  const x: Json = JSON.parse(JSON.stringify(d || {}));
  const S = (o: Json | undefined, keys: string[]) => {
    if (o)
      keys.forEach((k) => {
        if (typeof o[k] === 'string') o[k] = sentence(o[k]);
      });
  };
  const N = (o: Json | undefined, keys: string[]) => {
    if (o)
      keys.forEach((k) => {
        if (typeof o[k] === 'string') o[k] = personName(o[k]);
      });
  };
  const list = (a: unknown) => (Array.isArray(a) ? a.map((t) => (typeof t === 'string' ? sentence(t) : t)) : a);
  N(x.patient, ['name']);
  S(x.patient, ['account', 'sex', 'address', 'category', 'subCategory']);
  S(x.visit, ['unit', 'scheme', 'encounterType', 'status']);
  if (x.order) {
    N(x.order, ['requestedBy']);
    S(x.order, ['sampleType', 'status', 'category']);
    (x.order.parameters || []).forEach((r: Json) => {
      S(r, ['name']);
      if (typeof r.value === 'string' && !/\d/.test(r.value)) r.value = sentence(r.value);
    });
  }
  N(x.technologist, ['name']);
  if (x.invoice) {
    N(x.invoice, ['patientName', 'cashier']);
    S(x.invoice, ['insuranceCompany', 'scheme', 'paymentMode', 'status']);
    (x.invoice.items || []).forEach((it: Json) => S(it, ['description']));
  }
  if (x.consultation) {
    N(x.consultation, ['doctor']);
    S(x.consultation, ['status', 'scheme', 'disposition', 'chiefComplaint', 'examinationFindings', 'notes']);
    x.consultation.diagnoses = list(x.consultation.diagnoses);
    (x.consultation.prescriptions || []).forEach((m: Json) =>
      S(m, ['name', 'dosage', 'duration', 'status', 'instructions', 'dose', 'route', 'frequency', 'durationOnly']),
    );
  }
  if (x.vitals) {
    N(x.vitals, ['recordedBy']);
    S(x.vitals, ['triageCategory']);
  }
  if (x.officer) N(x.officer, ['name']);
  (x.investigations || []).forEach((i: Json) => S(i, ['name', 'type', 'status']));
  x.procedures = list(x.procedures);
  if (x.followUp) S(x.followUp, ['department']);
  if (x.admission) {
    N(x.admission, ['doctor']);
    S(x.admission, ['doctorDesignation', 'ward', 'department', 'scheme', 'status']);
  }
  if (x.discharge) {
    const dc = x.discharge;
    dc.diagnoses = list(dc.diagnoses);
    S(dc, ['chiefComplaint', 'examinationFindings', 'instructions']);
    (dc.investigations || []).forEach((i: Json) => S(i, ['name', 'type']));
    dc.procedures = list(dc.procedures);
    dc.medications = list(dc.medications);
    (dc.treatment || []).forEach((t: Json) => S(t, ['name', 'detail', 'dose', 'route', 'frequency', 'duration']));
    (dc.medicationRows || []).forEach((t: Json) => S(t, ['name', 'dose', 'route', 'frequency', 'duration', 'notes']));
  }
  return x;
};

const tidyNote = (n: Json): Json => {
  const x: Json = JSON.parse(JSON.stringify(n || {}));
  const S = (o: Json | undefined, keys: string[]) => {
    if (o)
      keys.forEach((k) => {
        if (typeof o[k] === 'string') o[k] = sentence(o[k]);
      });
  };
  const list = (a: unknown) => (Array.isArray(a) ? a.map((t) => (typeof t === 'string' ? sentence(t) : t)) : a);
  S(x, ['chiefComplaint', 'hpi', 'pastHistory', 'other', 'plan', 'designation']);
  if (typeof x.clinician === 'string') x.clinician = personName(x.clinician);
  (x.exam || []).forEach((e: Json) => {
    S(e, ['notes']);
    (e.options || []).forEach((o: Json) => S(o, ['name']));
  });
  x.currentMeds = list(x.currentMeds);
  x.primary = list(x.primary);
  x.differentials = list(x.differentials);
  [...(x.currentMedRows || []), ...(x.medRows || [])].forEach((m: Json) =>
    S(m, ['name', 'dose', 'route', 'frequency', 'duration', 'notes']),
  );
  [...(x.labs || []), ...(x.rads || []), ...(x.procs || []), ...(x.meds || [])].forEach((r: Json) => S(r, ['name', 'detail']));
  return x;
};

const VIEWER_BAR = `<style>
.wc-viewer-bar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; margin: -16px -16px 16px -16px; background: #0b4f91; color: #fff; font-family: Arial, sans-serif; font-size: 13px; font-weight: 700; }
.wc-viewer-bar button { border: 0; border-radius: 6px; padding: 8px 16px; font-weight: 700; font-size: 13px; cursor: pointer; }
.wc-viewer-bar .print { background: #fff; color: #0b4f91; } .wc-viewer-bar .close { background: transparent; color: #fff; border: 1px solid #ffffff88; }
@media print { .wc-viewer-bar { display: none !important; } }
</style>
<div class="wc-viewer-bar"><span>Document preview</span><span><button class="print" onclick="window.print()">Print</button> <button class="close" onclick="window.close()">Close</button></span></div>`;

const readDocument = async (url: string): Promise<Json> => {
  const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
  const text = await res.text();
  let d: any = null;
  try {
    d = text ? JSON.parse(text) : null;
  } catch {
    d = null;
  }
  if (res.ok && d?.success) return d;
  const why = d?.error || d?.message || (text && !d ? 'The server sent a page instead of the document' : '');
  throw new Error(
    `The document could not be prepared${why ? `: ${why}` : '.'} (server answer ${res.status}${res.status === 403 ? ' — blocked by the hosting firewall or sign-in' : ''}).`,
  );
};

const printFrom = async (query: string, build: (d: Json) => string, autoPrint = true): Promise<void> => {
  const win = autoPrint ? window.open('', '_blank', 'width=900,height=1000') : window.open('', '_blank');
  if (!win) {
    showMessage({
      title: 'Printing blocked',
      message: 'Allow pop-up windows for WiseCare in this browser, then try again.',
      tone: 'warning',
    });
    return;
  }
  win.document.write('<p style="font-family:Arial;padding:24px;color:#555">Preparing the document…</p>');
  try {
    const d = await readDocument(`/api/documents/print?${query}`);
    const html = build(tidy(d));
    win.document.open();
    win.document.write(autoPrint ? html : html.replace('<body>', `<body>${VIEWER_BAR}`));
    win.document.close();
    if (!autoPrint) {
      win.focus();
      return;
    }
    const go = () => {
      win.focus();
      win.print();
    };
    const imgs = Array.from(win.document.images);
    if (!imgs.length) setTimeout(go, 200);
    else
      Promise.all(
        imgs.map((im) =>
          im.complete
            ? Promise.resolve()
            : new Promise((r) => {
                im.onload = im.onerror = r;
              }),
        ),
      ).then(() => setTimeout(go, 100));
  } catch (e: any) {
    win.close();
    showMessage({
      title: 'Could not open the document',
      message: e?.message || 'The document could not be prepared. Check the connection and try again.',
      tone: 'warning',
    });
  }
};

export type DocumentKind = 'lab' | 'invoice' | 'summary' | 'discharge' | 'lab-reprint' | 'invoice-reprint';
export const documentHtml = async (kind: DocumentKind, id: string): Promise<string> => {
  const type = kind.replace('-reprint', '');
  const d = await readDocument(`/api/documents/print?type=${type}&id=${encodeURIComponent(id)}`);
  const build =
    kind === 'lab'
      ? (x: Json) => labReport(x)
      : kind === 'lab-reprint'
        ? (x: Json) => labReport(x, true)
        : kind === 'invoice'
          ? invoiceClassic
          : kind === 'invoice-reprint'
            ? invoice
            : kind === 'discharge'
              ? dischargeSummary
              : patientSummary;
  return build(tidy(d));
};

export const printLabReport = (labOrderId: string) => printFrom(`type=lab&id=${encodeURIComponent(labOrderId)}`, (d) => labReport(d));
export const printInvoice = (invoiceId: string) => printFrom(`type=invoice&id=${encodeURIComponent(invoiceId)}`, invoiceClassic);

export const printInvoiceReprint = (invoiceId: string) => printFrom(`type=invoice&id=${encodeURIComponent(invoiceId)}`, invoice);
export const printCashReceiptReprint = (invoiceId: string) =>
  printFrom(`type=invoice&id=${encodeURIComponent(invoiceId)}`, (d) => {
    d.invoice = d.invoice || {};
    d.invoice.docTitle = 'CASH RECEIPT';
    return invoice(d);
  });
export const printLabReportReprint = (labOrderId: string) =>
  printFrom(`type=lab&id=${encodeURIComponent(labOrderId)}`, (d) => labReport(d, true));

export const printInvoiceAdjusted = (invoiceId: string, adjust: (inv: Json) => void) =>
  printFrom(`type=invoice&id=${encodeURIComponent(invoiceId)}`, (d) => {
    d.invoice = d.invoice || {};
    adjust(d.invoice);
    return invoiceClassic(d);
  });

export const printInvoiceReprintAdjusted = (invoiceId: string, adjust: (inv: Json) => void) =>
  printFrom(`type=invoice&id=${encodeURIComponent(invoiceId)}`, (d) => {
    d.invoice = d.invoice || {};
    adjust(d.invoice);
    return invoice(d);
  });

export const printCashReceipt = (invoiceId: string) =>
  printInvoiceAdjusted(invoiceId, (inv) => {
    inv.docTitle = 'CASH RECEIPT';
  });
export const printPatientSummary = (ref: { consultationId?: string; patientId?: string }) =>
  printFrom(
    ref.consultationId
      ? `type=summary&id=${encodeURIComponent(ref.consultationId)}`
      : `type=summary&patient_id=${encodeURIComponent(ref.patientId || '')}`,
    patientSummary,
    false,
  );

export const printAdmissionNotes = (admissionId: string, note: Json) =>
  printFrom(`type=discharge&id=${encodeURIComponent(admissionId)}`, (d) => admissionNotesDoc(d, tidyNote(note)));

export const printExternalRequest = (r: Json) =>
  printFrom(`type=external&patient_id=${encodeURIComponent(r.patientId || '')}&visit_id=${encodeURIComponent(r.visitId || '')}`, (d) =>
    externalDoc(d, r),
  );
export const printDischargeSummary = (summaryOrAdmissionId: string) =>
  printFrom(`type=discharge&id=${encodeURIComponent(summaryOrAdmissionId)}`, dischargeSummary, false);

const OFFICE_CSS = `
.ofc-meta { display: flex; justify-content: space-between; gap: 12px; font-size: 10.5px; color: #333; margin: 4px 0 8px; }
.ofc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 6px 0 10px; }
.ofc-box { border: 1px solid #cfd8dc; border-radius: 4px; padding: 8px 10px; background: #fafcfd; font-size: 10.5px; line-height: 1.5; }
.ofc-box .cap { font-size: 9px; font-weight: 700; color: #607d8b; text-transform: uppercase; letter-spacing: .5px; }
.ofc-box .big { font-size: 12.5px; font-weight: 800; color: #111; }
table.ofc { width: 100%; border-collapse: collapse; font-size: 10.5px; margin: 6px 0 10px; }
table.ofc tfoot { display: table-row-group; }
table.ofc th { background: #eef3f7; color: #263238; text-transform: uppercase; font-size: 9px; letter-spacing: .4px; text-align: left; border: 1px solid #b0bec5; padding: 5px 6px; }
table.ofc td { border: 1px solid #cfd8dc; padding: 4px 6px; vertical-align: top; }
table.ofc .r { text-align: right; white-space: nowrap; } table.ofc .c { text-align: center; }
table.ofc tfoot td { font-weight: 700; background: #f7f9fa; }
table.ofc tfoot tr.grand td { background: #e0f2f1; font-size: 11.5px; font-weight: 800; }
.ofc-net { margin: 8px 0; padding: 8px 12px; border: 2px solid #2e7d32; background: #f1f8e9; display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; color: #1b5e20; }
.ofc-signs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 28px; font-size: 10.5px; }
.ofc-signs.two { grid-template-columns: repeat(2, 1fr); }
.ofc-signs .line { border-bottom: 1px dashed #78909c; height: 34px; }
.ofc-signs .ok { color: #2e7d32; font-weight: 700; font-size: 10px; margin-top: 2px; }
.ofc-signs .cap { color: #78909c; font-size: 9px; margin-top: 2px; }
.ofc-note { font-size: 10px; color: #455a64; margin-top: 6px; }
`;
export const officeEsc = esc;
export const officeSection = section;
export const officeMoney = (n: unknown): string =>
  Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const printOfficeDocument = (title: string, body: string): Promise<void> =>
  printFrom('type=letterhead', (d) =>
    page(
      title,
      OFFICE_CSS,
      `${header(d.hospital)}<div class="doc-title-banner">${esc(title)}</div>${body}
    <div class="ofc-note">Printed ${esc(printedAt())} · WiseCare Hospital Information System</div>`,
      d.hospital,
    ),
  );
