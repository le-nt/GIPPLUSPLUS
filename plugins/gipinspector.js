// GIP Inspector: a helper for building new plugins.
// With it on, Alt+Shift+Click any element in the app and a short description of it
// (tag, classes, ancestors, start of its HTML) is copied to your clipboard. Paste it to whoever is
// writing the next plugin so selectors can be written against the real page instead of guessed.
const gipinspector = {
  id: 'gipinspector',
  origin: 'gip',
  name: 'GIP Inspector (dev helper)',
  description: 'Alt+Shift+Click an element to copy its selector info. Off by default; for people building plugins.',
  handler: null,
  path(el) {
    const parts = [];
    for (let n = el, i = 0; n && n !== document.documentElement && i < 8; n = n.parentElement, i++) {
      const cls = typeof n.className === 'string' && n.className.trim() ? '.' + n.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
      parts.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + cls);
    }
    return parts.join(' > ');
  },
  copy(text) {
    const fallback = () => {
      const a = document.createElement('textarea');
      a.value = text; a.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(a); a.select();
      try { document.execCommand('copy'); } catch (e) {}
      a.remove();
    };
    try { navigator.clipboard.writeText(text).catch(fallback); } catch (e) { fallback(); }
  },
  toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);z-index:2147483647;background:#080808;color:#f3f3f1;border:1px solid #f3f3f1;padding:8px 14px;font:13px "Courier New",monospace';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1600);
  },
  start() {
    if (this.handler) return;
    const self = this;
    this.handler = function (e) {
      if (!(e.altKey && e.shiftKey)) return;
      e.preventDefault(); e.stopPropagation();
      const el = e.target;
      const info = [
        'path: ' + self.path(el),
        'text: ' + (el.textContent || '').trim().slice(0, 60).replace(/\s+/g, ' '),
        'attrs: ' + Array.from(el.attributes || []).map(a => a.name + '=' + String(a.value).slice(0, 40)).join(' '),
        'html: ' + (el.outerHTML || '').slice(0, 300),
      ].join('\n');
      self.copy(info);
      self.toast('Copied element info');
    };
    document.addEventListener('click', this.handler, true);
  },
  stop() {
    if (this.handler) document.removeEventListener('click', this.handler, true);
    this.handler = null;
  },
};
window.PluginHost.register(gipinspector);
