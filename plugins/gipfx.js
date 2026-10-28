// GIP++ Visual Effects.
// Animated background (drifting bubbles / aurora), a time-of-day sky for the "Time-of-day Aero" theme,
// a glossy ring when you send a message, and a glow while you (or someone else) is typing.
// The background shows in GIP++ themes (they isolate the app so the effect can sit behind the panels).
(function () {
  const Y = window.YapPlus;
  const opt = (k, d) => Y.opt('gipfx', k, d);
  const CSS = `
    .gip-fx{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
    .gip-fx .b{position:absolute;bottom:-150px;border-radius:50%;border:1px solid rgba(255,255,255,.55);animation:gip-rise linear infinite;will-change:transform;
      background:radial-gradient(circle at 32% 28%,rgba(255,255,255,.9) 0,rgba(255,255,255,.22) 22%,rgba(255,255,255,.06) 60%,rgba(255,255,255,.32) 100%);box-shadow:inset 0 -6px 12px rgba(120,220,255,.28)}
    @keyframes gip-rise{0%{transform:translate3d(0,0,0) scale(.9);opacity:0}8%{opacity:.9}50%{transform:translate3d(34px,-62vh,0) scale(1)}100%{transform:translate3d(-24px,-128vh,0) scale(1.05);opacity:0}}
    .gip-fx .a{position:absolute;width:62vw;height:38vh;border-radius:50%;filter:blur(70px);opacity:.55;animation:gip-drift ease-in-out infinite alternate;will-change:transform}
    @keyframes gip-drift{from{transform:translate3d(-8vw,0,0) rotate(-6deg)}to{transform:translate3d(12vw,7vh,0) rotate(8deg)}}
    html.gip-hidden .gip-fx *{animation-play-state:paused}
    @media (prefers-reduced-motion:reduce){.gip-fx .b,.gip-fx .a{animation:none;opacity:.25}}
    .app .composer-box.gip-typing{box-shadow:0 0 0 2px hsl(var(--gip-h,205) 90% 60%/.45),0 0 18px hsl(var(--gip-h,205) 90% 60%/.55) !important}
    html.gip-others-typing .app .main-head{box-shadow:inset 0 -3px 0 hsl(var(--gip-h,205) 90% 60%/.85),0 8px 16px -8px hsl(var(--gip-h,205) 90% 60%/.7) !important}
    .gip-ring{position:fixed;z-index:2147483000;pointer-events:none;overflow:hidden;border:2px solid hsl(var(--gip-h,205) 95% 62%/.9);
      box-shadow:0 0 14px hsl(var(--gip-h,205) 95% 62%/.7);animation:gip-ring .55s ease-out forwards}
    .gip-ring::before{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.75) 50%,transparent 70%);transform:translateX(-100%);animation:gip-sweep .45s ease-out forwards}
    @keyframes gip-ring{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.045)}}
    @keyframes gip-sweep{to{transform:translateX(100%)}}
  `;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---- time of day ----
  const hex = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]; };
  const rgba = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s).slice(1)[0].split(',').map(Number); return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1]; };
  const col = (c) => (c[0] === '#' ? hex(c) : rgba(c));
  const KEYS = [ // hour, top, mid, low, grass, glow, hill1, hill2
    [0, '#050b24', '#0b1d4a', '#123055', '#0f3a3a', 'rgba(160,190,255,.35)', '#1f7a5a', '#0c3d33'],
    [5.5, '#243a7a', '#d98aa0', '#ffc9a0', '#7fb04a', 'rgba(255,200,160,.7)', '#9ed06a', '#3f7a2a'],
    [8, '#3a8fe0', '#8ccdf0', '#d8f0f0', '#8fd45a', 'rgba(255,255,230,.8)', '#b6ee6e', '#4fa82a'],
    [12, '#1e8fe0', '#6cc8f2', '#bdeaf0', '#8fd45a', 'rgba(255,255,255,.75)', '#b6ee6e', '#4fa82a'],
    [17, '#2f7fd0', '#f0b27a', '#ffd9a0', '#8fbf48', 'rgba(255,220,150,.8)', '#c8e060', '#5a9a28'],
    [19.5, '#2a2a6a', '#b05a8a', '#f08a6a', '#4a7a40', 'rgba(255,150,120,.6)', '#6a9a4a', '#2a5a2a'],
    [22, '#0a1238', '#14275a', '#1b3a5e', '#14403a', 'rgba(170,195,255,.35)', '#24805e', '#0f4538'],
    [24, '#050b24', '#0b1d4a', '#123055', '#0f3a3a', 'rgba(160,190,255,.35)', '#1f7a5a', '#0c3d33'],
  ];
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const fmt = (c) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(2)})`;
  const NAMES = ['top', 'mid', 'low', 'grass', 'glow', 'hill1', 'hill2'];
  function skyAt(d) {
    const h = d.getHours() + d.getMinutes() / 60; let i = 0;
    while (i < KEYS.length - 2 && h >= KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], t = (h - a[0]) / (b[0] - a[0]);
    const out = {}; NAMES.forEach((n, k) => { out[n] = fmt(mix(col(a[k + 1]), col(b[k + 1]), t)); }); return out;
  }
  function setSky() {
    const r = document.documentElement.style;
    if (!opt('tod', true)) { NAMES.forEach(n => r.removeProperty('--gip-tod-' + n)); return; }
    const s = skyAt(new Date()); NAMES.forEach(n => r.setProperty('--gip-tod-' + n, s[n]));
  }

  // ---- animated background ----
  let layer = null;
  function buildLayer() {
    const mode = opt('bg', 'bubbles');
    if (layer) { layer.remove(); layer = null; }
    if (mode === 'off') return;
    layer = document.createElement('div'); layer.className = 'gip-fx'; layer.setAttribute('aria-hidden', 'true');
    if (mode === 'bubbles' || mode === 'both') {
      for (let i = 0; i < 14; i++) {
        const b = document.createElement('span'); b.className = 'b'; const sz = rnd(24, 130);
        b.style.cssText = `width:${sz}px;height:${sz}px;left:${rnd(0, 96)}%;animation-duration:${rnd(16, 42)}s;animation-delay:-${rnd(0, 40)}s`;
        layer.appendChild(b);
      }
    }
    if (mode === 'aurora' || mode === 'both') {
      [['hsl(var(--gip-h,205) 95% 60%/.55)', '2%', '-4%', 24], ['hsl(150 90% 55%/.45)', '30%', '34%', 31], ['hsl(285 80% 65%/.4)', '-6%', '56%', 38]].forEach(([c, l, t, d]) => {
        const a = document.createElement('span'); a.className = 'a';
        a.style.cssText = `background:${c};left:${l};top:${t};animation-duration:${d}s`; layer.appendChild(a);
      });
    }
    ensure();
  }
  function ensure() {
    if (!layer) return;
    const app = document.querySelector('.app');
    if (app && layer.parentElement !== app) app.insertBefore(layer, app.firstChild);
  }

  // ---- send ring + typing glow ----
  function ring(box) {
    if (!opt('pop', true) || !box || !box.isConnected) return;
    const r = box.getBoundingClientRect(); if (!r.width) return;
    const d = document.createElement('div'); d.className = 'gip-ring';
    d.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${getComputedStyle(box).borderRadius}`;
    document.body.appendChild(d); setTimeout(() => d.remove(), 650);
  }
  const hasText = (t) => ((t.value !== undefined ? t.value : t.textContent) || '').trim().length > 0;
  const onKey = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.isComposing) return;
    const t = e.target; const box = t && t.closest && t.closest('.composer-box');
    if (box && hasText(t)) ring(box);
  };
  const onClick = (e) => {
    const b = e.target.closest && e.target.closest('button'); if (!b) return;
    const box = b.closest('.composer-box') || (b.closest('.main') && b.closest('.main').querySelector('.composer-box'));
    if (box && /send/i.test((b.getAttribute('aria-label') || '') + ' ' + (b.title || '') + ' ' + b.className)) ring(box);
  };
  let tTimer = null;
  const onInput = (e) => {
    if (!opt('typing', true)) return;
    const box = e.target && e.target.closest && e.target.closest('.composer-box'); if (!box) return;
    box.classList.add('gip-typing'); clearTimeout(tTimer);
    tTimer = setTimeout(() => document.querySelectorAll('.composer-box.gip-typing').forEach(b => b.classList.remove('gip-typing')), 1200);
  };
  function othersTyping() {
    let on = false;
    if (opt('typing', true)) {
      const t = document.querySelector('[class*="typing" i]');
      on = !!(t && t.offsetParent !== null && /typing/i.test(t.textContent || ''));
    }
    document.documentElement.classList.toggle('gip-others-typing', on);
  }
  const vis = () => document.documentElement.classList.toggle('gip-hidden', document.hidden);

  let style = null, timers = [];
  const fx = {
    id: 'gipfx', origin: 'gip', name: 'Visual Effects',
    description: 'Animated bubbles or aurora behind the app, a time-of-day sky, a glossy ring when you send and a glow while typing. Works best with the GIP++ Aero themes.',
    options: [
      { key: 'bg', label: 'Animated background', type: 'select', dflt: 'bubbles', choices: [['off', 'Off'], ['bubbles', 'Drifting bubbles'], ['aurora', 'Aurora'], ['both', 'Bubbles and aurora']], desc: 'Turn this off on slower computers. Shows behind the panels in GIP++ themes.' },
      { key: 'pop', label: 'Send animation', type: 'toggle', dflt: true, desc: 'A glossy ring flashes around the message box when you send.' },
      { key: 'typing', label: 'Typing glow', type: 'toggle', dflt: true, desc: 'The message box glows while you type, and the channel header glows while someone else is typing.' },
      { key: 'tod', label: 'Time-of-day sky', type: 'toggle', dflt: true, desc: 'Feeds your clock to the Time-of-day Aero theme.' },
    ],
    onOption(key) { if (key === 'bg') buildLayer(); if (key === 'tod') setSky(); if (key === 'typing') othersTyping(); },
    start() {
      if (style) return;
      style = document.createElement('style'); style.id = 'gipfx-style'; style.textContent = CSS; document.head.appendChild(style);
      buildLayer(); setSky(); vis();
      document.addEventListener('keydown', onKey, true); document.addEventListener('click', onClick, true);
      document.addEventListener('input', onInput, true); document.addEventListener('visibilitychange', vis);
      timers = [setInterval(ensure, 2000), setInterval(setSky, 60000), setInterval(othersTyping, 700)];
    },
    stop() {
      if (!style) return;
      style.remove(); style = null; timers.forEach(clearInterval); timers = [];
      if (layer) { layer.remove(); layer = null; }
      document.removeEventListener('keydown', onKey, true); document.removeEventListener('click', onClick, true);
      document.removeEventListener('input', onInput, true); document.removeEventListener('visibilitychange', vis);
      document.documentElement.classList.remove('gip-others-typing', 'gip-hidden');
      NAMES.forEach(n => document.documentElement.style.removeProperty('--gip-tod-' + n));
      document.querySelectorAll('.composer-box.gip-typing').forEach(b => b.classList.remove('gip-typing'));
    },
  };
  window.PluginHost.register(fx);
})();
