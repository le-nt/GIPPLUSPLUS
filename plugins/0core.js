// GIP++ core. Plugin host, origin tags and small helpers shared by every plugin.
// Every plugin has an origin: 'gip' (made for GIP++) or 'yap' (inherited from Yap++, the default).
window.YapPlus = window.YapPlus || {};
window.GipPlus = window.YapPlus;
window.YapPlus.LINKS = { server: 'https://yapin.gg/invite/gip', repo: 'https://github.com/le-nt/GIPPLUSPLUS', bugs: 'https://github.com/le-nt/GIPPLUSPLUS/issues/new' };
window.YapPlus.VERSION = '2.1.0';

window.YapPlus.PluginHost = {
  plugins: [],
  listeners: [],
  register(plugin) {
    if (!plugin.origin) plugin.origin = 'yap';
    this.plugins.push(plugin);
    if (localStorage.getItem(`yapplus.plugin.${plugin.id}`) === '1') {
      try { plugin.start(); } catch (e) { console.error('[GIP++] plugin failed to start:', plugin.id, e); }
    }
    this.listeners.forEach(fn => { try { fn(plugin); } catch (e) { console.error('[GIP++] listener failed', e); } });
  },
  isEnabled(plugin) { return localStorage.getItem(`yapplus.plugin.${plugin.id}`) === '1'; },
  setEnabled(plugin, on) {
    localStorage.setItem(`yapplus.plugin.${plugin.id}`, on ? '1' : '0');
    try { if (on) plugin.start(); else plugin.stop(); } catch (e) { console.error('[GIP++] toggle failed', plugin.id, e); }
    this.listeners.forEach(fn => fn(plugin));
  },
  all() { return this.plugins.slice(); },
  onChange(fn) { this.listeners.push(fn); },
};
window.PluginHost = window.YapPlus.PluginHost;

/* ---------- options: small per-plugin settings, shown in GIP++ > Settings ---------- */
window.YapPlus.opt = function (pluginId, key, dflt) {
  try {
    const v = localStorage.getItem(`gip.opt.${pluginId}.${key}`);
    if (v === null) return dflt;
    if (typeof dflt === 'boolean') return v === '1';
    if (typeof dflt === 'number') return Number(v);
    return v;
  } catch (e) { return dflt; }
};
window.YapPlus.setOpt = function (pluginId, key, value) {
  try { localStorage.setItem(`gip.opt.${pluginId}.${key}`, typeof value === 'boolean' ? (value ? '1' : '0') : String(value)); } catch (e) {}
  window.PluginHost.plugins.forEach(p => { if (p.id === pluginId && typeof p.onOption === 'function') { try { p.onOption(key, value); } catch (e) {} } });
};

/* ---------- origin tags ---------- */
window.YapPlus.ORIGINS = {
  gip: { label: 'GIP++', title: 'Made for GIP++' },
  yap: { label: 'Yap++', title: 'From Yap++ by salami' },
};
window.YapPlus.themeOrigin = function (filename) { return /^gip/i.test(filename || '') ? 'gip' : 'yap'; };
window.YapPlus.tag = function (origin) {
  const o = window.YapPlus.ORIGINS[origin] || window.YapPlus.ORIGINS.yap;
  const s = document.createElement('span');
  s.className = 'gip-tag gip-tag-' + (origin === 'gip' ? 'gip' : 'yap');
  s.textContent = o.label; s.title = o.title;
  return s;
};
window.YapPlus.tagHTML = function (origin) {
  const o = window.YapPlus.ORIGINS[origin] || window.YapPlus.ORIGINS.yap;
  return `<span class="gip-tag gip-tag-${origin === 'gip' ? 'gip' : 'yap'}" title="${o.title}">${o.label}</span>`;
};

