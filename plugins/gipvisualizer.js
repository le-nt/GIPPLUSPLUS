// GIP++ Visualizer. A small Winamp-style bar strip that moves with the people talking in your voice call.
// It listens to the call audio only to draw the bars. Nothing is recorded or sent anywhere, and the call sound is not changed.
(function () {
  const Y = window.YapPlus, ME = 'gipvisualizer';
  let ctx = null, taps = new Map(), canvas = null, raf = 0, offs = null, peaks = null, gesture = null;
  const SIZES = { small: [120, 32], medium: [180, 48], large: [260, 72] };
  const opt = (k, d) => Y.opt(ME, k, d);

  function audioCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); ctx.__gipKeep = true; return ctx;
  }
  function refresh() {
    const c = audioCtx(); if (!c) return;
    const live = new Set();
    document.querySelectorAll('audio, video').forEach((el) => {
      const s = el.srcObject;
      if (!(s instanceof MediaStream) || !s.getAudioTracks().length || !el.isConnected) return;
      live.add(s.id);
      const t = taps.get(s.id);
      if (t) { t.el = el; return; }
      try {
        const an = c.createAnalyser(); an.fftSize = 256; an.smoothingTimeConstant = 0.72;
        const src = c.createMediaStreamSource(s); src.connect(an); // analyser only: never connected to the speakers
        taps.set(s.id, { an, src, el, data: new Uint8Array(an.frequencyBinCount) });
      } catch (e) {}
    });
    for (const [id, t] of taps) if (!live.has(id)) { try { t.src.disconnect(); } catch (e) {} taps.delete(id); }
    show(taps.size > 0);
  }
  function place() {
    if (!canvas) return;
    const [w, h] = SIZES[opt('size', 'medium')] || SIZES.medium; const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const pos = opt('corner', 'bl'); const st = canvas.style;
    st.top = st.bottom = st.left = st.right = 'auto';
    st[pos[0] === 't' ? 'top' : 'bottom'] = (pos[0] === 't' ? 56 : 84) + 'px'; st[pos[1] === 'l' ? 'left' : 'right'] = '88px';
  }
  function ensureCanvas() {
    if (canvas) return canvas;
    canvas = document.createElement('canvas'); canvas.id = 'gip-visualizer';
    canvas.style.cssText = 'position:fixed;z-index:9990;pointer-events:none;border-radius:6px;background:rgba(0,0,0,.55);padding:0;display:none';
    document.body.appendChild(canvas); place(); return canvas;
  }
  function show(on) {
    const c = ensureCanvas();
    if (on && c.style.display === 'none') { c.style.display = 'block'; if (!raf) loop(); }
    if (!on && c.style.display !== 'none') { c.style.display = 'none'; cancelAnimationFrame(raf); raf = 0; }
  }
  function color(i, n, v) {
    const style = opt('style', 'winamp');
    if (style === 'rainbow') return 'hsl(' + Math.round(300 * i / n) + ',85%,58%)';
    if (style === 'mono') return getComputedStyle(document.body).color || '#ddd';
    return v > 0.82 ? '#ff3b2f' : v > 0.6 ? '#ffd23f' : v > 0.35 ? '#a6e22e' : '#3bd13b'; // classic green, yellow, red
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    if (document.hidden || !canvas || !taps.size) return;
    const N = Number(opt('bars', '24')); const g = canvas.getContext('2d'); const W = canvas.width, H = canvas.height;
    const level = new Float32Array(N);
    for (const t of taps.values()) {
      try { t.an.getByteFrequencyData(t.data); } catch (e) { continue; }
      const gain = t.el && !t.el.muted ? Math.min(1, Math.max(0, t.el.volume)) : 0;
      for (let i = 0; i < N; i++) {
        const a = Math.floor(Math.pow(i / N, 1.6) * 90) + 1, b = Math.max(a + 1, Math.floor(Math.pow((i + 1) / N, 1.6) * 90) + 1);
        let m = 0; for (let k = a; k < b && k < t.data.length; k++) m = Math.max(m, t.data[k]);
        level[i] = Math.max(level[i], (m / 255) * gain);
      }
    }
    if (!peaks || peaks.length !== N) peaks = new Float32Array(N);
    g.clearRect(0, 0, W, H);
    const bw = W / N, gap = Math.max(1, bw * 0.18);
    for (let i = 0; i < N; i++) {
      const v = Math.min(1, level[i] * 1.25); const h = Math.max(1, v * (H - 4));
      g.fillStyle = color(i, N, v); g.fillRect(i * bw + gap / 2, H - 2 - h, bw - gap, h);
      peaks[i] = Math.max(v, peaks[i] - 0.012);
      g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(i * bw + gap / 2, H - 2 - peaks[i] * (H - 4) - 2, bw - gap, 2);
    }
  }

  const plugin = {
    id: ME, name: 'Visualizer', origin: 'gip',
    description: 'A small Winamp-style bar strip that moves with the voice call. Appears only while people are talking in a call.',
    options: [
      { key: 'style', type: 'select', dflt: 'winamp', label: 'Colours', choices: [['winamp', 'Classic (green, yellow, red)'], ['rainbow', 'Rainbow'], ['mono', 'One colour (text colour)']] },
      { key: 'bars', type: 'select', dflt: '24', label: 'Bars', choices: [['16', '16'], ['24', '24'], ['32', '32']] },
      { key: 'size', type: 'select', dflt: 'medium', label: 'Size', choices: [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']] },
      { key: 'corner', type: 'select', dflt: 'bl', label: 'Corner', choices: [['bl', 'Bottom left'], ['br', 'Bottom right'], ['tl', 'Top left'], ['tr', 'Top right']] },
    ],
    start() {
      if (offs) return;
      ensureCanvas();
      gesture = () => { if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); };
      document.addEventListener('pointerdown', gesture, true); document.addEventListener('keydown', gesture, true);
      offs = [Y.events.watch(refresh, ME, 300), Y.events.on('voice', () => setTimeout(refresh, 200), ME)];
      refresh();
    },
    stop() {
      if (offs) { Y.util.offAll(offs); offs = null; }
      if (gesture) { document.removeEventListener('pointerdown', gesture, true); document.removeEventListener('keydown', gesture, true); gesture = null; }
      cancelAnimationFrame(raf); raf = 0;
      for (const t of taps.values()) { try { t.src.disconnect(); } catch (e) {} } taps.clear();
      if (canvas) { canvas.remove(); canvas = null; }
      if (ctx) { try { ctx.close(); } catch (e) {} ctx = null; }
      peaks = null;
    },
    onOption() { if (canvas) { place(); peaks = null; } },
  };
  window.PluginHost.register(plugin);
})();
