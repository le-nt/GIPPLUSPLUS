// GIP++ menu. One tab in Yappin's own Settings that holds everything: plugins, settings, themes, about.
// Built from Yappin's own classes and the page's own colours so it looks like part of the app.
// Everything from GIP++ carries a GIP++ tag; everything inherited from Yap++ carries a Yap++ tag.
(function () {
  if (window.__gipmenuinstalled) return;
  window.__gipmenuinstalled = true;
  const navid = 'gip-nav-button', panelid = 'gip-panel';
  const Y = window.YapPlus;

  const style = document.createElement('style');
  style.id = 'gip-menu-style';
  style.textContent = `
    #${navid}{display:flex;align-items:center;gap:8px}
    #${navid} svg{width:18px;height:18px;flex:0 0 18px}
    #${panelid}{padding:28px 40px;line-height:1.5;max-width:760px}
    #${panelid} h1{margin:0 0 4px;font-size:22px;display:flex;align-items:center;gap:10px}
    #${panelid} .gp-sub{opacity:.7;margin:0 0 16px;font-size:13px}
    #${panelid} .gp-tabs{display:flex;flex-wrap:wrap;gap:2px 6px;margin:0 0 18px;border-bottom:1px solid color-mix(in srgb,currentColor 16%,transparent)}
    #${panelid} .gp-tab{flex:0 0 auto;white-space:nowrap;background:none;border:0;border-bottom:2px solid transparent;color:inherit;opacity:.65;padding:8px 12px;cursor:pointer;font:inherit;font-weight:600}
    #${panelid} .gp-tab:hover{opacity:1}
    #${panelid} .gp-tab.on{opacity:1;border-bottom-color:currentColor}
    #${panelid} .gp-group{margin:0 0 26px}
    #${panelid} .gp-group h3{font-size:12px;text-transform:uppercase;letter-spacing:.06em;opacity:.65;margin:0 0 6px;display:flex;align-items:center;gap:8px}
    #${panelid} .gp-group .gp-note{font-size:12px;opacity:.6;margin:0 0 8px}
    #${panelid} .gp-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid color-mix(in srgb,currentColor 10%,transparent)}
    #${panelid} .gp-row:last-child{border-bottom:0}
    #${panelid} .gp-name{font-weight:600;display:flex;align-items:center;flex-wrap:wrap}
    #${panelid} .gp-desc{font-size:12px;opacity:.65;margin-top:2px}
    #${panelid} .gp-sw{position:relative;display:inline-block;width:40px;height:22px;flex:0 0 40px}
    #${panelid} .gp-sw input{opacity:0;width:0;height:0;position:absolute}
    #${panelid} .gp-sw span{position:absolute;inset:0;border-radius:22px;background:color-mix(in srgb,currentColor 25%,transparent);transition:background .15s;cursor:pointer}
    #${panelid} .gp-sw span::before{content:"";position:absolute;width:16px;height:16px;left:3px;top:3px;border-radius:50%;background:var(--gip-sw-knob,#fff);transition:transform .15s}
    #${panelid} .gp-sw input:checked + span{background:var(--accent,var(--gip-inv-bg,#6b8afd))}
    #${panelid} .gp-sw input:checked + span::before{transform:translateX(18px)}
    #${panelid} .gp-sw input:focus-visible + span{outline:2px solid currentColor;outline-offset:2px}
    #${panelid} .gp-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}
    #${panelid} .gp-chip{padding:4px 9px;border-radius:7px;font-size:12px;cursor:pointer;border:1px solid color-mix(in srgb,currentColor 25%,transparent);opacity:.6;background:none;color:inherit}
    #${panelid} .gp-chip.on{opacity:1;border-color:currentColor}
    #${panelid} .gp-line{display:flex;gap:8px;align-items:center;margin:6px 0}
    #${panelid} .gp-line .input{flex:1}
    #${panelid} .gp-links{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 16px;font-size:13px}
    #${panelid} .gp-ver{font-size:12px;opacity:.6}
    #${panelid} .gp-credit{padding:12px 14px;border-radius:10px;border:1px solid color-mix(in srgb,currentColor 20%,transparent);margin:0 0 18px}
    #${panelid} .gp-credit b{font-size:14px}

    #${panelid} .gp-trow{display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid color-mix(in srgb,currentColor 10%,transparent)}
    #${panelid} .gp-trow:last-child{border-bottom:0}
    #${panelid} .gp-trow .gp-main{flex:1;min-width:0}
    #${panelid} .gp-thumb{cursor:pointer}
    #${panelid} .gp-x{background:none;border:1px solid color-mix(in srgb,currentColor 25%,transparent);color:inherit;border-radius:6px;padding:2px 8px;cursor:pointer;opacity:.7;font:inherit;font-size:12px}
    #${panelid} .gp-x:hover{opacity:1}
    #${panelid} input.gp-hue{-webkit-appearance:none;appearance:none;height:12px;border-radius:99px;border:0 !important;padding:0;flex:1;background:linear-gradient(90deg,hsl(0 90% 55%),hsl(60 90% 52%),hsl(120 80% 48%),hsl(180 85% 48%),hsl(240 90% 62%),hsl(300 85% 58%),hsl(360 90% 55%)) !important;box-shadow:inset 0 1px 3px rgba(0,0,0,.35) !important}
    #${panelid} input.gp-hue::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid #222;box-shadow:0 1px 5px rgba(0,0,0,.5)}
    #${panelid} input.gp-hue:disabled{opacity:.35}
    #${panelid} textarea.gp-code{width:100%;font-family:monospace;font-size:12px;resize:vertical;min-height:90px}
    #${panelid} .gp-status{font-size:12px;opacity:.8;margin-top:4px;min-height:16px}
    #${panelid} .gp-mark{background:rgba(255,214,64,.4);color:inherit;border-radius:2px}
    #${panelid} .gp-res{padding:8px 0;border-bottom:1px solid color-mix(in srgb,currentColor 10%,transparent)}
    #${panelid} .gp-res .gp-meta{font-size:11px;opacity:.6}
    #${panelid} .gp-warn{font-size:12px;padding:8px 10px;border-radius:8px;border:1px solid color-mix(in srgb,currentColor 25%,transparent);margin:0 0 12px}
    #${panelid} a{text-decoration:underline}

    /* ---- readable layout (v2.2): sidebar + content ---- */
    #${panelid}{max-width:1000px;padding:24px 32px 40px;font-size:14px}
    #${panelid} h1{font-size:24px}
    #${panelid} .gp-layout{display:grid;grid-template-columns:176px minmax(0,1fr);gap:30px;align-items:start}
    #${panelid} .gp-side{position:sticky;top:0;display:flex;flex-direction:column;gap:2px}
    #${panelid} .gp-side h4{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.55;margin:16px 10px 4px}
    #${panelid} .gp-side h4:first-child{margin-top:0}
    #${panelid} .gp-side .gp-tab{display:block;width:100%;text-align:left;border:0;border-radius:8px;padding:9px 10px;margin:0;opacity:.8;font-weight:500;font-size:14px}
    #${panelid} .gp-side .gp-tab:hover{opacity:1;background:color-mix(in srgb,currentColor 8%,transparent)}
    #${panelid} .gp-side .gp-tab.on{opacity:1;font-weight:700;background:color-mix(in srgb,currentColor 15%,transparent)}
    #${panelid} .gp-content{min-width:0}
    #${panelid} .gp-head{margin:0 0 20px}
    #${panelid} .gp-head h2{margin:0 0 4px;font-size:21px}
    #${panelid} .gp-head p{margin:0;font-size:14px;opacity:.75}
    #${panelid} .gp-group{margin:0 0 30px}
    #${panelid} .gp-group h3{font-size:15px;font-weight:700;text-transform:none;letter-spacing:0;opacity:1;margin:0 0 4px}
    #${panelid} .gp-group .gp-note{font-size:13px;opacity:.72;margin:0 0 8px}
    #${panelid} .gp-row{padding:12px 0}
    #${panelid} .gp-row.gp-click{cursor:pointer}
    #${panelid} .gp-name{font-size:14px}
    #${panelid} .gp-desc{font-size:13px;opacity:.75;line-height:1.4;margin-top:3px}
    #${panelid} .gp-sub-row{margin-left:16px;padding-left:14px;border-left:2px solid color-mix(in srgb,currentColor 18%,transparent)}
    #${panelid} .gp-dim{opacity:.45}
    #${panelid} .gp-count{font-size:13px;opacity:.75;margin:8px 2px 18px}
    #${panelid} .gp-chip{opacity:.75;font-size:13px;padding:5px 10px}
    #${panelid} .gp-chip.on{opacity:1}
    #${panelid} .gp-links{font-size:13px;margin:0 0 20px}
    @media (max-width:720px){
      #${panelid}{padding:18px 16px 32px}
      #${panelid} .gp-layout{grid-template-columns:1fr;gap:16px}
      #${panelid} .gp-side{position:static;flex-direction:row;flex-wrap:wrap;gap:4px}
      #${panelid} .gp-side h4{display:none}
      #${panelid} .gp-side .gp-tab{width:auto}
    }
  `;
  document.head.appendChild(style);

  const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/><path d="M4 4l3 3M20 4l-3 3M4 20l3-3M20 20l-3-3"/></svg>';
  const el = (tag, props, ...kids) => {
    const n = document.createElement(tag);
    if (props) Object.keys(props).forEach(k => { if (k === 'class') n.className = props[k]; else if (k === 'text') n.textContent = props[k]; else if (k.startsWith('on')) n.addEventListener(k.slice(2), props[k]); else n.setAttribute(k, props[k]); });
    kids.forEach(k => k != null && n.append(k));
    return n;
  };
  const sw = (checked, onchange) => { const i = el('input', { type: 'checkbox' }); i.checked = checked; i.addEventListener('change', () => onchange(i.checked)); return el('label', { class: 'gp-sw' }, i, el('span')); };
  const group = (title, origin, note) => {
    const g = el('div', { class: 'gp-group' }, el('h3', null, title, origin ? Y.tag(origin) : null));
    if (note) g.appendChild(el('div', { class: 'gp-note', text: note }));
    return g;
  };

  Y.ui = { el, sw, group };

  // Which section each feature is listed under. Anything not listed goes under "Other".
  const CATS = [['chat', 'Chat and messages'], ['voice', 'Voice'], ['nav', 'Servers and navigation'], ['look', 'Look and feel'], ['acct', 'Accounts and privacy'], ['fun', 'Fun'], ['other', 'Other']];
  const CAT_OF = {
    giptextcursor: 'chat', doubleclickreply: 'chat', charactercounter: 'chat', draftsaved: 'chat', notyping: 'chat', gipgifs: 'chat', imagesearch: 'chat', filenamedisguiser: 'chat', gipsearch: 'chat',
    gipvolume: 'voice', giphifimic: 'voice', customvoice: 'voice', gipvoice: 'voice', gipsounds: 'voice',
    gipnav: 'nav', gipreadall: 'nav', gipfolders: 'nav',
    gipfx: 'look', gipbrand: 'look', custombackground: 'look',
    gipalts: 'acct', gipcounter: 'acct',
    oneko: 'fun',
  };
  function tabPlugins() {
    const root = el('div');
    const search = el('input', { class: 'input', placeholder: 'Search features\u2026', style: 'width:100%', 'aria-label': 'Search features' });
    const count = el('div', { class: 'gp-count' }); const list = el('div');
    root.append(search, count, list);
    const draw = () => {
      const q = search.value.trim().toLowerCase(); list.innerHTML = '';
      const all = Y.PluginHost.all(); const on = all.filter(p => Y.PluginHost.isEnabled(p)).length;
      count.textContent = on + ' of ' + all.length + ' features on. Click a feature or its switch to turn it on or off.';
      let shown = 0;
      CATS.forEach(([cid, title]) => {
        const ps = all.filter(p => (CAT_OF[p.id] || 'other') === cid && (!q || (p.name + ' ' + (p.description || '')).toLowerCase().includes(q)));
        if (!ps.length) return; shown += ps.length;
        const g = group(title, null); list.appendChild(g);
        ps.forEach(p => {
          const enabled = Y.PluginHost.isEnabled(p); const swl = sw(enabled, (v) => { Y.PluginHost.setEnabled(p, v); draw(); });
          const row = el('div', { class: 'gp-row gp-click' }, el('div', null, el('div', { class: 'gp-name' }, p.name, Y.tag(p.origin)), el('div', { class: 'gp-desc', text: p.description || '' })), swl);
          row.addEventListener('click', (e) => { if (e.target.closest('.gp-sw')) return; swl.querySelector('input').click(); });
          g.appendChild(row);
          (p.options || []).forEach(o => { const r = optionRow(p, o); r.classList.add('gp-sub-row'); if (!enabled) r.classList.add('gp-dim'); g.appendChild(r); });
        });
      });
      if (!shown) list.appendChild(el('div', { class: 'gp-desc', text: 'No features match \u201c' + search.value + '\u201d.' }));
    };
    search.addEventListener('input', draw); draw();
    return root;
  }

  function optionRow(p, o) {
    const cur = Y.opt(p.id, o.key, o.dflt); let ctl;
    if (o.type === 'toggle') ctl = sw(cur, (v) => Y.setOpt(p.id, o.key, v));
    else if (o.type === 'select') {
      ctl = el('select', { class: 'input', style: 'width:auto' });
      o.choices.forEach(([v, l]) => { const op = el('option', { value: v, text: l }); if (v === cur) op.selected = true; ctl.appendChild(op); });
      ctl.addEventListener('change', () => Y.setOpt(p.id, o.key, ctl.value));
    }
    return el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, o.label, Y.tag(p.origin)), o.desc ? el('div', { class: 'gp-desc', text: o.desc }) : null), ctl);
  }
  function tabSettings() {
    const root = el('div'); const parts = {};
    const gs = group('Good to know', 'gip', 'Per-feature options now live under each feature in the Features tab.');
    gs.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, 'Right-click a folder', Y.tag('gip')), el('div', { class: 'gp-desc', text: 'Set a custom folder icon or hide server icons for just that folder.' }))));
    gs.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, 'Volume and direction', Y.tag('gip')), el('div', { class: 'gp-desc', text: 'Use the normal right-click menu on a person in voice. Volume is the built-in slider; Direction is the new one under it.' }))));
    parts.gs = gs;

    const us = group('Updates', 'yap');
    const btn = el('button', { class: 'btn', text: 'Look for updates' }); const status = el('span', { class: 'gp-ver' });
    btn.addEventListener('click', async () => {
      btn.disabled = true; status.textContent = 'Checking\u2026';
      try {
        const r = await window.electronAPI.update();
        if (r.success) {
          if (r.count > 0) { status.textContent = `Updated ${r.count} file(s). Restart to apply.`; btn.textContent = 'Restart'; btn.disabled = false; btn.onclick = () => window.electronAPI.restartApp(); return; }
          status.textContent = 'Everything is up to date.';
        } else status.textContent = r.error || 'Updates are off for this edition.';
      } catch (e) { status.textContent = 'Could not reach the updater.'; }
      btn.disabled = false;
    });
    us.appendChild(el('div', { class: 'gp-line' }, btn, status));
    const autoRow = el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, 'Update automatically', Y.tag('gip')), el('div', { class: 'gp-desc', text: 'Checks for updates when GIP++ opens and every few hours. May restart once on launch to apply an update.' })));
    (async () => { try { autoRow.append(sw(await window.electronAPI.getAutoUpdate(), (v) => window.electronAPI.setAutoUpdate(v))); } catch (e) {} })();
    us.appendChild(autoRow); parts.us = us;

    const ae = group('Text shortcut', 'yap', 'Type the shortcut in chat and it is replaced with your text. Example: /shrug becomes a shrug emoticon.');
    const cmd = el('input', { class: 'input', placeholder: 'Shortcut, for example /shrug', autocomplete: 'off' });
    const txt = el('input', { class: 'input', placeholder: 'Replace it with\u2026', autocomplete: 'off' });
    try { cmd.value = localStorage.getItem('yapplus.autoedit.cmd') || ''; txt.value = localStorage.getItem('yapplus.autoedit.text') || ''; } catch (e) {}
    cmd.addEventListener('input', () => { try { localStorage.setItem('yapplus.autoedit.cmd', cmd.value); } catch (e) {} });
    txt.addEventListener('input', () => { try { localStorage.setItem('yapplus.autoedit.text', txt.value); } catch (e) {} });
    ae.append(el('div', { class: 'gp-line' }, cmd), el('div', { class: 'gp-line' }, txt)); parts.ae = ae;

    const rs = group('Troubleshooting', 'gip', 'If something breaks, put GIP++ back to how it was on a fresh install. This only touches data GIP++ stores on this computer. Your Yappin login and your messages are never touched.');
    const KEEP = /^(gip\.(gifs|folders|voicepresets|customThemes)|yapplus\.gipvol)/;
    const wipe = (everything) => {
      try {
        Object.keys(localStorage).forEach(k => { if (/^(yapplus\.|gip\.)/.test(k) && (everything || !KEEP.test(k))) localStorage.removeItem(k); });
        if (everything) { try { indexedDB.deleteDatabase('gip-search'); } catch (e) {} }
        document.documentElement.style.removeProperty('--gip-h');
      } catch (e) { console.error('[GIP++] reset failed', e); }
      Y.toast('GIP++ was reset. Reloading\u2026', 1500); setTimeout(() => location.reload(), 900);
    };
    const r1 = el('button', { class: 'btn', text: 'Reset GIP++ settings\u2026' });
    r1.addEventListener('click', () => Y.confirm('Reset GIP++ settings?', 'Plugin switches, theme, accent, sounds and other options go back to defaults. Your GIF favorites, folder icons, voice settings and imported themes are kept. The app reloads.', 'Reset', () => wipe(false)));
    const r2 = el('button', { class: 'btn', text: 'Erase all GIP++ data\u2026' });
    r2.addEventListener('click', () => Y.confirm('Erase all GIP++ data?', 'This also deletes your GIF favorites, folder icons, voice volume and direction settings, imported themes and the message search index. It cannot be undone. The app reloads.', 'Erase everything', () => wipe(true)));
    rs.append(el('div', { class: 'gp-line' }, r1, r2)); parts.rs = rs;

    const alltypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'text/plain'];
    const fd = group('Anonymised filenames', 'yap', 'Pick which kinds of files get a random name when you upload them.');
    const chips = el('div', { class: 'gp-chips' });
    const custom = el('input', { class: 'input', placeholder: 'example: image/bmp', autocomplete: 'off' });
    const add = el('button', { class: 'btn', text: 'Add type' });
    const types = () => window.filenamedisguiser ? window.filenamedisguiser.getEnabledTypes() : [];
    const setTypes = (a) => { if (window.filenamedisguiser) window.filenamedisguiser.setEnabledTypes(a); };
    const drawChips = () => {
      chips.innerHTML = ''; const on = types();
      alltypes.concat(on.filter(t => !alltypes.includes(t))).forEach(t => {
        const c = el('button', { class: 'gp-chip' + (on.includes(t) ? ' on' : ''), text: t });
        c.addEventListener('click', () => { const cur = types(); setTypes(cur.includes(t) ? cur.filter(x => x !== t) : cur.concat([t])); drawChips(); });
        chips.appendChild(c);
      });
    };
    add.addEventListener('click', () => { const v = custom.value.trim().toLowerCase(); if (!v || !v.includes('/')) return; const cur = types(); if (!cur.includes(v)) setTypes(cur.concat([v])); custom.value = ''; drawChips(); });
    drawChips(); fd.append(chips, el('div', { class: 'gp-line' }, custom, add)); parts.fd = fd;

    const cb = group('Custom background', 'yap', 'Paste a direct link to an image and choose how strong it is.');
    const url = el('input', { class: 'input', placeholder: 'https://example.com/image.png', autocomplete: 'off' });
    const op = el('input', { type: 'range', min: 0, max: 100, step: 1, style: 'flex:1' });
    const opv = el('span', { class: 'gp-ver', text: '50%' });
    const css = el('textarea', { class: 'input', rows: 7, placeholder: '.msg-author { color: hotpink !important; }', style: 'width:100%;font-family:monospace;resize:vertical' });
    if (window.custombackground) {
      const c = window.custombackground;
      url.value = c.getUrl(); op.value = String(Math.round(c.getOpacity() * 100)); opv.textContent = op.value + '%'; css.value = c.getThemeCss();
      url.addEventListener('input', () => c.setUrl(url.value));
      op.addEventListener('input', () => { c.setOpacity(parseInt(op.value, 10) / 100); opv.textContent = op.value + '%'; });
      css.addEventListener('input', () => c.setThemeCss(css.value));
    }
    cb.append(el('div', { class: 'gp-line' }, url), el('div', { class: 'gp-line' }, el('span', { class: 'gp-ver', text: 'Opacity' }), op, opv), el('div', { class: 'gp-note', text: 'Custom CSS' }), css);
    parts.cb = cb;
    ['us', 'ae', 'fd', 'cb', 'gs', 'rs'].forEach(k => root.appendChild(parts[k]));
    return root;
  }


  function tabAccounts() {
    const root = el('div');
    const g = group('Accounts', 'gip', 'Each account is its own window with its own login, so you can have several open at once. The colour frame and name tag tell them apart. Each account also keeps its own theme and plugin settings.');
    const list = el('div'); g.appendChild(list);
    const msg = el('div', { class: 'gp-ver' });
    const api = window.electronAPI;
    const draw = async () => {
      list.innerHTML = '';
      let profiles = []; let me = null;
      try { profiles = await api.altsList(); me = await api.altsSelf(); } catch (e) { list.textContent = 'Account manager is not available.'; return; }
      profiles.forEach(p => {
        const color = el('input', { type: 'color', value: p.color || '#808080', title: 'Colour', style: 'width:34px;height:26px;padding:0;border:0;background:none;cursor:pointer' });
        color.addEventListener('change', async () => { await api.altsSave({ id: p.id, name: p.name, color: color.value }); draw(); });
        const nm = el('div', null, el('div', { class: 'gp-name' }, p.name, me && me.id === p.id ? el('span', { class: 'gp-ver', style: 'margin-left:8px', text: 'this window' }) : null, p.id === 'default' ? el('span', { class: 'gp-ver', style: 'margin-left:8px', text: 'main' }) : null));
        const btns = el('div', { class: 'gp-line', style: 'margin:0' });
        if (!(me && me.id === p.id)) btns.append(el('button', { class: 'btn', text: p.open ? 'Show' : 'Open', onclick: () => api.altsOpen(p.id) }));
        btns.append(el('button', { class: 'btn', text: 'Rename', onclick: () => Y.prompt('Account name', p.name, async (v) => { await api.altsSave({ id: p.id, name: v, color: p.color }); draw(); }) }));
        if (p.id !== 'default') btns.append(el('button', { class: 'btn', text: 'Remove', onclick: () => Y.confirm('Remove ' + p.name + '?', 'This signs that account out and deletes its saved data in GIP++ (settings, theme, login). The account itself is not touched.', 'Remove', async () => { const r = await api.altsDelete(p.id); if (!r.success) msg.textContent = r.error || 'Could not remove'; draw(); }) }));
        list.appendChild(el('div', { class: 'gp-row' }, el('div', { style: 'display:flex;align-items:center;gap:12px' }, color, nm), btns));
      });
    };
    const name = el('input', { class: 'input', placeholder: 'New account name (example: Alt 1)', maxlength: 32, autocomplete: 'off' });
    const col = el('input', { type: 'color', value: '#6b8afd', style: 'width:34px;height:30px;padding:0;border:0;background:none;cursor:pointer' });
    const add = el('button', { class: 'btn', text: 'Add account' });
    add.addEventListener('click', async () => {
      const n = name.value.trim(); if (!n) { msg.textContent = 'Give it a name first.'; return; }
      const r = await api.altsNew(n, col.value);
      if (!r.success) { msg.textContent = r.error || 'Could not add'; return; }
      name.value = ''; msg.textContent = 'Added. Click Open to sign in to it.'; draw();
    });
    g.append(el('div', { class: 'gp-line' }, name, col, add), msg);
    root.appendChild(g); draw();
    return root;
  }

  const THUMB_BASE = `
    :host{display:block;width:128px;height:74px;flex:0 0 128px;overflow:hidden;border-radius:6px;contain:layout paint;position:relative;border:1px solid rgba(128,128,128,.45)}
    .mockwrap{width:720px;height:416px;transform:scale(.1778);transform-origin:0 0;position:absolute;left:0;top:0}
    .app{width:720px;height:416px;position:relative;display:flex;gap:8px;padding:8px;box-sizing:border-box;font:14px system-ui,sans-serif;overflow:hidden}
    .rail{width:52px;display:flex;flex-direction:column;gap:8px;padding:8px 0;align-items:center;box-sizing:border-box}
    .rail-item{width:34px;height:34px;border-radius:10px;border:0;background:#8aa;opacity:.85;padding:0}
    .sidebar{width:150px;display:flex;flex-direction:column;padding:10px 0;position:relative;box-sizing:border-box}
    .channel-item{padding:6px 10px;margin:1px 6px}
    .user-bar{margin:auto 6px 0;padding:8px}
    .main{flex:1;display:flex;flex-direction:column;min-width:0}
    .main-head{padding:10px 14px;font-weight:700}
    .messages{flex:1;padding:10px 14px;display:flex;flex-direction:column;gap:10px}
    .msg{padding:6px 8px}
    .composer-box{margin:8px 14px 12px;padding:8px}
    .composer-box textarea{width:100%;border:0;resize:none;outline:0;font:inherit;display:block}
    .side-panel{width:110px;padding:10px;box-sizing:border-box}
  `;
  const THUMB_HTML = '<div class="app"><nav class="rail"><button class="rail-item"></button><button class="rail-item"></button><button class="rail-item"></button></nav><aside class="sidebar"><div class="channel-item active"><span class="channel-name"># general</span></div><div class="channel-item"><span class="channel-name"># memes</span></div><div class="channel-item"><span class="channel-name"># dev</span></div><div class="user-bar"><span class="user-bar-name">You</span></div></aside><main class="main"><div class="main-head"><span class="channel-name"># general</span></div><div class="messages"><div class="msg"><b class="msg-author">Mika</b><div class="msg-text">Hello there</div></div><div class="msg mentioned"><b class="msg-author">Rook</b><div class="msg-text">Nice theme</div></div></div><div class="composer-box"><textarea rows="1" placeholder="Message"></textarea></div></main><aside class="side-panel"><div class="msg-text">Online</div></aside></div>';
  // A miniature of the app inside a shadow root, with the theme's CSS applied to it (:root becomes :host). Contained, so it cannot touch the real page.
  function themeThumb(css) {
    const host = el('div', { class: 'gp-thumb', 'aria-hidden': 'true' });
    try {
      const sh = host.attachShadow({ mode: 'open' });
      const st = document.createElement('style');
      st.textContent = THUMB_BASE + String(css || '').replace(/:root/g, ':host') + '\n.app::after{bottom:-96px !important;height:140px !important}';
      const wrap = document.createElement('div'); wrap.className = 'mockwrap'; wrap.innerHTML = THUMB_HTML;
      sh.append(st, wrap);
    } catch (e) { host.style.background = '#888'; }
    return host;
  }

  function tabThemes() {
    const root = el('div');
    let available = {}; const customs = () => { try { return Y.customThemes.all(); } catch (e) { return {}; } };
    let themeEl = document.getElementById('yapplus-active-theme');
    if (!themeEl) { themeEl = document.createElement('style'); themeEl.id = 'yapplus-active-theme'; document.head.appendChild(themeEl); }
    const activeName = () => localStorage.getItem('yapplus.activeTheme') || '';
    const activeCss = () => available[activeName()] || '';

    // accent
    const accG = group('Accent colour', 'gip', 'Recolours every theme that has an accent colour (most of the GIP++ ones: Aero, Eco, Web 2.0, Catppuccin, Nord, Sakura, Aqua, Synthwave and more). Themes with a fixed look, like GIP & CO, CRT and Game Boy, ignore it.');
    const hue = el('input', { type: 'range', min: 0, max: 360, step: 1, class: 'gp-hue', 'aria-label': 'Accent colour' });
    const hueLbl = el('span', { class: 'gp-ver', style: 'min-width:70px;text-align:right' });
    const hueReset = el('button', { class: 'btn', text: 'Default' });
    const hueNote = el('div', { class: 'gp-status' });
    const saved = localStorage.getItem('gip.accentHue');
    hue.value = saved === null ? 205 : saved;
    const refreshAccent = () => {
      const uses = /--gip-h/.test(activeCss());
      hue.disabled = !uses; hueReset.disabled = !uses;
      const v = localStorage.getItem('gip.accentHue');
      hueLbl.textContent = !uses ? 'n/a' : (v === null ? 'Theme default' : 'Hue ' + v);
      hueNote.textContent = !activeName() ? 'Pick a theme below first.' : (uses ? '' : 'The current theme has no accent colour to change.');
    };
    hue.addEventListener('input', () => { try { localStorage.setItem('gip.accentHue', hue.value); } catch (e) {} Y.applyAccent(); refreshAccent(); });
    hueReset.addEventListener('click', () => { try { localStorage.removeItem('gip.accentHue'); } catch (e) {} Y.applyAccent(); refreshAccent(); });
    accG.append(el('div', { class: 'gp-line' }, hue, hueLbl, hueReset), hueNote);

    // theme list
    const search = el('input', { class: 'input', placeholder: 'Search themes\u2026', style: 'width:100%;margin:6px 0 8px' });
    let modeFilter = 'all';
    const modeChips = el('div', { class: 'gp-chips', style: 'margin:0 0 14px' });
    [['all', 'All'], ['dark', 'Dark'], ['light', 'Light']].forEach(([v, label]) => {
      const c = el('button', { class: 'gp-chip' + (v === 'all' ? ' on' : ''), text: label });
      c.addEventListener('click', () => { modeFilter = v; modeChips.querySelectorAll('.gp-chip').forEach(x => x.classList.toggle('on', x === c)); draw(search.value); });
      modeChips.appendChild(c);
    });
    const gipG = group('GIP++ themes', 'gip'), yapG = group('Themes from Yap++', 'yap');
    const gipL = el('div'), yapL = el('div'); gipG.appendChild(gipL); yapG.appendChild(yapL);

    // import / export
    const ioG = group('Import and export', 'gip', 'Share a theme as a code or a .css file, or add one without touching the themes folder. Only import themes from people you trust.');
    const status = el('div', { class: 'gp-status' });
    const say = (t) => { status.textContent = t; };
    const copyBtn = el('button', { class: 'btn', text: 'Copy share code' });
    const fileBtn = el('button', { class: 'btn', text: 'Save .css file' });
    const need = () => { if (!activeName() || !activeCss()) { say('Pick a theme first.'); return false; } return true; };
    copyBtn.addEventListener('click', async () => {
      if (!need()) return;
      const shareCode = Y.customThemes.encode(activeName().replace(/\.css$/, ''), activeCss());
      try { await navigator.clipboard.writeText(shareCode); say('Share code copied. Anyone can paste it below to add the theme.'); }
      catch (e) { codeBox.value = shareCode; codeBox.select(); say('Could not use the clipboard. The share code is in the box below: select it and copy it.'); }
    });
    fileBtn.addEventListener('click', () => {
      if (!need()) return;
      try {
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([activeCss()], { type: 'text/css' }));
        a.download = activeName(); document.body.appendChild(a); a.click(); a.remove(); say('Saved ' + activeName() + ' (check your Downloads folder).');
      } catch (e) { say('Could not save a file here. Use Copy share code instead.'); }
    });
    const codeBox = el('textarea', { class: 'input gp-code', placeholder: 'Paste a share code (GIPTHEME1:\u2026) or raw CSS here', spellcheck: 'false' });
    const nm = el('input', { class: 'input', placeholder: 'Theme name (for raw CSS)', maxlength: 40 });
    const addBtn = el('button', { class: 'btn primary', text: 'Add theme' });
    addBtn.addEventListener('click', () => {
      const text = codeBox.value.trim(); if (!text) { say('Paste a share code or CSS first.'); return; }
      let name = nm.value.trim(), css = '';
      const dec = Y.customThemes.decode(text);
      if (dec) { css = dec.css; name = name || dec.name; }
      else if (/^GIPTHEME/i.test(text)) { say('That share code is not valid.'); return; }
      else { css = Y.sanitizeCss(text); if (!name) { say('Give the theme a name.'); return; } }
      if (!css.trim()) { say('That theme is empty.'); return; }
      let file; try { file = Y.customThemes.add(name, css); } catch (e) { say('Could not save the theme (storage full?).'); return; }
      available[file] = Y.customThemes.all()[file]; codeBox.value = ''; nm.value = '';
      say('Added \u201c' + name + '\u201d. Switch it on in the list above.'); draw(search.value);
    });
    ioG.append(el('div', { class: 'gp-line' }, copyBtn, fileBtn), codeBox, el('div', { class: 'gp-line' }, nm, addBtn), status);

    root.append(accG, search, modeChips, gipG, yapG, ioG);

    const apply = (f) => {
      if (!f) { localStorage.removeItem('yapplus.activeTheme'); themeEl.textContent = ''; }
      else { localStorage.setItem('yapplus.activeTheme', f); themeEl.textContent = available[f] || ''; }
      try { Y.syncMode(themeEl.textContent); } catch (e) {}
      refreshAccent(); draw(search.value);
    };
    const draw = (q) => {
      gipL.innerHTML = ''; yapL.innerHTML = '';
      const active = activeName(); const f = (q || '').toLowerCase(); const cu = customs();
      Object.keys(available).sort().forEach(file => {
        if (!file.endsWith('.css')) return;
        const name = file.replace(/\.css$/, '').replace(/^gip-custom-/, ''); if (f && !name.toLowerCase().includes(f)) return;
        if (modeFilter !== 'all') { const m = /color-scheme\s*:\s*(light|dark)/i.exec(available[file] || ''); if (!m || m[1].toLowerCase() !== modeFilter) return; }
        const isCustom = Object.prototype.hasOwnProperty.call(cu, file);
        const origin = Y.themeOrigin(file);
        const th = themeThumb(available[file]); th.addEventListener('click', () => apply(active === file ? null : file));
        const nameEl = el('div', { class: 'gp-name', style: 'text-transform:capitalize' }, name.replace(/-/g, ' '), Y.tag(origin));
        if (isCustom) nameEl.appendChild(el('span', { class: 'gp-ver', style: 'margin-left:8px', text: 'custom' }));
        const row = el('div', { class: 'gp-trow' }, th, el('div', { class: 'gp-main' }, nameEl), isCustom ? el('button', { class: 'gp-x', text: 'Delete', onclick: () => {
          if (activeName() === file) apply(null); Y.customThemes.remove(file); delete available[file]; draw(search.value);
        } }) : null, sw(active === file, (on) => apply(on ? file : null)));
        (origin === 'gip' ? gipL : yapL).appendChild(row);
      });
      [gipL, yapL].forEach(l => { if (!l.children.length) l.appendChild(el('div', { class: 'gp-desc', text: 'None.' })); });
    };
    (async () => { try { available = await window.electronAPI.getThemes(); } catch (e) {} available = Object.assign({}, available, customs()); refreshAccent(); draw(''); })();
    search.addEventListener('input', () => draw(search.value));
    return root;
  }

  function tabAbout() {
    const root = el('div');
    const logo = el('img', { alt: 'GIP & CO', style: 'display:block;max-width:420px;width:100%;margin:0 0 18px;border-radius:8px' });
    (async () => { try { const d = await window.electronAPI.getAsset('GipBanner.png'); if (d) logo.src = d; else logo.remove(); } catch (e) { logo.remove(); } })();
    root.appendChild(logo);
    const credit = el('div', { class: 'gp-credit' }, el('b', { text: 'Built on Yap++' }), Y.tag('yap'),
      el('div', { class: 'gp-desc', text: 'GIP++ is a fork of Yap++ by salami (Ng, Liann), used under the Apache License 2.0. Thank you to salami and to Lemon for Yap++.' }));
    const a = group('GIP++', 'gip');
    a.append(el('div', { class: 'gp-desc', text: 'GIP & CO International. Illuc profectus sum. Illud feci.' }),
      el('div', { class: 'gp-desc', text: 'GIP++ is an unofficial client mod. It is not affiliated with Yapper Media LLC.' }));
    const dl = group('Disclaimers', 'gip');
    ['GIP++ is an unofficial client mod. It is not affiliated with, endorsed by or supported by Yapper Media LLC.',
     'Using a modified client may go against the platform\u2019s terms, and site updates can break features at any time. Use it at your own risk.',
     'Your favorites, folder icons, volume and direction settings are stored only on this computer. GIP++ does not upload them.',
     'User Counter (Plugins tab, on by default): sends a random install ID made on this computer so GIP++ can show how many people use it. It contains no name, account, login or settings. Switch the plugin off to stop it.',
     'Direction audio works best with headphones. Hi-Fi Mic and some other features are experimental.',
     'The software is provided \u201cas is\u201d, without warranty of any kind (Apache License 2.0).'
    ].forEach(t => dl.appendChild(el('div', { class: 'gp-desc', style: 'margin:4px 0', text: t })));
    const cm = group('Community', 'gip');
    const lk2 = (t, u) => { const a = el('a', { href: u, text: t, target: '_blank' }); a.addEventListener('click', (e) => { e.preventDefault(); try { window.electronAPI.openExternal(u); } catch (er) { window.open(u, '_blank'); } }); return a; };
    cm.append(el('div', { class: 'gp-desc' }, 'Server: ', lk2('yapin.gg/invite/gip', Y.LINKS.server)),
      el('div', { class: 'gp-desc' }, 'Report a bug: ', lk2('github.com/le-nt/GIPPLUSPLUS/issues', Y.LINKS.bugs)),
      el('div', { class: 'gp-desc' }, 'Source: ', lk2('github.com/le-nt/GIPPLUSPLUS', Y.LINKS.repo)));
    const y = group('Yap++', 'yap');
    y.append(el('div', { class: 'gp-desc' }, 'YouTube: ', el('a', { href: 'https://www.youtube.com/@sedesuu', target: '_blank', text: '@sedesuu' })),
      el('div', { class: 'gp-desc' }, 'Discord: ', el('a', { href: 'https://discord.com/users/1384802116106719384', target: '_blank', text: '.salamidev' })),
      el('div', { class: 'gp-desc', text: 'Neither Yap++ nor GIP++ saves, distributes or misuses your login tokens or login information.' }));
    root.append(credit, a, dl, cm, y);
    return root;
  }

  const BASE_TABS = [['plugins', 'Features', tabPlugins], ['settings', 'Settings', tabSettings], ['accounts', 'Accounts', tabAccounts], ['themes', 'Themes', tabThemes]];
  // Sounds, Voice and Search register themselves through YapPlus.registerTab; About always comes last.
  const allTabs = () => BASE_TABS.concat((Y.extraTabs || []).map(t => [t.id, t.label, () => t.build(Y.ui)]), [['about', 'About', tabAbout]]);
  let currentTab = 'plugins', currentMode = false;

  // Sidebar sections. Tabs that register themselves later and are not listed here land under "More".
  const SIDE = [['Features', ['plugins']], ['Appearance', ['themes', 'sounds']], ['Chat and voice', ['voice', 'search']], ['App', ['accounts', 'settings']], ['', ['about']]];
  const INFO = {
    plugins: ['Features', 'Switch features on or off. Changes apply straight away.'],
    themes: ['Themes', 'Choose how the app looks. Click a preview to switch it on.'],
    sounds: ['Sounds', 'Pick a sound pack and when it plays.'],
    voice: ['Voice', 'Saved volume and direction for people, and presets.'],
    search: ['Message search', 'Search the messages you have seen while this is on.'],
    accounts: ['Accounts', 'Use several accounts at once, each in its own window.'],
    settings: ['Settings', 'Updates, shortcuts, uploads, background and reset.'],
    about: ['About', 'Version, credits and links.'],
  };
  function buildpanel() {
    const p = el('div', { id: panelid });
    const h = el('h1', null, 'GIP++ (Unofficial)', el('span', { class: 'gp-ver', text: 'v' + Y.VERSION }));
    const sub = el('div', { class: 'gp-sub', text: 'Unofficial client mod, not affiliated with Yapper Media LLC. Based on Yap++.' });
    const side = el('nav', { class: 'gp-side', 'aria-label': 'GIP++ sections' }); const head = el('div', { class: 'gp-head' }); const body = el('div');
    const content = el('div', { class: 'gp-content' }, head, body);
    const tabsNow = allTabs();
    const show = (id) => {
      currentTab = id;
      side.querySelectorAll('.gp-tab').forEach(b => b.classList.toggle('on', b.dataset.id === id));
      body.innerHTML = ''; head.innerHTML = '';
      const t = allTabs().find(x => x[0] === id) || allTabs()[0];
      const info = INFO[t[0]]; if (info) head.append(el('h2', { text: info[0] }), el('p', { text: info[1] }));
      try { body.appendChild(t[2]()); } catch (e) { console.error('[GIP++] tab failed', id, e); body.textContent = 'This tab failed to load. See the console.'; }
    };
    const placed = new Set();
    const addGroup = (title, ids) => {
      const tabs = ids.map(id => tabsNow.find(t => t[0] === id)).filter(Boolean); if (!tabs.length) return;
      if (title) side.appendChild(el('h4', { text: title }));
      tabs.forEach(([id, label]) => { placed.add(id); const b = el('button', { class: 'gp-tab', 'data-id': id, text: label }); b.addEventListener('click', () => show(id)); side.appendChild(b); });
    };
    SIDE.filter(g => g[0] !== '').forEach(g => addGroup(g[0], g[1]));
    addGroup('More', tabsNow.filter(t => !placed.has(t[0]) && t[0] !== 'about').map(t => t[0]));
    addGroup('', ['about']);
    const links = el('div', { class: 'gp-links' });
    const lk = (t, u) => { const a = el('a', { href: u, text: t, target: '_blank' }); a.addEventListener('click', (e) => { e.preventDefault(); try { window.electronAPI.openExternal(u); } catch (er) { window.open(u, '_blank'); } }); return a; };
    links.append(lk('Join the GIP & CO server', Y.LINKS.server), lk('Report a bug', Y.LINKS.bugs), lk('GitHub', Y.LINKS.repo));
    const cnt = el('div', { class: 'gp-sub', style: 'margin:-10px 0 14px' });
    if (window.gipcounter) window.gipcounter.describe().then((t) => { if (t) cnt.textContent = t; else cnt.remove(); }); else cnt.remove();
    p.append(h, sub, cnt, links, el('div', { class: 'gp-layout' }, side, content)); show(currentTab);
    return p;
  }
  function safebuild(main) {
    try { main.appendChild(buildpanel()); }
    catch (err) { console.error('[GIP++] menu failed', err); main.appendChild(el('div', { style: 'padding:28px 40px', text: 'The GIP++ menu failed to load. See the console.' })); }
  }
  function inject() {
    if (document.getElementById(navid)) return;
    const nav = document.querySelector('.settings-nav'); const main = document.querySelector('.settings-main');
    if (!nav || !main) return;
    currentMode = false; // settings was just opened: Yappin shows its own page first
    const btn = el('button', { id: navid });
    btn.innerHTML = `${ICON}<span>GIP++</span>`;
    // Leaving GIP++ for one of Yappin's own settings pages: remove our panel before Yappin draws its page,
    // otherwise Yappin adds its page underneath ours.
    const leave = () => {
      currentMode = false; btn.classList.remove('active');
      const pnl = document.getElementById(panelid); if (pnl) pnl.remove();
    };
    new MutationObserver(() => {
      const pnl = document.getElementById(panelid);
      if (currentMode) { if (!pnl && main.innerHTML === '') safebuild(main); }
      else if (pnl) pnl.remove();
    }).observe(main, { childList: true });
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation(); currentMode = true;
      nav.querySelectorAll('button').forEach(b => b.classList.remove('active')); btn.classList.add('active');
      main.innerHTML = ''; safebuild(main);
    });
    nav.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button'); if (b && b !== btn && !btn.contains(b)) leave(); }, true);
    nav.appendChild(btn);
  }
  new MutationObserver(inject).observe(document.body, { childList: true, subtree: true });
  inject();
})();