/* ---------- shared look ---------- */
(function () {
  if (document.getElementById('gip-core-style')) return;
  const st = document.createElement('style');
  st.id = 'gip-core-style';
  st.textContent = `
    .gip-tag{display:inline-block;vertical-align:middle;margin-left:6px;padding:1px 5px;font:700 9px/1.5 inherit;font-family:inherit;letter-spacing:.06em;text-transform:uppercase;border-radius:4px;white-space:nowrap;user-select:none}
    .gip-tag-gip{background:var(--gip-inv-bg,#f3f3f1);color:var(--gip-inv-fg,#080808)}
    .gip-tag-yap{border:1px solid currentColor;opacity:.7}
    .gip-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483000;padding:9px 14px;border-radius:8px;font-size:13px;background:var(--bg-elev,#1e1f22);color:var(--fg,#f3f3f1);border:1px solid color-mix(in srgb,currentColor 25%,transparent);box-shadow:0 6px 24px rgba(0,0,0,.4);pointer-events:none}
  `;
  document.head.appendChild(st);
})();
window.YapPlus.toast = function (msg, ms) {
  const t = document.createElement('div');
  t.className = 'gip-toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms || 1800);
};

/* ---------- native-looking popup menu (uses Yappin's own .ctx-menu markup) ---------- */
window.YapPlus.popMenu = function (x, y, items, opts) {
  opts = opts || {};
  document.querySelectorAll('.gip-popmenu').forEach(m => m.remove());
  const menu = document.createElement('div');
  menu.className = 'ctx-menu gip-popmenu';
  menu.setAttribute('role', 'menu');
  menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:2147483000;width:${opts.width || 220}px;max-height:70vh;overflow:auto`;
  const close = () => { menu.remove(); document.removeEventListener('pointerdown', away, true); document.removeEventListener('keydown', esc, true); window.removeEventListener('blur', close); };
  const away = (e) => { if (!menu.contains(e.target)) close(); };
  const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  items.forEach(it => {
    if (it.sep) { const hr = document.createElement('div'); hr.style.cssText = 'height:1px;margin:4px 6px;background:currentColor;opacity:.15'; menu.appendChild(hr); return; }
    const b = document.createElement('button');
    if (it.icon) b.insertAdjacentHTML('beforeend', it.icon);
    b.appendChild(document.createTextNode(' ' + it.label));
    if (it.tag) b.appendChild(window.YapPlus.tag(it.tag));
    if (it.danger) b.style.color = '#ff6b6b';
    b.addEventListener('click', (e) => { e.stopPropagation(); close(); try { it.onClick && it.onClick(e); } catch (err) { console.error(err); } });
    menu.appendChild(b);
  });
  document.body.appendChild(menu);
  const r = menu.getBoundingClientRect();
  if (r.right > innerWidth - 6) menu.style.left = Math.max(6, innerWidth - r.width - 6) + 'px';
  if (r.bottom > innerHeight - 6) menu.style.top = Math.max(6, innerHeight - r.height - 6) + 'px';
  setTimeout(() => { document.addEventListener('pointerdown', away, true); document.addEventListener('keydown', esc, true); window.addEventListener('blur', close); }, 0);
  return { el: menu, close };
};

window.YapPlus.prompt = function (title, initial, cb) {
  const ov = document.createElement('div');
  ov.className = 'overlay gip-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6)';
  const m = document.createElement('div');
  m.className = 'modal';
  m.style.cssText = 'position:relative;width:min(380px,92vw);padding:18px;display:flex;flex-direction:column;gap:12px;max-height:90vh';
  const h = document.createElement('div'); h.style.cssText = 'font-weight:700;font-size:16px'; h.textContent = title;
  const inp = document.createElement('input'); inp.className = 'input'; inp.value = initial || ''; inp.maxLength = 40;
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';
  const no = document.createElement('button'); no.className = 'btn'; no.textContent = 'Cancel';
  const ok = document.createElement('button'); ok.className = 'btn primary'; ok.textContent = 'Save';
  row.append(no, ok); m.append(h, inp, row); ov.appendChild(m); document.body.appendChild(ov);
  const done = (v) => { ov.remove(); if (v != null && v.trim()) cb(v.trim()); };
  no.onclick = () => done(null); ok.onclick = () => done(inp.value);
  ov.addEventListener('pointerdown', (e) => { if (e.target === ov) done(null); });
  inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') done(inp.value); else if (e.key === 'Escape') done(null); });
  setTimeout(() => { inp.focus(); inp.select(); }, 0);
};

window.YapPlus.confirm = function (title, body, okLabel, cb) {
  const ov = document.createElement('div');
  ov.className = 'overlay gip-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6)';
  const m = document.createElement('div');
  m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  m.style.cssText = 'position:relative;width:min(400px,92vw);padding:18px;display:flex;flex-direction:column;gap:12px;max-height:90vh';
  const h = document.createElement('div'); h.style.cssText = 'font-weight:700;font-size:17px'; h.textContent = title;
  const p = document.createElement('div'); p.className = 'hint'; p.style.cssText = 'font-size:14px;line-height:1.45'; p.textContent = body;
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:4px';
  const no = document.createElement('button'); no.className = 'btn'; no.textContent = 'Cancel';
  const ok = document.createElement('button'); ok.className = 'btn primary'; ok.textContent = okLabel || 'OK';
  row.append(no, ok); m.append(h, p, row); ov.appendChild(m); document.body.appendChild(ov);
  const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } else if (e.key === 'Enter') { e.stopPropagation(); e.preventDefault(); done(true); } };
  const done = (yes) => { document.removeEventListener('keydown', key, true); ov.remove(); if (yes) cb(); };
  no.onclick = () => done(false); ok.onclick = () => done(true);
  ov.addEventListener('pointerdown', (e) => { if (e.target === ov) done(false); });
  document.addEventListener('keydown', key, true);
  setTimeout(() => ok.focus(), 0);
};


/* ---------- accent colour, imported themes, extra menu tabs (added in 2.1.0) ---------- */
window.YapPlus.extraTabs = window.YapPlus.extraTabs || [];
window.YapPlus.registerTab = function (id, label, build) {
  const t = window.YapPlus.extraTabs;
  for (let i = 0; i < t.length; i++) if (t[i].id === id) { t[i] = { id, label, build }; return; }
  t.push({ id, label, build });
};

// The accent slider (GIP++ > Themes) stores a hue 0 to 360. GIP++ themes read it through --gip-h; themes that don't use it ignore it.
window.YapPlus.applyAccent = function () {
  try {
    const v = localStorage.getItem('gip.accentHue'); const r = document.documentElement;
    if (v === null || v === '') r.style.removeProperty('--gip-h');
    else r.style.setProperty('--gip-h', String(Math.max(0, Math.min(360, Math.round(Number(v) || 0)))));
  } catch (e) {}
};
window.YapPlus.applyAccent();

// Themes pasted in by the user. CSS can't run code, but it can load remote images (a tracking risk) or hide parts of the app,
// so @import and any url() that is not an embedded image are removed.
window.YapPlus.sanitizeCss = function (css) {
  css = String(css == null ? '' : css).slice(0, 200000);
  return css
    .replace(/<\/?style[^>]*>/gi, '')
    .replace(/@import[^;]*;?/gi, '/* @import removed */')
    .replace(/url\(\s*(["']?)(?!data:image\/)[^)"']*\1\s*\)/gi, 'url("")')
    .replace(/expression\s*\(|javascript:|-moz-binding|behavior\s*:/gi, '/* removed */');
};
window.YapPlus.customThemes = {
  key: 'gip.customThemes.v1',
  all() { try { const o = JSON.parse(localStorage.getItem(this.key)); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } },
  fileFor(name) { return 'gip-custom-' + (String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'theme') + '.css'; },
  add(name, css) {
    const all = this.all(); const file = this.fileFor(name);
    all[file] = window.YapPlus.sanitizeCss(css);
    localStorage.setItem(this.key, JSON.stringify(all)); return file;
  },
  remove(file) { const all = this.all(); delete all[file]; try { localStorage.setItem(this.key, JSON.stringify(all)); } catch (e) {} },
  encode(name, css) { return 'GIPTHEME1:' + btoa(unescape(encodeURIComponent(JSON.stringify({ n: name, c: css })))); },
  decode(text) {
    text = String(text || '').trim();
    if (!/^GIPTHEME1:/.test(text)) return null;
    try { const o = JSON.parse(decodeURIComponent(escape(atob(text.slice(10).replace(/\s+/g, ''))))); return o && typeof o.c === 'string' ? { name: String(o.n || 'Imported theme').slice(0, 40), css: window.YapPlus.sanitizeCss(o.c) } : null; } catch (e) { return null; }
  },
};
