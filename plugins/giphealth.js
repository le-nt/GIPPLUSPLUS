// GIP++ Health. The 3.0 control room: what is running, what broke, whether Yappin's page still matches what the plugins expect,
// which files are running (update copy or bundled), settings backup and restore, safe mode, and a one-click debug report.
// This is part of GIP++ itself, not a feature you switch on.
(function () {
  const Y = window.YapPlus;
  if (!Y || Y.__healthLoaded) return; Y.__healthLoaded = true;
  const api = () => window.electronAPI || {};
  const ago = (t) => { const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 90 ? s + 's ago' : s < 5400 ? Math.round(s / 60) + 'm ago' : Math.round(s / 3600) + 'h ago'; };
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    try { const t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; } catch (e) { return false; }
  };

  /* ---------- debug report ---------- */
  async function debugInfo() {
    try { return await debugInfoInner(); } catch (e) { return 'GIP++ ' + (Y.VERSION || '?') + ' | debug info failed: ' + ((e && e.message) || e) + '\n' + (Array.isArray(Y.errors) ? Y.errors.slice(-10).map(x => x.owner + ' ' + x.where + ': ' + x.msg).join('\n') : ''); }
  }
  async function debugInfoInner() {
    let run = null; try { run = await api().getRunInfo(); } catch (e) {}
    if (run && !Array.isArray(run.files)) run.files = [];
    const H = Y.PluginHost; const L = [];
    L.push('GIP++ ' + Y.VERSION + (H.safeMode ? ' (SAFE MODE)' : '') + ' | ' + navigator.userAgent);
    if (run) {
      L.push('App ' + run.appVersion + ' | Electron ' + run.electron + ' | ' + run.platform + ' | updates ' + (run.updates ? (run.autoUpdate ? 'on' : 'off') : 'unavailable'));
      const upd = run.files.filter(f => f.source === 'update').length;
      L.push('Files from update copy: ' + upd + ' / ' + run.files.length + (run.hotTree ? ' | update tree ' + String(run.hotTree).slice(0, 10) : '') + (run.rolledBack ? ' | ROLLED BACK ' + ago(run.rolledBack.t) + ' (' + run.rolledBack.reason + ')' : ''));
    }
    L.push('', 'Plugins (' + H.plugins.length + '):');
    H.plugins.slice().sort((a, b) => a.id.localeCompare(b.id)).forEach(p => {
      const s = H.stats(p); const perf = Y.events.perf[p.id];
      L.push('  ' + p.id.padEnd(22) + (s.crashed ? 'CRASHED ' : s.running ? 'running ' : H.isEnabled(p) ? 'waiting ' : 'off     ') + ('start ' + s.startMs + 'ms ').padEnd(14) + ('errors ' + s.errors).padEnd(10) + (perf ? ' events ' + perf.calls + ' / ' + perf.ms.toFixed(1) + 'ms' : '') + (s.lastError ? ' | ' + s.lastError : ''));
    });
    const chk = Y.sel.check(); const bad = chk.filter(c => c.status === 'missing' || c.status === 'invalid');
    L.push('', 'Page check: ' + chk.filter(c => c.status === 'ok').length + ' found, ' + chk.filter(c => c.status === 'idle').length + ' not on screen, ' + bad.length + ' MISSING' + (bad.length ? ': ' + bad.map(b => b.name + ' (' + b.css + ')').join(', ') : ''));
    const pl = Y.patches.list(); L.push('Patched browser functions: ' + (pl.length ? pl.map(x => x.prop + ' <- ' + x.owners.join('+')).join(', ') : 'none'));
    L.push('Event subscriptions: ' + Y.events.count() + ' | settings keys: ' + Y.settings.keys().length + ' | settings version ' + (localStorage.getItem('gip.settingsVersion') || '?'));
    const errs = Y.errors.slice(-15); L.push('', 'Recent errors (' + Y.errors.length + ' total):'); if (!errs.length) L.push('  none'); errs.forEach(e => L.push('  ' + ago(e.t) + ' ' + e.owner + ' ' + e.where + ': ' + e.msg));
    if (window.__gipSoundLog && window.__gipSoundLog.length) { L.push('', 'Sound log (last 10):'); window.__gipSoundLog.slice(-10).forEach(x => L.push('  ' + x.t + ' ' + x.kind + ' ' + (x.muted ? 'MUTED ' : 'played ') + x.what)); }
    return L.join('\n');
  }
  Y.debugInfo = debugInfo;

  /* ---------- the Health tab ---------- */
  Y.registerTab('health', 'Health', function (ui) {
    const { el, group } = ui; const root = el('div'); const H = Y.PluginHost;
    const btn = (label, fn, title) => { const b = el('button', { class: 'gp-x', text: label, title: title || '' }); b.addEventListener('click', () => fn(b)); return b; };
    const row = (name, desc, ...ctl) => el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, name), desc ? el('div', { class: 'gp-desc', text: desc }) : null), el('div', { class: 'gp-line' }, ...ctl));

    // The tab needs the 3.0 core. If an older core is running (an old downloaded update copy winning over the bundled files),
    // say so plainly and offer the fix instead of crashing.
    const coreOk = typeof H.stats === 'function' && Array.isArray(Y.errors) && Y.sel && Y.events && Y.patches && Y.settings && Y.settings.keys;
    if (!coreOk) {
      const g = group('Out of date core', 'gip', 'GIP++ is running an older core file than this tab needs, so most of Health cannot work. This usually means a downloaded update copy is older than the app you installed.');
      g.appendChild(row('Use the files bundled with the app', 'Sets the downloaded update copy aside and restarts. Updates resume when a newer version is published.',
        api().resetHot ? btn('Reset updates', () => api().resetHot()) : null));
      g.appendChild(row('Core version', 'Running core: ' + (Y.VERSION || 'unknown') + '. Expected: 3.1.0 or newer.'));
      root.appendChild(g);
      try { Y.report('health', 'core', new Error('older core running: ' + (Y.VERSION || 'unknown'))); } catch (e) {}
      return root;
    }
    // One broken section no longer takes the whole tab down: it shows its own error and the rest still draw.
    const safe = (label, fn) => { try { fn(); } catch (e) { try { Y.report('health', label, e); } catch (x) {} root.appendChild(row('Could not show \u201c' + label + '\u201d', String((e && e.message) || e))); } };

    // status
    safe('Status', () => {
    const st = group('Status', 'gip');
    const running = H.plugins.filter(p => H.stats(p).running).length, crashed = H.plugins.filter(p => H.stats(p).crashed).length;
    st.appendChild(row('GIP++ ' + Y.VERSION + (H.safeMode ? ' (safe mode)' : ''), running + ' of ' + H.plugins.length + ' features running' + (crashed ? ', ' + crashed + ' crashed and were turned off' : '') + '. ' + Y.errors.length + ' errors logged this session.',
      btn('Copy debug info', async (b) => { b.textContent = 'Copying\u2026'; const ok = await copy(await debugInfo()); b.textContent = ok ? 'Copied' : 'Copy failed'; setTimeout(() => b.textContent = 'Copy debug info', 1800); }, 'Everything needed to report a bug, in one paste')));
    if (api().restartSafe) st.appendChild(row('Safe mode', 'Restarts with every feature off, so you can tell whether a feature is causing a problem. You can also hold Shift while the window opens.', btn('Restart in safe mode', () => Y.confirm('Restart in safe mode?', 'GIP++ restarts with all features off. Your settings are not changed. Use the banner at the top to restart normally.', 'Restart', () => api().restartSafe()))));
    if (api().openErrorLog) st.appendChild(row('Error log file', 'Everything that went wrong is also written to a file you can send.', btn('Show file', () => api().openErrorLog())));
    root.appendChild(st);
    });

    // features
    safe('Features', () => {
    const fe = group('Features', 'gip', 'Start time, errors and how busy each one is. A feature that crashes is turned off by itself.');
    H.plugins.slice().sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id)).forEach(p => {
      const s = H.stats(p), perf = Y.events.perf[p.id];
      const state = s.crashed ? 'Crashed' : s.running ? 'Running' : H.isEnabled(p) ? 'Waiting' : 'Off';
      const info = [state, s.running ? 'started in ' + s.startMs + 'ms' : '', s.errors ? s.errors + ' error' + (s.errors > 1 ? 's' : '') : '', perf && perf.calls ? perf.calls + ' events, ' + perf.ms.toFixed(0) + 'ms total' : ''].filter(Boolean).join(' \u00b7 ');
      const ctl = []; if (s.crashed) ctl.push(btn('Try again', () => { H.setEnabled(p, true); Y.toast(H.stats(p).crashed ? 'Still crashing' : (p.name || p.id) + ' is back on'); }));
      fe.appendChild(row((p.name || p.id), info + (s.lastError ? '. Last error: ' + s.lastError : ''), ...ctl));
    });
    root.appendChild(fe);
    });

    // page check
    safe('Page check', () => {
    const pc = group('Page check', 'gip', 'Yappin\u2019s page changes sometimes. This looks for every part GIP++ relies on. After a Yappin update, anything marked Missing is what broke.');
    const out = el('div'); const run = () => {
      out.textContent = ''; const res = Y.sel.check(); const order = { missing: 0, invalid: 0, ok: 1, idle: 2 };
      const missing = res.filter(r => r.status === 'missing' || r.status === 'invalid');
      out.appendChild(el('div', { class: 'gp-desc', style: 'margin:6px 0', text: missing.length ? missing.length + ' core part' + (missing.length > 1 ? 's' : '') + ' not found. A Yappin update probably renamed ' + (missing.length > 1 ? 'them' : 'it') + '. Use Copy debug info and send it.' : 'Every core part of the page was found.' }));
      res.sort((a, b) => order[a.status] - order[b.status]).forEach(r => {
        const label = r.status === 'ok' ? 'Found \u00d7' + r.count : r.status === 'idle' ? 'Not on screen right now' : r.status === 'invalid' ? 'Invalid selector' : 'MISSING';
        out.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name', text: r.name }), el('div', { class: 'gp-desc', text: r.css + (r.users.length ? '  \u00b7  used by ' + r.users.join(', ') : '') })), el('div', { class: 'gp-ver', text: label })));
      });
    };
    pc.append(row('Check the page now', null, btn('Run check', run)), out); run(); root.appendChild(pc);
    });

    // files and updates
    safe('Updates and files', () => {
    const up = group('Updates and files', 'gip', 'GIP++ downloads updates from GitHub and runs those copies before the ones bundled with the app.');
    const body = el('div'); up.appendChild(body);
    (async () => {
      let info = null; try { info = await api().getRunInfo(); } catch (e) {}
      if (!info || !Array.isArray(info.files)) { body.appendChild(el('div', { class: 'gp-desc', text: 'File information is only available in the desktop app.' })); return; }
      const upd = info.files.filter(f => f.source === 'update');
      body.appendChild(row('Running from', upd.length + ' of ' + info.files.length + ' files come from the downloaded update copy; the rest are bundled with the app. Updates are ' + (info.autoUpdate ? 'on' : 'off') + '.'));
      if (info.rolledBack) body.appendChild(row('Rolled back ' + ago(info.rolledBack.t), info.rolledBack.reason === 'manual' ? 'You reset to the bundled files.' : 'GIP++ failed to start properly twice after an update, so it went back to the bundled files. The same update is not downloaded again; a newer one will be.'));
      if (upd.length) body.appendChild(row('Use bundled files', 'Puts the update copy aside and restarts with the files that came with the app.', btn('Reset updates', () => Y.confirm('Use the bundled files?', 'The downloaded update copy is set aside and the app restarts. The same update will not be downloaded again until a newer one is published.', 'Reset', () => api().resetHot()))));
    })();
    root.appendChild(up);
    });

    // backup
    safe('Backup and restore', () => {
    const bk = group('Backup and restore', 'gip', 'All GIP++ settings in one piece of text: features, themes, sounds, folders and so on. Your login is not included.');
    const box = el('textarea', { class: 'input', rows: 3, placeholder: 'Paste a GIP++ backup here to restore it', style: 'width:100%;resize:vertical;font-size:11px', 'aria-label': 'Backup text' });
    bk.appendChild(row('Back up', Y.settings.keys().length + ' settings will be saved.', btn('Copy backup', async (b) => { const code = Y.settings.export(); box.value = code; const ok = await copy(code); b.textContent = ok ? 'Copied' : 'Copy it from the box'; setTimeout(() => b.textContent = 'Copy backup', 2200); })));
    bk.appendChild(box);
    bk.appendChild(row('Restore', 'Replaces matching settings with the ones in the backup. The page reloads afterwards.', btn('Restore', () => {
      const r = Y.settings.inspect(box.value); if (!r.ok) { Y.toast(r.error, 3000); return; }
      Y.confirm('Restore ' + r.count + ' settings?', 'From a backup made with GIP++ ' + r.app + (r.t ? ' on ' + r.t.slice(0, 10) : '') + '. Matching settings are replaced. The page reloads afterwards.', 'Restore', () => { Y.settings.import(box.value); location.reload(); });
    })));
    root.appendChild(bk);
    });
    return root;
  });

  /* ---------- panic key: Ctrl + Alt + Shift + T turns the active theme off ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.shiftKey && (e.key === 'T' || e.key === 't')) {
      e.preventDefault();
      try { localStorage.removeItem('yapplus.activeTheme'); const t = document.getElementById('yapplus-active-theme'); if (t) t.textContent = ''; Y.toast('Theme turned off. Pick one again in GIP++ > Themes.', 3500); } catch (err) { Y.report('health', 'panic key', err); }
    }
  }, true);

  /* ---------- what's new, once after each update ---------- */
  const NEWS = {
    '3.1.0': [
      'New: Word Filter, Nicknames, Blur Media, Link Preview, Code Blocks, Downloads, Emoji Downloader, Visualizer, Emoji Text and Sync accounts.',
      'Files from chat now save with their real name to Downloads/GIP++. Alt+click an emoji to save it.',
      'Safer updates: an old downloaded copy can no longer override the app.',
    ],
    '3.0.1': [
      'Fixed the Health tab failing to load, and Health can no longer be broken by an old downloaded core.',
      'Streamer Mode was removed.',
      'More features now share the GIP++ event bus and patch registry, so they use less CPU and cannot undo each other.',
    ],
    '3.0.0': [
      'Health tab: what is running, what crashed, and whether Yappin\u2019s page still matches. Copy debug info reports a bug in one paste.',
      'A feature that crashes is turned off by itself. Hold Shift while GIP++ opens for safe mode (everything off).',
      'If an update breaks GIP++ twice in a row, it rolls back to the bundled files on its own.',
      'Settings backup and restore (Health tab). Ctrl+Alt+Shift+T turns the theme off if one ever makes the app unreadable.',
      'Sound packs now replace Yappin\u2019s own sounds. New No Popups feature. Themes can no longer restyle profile cards.',
    ],
  };
  setTimeout(() => {
    try {
      const last = localStorage.getItem('gip.lastSeenVersion');
      if (last === Y.VERSION) return;
      localStorage.setItem('gip.lastSeenVersion', Y.VERSION);
      const items = NEWS[Y.VERSION];
      if (!items || Y.PluginHost.safeMode) return;
      const ov = document.createElement('div'); ov.className = 'overlay gip-overlay';
      ov.style.cssText = 'position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6)';
      const m = document.createElement('div'); m.className = 'modal'; m.style.cssText = 'position:relative;width:min(460px,92vw);padding:18px;display:flex;flex-direction:column;gap:10px;max-height:90vh;overflow:auto';
      const h = document.createElement('div'); h.style.cssText = 'font-weight:700;font-size:17px'; h.textContent = 'GIP++ ' + Y.VERSION + ' is here';
      const ul = document.createElement('ul'); ul.style.cssText = 'margin:0;padding-left:18px;font-size:13.5px;line-height:1.5'; items.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
      const ok = document.createElement('button'); ok.className = 'btn primary'; ok.textContent = 'Got it'; ok.style.alignSelf = 'flex-end';
      ok.onclick = () => ov.remove(); ov.addEventListener('pointerdown', (e) => { if (e.target === ov) ov.remove(); });
      m.append(h, ul, ok); ov.appendChild(m); document.body.appendChild(ov);
    } catch (e) { Y.report('health', 'whats new', e); }
  }, 4000);
})();
