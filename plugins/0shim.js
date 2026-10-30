// GIP++ shim. Runs before the other plugins. Not a toggleable plugin.
(function () {
  if (window.__gipshim) return;
  window.__gipshim = true;

  // Fix: draftsave.js calls messagelogger.currentChannelId(), but nothing in the repo defines messagelogger,
  // so Draft Saver threw a ReferenceError the moment it was switched on. The channel id is the UUID in the URL.
  if (!window.messagelogger) {
    window.messagelogger = {
      currentChannelId() {
        const m = location.href.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        return m ? m[0] : null;
      },
    };
  }

  // Switch on the plugins that matter most once, on first launch, without overriding anyone's later choice.
  ['gipcodeblocks', 'gipdownloads', 'gipemojidl', 'gipemojitext', 'gipvolume', 'giptextcursor', 'gipgifs', 'gipfolders', 'gipvoice', 'gipreadall', 'gipprofileguard', 'gipserverinfo', 'gipnopopups', 'gipbrand', 'gipcounter', 'gipalts', 'gipfx'].forEach(function (id) {
    try {
      if (!localStorage.getItem('yapplus.gip.default.' + id)) {
        localStorage.setItem('yapplus.gip.default.' + id, '1');
        if (localStorage.getItem('yapplus.plugin.' + id) === null) localStorage.setItem('yapplus.plugin.' + id, '1');
      }
    } catch (e) {}
  });


  // Fix: picking a dark or light GIP++ theme only changed colours; Yappin itself stayed in its own mode, so any part
  // of the site that follows Yappin's mode (text, icons, inputs) clashed with the theme. This finds how Yappin marks
  // light/dark (an attribute or class on <html>/<body>) and switches it to match the theme's `color-scheme`.
  // It is undone when the theme is switched off.
  (function () {
    var cur = null, changes = [], csOrig, csSaved = false, mo = null, lsDone = false, tick = null;
    var LD = /light|dark/i;
    function which(v) { var m = LD.exec(v || ''); return m ? m[0].toLowerCase() : null; }
    function swapTo(v, want) { return v.replace(LD, function (x) { return x[0] === x[0].toUpperCase() ? want[0].toUpperCase() + want.slice(1) : want; }); }
    function targets() { return [document.documentElement, document.body, document.querySelector('.app'), document.getElementById('root'), document.getElementById('app')].filter(function (x, i, a) { return x && a.indexOf(x) === i; }); }
    function setAttr(t, n, v) {
      if (t.getAttribute(n) === v) return;
      if (!changes.some(function (c) { return c.t === t && c.k === 'a' && c.n === n; })) changes.push({ t: t, k: 'a', n: n, old: t.getAttribute(n) });
      t.setAttribute(n, v);
    }
    function setClass(t, rm, add) {
      if (rm && t.classList.contains(rm)) { changes.push({ t: t, k: 'c', add: rm, rm: null }); t.classList.remove(rm); }
      if (add && !t.classList.contains(add)) { changes.push({ t: t, k: 'c', add: null, rm: add }); t.classList.add(add); }
    }
    function existing() {
      var out = [];
      targets().forEach(function (t) {
        Array.prototype.forEach.call(t.attributes, function (a) {
          if (a.name !== 'class' && a.name !== 'style' && /^[\w-]+$/.test(a.value) && which(a.value)) out.push({ t: t, k: 'a', n: a.name, v: a.value });
        });
        Array.prototype.forEach.call(t.classList, function (c) { if (/^[\w-]+$/.test(c) && which(c) && !/^ypp|^gip/i.test(c)) out.push({ t: t, k: 'c', v: c }); });
      });
      return out;
    }
    function pick(sel) { if (sel === 'body') return document.body; if (sel === '.app') return document.querySelector('.app') || document.documentElement; if (sel === '#root' || sel === '#app') return document.querySelector(sel) || document.documentElement; return document.documentElement; }
    function discover(want) {
      var found = null;
      function scan(rules) {
        for (var i = 0; i < rules.length && !found; i++) {
          var r = rules[i];
          if (r.cssRules && !r.selectorText) { scan(r.cssRules); continue; }
          var sel = r.selectorText; if (!sel) continue;
          var ow = r.parentStyleSheet && r.parentStyleSheet.ownerNode;
          if (ow && /^(yapplus|gip)/i.test(ow.id || '')) continue;
          var m, re = /(html|body|:root|\.app|#root|#app)?\[((?:data-)?[\w-]*(?:theme|mode|scheme|appearance)[\w-]*)\s*=\s*["']?([\w-]+)["']?\]/ig;
          while ((m = re.exec(sel))) if (which(m[3]) === want) { found = { k: 'a', t: pick(m[1]), n: m[2], v: m[3] }; break; }
          if (found) break;
          re = /(html|body|:root|#root|#app)\.([\w-]*(?:light|dark)[\w-]*)/ig;
          while ((m = re.exec(sel))) if (which(m[2]) === want) { found = { k: 'c', t: pick(m[1]), v: m[2] }; break; }
        }
      }
      try { Array.prototype.forEach.call(document.styleSheets, function (sh) { try { if (!found) scan(sh.cssRules); } catch (e) {} }); } catch (e) {}
      return found;
    }
    // Many apps keep the light/dark choice in localStorage (key like "theme", value "light"/"dark"). Switch those too,
    // remembering the originals (also across restarts) so turning the theme off puts them back.
    var LSB = 'gip.modeBackup';
    function lsApply(want) {
      try {
        var back = JSON.parse(localStorage.getItem(LSB) || '{}');
        Object.keys(localStorage).forEach(function (k) {
          if (/^(gip\.|yapplus\.)/.test(k) || !/theme|mode|scheme|appearance|dark|light/i.test(k)) return;
          var v = localStorage.getItem(k), q = false, raw = v;
          if (/^".*"$/.test(v)) { q = true; raw = v.slice(1, -1); }
          if (!/^(light|dark)$/i.test(raw) || raw.toLowerCase() === want) return;
          if (!(k in back)) back[k] = v;
          var nv = swapTo(raw, want); localStorage.setItem(k, q ? '"' + nv + '"' : nv);
        });
        localStorage.setItem(LSB, JSON.stringify(back));
      } catch (e) {}
    }
    function lsRevert() {
      try {
        var back = JSON.parse(localStorage.getItem(LSB) || '{}');
        Object.keys(back).forEach(function (k) { localStorage.setItem(k, back[k]); });
        localStorage.removeItem(LSB);
      } catch (e) {}
    }
    function native(mode) { try { if (window.electronAPI && window.electronAPI.setNativeTheme) window.electronAPI.setNativeTheme(mode); } catch (e) {} }
    function apply(want) {
      var root = document.documentElement;
      if (!lsDone) { lsDone = true; lsApply(want); }
      if (!csSaved) { csOrig = root.style.colorScheme; csSaved = true; }
      if (root.style.colorScheme !== want) root.style.colorScheme = want;
      var done = false;
      existing().forEach(function (h) {
        var w = which(h.v); done = true;
        if (w === want) return;
        var nv = swapTo(h.v, want);
        if (h.k === 'a') setAttr(h.t, h.n, nv); else setClass(h.t, h.v, nv);
      });
      if (!done) {
        var f = discover(want);
        if (f && f.t) { if (f.k === 'a') setAttr(f.t, f.n, f.v); else setClass(f.t, null, f.v); }
      }
    }
    function revert() {
      if (mo) { mo.disconnect(); mo = null; }
      while (changes.length) {
        var c = changes.pop();
        if (c.k === 'a') { if (c.old === null) c.t.removeAttribute(c.n); else c.t.setAttribute(c.n, c.old); }
        else { if (c.rm) c.t.classList.remove(c.rm); if (c.add) c.t.classList.add(c.add); }
      }
      if (csSaved) { document.documentElement.style.colorScheme = csOrig || ''; csSaved = false; }
      if (tick) { clearInterval(tick); tick = null; }
      lsRevert(); lsDone = false; native('system');
    }
    function watch() {
      if (!mo) mo = new MutationObserver(function () { if (cur) apply(cur); });
      mo.disconnect();
      targets().forEach(function (t) { mo.observe(t, { attributes: true }); });
    }
    window.YapPlus = window.YapPlus || {};
    window.YapPlus.syncMode = function (css) {
      var m = /color-scheme\s*:\s*(light|dark)/i.exec(css || '');
      var want = m ? m[1].toLowerCase() : null;
      if (!want) { cur = null; revert(); return null; }
      if (cur && cur !== want) lsDone = false;
      cur = want; native(want); apply(want); watch();
      if (!tick) tick = setInterval(function () { if (cur) { apply(cur); watch(); } }, 2500);
      [400, 1500, 4000].forEach(function (ms) { setTimeout(function () { if (cur === want) { apply(want); watch(); } }, ms); });
      return want;
    };
  })();

  // Fix: the theme you picked was only applied after you opened the Themes panel, so it vanished on every restart.
  // Apply it at startup. First launch of GIP++ also switches on the GIP & CO dark theme once.
  (async function applySavedTheme() {
    let themes = {};
    try { themes = await window.electronAPI.getThemes(); } catch (e) { return; }
    try { themes = Object.assign({}, themes, window.YapPlus.customThemes.all()); } catch (e) {}
    let name = null;
    try {
      name = localStorage.getItem('yapplus.activeTheme');
      if (!name && !localStorage.getItem('yapplus.gip.firstRunDone') && themes['gipco-dark.css']) {
        name = 'gipco-dark.css';
        localStorage.setItem('yapplus.activeTheme', name);
      }
      localStorage.setItem('yapplus.gip.firstRunDone', '1');
    } catch (e) {}
    if (!name || !themes[name]) return;
    let el = document.getElementById('yapplus-active-theme');
    if (!el) {
      el = document.createElement('style');
      el.id = 'yapplus-active-theme';
      document.head.appendChild(el);
    }
    el.textContent = themes[name];
    try { window.YapPlus.syncMode(themes[name]); } catch (e) {}
  })();
})();

// GIP++ profile guard for themes. A person's profile (the little card that opens when you click or right-click someone in the
// member list or in voice, and the full profile) is theirs, so no theme may restyle it. Every selector in the active theme gets
// ":not(:where(<profile things>))" added to its last part, so a theme rule simply never matches anything inside a profile.
// It adds no specificity, so nothing else about the theme changes.
(function () {
  if (window.__gipprofilethemeguard) return;
  window.__gipprofilethemeguard = true;
  var PROFILE = ['.mini-pop', '.mini-pop *', '[class*="profile-card"]', '[class*="profile-card"] *', '[class*="profile-pop"]', '[class*="profile-pop"] *', '[class*="profile-modal"]', '[class*="profile-modal"] *'].join(',');
  var NOT = ':not(:where(' + PROFILE + '))';
  var MARK = '/*gip-pg*/';

  function splitTop(s) {
    var out = [], d = 0, q = '', cur = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (q) { cur += c; if (c === '\\') { cur += s[++i] || ''; } else if (c === q) q = ''; continue; }
      if (c === '"' || c === "'") { q = c; cur += c; continue; }
      if (c === '(' || c === '[') d++; else if (c === ')' || c === ']') d--;
      if (c === ',' && d === 0) { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur); return out;
  }
  function pseudoAt(p) {
    var d = 0, q = '';
    for (var i = 0; i < p.length; i++) {
      var c = p[i];
      if (q) { if (c === '\\') i++; else if (c === q) q = ''; continue; }
      if (c === '"' || c === "'") { q = c; continue; }
      if (c === '(' || c === '[') d++; else if (c === ')' || c === ']') d--;
      if (d === 0 && c === ':') {
        if (p[i + 1] === ':') return i;
        if (/^:(before|after|first-line|first-letter)\b/i.test(p.slice(i))) return i;
        // skip a normal pseudo-class like :hover or :nth-child(...)
      }
    }
    return -1;
  }
  function fixSelector(sel) {
    return splitTop(sel).map(function (p) {
      p = p.trim(); if (!p) return p;
      var i = pseudoAt(p);
      return i < 0 ? p + NOT : p.slice(0, i) + NOT + p.slice(i);
    }).join(',');
  }
  function rewrite(rules) {
    var out = '';
    Array.prototype.forEach.call(rules, function (r) {
      try {
        if (typeof CSSStyleRule !== 'undefined' && r instanceof CSSStyleRule) {
          out += r.cssRules && r.cssRules.length ? r.cssText : fixSelector(r.selectorText) + '{' + r.style.cssText + '}';
        } else if (typeof CSSMediaRule !== 'undefined' && (r instanceof CSSMediaRule || (typeof CSSSupportsRule !== 'undefined' && r instanceof CSSSupportsRule))) {
          var t = r.cssText; out += t.slice(0, t.indexOf('{')) + '{' + rewrite(r.cssRules) + '}';
        } else out += r.cssText;
      } catch (e) { out += r.cssText; }
    });
    return out;
  }
  function guard(css) {
    if (!css || css.indexOf(MARK) === 0) return css;
    try { var sh = new CSSStyleSheet(); sh.replaceSync(css); return MARK + rewrite(sh.cssRules); } catch (e) { return css; }
  }
  window.YapPlus.guardThemeCss = guard;

  var watched = null, busy = false;
  function fix(el) {
    if (busy) return; var t = el.textContent;
    if (!t || t.indexOf(MARK) === 0) return;
    busy = true; try { el.textContent = guard(t); } finally { busy = false; }
  }
  function watch() {
    var el = document.getElementById('yapplus-active-theme');
    if (!el || el === watched) return;
    watched = el; fix(el);
    new MutationObserver(function () { fix(el); }).observe(el, { childList: true, characterData: true, subtree: true });
  }
  new MutationObserver(watch).observe(document.head || document.documentElement, { childList: true });
  watch();
})();
