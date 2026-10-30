// GIP++ Mark All As Read. One button in the server rail marks every server (including ones in folders) as read.
// Yappin marks a channel read when you open it, so this opens each unread text channel in turn (never voice channels),
// then puts you back where you were.
const gipreadall = {
  id: 'gipreadall',
  origin: 'gip',
  name: 'Mark All As Read',
  description: 'Adds a button to the server rail that marks every server, folder and DM as read in one press.',
  obs: null, wrap: null, running: false, cancel: false, note: null, pend: 0,
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
  rail() { return document.querySelector('nav.rail'); },
  isVoice(row) {
    const wrap = row && row.parentElement;
    if (wrap && wrap.querySelector(':scope > .voice-people')) return true;
    const path = row && row.querySelector('.channel-glyph path');
    return !!(path && /^M14 14\.8135V9\.18646/.test(path.getAttribute('d') || ''));
  },
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12.5l4.5 4.5L15 8.5"/><path d="M11 16.5l1.5 1.5L22 8.5"/></svg>',

  unreadServers() {
    const rail = this.rail(); if (!rail) return [];
    return Array.from(rail.querySelectorAll('.rail-wrap.unread')).map(w => w.querySelector('button.rail-item')).filter(b => b && !b.classList.contains('add'));
  },
  unreadChannels() {
    const side = document.querySelector('aside.sidebar') || document.querySelector('aside.side-panel');
    if (!side) return [];
    const out = [];
    side.querySelectorAll('[class*="unread" i]').forEach(el => {
      const row = el.closest('.channel-row') || el.closest('[class*="row" i]') || el;
      const btn = row.querySelector('.channel-main') || row.querySelector('button') || (el.matches('button') ? el : null);
      if (!btn || out.includes(btn)) return;
      if (this.isVoice(row.closest('.channel-row'))) return;
      out.push(btn);
    });
    return out;
  },
  count() { return this.unreadServers().length; },
  state() {
    const rail = this.rail(); const a = rail && rail.querySelector('.rail-item.active');
    const row = document.querySelector('aside.sidebar .channel-row.active .name, aside.side-panel .channel-row.active .name');
    return { rail: a, chan: row ? row.textContent.trim() : '' };
  },
  progress(msg) {
    if (!this.note) { this.note = document.createElement('div'); this.note.className = 'gip-toast'; this.note.style.pointerEvents = 'auto'; document.body.appendChild(this.note); }
    this.note.textContent = msg;
  },
  endProgress(msg) { if (!this.note) return; this.note.textContent = msg; const n = this.note; this.note = null; setTimeout(() => n.remove(), 3200); },
  async visit(btn) { btn.click(); await this.sleep(420); },
  async run() {
    if (this.running) { this.cancel = true; return; }
    this.running = true; this.cancel = false;
    const start = this.state(); const rail = this.rail();
    let servers = 0, channels = 0; const expandedByUs = [];
    try {
      rail.querySelectorAll('.rail-folder').forEach(f => {
        const w = f.closest('.rail-wrap');
        if ((w && w.classList.contains('unread')) && f.getAttribute('aria-expanded') !== 'true') { f.click(); expandedByUs.push(f); }
      });
      if (expandedByUs.length) await this.sleep(300);
      const todo = this.unreadServers().filter(b => !b.classList.contains('rail-folder'));
      for (let i = 0; i < todo.length && !this.cancel; i++) {
        this.progress(`Marking as read\u2026 ${i + 1}/${todo.length}  (click the button again to stop)`);
        await this.visit(todo[i]); servers++;
        const seen = new Set(); let guard = 0;   // each channel at most once per server, so a stuck badge can't trap the loop
        while (guard++ < 60 && !this.cancel) {
          const key = (c) => c.textContent.replace(/\s+/g, ' ').trim();
          const next = this.unreadChannels().find(c => !seen.has(key(c)));
          if (!next) break;
          seen.add(key(next)); await this.visit(next); channels++;
        }
      }
    } finally {
      if (start.rail && start.rail.isConnected) { start.rail.click(); await this.sleep(380); }
      if (start.chan) {
        const row = Array.from(document.querySelectorAll('.channel-row .name')).find(n => n.textContent.trim() === start.chan && !this.isVoice(n.closest('.channel-row')));
        if (row) { const m = row.closest('.channel-main') || row.closest('button'); if (m) m.click(); }
      }
      expandedByUs.forEach(f => { if (f.isConnected && f.getAttribute('aria-expanded') === 'true') f.click(); });
      const left = this.count();
      this.endProgress(this.cancel ? 'Stopped.' : (left ? `Done. ${left} server${left === 1 ? '' : 's'} still show unread.` : `All read (${servers} server${servers === 1 ? '' : 's'}, ${channels} channel${channels === 1 ? '' : 's'}).`));
      this.running = false; this.cancel = false;
    }
  },
  ensure() {
    const rail = this.rail(); if (!rail) return;
    if (this.wrap && this.wrap.isConnected) return;
    const firstAdd = rail.querySelector('.rail-item.add'); const anchor = firstAdd && firstAdd.closest('.rail-wrap');
    if (!anchor) return;
    const wrap = document.createElement('div'); wrap.className = 'rail-wrap gip-readall';
    const b = document.createElement('button'); b.className = 'rail-item add';
    b.title = 'Mark everything as read (GIP++)'; b.setAttribute('aria-label', 'Mark all as read'); b.innerHTML = this.svg;
    b.addEventListener('click', () => this.run());
    wrap.appendChild(b); anchor.parentElement.insertBefore(wrap, anchor); this.wrap = wrap;
  },
  start() {
    if (this.obs) return;
    const self = this;
    this.obs = window.YapPlus.events.on('dom', () => { if (!self.pend) self.pend = setTimeout(() => { self.pend = 0; self.ensure(); }, 100); }, 'gipreadall');
    this.ensure();
  },
  stop() { if (this.obs) { this.obs(); this.obs = null; } if (this.wrap) { this.wrap.remove(); this.wrap = null; } this.cancel = true; },
};
window.PluginHost.register(gipreadall);
