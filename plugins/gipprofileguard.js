// GIP++ Keep Profile Colors. Themes recolour Yappin's panels, but a person's own profile theme (their card colours, banner,
// name colour) is theirs, so GIP++ leaves it alone. Themes no longer target profile cards, and this guard re-asserts any colour
// the site sets directly on a profile (inline styles) so no theme rule can override it, whatever the theme.
const gipprofileguard = {
  id: 'gipprofileguard',
  origin: 'gip',
  name: 'Keep Profile Colors',
  description: 'Stops GIP++ themes from recolouring other people\u2019s profile themes (card colours, banners, name colours).',
  obs: null, timer: null, pend: 0,
  SEL: '[class*="profile" i][style], [class*="profile" i] [style], .msg-author[style]',
  guard() {
    this.pend = 0;
    document.querySelectorAll(this.SEL).forEach(el => {
      if (el.closest('#gip-panel, .gip-popmenu, .gip-overlay, .gip-toast, .gip-folder-panel, .gip-sinfo')) return;
      const st = el.style;
      for (let i = 0; i < st.length; i++) {
        const name = st[i];
        if (st.getPropertyPriority(name) !== 'important') st.setProperty(name, st.getPropertyValue(name), 'important');
      }
    });
  },
  start() {
    if (this.obs) return;
    const self = this;
    this.obs = new MutationObserver(() => { if (!self.pend) self.pend = setTimeout(() => { try { self.guard(); } catch (e) {} }, 120); });
    this.obs.observe(document.body, { childList: true, subtree: true });
    this.timer = setInterval(() => { try { self.guard(); } catch (e) {} }, 2000);
    this.guard();
  },
  stop() { if (this.obs) { this.obs.disconnect(); this.obs = null; } clearInterval(this.timer); this.timer = null; },
};
window.PluginHost.register(gipprofileguard);
