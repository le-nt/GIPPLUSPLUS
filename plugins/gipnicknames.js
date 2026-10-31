// GIP++ Nicknames. Rename people for yourself only. Nobody else sees it.
// Alt+click a name in chat to set a nickname. Nicknames are matched by the exact name Yappin shows,
// so if someone changes their display name you will need to set it again. Names are drawn with CSS,
// the real text underneath is never changed, so redraws and other features keep working.
(function () {
  const Y = window.YapPlus, ME = 'gipnicknames', KEY = 'gip.nicks.v1', STYLE = 'gip-nick-style';
  const TARGETS = '.msg .msg-author, .voice-people [class*="name" i], aside.side-panel [class*="name" i]';
  let nicks = null, offs = null, onAlt = null;
  const store = Y.util.store(KEY, {});
  const load = () => { const o = store.get(); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; };
  const save = () => store.set(nicks);
  const nameOf = (e) => (e.textContent || '').trim();
  const eligible = (e) => e && e.children && e.children.length === 0 && nameOf(e) && nameOf(e).length <= 60;

  function css() {
    if (document.getElementById(STYLE)) return;
    const s = document.createElement('style'); s.id = STYLE;
    s.textContent = '[data-gip-nick]{font-size:0 !important}[data-gip-nick]::after{content:attr(data-gip-nick);font-size:var(--gip-nfs,14px)}';
    document.head.appendChild(s);
  }
  // Fix: the real name is hidden with font-size:0 and the nickname is drawn at the size stored in --gip-nfs. That size was read from
  // getComputedStyle while the element could already be at font-size:0, so "0px" got stored, the nickname was drawn at size 0 and the
  // person's name disappeared completely. The size is now always measured with the nickname switched off, and a bad value is never kept.
  function fontPx(e) {
    const v = e.getAttribute('data-gip-nick');
    if (v !== null) e.removeAttribute('data-gip-nick');
    let px = 0; try { px = parseFloat(getComputedStyle(e).fontSize); } catch (x) {}
    if (v !== null) e.setAttribute('data-gip-nick', v);
    return px > 0 ? px + 'px' : '14px';
  }
  // Own keys only: a person called "constructor" or "toString" must not pick up a built-in function as a nickname.
  const nickFor = (name) => (Object.prototype.hasOwnProperty.call(nicks, name) && typeof nicks[name] === 'string' && nicks[name].trim()) ? nicks[name] : '';
  function apply() {
    if (!nicks) nicks = load();
    document.querySelectorAll(TARGETS).forEach((e) => {
      if (!eligible(e)) return;
      const n = nickFor(nameOf(e));
      if (n) {
        const okSize = parseFloat(e.style.getPropertyValue('--gip-nfs')) > 0;
        if (e.getAttribute('data-gip-nick') === n && okSize) return;
        if (!okSize) e.style.setProperty('--gip-nfs', fontPx(e));
        e.setAttribute('data-gip-nick', n); e.setAttribute('title', nameOf(e));
      } else if (e.hasAttribute('data-gip-nick')) { e.removeAttribute('data-gip-nick'); e.style.removeProperty('--gip-nfs'); e.removeAttribute('title'); }
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
      nicks = load(); css();
      onAlt = (e) => {
        if (!e.altKey || e.shiftKey || e.ctrlKey || e.button !== 0) return;
        const t = e.target.closest && e.target.closest(TARGETS); if (!t || !eligible(t)) return;
        e.preventDefault(); e.stopPropagation(); ask(nameOf(t));
      };
      document.addEventListener('click', onAlt, true);
      offs = [Y.events.watch(apply, ME, 150)];
      apply();
    },
    stop() {
      if (offs) { Y.util.offAll(offs); offs = null; }
      if (onAlt) { document.removeEventListener('click', onAlt, true); onAlt = null; }
      document.querySelectorAll('[data-gip-nick]').forEach(e => { e.removeAttribute('data-gip-nick'); e.style.removeProperty('--gip-nfs'); e.removeAttribute('title'); });
      const s = document.getElementById(STYLE); if (s) s.remove();
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
