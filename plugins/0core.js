// GIP++ core. Plugin host, origin tags and small helpers shared by every plugin.
// Every plugin has an origin: 'gip' (made for GIP++) or 'yap' (inherited from Yap++, the default).
window.YapPlus = window.YapPlus || {};
window.GipPlus = window.YapPlus;
window.YapPlus.LINKS = { server: 'https://yapin.gg/invite/gip', repo: 'https://github.com/le-nt/GIPPLUSPLUS', bugs: 'https://github.com/le-nt/GIPPLUSPLUS/issues/new' };
window.YapPlus.VERSION = '3.2.2';

/* ---------- error log (3.0.0) ---------- */
// Everything that goes wrong inside a plugin lands here, shows up in GIP++ > Health, and is copied by "Copy debug info".
window.YapPlus.errors = [];
window.YapPlus.report = function (owner, where, err) {
  const e = { t: Date.now(), owner: String(owner || '?'), where: String(where || ''), msg: String((err && err.message) || err), stack: String((err && err.stack) || '').split('\n').slice(0, 4).join(' | ') };
  const list = window.YapPlus.errors; list.push(e); if (list.length > 60) list.shift();
  try { console.error('[GIP++]', e.owner, e.where, err); } catch (x) {}
  try { if (window.electronAPI && window.electronAPI.logError) { const r = window.electronAPI.logError(JSON.stringify(e)); if (r && r.catch) r.catch(() => {}); } } catch (x) {}
  return e;
};

