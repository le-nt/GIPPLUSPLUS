// GIP++ Word Filter. Hide, collapse or blur messages that contain words you choose, and highlight words you want to notice.
// It only changes how messages look on your screen. Nothing is sent anywhere and nothing is deleted.
// Highlighting uses the browser's own highlight feature, so message text is never rewritten (that kept breaking redraws).
(function () {
  const Y = window.YapPlus, ME = 'gipwordfilter', KEY = 'gip.wordfilter.v1', STYLE = 'gip-wf-style';
  const hasHl = !!(window.CSS && CSS.highlights && window.Highlight);
  let cfg = null, timer = 0, offs = null, onClick = null, active = false;

  const store = Y.util.store(KEY, {});
  const load = () => { const o = store.get() || {}; return { block: Array.isArray(o.block) ? o.block : [], mark: Array.isArray(o.mark) ? o.mark : [] }; };
  const save = () => store.set(cfg);
  const words = (list) => list.map(w => String(w).trim()).filter(Boolean);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function rx(list) {
    const w = words(list); if (!w.length) return null;
    const whole = Y.opt(ME, 'whole', true);
    const parts = w.map(x => whole ? '(?<![\\p{L}\\p{N}_])' + esc(x) + '(?![\\p{L}\\p{N}_])' : esc(x));
    try { return new RegExp(parts.join('|'), 'giu'); } catch (e) { return null; }
  }

  function css() {
    if (document.getElementById(STYLE)) return;
    const s = document.createElement('style'); s.id = STYLE;
    s.textContent =
      '.msg.gip-wf-hide{display:none !important}' +
      '.msg.gip-wf-collapse > *{display:none !important}' +
      '.msg.gip-wf-collapse::before{content:"Filtered message. Click to show.";display:block;padding:4px 10px;font-size:12px;font-style:italic;opacity:.6;cursor:pointer}' +
      '.msg.gip-wf-blur .msg-text{filter:blur(6px);transition:filter .12s}.msg.gip-wf-blur:hover .msg-text{filter:none}' +
      '.msg.gip-wf-has{box-shadow:inset 3px 0 0 rgba(255,200,40,.85)}' +
      '::highlight(gip-wf-mark){background-color:rgba(255,200,40,.4);color:inherit}';
    document.head.appendChild(s);
  }

  function textNodes(root) {
    const out = []; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n);
    return out;
  }

  function scan() {
    if (!cfg) cfg = load();
    const rb = rx(cfg.block), rm = rx(cfg.mark), mode = Y.opt(ME, 'mode', 'collapse');
    if (!rb && !rm) { if (active) { clearAll(); active = false; } return; }   // no words set: do nothing (and undo anything left over)
    active = true;
    const ranges = [];
    document.querySelectorAll(Y.sel.css('msg')).forEach((m) => {
      const body = m.querySelector('.msg-text'); const text = body ? body.textContent : '';
      const hit = !!(rb && text && (rb.lastIndex = 0, rb.test(text)));
      const open = m.classList.contains('gip-wf-open');
      m.classList.toggle('gip-wf-hide', hit && mode === 'hide');
      m.classList.toggle('gip-wf-collapse', hit && mode === 'collapse' && !open);
      m.classList.toggle('gip-wf-blur', hit && mode === 'blur');
      if (!hit && open) m.classList.remove('gip-wf-open');
      let marked = false;
      if (rm && body && text) {
        for (const n of textNodes(body)) {
          rm.lastIndex = 0; let r;
          while ((r = rm.exec(n.nodeValue)) && r[0]) {
            marked = true;
            if (hasHl) { const rg = document.createRange(); rg.setStart(n, r.index); rg.setEnd(n, r.index + r[0].length); ranges.push(rg); }
          }
        }
      }
      m.classList.toggle('gip-wf-has', marked);
    });
    if (hasHl) { try { if (ranges.length) CSS.highlights.set('gip-wf-mark', new Highlight(...ranges)); else CSS.highlights.delete('gip-wf-mark'); } catch (e) {} }
  }
  const later = () => { clearTimeout(timer); timer = setTimeout(scan, 200); };

  function clearAll() {
    clearTimeout(timer);
    document.querySelectorAll('.gip-wf-hide,.gip-wf-collapse,.gip-wf-blur,.gip-wf-has,.gip-wf-open').forEach(m => m.classList.remove('gip-wf-hide', 'gip-wf-collapse', 'gip-wf-blur', 'gip-wf-has', 'gip-wf-open'));
    if (hasHl) { try { CSS.highlights.delete('gip-wf-mark'); } catch (e) {} }
  }

  const plugin = {
    id: ME, name: 'Word Filter', origin: 'gip',
    description: 'Hide, collapse or blur messages that contain words you choose, and highlight words you want to notice. Set your words in GIP++ > Word filter.',
    options: [
      { key: 'mode', type: 'select', dflt: 'collapse', label: 'What to do with filtered messages', choices: [['collapse', 'Collapse (click to show)'], ['hide', 'Hide completely'], ['blur', 'Blur until hovered']] },
      { key: 'whole', type: 'toggle', dflt: true, label: 'Match whole words only', desc: 'On: "ass" does not match "class". Off: matches anywhere inside a word.' },
    ],
    start() {
      if (offs) return;
      cfg = load(); css();
      onClick = (e) => { const m = e.target.closest && e.target.closest('.msg.gip-wf-collapse'); if (m) { e.preventDefault(); e.stopPropagation(); m.classList.remove('gip-wf-collapse'); m.classList.add('gip-wf-open'); } };
      document.addEventListener('click', onClick, true);
      offs = [Y.events.watch(scan, ME, 200), Y.events.on('channel', () => setTimeout(scan, 300), ME)];
      scan();
    },
    stop() {
      if (offs) { Y.util.offAll(offs); offs = null; }
      if (onClick) { document.removeEventListener('click', onClick, true); onClick = null; }
      clearAll(); active = false; const s = document.getElementById(STYLE); if (s) s.remove();
    },
    onOption() { if (offs) later(); },
  };
  window.PluginHost.register(plugin);

  Y.registerTab('words', 'Word filter', function (ui) {
    const { el, group } = ui; cfg = load();
    const root = el('div');
    const g = group('Your words', 'gip', 'One word or phrase per line. Not case sensitive. Turn the feature on in Features. Stored only on this computer.');
    const mk = (label, desc, field) => {
      const ta = el('textarea', { class: 'input', rows: 5, style: 'width:100%;resize:vertical;font-family:inherit', 'aria-label': label, placeholder: 'one per line' });
      ta.value = cfg[field].join('\n');
      let t = 0;
      ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { cfg[field] = ta.value.split('\n').map(x => x.trim()).filter(Boolean); save(); if (Y.PluginHost.isRunning(plugin)) scan(); }, 350); });
      return el('div', { class: 'gp-row', style: 'display:block' }, el('div', { class: 'gp-name', text: label }), el('div', { class: 'gp-desc', text: desc, style: 'margin-bottom:6px' }), ta);
    };
    g.appendChild(mk('Filter these', 'Messages containing any of these are hidden, collapsed or blurred (pick which in Features > Word Filter).', 'block'));
    g.appendChild(mk('Highlight these', 'Messages containing these get a yellow edge' + (hasHl ? ' and the word is highlighted.' : '.'), 'mark'));
    root.appendChild(g);
    return root;
  });
})();
