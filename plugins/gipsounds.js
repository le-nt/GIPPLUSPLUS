// GIP++ Sound Packs. Short synthesised sounds for new messages, sending, and people joining or leaving voice.
// All sounds are generated with Web Audio (no audio files, nothing is copied from any other product).
// Configured in its own tab: GIP++ > Sounds.
(function () {
  const Y = window.YapPlus; const KEY = 'gip.sounds.v1';
  const DEF = { pack: 'aero', vol: 60, recv: true, sent: true, join: false, leave: false };
  const load = () => { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return Object.assign({}, DEF); } };
  const save = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} };
  const PACKS = [['aero', 'Aero Glass', 'Soft glassy bells'], ['luna', 'Luna Bells', 'Warm early-2000s chimes'], ['im', 'Instant Messenger', 'Blips and sweeps'], ['retro', '8-bit', 'Square-wave arpeggios']];
  const EVENTS = [['recv', 'New message'], ['sent', 'Message sent'], ['join', 'Someone joins voice'], ['leave', 'Someone leaves voice']];

  // note: [freq, start s, length s, wave, gain, slideTo?]   sweep: ['n', start, len, f1, f2, gain] (filtered noise)
  const N = (f, t, d, w, g, f2) => [f, t, d, w || 'sine', g == null ? 0.6 : g, f2];
  const SOUNDS = {
    aero: {
      recv: [N(1318.5, 0, .5, 'bell'), N(1975.5, .12, .75, 'bell')],
      sent: [N(1568, 0, .28, 'bell', .5, 2093)],
      join: [N(1046.5, 0, .45, 'bell'), N(1318.5, .09, .45, 'bell'), N(1568, .18, .6, 'bell')],
      leave: [N(1568, 0, .4, 'bell'), N(1318.5, .09, .4, 'bell'), N(1046.5, .18, .6, 'bell')],
    },
    luna: {
      recv: [N(880, 0, .4, 'triangle'), N(1318.5, .16, .7, 'triangle')],
      sent: [N(1046.5, 0, .22, 'triangle', .5, 1318.5)],
      join: [N(587.3, 0, .3, 'triangle'), N(740, .1, .3, 'triangle'), N(880, .2, .3, 'triangle'), N(1174.7, .3, .55, 'triangle')],
      leave: [N(1174.7, 0, .3, 'triangle'), N(880, .1, .3, 'triangle'), N(740, .2, .3, 'triangle'), N(587.3, .3, .55, 'triangle')],
    },
    im: {
      recv: [N(880, 0, .09, 'square', .22), N(1175, .11, .14, 'square', .22)],
      sent: [['n', 0, .26, 300, 3200, .35]],
      join: [N(400, 0, .28, 'sine', .5, 1200)],
      leave: [N(1200, 0, .28, 'sine', .5, 400)],
    },
    retro: {
      recv: [N(988, 0, .07, 'square', .2), N(1319, .08, .07, 'square', .2), N(1568, .16, .12, 'square', .2)],
      sent: [N(1319, 0, .05, 'square', .2), N(1760, .06, .08, 'square', .2)],
      join: [N(523, 0, .07, 'square', .2), N(659, .08, .07, 'square', .2), N(784, .16, .07, 'square', .2), N(1047, .24, .12, 'square', .2)],
      leave: [N(1047, 0, .07, 'square', .2), N(784, .08, .07, 'square', .2), N(659, .16, .07, 'square', .2), N(523, .24, .12, 'square', .2)],
    },
  };

  let ctx = null;
  function getCtx() {
    if (ctx) return ctx; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; } return ctx;
  }
  function play(pack, ev, vol) {
    const set = SOUNDS[pack] && SOUNDS[pack][ev]; const c = getCtx(); if (!set || !c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    const master = c.createGain(); master.gain.value = Math.max(0, Math.min(1, (vol == null ? 60 : vol) / 100)) * 0.35; master.connect(c.destination);
    const t0 = c.currentTime + 0.02;
    set.forEach((n) => {
      if (n[0] === 'n') { // filtered noise sweep
        const [, st, len, f1, f2, g] = n; const buf = c.createBuffer(1, Math.ceil(c.sampleRate * len), c.sampleRate); const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource(); src.buffer = buf; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3;
        bp.frequency.setValueAtTime(f1, t0 + st); bp.frequency.exponentialRampToValueAtTime(f2, t0 + st + len);
        const gn = c.createGain(); gn.gain.setValueAtTime(0.0001, t0 + st); gn.gain.exponentialRampToValueAtTime(g, t0 + st + 0.04); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + st + len);
        src.connect(bp); bp.connect(gn); gn.connect(master); src.start(t0 + st); src.stop(t0 + st + len + 0.05); return;
      }
      const [f, st, len, wave, g, f2] = n; const partials = wave === 'bell' ? [[1, 1], [2.01, .35], [3.5, .12]] : [[1, 1]];
      partials.forEach(([mul, pg]) => {
        const o = c.createOscillator(); o.type = wave === 'bell' ? 'sine' : wave; o.frequency.setValueAtTime(f * mul, t0 + st);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2 * mul, t0 + st + len);
        const gn = c.createGain(); gn.gain.setValueAtTime(0.0001, t0 + st); gn.gain.exponentialRampToValueAtTime(g * pg, t0 + st + 0.006); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + st + len);
        o.connect(gn); gn.connect(master); o.start(t0 + st); o.stop(t0 + st + len + 0.05);
      });
    });
  }

  // ---- event detection (best effort: Yappin has no public events, so this watches the page) ----
  const MSG = '.msg[data-message-id]';
  let obs = null, timer = null, lastSent = 0, ignoreUntil = 0, lastHref = '', lastVoice = null, lastPlay = {}, seen = new Set(), gesture = null, keyH = null, clickH = null;
  const fire = (ev) => {
    const c = load(); if (!c[ev] || !c.pack) return; const now = Date.now();
    if (now - (lastPlay[ev] || 0) < 250) return; lastPlay[ev] = now; play(c.pack, ev, c.vol);
  };
  const hasText = (t) => ((t.value !== undefined ? t.value : t.textContent) || '').trim().length > 0;
  function onMutations(list) {
    const fresh = [];
    list.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.matches && n.matches(MSG)) fresh.push(n); else if (n.querySelectorAll) n.querySelectorAll(MSG).forEach(x => fresh.push(x));
    }));
    if (!fresh.length) return;
    const ids = fresh.map(x => x.getAttribute('data-message-id')).filter(id => id && !seen.has(id));
    ids.forEach(id => seen.add(id)); if (seen.size > 3000) seen = new Set(Array.from(seen).slice(-1500));
    const now = Date.now();
    if (ids.length > 3 || now < ignoreUntil || now - lastSent < 2000 || !ids.length) return; // history loading, channel switch, or my own message
    fire('recv');
  }
  function poll() {
    if (location.href !== lastHref) { lastHref = location.href; ignoreUntil = Date.now() + 1800; lastVoice = null; }
    const n = Array.prototype.reduce.call(document.querySelectorAll('.voice-people'), (a, el) => a + el.children.length, 0);
    if (lastVoice !== null && Date.now() > ignoreUntil) {
      const d = n - lastVoice; if (d !== 0 && Math.abs(d) <= 3) fire(d > 0 ? 'join' : 'leave');
    }
    lastVoice = n;
  }
  const sounds = {
    id: 'gipsounds', origin: 'gip', name: 'Sound Packs',
    description: 'Plays short synthesised sounds for new messages, sending, and people joining or leaving voice. Pick a pack in the Sounds tab.',
    start() {
      if (obs) return; lastHref = location.href; ignoreUntil = Date.now() + 1800;
      document.querySelectorAll(MSG).forEach(x => seen.add(x.getAttribute('data-message-id')));
      obs = new MutationObserver(onMutations); obs.observe(document.body, { childList: true, subtree: true });
      timer = setInterval(poll, 800);
      keyH = (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.isComposing) { const t = e.target; if (t && t.closest && t.closest('.composer-box') && hasText(t)) { lastSent = Date.now(); fire('sent'); } } };
      clickH = (e) => { const b = e.target.closest && e.target.closest('button'); if (b && b.closest('.main') && /send/i.test((b.getAttribute('aria-label') || '') + ' ' + (b.title || '') + ' ' + b.className)) { lastSent = Date.now(); fire('sent'); } };
      gesture = () => { if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); };
      document.addEventListener('keydown', keyH, true); document.addEventListener('click', clickH, true);
      ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, gesture, true));
    },
    stop() {
      if (!obs) return; obs.disconnect(); obs = null; clearInterval(timer); timer = null;
      document.removeEventListener('keydown', keyH, true); document.removeEventListener('click', clickH, true);
      ['pointerdown', 'keydown'].forEach(t => document.removeEventListener(t, gesture, true));
    },
  };
  // ---- the Sounds tab (registered before the plugin so it always shows up) ----
  Y.registerTab('sounds', 'Sounds', function (ui) {
    const { el, sw, group } = ui; const root = el('div'); const cfg = load();
    const on = group('Sound packs', 'gip', 'Separate from themes: pick any pack with any theme. Sounds are synthesised, so there is nothing to download.');
    on.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, 'Play sounds', Y.tag('gip')), el('div', { class: 'gp-desc', text: 'Master switch for this feature.' })),
      sw(Y.PluginHost.isEnabled(sounds), (v) => Y.PluginHost.setEnabled(sounds, v))));
    const chips = el('div', { class: 'gp-chips' });
    PACKS.forEach(([id, label, desc]) => {
      const b = el('button', { class: 'gp-chip' + (cfg.pack === id ? ' on' : ''), title: desc, text: label });
      b.addEventListener('click', () => { cfg.pack = id; save(cfg); chips.querySelectorAll('.gp-chip').forEach(x => x.classList.toggle('on', x === b)); play(id, 'recv', cfg.vol); });
      chips.appendChild(b);
    });
    on.append(el('div', { class: 'gp-name', text: 'Pack' }), chips);
    const vol = el('input', { type: 'range', min: 0, max: 100, step: 5, 'aria-label': 'Sound volume', style: 'flex:1' }); vol.value = cfg.vol;
    const vl = el('span', { class: 'gp-ver', text: cfg.vol + '%', style: 'min-width:44px;text-align:right' });
    vol.addEventListener('input', () => { cfg.vol = Number(vol.value); vl.textContent = cfg.vol + '%'; save(cfg); });
    vol.addEventListener('change', () => play(cfg.pack, 'recv', cfg.vol));
    on.append(el('div', { class: 'gp-name', text: 'Volume' }), el('div', { class: 'gp-line' }, vol, vl));
    root.appendChild(on);

    const ev = group('When to play', 'gip');
    EVENTS.forEach(([id, label]) => {
      const test = el('button', { class: 'gp-x', text: 'Test' }); test.addEventListener('click', () => play(cfg.pack, id, cfg.vol));
      const exp = id === 'join' || id === 'leave';
      ev.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, label, Y.tag('gip')),
        el('div', { class: 'gp-desc', text: exp ? 'Experimental. Watches the voice lists in the sidebar, so it can fire for any visible voice channel.' : (id === 'recv' ? 'Plays for new messages from other people in the channel you have open.' : 'Plays when you press Enter or the send button.') })),
        el('div', { class: 'gp-line' }, test, sw(cfg[id], (v) => { cfg[id] = v; save(cfg); }))));
    });
    root.appendChild(ev);
    return root;
  });
  window.PluginHost.register(sounds);
})();
