// GIP++ Confirm Voice Switch. If you are in a voice channel and click a different one, asks before moving you.
const gipvoice = {
  id: 'gipvoice',
  origin: 'gip',
  name: 'Confirm Voice Channel Switch',
  description: 'Asks "Switch voice channel?" when you click another voice channel while you are already in a call.',
  handler: null, bypass: false,
  isVoice(row) {
    if (!row) return false;
    const wrap = row.parentElement;
    if (wrap && wrap.querySelector(':scope > .voice-people')) return true;
    const path = row.querySelector('.channel-glyph path');
    return !!(path && /^M14 14\.8135V9\.18646/.test(path.getAttribute('d') || ''));
  },
  inCall() { return !!document.querySelector('button.vb.hangup'); },
  start() {
    if (this.handler) return;
    const self = this;
    this.handler = function (e) {
      if (self.bypass) return;
      const main = e.target.closest && e.target.closest('.channel-main'); if (!main) return;
      const row = main.closest('.channel-row');
      if (!row || row.classList.contains('in-call') || !self.isVoice(row) || !self.inCall()) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const cur = document.querySelector('.channel-row.in-call .name'); const next = row.querySelector('.name');
      const curName = cur ? cur.textContent.trim() : 'your current call'; const nextName = next ? next.textContent.trim() : 'this channel';
      window.YapPlus.confirm('Switch voice channel?', `You are in ${curName}. Leave it and join ${nextName}?`, 'Switch', () => {
        self.bypass = true; try { main.click(); } finally { self.bypass = false; }
      });
    };
    document.addEventListener('click', this.handler, true);
  },
  stop() { if (this.handler) document.removeEventListener('click', this.handler, true); this.handler = null; },
};
window.PluginHost.register(gipvoice);
