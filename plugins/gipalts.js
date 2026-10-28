// GIP++ Better Alt Manager (the look part). Every account profile is its own window with its own login.
// This plugin tints a window with its profile colour so alts are easy to tell apart: a coloured frame, a name tag,
// and the site's accent colour. Create and open profiles in GIP++ > Accounts. Themes and plugin choices are
// remembered per account too, so each alt can also have its own theme.
const gipalts = {
  id: 'gipalts',
  origin: 'gip',
  name: 'Better Alt Manager',
  description: 'Run several accounts at once, each in its own window with its own colour frame, name tag and accent colour. Manage them in GIP++ > Accounts.',
  options: [
    { key: 'frame', type: 'toggle', dflt: true, label: 'Coloured frame', desc: 'A coloured border around the whole window.' },
    { key: 'tag', type: 'toggle', dflt: true, label: 'Name tag', desc: 'Shows which account this window is, in the corner.' },
    { key: 'accent', type: 'toggle', dflt: true, label: 'Tint the accent colour', desc: 'Uses the profile colour as the site accent colour.' },
  ],
  style: null, tagEl: null,
  profile() { return window.__gipProfile || null; },
  apply() {
    this.clear();
    const p = this.profile(); const o = (k) => window.YapPlus.opt('gipalts', k, true);
    if (!p || !p.color) return;   // the main account with no colour set looks normal
    const c = p.color;
    this.style = document.createElement('style'); this.style.id = 'gip-alts-style';
    this.style.textContent =
      (o('frame') ? `html::after{content:"";position:fixed;inset:0;border:3px solid ${c};pointer-events:none;z-index:2147482999}` : '') +
      (o('accent') ? `:root{--accent:${c} !important;accent-color:${c}}` : '');
    document.head.appendChild(this.style);
    if (o('tag')) {
      const t = document.createElement('div'); t.className = 'gip-alt-tag'; t.textContent = p.name;
      t.style.cssText = `position:fixed;right:10px;bottom:10px;z-index:2147483000;padding:3px 9px;border-radius:999px;font:700 11px/1.5 system-ui,sans-serif;letter-spacing:.04em;background:${c};color:${this.contrast(c)};opacity:.9;pointer-events:none;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`;
      document.body.appendChild(t); this.tagEl = t;
    }
  },
  contrast(hex) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#080808' : '#ffffff';
  },
  clear() { if (this.style) { this.style.remove(); this.style = null; } if (this.tagEl) { this.tagEl.remove(); this.tagEl = null; } },
  onOption() { this.apply(); },
  start() { this.apply(); },
  stop() { this.clear(); },
};
window.gipalts = gipalts;
window.PluginHost.register(gipalts);
