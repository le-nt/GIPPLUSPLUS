// GIP++ pre-push check. Run:  node scripts/check.js   (push.ps1 runs it for you before pushing)
// Catches the mistakes that break everyone at once: a syntax error in a file, two plugins declaring the same top-level name
// (the second one fails to load), a plugin that never registers, and empty theme or asset files.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'); let problems = 0, warns = 0;
const bad = (m) => { problems++; console.log('  ERROR  ' + m); };
const warn = (m) => { warns++; console.log('  warn   ' + m); };
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf-8');

for (const f of ['app.js', 'main.js', 'preload.js']) { try { new vm.Script(rd(f), { filename: f }); } catch (e) { bad(f + ': ' + e.message); } }
try { const m = /<script>([\s\S]*?)<\/script>/.exec(rd('html/client.html')); if (m) new vm.Script(m[1], { filename: 'html/client.html' }); } catch (e) { bad('html/client.html script: ' + e.message); }

const pdir = path.join(root, 'plugins'); const files = fs.readdirSync(pdir).filter(f => f.endsWith('.js')).sort();
const declared = {}; const NO_REGISTER = new Set(['0core.js', '0shim.js', '1menu.js', 'giphealth.js', 'gipprofileguard.js', 'gipvoicepresets.js', 'gipsync.js']);
for (const f of files) {
  const code = fs.readFileSync(path.join(pdir, f), 'utf-8');
  try { new vm.Script(code, { filename: 'plugins/' + f }); } catch (e) { bad('plugins/' + f + ': ' + e.message); continue; }
  // top-level (column 0) const/let/class/function names share one global scope across plugin files
  for (const m of code.matchAll(/^(?:const|let|class|function|async function)\s+([A-Za-z_$][\w$]*)/gm)) (declared[m[1]] = declared[m[1]] || []).push(f);
  if (!NO_REGISTER.has(f) && !/PluginHost\.register\(/.test(code)) warn('plugins/' + f + ' never calls PluginHost.register(...)');
  if (/(?:^|[^.\w])(?:WebSocket|XMLHttpRequest|HTMLMediaElement|AudioBufferSourceNode|OscillatorNode)\.prototype\.\w+\s*=[^=]/.test(code) || /window\.(?:Notification|fetch)\s*=[^=]/.test(code)) warn('plugins/' + f + ' changes a browser function directly. Use YapPlus.patches.add(...) so plugins cannot undo each other.');
  if (!['0core.js', '0shim.js'].includes(f) && /new MutationObserver\(/.test(code)) {
    // Allowed only on one specific element (not the whole page). Page-wide watching belongs on the bus: YapPlus.events.on('dom', ...).
    for (const m of code.matchAll(/new MutationObserver\([\s\S]{0,400}?\.observe\(\s*document\.(?:body|documentElement)/g)) { warn('plugins/' + f + ' watches the whole page with its own MutationObserver. Use YapPlus.events.on(\'dom\', ...) or YapPlus.events.watch(...).'); break; }
  }
  if (/getUserMedia\s*=[^=]|\.(?:createOffer|createAnswer|play)\s*=\s*function/.test(code)) warn('plugins/' + f + ' assigns over getUserMedia, createOffer/createAnswer or play. Use YapPlus.patches.add(...).');
}
for (const [name, where] of Object.entries(declared)) if (where.length > 1) bad('"' + name + '" is declared at the top level of ' + where.join(' and ') + '. The second one will fail to load. Wrap one in (function(){ ... })().');

for (const f of fs.readdirSync(path.join(root, 'themes'))) if (f.endsWith('.css') && fs.statSync(path.join(root, 'themes', f)).size < 20) bad('themes/' + f + ' is empty');
const pkg = JSON.parse(rd('package.json')); const core = /VERSION = '([^']+)'/.exec(rd('plugins/0core.js'));
if (core && pkg.version !== core.groups && pkg.version !== core[1]) warn('package.json version ' + pkg.version + ' differs from plugins/0core.js ' + core[1]);

console.log(problems ? '\n' + problems + ' problem(s). Fix them before pushing.' : '\nAll checks passed' + (warns ? ' (' + warns + ' warning' + (warns > 1 ? 's' : '') + ').' : '.'));
process.exit(problems ? 1 : 0);
