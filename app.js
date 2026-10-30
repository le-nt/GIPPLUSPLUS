const { app } = require('electron');
const fs = require('fs');
const path = require('path');
//
const hotDir = path.join(app.getPath('userData'), 'yapplus-hot');
const hotMain = path.join(hotDir, 'main.js');
const bundledMain = path.join(__dirname, 'main.js');
// GIP++ keeps its data in its own folder. If you used "Yap++ GIP Edition" before, copy that data over once
// so you stay logged in and keep your settings.
try {
  const oldDir = path.join(app.getPath('appData'), 'Yap++ GIP Edition');
  const newDir = app.getPath('userData');
  if (oldDir !== newDir && fs.existsSync(path.join(oldDir, 'Partitions')) && !fs.existsSync(path.join(newDir, 'Partitions'))) {
    fs.mkdirSync(newDir, { recursive: true });
    fs.cpSync(oldDir, newDir, { recursive: true, force: false, errorOnExist: false });
  }
} catch (e) { console.error('[GIP++] could not migrate old data:', e); }
// The updater stores downloaded copies of every file in the "hot" folder and those win over the bundled ones.
// That is on for packaged and source runs. Set YAPPLUS_NO_HOT=1 to run only this folder's files (updater off).
const useHot = process.env.YAPPLUS_NO_HOT !== '1';
if (useHot) process.env.YAPPLUS_HOT_DIR = hotDir;
process.env.YAPPLUS_APP_DIR = __dirname;










// Core version guard. The downloaded copy (main.js, preload.js, html/client.html, plugins) must never be OLDER than the app itself.
// If its core (plugins/0core.js) is older than the bundled one, the whole downloaded copy is set aside so the bundled files run.
// A downloaded copy with no core of its own is fine: it runs on the bundled core.
if (useHot && fs.existsSync(hotDir)) {
  try {
    const ver = (f) => { try { const m = /VERSION = '([^']+)'/.exec(fs.readFileSync(f, 'utf-8')); return m ? m[1] : ''; } catch (e) { return ''; } };
    const older = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d < 0; } return false; };
    const hv = ver(path.join(hotDir, 'plugins', '0core.js')), bv = ver(path.join(__dirname, 'plugins', '0core.js'));
    if (hv && bv && older(hv, bv)) {
      fs.rmSync(hotDir + '.stale', { recursive: true, force: true });
      fs.renameSync(hotDir, hotDir + '.stale');
      try { fs.appendFileSync(path.join(app.getPath('userData'), 'gip-errors.log'), new Date().toISOString() + ' downloaded copy was core ' + hv + ' but the app is ' + bv + ': set aside, using bundled files\n'); } catch (e) {}
      console.error('[Bootstrap] Downloaded copy is older than the app, using bundled files.');
    }
  } catch (e) { console.error('[Bootstrap] version guard failed:', e); }
}

let chosenMain = bundledMain;
if (useHot && fs.existsSync(hotMain)) {
  try {
    new Function(fs.readFileSync(hotMain, 'utf-8')); 
    chosenMain = hotMain;
  } catch (e) {
    console.error('[Bootstrap] Hot main.js is invalid, falling back to bundled:', e);
  }
}
try {
  const code = fs.readFileSync(chosenMain, 'utf-8');
  const Module = require('module');
  const m = new Module(chosenMain, module);
  m.filename = chosenMain;
  m.paths = Module._nodeModulePaths(path.dirname(chosenMain));
  m._compile(code, chosenMain);
} catch (e) {
  if (chosenMain !== bundledMain) {
    try {
      const code = fs.readFileSync(bundledMain, 'utf-8');
      const Module = require('module');
      const m = new Module(bundledMain, module);
      m.filename = bundledMain;
      m.paths = Module._nodeModulePaths(path.dirname(bundledMain));
      m._compile(code, bundledMain);
    } catch (err) {
    }
  }
}