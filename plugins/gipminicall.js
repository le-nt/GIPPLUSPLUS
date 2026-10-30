// GIP++ Mini Call. The little call card that shows up when you are in voice (or watching a stream) and open a different channel.
// Pick one: let you drag it anywhere (it remembers where), or hide it completely. It is only a visual change on your screen.
(function () {
  const Y = window.YapPlus, ME = 'gipminicall', STYLE = 'gip-minicall-style', DRAGGING = 'gip-minicall-dragging';
  const THRESHOLD = 5; // pixels you must move before a press counts as a drag, so a normal click still goes back to the call
  const store = Y.util.store('gip.minicall.pos', { x: 0, y: 0 });
  let pos = { x: 0, y: 0 }, drag = null, justDragged = false, offs = null, styleEl = null, h = null;

  Y.sel.define('miniCall', '.mini-call', 'ondemand', [ME]);
  const sel = () => Y.sel.css('miniCall');
  const mode = () => Y.opt(ME, 'mode', 'drag');
  const inCard = (e) => !!(e.target && e.target.closest && e.target.closest(sel()));

  function setVars() {
    const r = document.documentElement.style;
    r.setProperty('--gip-mc-x', pos.x + 'px');
    r.setProperty('--gip-mc-y', pos.y + 'px');
  }
  function clearVars() {
    const r = document.documentElement.style;
    r.removeProperty('--gip-mc-x'); r.removeProperty('--gip-mc-y');
  }
  // The position is a CSS variable, so a card that Yappin re-creates keeps its place without us touching it.
  function css() {
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = STYLE; document.head.appendChild(styleEl); }
    const s = sel();
    if (mode() === 'hide') { styleEl.textContent = s + '{display:none !important}'; clearVars(); return; }
    setVars();
    styleEl.textContent = s + '{translate:var(--gip-mc-x,0px) var(--gip-mc-y,0px) !important;cursor:grab;touch-action:none;user-select:none}' +
      s + '.' + DRAGGING + '{cursor:grabbing}';
  }

  // If the window got smaller (or the card appeared somewhere new), pull it back on screen.
  function keepOnScreen() {
    if (drag || mode() !== 'drag' || (!pos.x && !pos.y)) return;
    const el = document.querySelector(sel()); if (!el) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    let dx = 0, dy = 0;
    if (r.left < 0) dx = -r.left; else if (r.right > innerWidth) dx = innerWidth - r.right;
    if (r.top < 0) dy = -r.top; else if (r.bottom > innerHeight) dy = innerHeight - r.bottom;
    if (dx || dy) { pos.x += dx; pos.y += dy; setVars(); store.set(pos); }
  }

  function onDown(e) {
    if (mode() !== 'drag' || e.button !== 0 || !inCard(e)) return;
    const el = e.target.closest(sel()), r = el.getBoundingClientRect();
    drag = { el, id: e.pointerId, moved: false, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, left: r.left, top: r.top, w: r.width, h: r.height };
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    let dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < THRESHOLD) return;
      drag.moved = true; drag.el.classList.add(DRAGGING);
      try { drag.el.setPointerCapture(drag.id); } catch (err) {}
    }
    // keep the whole card inside the window
    dx = Math.min(Math.max(dx, -drag.left), Math.max(-drag.left, innerWidth - drag.w - drag.left));
    dy = Math.min(Math.max(dy, -drag.top), Math.max(-drag.top, innerHeight - drag.h - drag.top));
    pos.x = drag.ox + dx; pos.y = drag.oy + dy; setVars();
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.el.classList.remove(DRAGGING);
    if (drag.moved) { justDragged = true; setTimeout(() => { justDragged = false; }, 0); store.set(pos); }
    drag = null;
  }
  // The click that ends a drag must not also take you back to the call.
  function onClick(e) { if (justDragged && inCard(e)) { e.preventDefault(); e.stopPropagation(); } }
  // Alt + double-click on the card puts it back where Yappin puts it.
  function onDbl(e) {
    if (mode() !== 'drag' || !e.altKey || !inCard(e)) return;
    e.preventDefault(); e.stopPropagation();
    pos = { x: 0, y: 0 }; store.set(pos); setVars(); Y.toast('Call card position reset');
  }

  const plugin = {
    id: ME, name: 'Mini Call', origin: 'gip',
    description: 'The small call card that appears when you are in voice or watching a stream and open another channel. Make it draggable (it remembers where; Alt+double-click puts it back) or hide it completely.',
    options: [
      { key: 'mode', type: 'select', dflt: 'drag', label: 'Call card', choices: [['drag', 'Let me drag it'], ['hide', 'Never show it']] },
    ],
    start() {
      if (h) return;
      pos = Object.assign({ x: 0, y: 0 }, store.get());
      css();
      h = { down: onDown, move: onMove, up: onUp, click: onClick, dbl: onDbl, resize: keepOnScreen };
      document.addEventListener('pointerdown', h.down, true);
      document.addEventListener('pointermove', h.move, true);
      document.addEventListener('pointerup', h.up, true);
      document.addEventListener('pointercancel', h.up, true);
      document.addEventListener('click', h.click, true);
      document.addEventListener('dblclick', h.dbl, true);
      window.addEventListener('resize', h.resize);
      offs = [Y.events.watch(keepOnScreen, ME, 150)];
    },
    stop() {
      if (offs) { Y.util.offAll(offs); offs = null; }
      if (h) {
        document.removeEventListener('pointerdown', h.down, true);
        document.removeEventListener('pointermove', h.move, true);
        document.removeEventListener('pointerup', h.up, true);
        document.removeEventListener('pointercancel', h.up, true);
        document.removeEventListener('click', h.click, true);
        document.removeEventListener('dblclick', h.dbl, true);
        window.removeEventListener('resize', h.resize);
        h = null;
      }
      drag = null; justDragged = false;
      document.querySelectorAll('.' + DRAGGING).forEach(n => n.classList.remove(DRAGGING));
      clearVars();
      if (styleEl) { styleEl.remove(); styleEl = null; }
    },
    onOption() { if (h) css(); },
  };
  window.PluginHost.register(plugin);
})();
