// GIP++ Nicknames. Rename people for yourself only. Nobody else sees it.
// Alt+click a name in chat to set a nickname. Nicknames are matched by the exact name Yappin shows,
// so if someone changes their display name you will need to set it again. Names are drawn with CSS,
// the real text underneath is never changed, so redraws and other features keep working.
(function () {
  const Y = window.YapPlus, ME = 'gipnicknames', KEY = 'gip.nicks.v1';
  const TARGETS = '.msg .msg-author, .voice-people [class*="name" i], aside.side-panel [class*="name" i]';
  let nicks = null, offs = null, onAlt = null;
  const store = Y.util.store(KEY, {});
  const load = () => { const o = store.get(); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; };
  const save = () => store.set(nicks);
  const nameOf = (e) => (e.textContent || '').trim();
  const eligible = (e) => e && e.children && e.children.length === 0 && nameOf(e) && nameOf(e).length <= 60;

  // How nicknames are shown (rewritten in the fixed build): the name's text node is swapped for the nickname and put back when the
  // nickname is removed or the feature is turned off. The old way hid the real name with font-size:0 and drew the nickname with ::after;
  // whenever the page's own styles got in the way of the ::after (or its size), the name vanished and no nickname appeared at all.
  // With this way the worst case is that you still see the real name, never an empty space.
  const OLD_STYLE = 'gip-nick-style';
  const live = new Map();   // element -> { real, nick, node }  (only elements this feature changed)
  // Own keys only: a person called "constructor" or "toString" must not pick up a built-in function as a nickname.
  const nickFor = (name) => (Object.prototype.hasOwnProperty.call(nicks, name) && typeof nicks[name] === 'string' && nicks[name].trim()) ? nicks[name].trim() : '';
  const onlyText = (e) => (e.childNodes.length === 1 && e.firstChild.nodeType === 3) ? e.firstChild : null;
  function revert(e, s) {
    if (s.node && s.node.parentNode === e && s.node.nodeValue === s.nick) s.node.nodeValue = s.real;
    e.removeAttribute('data-gip-nick'); if (e.getAttribute('title') === s.real) e.removeAttribute('title');
    live.delete(e);
  }
  function apply() {
    if (!nicks) nicks = load();
    // Forget elements the page removed, and ones whose text the page rewrote (someone else now sits in that row).
    live.forEach((s, e) => { if (!e.isConnected || s.node.parentNode !== e || s.node.nodeValue !== s.nick) live.delete(e); });
    document.querySelectorAll(TARGETS).forEach((e) => {
      const s = live.get(e);
      if (s) { const want = nickFor(s.real); if (!want) revert(e, s); else if (want !== s.nick) { s.node.nodeValue = want; s.nick = want; } return; }
      if (!eligible(e)) return;
      const node = onlyText(e); if (!node) return;
      const real = nameOf(e), want = nickFor(real); if (!want) return;
      node.nodeValue = want; e.setAttribute('data-gip-nick', want); if (!e.hasAttribute('title')) e.setAttribute('title', real);
      live.set(e, { real, nick: want, node });
    });
  }
  function ask(name) {
    if (!nicks) nicks = load();
    Y.prompt('Nickname for ' + name + ' (only you see it)', nicks[name] || '', (v) => {
      v = String(v || '').trim().slice(0, 40); if (!v) return;
      nicks[name] = v; save(); apply(); Y.toast('Nickname saved');
    });
  }

  const plugin = {
    id: ME, name: 'Nicknames', origin: 'gip',
    description: 'Rename people for yourself only. Alt+click a name in chat to set one. Manage them in GIP++ > Nicknames.',
    start() {
      if (offs) return;
      nicks = load();
      // clean up anything the old CSS-based version left behind
      const old = document.getElementById(OLD_STYLE); if (old) old.remove();
      document.querySelectorAll('[data-gip-nick]').forEach(e => { e.removeAttribute('data-gip-nick'); e.style.removeProperty('--gip-nfs'); });
      onAlt = (e) => {
        if (!e.altKey || e.shiftKey || e.ctrlKey || e.button !== 0) return;
        const t = e.target.closest && e.target.closest(TARGETS); if (!t || !eligible(t)) return;
        const st = live.get(t);   // an already-renamed name shows the nickname, so use the real name we remembered
        e.preventDefault(); e.stopPropagation(); ask(st ? st.real : nameOf(t));
      };
      document.addEventListener('click', onAlt, true);
      offs = [Y.events.watch(apply, ME, 150)];
      apply();
    },
    stop() {
      if (offs) { Y.util.offAll(offs); offs = null; }
      if (onAlt) { document.removeEventListener('click', onAlt, true); onAlt = null; }
      Array.from(live.entries()).forEach(([e, st]) => revert(e, st));
    },
  };
  window.PluginHost.register(plugin);

  Y.registerTab('people', 'Nicknames', function (ui) {
    const { el, group } = ui; nicks = load();
    const root = el('div'); const g = group('Nicknames', 'gip', 'Only you see these. Turn the feature on in Features. Tip: Alt+click a name in chat to set one quickly.');
    const list = el('div');
    const draw = () => {
      list.innerHTML = ''; const keys = Object.keys(nicks).sort((a, b) => a.localeCompare(b));
      if (!keys.length) list.appendChild(el('div', { class: 'gp-desc', text: 'No nicknames yet.' }));
      keys.forEach((k) => {
        const rm = el('button', { class: 'btn', text: 'Remove' });
        rm.addEventListener('click', () => { delete nicks[k]; save(); if (Y.PluginHost.isRunning(plugin)) apply(); draw(); });
        const ed = el('button', { class: 'btn', text: 'Change' });
        ed.addEventListener('click', () => Y.prompt('Nickname for ' + k, nicks[k], (v) => { v = String(v || '').trim().slice(0, 40); if (!v) return; nicks[k] = v; save(); if (Y.PluginHost.isRunning(plugin)) apply(); draw(); }));
        list.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name', text: nicks[k] }), el('div', { class: 'gp-desc', text: 'Real name: ' + k })), el('div', { class: 'gp-line' }, ed, rm)));
      });
    };
    const who = el('input', { class: 'input', placeholder: 'Exact name as shown', 'aria-label': 'Exact name', style: 'flex:1' });
    const nn = el('input', { class: 'input', placeholder: 'Nickname', 'aria-label': 'Nickname', maxlength: 40, style: 'flex:1' });
    const add = el('button', { class: 'btn', text: 'Add' });
    add.addEventListener('click', () => { const a = who.value.trim(), b = nn.value.trim().slice(0, 40); if (!a || !b) return; nicks[a] = b; save(); who.value = nn.value = ''; if (Y.PluginHost.isRunning(plugin)) apply(); draw(); });
    g.appendChild(el('div', { class: 'gp-row' }, el('div', { class: 'gp-line', style: 'width:100%;gap:8px' }, who, nn, add)));
    g.appendChild(list); root.appendChild(g); draw();
    return root;
  });
})();
