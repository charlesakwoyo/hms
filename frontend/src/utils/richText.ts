const TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SUB', 'SUP', 'BR', 'P', 'DIV', 'SPAN', 'FONT', 'UL', 'OL', 'LI']);
const STYLES = [
  'color',
  'background-color',
  'font-size',
  'font-family',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-decoration-line',
  'text-align',
];
const SAFE_VALUE = /^[#(),.%\w\s'"-]+$/;

export const sanitizeRichText = (html: string): string => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const clean = (node: Node): void => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) return;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove();
        return;
      }
      const el = child as HTMLElement;
      if (!TAGS.has(el.tagName)) {
        if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'IMG', 'SVG', 'MATH'].includes(el.tagName)) {
          el.remove();
          return;
        }
        clean(el);
        el.replaceWith(...Array.from(el.childNodes));
        return;
      }
      const style = STYLES.map((p) => [p, el.style.getPropertyValue(p)] as const).filter(
        ([, v]) => v && SAFE_VALUE.test(v) && !/url|expression/i.test(v),
      );
      const face = el.getAttribute('face');
      const size = el.getAttribute('size');
      const color = el.getAttribute('color');
      Array.from(el.attributes).forEach((a) => el.removeAttribute(a.name));
      if (style.length) el.setAttribute('style', style.map(([p, v]) => `${p}: ${v}`).join('; '));
      if (el.tagName === 'FONT') {
        if (face && SAFE_VALUE.test(face)) el.setAttribute('face', face);
        if (size && /^[1-7]$/.test(size)) el.setAttribute('size', size);
        if (color && /^#?[\w]+$/.test(color)) el.setAttribute('color', color);
      }
      clean(el);
    });
  };
  const root = doc.body.firstElementChild as HTMLElement;
  clean(root);
  return root.innerHTML.replace(/(<br>\s*)+$/i, '').trim();
};

export const richTextIsEmpty = (html: string): boolean =>
  !String(html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

export const packRichText = (html: string): string => {
  if (!html) return html;
  const bytes = new TextEncoder().encode(html);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return `b64:${btoa(bin)}`;
};
export const unpackRichText = (value: unknown): string => {
  const v = String(value ?? '');
  if (!v.startsWith('b64:')) return v;
  try {
    return new TextDecoder().decode(Uint8Array.from(atob(v.slice(4)), (c) => c.charCodeAt(0)));
  } catch {
    return '';
  }
};
