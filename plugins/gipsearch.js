// GIP++ Message Search. One search box across every server and folder.
// Yappin gives mods no way to search server history, so this keeps its own index of messages your client has
// shown you while it was switched on. It never reads anything you haven't seen, and it never leaves this computer.
// Off by default because it stores message text locally. Configure in GIP++ > Search.
(function () {
  const Y = window.YapPlus; const DB = 'gip-search', STORE = 'msgs', CAP = 30000, MSG = '.msg[data-message-id]';
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { const s = r.result.createObjectStore(STORE, { keyPath: 'id' }); s.createIndex('t', 't'); };
    r.onsuccess = () => res(r.result); r.onerror = () => { dbp = null; rej(r.error); };
  }));
  const tx = async (mode) => (await db()).transaction(STORE, mode).objectStore(STORE);
  const wrap = (rq) => new Promise((res, rej) => { rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });
  const count = async () => { try { return await wrap((await tx('readonly')).count()); } catch (e) { return 0; } };

  const serverName = () => { const b = document.querySelector('nav.rail .rail-item.active'); return b ? (b.getAttribute('aria-label') || b.getAttribute('title') || '').trim() : ''; };
  const chanName = () => { const h = document.querySelector('.main-head'); return h ? h.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : ''; };
  function authorOf(m) {
    let p = m, a = null;
    for (let i = 0; i < 25 && p && !a; i++, p = p.previousElementSibling) a = p.querySelector && p.querySelector('.msg-head .msg-author');
    return a ? a.textContent.trim() : '';
  }
  const known = new Set(); let queue = [], flushT = null, obs = null, scanT = null, pruneT = null;
  function scan() {
    const url = location.href, server = serverName(), chan = chanName();
    document.querySelectorAll(MSG).forEach(m => {
      const id = m.getAttribute('data-message-id'); if (!id || known.has(id)) return;
      const te = m.querySelector('.msg-text'); const text = te ? te.textContent.trim() : ''; if (!text) return;
      known.add(id); queue.push({ id, author: authorOf(m), text: text.slice(0, 2000), t: Date.now(), url, server, chan });
    });
    if (known.size > 50000) known.clear();
    if (queue.length && !flushT) flushT = setTimeout(flush, 1500);
  }
  async function flush() {
    flushT = null; const batch = queue; queue = []; if (!batch.length) return;
    try {
      const store = await tx('readwrite');
      batch.forEach(r => { const q = store.add(r); q.onerror = (e) => { e.preventDefault(); e.stopPropagation(); }; });
    } catch (e) { console.error('[GIP++ search] write failed', e); }
  }
  async function prune() {
    try {
      const n = await count(); if (n <= CAP + 500) return;
      let extra = n - CAP; const store = await tx('readwrite');
      store.index('t').openCursor().onsuccess = (e) => { const c = e.target.result; if (c && extra-- > 0) { c.delete(); c.continue(); } };
    } catch (e) {}
  }
  async function search(q, limit) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean); if (!terms.length) return [];
    const store = await tx('readonly'); const out = [];
    return new Promise((res) => {
      store.index('t').openCursor(null, 'prev').onsuccess = (e) => {
        const c = e.target.result; if (!c || out.length >= limit) return res(out);
        const r = c.value; const hay = (r.text + ' ' + r.author).toLowerCase();
        if (terms.every(t => hay.includes(t))) out.push(r); c.continue();
      };
    });
  }

  const plugin = {
    id: 'gipsearch', origin: 'gip', name: 'Message Search',
    description: 'Keeps a private, local index of the messages you see and lets you search them across every server in GIP++ > Search. Off by default.',
    start() {
      if (obs) return; scan();
      obs = new MutationObserver(() => { clearTimeout(scanT); scanT = setTimeout(scan, 700); });
      obs.observe(document.body, { childList: true, subtree: true });
      pruneT = setInterval(prune, 300000); setTimeout(prune, 20000);
    },
    stop() { if (!obs) return; obs.disconnect(); obs = null; clearInterval(pruneT); clearTimeout(scanT); flush(); },
  };
  window.PluginHost.register(plugin);

  function mark(text, terms) {
    const frag = document.createDocumentFragment(); const low = text.toLowerCase(); let i = 0;
    const hits = []; terms.forEach(t => { let p = 0; while ((p = low.indexOf(t, p)) !== -1) { hits.push([p, p + t.length]); p += t.length; } });
    hits.sort((a, b) => a[0] - b[0]);
    hits.forEach(([s, e]) => { if (s < i) return; frag.append(text.slice(i, s)); const m = document.createElement('mark'); m.className = 'gp-mark'; m.textContent = text.slice(s, e); frag.append(m); i = e; });
    frag.append(text.slice(i)); return frag;
  }
  Y.registerTab('search', 'Search', function (ui) {
    const { el, sw, group } = ui; const root = el('div');
    const g = group('Message search', 'gip');
    g.appendChild(el('div', { class: 'gp-warn', text: 'How this works: while it is on, GIP++ saves the text of messages that appear on your screen (up to ' + CAP.toLocaleString() + ') in this app on this computer only. It cannot search messages you have never opened, and it never sends anything anywhere. Turn it off and press Clear to remove it.' }));
    const info = el('span', { class: 'gp-ver' });
    const refresh = async () => { info.textContent = Y.PluginHost.isEnabled(plugin) ? (await count()).toLocaleString() + ' messages indexed' : 'Off'; };
    g.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, 'Index messages as I read them', Y.tag('gip')), info),
      sw(Y.PluginHost.isEnabled(plugin), (v) => { Y.PluginHost.setEnabled(plugin, v); refresh(); })));
    const box = el('input', { class: 'input', placeholder: 'Search every server you have read in\u2026', style: 'width:100%;margin:10px 0' });
    const out = el('div'); const meta = el('div', { class: 'gp-status' });
    let tm = null;
    const run = async () => {
      out.innerHTML = ''; const q = box.value.trim(); if (!q) { meta.textContent = ''; return; }
      meta.textContent = 'Searching\u2026'; let rows = [];
      try { rows = await search(q, 100); } catch (e) { meta.textContent = 'Search failed. See the console.'; return; }
      const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      meta.textContent = rows.length ? (rows.length >= 100 ? 'Showing the 100 most recent matches.' : rows.length + ' match' + (rows.length === 1 ? '' : 'es') + '.') : 'No matches in what has been indexed so far.';
      rows.forEach(r => {
        const go = el('button', { class: 'gp-x', text: 'Open' });
        go.addEventListener('click', () => {
          if (r.url === location.href) { const m = document.querySelector('.msg[data-message-id="' + CSS.escape(r.id) + '"]'); if (m) { m.scrollIntoView({ block: 'center' }); return; } }
          location.href = r.url;
        });
        const body = el('div'); body.appendChild(mark(r.text.length > 300 ? r.text.slice(0, 300) + '\u2026' : r.text, terms));
        out.appendChild(el('div', { class: 'gp-res' },
          el('div', { class: 'gp-line', style: 'justify-content:space-between;margin:0' }, el('b', { text: r.author || 'Unknown' }), go), body,
          el('div', { class: 'gp-meta', text: [r.server, r.chan, new Date(r.t).toLocaleString()].filter(Boolean).join('  \u00b7  ') })));
      });
    };
    box.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(run, 250); });
    const clear = el('button', { class: 'btn', text: 'Clear index\u2026' });
    clear.addEventListener('click', () => Y.confirm('Clear the message index?', 'This deletes the saved message text GIP++ keeps for searching. Your messages on Yappin are not affected.', 'Clear', async () => {
      try { known.clear(); queue = []; const s = await tx('readwrite'); await wrap(s.clear()); } catch (e) {}
      out.innerHTML = ''; refresh(); Y.toast('Search index cleared');
    }));
    g.append(box, meta, out, el('div', { class: 'gp-line', style: 'margin-top:14px' }, clear));
    root.appendChild(g); refresh(); return root;
  });
})();
