// GIP++ Back / Forward. Mouse side buttons (and Alt+Left / Alt+Right) go back and forward through the servers, channels and DMs you visited.
// Yappin does not always add a browser-history entry on server switches, so GIP++ keeps its own trail and replays it by clicking for you.
const gipnav = {
  id: 'gipnav',
  origin: 'gip',
  name: 'Mouse Back / Forward',
  description: 'Mouse side buttons (and Alt+Left / Alt+Right) go back and forward through the servers, channels and DMs you visited.',
  trail: [], at: -1, restoring: false, timer: null, offs: null, handlers: null, lastFire: 0,
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
  railId(btn) { if (!btn) return ''; const r = btn.closest('[data-rail-row]'); return r ? r.getAttribute('data-rail-row') : 'title:' + (btn.getAttribute('title') || ''); },
  sig() {
    const rail = document.querySelector('nav.rail'); const a = rail && rail.querySelector('.rail-item.active');
    const side = document.querySelector('aside.sidebar, aside.side-panel');
    const act = side && side.querySelector('.channel-row.active .name, .channel-row.active, [class*="dm" i].active, .active');
    const chan = act ? (act.querySelector && act.querySelector('.name') ? act.querySelector('.name').textContent : act.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) : '';
    return { rail: this.railId(a), chan, href: location.href };
  },
  same(a, b) { return a && b && a.rail === b.rail && a.chan === b.chan; },
  poll() {
    if (this.restoring) return;
    const s = this.sig(); if (!s.rail && !s.chan) return;
    if (this.same(this.trail[this.at], s)) return;
    this.trail = this.trail.slice(0, this.at + 1); this.trail.push(s);
    if (this.trail.length > 120) this.trail.shift();
    this.at = this.trail.length - 1;
  },
  findRail(id) {
    if (!id.startsWith('title:')) return document.querySelector(`[data-rail-row="${CSS.escape(id)}"] button.rail-item`);
    const t = id.slice(6);
    return Array.from(document.querySelectorAll('nav.rail button.rail-item')).find(b => b.getAttribute('title') === t);
  },
  async reach(id) {
    let b = this.findRail(id); if (b) return b;
    for (const f of Array.from(document.querySelectorAll('nav.rail .rail-folder[aria-expanded="false"]'))) {
      f.click(); await this.sleep(220);
      b = this.findRail(id);
      if (b) { setTimeout(() => { if (f.isConnected && f.getAttribute('aria-expanded') === 'true') f.click(); }, 900); return b; }
      f.click(); await this.sleep(120);
    }
    return null;
  },
  async go(delta) {
    if (this.restoring) return;
    this.poll();
    const to = this.at + delta;
    if (to < 0 || to >= this.trail.length) { window.YapPlus.toast(delta < 0 ? 'Nothing further back' : 'Nothing further forward', 900); return; }
    const target = this.trail[to]; this.restoring = true;
    try {
      const now = this.sig();
      if (target.rail && target.rail !== now.rail) {
        const b = await this.reach(target.rail);
        if (!b) { window.YapPlus.toast('Cannot reach that server any more', 1400); return; }
        b.click(); await this.sleep(450);
      }
      if (target.chan) {
        const row = Array.from(document.querySelectorAll('aside .channel-row')).find(r => { const n = r.querySelector('.name'); return n && n.textContent.replace(/\s+/g, ' ').trim() === target.chan; });
        if (row && this.sig().chan !== target.chan) { const m = row.querySelector('.channel-main') || row.querySelector('button'); if (m) { m.click(); await this.sleep(300); } }
      }
      this.at = to;
    } finally { this.restoring = false; }
  },
  fire(dir) {
    const t = Date.now();
    if (t - this.lastFire < 300) return;   // Windows reports side buttons twice (mouse event and app command)
    this.lastFire = t; this.go(dir === 'back' ? -1 : 1);
  },
  start() {
    if (this.offs) return;
    const self = this; const E = window.YapPlus.events;
    this.trail = []; this.at = -1; this.poll();
    // Page changes and channel changes come from the shared event bus. The slow timer is only a safety net for
    // changes that touch a class and nothing else (the bus does not watch class changes).
    this.offs = [E.watch(() => self.poll(), 'gipnav', 120), E.on('channel', () => self.poll(), 'gipnav')];
    this.timer = setInterval(() => self.poll(), 1500);
    const stopNative = (e) => { if (e.button === 3 || e.button === 4) { e.preventDefault(); e.stopPropagation(); } };
    this.handlers = {
      down: stopNative, aux: stopNative,
      up: (e) => { if (e.button === 3 || e.button === 4) { stopNative(e); self.fire(e.button === 3 ? 'back' : 'forward'); } },
      key: (e) => {
        if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        e.preventDefault(); self.fire(e.key === 'ArrowLeft' ? 'back' : 'forward');
      },
      click: () => setTimeout(() => self.poll(), 450),
    };
    document.addEventListener('mousedown', this.handlers.down, true);
    document.addEventListener('auxclick', this.handlers.aux, true);
    document.addEventListener('mouseup', this.handlers.up, true);
    document.addEventListener('keydown', this.handlers.key, true);
    document.addEventListener('click', this.handlers.click, true);
    window.__gipNavHandle = (dir) => { self.fire(dir); return true; };   // the desktop app forwards Windows back/forward commands here
  },
  stop() {
    clearInterval(this.timer); this.timer = null;
    if (this.offs) { window.YapPlus.util.offAll(this.offs); this.offs = null; }
    if (this.handlers) {
      document.removeEventListener('mousedown', this.handlers.down, true);
      document.removeEventListener('auxclick', this.handlers.aux, true);
      document.removeEventListener('mouseup', this.handlers.up, true);
      document.removeEventListener('keydown', this.handlers.key, true);
      document.removeEventListener('click', this.handlers.click, true);
      this.handlers = null;
    }
    delete window.__gipNavHandle;
  },
};
window.PluginHost.register(gipnav);
