// GIP++ Link Preview. Hover a link in chat to see where it really goes, without opening it.
// Everything in the card is worked out on your computer: the real address, whether the text lies about it,
// short links, look-alike characters, tracking junk. An optional setting (off by default) can also fetch the page title and picture;
// that does contact the site, so it is off unless you turn it on. Risky links ask before they open.
(function () {
  const Y = window.YapPlus, ME = 'giplinkpreview', STYLE = 'gip-lp-style', LINK = '.msg .msg-text a[href]';
  const SHORT = /^(bit\.ly|t\.co|tinyurl\.com|goo\.gl|ow\.ly|is\.gd|buff\.ly|rebrand\.ly|cutt\.ly|shorturl\.at|tiny\.cc|lnkd\.in|rb\.gy|v\.gd|t\.ly|s\.id|bl\.ink|shorturl\.com)$/i;
  const TRACK = /^(utm_[a-z]+|fbclid|gclid|dclid|msclkid|yclid|igshid|mc_cid|mc_eid|_ga|_gl|ref_src|ref_url|s_cid|vero_id|wickedid|oly_enc_id|oly_anon_id|mkt_tok)$/i;
  const FILEEXT = new Set('md txt log js mjs cjs ts tsx jsx json yml yaml toml ini cfg py rb rs go java kt cs cpp h c css scss html htm xml csv tsv pdf doc docx xls xlsx ppt pptx zip rar tar gz 7z exe msi dmg pkg deb apk jar bat sh ps1 png jpg jpeg gif webp bmp svg ico mp3 mp4 mkv mov avi wav flac ogg webm'.split(' '));
  let card = null, showT = 0, hideT = 0, cur = null, offs = null, hs = null;
  const api = () => window.electronAPI || {};

  function analyze(a) {
    let u; try { u = new URL(a.href); } catch (e) { return null; }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return { u, risky: false, flags: [], clean: a.href, text: '' };
    const host = u.hostname.replace(/^www\./i, ''); const flags = []; let risky = false;
    const text = (a.textContent || '').trim();
    const looksUrl = /^(https?:\/\/)?[^\s/]+\.[a-z]{2,}([/?#]\S*)?$/i.test(text);
    if (looksUrl) {
      let th = ''; try { th = new URL(/^https?:/i.test(text) ? text : 'https://' + text).hostname.replace(/^www\./i, ''); } catch (e) {}
      // File names such as README.md or setup.exe look like web addresses; only flag text whose ending is a real site-style name,
      // and treat a sub-domain of the same site (m.example.com for example.com) as the same place.
      const tl = th.toLowerCase(), hl = host.toLowerCase(), tld = tl.split('.').pop();
      const sameSite = tl === hl || hl.endsWith('.' + tl) || tl.endsWith('.' + hl);
      if (th && !FILEEXT.has(tld) && !sameSite) { flags.push(['bad', 'The link says \u201c' + th + '\u201d but really goes to ' + host + '.']); risky = true; }
    } else if (text && text.length < 120) flags.push(['info', 'Masked link. It shows \u201c' + text + '\u201d.']);
    if (u.username || u.password) { flags.push(['bad', 'This address has a hidden login part before the real site. A common trick.']); risky = true; }
    if (/(^|\.)xn--/i.test(u.hostname)) { flags.push(['bad', 'The address uses look-alike characters (internationalised name). Check it carefully.']); risky = true; }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname) || u.hostname.startsWith('[')) { flags.push(['bad', 'It goes to a raw number address, not a normal site name.']); risky = true; }
    if (SHORT.test(host)) flags.push(['warn', 'Short link. The real destination is hidden until you open it.']);
    if (u.protocol === 'http:') flags.push(['warn', 'Not encrypted (http, not https).']);
    if (u.port && u.port !== '80' && u.port !== '443') flags.push(['warn', 'Uses an unusual port (' + u.port + ').']);
    const c = new URL(u.href); let stripped = 0;
    for (const k of [...c.searchParams.keys()]) {
      if (TRACK.test(k) || (k === 'si' && /(spotify|youtube|youtu\.be)/i.test(host))) { c.searchParams.delete(k); stripped++; }
    }
    if (stripped) flags.push(['info', stripped + ' tracking part' + (stripped > 1 ? 's' : '') + ' can be removed.']);
    return { u, host, risky, flags, clean: stripped ? c.href : '', text };
  }

  function css() {
    if (document.getElementById(STYLE)) return;
    const s = document.createElement('style'); s.id = STYLE;
    s.textContent = '#gip-lp{position:fixed;z-index:10000;max-width:360px;padding:10px 12px;border-radius:10px;background:var(--bg-elev,#1e1f22);color:var(--text,#e6e6e6);border:1px solid rgba(128,128,128,.35);box-shadow:0 8px 28px rgba(0,0,0,.4);font-size:13px;line-height:1.35}' +
      '#gip-lp .h{font-weight:700;font-size:15px;word-break:break-all}#gip-lp .u{opacity:.65;font-size:12px;word-break:break-all;margin:2px 0 6px}' +
      '#gip-lp .f{margin:3px 0;padding-left:8px;border-left:3px solid #888}#gip-lp .f.bad{border-color:#ff453a}#gip-lp .f.warn{border-color:#ffb020}#gip-lp .f.info{border-color:#5aa0ff}' +
      '#gip-lp img.p{display:block;max-width:100%;max-height:150px;border-radius:6px;margin:6px 0;object-fit:cover}#gip-lp .t{font-weight:600;margin-top:6px}#gip-lp .d{opacity:.8;font-size:12px}' +
      '#gip-lp .b{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}#gip-lp button{font:inherit;font-size:12px;padding:3px 9px;border-radius:6px;border:1px solid rgba(128,128,128,.4);background:transparent;color:inherit;cursor:pointer}';
    document.head.appendChild(s);
  }
  const kill = () => { clearTimeout(showT); clearTimeout(hideT); if (card) { card.remove(); card = null; } cur = null; };
  const open = (href) => { try { if (api().openExternal) api().openExternal(href); else window.open(href, '_blank', 'noopener'); } catch (e) {} };

  function build(a, info) {
    const el = document.createElement('div'); el.id = 'gip-lp';
    const add = (cls, text) => { const d = document.createElement('div'); d.className = cls; d.textContent = text; el.appendChild(d); return d; };
    add('h', info.host || info.u.protocol); add('u', info.u.href.length > 200 ? info.u.href.slice(0, 200) + '\u2026' : info.u.href);
    info.flags.forEach(([k, t]) => add('f ' + k, t));
    if (!info.flags.length) add('f info', 'Nothing unusual about this address.');
    const meta = document.createElement('div'); el.appendChild(meta);
    const b = document.createElement('div'); b.className = 'b'; el.appendChild(b);
    const btn = (label, fn) => { const x = document.createElement('button'); x.textContent = label; x.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fn(); }); b.appendChild(x); };
    btn('Open', () => { kill(); open(info.u.href); });
    btn('Copy link', () => { navigator.clipboard.writeText(info.u.href).then(() => Y.toast('Link copied')).catch(() => {}); });
    if (info.clean) btn('Copy clean link', () => { navigator.clipboard.writeText(info.clean).then(() => Y.toast('Clean link copied')).catch(() => {}); });
    el.addEventListener('mouseenter', () => clearTimeout(hideT)); el.addEventListener('mouseleave', () => { hideT = setTimeout(kill, 250); });
    if (Y.opt(ME, 'fetch', false) && api().linkMeta && /^https?:$/.test(info.u.protocol)) {
      meta.textContent = 'Loading preview\u2026'; meta.className = 'd';
      api().linkMeta(info.u.href, Y.opt(ME, 'image', true)).then((m) => {
        if (card !== el) return; meta.textContent = ''; meta.className = '';
        if (!m || !m.success || (!m.title && !m.description && !m.image)) { meta.className = 'd'; meta.textContent = 'No preview available.'; return; }
        if (m.image) { const im = document.createElement('img'); im.className = 'p'; im.src = m.image; im.alt = ''; meta.appendChild(im); }
        if (m.title) { const t = document.createElement('div'); t.className = 't'; t.textContent = m.title; meta.appendChild(t); }
        if (m.description) { const d = document.createElement('div'); d.className = 'd'; d.textContent = m.description; meta.appendChild(d); }
        position(a);
      }).catch(() => { if (card === el) { meta.className = 'd'; meta.textContent = 'No preview available.'; } });
    }
    return el;
  }
  function position(a) {
    if (!card || !a.isConnected) return; const r = a.getBoundingClientRect(), c = card.getBoundingClientRect();
    let x = Math.min(Math.max(8, r.left), window.innerWidth - c.width - 8), y = r.bottom + 6;
    if (y + c.height > window.innerHeight - 8) y = Math.max(8, r.top - c.height - 6);
    card.style.left = x + 'px'; card.style.top = y + 'px';
  }
  function showFor(a) {
    const info = analyze(a); if (!info || !info.u || !/^https?:$/.test(info.u.protocol)) return;
    kill(); cur = a; card = build(a, info); document.body.appendChild(card); position(a);
  }

  const plugin = {
    id: ME, name: 'Link Preview', origin: 'gip',
    description: 'Hover a link to see where it really goes, with warnings for fake link text, short links and look-alike addresses. Risky links ask before they open.',
    options: [
      { key: 'confirm', type: 'toggle', dflt: true, label: 'Ask before opening risky links', desc: 'Fake link text, hidden logins, look-alike characters and raw number addresses.' },
      { key: 'fetch', type: 'toggle', dflt: false, label: 'Also load the page title and picture', desc: 'Contacts the website (it can see your internet address). Off by default.' },
      { key: 'image', type: 'toggle', dflt: true, label: 'Include the picture when loading previews' },
    ],
    start() {
      if (hs) return;
      css();
      hs = {
        over: (e) => { const a = e.target.closest && e.target.closest(LINK); if (!a || a === cur) { if (a) clearTimeout(hideT); return; } clearTimeout(showT); clearTimeout(hideT); showT = setTimeout(() => showFor(a), 350); },
        out: (e) => { const a = e.target.closest && e.target.closest(LINK); if (!a) return; clearTimeout(showT); hideT = setTimeout(() => { if (card && !card.matches(':hover')) kill(); }, 250); },
        click: (e) => {
          if (!Y.opt(ME, 'confirm', true) || e.button !== 0) return;
          const a = e.target.closest && e.target.closest(LINK); if (!a) return;
          const info = analyze(a); if (!info || !info.risky || !/^https?:$/.test(info.u.protocol)) return;
          e.preventDefault(); e.stopPropagation(); kill();
          Y.confirm('Open this risky link?', info.flags.filter(f => f[0] === 'bad').map(f => f[1]).join(' ') + ' ' + info.u.href, 'Open anyway', () => open(info.u.href));
        },
        key: (e) => { if (e.key === 'Escape') kill(); },
      };
      document.addEventListener('mouseover', hs.over, true); document.addEventListener('mouseout', hs.out, true);
      document.addEventListener('click', hs.click, true); document.addEventListener('keydown', hs.key, true);
      offs = [Y.events.on('channel', kill, ME)];
    },
    stop() {
      kill();
      if (hs) { document.removeEventListener('mouseover', hs.over, true); document.removeEventListener('mouseout', hs.out, true); document.removeEventListener('click', hs.click, true); document.removeEventListener('keydown', hs.key, true); hs = null; }
      if (offs) { Y.util.offAll(offs); offs = null; }
      const s = document.getElementById(STYLE); if (s) s.remove();
    },
  };
  window.PluginHost.register(plugin);
  window.YapPlus.analyzeLink = analyze; // used by tests
})();
