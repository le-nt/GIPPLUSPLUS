// GIP++ Code Blocks. A copy button on code blocks in chat, and syntax colours.
// Colours use the browser's highlight feature, so the message text is never rewritten and copying still gives plain code.
(function () {
  const Y = window.YapPlus, ME = 'gipcodeblocks', STYLE = 'gip-cb-style', BLOCK = '.msg pre';
  const hasHl = !!(window.CSS && CSS.highlights && window.Highlight);
  const CLASSES = ['kw', 'str', 'cmt', 'num', 'lit', 'fn'];
  let offs = null, hs = null, btn = null, over = null, hideT = 0, cache = new WeakMap();

  const KW = {
    c: 'if else for while do switch case break continue return function class const let var new this typeof instanceof in of import export from default try catch finally throw async await yield static public private protected void int long short float double char bool boolean string struct enum union interface extends implements package namespace using fn pub mut impl trait match use mod crate self super where loop as ref unsafe type abstract final override virtual readonly delete goto sizeof typedef extern inline template typename volatile signed unsigned def val fun object when is lateinit companion data sealed init func go defer chan select range map var fallthrough',
    py: 'def class if elif else for while return import from as with try except finally raise pass break continue lambda yield global nonlocal assert del in is not and or async await print self cls end then do begin unless until module require include rescue ensure fi esac done elif function local export alias echo',
    sql: 'select from where insert into values update set delete create table drop alter add join left right inner outer on group by order having limit offset as and or not null is in like between distinct union all index primary key foreign references default unique view case when then else end exists count sum avg min max',
  };
  const LIT = new Set(['true', 'false', 'null', 'nil', 'none', 'undefined', 'nan', 'infinity', 'this', 'self', 'True', 'False', 'None', 'NULL', 'TRUE', 'FALSE']);
  const FAMILY = { js: 'c', javascript: 'c', jsx: 'c', ts: 'c', typescript: 'c', tsx: 'c', java: 'c', c: 'c', h: 'c', cpp: 'c', 'c++': 'c', cc: 'c', cs: 'c', csharp: 'c', go: 'c', rust: 'c', rs: 'c', kotlin: 'c', kt: 'c', swift: 'c', php: 'c', dart: 'c', scala: 'c', lua: 'py', glsl: 'c', gdscript: 'py',
    py: 'py', python: 'py', rb: 'py', ruby: 'py', sh: 'py', bash: 'py', shell: 'py', zsh: 'py', yaml: 'py', yml: 'py', toml: 'py', ini: 'py', ps1: 'py', powershell: 'py', r: 'py', perl: 'py', pl: 'py', dockerfile: 'py', makefile: 'py',
    sql: 'sql', mysql: 'sql', postgres: 'sql', sqlite: 'sql', json: 'json', html: 'xml', xml: 'xml', svg: 'xml', css: 'css', scss: 'css', less: 'css' };
  const setOf = {}; Object.keys(KW).forEach(k => { setOf[k] = new Set(KW[k].split(' ')); });

  // Pure function: returns [{s, e, c}] ranges (start, end, class) over `text`. Exposed for tests.
  function tokenize(text, lang) {
    const fam = FAMILY[String(lang || '').toLowerCase()] || guess(text);
    const out = []; if (text.length > 20000) return out;
    const push = (m, c) => out.push({ s: m.index, e: m.index + m[0].length, c });
    if (fam === 'xml') {
      for (const m of text.matchAll(/<!--[\s\S]*?-->/g)) push(m, 'cmt');
      for (const m of text.matchAll(/<\/?[A-Za-z][\w:-]*|\/?>/g)) push(m, 'kw');
      for (const m of text.matchAll(/"[^"\n]*"|'[^'\n]*'/g)) push(m, 'str');
      return clean(out);
    }
    if (fam === 'json') {
      for (const m of text.matchAll(/"(?:[^"\\\n]|\\.)*"(\s*:)?/g)) out.push({ s: m.index, e: m.index + m[0].length - (m[1] ? m[1].length : 0), c: m[1] ? 'kw' : 'str' }); // one pass, so quotes never pair up across strings
      for (const m of text.matchAll(/-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g)) push(m, 'num');
      for (const m of text.matchAll(/\b(?:true|false|null)\b/g)) push(m, 'lit');
      return clean(out);
    }
    const hash = fam === 'py'; const sql = fam === 'sql'; const kws = setOf[fam === 'css' ? 'c' : fam] || setOf.c;
    const re = new RegExp([
      hash ? '(#[^\\n]*)' : sql ? '(--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)' : '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)',
      '("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^`\\\\]|\\\\[\\s\\S])*`)',
      '(\\b0x[0-9a-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)',
      fam === 'css' ? '(@[\\w-]+)' : '((?!))', // never matches outside css
      '([A-Za-z_$][\\w$]*)',
    ].join('|'), 'g');
    let m;
    while ((m = re.exec(text))) {
      if (m[1]) out.push({ s: m.index, e: m.index + m[0].length, c: 'cmt' });
      else if (m[2]) out.push({ s: m.index, e: m.index + m[0].length, c: 'str' });
      else if (m[3]) out.push({ s: m.index, e: m.index + m[0].length, c: 'num' });
      else if (m[4]) out.push({ s: m.index, e: m.index + m[0].length, c: 'kw' });
      else if (m[5]) {
        const w = m[5], key = sql ? w.toLowerCase() : w;
        if (LIT.has(w)) out.push({ s: m.index, e: m.index + w.length, c: 'lit' });
        else if (kws.has(key)) out.push({ s: m.index, e: m.index + w.length, c: 'kw' });
        else if (text[m.index + w.length] === '(' && fam !== 'css') out.push({ s: m.index, e: m.index + w.length, c: 'fn' });
      }
      if (m[0].length === 0) re.lastIndex++;
    }
    return out;
  }
  function clean(list) { // later tokens must not overlap earlier ones
    list.sort((a, b) => a.s - b.s || b.e - a.e); const out = []; let end = -1;
    for (const t of list) if (t.s >= end) { out.push(t); end = t.e; }
    return out;
  }
  function guess(text) {
    const t = text.trim();
    if (/^[\[{][\s\S]*[\]}]$/.test(t) && /"\s*:/.test(t)) return 'json';
    if (/^<[A-Za-z!?]/.test(t) && />\s*$/.test(t)) return 'xml';
    if (/^\s*(def |import |from \w+ import|print\()/m.test(t) || /^\s*#!/.test(t)) return 'py';
    if (/\b(select|insert into|create table)\b/i.test(t) && /\bfrom|values|table\b/i.test(t)) return 'sql';
    return 'c';
  }
  const langOf = (pre) => {
    const c = pre.querySelector('code') || pre; const cls = (c.getAttribute('class') || '') + ' ' + (pre.getAttribute('class') || '');
    const m = /(?:language|lang)-([\w+#-]+)/i.exec(cls); return m ? m[1] : (c.getAttribute('data-lang') || pre.getAttribute('data-lang') || '');
  };

  function paint() {
    if (!hasHl) return;
    const groups = {}; CLASSES.forEach(c => { groups[c] = []; });
    document.querySelectorAll(BLOCK).forEach((pre) => {
      const code = pre.querySelector('code') || pre;
      if (code.children.length > 0) return; // already coloured by the page itself
      const node = code.firstChild; if (!node || node.nodeType !== 3 || code.childNodes.length !== 1) return;
      const text = node.nodeValue; const c = cache.get(pre);
      let ranges;
      if (c && c.node === node && c.text === text && node.isConnected) ranges = c.ranges;
      else {
        ranges = tokenize(text, langOf(pre)).map((t) => { const r = document.createRange(); r.setStart(node, t.s); r.setEnd(node, t.e); return { r, c: t.c }; });
        cache.set(pre, { node, text, ranges });
      }
      ranges.forEach(x => groups[x.c].push(x.r));
    });
    CLASSES.forEach((c) => { try { if (groups[c].length) CSS.highlights.set('gip-' + c, new Highlight(...groups[c])); else CSS.highlights.delete('gip-' + c); } catch (e) {} });
  }
  function theme() {
    const bg = getComputedStyle(document.body).backgroundColor; const m = /(\d+)[, ]+(\d+)[, ]+(\d+)/.exec(bg);
    const light = m ? (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) > 160 : false;
    const p = light ? { kw: '#a626a4', str: '#50a14f', cmt: '#8a8f98', num: '#b76b01', lit: '#0184bc', fn: '#4078f2' } : { kw: '#c678dd', str: '#98c379', cmt: '#7f848e', num: '#d19a66', lit: '#56b6c2', fn: '#61afef' };
    return CLASSES.map(c => '::highlight(gip-' + c + '){color:' + p[c] + (c === 'cmt' ? ';font-style:italic' : '') + '}').join('');
  }
  function css() {
    let s = document.getElementById(STYLE); if (!s) { s = document.createElement('style'); s.id = STYLE; document.head.appendChild(s); }
    s.textContent = theme() + '#gip-cb-copy{position:fixed;z-index:9995;font:12px/1 inherit;padding:4px 8px;border-radius:6px;border:1px solid rgba(128,128,128,.45);background:var(--bg-elev,#1e1f22);color:var(--text,#e6e6e6);cursor:pointer;opacity:.95}';
  }
  function showBtn(pre) {
    if (!btn) { btn = document.createElement('button'); btn.id = 'gip-cb-copy'; btn.type = 'button'; btn.textContent = 'Copy'; btn.addEventListener('mouseenter', () => clearTimeout(hideT)); btn.addEventListener('mouseleave', () => { hideT = setTimeout(hideBtn, 200); });
      btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (!over) return; const t = over.innerText.replace(/\n$/, ''); navigator.clipboard.writeText(t).then(() => { btn.textContent = 'Copied'; setTimeout(() => { if (btn) btn.textContent = 'Copy'; }, 1100); }).catch(() => { btn.textContent = 'Failed'; }); });
      document.body.appendChild(btn); }
    over = pre; const r = pre.getBoundingClientRect(); btn.style.top = Math.max(4, r.top + 6) + 'px'; btn.style.left = Math.max(4, r.right - 60) + 'px'; btn.style.display = 'block';
  }
  function hideBtn() { if (btn) btn.style.display = 'none'; over = null; }

  const plugin = {
    id: ME, name: 'Code Blocks', origin: 'gip',
    description: 'A copy button when you hover a code block in chat, and syntax colours for common languages.',
    options: [
      { key: 'copy', type: 'toggle', dflt: true, label: 'Copy button on code blocks' },
      { key: 'syntax', type: 'toggle', dflt: true, label: 'Syntax colours', desc: hasHl ? '' : 'Needs a newer browser engine than this one.' },
    ],
    start() {
      if (offs) return;
      css();
      hs = {
        over: (e) => { if (!Y.opt(ME, 'copy', true)) return; const pre = e.target.closest && e.target.closest(BLOCK); if (pre) { clearTimeout(hideT); showBtn(pre); } },
        out: (e) => { const pre = e.target.closest && e.target.closest(BLOCK); if (pre) hideT = setTimeout(() => { if (!(btn && btn.matches(':hover'))) hideBtn(); }, 200); },
        scroll: () => { if (over && over.isConnected) showBtn(over); else hideBtn(); },
      };
      document.addEventListener('mouseover', hs.over, true); document.addEventListener('mouseout', hs.out, true); document.addEventListener('scroll', hs.scroll, true);
      offs = [Y.events.watch(() => { if (Y.opt(ME, 'syntax', true)) paint(); }, ME, 250), Y.events.on('channel', () => { hideBtn(); setTimeout(() => { if (Y.opt(ME, 'syntax', true)) paint(); }, 300); }, ME)];
      if (Y.opt(ME, 'syntax', true)) paint();
    },
    stop() {
      if (offs) { Y.util.offAll(offs); offs = null; }
      if (hs) { document.removeEventListener('mouseover', hs.over, true); document.removeEventListener('mouseout', hs.out, true); document.removeEventListener('scroll', hs.scroll, true); hs = null; }
      if (hasHl) CLASSES.forEach(c => { try { CSS.highlights.delete('gip-' + c); } catch (e) {} });
      if (btn) { btn.remove(); btn = null; } over = null; clearTimeout(hideT); cache = new WeakMap();
      const s = document.getElementById(STYLE); if (s) s.remove();
    },
    onOption(k) { if (!offs) return; if (k === 'syntax') { if (Y.opt(ME, 'syntax', true)) paint(); else if (hasHl) CLASSES.forEach(c => { try { CSS.highlights.delete('gip-' + c); } catch (e) {} }); } if (k === 'copy' && !Y.opt(ME, 'copy', true)) hideBtn(); },
  };
  window.PluginHost.register(plugin);
  window.YapPlus.codeTokenize = tokenize; // used by tests
})();
