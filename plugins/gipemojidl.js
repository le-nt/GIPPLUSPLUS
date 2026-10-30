// GIP++ Emoji Downloader. Alt+click an emoji to save it. Alt+Shift+click saves every emoji in the same picker or list.
// Saved with the emoji's own name into Downloads/GIP++/Emoji.
(function () {
  const Y = window.YapPlus, ME = 'gipemojidl', SUB = 'Emoji';
  const EMOJI = 'img.emoji, img[class*="emoji" i], [class*="emoji" i] img, img[alt^=":"][alt$=":"]';
  let hs = null, busy = false;

  const urlOf = (img) => img.currentSrc || img.src || '';
  function nameOf(img) {
    const raw = img.getAttribute('data-name') || img.getAttribute('alt') || img.getAttribute('title') || img.getAttribute('aria-label') || '';
    const n = raw.replace(/:/g, '').trim();
    if (n && n.length < 60) return n.replace(/\s+/g, '_');
    try { return decodeURIComponent(new URL(urlOf(img)).pathname.split('/').filter(Boolean).pop() || 'emoji'); } catch (e) { return 'emoji'; }
  }
  const withExt = (name, url) => /\.[A-Za-z0-9]{2,5}$/.test(name) ? name : name + ((/\.(png|gif|webp|jpe?g|avif|svg)(\?|#|$)/i.exec(url) || [])[1] ? '.' + (/\.(png|gif|webp|jpe?g|avif|svg)(\?|#|$)/i.exec(url)[1]).toLowerCase().replace('jpeg', 'jpg') : '');

  async function many(list) {
    if (busy) return Y.toast('Already downloading emoji');
    const seen = new Set(), jobs = [];
    list.forEach((img) => { const u = urlOf(img); if (/^https?:/i.test(u) && !seen.has(u)) { seen.add(u); jobs.push({ u, n: withExt(nameOf(img), u) }); } });
    if (!jobs.length) return Y.toast('No emoji found here');
    if (jobs.length > 1 && jobs.length > 300) return Y.toast('That is ' + jobs.length + ' emoji. Open a smaller list or picker section.', 4000);
    busy = true; let done = 0, ok = 0, fail = 0, next = 0;
    Y.toast('Downloading ' + jobs.length + ' emoji\u2026', 1600);
    const worker = async () => {
      for (;;) {
        const j = jobs[next++]; if (!j) return;
        const r = await Y.download(j.u, j.n, { subdir: SUB }); done++; if (r.success) ok++; else fail++;
        if (jobs.length > 6 && done % 10 === 0) Y.toast('Emoji ' + done + ' of ' + jobs.length, 900);
      }
    };
    try { await Promise.all([worker(), worker(), worker()]); } finally { busy = false; }
    Y.toast('Saved ' + ok + ' emoji' + (fail ? ', ' + fail + ' failed' : '') + ' to Downloads/GIP++/Emoji', 3500);
  }
  Y.emojiDownloadAll = (root) => many([...(root || document.body).querySelectorAll(EMOJI)].filter(i => i instanceof HTMLImageElement && i.complete !== false));

  const plugin = {
    id: ME, name: 'Emoji Downloader', origin: 'gip',
    description: 'Alt+click an emoji to save it. Alt+Shift+click saves every emoji in the same picker or list. Saved to Downloads/GIP++/Emoji.',
    start() {
      if (hs) return;
      hs = (e) => {
        if (!e.altKey || e.ctrlKey || e.button !== 0) return;
        const img = e.target.closest && e.target.closest(EMOJI); if (!(img instanceof HTMLImageElement)) return;
        e.preventDefault(); e.stopPropagation();
        if (e.shiftKey) {
          const root = img.closest('[class*="picker" i], [role="dialog"], [class*="modal" i], [class*="settings" i], [class*="emoji" i][class*="list" i], [class*="emoji" i][class*="grid" i]') || document.body;
          many([...root.querySelectorAll(EMOJI)].filter(i => i instanceof HTMLImageElement));
        } else many([img]);
      };
      document.addEventListener('click', hs, true);
    },
    stop() { if (hs) { document.removeEventListener('click', hs, true); hs = null; } },
  };
  window.PluginHost.register(plugin);
})();
