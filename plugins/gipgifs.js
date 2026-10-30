// GIP++ GIF Favorites + Categories.
// Adds a "Favorites" tile to Yappin's own GIF picker (like Discord), a star on every GIF to save it,
// and categories to sort saved GIFs into. Stored on this computer only.
const gipgifs = {
  id: 'gipgifs',
  origin: 'gip',
  name: 'GIF Favorites + Categories',
  description: 'Save GIFs from the GIF picker or from chat (star), keep them under Favorites in the picker, and sort them into categories.',
  store: 'gip.gifs.v1',
  obs: null, raf: 0, hover: null, handlers: null, view: null,

  load() { try { const d = JSON.parse(localStorage.getItem(this.store)); if (d && Array.isArray(d.items) && Array.isArray(d.cats)) return d; } catch (e) {} return { items: [], cats: [] }; },
  save(d) { try { localStorage.setItem(this.store, JSON.stringify(d)); } catch (e) { window.YapPlus.toast('Could not save (storage full?)'); } },
  find(d, url) { return d.items.find(i => i.url === url); },
  add(url, cat) {
    const d = this.load(); const it = this.find(d, url);
    if (it) it.cat = cat || null; else d.items.unshift({ url, cat: cat || null, t: Date.now() });
    d.items = d.items.slice(0, 600); this.save(d); this.refresh();
  },
  remove(url) { const d = this.load(); d.items = d.items.filter(i => i.url !== url); this.save(d); this.refresh(); },
  newCat(name, then) {
    const d = this.load();
    const c = { id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name };
    d.cats.push(c); this.save(d);
    if (then) then(c.id);
    this.refresh();
  },
  renameCat(id, name) { const d = this.load(); const c = d.cats.find(c => c.id === id); if (c) { c.name = name; this.save(d); this.refresh(); } },
  deleteCat(id) { const d = this.load(); d.cats = d.cats.filter(c => c.id !== id); d.items.forEach(i => { if (i.cat === id) i.cat = null; }); this.save(d); this.refresh(); },

  star(on) { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>`; },
  coverSvg() {
    const s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.6" stroke-linejoin="round"><rect width="24" height="24" fill="#222" stroke="none"/><path d="M12 5l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 10.3l5-.7z"/></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
  },

  send(url) {
    const now = Date.now(); if (this._sentAt && now - this._sentAt < 900) return;   // a double click must not post the GIF twice
    this._sentAt = now;
    const ta = document.querySelector('.composer-box textarea, .composer textarea');
    if (!ta) { try { navigator.clipboard.writeText(url); } catch (e) {} window.YapPlus.toast('Open a channel first. GIF link copied.'); return; }
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    const old = ta.value;
    setter.call(ta, url);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
    ['keydown', 'keypress', 'keyup'].forEach(t => ta.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true })));
    setTimeout(() => {
      if (old) { setter.call(ta, old); ta.dispatchEvent(new Event('input', { bubbles: true })); }
      if (document.querySelector('.gif-picker')) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }, 250);
  },

  saveMenu(x, y, url) {
    const d = this.load(); const cur = this.find(d, url); const items = [];
    if (cur) items.push({ label: 'Remove from Favorites', danger: true, onClick: () => this.remove(url) }, { sep: true });
    items.push({ label: (cur ? 'Move to ' : 'Save to ') + 'Favorites', icon: this.star(false), tag: 'gip', onClick: () => { this.add(url, null); window.YapPlus.toast('Saved to Favorites'); } });
    d.cats.forEach(c => items.push({ label: (cur ? 'Move to ' : 'Save to ') + c.name, onClick: () => { this.add(url, c.id); window.YapPlus.toast('Saved to ' + c.name); } }));
    items.push({ sep: true }, { label: 'New category\u2026', onClick: () => window.YapPlus.prompt('New GIF category', '', (n) => this.newCat(n, (id) => { this.add(url, id); window.YapPlus.toast('Saved to ' + n); })) });
    window.YapPlus.popMenu(x, y, items);
  },
  mkStar(url) {
    const s = document.createElement('span');
    s.className = 'gip-star'; s.setAttribute('role', 'button'); s.setAttribute('aria-label', 'Save GIF'); s.title = 'Save GIF (GIP++)';
    s.dataset.url = url; s.innerHTML = this.star(!!this.find(this.load(), url));
    ['mousedown', 'pointerdown', 'mouseup'].forEach(t => s.addEventListener(t, (e) => e.stopPropagation()));
    s.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); const r = s.getBoundingClientRect(); this.saveMenu(r.left, r.bottom + 4, url); });
    return s;
  },

  css: `
    .gip-star{position:absolute;top:5px;right:5px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:7px;background:rgba(0,0,0,.7);color:#fff;opacity:0;transition:opacity .12s;cursor:pointer;z-index:3}
    *:hover>.gip-star,.gip-star:focus{opacity:1}
    .gip-star:hover{background:rgba(0,0,0,.9)}
    #gip-gif-hoverstar{position:fixed;z-index:2147482000;display:none;opacity:1}
    .gip-fav-bar{display:flex;align-items:center;gap:8px;padding:2px 2px 8px}
    .gip-fav-bar .gip-fav-title{flex:1;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .gip-fav-view .gip-fav-h{font-size:11px;opacity:.6;text-transform:uppercase;letter-spacing:.06em;margin:10px 2px 6px}
    .gip-fav-view .gif-tile{position:relative}
    .gip-fav-empty{opacity:.65;padding:14px 4px;font-size:13px}
  `,
  tileFav(picker) {
    const tiles = picker.querySelector('.gif-tiles');
    if (!tiles || tiles.querySelector('.gip-fav-tile')) return;
    const first = this.load().items[0];
    const b = document.createElement('button'); b.className = 'gif-tile gip-fav-tile';
    const img = document.createElement('img'); img.alt = ''; img.draggable = false; img.src = first ? first.url : this.coverSvg();
    const sp = document.createElement('span'); sp.textContent = 'Favorites';
    b.append(img, sp);
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.openView(picker, null); });
    tiles.insertBefore(b, tiles.firstChild);
  },
  decorateResults(picker) {
    picker.querySelectorAll('.gif-picker-scroll button').forEach(b => {
      if (b.classList.contains('gif-tile') && b.querySelector('span')) return;
      if (b.closest('.gip-fav-view') || b.dataset.gipstar) return;
      const img = b.querySelector(':scope > img');
      if (!img || !img.src || /^data:/.test(img.src)) return;
      b.dataset.gipstar = '1';
      if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
      b.appendChild(this.mkStar(img.src));
    });
  },

  closeView() { if (!this.view) return; const { wrap, tiles } = this.view; wrap.remove(); if (tiles) tiles.style.display = ''; this.view = null; },
  openView(picker, catId) {
    const scroll = picker.querySelector('.gif-picker-scroll'); if (!scroll) return;
    let tiles = this.view ? this.view.tiles : picker.querySelector('.gif-tiles:not(.gip-fav-grid)');
    if (this.view) this.view.wrap.remove();
    if (tiles) tiles.style.display = 'none';
    const wrap = document.createElement('div'); wrap.className = 'gip-fav-view';
    this.view = { picker, wrap, tiles, cat: catId };
    scroll.appendChild(wrap); this.renderView();
  },
  refresh() {
    if (this.view && this.view.wrap.isConnected) this.renderView();
    document.querySelectorAll('.gip-fav-tile img').forEach(img => { const f = this.load().items[0]; img.src = f ? f.url : this.coverSvg(); });
    document.querySelectorAll('.gip-star').forEach(s => { s.innerHTML = this.star(!!this.find(this.load(), s.dataset.url)); });
  },
  gifTile(it) {
    const b = document.createElement('button'); b.className = 'gif-tile';
    const img = document.createElement('img'); img.alt = ''; img.loading = 'lazy'; img.draggable = false; img.src = it.url;
    b.appendChild(img); b.appendChild(this.mkStar(it.url));
    b.addEventListener('click', () => this.send(it.url));
    b.addEventListener('contextmenu', (e) => { e.preventDefault(); this.saveMenu(e.clientX, e.clientY, it.url); });
    return b;
  },
  renderView() {
    const v = this.view; if (!v) return;
    const d = this.load(); const w = v.wrap; w.innerHTML = '';
    const cat = v.cat ? d.cats.find(c => c.id === v.cat) : null;
    if (v.cat && !cat) v.cat = null;
    const bar = document.createElement('div'); bar.className = 'gip-fav-bar';
    const back = document.createElement('button'); back.className = 'btn'; back.textContent = '\u2190 Back';
    back.addEventListener('click', () => { if (v.cat) { v.cat = null; this.renderView(); } else this.closeView(); });
    const title = document.createElement('div'); title.className = 'gip-fav-title';
    title.append(cat ? cat.name : 'Favorites', window.YapPlus.tag('gip'));
    const add = document.createElement('button'); add.className = 'btn'; add.textContent = '+ Category';
    add.addEventListener('click', () => window.YapPlus.prompt('New GIF category', '', (n) => this.newCat(n)));
    bar.append(back, title); if (!cat) bar.append(add); w.appendChild(bar);

    if (!cat && d.cats.length) {
      const h = document.createElement('div'); h.className = 'gip-fav-h hint'; h.textContent = 'Categories';
      const grid = document.createElement('div'); grid.className = 'gif-tiles gip-fav-grid';
      d.cats.forEach(c => {
        const items = d.items.filter(i => i.cat === c.id);
        const t = document.createElement('button'); t.className = 'gif-tile';
        const img = document.createElement('img'); img.alt = ''; img.draggable = false; img.src = items[0] ? items[0].url : this.coverSvg();
        const sp = document.createElement('span'); sp.textContent = c.name + (items.length ? ' (' + items.length + ')' : '');
        t.append(img, sp);
        t.addEventListener('click', () => { v.cat = c.id; this.renderView(); });
        t.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          window.YapPlus.popMenu(e.clientX, e.clientY, [
            { label: 'Rename category', onClick: () => window.YapPlus.prompt('Rename category', c.name, (n) => this.renameCat(c.id, n)) },
            { label: 'Delete category', danger: true, onClick: () => this.deleteCat(c.id) },
          ]);
        });
        grid.appendChild(t);
      });
      w.append(h, grid);
    }
    const list = d.items.filter(i => (cat ? i.cat === cat.id : !i.cat));
    if (list.length) {
      if (!cat && d.cats.length) { const h2 = document.createElement('div'); h2.className = 'gip-fav-h hint'; h2.textContent = 'Uncategorized'; w.appendChild(h2); }
      const grid = document.createElement('div'); grid.className = 'gif-tiles gip-fav-grid';
      list.forEach(it => grid.appendChild(this.gifTile(it))); w.appendChild(grid);
    } else if (!(!cat && d.cats.length)) {
      const e = document.createElement('div'); e.className = 'gip-fav-empty hint';
      e.textContent = cat ? 'Nothing in this category yet. Star a GIF and choose it.' : 'No favorites yet. Hover a GIF and press the star, in the picker or in chat.';
      w.appendChild(e);
    }
  },

  isChatGif(img) {
    if (!(img instanceof HTMLImageElement) || !img.closest('.msg')) return false;
    if (img.classList.contains('emoji') || img.closest('.avatar')) return false;
    return /\.gif(\?|$)|klipy\.com/i.test(img.currentSrc || img.src);
  },
  hoverStar(img) {
    if (!this.hover) {
      this.hover = document.createElement('div'); this.hover.id = 'gip-gif-hoverstar';
      document.body.appendChild(this.hover);
      this.hover.addEventListener('mouseleave', () => { this.hover.style.display = 'none'; });
    }
    const r = img.getBoundingClientRect();
    this.hover.innerHTML = '';
    const s = this.mkStar(img.currentSrc || img.src); s.style.position = 'static'; s.style.opacity = '1';
    this.hover.appendChild(s);
    this.hover.style.display = 'block';
    this.hover.style.left = Math.max(4, r.right - 34) + 'px';
    this.hover.style.top = Math.max(4, r.top + 6) + 'px';
  },

  scan() {
    this.raf = 0;
    const p = document.querySelector('.gif-picker');
    if (p) { this.tileFav(p); this.decorateResults(p); } else if (this.view) this.view = null;
  },
  start() {
    if (this.obs) return;
    this.styleEl = document.createElement('style'); this.styleEl.id = 'gip-gifs-style'; this.styleEl.textContent = this.css;
    document.head.appendChild(this.styleEl);
    const self = this;
    this.obs = window.YapPlus.events.on('dom', () => { if (!self.raf) self.raf = requestAnimationFrame(() => self.scan()); }, 'gipgifs');
    this.handlers = {
      over: (e) => { if (self.isChatGif(e.target)) self.hoverStar(e.target); },
      out: (e) => { if (self.hover && self.isChatGif(e.target) && !(e.relatedTarget && self.hover.contains(e.relatedTarget))) self.hover.style.display = 'none'; },
      search: (e) => { if (self.view && e.target.closest && e.target.closest('.gif-picker-top')) self.closeView(); },
    };
    document.addEventListener('mouseover', this.handlers.over, true);
    document.addEventListener('mouseout', this.handlers.out, true);
    document.addEventListener('input', this.handlers.search, true);
    this.scan();
  },
  stop() {
    if (this.obs) { this.obs(); this.obs = null; }
    if (this.handlers) {
      document.removeEventListener('mouseover', this.handlers.over, true);
      document.removeEventListener('mouseout', this.handlers.out, true);
      document.removeEventListener('input', this.handlers.search, true);
      this.handlers = null;
    }
    this.closeView();
    document.querySelectorAll('.gip-fav-tile,.gip-star').forEach(n => n.remove());
    document.querySelectorAll('[data-gipstar]').forEach(n => delete n.dataset.gipstar);
    if (this.hover) { this.hover.remove(); this.hover = null; }
    if (this.styleEl) { this.styleEl.remove(); this.styleEl = null; }
  },
};
window.PluginHost.register(gipgifs);
