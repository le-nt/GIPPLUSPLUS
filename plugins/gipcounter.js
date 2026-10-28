// GIP++ User Counter. Shows how many people use GIP++ (in the GIP++ menu header and About tab).
// Needs a counter server; see counter-worker/ and "gip.counterUrl" in package.json. With none set it does nothing.
// While enabled it sends ONE thing: a random install ID generated on this computer. No name, account, token,
// IP log or settings. Switch the plugin off and nothing is sent (the count can still be read).
const gipcounter = {
  id: 'gipcounter',
  origin: 'gip',
  name: 'User Counter',
  description: 'Counts GIP++ installs with a random anonymous ID (no name, account or settings) and shows the total in the GIP++ menu. Turn off to stop sending it.',
  last: null,
  async refresh(ping) {
    try {
      const r = await window.electronAPI.userCount(ping);
      if (r && r.success) this.last = r;
      return r;
    } catch (e) { return { success: false, error: 'unreachable' }; }
  },
  // Text for the menu header. Returns '' when there is nothing to show (not configured, offline).
  async describe() {
    const r = await this.refresh(false);
    if (!r || !r.success) return this.last ? this.fmt(this.last) : '';
    return this.fmt(r);
  },
  fmt(r) {
    const n = (x) => Number(x).toLocaleString();
    return n(r.total) + (r.total === 1 ? ' GIP++ user' : ' GIP++ users') + (r.active != null ? ' · ' + n(r.active) + ' active in the last 30 days' : '');
  },
  start() { this.refresh(true); },
  stop() {},
};
window.gipcounter = gipcounter;
window.PluginHost.register(gipcounter);
