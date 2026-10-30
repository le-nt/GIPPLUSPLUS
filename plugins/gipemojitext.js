// GIP++ Emoji Text. Turns :emoji_names: that Yappin leaves as plain text (bios, statuses, profile cards, anywhere) into the emoji picture.
// Yappin only converts names in places it knows about. GIP++ learns each emoji's name and picture from every emoji it sees
// on screen (chat, the emoji picker, reactions) and remembers them, then swaps matching :names: elsewhere.
// Matching ignores upper/lower case, so :GIP_logo: and :gip_LOGO: find the same emoji. An emoji GIP++ has never seen is left as text;
// open the emoji picker once (or scroll past it in chat) and it will be learned.
// It also reads Yappin's own emoji lists as they load (so every emoji your account can use is known), and can ask Yappin for the list itself.
// The text is never deleted: the original sits (emptied) next to the picture and is restored when this feature is turned off.
(function () {
  const Y = window.YapPlus, ME = 'gipemojitext', KEY = 'gip.emojitext.v1', MAX = 6000;
  const LEARN = 'img.emoji, img[class*="emoji" i], [class*="emoji" i] img, img[alt^=":"][alt$=":"]';
  const SKIP = 'input, textarea, select, script, style, code, pre, [contenteditable], [contenteditable="true"], .emoji-picker, [data-gip-emo], [role="textbox"], [class*="composer" i]';
  const NAME = /^[A-Za-z0-9_+\-]{2,64}$/, FIND = /:([A-Za-z0-9_+\-]{2,64}):/g;
  const SRC = 'gip.emojitext.src.v1';           // { url: endpoint that worked, t: last load time }
  const GUESS = ['/api/emojis', '/api/emoji', '/api/v1/emojis', '/api/emojis/all', '/api/users/@me/emojis', '/api/me/emojis', '/api/emojis/list', '/emojis.json'];
  const EURL = /emoji/i, NAMEKEYS = ['name', 'shortcode', 'shortCode', 'short_code', 'code', 'alias', 'title', 'label'];
  let map = null, off = null, dirty = false, saveT = 0, loading = false;
  const done = new WeakMap(); // text node -> { orig, span }

  const load0 = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } };
  const flush = () => { saveT = 0; if (!dirty) return; dirty = false; try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (e) {} };
  const later = () => { dirty = true; if (!saveT) saveT = setTimeout(flush, 1500); };


  function add(raw, url) {
    const name = String(raw || '').replace(/:/g, '').trim(); if (!NAME.test(name) || typeof url !== 'string') return 0;
    if (url.charAt(0) === '/' && url.charAt(1) !== '/') url = location.origin + url;
    if (!/^https?:/i.test(url) || !EURL.test(url)) return 0;
    const k = name.toLowerCase();
    if (!map[k] && Object.keys(map).length >= MAX) return 0;
    if (map[k] === url) return 0;
    map[k] = url; return 1;
  }
  // Walk JSON that Yappin sent and pick out anything shaped like { name, <emoji picture address> }.
  function harvest(root) {
    if (!map) map = load0();
    let added = 0, seen = 0; const stack = [[root, 0]];
    while (stack.length && seen < 30000) {
      const [o, d] = stack.pop(); seen++;
      if (!o || typeof o !== 'object' || d > 8) continue;
      if (Array.isArray(o)) { for (let i = 0; i < o.length; i++) stack.push([o[i], d + 1]); continue; }
      let url = '', name = '';
      for (const key in o) {
        const v = o[key];
        if (typeof v === 'string') { if (!url && EURL.test(v) && /^(https?:\/\/|\/)/i.test(v) && /(url|image|src|path|file|link|href)/i.test(key)) url = v; }
        else if (v && typeof v === 'object') stack.push([v, d + 1]);
      }
      if (url) { for (const nk of NAMEKEYS) { const v = o[nk]; if (typeof v === 'string' && NAME.test(v.replace(/:/g, '').trim())) { name = v; break; } } }
      if (url && name) added += add(name, url);
    }
    if (added) later();
    return added;
  }
  // Ask Yappin for its emoji list using the same login the page already has (read-only GET requests, same site only).
  async function load(manual) {
    if (loading) return { ok: false, msg: 'Already loading' }; loading = true;
    try {
      if (!map) map = load0();
      let src = {}; try { src = JSON.parse(localStorage.getItem(SRC) || '{}') || {}; } catch (e) {}
      const tries = src.url ? [src.url].concat(manual ? GUESS.filter(g => g !== src.url) : []) : (manual ? GUESS : GUESS.slice(0, 2)); // the daily automatic check only tries the remembered address or the two likeliest
      for (const path of tries) {
        let r; try { r = await fetch(path, { credentials: 'include', headers: { accept: 'application/json' }, cache: 'no-store' }); } catch (e) { continue; }
        if (!r || !r.ok || !/json/i.test(r.headers.get('content-type') || '')) continue;
        let j; try { j = await r.json(); } catch (e) { continue; }
        const n = harvest(j); flush();
        if (n) { try { localStorage.setItem(SRC, JSON.stringify({ url: path, t: Date.now() })); } catch (e) {} return { ok: true, n, path }; }
      }
      try { localStorage.setItem(SRC, JSON.stringify({ url: src.url || '', t: Date.now(), failed: true })); } catch (e) {}
      return { ok: false, msg: 'Yappin did not give a list at any address GIP++ knows' };
    } finally { loading = false; }
  }

  function learn() {
    let n = 0;
    document.querySelectorAll(LEARN).forEach((img) => {
      if (!(img instanceof HTMLImageElement) || img.hasAttribute('data-gip-emoimg')) return;
      const src = img.currentSrc || img.src || ''; if (!/^https?:/i.test(src)) return;
      const raw = (img.getAttribute('data-name') || img.getAttribute('alt') || img.getAttribute('title') || img.getAttribute('aria-label') || '').replace(/:/g, '').trim();
      if (!NAME.test(raw)) return;
      n += add(raw, src);
    });
    if (n) later();
  }

  function build(text) {
    const frag = document.createDocumentFragment(); let last = 0, hit = false, m; FIND.lastIndex = 0;
    while ((m = FIND.exec(text))) {
      const url = map[m[1].toLowerCase()]; if (!url) continue;
      hit = true;
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const img = document.createElement('img');
      img.src = url; img.alt = ':' + m[1] + ':'; img.title = ':' + m[1] + ':'; img.draggable = false;
      img.setAttribute('data-gip-emoimg', '1');
      img.style.cssText = 'height:1.25em;width:auto;max-width:2.5em;vertical-align:-0.25em;object-fit:contain;display:inline-block';
      frag.appendChild(img); last = m.index + m[0].length;
    }
    if (!hit) return null;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }

  function undo(node) {
    const d = done.get(node); if (!d) return;
    if (d.span && d.span.parentNode) d.span.remove();
    done.delete(node);
  }

  function scan() {
    if (!map) map = load0();
    learn();
    if (!Object.keys(map).length || !document.body) return;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        const v = n.nodeValue;
        if (!v || v.indexOf(':') < 0) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement; if (!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = []; for (let n = w.nextNode(); n && nodes.length < 400; n = w.nextNode()) nodes.push(n);
    nodes.forEach((node) => {
      try {
        const text = node.nodeValue;
        // If Yappin rewrote this text since we converted it, throw our old picture away and look again.
        undo(node);
        const frag = build(text); if (!frag || !node.parentNode) return;
        const span = document.createElement('span'); span.setAttribute('data-gip-emo', '1'); span.style.display = 'contents';
        span.appendChild(frag);
        node.parentNode.insertBefore(span, node.nextSibling);
        node.nodeValue = '';
        done.set(node, { orig: text, span });
      } catch (e) { Y.report(ME, 'convert', e); }
    });
    // Text we emptied that Yappin later refilled is picked up by the next scan (its value is no longer empty).
  }

  function restore() {
    document.querySelectorAll('[data-gip-emo]').forEach((s) => {
      const prev = s.previousSibling;
      const d = prev && done.get(prev);
      if (d && prev.nodeType === 3 && prev.nodeValue === '') prev.nodeValue = d.orig;
      if (prev) done.delete(prev);
      s.remove();
    });
  }

  const plugin = {
    id: ME, name: 'Emoji Text', origin: 'gip',
    description: 'Turns :emoji_names: left as plain text (bios, statuses, anywhere Yappin does not convert them) into the emoji. It learns emoji as it sees them; open the emoji picker once to teach it more.',
    options: [
      { key: 'auto', type: 'toggle', dflt: true, label: 'Load Yappin\u2019s emoji list', desc: 'About once a day, ask Yappin (with your own login, read only) for the emoji your account can use, so names work without seeing the emoji first.' },
    ],
    start() {
      if (off) return;
      map = load0();
      // Read every emoji list Yappin loads on its own (picker, server settings). Nothing extra is requested for this.
      Y.patches.add(ME, window, 'fetch', (next) => function () {
        const p = next.apply(this, arguments);
        try {
          p.then((r) => {
            try {
              if (!r || !r.ok || !/json/i.test(r.headers.get('content-type') || '')) return;
              if (Number(r.headers.get('content-length') || 0) > 5e6) return;
              r.clone().json().then((j) => harvest(j)).catch(() => {});
            } catch (e) {}
          }, () => {});
        } catch (e) {}
        return p;
      });
      off = Y.events.watch(scan, ME, 250);
      scan();
      let src = {}; try { src = JSON.parse(localStorage.getItem(SRC) || '{}') || {}; } catch (e) {}
      if (Y.opt(ME, 'auto', true) && (!src.t || Date.now() - src.t > (src.failed ? 6048e5 : 864e5))) setTimeout(() => { if (off) load(false).catch(() => {}); }, 4000);
    },
    stop() {
      try { Y.patches.removeOwner(ME); } catch (e) {}
      if (off) { Y.util.offAll([off]); off = null; }
      if (saveT) { clearTimeout(saveT); } flush();
      restore();
    },
  };
  window.PluginHost.register(plugin);

  Y.registerTab('emojitext', 'Emoji Text', function (ui) {
    const { el, group } = ui; const root = el('div');
    const g = group('Emoji Text', 'gip', 'Turn the feature on in Features. GIP++ reads the emoji lists Yappin loads, can ask Yappin for the full list, and also learns any emoji it sees on screen. Matching ignores capital letters.');
    const info = el('div', { class: 'gp-desc' });
    const count = () => { const m = map || load0(); info.textContent = Object.keys(m).length + ' emoji learned.'; };
    const learnNow = el('button', { class: 'btn', text: 'Learn emoji on screen now' });
    learnNow.addEventListener('click', () => { if (!map) map = load0(); learn(); flush(); count(); Y.toast('Learned. Open the emoji picker and press this again to learn more.', 3500); });
    const fetchNow = el('button', { class: 'btn', text: 'Load emoji list from Yappin now' });
    fetchNow.addEventListener('click', async () => {
      fetchNow.disabled = true; Y.toast('Asking Yappin for its emoji list\u2026', 1500);
      try { const r = await load(true); count(); Y.toast(r.ok ? 'Loaded ' + r.n + ' emoji' : r.msg, 4000); } catch (e) { Y.toast('Could not load the list'); }
      fetchNow.disabled = false;
    });
    const clear = el('button', { class: 'btn', text: 'Forget all learned emoji' });
    clear.addEventListener('click', () => { map = {}; dirty = true; flush(); if (Y.PluginHost.isRunning(plugin)) restore(); count(); });
    g.appendChild(info); g.appendChild(el('div', { class: 'gp-line', style: 'gap:8px;flex-wrap:wrap' }, fetchNow, learnNow, clear));
    root.appendChild(g); count();
    return root;
  });
})();
