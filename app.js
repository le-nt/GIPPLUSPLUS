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