// GIP++ Monochrome Branding. Turns Yappin's own logo (the Direct messages button and other /brand/ images) black and white.
const gipbrand = {
  id: 'gipbrand',
  origin: 'gip',
  name: 'Black & White Yappin Logo',
  description: 'Makes the Yappin logo greyscale (or pure black and white) so it fits the GIP++ look.',
  options: [
    { key: 'mode', type: 'select', dflt: 'grey', label: 'Logo style', choices: [['grey', 'Greyscale'], ['bw', 'Pure black and white'], ['invert', 'Inverted greyscale']] },
  ],
  el: null,
  filter() {
    const m = window.YapPlus.opt('gipbrand', 'mode', 'grey');
    if (m === 'bw') return 'grayscale(1) contrast(6) brightness(1.05)';
    if (m === 'invert') return 'grayscale(1) invert(1)';
    return 'grayscale(1) contrast(1.15)';
  },
  apply() {
    if (!this.el) { this.el = document.createElement('style'); this.el.id = 'gip-brand-style'; document.head.appendChild(this.el); }
    this.el.textContent = `img[src*="/brand/"], img[src*="yapper-tile"] { filter: ${this.filter()} !important; }`;
  },
  onOption() { this.apply(); },
  start() { this.apply(); },
  stop() { if (this.el) { this.el.remove(); this.el = null; } },
};
window.PluginHost.register(gipbrand);
