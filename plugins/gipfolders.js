// GIP++ Folder Sidebar + Folder Icons.
// Opening a server folder in the rail opens a sidebar listing every server inside it.
// Folders can have a custom icon (your own image), and a privacy option replaces the small server icons on a folder with a plain folder icon.
const gipfolders = {
  id: 'gipfolders',
  origin: 'gip',
  name: 'Folder Sidebar + Folder Icons',
  description: 'Opening a folder slides out a sidebar with every server inside it (the rail itself is left untouched). Right-click a folder to give it a custom icon or hide the server icons on it.',
  options: [
    { key: 'privacyAll', type: 'toggle', dflt: false, label: 'Hide server icons on all folders', desc: 'Shows a plain folder icon instead of the small server icons. You can also do this per folder (right-click a folder).' },
  ],
  store: 'gip.folders.v1',
  timer: null, obs: null, panel: null, panelFor: null, handlers: null, styleEl: null, pend: 0,

  load() { try { return Object.assign({ icons: {}, privacy: {} }, JSON.parse(localStorage.getItem(this.store)) || {}); } catch (e) { return { icons: {}, privacy: {} }; } },
  save(d) { try { localStorage.setItem(this.store, JSON.stringify(d)); } catch (e) { window.YapPlus.toast('Could not save the icon (storage full?)'); } },
  onOption() { this.sync(); },

  rail() { return document.querySelector('nav.rail'); },
  folderId(btn) { const r = btn.closest('[data-rail-row]'); return r ? r.getAttribute('data-rail-row') : ''; },
  folderTitle(btn) { return (btn.getAttribute('title') || btn.getAttribute('aria-label') || 'Folder').replace(/^Folder:\s*/i, ''); },
  membersOf(btn) {
    const id = this.folderId(btn); const rail = this.rail(); const row = btn.closest('.drag-row');
    const isServerBtn = (b) => b !== btn && !b.classList.contains('rail-folder') && !b.classList.contains('add') && !b.closest('.gip-folder-panel') && (b.getAttribute('title') || b.getAttribute('aria-label'));
    let found = [];
    if (row) found = Array.from(row.querySelectorAll('button.rail-item, a.rail-item')).filter(isServerBtn);
    if (!found.length && rail && id) {
      const rawId = id.replace(/^f:/, '');
      const pointing = Array.from(rail.querySelectorAll('*')).filter(el => el !== btn && Array.from(el.attributes).some(a => a.name !== 'data-rail-row' && a.name !== 'data-drag-id' && (a.value === id || a.value === rawId)));
      pointing.forEach(el => { const b = el.matches('button.rail-item') ? el : el.querySelector('button.rail-item'); if (b && isServerBtn(b) && !found.includes(b)) found.push(b); });
    }
    return found;
  },
  describe(b) {
    const img = b.querySelector('img'); const initials = b.querySelector('.server-initials');
    const wrap = b.closest('.rail-wrap'); const badge = wrap && wrap.querySelector('.rail-badge');
    return { btn: b, name: b.getAttribute('title') || b.getAttribute('aria-label') || 'Server', img: img ? img.src : '', initials: initials ? initials.textContent : '',
      unread: !!(wrap && wrap.classList.contains('unread')), badge: badge ? badge.textContent.trim() : '', active: b.classList.contains('active') };
  },

  css: `
    .gip-folder-panel{box-sizing:border-box;display:flex;flex-direction:column;width:232px;flex:0 0 232px;min-height:0;overflow:hidden;border-right:1px solid color-mix(in srgb,currentColor 14%,transparent)}
    .gip-folder-panel.overlay-mode{position:fixed;top:0;bottom:0;z-index:40;box-shadow:10px 0 30px rgba(0,0,0,.35);animation:gipfp-in .14s ease-out}
    @keyframes gipfp-in{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
    .gip-folder-panel .gfp-head{display:flex;align-items:center;gap:6px;padding:14px 14px 10px;font-weight:700;font-size:14px;line-height:1.2}
    .gip-folder-panel .gfp-head .gfp-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .gip-folder-panel .gfp-x{background:none;border:0;color:inherit;opacity:.65;cursor:pointer;font-size:18px;line-height:1;padding:2px 6px}
    .gip-folder-panel .gfp-x:hover{opacity:1}
    .gip-folder-panel .gfp-list{flex:1;overflow:auto;padding:2px 8px 10px;display:flex;flex-direction:column;gap:2px}
    .gip-folder-panel .channel-row{position:relative}
    .gip-folder-panel .channel-main{display:flex;align-items:center;gap:10px;width:100%;text-align:left}
    .gip-folder-panel .gfp-ico{width:30px;height:30px;flex:0 0 30px;border-radius:30%;object-fit:cover;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:color-mix(in srgb,currentColor 14%,transparent);overflow:hidden}
    .gip-folder-panel .gfp-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .gip-folder-panel .gfp-dot{width:8px;height:8px;border-radius:50%;background:currentColor;flex:0 0 8px}
    .gip-folder-panel .gfp-badge{min-width:18px;padding:1px 6px;border-radius:9px;background:#e5484d;color:#fff;font-size:11px;font-weight:700;text-align:center}
    .gip-folder-panel .gfp-empty{padding:10px 14px;font-size:12px;opacity:.75;line-height:1.5}
    .gip-folder-panel .gfp-empty button{margin-top:8px}
    .ctx-menu{z-index:2147483000 !important}
    .gip-hid{display:none !important}
    .rail-folder.gip-folder-custom,.rail-folder.gip-folder-private{position:relative;overflow:hidden}
    .rail-folder.gip-folder-custom .folder-grid,.rail-folder.gip-folder-private .folder-grid{display:none !important}
    .rail-folder .gip-folder-ico{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;pointer-events:none}
    .rail-folder .gip-folder-glyph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
    .rail-folder .gip-folder-glyph svg{width:46%;height:46%}
  `,
  glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  styleFromSite(p) {
    const side = document.querySelector('aside.sidebar') || document.querySelector('aside.side-panel') || this.rail();
    if (!side) return;
    const cs = getComputedStyle(side); const clear = (c) => !c || /rgba?\(0,\s*0,\s*0,\s*0\)|transparent/.test(c);
    let bg = cs.backgroundColor;
    if (clear(bg)) bg = getComputedStyle(this.rail()).backgroundColor;
    if (clear(bg)) bg = getComputedStyle(document.querySelector('.app') || document.body).backgroundColor;
    p.style.background = bg; p.style.color = cs.color; p.style.fontFamily = cs.fontFamily;
  },
  closePanel() { if (this.panel) { this.panel.remove(); this.panel = null; } this.panelFor = null; document.querySelectorAll('.gip-hid').forEach(n => n.classList.remove('gip-hid')); },
  openPanel(btn) {
    const rail = this.rail(); if (!rail) return;
    const id = this.folderId(btn);
    const p = document.createElement('div'); p.className = 'gip-folder-panel'; p.dataset.folder = id;
    this.styleFromSite(p);
    p.innerHTML = '<div class="gfp-head"><span class="gfp-title"></span><button class="gfp-x" aria-label="Close folder" title="Close folder">\u00d7</button></div><div class="gfp-list"></div>';
    p.querySelector('.gfp-title').append(this.folderTitle(btn), window.YapPlus.tag('gip'));
    p.querySelector('.gfp-x').addEventListener('click', () => { const b = this.expandedBtn(); if (b) b.click(); else this.closePanel(); });
    p.classList.add('overlay-mode'); p.style.left = rail.getBoundingClientRect().right + 'px'; document.body.appendChild(p);
    this.panel = p; this.panelFor = id; this.overlay = true;
  },
  expandedBtn() { return document.querySelector('nav.rail .rail-folder[aria-expanded="true"]'); },
  fillPanel(btn) {
    const p = this.panel; if (!p) return;
    const list = p.querySelector('.gfp-list');
    const members = this.membersOf(btn).map(b => this.describe(b));
    const sig = JSON.stringify(members.map(m => [m.name, m.img, m.unread, m.badge, m.active]));
    if (list.dataset.sig === sig) return;
    list.dataset.sig = sig; list.innerHTML = '';
    if (!members.length) {
      const e = document.createElement('div'); e.className = 'gfp-empty'; e.textContent = 'Could not read the servers in this folder.';
      const dbg = document.createElement('button'); dbg.className = 'btn'; dbg.textContent = 'Copy folder HTML (for GIP++ support)';
      dbg.addEventListener('click', () => { const row = btn.closest('.drag-row'); try { navigator.clipboard.writeText((row ? row.outerHTML : btn.outerHTML).slice(0, 12000)); } catch (er) {} window.YapPlus.toast('Copied'); });
      e.append(document.createElement('br'), dbg); list.appendChild(e); return;
    }
    members.forEach(m => {
      const row = document.createElement('div'); row.className = 'channel-row' + (m.active ? ' active' : '');
      const b = document.createElement('button'); b.className = 'channel-main'; b.title = m.name;
      let ico;
      if (m.img) { ico = document.createElement('img'); ico.src = m.img; ico.alt = ''; ico.draggable = false; }
      else { ico = document.createElement('span'); ico.textContent = m.initials || m.name.slice(0, 2); }
      ico.className = 'gfp-ico';
      const n = document.createElement('span'); n.className = 'gfp-name'; n.textContent = m.name;
      b.append(ico, n);
      if (m.badge) { const g = document.createElement('span'); g.className = 'gfp-badge'; g.textContent = m.badge; b.appendChild(g); }
      else if (m.unread) { const g = document.createElement('span'); g.className = 'gfp-dot'; b.appendChild(g); }
      b.addEventListener('click', () => { m.btn.click(); if (this.overlay) { const eb = this.expandedBtn(); if (eb) setTimeout(() => eb.click(), 60); } });
      row.appendChild(b); list.appendChild(row);
    });
  },

  decorate(btn) {
    const id = this.folderId(btn); const d = this.load(); const custom = d.icons[id];
    const priv = d.privacy[id] === undefined ? window.YapPlus.opt('gipfolders', 'privacyAll', false) : d.privacy[id];
    const wantCustom = !!custom, wantPrivate = !custom && !!priv;
    btn.classList.toggle('gip-folder-custom', wantCustom); btn.classList.toggle('gip-folder-private', wantPrivate);
    let img = btn.querySelector(':scope > .gip-folder-ico'); let gl = btn.querySelector(':scope > .gip-folder-glyph');
    if (wantCustom) {
      if (!img) { img = document.createElement('img'); img.className = 'gip-folder-ico'; img.alt = ''; img.draggable = false; btn.appendChild(img); }
      if (img.src !== custom) img.src = custom;
    } else if (img) img.remove();
    if (wantPrivate) { if (!gl) { gl = document.createElement('span'); gl.className = 'gip-folder-glyph'; gl.innerHTML = this.glyph; btn.appendChild(gl); } }
    else if (gl) gl.remove();
  },
  sync() {
    const rail = this.rail();
    if (!rail) { if (this.panel) this.closePanel(); return; }
    rail.querySelectorAll('.rail-folder').forEach(b => this.decorate(b));
    const open = this.expandedBtn();
    if (!open) { if (this.panel) this.closePanel(); return; }
    const id = this.folderId(open);
    if (this.panelFor !== id || !this.panel || !this.panel.isConnected) { this.closePanel(); this.openPanel(open); }
    this.fillPanel(open);
    if (this.overlay && this.panel) this.panel.style.left = rail.getBoundingClientRect().right + 'px';
  },

  pickIcon(id) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.addEventListener('change', () => {
      const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
      const url = URL.createObjectURL(f); const im = new Image();
      im.onload = () => {
        const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
        const g = c.getContext('2d'), m = Math.min(im.width, im.height);
        g.drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, S, S);
        URL.revokeObjectURL(url);
        const d = this.load(); d.icons[id] = c.toDataURL('image/webp', 0.88); this.save(d); this.sync();
      };
      im.onerror = () => { URL.revokeObjectURL(url); window.YapPlus.toast('That file is not an image'); };
      im.src = url;
    });
    inp.click();
  },
  menuItems(id) {
    const d = this.load();
    const priv = d.privacy[id] === undefined ? window.YapPlus.opt('gipfolders', 'privacyAll', false) : d.privacy[id];
    const items = [{ label: 'Set folder icon\u2026', tag: 'gip', onClick: () => this.pickIcon(id) }];
    if (d.icons[id]) items.push({ label: 'Remove custom icon', tag: 'gip', onClick: () => { const x = this.load(); delete x.icons[id]; this.save(x); this.sync(); } });
    items.push({ label: priv ? 'Show server icons on this folder' : 'Hide server icons on this folder', tag: 'gip', onClick: () => { const x = this.load(); x.privacy[id] = !priv; this.save(x); this.sync(); } });
    return items;
  },
  onContext(e) {
    const btn = e.target.closest && e.target.closest('nav.rail .rail-folder'); if (!btn) return;
    const id = this.folderId(btn); const x = e.clientX, y = e.clientY;
    setTimeout(() => {
      const site = Array.from(document.querySelectorAll('.ctx-menu:not(.gip-popmenu)')).pop();
      if (site && !site.dataset.gipfolder) {
        site.dataset.gipfolder = '1';
        const hr = document.createElement('div'); hr.style.cssText = 'height:1px;margin:4px 6px;background:currentColor;opacity:.15'; site.appendChild(hr);
        this.menuItems(id).forEach(it => {
          const b = document.createElement('button'); b.appendChild(document.createTextNode(it.label)); b.appendChild(window.YapPlus.tag('gip'));
          b.addEventListener('click', (ev) => { ev.stopPropagation(); site.remove(); it.onClick(); });
          site.appendChild(b);
        });
      } else if (!site) window.YapPlus.popMenu(x, y, this.menuItems(id));
    }, 80);
  },

  start() {
    if (this.timer) return;
    this.styleEl = document.createElement('style'); this.styleEl.id = 'gip-folders-style'; this.styleEl.textContent = this.css;
    document.head.appendChild(this.styleEl);
    const self = this;
    this.handlers = {
      ctx: (e) => { try { self.onContext(e); } catch (er) {} },
      away: (e) => {
        if (!self.panel) return;
        const t = e.target;
        if (self.panel.contains(t) || (self.rail() && self.rail().contains(t)) || (t.closest && t.closest('.ctx-menu,.modal,.overlay'))) return;
        const b = self.expandedBtn(); if (b) b.click();
      },
    };
    document.addEventListener('contextmenu', this.handlers.ctx, true);
    document.addEventListener('pointerdown', this.handlers.away, true);
    this.obs = new MutationObserver(() => { if (!self.pend) self.pend = setTimeout(() => { self.pend = 0; try { self.sync(); } catch (e) {} }, 60); });
    this.obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-expanded', 'class'] });
    this.timer = setInterval(() => { try { this.sync(); } catch (e) {} }, 700);
    this.sync();
  },
  stop() {
    clearInterval(this.timer); this.timer = null;
    if (this.obs) { this.obs.disconnect(); this.obs = null; }
    if (this.handlers) { document.removeEventListener('contextmenu', this.handlers.ctx, true); document.removeEventListener('pointerdown', this.handlers.away, true); this.handlers = null; }
    this.closePanel();
    document.querySelectorAll('.rail-folder').forEach(b => {
      b.classList.remove('gip-folder-custom', 'gip-folder-private');
      b.querySelectorAll(':scope > .gip-folder-ico, :scope > .gip-folder-glyph').forEach(n => n.remove());
    });
    if (this.styleEl) { this.styleEl.remove(); this.styleEl = null; }
  },
};
window.PluginHost.register(gipfolders);
