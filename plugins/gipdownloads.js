// GIP++ Downloads. A download button when you hover a picture, video, audio clip or file in chat.
// Files are saved with their real name into Downloads/GIP++ (or wherever you choose), without opening or navigating anywhere.
// Programs and scripts are never saved automatically.
(function () {
  const Y = window.YapPlus, ME = 'gipdownloads';
  const TARGET = '.msg img, .msg video, .msg audio, .msg a[download], .msg [class*="attach" i] a[href]';
  const MEDIA_EXT = /\.(png|jpe?g|gif|webp|avif|bmp|svg|mp4|webm|mov|mkv|mp3|ogg|wav|m4a|flac|pdf|zip|txt)(\?|#|$)/i;
  let btn = null, cur = null, hideT = 0, hs = null;

  const skip = (t) => Y.util.isIconMedia(t);
  // Fix: GIF Favorites (gipgifs) draws its own star in the top-right corner of every chat GIF, at exactly the spot this button used,
  // and the star sits higher (z-index), so on GIFs the download button was hidden underneath it and the click opened the star menu instead.
  // On those GIFs this button now sits one slot to the left of the star.
  const GIF = /\.gif(\?|$)|klipy\.com/i, STAR_W = 34;
  function starBeside(t) {
    try {
      if (!(t instanceof HTMLImageElement) || !t.closest('.msg') || !GIF.test(t.currentSrc || t.src || '')) return false;
      const p = Y.PluginHost.plugins.find((x) => x.id === 'gipgifs');
      return !!(p && Y.PluginHost.isRunning(p));
    } catch (e) { return false; }
  }
  function urlFor(t) {
    if (t.tagName === 'A') return t.href;
    if (t instanceof HTMLImageElement) { const a = t.closest('a[href]'); if (a && /^https?:/i.test(a.href) && MEDIA_EXT.test(a.href)) return a.href; return t.currentSrc || t.src; }
    return t.currentSrc || t.src || (t.querySelector('source') && t.querySelector('source').src) || '';
  }
  function nameFor(t, url) {
    const dl = t.tagName === 'A' ? t.getAttribute('download') : ''; if (dl) return dl;
    const box = t.closest('[class*="attach" i]');
    if (box) { const m = /[^\s\\/:*?"<>|]+\.[A-Za-z0-9]{2,5}\b/.exec(box.textContent || ''); if (m) return m[0]; }
    try { return decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || ''); } catch (e) { return ''; }
  }
  async function save(t) {
    const url = urlFor(t); if (!url) return Y.toast('Could not find the file');
    const name = nameFor(t, url);
    if (/^(blob|data):/i.test(url)) { const a = document.createElement('a'); a.href = url; a.download = name || 'file'; document.body.appendChild(a); a.click(); a.remove(); return; }
    Y.toast('Downloading' + (name ? ' ' + name : '') + '\u2026', 1500);
    const r = await Y.download(url, name, { ask: Y.opt(ME, 'ask', false), reveal: Y.opt(ME, 'reveal', false) });
    if (r.success) Y.toast('Saved ' + r.name, 2600); else if (!r.canceled) Y.toast('Download failed: ' + (r.error || 'unknown error'), 4200);
  }
  function show(t) {
    if (!btn) {
      btn = document.createElement('button'); btn.id = 'gip-dl-btn'; btn.type = 'button'; btn.textContent = '\u2193'; btn.title = 'Download'; btn.setAttribute('aria-label', 'Download');
      btn.style.cssText = 'position:fixed;z-index:9995;width:28px;height:28px;border-radius:50%;border:1px solid rgba(128,128,128,.5);background:var(--bg-elev,#1e1f22);color:var(--text,#e6e6e6);font-size:15px;line-height:1;cursor:pointer;display:none;padding:0';
      btn.addEventListener('mouseenter', () => clearTimeout(hideT)); btn.addEventListener('mouseleave', () => { hideT = setTimeout(hide, 200); });
      btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (cur) save(cur); });
      document.body.appendChild(btn);
    }
    cur = t; const r = t.getBoundingClientRect();
    const shift = starBeside(t) ? STAR_W : 0;
    btn.style.top = Math.max(4, r.top + 6) + 'px'; btn.style.left = Math.max(4, Math.min(window.innerWidth - 34 - shift, r.right - 34 - shift)) + 'px'; btn.style.display = 'block';
  }
  function hide() { if (btn) btn.style.display = 'none'; cur = null; }

  const plugin = {
    id: ME, name: 'Downloads', origin: 'gip',
    description: 'A download button when you hover a picture, video, audio clip or file in chat. Saves with the real file name to Downloads/GIP++.',
    options: [
      { key: 'ask', type: 'toggle', dflt: false, label: 'Ask where to save each file', desc: 'Off: files go to Downloads/GIP++. Programs and scripts only save when this is on.' },
      { key: 'reveal', type: 'toggle', dflt: false, label: 'Show the file in its folder when done' },
    ],
    start() {
      if (hs) return;
      hs = {
        over: (e) => {
          const t = e.target.closest && e.target.closest(TARGET);
          if (!t || skip(t)) {
            // The pointer went somewhere that is not a file: hide, unless it is this button or the GIF star beside it.
            if (cur && !(e.target.closest && e.target.closest('#gip-dl-btn, #gip-gif-hoverstar'))) { clearTimeout(hideT); hideT = setTimeout(hide, 200); }
            return;
          }
          clearTimeout(hideT); if (t !== cur) show(t);
        },
        out: (e) => { const t = e.target.closest && e.target.closest(TARGET); if (t) hideT = setTimeout(() => { if (!(btn && btn.matches(':hover')) && !document.querySelector('#gip-gif-hoverstar:hover')) hide(); }, 200); },
        scroll: () => { if (cur && cur.isConnected) show(cur); else hide(); },
      };
      document.addEventListener('mouseover', hs.over, true); document.addEventListener('mouseout', hs.out, true); document.addEventListener('scroll', hs.scroll, true);
    },
    stop() {
      if (hs) { document.removeEventListener('mouseover', hs.over, true); document.removeEventListener('mouseout', hs.out, true); document.removeEventListener('scroll', hs.scroll, true); hs = null; }
      if (btn) { btn.remove(); btn = null; } cur = null; clearTimeout(hideT);
    },
  };
  window.PluginHost.register(plugin);

  Y.registerTab('downloads', 'Downloads', function (ui) {
    const { el, group } = ui; const root = el('div');
    const g = group('Where files go', 'gip', 'Hover a picture, video or file in chat and press the download button (turn on Downloads in Features). Files keep their real names and go to your Downloads folder, in a folder called GIP++.');
    const open = el('button', { class: 'btn', text: 'Open the folder' });
    open.addEventListener('click', async () => { try { const ok = await window.electronAPI.openDownloads(); if (!ok) Y.toast('Could not open the folder'); } catch (e) { Y.toast('Needs the desktop app'); } });
    g.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name', text: 'Downloads/GIP++' }), el('div', { class: 'gp-desc', text: 'Programs and scripts (.exe, .bat, .js and similar) are never saved automatically. Turn on "Ask where to save" if you really want one.' })), open));
    root.appendChild(g);
    const e = group('Emoji', 'gip', 'Alt+click an emoji to save it. Alt+Shift+click saves every emoji in the same picker or list. Turn on Emoji Downloader in Features.');
    const all = el('button', { class: 'btn', text: 'Download every emoji on screen' });
    all.addEventListener('click', () => { if (Y.emojiDownloadAll) Y.emojiDownloadAll(document.body); else Y.toast('Turn on Emoji Downloader in Features first'); });
    e.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name', text: 'Open an emoji picker or a server emoji list first' }), el('div', { class: 'gp-desc', text: 'Saved to Downloads/GIP++/Emoji.' })), all));
    root.appendChild(e);
    return root;
  });
})();
