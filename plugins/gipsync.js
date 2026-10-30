// GIP++ Sync accounts. Each account runs in its own window with its own saved settings.
// Publish this account's settings, then apply them from another account. Only GIP++ settings travel (never logins or tokens),
// and you choose which groups to copy. The shared copy lives in a file in the app's data folder on this computer.
(function () {
  const Y = window.YapPlus;
  const CATS = [
    { id: 'features', label: 'Features and their options', test: /^(yapplus\.plugin\.|gip\.opt\.|yapplus\.gip\.default\.)/ },
    { id: 'look', label: 'Theme, accent colour and custom themes', test: /^(yapplus\.activeTheme|gip\.accentHue|gip\.customThemes\.v1)/ },
    { id: 'bg', label: 'Custom background', test: /^yapplus\.bg\./ },
    { id: 'sounds', label: 'Sound pack choices', test: /^gip\.sounds\.v1/ },
    { id: 'voice', label: 'Voice presets and saved volumes', test: /^(gip\.voicepresets\.v1|yapplus\.gipvol\.v2)/ },
    { id: 'nav', label: 'Folders and favourite GIFs', test: /^(gip\.folders\.v1|gip\.gifs\.v1)/ },
    { id: 'words', label: 'Word filter and nicknames', test: /^(gip\.wordfilter\.v1|gip\.nicks\.v1)/ },
    { id: 'emoji', label: 'Learned emoji names (Emoji Text)', test: /^gip\.emojitext\./ },
    { id: 'misc', label: 'Auto-edit text and file disguise types', test: /^(yapplus\.autoedit\.|yapplus\.filenamedisguiser\.)/ },
  ];
  const NEVER = /^(gip\.settingsVersion|gip\.lastSeenVersion|gip\.modeBackup|yapplus\.gip\.firstRunDone)/;
  const api = () => window.electronAPI || {};
  const me = () => window.__gipProfile || { id: 'default', name: 'Main' };
  const pick = (data, chosen) => { const out = {}; Object.keys(data).forEach(k => { if (!NEVER.test(k) && CATS.some(c => chosen[c.id] && c.test.test(k))) out[k] = data[k]; }); return out; };

  Y.registerTab('sync', 'Sync accounts', function (ui) {
    const { el, sw, group } = ui; const root = el('div');
    const chosen = {}; CATS.forEach(c => { chosen[c.id] = c.id !== 'words'; });
    const g0 = group('What to copy', 'gip', 'Pick the groups of settings to publish or apply. Your logins are never included.');
    CATS.forEach(c => g0.appendChild(el('div', { class: 'gp-row' }, el('div', { class: 'gp-name', text: c.label }), sw(chosen[c.id], (v) => { chosen[c.id] = v; }))));
    root.appendChild(g0);

    const g1 = group('This account: ' + me().name, 'gip', 'Publish a copy of this account\u2019s settings so another account can apply them.');
    const pub = el('button', { class: 'btn', text: 'Publish my settings' });
    pub.addEventListener('click', async () => {
      if (!api().syncSave) return Y.toast('Needs the desktop app');
      const all = {}; Y.settings.keys().forEach(k => { try { all[k] = localStorage.getItem(k); } catch (e) {} });
      const data = pick(all, chosen); if (!Object.keys(data).length) return Y.toast('Nothing selected to publish');
      pub.disabled = true; try { const r = await api().syncSave(me().id, me().name, data); Y.toast(r && r.success ? 'Published ' + r.count + ' settings' : 'Could not publish: ' + ((r && r.error) || 'unknown')); draw(); } catch (e) { Y.toast('Could not publish'); } pub.disabled = false;
    });
    g1.appendChild(el('div', { class: 'gp-row' }, el('div', { class: 'gp-desc', text: 'Updates the copy other accounts can apply.' }), pub));
    root.appendChild(g1);

    const g2 = group('Apply from an account', 'gip', 'Settings of the chosen groups are replaced by the published copy. The page reloads afterwards.');
    const list = el('div'); g2.appendChild(list); root.appendChild(g2);
    async function draw() {
      list.innerHTML = '';
      let items = []; try { items = api().syncList ? await api().syncList() : []; } catch (e) {}
      items = items.filter(x => x.id !== me().id);
      if (!items.length) { list.appendChild(el('div', { class: 'gp-desc', text: 'No other account has published settings yet. Open GIP++ > Sync accounts in the other account and press Publish.' })); return; }
      items.sort((a, b) => b.t - a.t).forEach((it) => {
        const b = el('button', { class: 'btn', text: 'Apply' });
        b.addEventListener('click', async () => {
          const data = await api().syncLoad(it.id); if (!data) return Y.toast('That copy is gone');
          const take = pick(data, chosen), n = Object.keys(take).length; if (!n) return Y.toast('Nothing in the selected groups');
          Y.confirm('Apply settings from ' + it.name + '?', n + ' settings will replace this account\u2019s. A backup is not made, so publish this account first if you want to keep them.', 'Apply and reload', () => {
            Object.keys(take).forEach(k => { try { localStorage.setItem(k, take[k]); } catch (e) {} });
            try { Y.settings.migrate(); } catch (e) {}
            Y.toast('Applied. Reloading\u2026', 1200); setTimeout(() => location.reload(), 700);
          });
        });
        list.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name', text: it.name }), el('div', { class: 'gp-desc', text: it.count + ' settings, published ' + new Date(it.t).toLocaleString() })), b));
      });
    }
    draw(); return root;
  });
})();
