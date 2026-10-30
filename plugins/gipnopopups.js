// GIP++ No Popups. Hides Yapin's pop-up nags, like the "Help keep Yapin' running" Plus card in the corner.
// It only hides them (nothing is removed or clicked), so the site keeps working and turning this off brings them back.
const gipnopopups = {
  id: 'gipnopopups',
  origin: 'gip',
  name: 'No Popups',
  description: 'Hides pop-up nags such as the "Help keep Yapin\u2019 running" Plus card.',
  styleEl: null, obs: null, pend: 0,
  // Add more selectors here if Yapin adds new nag popups.
  get SEL() { return [window.YapPlus.sel.css('plusNudge'), '[class*="plus-nudge"]']; },
  sweep() {
    this.pend = 0;
    // Fallback: a nudge whose class name changes is still caught by its heading text.
    document.querySelectorAll('body > div').forEach(d => {
      if (d.classList.contains('gip-nopopup-hid')) return;
      const t = (d.textContent || '').slice(0, 120);
      if (/help keep yapp?in\W* running/i.test(t) && /plus/i.test(t) && d.querySelector('button') && !d.querySelector('textarea, input') && !d.closest('#gip-panel')) d.classList.add('gip-nopopup-hid');
    });
  },
  start() {
    if (this.styleEl) return;
    this.styleEl = document.createElement('style'); this.styleEl.id = 'gip-nopopups-style';
    this.styleEl.textContent = this.SEL.join(',') + ',.gip-nopopup-hid{display:none !important}';
    document.head.appendChild(this.styleEl);
    const self = this;
    // Page changes come from the shared event bus instead of a watcher of our own.
    this.obs = window.YapPlus.events.on('dom', () => { if (!self.pend) self.pend = setTimeout(() => { try { self.sweep(); } catch (e) {} }, 200); }, 'gipnopopups');
    this.sweep();
  },
  stop() {
    if (this.obs) { this.obs(); this.obs = null; }
    clearTimeout(this.pend); this.pend = 0;
    document.querySelectorAll('.gip-nopopup-hid').forEach(n => n.classList.remove('gip-nopopup-hid'));
    if (this.styleEl) { this.styleEl.remove(); this.styleEl = null; }
  },
};
window.PluginHost.register(gipnopopups);
