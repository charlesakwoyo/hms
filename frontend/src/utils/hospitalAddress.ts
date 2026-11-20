export const hospitalAddressLines = (h: { address?: string; phone?: string; email?: string } | null | undefined): string[] => {
  const addr = String(h?.address || '');
  const lines = (/\r?\n/.test(addr) ? addr.split(/\r?\n/) : addr.split(/,(?![^()]*\))/))
    .map((l) => l.trim())
    .filter((l) => l && !/^\S+@\S+\.\S+$/.test(l));
  if (h?.phone) lines.push(`Contact: ${h.phone}`);
  if (h?.email) lines.push(`Email: ${h.email}`);
  return lines;
};

const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const logoSrc = (logo: string): string => {
  if (/^(data:|https?:)/i.test(logo)) return logo;
  try {
    return new URL(logo, window.location.href).href;
  } catch {
    return logo;
  }
};

export const hospitalHeaderHtml = (
  h: { hospitalName?: string; address?: string; phone?: string; email?: string; logo?: string } | null | undefined,
): string => {
  const words = String(h?.hospitalName || 'WiseCare Healthcare Facility')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const stripe = (c: string) => `<div style="flex:1;background:${c};-webkit-print-color-adjust:exact;print-color-adjust:exact"></div>`;
  return (
    `<div style="font-family:Arial,Helvetica,sans-serif;margin-bottom:10px;text-align:left">` +
    `<div style="display:flex;height:6px;margin-bottom:8px">${stripe('#00a8ff')}${stripe('#8bc34a')}${stripe('#ff6f00')}</div>` +
    `<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;padding-bottom:10px;border-bottom:3px solid #ff6f00">` +
    `<div style="display:flex;align-items:center;gap:18px">` +
    (h?.logo ? `<img src="${escHtml(logoSrc(h.logo))}" alt="" style="max-width:150px;max-height:90px;width:auto;height:auto">` : '') +
    `<div style="text-align:center"><div style="font-size:40px;font-weight:800;color:#00a8ff;letter-spacing:1.2px;line-height:1.05;text-transform:uppercase">${escHtml(words[0] || '')}</div>` +
    (words.length > 1
      ? `<div style="font-size:20px;font-weight:700;color:#8bc34a;letter-spacing:0.8px;margin-top:4px;text-transform:uppercase">${escHtml(words.slice(1).join(' '))}</div>`
      : '') +
    `</div></div>` +
    `<div style="display:flex;align-items:center;gap:14px;margin-left:auto"><div style="width:3px;align-self:stretch;min-height:70px;background:#ff6f00"></div>` +
    `<div style="text-align:right;font-size:12px;line-height:1.5;color:#333;font-weight:600">${hospitalAddressLines(h).map(escHtml).join('<br/>')}</div></div>` +
    `</div></div>`
  );
};
