// GIP++ Server Hover Info. Hover a server in the rail and a small card shows its name, who is in voice,
// and how many members are online and in total.
// Live data comes from the server you have open (its voice list and member panel). For other servers GIP++ shows
// the numbers it last saw, and, if it can, asks Yappin's own backend for the member count (the same request the app makes).
const gipserverinfo = {
  id: 'gipserverinfo',
  origin: 'gip',
  name: 'Server Hover Info',
  description: 'Hover a server in the rail to see its name, who is in voice, and how many members are online and in total.',
  options: [
    { key: 'lookup', type: 'toggle', dflt: true, label: 'Look up member counts for servers you have not opened', desc: 'Asks Yappin for the total member count when you hover a server. If it cannot, the card shows the numbers last seen (open a server once to fill them in).' },
  ],
  store: 'gip.serverinfo.v1',
  card: null, showT: 0, hideT: 0, hovered: null, savedTitle: null, handlers: null, timer: null, styleEl: null,
  api: { dead: false, asked: {}, table: '' },

  // ---------- storage ----------
  load() { try { return JSON.parse(localStorage.getItem(this.store)) || {}; } catch (e) { return {}; } },
  put(key, patch) {
    if (!key) return;
    try {
      const all = this.load(); const cur = Object.assign(all[key] || {}, patch, { t: Date.now() });
      all[key] = cur;
      const keys = Object.keys(all); if (keys.length > 200) keys.sort((a, b) => (all[a].t || 0) - (all[b].t || 0)).slice(0, keys.length - 200).forEach(k => delete all[k]);
      localStorage.setItem(this.store, JSON.stringify(all));
    } catch (e) {}
  },

  // ---------- reading the rail ----------
  rail() { return document.querySelector('nav.rail'); },
  serverBtn(target) {
    const b = target && target.closest && target.closest('nav.rail button.rail-item, nav.rail a.rail-item');
    if (!b || b.classList.contains('add') || b.classList.contains('rail-folder')) return null;
    if (b.closest('.gip-readall') || b.closest('.gip-folder-panel')) return null;
    return b;
  },
  nameOf(b) { return (b.dataset.gipsiName || b.getAttribute('title') || b.getAttribute('aria-label') || '').replace(/^Server:\s*/i, '').trim(); },
  iconOf(b) { const i = b.querySelector('img'); return i ? i.src : ''; },
  initialsOf(b) { const i = b.querySelector('.server-initials'); return i ? i.textContent.trim() : ''; },
  idOf(b) { const m = /\/icons\/([0-9a-f-]{36})\//i.exec(this.iconOf(b)); return m ? m[1] : ''; },
  keyOf(b) { return this.idOf(b) || ('n:' + this.nameOf(b)); },
  isActive(b) { return b.classList.contains('active') || b.getAttribute('aria-current') === 'page' || b.getAttribute('aria-pressed') === 'true'; },

  // ---------- reading the open server ----------
  scrapeVoice() {
    const out = [];
    document.querySelectorAll('.voice-people').forEach(vp => Array.from(vp.children).forEach(ch => {
      const img = ch.querySelector('img');
      const name = (ch.getAttribute('title') || ch.getAttribute('aria-label') || (img && img.getAttribute('alt')) || ch.textContent || '').replace(/\s+/g, ' ').trim();
      out.push({ name: name.slice(0, 32), img: img ? img.src : '' });
    }));
    return out;
  },
  scrapeMembers() {
    const panel = document.querySelector('aside.side-panel'); if (!panel) return null;
    const txt = panel.innerText || panel.textContent || '';
    const on = /online[^\d\n]{0,8}(\d+)/i.exec(txt), off = /offline[^\d\n]{0,8}(\d+)/i.exec(txt);
    if (!on) return null;
    const online = Number(on[1]);
    return { online, total: off ? online + Number(off[1]) : null };
  },
  sampleActive() {
    const rail = this.rail(); if (!rail) return;
    const b = Array.from(rail.querySelectorAll('button.rail-item.active, a.rail-item.active')).find(x => this.serverBtn(x));
    if (!b) return;
    const patch = { name: this.nameOf(b), voice: this.scrapeVoice() };
    const m = this.scrapeMembers(); if (m) { patch.online = m.online; if (m.total != null) patch.total = m.total; }
    this.put(this.keyOf(b), patch);
  },

  // ---------- asking Yappin's backend for the member count ----------
  creds() {
    let base = '';
    try { const r = performance.getEntriesByType('resource').find(x => /\/rest\/v1\//.test(x.name)); if (r) base = new URL(r.name).origin; } catch (e) {}
    let token = '', ref = '';
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i); const m = /^sb-(.+)-auth-token$/.exec(k || ''); if (!m) continue;
        const v = JSON.parse(localStorage.getItem(k)); token = (v && (v.access_token || (v.currentSession && v.currentSession.access_token))) || ''; ref = m[1];
        if (token) break;
      }
    } catch (e) {}
    if (!base && ref) base = 'https://' + ref + '.supabase.co';
    return base && token ? { base, token } : null;
  },
  async count(id) {
    if (this.api.dead || !id || !window.YapPlus.opt('gipserverinfo', 'lookup', true)) return null;
    const c = this.creds(); if (!c) return null;
    const tables = this.api.table ? [this.api.table] : ['server_members', 'members'];
    for (const t of tables) {
      try {
        const res = await fetch(`${c.base}/rest/v1/${t}?select=user_id&server_id=eq.${encodeURIComponent(id)}`, { headers: { apikey: c.token, Authorization: 'Bearer ' + c.token, Prefer: 'count=exact', Range: '0-0' } });
        if (res.status === 404 || res.status === 400) continue;
        if (!res.ok && res.status !== 206) { if (res.status === 401 || res.status === 403) this.api.dead = true; return null; }
        const m = /\/(\d+)$/.exec(res.headers.get('content-range') || '');
        if (m) { this.api.table = t; return Number(m[1]); }
      } catch (e) { return null; }
    }
    this.api.dead = true;   // none of the guesses fit this backend; stop asking this session
    return null;
  },

  // ---------- the card ----------
  css: `
    .gip-sinfo{position:fixed;z-index:2147482000;box-sizing:border-box;width:292px;padding:14px 16px 13px;border-radius:12px;border:1px solid color-mix(in srgb,currentColor 16%,transparent);box-shadow:0 10px 32px rgba(0,0,0,.42);pointer-events:none;animation:gipsi-in .12s ease-out}
    @keyframes gipsi-in{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
    .gip-sinfo .gsi-name{font-weight:700;font-size:19px;line-height:1.2;margin:0 0 10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .gip-sinfo .gsi-voice{display:flex;align-items:center;gap:8px;margin:0 0 12px;min-height:26px}
    .gip-sinfo .gsi-voice svg{width:22px;height:22px;flex:0 0 22px;opacity:.85}
    .gip-sinfo .gsi-av{display:flex;align-items:center}
    .gip-sinfo .gsi-av>*{width:26px;height:26px;border-radius:50%;margin-left:-7px;border:2px solid var(--gsi-bg,#1e1f22);object-fit:cover;background:color-mix(in srgb,currentColor 18%,transparent);font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;box-sizing:border-box;overflow:hidden}
    .gip-sinfo .gsi-av>*:first-child{margin-left:0}
    .gip-sinfo .gsi-vl{font-size:12px;opacity:.7}
    .gip-sinfo .gsi-stats{display:flex;gap:18px;align-items:flex-start}
    .gip-sinfo .gsi-stat{display:flex;gap:8px;align-items:center;min-width:0}
    .gip-sinfo .gsi-dot{width:14px;height:14px;border-radius:50%;flex:0 0 14px;box-sizing:border-box}
    .gip-sinfo .gsi-dot.on{background:#3ba55d}
    .gip-sinfo .gsi-dot.all{border:3px solid color-mix(in srgb,currentColor 55%,transparent)}
    .gip-sinfo .gsi-lab{font-size:12px;line-height:1.25;opacity:.85}
    .gip-sinfo .gsi-lab b{display:block;font-size:15px;opacity:1}
    .gip-sinfo .gsi-old{margin-top:9px;font-size:11px;opacity:.55}
  `,
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
  paint(el) {
    const side = document.querySelector('aside.sidebar') || document.querySelector('aside.side-panel') || this.rail();
    const clear = (c) => !c || /rgba?\(0,\s*0,\s*0,\s*0\)|transparent/.test(c);
    const cs = side ? getComputedStyle(side) : null;
    let bg = cs ? cs.backgroundColor : '';
    if (clear(bg) && this.rail()) bg = getComputedStyle(this.rail()).backgroundColor;
    if (clear(bg)) bg = getComputedStyle(document.querySelector('.app') || document.body).backgroundColor;
    if (clear(bg)) bg = '#1e1f22';
    el.style.background = bg; el.style.setProperty('--gsi-bg', bg);
    el.style.color = (cs && cs.color) || getComputedStyle(document.body).color; el.style.fontFamily = (cs && cs.fontFamily) || 'inherit';
  },
  fmt(n) { return n == null ? '\u2014' : Number(n).toLocaleString(); },
  ago(t) { const s = Math.max(0, (Date.now() - t) / 1000); if (s < 90) return 'just now'; if (s < 5400) return Math.round(s / 60) + ' min ago'; if (s < 129600) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' d ago'; },
  render(b, data, live) {
    const c = this.card; if (!c || this.hovered !== b) return;
    c.innerHTML = '';
    const name = document.createElement('div'); name.className = 'gsi-name'; name.textContent = this.nameOf(b) || 'Server'; c.appendChild(name);
    if (data.voice && data.voice.length) {
      const row = document.createElement('div'); row.className = 'gsi-voice'; row.innerHTML = this.speaker;
      const av = document.createElement('div'); av.className = 'gsi-av';
      data.voice.slice(0, 6).forEach(u => {
        let n; if (u.img) { n = document.createElement('img'); n.src = u.img; n.alt = ''; n.draggable = false; } else { n = document.createElement('span'); n.textContent = (u.name || '?').slice(0, 2); }
        n.title = u.name || ''; av.appendChild(n);
      });
      const more = data.voice.length - 6; const l = document.createElement('span'); l.className = 'gsi-vl';
      l.textContent = (more > 0 ? '+' + more + ' ' : '') + 'in vc';
      row.append(av, l); c.appendChild(row);
    }
    const stats = document.createElement('div'); stats.className = 'gsi-stats';
    const stat = (cls, label, n) => { const s = document.createElement('div'); s.className = 'gsi-stat'; const d = document.createElement('span'); d.className = 'gsi-dot ' + cls; const t = document.createElement('div'); t.className = 'gsi-lab'; const bb = document.createElement('b'); bb.textContent = this.fmt(n); t.append(bb, label); s.append(d, t); return s; };
    stats.append(stat('on', 'Online Members', data.online), stat('all', 'Total Server Members', data.total));
    c.appendChild(stats);
    if (!live && data.t && (data.online != null || data.voice)) { const o = document.createElement('div'); o.className = 'gsi-old'; o.textContent = 'Last seen ' + this.ago(data.t) + '. Open this server to refresh.'; c.appendChild(o); }
    this.place(b);
  },
  place(b) {
    const c = this.card; if (!c) return;
    const r = b.getBoundingClientRect(), rr = (this.rail() || b).getBoundingClientRect();
    const h = c.offsetHeight || 120;
    c.style.left = Math.round(Math.max(rr.right, r.right) + 10) + 'px';
    c.style.top = Math.round(Math.max(8, Math.min(innerHeight - h - 8, r.top + r.height / 2 - 28))) + 'px';
  },
  async show(b) {
    if (!b.isConnected || this.hovered !== b) return;
    this.hideNow(true);
    this.hovered = b;
    // hide Yappin's own plain tooltip while ours is up
    if (b.hasAttribute('title')) { b.dataset.gipsiName = b.getAttribute('title'); b.removeAttribute('title'); this.savedTitle = b; }
    const c = document.createElement('div'); c.className = 'gip-sinfo'; c.setAttribute('role', 'tooltip');
    this.paint(c); c.style.left = '-999px'; document.body.appendChild(c); this.card = c;

    const key = this.keyOf(b); const active = this.isActive(b);
    if (active) this.sampleActive();
    const cached = this.load()[key] || {};
    this.render(b, active ? Object.assign({}, cached, { voice: this.scrapeVoice() }) : cached, active);

    const id = this.idOf(b);
    if (id && cached.total == null || (id && !active && Date.now() - (cached.t || 0) > 120000)) {
      const asked = this.api.asked[key] || 0;
      if (Date.now() - asked > 60000) {
        this.api.asked[key] = Date.now();
        const n = await this.count(id);
        if (n != null) { this.put(key, { name: this.nameOf(b), total: n }); if (this.hovered === b) this.render(b, Object.assign({}, this.load()[key], active ? { voice: this.scrapeVoice() } : {}), active); }
      }
    }
  },
  hideNow(keepHover) {
    clearTimeout(this.showT); clearTimeout(this.hideT);
    if (this.card) { this.card.remove(); this.card = null; }
    if (this.savedTitle) { const b = this.savedTitle; if (b.dataset.gipsiName && !b.hasAttribute('title')) b.setAttribute('title', b.dataset.gipsiName); delete b.dataset.gipsiName; this.savedTitle = null; }
    if (!keepHover) this.hovered = null;
  },

  // ---------- wiring ----------
  start() {
    if (this.handlers) return;
    const self = this;
    this.styleEl = document.createElement('style'); this.styleEl.id = 'gip-serverinfo-style'; this.styleEl.textContent = this.css; document.head.appendChild(this.styleEl);
    this.handlers = {
      over: (e) => {
        const b = self.serverBtn(e.target); if (!b) return;
        if (self.hovered === b) { clearTimeout(self.hideT); return; }
        clearTimeout(self.showT); clearTimeout(self.hideT);
        self.hovered = b;
        self.showT = setTimeout(() => { try { self.show(b); } catch (er) { console.error('[GIP++ server info]', er); } }, self.card ? 40 : 260);
      },
      out: (e) => {
        const b = self.serverBtn(e.target); if (!b || b !== self.hovered) return;
        if (e.relatedTarget && b.contains(e.relatedTarget)) return;
        clearTimeout(self.showT); clearTimeout(self.hideT);
        self.hideT = setTimeout(() => self.hideNow(), 90);
      },
      away: () => self.hideNow(),
    };
    document.addEventListener('pointerover', this.handlers.over, true);
    document.addEventListener('pointerout', this.handlers.out, true);
    document.addEventListener('pointerdown', this.handlers.away, true);
    document.addEventListener('wheel', this.handlers.away, { capture: true, passive: true });
    window.addEventListener('blur', this.handlers.away);
    this.timer = setInterval(() => { try { self.sampleActive(); } catch (e) {} }, 4000);
    this.sampleActive();
    window.YapPlus.serverInfo = this;
  },
  stop() {
    clearInterval(this.timer); this.timer = null;
    if (this.handlers) {
      document.removeEventListener('pointerover', this.handlers.over, true);
      document.removeEventListener('pointerout', this.handlers.out, true);
      document.removeEventListener('pointerdown', this.handlers.away, true);
      document.removeEventListener('wheel', this.handlers.away, true);
      window.removeEventListener('blur', this.handlers.away);
      this.handlers = null;
    }
    this.hideNow();
    if (this.styleEl) { this.styleEl.remove(); this.styleEl = null; }
  },
  // Console helper: YapPlus.serverInfo.debug() shows what GIP++ can read right now.
  debug() {
    const out = { voiceNow: this.scrapeVoice(), membersNow: this.scrapeMembers(), creds: !!this.creds(), api: this.api, saved: this.load() };
    console.log('[GIP++ Server Info]', out); return out;
  },
};
window.PluginHost.register(gipserverinfo);
