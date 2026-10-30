// GIP++ Keep Stream Audio When Deafened.
// Deafening yourself should silence voice chat, not the stream you are watching. While you are deafened this puts any
// stream (a video with its own sound) back to the volume and mute state you had chosen for it. Muting or changing the
// stream yourself, with its own controls, still works while deafened.
// How it knows you are deafened: the Deafen button says so, or every voice (non-stream) sound is muted at once.
const gipstreamaudio = {
  id: 'gipstreamaudio',
  origin: 'gip',
  name: 'Keep Stream Audio When Deafened',
  description: 'When you deafen yourself, people in voice go quiet but the stream you are watching keeps playing. Mute the stream itself with its own controls.',
  intent: new WeakMap(), lastClick: { t: 0, target: null }, guard: false, timer: null, h: null, cache: { t: 0, v: false },

  isStream(el) {
    try {
      if (!(el instanceof HTMLVideoElement)) return false;
      const s = el.srcObject; return !!(s && typeof s.getAudioTracks === 'function' && s.getAudioTracks().length && s.getVideoTracks().length);
    } catch (e) { return false; }
  },
  mediaEls() { return Array.from(document.querySelectorAll('audio,video')); },
  deafButtons() {
    return Array.from(document.querySelectorAll('button,[role="button"]')).filter(b => /deafen/i.test((b.getAttribute('aria-label') || '') + ' ' + (b.title || '')));
  },
  isDeafenControl(node) {
    const b = node && node.closest && node.closest('button,[role="button"]');
    return !!(b && /deafen/i.test((b.getAttribute('aria-label') || '') + ' ' + (b.title || '')));
  },
  // True when the Deafen button is switched on, or when every voice sound is muted at the same time.
  deafened(fresh) {
    const now = performance.now(); if (!fresh && now - this.cache.t < 150) return this.cache.v;
    let v = false;
    const btns = this.deafButtons();
    if (btns.length) {
      v = btns.some(b => /\b(un-?deafen|stop deafen|remove deafen|turn off deafen)/i.test((b.getAttribute('aria-label') || '') + ' ' + (b.title || '')) || b.getAttribute('aria-pressed') === 'true');
    }
    if (!v) {
      const voice = this.mediaEls().filter(el => { try { const s = el.srcObject; return s && typeof s.getAudioTracks === 'function' && s.getAudioTracks().length && !this.isStream(el); } catch (e) { return false; } });
      v = voice.length > 0 && voice.every(el => el.muted || el.volume === 0);
    }
    this.cache = { t: now, v }; return v;
  },
  clickedInside(el) {
    if (performance.now() - this.lastClick.t > 500 || !this.lastClick.target) return false;
    let n = this.lastClick.target;
    for (let i = 0; n && i < 9; i++, n = n.parentElement) { if (n.contains && n.contains(el) && n.querySelectorAll('video').length === 1) return true; }
    return false;
  },
  // What you chose for this stream. A mute counts only when you clicked it: Yappin muting everything on deafen must not be mistaken for your choice.
  record(el, byUser) {
    const prev = this.intent.get(el) || { muted: false, volume: el.volume > 0 ? el.volume : 1 };
    this.intent.set(el, {
      muted: byUser ? !!el.muted : (el.muted ? prev.muted : false),
      volume: (byUser || el.volume > 0) ? el.volume : prev.volume,
    });
  },
  enforce(el, fresh) {
    if (this.guard || !this.isStream(el)) return;
    const deaf = this.deafened(fresh); const byUser = this.clickedInside(el);
    if (!deaf || byUser) { this.record(el, byUser); return; }
    const it = this.intent.get(el) || { muted: false, volume: el.volume > 0 ? el.volume : 1 };
    this.guard = true;
    try {
      if (el.muted !== it.muted) el.muted = it.muted;
      if (Math.abs(el.volume - it.volume) > 0.001) el.volume = Math.min(1, Math.max(0, it.volume));
      el.srcObject.getAudioTracks().forEach(t => { if (!t.enabled && !it.muted) t.enabled = true; });
      if (el.paused && !el.ended && el.__gipWasPlaying) { const pr = el.play(); if (pr && pr.catch) pr.catch(() => {}); }
    } catch (e) {} finally { this.guard = false; }
  },
  sweep() { this.mediaEls().forEach(el => { if (this.isStream(el)) { if (!el.paused) el.__gipWasPlaying = true; this.enforce(el); } }); },
  debug() {
    return { deafened: this.deafened(), deafenButtons: this.deafButtons().map(b => (b.getAttribute('aria-label') || b.title || '') + (b.getAttribute('aria-pressed') ? ' [pressed=' + b.getAttribute('aria-pressed') + ']' : '')), streams: this.mediaEls().filter(e => this.isStream(e)).length };
  },
  start() {
    if (this.h) return; const self = this;
    this.h = {
      vol: (e) => { try { if (e.target && e.target.tagName === 'VIDEO') self.enforce(e.target, true); } catch (err) {} },
      user: (e) => { if (self.isDeafenControl(e.target)) return; self.lastClick = { t: performance.now(), target: e.target }; },
    };
    document.addEventListener('volumechange', this.h.vol, true);
    ['pointerdown', 'click', 'input', 'change'].forEach(n => document.addEventListener(n, this.h.user, true));
    this.timer = setInterval(() => { try { this.sweep(); } catch (e) { window.YapPlus.report('gipstreamaudio', 'sweep', e); } }, 700);
    this.sweep();
  },
  stop() {
    if (!this.h) return;
    document.removeEventListener('volumechange', this.h.vol, true);
    ['pointerdown', 'click', 'input', 'change'].forEach(n => document.removeEventListener(n, this.h.user, true));
    clearInterval(this.timer); this.timer = null; this.h = null;
  },
};
window.PluginHost.register(gipstreamaudio);
