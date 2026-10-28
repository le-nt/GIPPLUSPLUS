// GIP++ Voice Presets. A tab to see and edit the volume and direction GIP++ remembers for each person, and to save presets.
// GIP++ Volume Fix already remembers each person by name; this tab lets you manage that list, add people before a call,
// and apply a preset ("Quieter", "Left ear", ...) to anyone in one click. Edits apply live if the person is in a call.
(function () {
  const Y = window.YapPlus; const STORE = 'yapplus.gipvol.v2', PK = 'gip.voicepresets.v1';
  const SEED = [{ n: 'Quieter', vol: 0.6 }, { n: 'Louder', vol: 1.5 }, { n: 'Left ear', pan: -60 }, { n: 'Right ear', pan: 60 }, { n: 'Behind me', pan: 180 }];
  const prefs = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } };
  const presets = () => { try { const p = JSON.parse(localStorage.getItem(PK)); if (Array.isArray(p)) return p; } catch (e) {} return SEED.slice(); };
  const savePresets = (p) => { try { localStorage.setItem(PK, JSON.stringify(p)); } catch (e) {} };
  function patchPref(key, patch) {
    const V = Y.volume;
    if (V && V.savePref) V.savePref(key, patch);
    else { try { const all = prefs(); const cur = Object.assign(all[key] || {}, patch); Object.keys(cur).forEach(k => { if (cur[k] == null) delete cur[k]; }); if (Object.keys(cur).length) all[key] = cur; else delete all[key]; localStorage.setItem(STORE, JSON.stringify(all)); } catch (e) {} }
    if (V && V.entriesFor) V.entriesFor(key).forEach(e => {
      try {
        if ('vol' in patch) { e.override = patch.vol == null ? null : V.clamp(patch.vol, 2); V.applyGain(e); }
        if ('pan' in patch) V.setPan(e, patch.pan || 0);
      } catch (err) {}
    });
  }
  const fmtPan = (d) => { const a = Math.abs(d); if (!d) return 'Center'; if (a >= 170) return 'Behind'; return (d < 0 ? 'Left ' : 'Right ') + a + '\u00b0'; };
  const nice = (k) => k.replace(/^[us]:/, '');

  Y.registerTab('voice', 'Voice', function (ui) {
    const { el, group } = ui; const root = el('div');
    const note = group('Voice volume and direction', 'gip', 'GIP++ remembers the volume and direction you set for each person (by name), so they are the same in your next call. Change them here, or right-click a person in voice as usual.');
    if (!Y.PluginHost.all().some(p => p.id === 'gipvolume' && Y.PluginHost.isEnabled(p))) note.appendChild(el('div', { class: 'gp-warn', text: 'Turn on \u201cVolume Fix + Voice Direction\u201d in the Plugins tab for these settings to take effect in calls.' }));
    root.appendChild(note);

    const people = group('People', 'gip'); const list = el('div'); people.appendChild(list);
    const addName = el('input', { class: 'input', placeholder: 'Add a person by their exact name\u2026', maxlength: 32, style: 'flex:1' });
    const addBtn = el('button', { class: 'btn', text: 'Add' });
    people.appendChild(el('div', { class: 'gp-line' }, addName, addBtn));
    const pg = group('Presets', 'gip', 'Click a preset on someone above to apply it. Use \u201cSave as preset\u201d on a person to keep their settings as a new preset.');
    const plist = el('div'); pg.appendChild(plist); root.append(people, pg);

    function draw() {
      list.innerHTML = ''; const all = prefs(); const keys = Object.keys(all).filter(k => /^[us]:/.test(k)).sort((a, b) => nice(a).localeCompare(nice(b)));
      if (!keys.length) list.appendChild(el('div', { class: 'gp-desc', text: 'No one saved yet. Adjust someone\u2019s volume or direction in a call, or add a person below.' }));
      keys.forEach(k => {
        const p = all[k] || {}; const vol = el('input', { type: 'range', min: 0, max: 200, step: 5, 'aria-label': 'Volume', style: 'width:150px' }); vol.value = p.vol != null ? Math.round(p.vol * 100) : 100;
        const vl = el('span', { class: 'gp-ver', text: vol.value + '%', style: 'min-width:42px' });
        vol.addEventListener('input', () => { vl.textContent = vol.value + '%'; patchPref(k, { vol: Number(vol.value) === 100 ? null : Number(vol.value) / 100 }); });
        const pan = el('input', { type: 'range', min: -180, max: 180, step: 5, 'aria-label': 'Direction', style: 'width:150px' }); pan.value = p.pan || 0;
        const pl = el('span', { class: 'gp-ver', text: fmtPan(Number(pan.value)), style: 'min-width:64px' });
        pan.addEventListener('input', () => { pl.textContent = fmtPan(Number(pan.value)); patchPref(k, { pan: Number(pan.value) || null }); });
        pan.addEventListener('dblclick', () => { pan.value = 0; pan.dispatchEvent(new Event('input')); });
        const sel = el('select', { class: 'input', style: 'width:auto', 'aria-label': 'Apply preset' }); sel.appendChild(el('option', { value: '', text: 'Preset\u2026' }));
        presets().forEach((pr, i) => sel.appendChild(el('option', { value: String(i), text: pr.n })));
        sel.addEventListener('change', () => {
          const pr = presets()[Number(sel.value)]; if (!pr) return; const patch = {};
          if (pr.vol != null) patch.vol = pr.vol; if (pr.pan != null) patch.pan = pr.pan || null;
          patchPref(k, patch); draw();
        });
        const sv = el('button', { class: 'gp-x', text: 'Save as preset' });
        sv.addEventListener('click', () => Y.prompt('Preset name', nice(k), (name) => { const cur = prefs()[k] || {}; const ps = presets(); ps.push({ n: name, vol: cur.vol, pan: cur.pan }); savePresets(ps); draw(); }));
        const del = el('button', { class: 'gp-x', text: 'Forget' });
        del.addEventListener('click', () => { patchPref(k, { vol: null, pan: null }); draw(); });
        list.appendChild(el('div', { class: 'gp-res' },
          el('div', { class: 'gp-line', style: 'justify-content:space-between;margin:0 0 6px' }, el('b', { text: (k[0] === 's' ? 'Stream: ' : '') + nice(k) }), el('div', { class: 'gp-line', style: 'margin:0' }, sel, sv, del)),
          el('div', { class: 'gp-line', style: 'flex-wrap:wrap;margin:0' }, el('span', { class: 'gp-desc', text: 'Volume' }), vol, vl, el('span', { class: 'gp-desc', text: 'Direction', style: 'margin-left:12px' }), pan, pl)));
      });
      plist.innerHTML = '';
      presets().forEach((pr, i) => {
        const bits = [pr.vol != null ? Math.round(pr.vol * 100) + '% volume' : '', pr.pan != null ? fmtPan(pr.pan) : ''].filter(Boolean).join(', ') || 'no changes';
        plist.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name', text: pr.n }), el('div', { class: 'gp-desc', text: bits })),
          el('button', { class: 'gp-x', text: 'Delete', onclick: () => { const ps = presets(); ps.splice(i, 1); savePresets(ps); draw(); } })));
      });
    }
    addBtn.addEventListener('click', () => {
      const n = addName.value.trim(); if (!n) return;
      const all = prefs(); if (!all['u:' + n]) patchPref('u:' + n, { vol: 1 }); addName.value = ''; draw();
    });
    addName.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') addBtn.click(); });
    draw(); return root;
  });
})();
