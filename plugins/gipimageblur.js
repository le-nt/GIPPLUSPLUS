// GIP++ Blur Media. Blurs pictures and videos in chat until you hover or click them, so nothing surprising pops up.
// Emoji, avatars and tiny icons are left alone. It is only a visual effect on your screen.
(function () {
  const Y = window.YapPlus, ME = 'gipimageblur', STYLE = 'gip-blur-style';
  let offs = null, onClick = null, onLoad = null;
  const amount = () => ({ light: 8, medium: 16, heavy: 28 }[Y.opt(ME, 'amount', 'medium')] || 16);

  function css() {
    let s = document.getElementById(STYLE); if (!s) { s = document.createElement('style'); s.id = STYLE; document.head.appendChild(s); }
    const hover = Y.opt(ME, 'reveal', 'hover') === 'hover';
    s.textContent = '.gip-blur:not(.gip-reveal){filter:blur(' + amount() + 'px) !important;transition:filter .15s}' +
      (hover ? '.gip-blur:hover{filter:none !important}' : '.gip-blur:not(.gip-reveal){cursor:pointer}');
  }
  function tag(m) {
    if (Y.util.isIconMedia(m)) { m.classList.remove('gip-blur'); return; }
    if (m instanceof HTMLVideoElement && !Y.opt(ME, 'videos', true)) { m.classList.remove('gip-blur'); return; }
    m.classList.add('gip-blur');
  }
  const scan = () => document.querySelectorAll('.msg img, .msg video').forEach(tag);

  const plugin = {
    id: ME, name: 'Blur Media', origin: 'gip',
    description: 'Blurs pictures and videos in chat until you hover or click them. Emoji, avatars and small icons are not blurred. Shortcut: Ctrl+Alt+B turns it on or off.',
    options: [
      { key: 'amount', type: 'select', dflt: 'medium', label: 'How blurry', choices: [['light', 'Light'], ['medium', 'Medium'], ['heavy', 'Heavy']] },
      { key: 'reveal', type: 'select', dflt: 'hover', label: 'Show the picture when I', choices: [['hover', 'Hover over it'], ['click', 'Click it']] },
      { key: 'videos', type: 'toggle', dflt: true, label: 'Blur videos too' },
    ],
    start() {
      if (offs) return;
      css();
      onClick = (e) => {
        if (Y.opt(ME, 'reveal', 'hover') !== 'click') return;
        const m = e.target.closest && e.target.closest('.gip-blur:not(.gip-reveal)'); if (!m) return;
        e.preventDefault(); e.stopPropagation(); m.classList.add('gip-reveal');
      };
      onLoad = (e) => { if (e.target instanceof HTMLImageElement && e.target.closest && e.target.closest('.msg')) tag(e.target); };
      document.addEventListener('click', onClick, true);
      document.addEventListener('load', onLoad, true);
      offs = [Y.events.watch(scan, ME, 100)];
      scan();
    },
    stop() {
      if (offs) { Y.util.offAll(offs); offs = null; }
      if (onClick) { document.removeEventListener('click', onClick, true); onClick = null; }
      if (onLoad) { document.removeEventListener('load', onLoad, true); onLoad = null; }
      document.querySelectorAll('.gip-blur,.gip-reveal').forEach(m => m.classList.remove('gip-blur', 'gip-reveal'));
      const s = document.getElementById(STYLE); if (s) s.remove();
    },
    onOption() { if (offs) { css(); document.querySelectorAll('.gip-blur,.gip-reveal').forEach(m => m.classList.remove('gip-blur', 'gip-reveal')); scan(); } },
  };
  window.PluginHost.register(plugin);

  // Quick toggle for chats where you want it right now.
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && !e.shiftKey && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault(); const on = !Y.PluginHost.isEnabled(plugin); Y.PluginHost.setEnabled(plugin, on); Y.toast(on ? 'Blur Media on' : 'Blur Media off');
    }
  }, true);
})();
