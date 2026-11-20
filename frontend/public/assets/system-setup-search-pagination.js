
(function () {
  'use strict';
  const PAGE_SIZE = 10;
  const style = document.createElement('style');
  style.textContent = `
    .wc-setup-table-tools{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:12px 0;padding:12px;background:#f8fbff;border:1px solid #dbe7f5;border-radius:10px}
    .wc-setup-table-search{min-width:220px;max-width:440px;flex:1;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font:inherit;color:#0f172a;background:#fff}
    .wc-setup-pagination{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#475569;font-size:13px}
    .wc-setup-pagination button{border:1px solid #cbd5e1;background:#fff;color:#1e3a8a;padding:7px 11px;border-radius:7px;cursor:pointer;font-weight:600}
    .wc-setup-pagination button:disabled{opacity:.4;cursor:not-allowed}
    .wc-setup-pagination select{padding:7px;border:1px solid #cbd5e1;border-radius:7px;background:white}
    .wc-setup-table-wrap{width:100%;overflow-x:auto}
  `;
  document.head.appendChild(style);
  const state = new WeakMap();
  function activeSetupPage() {

    if (document.body.dataset.wcModule !== undefined) return document.body.dataset.wcModule === 'system_setup';
    const text = (document.body.innerText || '').toLowerCase();
    const active = document.querySelector('[aria-current="page"], nav .active, aside .active, [data-state="active"]');
    const activeText = active ? (active.innerText || active.textContent || '').toLowerCase() : '';
    const route = (location.pathname + location.hash).toLowerCase();
    return route.includes('setup') || activeText.includes('system setup') ||
      /system setup|lab tests?\s*(and|&)?\s*parameters|radiology tests?|nursing procedures|consultation types|payment schemes|pharmacy.*setup|workflow mappings/.test(text);
  }
  function setupTable(table) {
    if (!table || table.dataset.wcSetupPaged === '1' || !table.tBodies || !table.tBodies[0]) return;

    if (table.closest('[data-wc-own-paging]')) return;
    if (table.closest('.wc-setup-pagination, .wc-setup-table-tools')) return;
    const rows = Array.from(table.tBodies[0].rows);
    if (rows.length < 2) return;
    table.dataset.wcSetupPaged = '1';
    const wrap = document.createElement('div');
    wrap.className = 'wc-setup-table-wrap';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
    const tools = document.createElement('div');
    tools.className = 'wc-setup-table-tools';
    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'wc-setup-table-search';
    search.placeholder = 'Search this setup list…';
    search.setAttribute('aria-label', 'Search setup records');
    const pagination = document.createElement('div');
    pagination.className = 'wc-setup-pagination';
    const info = document.createElement('span');
    const size = document.createElement('select');
    size.setAttribute('aria-label', 'Rows per page');
    [10, 25, 50, 100].forEach(n => {
      const o = document.createElement('option'); o.value = String(n); o.textContent = n + ' per page'; if (n === PAGE_SIZE) o.selected = true; size.appendChild(o);
    });
    const prev = document.createElement('button'); prev.type='button'; prev.textContent='Previous';
    const next = document.createElement('button'); next.type='button'; next.textContent='Next';
    pagination.append(size, info, prev, next);
    tools.append(search, pagination);
    wrap.parentNode.insertBefore(tools, wrap);
    const s = {page:0, query:'', size:PAGE_SIZE, rows};
    state.set(table,s);
    function render() {

      s.rows = Array.from(table.tBodies[0].rows);
      const filtered = s.rows.filter(r => (r.innerText || r.textContent || '').toLowerCase().includes(s.query));
      const pages = Math.max(1, Math.ceil(filtered.length / s.size));
      s.page = Math.min(s.page, pages - 1);
      s.rows.forEach(r => r.style.display = 'none');
      filtered.slice(s.page * s.size, (s.page + 1) * s.size).forEach(r => r.style.display = '');
      info.textContent = filtered.length ? `${s.page * s.size + 1}–${Math.min((s.page+1)*s.size,filtered.length)} of ${filtered.length}` : 'No matching records';
      prev.disabled = s.page <= 0;
      next.disabled = s.page >= pages - 1;
    }
    search.addEventListener('input', () => { s.query = search.value.trim().toLowerCase(); s.page = 0; render(); });
    size.addEventListener('change', () => { s.size = Number(size.value) || PAGE_SIZE; s.page = 0; render(); });
    prev.addEventListener('click', () => { s.page--; render(); });
    next.addEventListener('click', () => { s.page++; render(); });
    render();
    const rowObserver = new MutationObserver(() => { if (!table.isConnected) return; render(); });
    rowObserver.observe(table.tBodies[0], {childList:true, subtree:false});
  }
  function scan() {
    if (!activeSetupPage()) return;
    document.querySelectorAll('table').forEach(setupTable);
  }
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; scan(); });
  });
  function start() {
    scan();
    observer.observe(document.body, {childList:true, subtree:true});
    window.addEventListener('hashchange', scan);
    window.addEventListener('popstate', scan);
    setInterval(scan, 1800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
