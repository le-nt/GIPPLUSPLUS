// GIP++ Sound Packs. Short synthesised sounds for new messages, sending, and people joining or leaving voice.
// All sounds are generated with Web Audio (no audio files, nothing is copied from any other product).
// Configured in its own tab: GIP++ > Sounds.
(function () {
  const Y = window.YapPlus; const KEY = 'gip.sounds.v1';
  const DEF = { pack: 'aero', vol: 60, recv: true, sent: true, join: false, leave: false, replace: true };
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

  // ---- events come from the shared GIP++ event bus (0core.js), so this plugin runs no page watcher of its own ----
  const ME = 'gipsounds';
  let lastPlay = {}, gesture = null, unsubs = [];
  const fire = (ev) => {
    const c = load(); if (!c[ev] || !c.pack) return; const now = Date.now();
    if (now - (lastPlay[ev] || 0) < 250) return; lastPlay[ev] = now; play(c.pack, ev, c.vol);
  };

  // ---- replacing Yappin's own sounds ----
  // While this plugin is on, the site's built-in short UI sounds are muted so the pack REPLACES them instead of playing on top.
  // Muted: short sounds the page plays from a detached Audio element, a hidden audio tag, or Web Audio, plus the OS ding on desktop
  // notifications. Never touched: voice chat, videos, voice messages, audio in chat, ringing and calls.
  // A sound whose name says it belongs to an event this pack plays (message, send, join, leave) is muted only while that event is
  // switched on in the Sounds tab. Everything else is muted while "Replace default sounds" is on.
  // If an old sound still plays, run __gipSoundLog in the DevTools console and send me what it shows.
  const REPL = { on: false, log: [] };
  window.__gipSoundLog = REPL.log;
  const note = (kind, what, muted) => { REPL.log.push({ t: new Date().toLocaleTimeString(), kind, what: String(what).slice(0, 160), muted }); if (REPL.log.length > 40) REPL.log.shift(); };
  function shouldMute(name) {
    const c = load(); if (!c.pack) return false;
    const cat = Y.uiSound.category(name);
    if (cat === 'keep') return false;
    if (cat) return !!c[cat];
    return !!c.replace;
  }
  function startReplace() {
    if (REPL.on) return; REPL.on = true;
    Y.patches.add(ME, HTMLMediaElement.prototype, 'play', (next) => function () {
      try {
        if (REPL.on && Y.uiSound.isUi(this)) {
          const name = this.currentSrc || this.src || this.id || this.className; const mute = shouldMute(name);
          note('audio', name, mute); if (mute) return Promise.resolve();
        }
      } catch (e) {}
      return next.apply(this, arguments);
    });
    const quiet = (node) => { try { node.disconnect(); } catch (e) {} node.connect = function (t) { return t; }; };
    if (window.AudioBufferSourceNode) Y.patches.add(ME, AudioBufferSourceNode.prototype, 'start', (next) => function () {
      try {
        const c = this.context;
        if (REPL.on && c !== ctx && !c.__gipKeep && !this.loop && this.buffer && this.buffer.duration < 3 && shouldMute('')) { note('buffer', this.buffer.duration.toFixed(2) + 's', true); quiet(this); }
      } catch (e) {}
      return next.apply(this, arguments);
    });
    if (window.OscillatorNode) Y.patches.add(ME, OscillatorNode.prototype, 'start', (next) => function () {
      try {
        const c = this.context;
        if (REPL.on && c !== ctx && !c.__gipKeep && shouldMute('')) { note('oscillator', this.frequency && this.frequency.value, true); quiet(this); }
      } catch (e) {}
      return next.apply(this, arguments);
    });
    if (window.Notification) Y.patches.add(ME, window, 'Notification', (next) => new Proxy(next, { construct(t, args, nt) {
      try { const c = load(); if (REPL.on && c.pack && c.recv && args[0] !== undefined) args = [args[0], Object.assign({}, args[1] || {}, { silent: true })]; } catch (e) {}
      return Reflect.construct(t, args, nt);
    } }));
  }
  function stopReplace() { REPL.on = false; Y.patches.removeOwner(ME); }
  const sounds = {
    id: 'gipsounds', origin: 'gip', name: 'Sound Packs',
    description: 'Plays short synthesised sounds for new messages, sending, and people joining or leaving voice, and mutes Yappin\u2019s own sounds so the pack replaces them. Pick a pack in the Sounds tab.',
    start() {
      if (unsubs.length) return; startReplace();
      unsubs = [
        Y.events.on('message', () => fire('recv'), ME),
        Y.events.on('sent', () => fire('sent'), ME),
        Y.events.on('voice', (v) => { if (Math.abs(v.delta) <= 3) fire(v.delta > 0 ? 'join' : 'leave'); }, ME),
      ];
      gesture = () => { if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); };
      ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, gesture, true));
    },
    stop() {
      if (!unsubs.length) return; stopReplace(); unsubs.forEach(f => f()); unsubs = [];
      ['pointerdown', 'keydown'].forEach(t => document.removeEventListener(t, gesture, true));
    },
  };
  // ---- the Sounds tab (registered before the plugin so it always shows up) ----
  Y.registerTab('sounds', 'Sounds', function (ui) {
    const { el, sw, group } = ui; const root = el('div'); const cfg = load();
    const on = group('Sound packs', 'gip', 'Separate from themes: pick any pack with any theme. Sounds are synthesised, so there is nothing to download.');
    on.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, 'Play sounds', Y.tag('gip')), el('div', { class: 'gp-desc', text: 'Master switch for this feature.' })),
      sw(Y.PluginHost.isEnabled(sounds), (v) => Y.PluginHost.setEnabled(sounds, v))));
    on.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, 'Replace default sounds', Y.tag('gip')), el('div', { class: 'gp-desc', text: 'Mutes Yappin\u2019s own built-in sounds (and the system ding on desktop notifications) so only the pack plays. Calls, ringing, voice chat and voice messages are never touched. Events you switch off below keep their default sound.' })),
      sw(cfg.replace, (v) => { cfg.replace = v; save(cfg); })));
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
