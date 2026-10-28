// GIP++ Emoji Source. Click a custom emoji in chat and a small card tells you which server it belongs to.
// Yappin does not put the server name on the emoji, so GIP++ learns it from the emoji picker (the server heading each emoji sits under)
// and falls back to matching the emoji's uploader id against the servers in your rail.
const gipemoji = {
  id: 'gipemoji',
  origin: 'gip',
  name: 'Emoji Source Card',
  description: 'Click an emoji in chat to see which server it is from.',
  store: 'gip.emojisrc.v1',
  handler: null, obs: null, raf: 0,
  load() { try { return JSON.parse(localStorage.getItem(this.store)) || {}; } catch (e) { return {}; } },
  save(m) { try { localStorage.setItem(this.store, JSON.stringify(m)); } catch (e) {} },
  keyOf(src) { const m = /\/emojis\/([0-9a-f-]{36})\/([^/?#]+)/i.exec(src || ''); return m ? { owner: m[1], file: m[2], key: m[1] + '/' + m[2] } : null; },
  headerFor(img) {
    for (let n = img, i = 0; n && i < 6; n = n.parentElement, i++) {
      for (let s = n.previousElementSibling, j = 0; s && j < 3; s = s.previousElementSibling, j++) {
        if (s.querySelector && s.querySelector('img')) continue;
        const t = (s.textContent || '').replace(/\s+/g, ' ').trim();
        if (t && t.length <= 40 && !/^(recent|frequent|search|people|nature|food|activities|travel|objects|symbols|flags|smileys)/i.test(t)) return t;
      }
      if (n.classList && /emoji-picker/.test(n.className)) break;
    }
    return '';
  },
  learn() {
    this.raf = 0;
    const pk = document.querySelector('.emoji-picker:not(.gif-picker)'); if (!pk) return;
    const map = this.load(); let changed = false;
    pk.querySelectorAll('img[src*="/emojis/"]').forEach(img => {
      const k = this.keyOf(img.src); if (!k || map[k.key]) return;
      const h = this.headerFor(img); if (h) { map[k.key] = h; changed = true; }
    });
    if (changed) this.save(map);
  },
  railServers() {
    const out = [];
    document.querySelectorAll('nav.rail button.rail-item:not(.add):not(.rail-folder)').forEach(b => {
      const img = b.querySelector('img'); const m = img && /\/icons\/([0-9a-f-]{36})\//i.exec(img.src);
      out.push({ name: b.getAttribute('title') || '', owner: m ? m[1] : '' });
    });
    return out;
  },
  answer(src) {
    const k = this.keyOf(src);
    if (!k) return { line: 'Not a server emoji.', sure: true };
    const learned = this.load()[k.key];
    if (learned) return { line: learned, sure: true };
    const byOwner = this.railServers().filter(s => s.owner && s.owner === k.owner && s.name).map(s => s.name);
    if (byOwner.length === 1) return { line: byOwner[0], sure: false };
    if (byOwner.length > 1) return { line: byOwner.join(' or '), sure: false };
    return { line: 'Unknown server', sure: false, hint: 'Open the emoji picker once so GIP++ can look it up.' };
  },
  show(img, x, y) {
    document.querySelectorAll('.gip-popmenu').forEach(m => m.remove());
    const a = this.answer(img.src);
    const menu = document.createElement('div'); menu.className = 'ctx-menu gip-popmenu';
    menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:2147483000;width:230px;padding:10px 12px;display:flex;flex-direction:column;gap:6px`;
    const top = document.createElement('div'); top.style.cssText = 'display:flex;align-items:center;gap:10px';
    const big = document.createElement('img'); big.src = img.src; big.alt = ''; big.style.cssText = 'width:36px;height:36px;object-fit:contain'; big.draggable = false;
    const nm = document.createElement('div'); nm.style.cssText = 'font-weight:700;word-break:break-all'; nm.textContent = img.alt || img.title || 'emoji';
    top.append(big, nm);
    const from = document.createElement('div'); from.className = 'hint'; from.append(a.sure ? 'From ' : 'Probably from ');
    const strong = document.createElement('b'); strong.textContent = a.line; from.appendChild(strong); from.appendChild(window.YapPlus.tag('gip'));
    menu.append(top, from);
    if (a.hint) { const h = document.createElement('div'); h.className = 'hint'; h.style.cssText = 'font-size:11px;opacity:.7'; h.textContent = a.hint; menu.appendChild(h); }
    document.body.appendChild(menu);
    const r = menu.getBoundingClientRect();
    if (r.right > innerWidth - 6) menu.style.left = Math.max(6, innerWidth - r.width - 6) + 'px';
    if (r.bottom > innerHeight - 6) menu.style.top = Math.max(6, y - r.height - 12) + 'px';
    const close = () => { menu.remove(); document.removeEventListener('pointerdown', away, true); document.removeEventListener('keydown', esc, true); clearTimeout(t); };
    const away = (e) => { if (!menu.contains(e.target)) close(); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    const t = setTimeout(close, 6000);
    setTimeout(() => { document.addEventListener('pointerdown', away, true); document.addEventListener('keydown', esc, true); }, 0);
  },
  start() {
    if (this.handler) return;
    const self = this;
    this.handler = function (e) {
      const img = e.target.closest && e.target.closest('img.emoji');
      if (!img || img.closest('.emoji-picker') || img.closest('.gif-picker')) return;
      self.show(img, e.clientX + 8, e.clientY + 8);
    };
    document.addEventListener('click', this.handler, true);
    this.obs = new MutationObserver(() => { if (!self.raf) self.raf = setTimeout(() => self.learn(), 300); });
    this.obs.observe(document.body, { childList: true, subtree: true });
  },
  stop() { if (this.handler) document.removeEventListener('click', this.handler, true); this.handler = null; if (this.obs) { this.obs.disconnect(); this.obs = null; } },
};
window.PluginHost.register(gipemoji);