/* ---------- plugin host ---------- */
// 3.0.0: a plugin that throws on start is turned off with a notice instead of breaking the rest, event handlers that keep
// failing turn their plugin off too, a plugin can list `requires: ['otherPluginId']`, and in safe mode nothing is started.
window.YapPlus.PluginHost = {
  plugins: [],
  listeners: [],
  pending: [],
  recent: {},
  safeMode: !!window.__gipSafeMode,
  key(p) { return `yapplus.plugin.${p.id}`; },
  stats(p) { return p.__gip || (p.__gip = { errors: 0, lastError: '', startMs: 0, running: false, crashed: false }); },
  has(id) { return this.plugins.some(p => p.id === id); },
  register(plugin) {
    if (!plugin.origin) plugin.origin = 'yap';
    this.plugins.push(plugin); this.stats(plugin);
    if (!this.safeMode && localStorage.getItem(this.key(plugin)) === '1') this.begin(plugin);
    this.flushPending();
    this.listeners.forEach(fn => { try { fn(plugin); } catch (e) { window.YapPlus.report('host', 'listener', e); } });
  },
  begin(plugin) {
    const need = (plugin.requires || []).filter(id => !this.has(id));
    if (need.length) { if (this.pending.indexOf(plugin) < 0) this.pending.push(plugin); return; }
    this.safeStart(plugin);
  },
  flushPending() {
    this.pending.slice().forEach(p => {
      if (!(p.requires || []).every(id => this.has(id))) return;
      this.pending.splice(this.pending.indexOf(p), 1);
      if (localStorage.getItem(this.key(p)) === '1') this.safeStart(p);
    });
  },
  safeStart(plugin) {
    const s = this.stats(plugin); if (s.running) return true; const t0 = performance.now();
    try { plugin.start(); s.running = true; s.crashed = false; s.startMs = Math.round(performance.now() - t0); return true; }
    catch (e) { this.crash(plugin, 'start', e, true); return false; }
  },
  safeStop(plugin) {
    const s = this.stats(plugin);
    try { plugin.stop(); } catch (e) { this.crash(plugin, 'stop', e, false); }
    s.running = false; this.cleanup(plugin);
  },
  // Safety net: whatever a plugin forgot to undo (event subscriptions, patched browser functions) is removed with it.
  cleanup(plugin) {
    try { if (window.YapPlus.events) window.YapPlus.events.offOwner(plugin.id); } catch (e) {}
    try { if (window.YapPlus.patches) window.YapPlus.patches.removeOwner(plugin.id); } catch (e) {}
  },
  crash(plugin, where, err, turnOff) {
    const s = this.stats(plugin); s.errors++; s.lastError = String((err && err.message) || err).slice(0, 200);
    window.YapPlus.report(plugin.id, where, err);
    if (!turnOff) return;
    s.crashed = true; s.running = false;
    try { localStorage.setItem(this.key(plugin), '0'); } catch (e) {}
    try { plugin.stop(); } catch (e) {}
    this.cleanup(plugin);
    try { window.YapPlus.toast((plugin.name || plugin.id) + ' crashed and was turned off. Details: GIP++ > Health.', 4500); } catch (e) {}
    this.listeners.forEach(fn => { try { fn(plugin); } catch (e) {} });
  },
  // A handler the plugin gave the event bus threw. A few errors are only logged; five in a minute turn the plugin off.
  runtimeError(ownerId, where, err) {
    const plugin = this.plugins.find(p => p.id === ownerId);
    if (!plugin) { window.YapPlus.report(ownerId, where, err); return; }
    const now = Date.now(); const list = (this.recent[ownerId] = (this.recent[ownerId] || []).filter(t => now - t < 60000)); list.push(now);
    this.crash(plugin, where, err, list.length >= 5);
  },
  isEnabled(plugin) { const on = localStorage.getItem(this.key(plugin)) === '1'; return this.safeMode ? (on && this.stats(plugin).running) : on; },
  isRunning(plugin) { return this.stats(plugin).running; },
  setEnabled(plugin, on) {
    localStorage.setItem(this.key(plugin), on ? '1' : '0');
    if (on) this.begin(plugin); else this.safeStop(plugin);
    this.listeners.forEach(fn => { try { fn(plugin); } catch (e) {} });
  },
  all() { return this.plugins.slice(); },
  onChange(fn) { this.listeners.push(fn); },
};
setTimeout(() => { const h = window.YapPlus.PluginHost; h.pending.forEach(p => window.YapPlus.report(p.id, 'requires', new Error('needs plugin(s) that never loaded: ' + (p.requires || []).filter(id => !h.has(id)).join(', ')))); }, 6000);
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
    .gip-tag{display:inline-block;vertical-align:middle;margin-left:6px;padding:1px 5px;font-family:inherit;font-weight:700;font-size:9px;line-height:1.5;letter-spacing:.06em;text-transform:uppercase;border-radius:4px;white-space:nowrap;user-select:none}
    .gip-tag-gip{background:var(--gip-inv-bg,#f3f3f1);color:var(--gip-inv-fg,#080808)}
    .gip-tag-yap{border:1px solid currentColor;opacity:.7}
    .gip-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483000;padding:9px 14px;border-radius:8px;font-size:13px;background:var(--bg-elev,#1e1f22);color:var(--fg,#f3f3f1);border:1px solid color-mix(in srgb,currentColor 25%,transparent);box-shadow:0 6px 24px rgba(0,0,0,.4);pointer-events:none}
  `;
  document.head.appendChild(st);
})();
// Small shared helpers so plugins do not each carry their own copy.
//   Y.util.store(key, fallback)  -> { get(), set(v) }   JSON in localStorage, never throws
//   Y.util.offAll(list)          -> calls every unsubscribe function in the list, ignoring errors
//   Y.util.isIconMedia(el)       -> true for emoji, avatars, reactions, stickers and tiny pictures (chat features skip these)
window.YapPlus.util = {
  store(key, fallback) {
    return {
      get() { try { const v = JSON.parse(localStorage.getItem(key)); return v === null || v === undefined ? fallback : v; } catch (e) { return fallback; } },
      set(v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} },
    };
  },
  offAll(list) { (list || []).forEach((f) => { try { f(); } catch (e) {} }); },
  isIconMedia(el) {
    if (!el || !el.classList) return false;
    if (el.classList.contains('emoji') || el.closest('.avatar, .msg-head, .reaction, [class*="emoji" i], [class*="sticker" i]')) return true;
    return el instanceof HTMLImageElement && el.complete && el.naturalWidth > 0 && el.naturalWidth < 96;
  },
};
// Save a web file through the app (real file name, no page navigation). Returns { success, path?, name?, error?, canceled? }.
window.YapPlus.download = async function (url, name, o) {
  o = o || {};
  try {
    const api = window.electronAPI;
    if (!api || !api.download) return { success: false, error: 'Downloads need the desktop app.' };
    return (await api.download({ url: String(url), name: name || '', subdir: o.subdir || '', ask: !!o.ask, reveal: !!o.reveal })) || { success: false, error: 'No answer.' };
  } catch (e) { return { success: false, error: (e && e.message) || String(e) }; }
};
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

/* ======================= GIP++ 3.0.0 foundation ======================= */

/* ---------- 1. Selector list ----------
   Every part of Yappin's page that plugins look for, in one place. When a Yappin update renames something, fix it HERE and every plugin
   that uses Y.sel follows. GIP++ > Health runs a check of this list and shows what is missing.
   when: 'core' = exists whenever you are logged in (missing = broken), 'view' = exists in some views, 'ondemand' = only while open. */
window.YapPlus.sel = {
  defs: Object.create(null),
  define(name, css, when, users) { this.defs[name] = { name, css, when: when || 'view', users: users || [] }; },
  css(name) { const d = this.defs[name]; return d ? d.css : name; },
  q(name, root) { return (root || document).querySelector(this.css(name)); },
  qa(name, root) { return Array.from((root || document).querySelectorAll(this.css(name))); },
  matches(el, name) { try { return !!(el && el.matches && el.matches(this.css(name))); } catch (e) { return false; } },
  check() {
    return Object.keys(this.defs).map(n => {
      const d = this.defs[n]; let count = 0, bad = false;
      try { count = document.querySelectorAll(d.css).length; } catch (e) { bad = true; }
      return { name: n, css: d.css, when: d.when, users: d.users, count, status: bad ? 'invalid' : count > 0 ? 'ok' : d.when === 'core' ? 'missing' : 'idle' };
    });
  },
};
(function () {
  const d = (n, c, w, u) => window.YapPlus.sel.define(n, c, w, u);
  d('app', '.app', 'core', ['0shim', 'gipfolders', 'gipfx', 'gipserverinfo']);
  d('rail', 'nav.rail', 'core', ['custombackground', 'gipfolders', 'gipnav', 'gipreadall', 'gipsearch', 'gipserverinfo']);
  d('railItem', 'nav.rail button.rail-item', 'core', ['1menu', 'gipfolders', 'gipnav', 'gipreadall', 'gipsearch', 'gipserverinfo']);
  d('railWrap', '.rail-wrap', 'core', ['gipfolders', 'gipreadall']);
  d('main', '.main', 'core', ['1menu', 'custombackground', 'gipfx', 'gipsearch', 'gipsounds']);
  d('userBar', '.user-bar', 'view', ['1menu', 'custombackground']);
  d('railFolder', 'nav.rail .rail-folder', 'ondemand', ['gipfolders', 'gipnav', 'gipreadall', 'gipserverinfo']);
  d('sidebar', 'aside.sidebar', 'view', ['custombackground', 'gipfolders', 'gipnav', 'gipreadall', 'gipserverinfo']);
  d('sidePanel', 'aside.side-panel', 'view', ['custombackground', 'gipfolders', 'gipnav', 'gipreadall', 'gipserverinfo']);
  d('channelRow', '.channel-row', 'view', ['gipfolders', 'gipnav', 'gipreadall', 'gipvoice']);
  d('channelMain', '.channel-main', 'view', ['gipfolders', 'gipnav', 'gipreadall', 'gipvoice']);
  d('composer', '.composer-box', 'view', ['1menu', 'charactercounter', 'custombackground', 'draftsave', 'gipfx', 'gipgifs', 'gipsounds']);
  d('msg', '.msg[data-message-id]', 'view', ['doubleclickreply', 'gipgifs', 'gipsearch', 'gipsounds']);
  d('msgText', '.msg .msg-text', 'view', ['gipwordfilter', 'gipcodeblocks', 'giplinkpreview']);
  d('msgAuthor', '.msg .msg-author', 'view', ['gipnicknames']);
  d('emoji', 'img.emoji', 'view', ['gipemojidl', 'gipimageblur']);
  d('voicePeople', '.voice-people', 'view', ['gipreadall', 'gipserverinfo', 'gipsounds', 'gipvoice']);
  d('ctxMenu', '.ctx-menu', 'ondemand', ['0core', 'gipfolders', 'gipserverinfo', 'gipvolume']);
  d('overlay', '.overlay', 'ondemand', ['custombackground', 'gipfolders']);
  d('miniPop', '.mini-pop', 'ondemand', ['0shim']);
  d('plusNudge', '.plus-nudge', 'ondemand', ['gipnopopups']);
  d('gifPicker', '.gif-picker', 'ondemand', ['gipgifs']);
  d('settingsMain', '.settings-main', 'ondemand', ['1menu', 'custombackground']);
})();

/* ---------- 2. Event bus ----------
   ONE page watcher for everybody. Subscribe instead of running your own MutationObserver:
     const off = Y.events.on('message', ({ids, els}) => {...}, 'myPluginId');   // returns an unsubscribe function
   Events:  message  {ids, els}     someone else's new message in the open channel (not history, not your own)
            sent     {via}          you pressed Enter or the send button with text in the composer
            channel  {href, from}   the open channel or page changed
            voice    {count, delta} people in the visible voice lists changed (only once things settled after a channel change)
            dom      MutationRecord[]  every page change (use sparingly)
   A handler that throws is caught. Five errors in a minute turn its plugin off (see PluginHost.runtimeError). */
window.YapPlus.events = (function () {
  const Y = window.YapPlus; const subs = Object.create(null); let total = 0;
  const eng = { obs: null, timer: null, keyH: null, clickH: null, seen: new Set(), lastSent: 0, ignoreUntil: 0, lastHref: '', lastVoice: null };
  const E = {
    perf: {},
    on(name, fn, owner) { (subs[name] = subs[name] || []).push({ fn, owner: owner || '?' }); total++; ensure(); return () => E.off(name, fn); },
    off(name, fn) { const l = subs[name]; if (!l) return; const i = l.findIndex(s => s.fn === fn); if (i >= 0) { l.splice(i, 1); total--; } if (total <= 0) stop(); },
    offOwner(owner) { Object.keys(subs).forEach(n => { const keep = subs[n].filter(s => s.owner !== owner); total -= subs[n].length - keep.length; subs[n] = keep; }); if (total <= 0) stop(); },
    // Debounced 'dom': fn runs once, `ms` after the page last changed. Returns an unsubscribe function (also cancels the pending run).
    watch(fn, owner, ms) { let t = 0; const off = E.on('dom', () => { if (!t) t = setTimeout(() => { t = 0; fn(); }, ms || 0); }, owner); return () => { off(); clearTimeout(t); t = 0; }; },
    count(name) { return name ? (subs[name] || []).length : total; },
    settling() { return Date.now() < eng.ignoreUntil; },
    emit(name, data) {
      (subs[name] || []).slice().forEach(s => {
        const t = performance.now();
        try { s.fn(data); } catch (e) { try { Y.PluginHost.runtimeError(s.owner, 'event:' + name, e); } catch (x) {} }
        const p = E.perf[s.owner] || (E.perf[s.owner] = { calls: 0, ms: 0 }); p.calls++; p.ms += performance.now() - t;
      });
    },
  };
  const msgSel = () => Y.sel.css('msg');
  const hasText = (t) => ((t.value !== undefined ? t.value : t.textContent) || '').trim().length > 0;
  function onMutations(list) {
    if (subs.dom && subs.dom.length) E.emit('dom', list);
    if (!(subs.message && subs.message.length)) return;
    const fresh = [];
    list.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.matches && n.matches(msgSel())) fresh.push(n); else if (n.querySelectorAll) n.querySelectorAll(msgSel()).forEach(x => fresh.push(x));
    }));
    if (!fresh.length) return;
    const els = [], ids = [];
    fresh.forEach(x => { const id = x.getAttribute('data-message-id'); if (id && !eng.seen.has(id)) { eng.seen.add(id); ids.push(id); els.push(x); } });
    if (eng.seen.size > 3000) eng.seen = new Set(Array.from(eng.seen).slice(-1500));
    const now = Date.now();
    if (!ids.length || ids.length > 3 || now < eng.ignoreUntil || now - eng.lastSent < 2000) return; // history loading, channel switch, or my own message
    E.emit('message', { ids, els });
  }
  function poll() {
    if (location.href !== eng.lastHref) { const from = eng.lastHref; eng.lastHref = location.href; eng.ignoreUntil = Date.now() + 1800; eng.lastVoice = null; E.emit('channel', { href: eng.lastHref, from }); }
    if (!(subs.voice && subs.voice.length)) return;
    const n = Array.prototype.reduce.call(document.querySelectorAll(Y.sel.css('voicePeople')), (a, el) => a + el.children.length, 0);
    if (eng.lastVoice !== null && Date.now() > eng.ignoreUntil) { const delta = n - eng.lastVoice; if (delta !== 0) E.emit('voice', { count: n, delta }); }
    eng.lastVoice = n;
  }
  function ensure() {
    if (eng.obs || !document.body) return;
    eng.lastHref = location.href; eng.ignoreUntil = Date.now() + 1800; eng.lastVoice = null;
    document.querySelectorAll(msgSel()).forEach(x => eng.seen.add(x.getAttribute('data-message-id')));
    eng.obs = new MutationObserver((l) => { try { onMutations(l); } catch (e) { Y.report('events', 'observer', e); } });
    eng.obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-expanded'] }); // aria-expanded: folders opening and closing
    eng.timer = setInterval(() => { try { poll(); } catch (e) { Y.report('events', 'poll', e); } }, 800);
    eng.keyH = (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.isComposing) { const t = e.target; if (t && t.closest && t.closest(Y.sel.css('composer')) && hasText(t)) { eng.lastSent = Date.now(); E.emit('sent', { via: 'enter' }); } } };
    eng.clickH = (e) => { const b = e.target.closest && e.target.closest('button'); if (b && b.closest(Y.sel.css('main')) && /send/i.test((b.getAttribute('aria-label') || '') + ' ' + (b.title || '') + ' ' + b.className)) { eng.lastSent = Date.now(); E.emit('sent', { via: 'button' }); } };
    document.addEventListener('keydown', eng.keyH, true); document.addEventListener('click', eng.clickH, true);
  }
  function stop() {
    if (!eng.obs) return; eng.obs.disconnect(); eng.obs = null; clearInterval(eng.timer); eng.timer = null;
    document.removeEventListener('keydown', eng.keyH, true); document.removeEventListener('click', eng.clickH, true); eng.seen = new Set();
  }
  return E;
})();

/* ---------- 3. Patch registry ----------
   Plugins that change a browser function (WebSocket.send, Notification, audio play...) do it through here, not by assigning it themselves.
   Each plugin's change is a layer on top of the original; turning one off removes only its layer, so plugins can no longer undo each other.
     Y.patches.add('myPluginId', WebSocket.prototype, 'send', (next) => function (data) { ...; return next.call(this, data); });
     Y.patches.removeOwner('myPluginId');   // in stop() */
window.YapPlus.patches = {
  entries: new Map(),
  rebuild(target, prop, e) {
    let fn = e.orig;
    e.layers.forEach(l => { try { fn = l.wrap(fn); } catch (err) { window.YapPlus.report(l.owner, 'patch ' + prop, err); } });
    try { target[prop] = fn; } catch (err) { window.YapPlus.report('patches', 'assign ' + prop, err); }
  },
  add(owner, target, prop, wrap) {
    let m = this.entries.get(target); if (!m) this.entries.set(target, m = new Map());
    let e = m.get(prop); if (!e) { e = { orig: target[prop], layers: [] }; m.set(prop, e); }
    e.layers = e.layers.filter(l => l.owner !== owner); e.layers.push({ owner, wrap });
    this.rebuild(target, prop, e);
  },
  remove(owner, target, prop) {
    const m = this.entries.get(target); const e = m && m.get(prop); if (!e) return;
    e.layers = e.layers.filter(l => l.owner !== owner);
    if (!e.layers.length) { try { target[prop] = e.orig; } catch (err) {} m.delete(prop); if (!m.size) this.entries.delete(target); } else this.rebuild(target, prop, e);
  },
  removeOwner(owner) { Array.from(this.entries.keys()).forEach(t => { const m = this.entries.get(t); if (m) Array.from(m.keys()).forEach(p => this.remove(owner, t, p)); }); },
  list() { const out = []; this.entries.forEach((m, t) => m.forEach((e, p) => out.push({ prop: p, owners: e.layers.map(l => l.owner) }))); return out; },
};

/* ---------- 4. Yappin's own UI sounds (used by Sound Packs) ---------- */
window.YapPlus.uiSound = {
  // Which event a built-in sound belongs to, judged from its file name: 'keep' (calls, never touched), 'leave', 'join', 'sent', 'recv' or null.
  category(name) {
    const s = String(name || '').toLowerCase();
    if (/ring|call|incoming|alarm|timer/.test(s)) return 'keep';
    if (/leave|left|exit|disconnect|hangup|hang-up/.test(s)) return 'leave';
    if (/join|enter|connect/.test(s)) return 'join';
    if (/sent|send|swoosh|whoosh|outgoing/.test(s)) return 'sent';
    if (/msg|message|notif|ping|mention|receive|recv|incoming|new|dm|pop|blip|chime|ding|bell|alert/.test(s)) return 'recv';
    return null;
  },
  // True for a short interface sound. Voice chat, video, voice messages and audio in chat are never UI sounds.
  isUi(el) {
    if (!el || el.tagName !== 'AUDIO' || el.srcObject || el.controls) return false;
    const src = el.currentSrc || el.src || ''; if (/^blob:/i.test(src)) return false;
    if (el.isConnected && el.closest && el.closest('.msg, .attachment, .composer-box, [class*="attach"], [class*="voice-message"], [class*="player"]')) return false;
    if (isFinite(el.duration) && el.duration > 8) return false;
    return true;
  },
};

/* ---------- 5. Settings backup, restore and versioning ---------- */
window.YapPlus.settings = {
  VERSION: 4,
  allowed: /^(gip\.|yapplus\.)/,
  blocked: /token|password|secret|session|cookie|auth/i,
  keys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (this.allowed.test(k) && !this.blocked.test(k)) out.push(k); } } catch (e) {} return out.sort(); },
  export() {
    const data = {}; this.keys().forEach(k => { try { data[k] = localStorage.getItem(k); } catch (e) {} });
    return 'GIPSETTINGS1:' + btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, app: window.YapPlus.VERSION, t: new Date().toISOString(), data }))));
  },
  inspect(text) {
    text = String(text || '').trim();
    if (!/^GIPSETTINGS1:/.test(text)) return { ok: false, error: 'That is not a GIP++ settings backup.' };
    try {
      const o = JSON.parse(decodeURIComponent(escape(atob(text.slice(13).replace(/\s+/g, '')))));
      if (!o || typeof o.data !== 'object' || o.data === null) throw new Error('empty');
      const keys = Object.keys(o.data).filter(k => this.allowed.test(k) && !this.blocked.test(k) && typeof o.data[k] === 'string' && o.data[k].length <= 600000);
      return { ok: true, count: keys.length, app: String(o.app || '?'), t: String(o.t || ''), data: o.data, keys };
    } catch (e) { return { ok: false, error: 'This backup is damaged or incomplete.' }; }
  },
  import(text) {
    const r = this.inspect(text); if (!r.ok) return r;
    r.keys.forEach(k => { try { localStorage.setItem(k, r.data[k]); } catch (e) {} });
    this.migrate(); return { ok: true, count: r.keys.length };
  },
  // Saved settings carry a version. When a release changes how something is stored, add a step here and old installs are upgraded once.
  migrations: [
    { to: 3, run() { // the "Return to last DM" plugin was removed in 3.0
      try { Object.keys(localStorage).filter(k => k === 'yapplus.plugin.gipdmreturn' || /^gip\.dmreturn/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {}
    } },
    { to: 4, run() { // Mouse Back / Forward is built into Yappin now; switch ours off once so both do not jump (can be turned back on)
      try { localStorage.setItem('yapplus.plugin.gipnav', '0'); } catch (e) {}
    } },
  ],
  migrate() {
    let cur = 0; try { cur = Number(localStorage.getItem('gip.settingsVersion')) || 0; } catch (e) {}
    this.migrations.filter(m => m.to > cur).sort((a, b) => a.to - b.to).forEach(m => { try { m.run(); } catch (e) { window.YapPlus.report('settings', 'migrate to ' + m.to, e); } });
    try { localStorage.setItem('gip.settingsVersion', String(Math.max(cur, this.VERSION))); } catch (e) {}
  },
};
try { window.YapPlus.settings.migrate(); } catch (e) {}

/* ---------- 6. Safe mode banner ---------- */
if (window.__gipSafeMode) {
  const show = () => {
    if (document.getElementById('gip-safe-banner') || !document.body) return;
    const b = document.createElement('div'); b.id = 'gip-safe-banner';
    b.style.cssText = 'position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:2147483200;display:flex;gap:10px;align-items:center;padding:7px 12px;border-radius:9px;font:600 13px system-ui,sans-serif;background:#f3f3f1;color:#080808;box-shadow:0 6px 20px rgba(0,0,0,.45)';
    const t = document.createElement('span'); t.textContent = 'GIP++ safe mode: all features are off. Your settings are untouched.';
    const r = document.createElement('button'); r.textContent = 'Restart normally'; r.style.cssText = 'font:inherit;padding:3px 9px;border-radius:6px;border:1px solid #080808;background:#080808;color:#f3f3f1;cursor:pointer';
    r.onclick = () => { try { window.electronAPI.restartApp(); } catch (e) { location.reload(); } };
    b.append(t, r); document.body.appendChild(b);
  };
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
}
