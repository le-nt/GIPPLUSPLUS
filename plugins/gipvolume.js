// GIP++ Volume Fix + Voice Direction.
// Fixes Yappin's OWN volume controls (the "User volume" slider in the right-click menu on a person in voice,
// and the stream volume slider). No extra mixer: the controls that are already there now work 0 to 200%.
// Every remote voice/stream is routed through a Web Audio GainNode (an <audio> element caps at 100%).
// Adds a "Direction" slider to the person's right-click menu (like TeamSpeak positional audio). Best with headphones.
const gipvolume = {
  id: 'gipvolume',
  origin: 'gip',
  name: 'Volume Fix + Voice Direction',
  description: 'Makes the built-in user and stream volume sliders work (0 to 200%) and adds a Direction slider to the person menu in voice.',
  entries: new Map(),
  ctx: null, d: null, timer: null, seq: 0,
  store: 'yapplus.gipvol.v2',
  pending: null, nudging: false, obs: null, handlers: null,

  clamp(v, max) { v = Number(v); return Number.isFinite(v) ? Math.min(max, Math.max(0, v)) : 0; },
  loadPrefs() { try { return JSON.parse(localStorage.getItem(this.store)) || {}; } catch (e) { return {}; } },
  getPref(key) { return key ? (this.loadPrefs()[key] || {}) : {}; },
  savePref(key, patch) {
    if (!key) return;
    try {
      const all = this.loadPrefs();
      const cur = Object.assign(all[key] || {}, patch);
      Object.keys(cur).forEach(k => { if (cur[k] === null || cur[k] === undefined) delete cur[k]; });
      if (Object.keys(cur).length) all[key] = cur; else delete all[key];
      localStorage.setItem(this.store, JSON.stringify(all));
    } catch (e) {}
  },
  getCtx() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { this.ctx = new AC({ latencyHint: 'interactive' }); this.ctx.addEventListener('statechange', () => this.syncEngaged()); } catch (e) { return null; }
    return this.ctx;
  },

  installHooks() {
    if (this.d) return;
    const self = this;
    const proto = HTMLMediaElement.prototype;
    this.d = {
      volume: Object.getOwnPropertyDescriptor(proto, 'volume'),
      muted: Object.getOwnPropertyDescriptor(proto, 'muted'),
      srcObject: Object.getOwnPropertyDescriptor(proto, 'srcObject'),
      play: proto.play,
    };
    const d = this.d;
    Object.defineProperty(proto, 'volume', {
      configurable: true, enumerable: true,
      get() { const e = self.entries.get(this); return e ? Math.min(1, e.siteVol) : d.volume.get.call(this); },
      set(v) {
        const e = self.entries.get(this);
        if (!e) return d.volume.set.call(this, v);
        v = Number(v);
        if (!Number.isFinite(v) || v < 0) throw new DOMException('The volume provided is outside the range.', 'IndexSizeError');
        e.siteVol = Math.min(4, v);
        if (!e.engaged) d.volume.set.call(this, Math.min(1, v));
        self.bindPending(e);
        self.applyGain(e);
      },
    });
    Object.defineProperty(proto, 'muted', {
      configurable: true, enumerable: true,
      get() { const e = self.entries.get(this); return e ? e.siteMuted : d.muted.get.call(this); },
      set(v) {
        const e = self.entries.get(this);
        if (!e) return d.muted.set.call(this, v);
        e.siteMuted = !!v;
        if (!e.engaged) d.muted.set.call(this, !!v);
        self.applyGain(e);
      },
    });
    if (d.srcObject && d.srcObject.set) {
      Object.defineProperty(proto, 'srcObject', {
        configurable: true, enumerable: d.srcObject.enumerable,
        get() { return d.srcObject.get.call(this); },
        set(v) { d.srcObject.set.call(this, v); const el = this; setTimeout(() => { try { self.consider(el); } catch (e) {} }, 0); },
      });
    }
    proto.play = function () { try { self.consider(this); } catch (e) {} return d.play.apply(this, arguments); };
  },
  unhook() {
    if (!this.d) return;
    const proto = HTMLMediaElement.prototype;
    Object.defineProperty(proto, 'volume', this.d.volume);
    Object.defineProperty(proto, 'muted', this.d.muted);
    if (this.d.srcObject) Object.defineProperty(proto, 'srcObject', this.d.srcObject);
    proto.play = this.d.play;
    this.d = null;
  },

  consider(el) {
    if (!this.d || !el || !(el instanceof HTMLMediaElement)) return;
    const stream = this.d.srcObject.get.call(el);
    const existing = this.entries.get(el);
    if (!stream || typeof stream.getAudioTracks !== 'function') { if (existing) this.drop(el); return; }
    const audio = stream.getAudioTracks().filter(t => t.readyState === 'live');
    if (!audio.length) { if (existing) this.drop(el); return; }
    const ids = audio.map(t => t.id).join(',');
    if (existing) { if (existing.stream === stream && existing.ids === ids) return; this.drop(el); }
    const ctx = this.getCtx();
    if (!ctx) return;
    const e = {
      el, stream, ids,
      siteVol: this.clamp(this.d.volume.get.call(el), 4),
      siteMuted: !!this.d.muted.get.call(el),
      override: null, pan: 0, key: '', label: '', n: ++this.seq,
      kind: (el.tagName === 'VIDEO' && stream.getVideoTracks().length) ? 'stream' : 'voice',
      engaged: false, src: null, gain: null, panner: null,
    };
    try {
      e.src = ctx.createMediaStreamSource(new MediaStream(audio));
      e.gain = ctx.createGain(); e.gain.gain.value = 0;
      e.src.connect(e.gain); e.gain.connect(ctx.destination);
    } catch (err) { return; }
    this.entries.set(el, e);
    this.relabel(e);
    this.engage(e);
  },
  engage(e) {
    if (e.engaged || !this.ctx || this.ctx.state !== 'running') return;
    this.d.muted.set.call(e.el, true);
    e.engaged = true;
    this.applyGain(e, true);
  },
  release(e) {
    if (e.engaged) {
      e.engaged = false;
      try { this.d.muted.set.call(e.el, e.siteMuted); this.d.volume.set.call(e.el, Math.min(1, e.override == null ? e.siteVol : e.override)); } catch (err) {}
    }
    this.applyGain(e, true);
  },
  syncEngaged() { const running = this.ctx && this.ctx.state === 'running'; this.entries.forEach(e => { if (running) this.engage(e); else this.release(e); }); },
  level(e) { return e.override == null ? e.siteVol : e.override; },
  applyGain(e, instant) {
    if (!e.gain || !this.ctx) return;
    const g = e.engaged && !e.siteMuted ? this.level(e) : 0;
    try { if (instant) e.gain.gain.value = g; else e.gain.gain.setTargetAtTime(g, this.ctx.currentTime, 0.012); } catch (err) {}
  },
  route(e) {
    if (!e.gain || !this.ctx) return;
    try { e.gain.disconnect(); } catch (err) {}
    if (e.panner) { try { e.panner.disconnect(); } catch (err) {} }
    if (e.pan) {
      if (!e.panner) {
        const p = this.ctx.createPanner();
        p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 1; p.maxDistance = 10; p.rolloffFactor = 0;
        e.panner = p;
      }
      const r = e.pan * Math.PI / 180, x = Math.sin(r), z = -Math.cos(r);
      if (e.panner.positionX) { e.panner.positionX.value = x; e.panner.positionY.value = 0; e.panner.positionZ.value = z; }
      else e.panner.setPosition(x, 0, z);
      e.gain.connect(e.panner); e.panner.connect(this.ctx.destination);
    } else e.gain.connect(this.ctx.destination);
  },
  setPan(e, deg) { e.pan = Math.round(deg) || 0; this.route(e); },
  drop(el) {
    const e = this.entries.get(el); if (!e) return;
    this.release(e); this.entries.delete(el);
    try { e.src.disconnect(); e.gain.disconnect(); if (e.panner) e.panner.disconnect(); } catch (err) {}
  },
  dropAll() { Array.from(this.entries.keys()).forEach(el => this.drop(el)); },

  goodName(v) {
    if (typeof v !== 'string') return false;
    v = v.trim();
    return v.length > 0 && v.length <= 32 && !/\n/.test(v) && !/volume|mute|deafen|button|settings|slider|screen|stream$/i.test(v);
  },
  findName(el) {
    let node = el;
    for (let depth = 0; node && depth < 8 && node !== document.body; depth++, node = node.parentElement) {
      if (node.querySelectorAll('audio,video').length > 1) break;
      for (const a of ['data-username', 'data-user-name', 'data-display-name', 'data-name', 'aria-label', 'title']) {
        const v = node.getAttribute && node.getAttribute(a);
        if (this.goodName(v)) return v.trim();
      }
      const c = node.querySelector && node.querySelector('[data-username],[class*="name" i],[class*="user" i],[class*="author" i]');
      if (c && !c.contains(el) && this.goodName(c.textContent)) return c.textContent.trim();
    }
    return '';
  },
  adopt(e, key, label) {
    if (!key || e.key === key) return;
    e.key = key; e.label = label || key;
    const p = this.getPref(key);
    if (e.override == null && p.vol != null) e.override = this.clamp(p.vol, 2);
    if (p.pan != null && !e.pan) { e.pan = p.pan; this.route(e); }
    this.applyGain(e);
  },
  relabel(e) {
    if (e.key) return;
    let found = ''; try { found = this.findName(e.el); } catch (err) {}
    if (found) this.adopt(e, (e.kind === 'stream' ? 's:' : 'u:') + found, found);
    else if (!e.label) e.label = (e.kind === 'stream' ? 'Stream ' : 'Voice ') + e.n;
  },

  // The slider that moves is remembered; the next element.volume write the site makes tells us which audio element is that person.
  menuName(menu) { const b = menu.querySelector('button'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : ''; },
  streamEntries(range) {
    let n = range;
    for (let i = 0; n && i < 10; i++, n = n.parentElement) {
      const els = n.querySelectorAll ? n.querySelectorAll('video,audio') : [];
      if (els.length) return Array.from(els).map(el => this.entries.get(el)).filter(Boolean);
    }
    return [];
  },
  onSliderInput(ev) {
    const t = ev.target;
    if (!(t instanceof HTMLInputElement) || t.type !== 'range') return;
    const label = t.getAttribute('aria-label');
    let p = null;
    if (label === 'User volume') {
      const menu = t.closest('.ctx-menu'); const name = menu ? this.menuName(menu) : '';
      if (!name) return;
      p = { kind: 'user', key: 'u:' + name, name, value: Number(t.value) };
    } else if (label === 'Stream volume') {
      const es = this.streamEntries(t);
      const name = es.length ? (es[0].key ? es[0].label : '') : '';
      p = { kind: 'stream', key: 's:' + (name || 'stream'), name: name || 'stream', value: Number(t.value) };
      p.direct = es;
    } else return;
    p.t = performance.now(); p.synthetic = this.nudging;
    this.pending = p;
    if (p.direct) p.direct.forEach(e => this.bind(e, p));
  },
  bindPending(e) {
    const p = this.pending;
    if (!p || performance.now() - p.t > 600) return;
    if (p.kind === 'user' && e.kind === 'stream') return;
    this.bind(e, p);
  },
  bind(e, p) {
    if (!e.key || e.key !== p.key) { e.key = ''; this.adopt(e, p.key, p.name); }
    if (!p.synthetic) { e.override = this.clamp(p.value / 100, 2); this.savePref(p.key, { vol: e.override }); this.applyGain(e); }
    p.bound = e;
  },
  setSlider(range, value) {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(range, String(value));
    range.dispatchEvent(new Event('input', { bubbles: true }));
  },
  nudge(range) {
    const v = Number(range.value);
    const alt = v >= Number(range.max || 200) ? v - 1 : v + 1;
    this.nudging = true;
    try { this.setSlider(range, alt); this.setSlider(range, v); } finally { this.nudging = false; }
  },
  fmtPan(deg) { const a = Math.abs(deg); if (!deg) return 'Center'; if (a >= 170) return 'Behind'; return (deg < 0 ? 'Left ' : 'Right ') + a + '\u00b0'; },
  entriesFor(key) { return Array.from(this.entries.values()).filter(e => e.key === key); },
  decorateMenu(menu) {
    if (menu.dataset.gipvol) return;
    const range = menu.querySelector('input[aria-label="User volume"]');
    if (!range) return;
    menu.dataset.gipvol = '1';
    const name = this.menuName(menu);
    if (!name) return;
    const key = 'u:' + name;
    const slot = range.closest('.menu-slider') || range.parentElement;
    if (!this.entriesFor(key).length) this.nudge(range);
    const stored = this.getPref(key);
    if (stored.vol != null && Math.round(stored.vol * 100) !== Number(range.value)) this.setSlider(range, Math.round(stored.vol * 100));

    const box = document.createElement('div'); box.className = 'menu-slider gip-pan';
    const hint = document.createElement('div'); hint.className = 'hint';
    hint.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
    const l = document.createElement('span'); l.textContent = 'Direction'; l.appendChild(window.YapPlus.tag('gip'));
    const r = document.createElement('span'); hint.append(l, r);
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = -180; inp.max = 180; inp.step = 5; inp.setAttribute('aria-label', 'Voice direction');
    inp.title = 'Where this person\u2019s voice comes from. Double-click to centre. Best with headphones.';
    inp.value = stored.pan || 0; r.textContent = this.fmtPan(Number(inp.value));
    inp.addEventListener('input', () => {
      const deg = Number(inp.value);
      r.textContent = this.fmtPan(deg);
      this.savePref(key, { pan: deg || null });
      this.entriesFor(key).forEach(e => this.setPan(e, deg));
    });
    inp.addEventListener('dblclick', () => { inp.value = 0; inp.dispatchEvent(new Event('input')); });
    box.append(hint, inp);
    slot.insertAdjacentElement('afterend', box);
    const keep = new MutationObserver(() => { if (!box.isConnected && menu.isConnected) slot.insertAdjacentElement('afterend', box); });
    keep.observe(menu, { childList: true, subtree: false });
  },
  onMenuClick(ev) {
    const b = ev.target.closest && ev.target.closest('.ctx-menu button');
    if (!b || !/reset volume/i.test(b.textContent)) return;
    const menu = b.closest('.ctx-menu'); const name = this.menuName(menu);
    if (!name) return;
    const key = 'u:' + name;
    this.savePref(key, { vol: null });
    this.entriesFor(key).forEach(e => { e.override = null; this.applyGain(e); });
    this.pending = null;
  },
  decorateStreams() {
    document.querySelectorAll('.ss-vol input[aria-label="Stream volume"]').forEach(range => {
      if (range.dataset.gipvol) return;
      const es = this.streamEntries(range);
      range.dataset.gipvol = '1';
      // Yappin may play a stream's sound on a separate <audio> element, so with no entry here we learn it from the site's next volume write.
      const key = (es[0] && es[0].key) || 's:stream'; const stored = this.getPref(key);
      if (stored.vol != null && Math.round(stored.vol * 100) !== Number(range.value)) {
        this.pending = { kind: 'stream', key, name: (es[0] && es[0].label) || 'stream', value: stored.vol * 100, t: performance.now(), synthetic: false, direct: es };
        es.forEach(x => this.bind(x, this.pending));
        this.setSlider(range, Math.round(stored.vol * 100));
      } else this.nudge(range);
    });
  },
  scan() {
    document.querySelectorAll('.ctx-menu').forEach(m => { try { this.decorateMenu(m); } catch (e) { console.error('[GIP++ volume]', e); } });
    try { this.decorateStreams(); } catch (e) {}
  },
  tick() {
    if (!this.d) return;
    document.querySelectorAll('audio,video').forEach(el => { try { this.consider(el); } catch (e) {} });
    this.entries.forEach((e, el) => { if (!el.isConnected && el.paused) { this.drop(el); return; } this.relabel(e); });
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  },
  debug() {
    const out = { audioContext: this.ctx ? this.ctx.state : 'none',
      entries: Array.from(this.entries.values()).map(e => ({ kind: e.kind, key: e.key, label: e.label, engaged: e.engaged, siteVol: e.siteVol, override: e.override, pan: e.pan, siteMuted: e.siteMuted })),
      saved: this.loadPrefs() };
    console.log('[GIP++ Volume]', out); return out;
  },
  start() {
    if (this.timer) return;
    this.installHooks();
    const self = this;
    this.handlers = {
      input: (ev) => { try { self.onSliderInput(ev); } catch (e) {} },
      click: (ev) => { try { self.onMenuClick(ev); } catch (e) {} },
      gesture: () => { if (self.ctx && self.ctx.state === 'suspended') self.ctx.resume().catch(() => {}); },
    };
    document.addEventListener('input', this.handlers.input, true);
    document.addEventListener('click', this.handlers.click, true);
    ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, this.handlers.gesture, true));
    this.obs = new MutationObserver(() => this.scan());
    this.obs.observe(document.body, { childList: true, subtree: true });
    this.timer = setInterval(() => this.tick(), 1000);
    this.tick(); this.scan();
    window.YapPlus.volume = this;
    console.log('[GIP++ Volume] armed');
  },
  stop() {
    clearInterval(this.timer); this.timer = null;
    if (this.obs) { this.obs.disconnect(); this.obs = null; }
    if (this.handlers) {
      document.removeEventListener('input', this.handlers.input, true);
      document.removeEventListener('click', this.handlers.click, true);
      ['pointerdown', 'keydown'].forEach(t => document.removeEventListener(t, this.handlers.gesture, true));
      this.handlers = null;
    }
    document.querySelectorAll('.gip-pan').forEach(n => n.remove());
    document.querySelectorAll('[data-gipvol]').forEach(n => delete n.dataset.gipvol);
    this.dropAll(); this.unhook();
    if (this.ctx) { try { this.ctx.close(); } catch (e) {} this.ctx = null; }
    console.log('[GIP++ Volume] disarmed');
  },
};
window.PluginHost.register(gipvolume);
