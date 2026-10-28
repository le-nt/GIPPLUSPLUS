// GIP++ Return To Last DM. Clicking the Direct messages button in the rail opens the DM you were last talking in,
// instead of dropping you on the DM home so you have to find it again. Only your own clicks trigger it (not other plugins).
const gipdmreturn = {
  id: 'gipdmreturn',
  origin: 'gip',
  name: 'Return To Last DM',
  description: 'Clicking the Direct messages button takes you back to the DM you were last in, not the DM home screen.',
  store: 'gip.lastdm.v1',
  timer: null, handlers: null, token: 0, retry: 0,
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
  last() { try { return localStorage.getItem(this.store) || ''; } catch (e) { return ''; } },
  setLast(v) { try { if (v) localStorage.setItem(this.store, v); } catch (e) {} },

  dmBtn() {
    return Array.from(document.querySelectorAll('nav.rail button.rail-item, nav.rail a.rail-item')).find(b => !b.classList.contains('add') && !b.classList.contains('rail-folder') &&
      (b.querySelector('img[src*="/brand/"], img[src*="yapper-tile"]') || /^(direct messages|dms?|messages)$/i.test((b.getAttribute('title') || b.getAttribute('aria-label') || '').trim())));
  },
  isActive(b) { return !!b && (b.classList.contains('active') || b.getAttribute('aria-current') === 'page' || b.getAttribute('aria-pressed') === 'true'); },
  side() { return document.querySelector('aside.sidebar') || document.querySelector('aside.side-panel'); },
  rows() {
    const side = this.side(); if (!side) return [];
    let found = Array.from(side.querySelectorAll('.channel-row')).filter(r => this.nameOf(r));
    if (!found.length) found = Array.from(side.querySelectorAll('[class*="dm-" i], [class*="-dm" i], [class*="dm_" i]')).filter(r => !r.querySelector('[class*="dm-" i], [class*="-dm" i]') && this.nameOf(r));
    return found;
  },
  nameOf(row) { const n = row.querySelector('.name'); return ((n ? n.textContent : row.textContent) || '').replace(/\s+/g, ' ').trim().slice(0, 80); },
  activeRow() { return this.rows().find(r => r.classList.contains('active') || r.getAttribute('aria-current') === 'true' || r.getAttribute('aria-selected') === 'true'); },

  // Remember whichever DM is open while the DM section is showing.
  poll() {
    if (!this.isActive(this.dmBtn())) return;
    const r = this.activeRow(); if (r) this.setLast(this.nameOf(r));
  },
  async restore(token) {
    const want = this.last(); if (!want) return;
    for (let i = 0; i < 14 && token === this.token; i++) {
      await this.sleep(i ? 220 : 160);
      if (token !== this.token) return;
      if (!this.isActive(this.dmBtn())) continue;
      if (this.activeRow()) return;                 // Yappin already put you in a DM
      const row = this.rows().find(r => this.nameOf(r) === want);
      if (!row) continue;                           // list may still be loading
      const m = row.querySelector('.channel-main') || row.querySelector('button, a') || row;
      m.click(); return;
    }
  },
  start() {
    if (this.timer) return;
    const self = this;
    this.handlers = {
      click: (e) => {
        if (!e.isTrusted) return;                   // programmatic clicks (Back/Forward, Mark all read) are left alone
        const b = e.target.closest && e.target.closest('nav.rail button.rail-item, nav.rail a.rail-item');
        const dm = self.dmBtn();
        if (!b || b !== dm) return;
        const was = self.isActive(dm);
        self.token++;
        if (!was) self.restore(self.token);
      },
      cancel: (e) => {                              // you clicked somewhere else: stop trying to restore
        if (!e.isTrusted) return;
        const dm = self.dmBtn(); if (dm && e.target.closest && dm.contains(e.target)) return;
        self.token++;
      },
    };
    document.addEventListener('click', this.handlers.click, true);
    document.addEventListener('pointerdown', this.handlers.cancel, true);
    this.timer = setInterval(() => { try { self.poll(); } catch (e) {} }, 500);
    window.YapPlus.dmReturn = this;
  },
  stop() {
    clearInterval(this.timer); this.timer = null; this.token++;
    if (this.handlers) { document.removeEventListener('click', this.handlers.click, true); document.removeEventListener('pointerdown', this.handlers.cancel, true); this.handlers = null; }
  },
  // Console helper: YapPlus.dmReturn.debug()
  debug() {
    const dm = this.dmBtn();
    const out = { dmButtonFound: !!dm, dmActive: this.isActive(dm), rows: this.rows().map(r => this.nameOf(r)), activeRow: (this.activeRow() ? this.nameOf(this.activeRow()) : null), remembered: this.last() };
    console.log('[GIP++ DM return]', out); return out;
  },
};
window.PluginHost.register(gipdmreturn);
