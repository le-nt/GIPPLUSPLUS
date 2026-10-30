// GIP++ main process.
// Based on Yap++ by salami (Apache-2.0). Changes from upstream are listed in CHANGES.md.
const { app, BrowserWindow, ipcMain, Menu, shell, desktopCapturer, session, nativeTheme, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dns = require('dns').promises;
const net = require('net');
const { pipeline } = require('stream/promises');
const { Readable, Transform } = require('stream');
const hotDir = process.env.YAPPLUS_HOT_DIR;
const appDir = process.env.YAPPLUS_APP_DIR;

// Pages we treat as "inside the app". Parsed properly, so "evil.com/?yapin.gg" no longer passes.
const TRUSTED_HOSTS = ['yapper.website', 'yapin.gg'];
function isTrustedUrl(url) {
    try {
        const u = new URL(url);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
        return TRUSTED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h));
    } catch (e) { return false; }
}
function safeExternal(url) {
    try {
        const u = new URL(url);
        return ['http:', 'https:', 'mailto:'].includes(u.protocol);
    } catch (e) { return false; }
}
function safeBase(name) {
    const base = path.basename(String(name || ''));
    return /^[\w. -]+$/.test(base) && !base.startsWith('.') ? base : null;
}

// ---- 3.0 stability ------------------------------------------------------------------------------
// Safe mode: start with every GIP++ feature off. Hold Shift while the window opens, or start with --safe-mode.
let safeMode = process.argv.includes('--safe-mode');
const bootT0 = Date.now();
function watchShift(wc) {
    wc.on('before-input-event', (ev, input) => {
        if (input.type === 'keyDown' && input.key === 'Shift' && input.isAutoRepeat && Date.now() - bootT0 < 10000) safeMode = true;
    });
}
// Errors from plugins and from this process go to one log file you can send when something breaks.
const errorLogFile = () => path.join(app.getPath('userData'), 'gip-errors.log');
function logLine(text) {
    try {
        const f = errorLogFile();
        try { if (fs.statSync(f).size > 200000) fs.writeFileSync(f, fs.readFileSync(f, 'utf-8').slice(-100000)); } catch (e) {}
        fs.appendFileSync(f, new Date().toISOString() + ' ' + String(text).slice(0, 2000) + '\n');
    } catch (e) {}
}
process.on('uncaughtException', (e) => { logLine('main uncaught: ' + (e && e.stack || e)); });
process.on('unhandledRejection', (e) => { logLine('main rejection: ' + (e && e.stack || e)); });
// One copy of the app at a time: two copies would fight over the same saved data. Relaunching releases the lock first.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
function relaunch(extraArgs, dropArgs) {
    try { app.releaseSingleInstanceLock(); } catch (e) {}
    const args = process.argv.slice(1).filter(a => !(dropArgs || []).includes(a)).concat(extraArgs || []);
    app.relaunch({ args });
    app.exit(0);
}

function resolve(relPath) {
    if (hotDir) {
        const hotPath = path.join(hotDir, relPath);
        if (fs.existsSync(hotPath)) return hotPath;
    }
    return path.join(appDir, relPath);
}

// Settings (zoom level etc.) kept in userData
const settingsFile = () => path.join(app.getPath('userData'), 'gip-settings.json');
function loadSettings() {
    try { return JSON.parse(fs.readFileSync(settingsFile(), 'utf-8')); } catch (e) { return {}; }
}
function saveSettings(patch) {
    try { fs.writeFileSync(settingsFile(), JSON.stringify(Object.assign(loadSettings(), patch))); } catch (e) {}
}

// The plugins share one core (plugins/0core.js). If the downloaded update copy has an OLDER core than the one bundled with
// the app, its plugins would run against the wrong API (this is what broke the Health tab: "H.stats is not a function").
// In that case the whole downloaded plugin set is ignored and the bundled plugins run instead.
function coreVersion(file) {
    try { const m = /VERSION = '([^']+)'/.exec(fs.readFileSync(file, 'utf-8')); return m ? m[1] : ''; } catch (e) { return ''; }
}
function cmpVer(a, b) {
    const x = String(a || '0').split('.').map(Number), y = String(b || '0').split('.').map(Number);
    for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d < 0 ? -1 : 1; }
    return 0;
}
let hotPluginsStale = false;
function hotPluginsUsable() {
    if (!hotDir) return false;
    const hotCore = path.join(hotDir, 'plugins', '0core.js');
    if (!fs.existsSync(hotCore)) { hotPluginsStale = false; return true; } // no core of its own: it runs on the bundled core
    const hv = coreVersion(hotCore), bv = coreVersion(path.join(appDir, 'plugins', '0core.js'));
    const ok = !!hv && cmpVer(hv, bv) >= 0;
    if (!ok && !hotPluginsStale) logLine('update copy has core ' + (hv || '?') + ' but the app has ' + bv + ': using bundled plugins');
    hotPluginsStale = !ok;
    return ok;
}

// Every plugin as its own entry, so one broken plugin cannot take the rest down with it.
function getPluginFiles() {
    const dirs = [
        hotPluginsUsable() ? path.join(hotDir, 'plugins') : null,
        path.join(appDir, 'plugins')
    ].filter(Boolean);
    const byName = {};
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        fs.readdirSync(dir).forEach(file => {
            if (file.endsWith('.js') && !(file in byName)) {
                try { byName[file] = fs.readFileSync(path.join(dir, file), 'utf-8'); } catch (e) {}
            }
        });
    }
    return Object.keys(byName).sort().map(file => ({ file, code: byName[file] }));
}

function getThemeCode() {
    const dirs = [
        hotDir ? path.join(hotDir, 'themes') : null,
        path.join(appDir, 'themes')
    ].filter(Boolean);
    const themes = {};
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        fs.readdirSync(dir).forEach(file => {
            if (file.endsWith('.css') && !themes[file]) {
                try { themes[file] = fs.readFileSync(path.join(dir, file), 'utf-8'); } catch (e) {}
            }
        });
    }
    return themes;
}

function hotSource(rel) { if (/^plugins\//.test(rel) && hotPluginsStale) return 'bundled'; return hotDir && fs.existsSync(path.join(hotDir, rel)) ? 'update' : 'bundled'; }
function moveHotAside() {
    if (!hotDir || !fs.existsSync(hotDir)) return false;
    const aside = hotDir + '.broken';
    try { fs.rmSync(aside, { recursive: true, force: true }); } catch (e) {}
    fs.renameSync(hotDir, aside); return true;
}
ipcMain.handle('get-safe-mode', () => safeMode);
ipcMain.handle('restart-safe', () => relaunch(['--safe-mode'], ['--safe-mode']));
ipcMain.handle('log-error', (e, text) => { logLine('page: ' + text); return true; });
ipcMain.handle('open-error-log', () => { try { if (fs.existsSync(errorLogFile())) shell.showItemInFolder(errorLogFile()); else shell.openPath(app.getPath('userData')); } catch (e) {} return true; });
ipcMain.handle('get-run-info', () => {
    const st = loadSettings(); let files = [];
    try { files = getPluginFiles().map(p => ({ file: 'plugins/' + p.file, source: hotSource('plugins/' + p.file) })); } catch (e) {}
    ['main.js', 'preload.js', 'html/client.html'].forEach(f => files.push({ file: f, source: hotSource(f) }));
    return { appVersion: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome, platform: process.platform, safeMode, updates: !!hotDir,
        autoUpdate: autoUpdateOn(), hotTree: st.hotTree || '', rolledBack: st.rolledBack || null, badBoots: st.badBoots || 0, files };
});
// Put the update copy aside and run the files bundled with the app. The same update is not downloaded again until a newer one exists.
ipcMain.handle('reset-hot', () => { try { const st = loadSettings(); moveHotAside(); saveSettings({ badTree: st.hotTree || '', hotTree: '', badBoots: 0, rolledBack: { t: Date.now(), reason: 'manual' } }); } catch (e) { logLine('reset-hot failed: ' + e); } relaunch(); return true; });
// client.html reports whether GIP++ loaded properly. Two bad starts in a row after an update roll back to the bundled files.
ipcMain.handle('boot-result', (e, ok) => {
    const st = loadSettings();
    if (ok) { if (st.badBoots) saveSettings({ badBoots: 0 }); return 'ok'; }
    const bad = (st.badBoots || 0) + 1; saveSettings({ badBoots: bad }); logLine('GIP++ did not load properly (bad start #' + bad + ')');
    if (bad >= 2 && hotDir && fs.existsSync(hotDir)) {
        try { moveHotAside(); saveSettings({ badTree: st.hotTree || '', hotTree: '', badBoots: 0, rolledBack: { t: Date.now(), reason: 'two bad starts' } }); logLine('rolled back to bundled files'); } catch (er) { logLine('rollback failed: ' + er); }
        relaunch();
    }
    return 'bad';
});
ipcMain.handle('get-plugin-files', () => getPluginFiles());
ipcMain.handle('get-themes', () => getThemeCode());
ipcMain.handle('get-asset', (event, assetName) => {
    const safe = safeBase(assetName); // upstream joined the raw name, which allowed ../ reads
    if (!safe) return null;
    const candidates = [
        hotDir ? path.join(hotDir, 'assets', safe) : null,
        path.join(appDir, 'assets', safe)
    ].filter(Boolean);
    for (const assetPath of candidates) {
        if (fs.existsSync(assetPath)) {
            try {
                const base64 = fs.readFileSync(assetPath).toString('base64');
                const ext = path.extname(safe).toLowerCase();
                let mime = 'image/png';
                if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
                if (ext === '.gif') mime = 'image/gif';
                if (ext === '.webp') mime = 'image/webp';
                return `data:${mime};base64,${base64}`;
            } catch (e) {}
        }
    }
    return null;
});

ipcMain.handle('open-external', async (event, url) => {
    if (!safeExternal(url)) return { success: false, error: 'Blocked URL type' };
    try {
        await shell.openExternal(url);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Updates pull from the repo in package.json -> "gip".updateRepo (or YAPPLUS_UPDATE_REPO).
// Set YAPPLUS_NO_HOT=1 to run only the files in this folder and keep the updater off.
function updateRepo() {
    if (!hotDir) return '';
    let fromPkg = '';
    try { fromPkg = (require(path.join(appDir, 'package.json')).gip || {}).updateRepo || ''; } catch (e) {}
    return process.env.YAPPLUS_UPDATE_REPO || fromPkg;
}

async function update() {
    const repo = updateRepo();
    const m = /^([\w.-]+)\/([\w.-]+)$/.exec(repo || '');
    if (!m) {
        return { success: false, error: 'Updates are off in this build. Set "gip.updateRepo" in package.json to enable them.' };
    }
    const repoOwner = m[1];
    const repoName = m[2];
    const branch = 'main';

    try {
        const treeUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}?recursive=1`;
        const response = await fetch(treeUrl, { headers: { 'User-Agent': 'GIPPlusPlus' } });
        if (!response.ok) {
            if (response.status === 403 || response.status === 404) {
                throw new Error(`GitHub API returned ${response.status}. You may have hit the API rate limit (60 req/hr). Try again later.`);
            }
            throw new Error(`GitHub API returned ${response.status}`);
        }

        const treeData = await response.json();
        // After a rollback, do not download the same broken update again. A new push changes the tree id and updates resume.
        if (treeData.sha && treeData.sha === loadSettings().badTree) return { success: true, count: 0, changed: [], skipped: 'rolled back' };
        let updatedCount = 0;
        const validPaths = new Set();
        const SAFE_PATHS = /^(app\.js|main\.js|preload\.js|html\/client\.html|assets\/[^/]+|plugins\/[^/]+|themes\/[^/]+)$/;

        const changed = [];
        const gitSha = (buf) => crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + buf.length + '\0'), buf])).digest('hex');

        for (const file of treeData.tree || []) {
            if (file.type !== 'blob' || !SAFE_PATHS.test(file.path)) continue;
            validPaths.add(file.path);
            const localPath = path.join(hotDir, file.path);
            // Compare against what we would actually run (hot copy if present, else the bundled one) so unchanged
            // files cost no API requests. This keeps automatic checks well under GitHub's 60 requests/hour limit.
            const current = [localPath, path.join(appDir, file.path)].find(p => fs.existsSync(p));
            try { if (current && gitSha(fs.readFileSync(current)) === file.sha && (current === localPath || !fs.existsSync(localPath))) continue; } catch (e) {}
            const blobRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/blobs/${file.sha}`, { headers: { 'User-Agent': 'GIPPlusPlus' } });
            if (!blobRes.ok) continue;
            const blobData = await blobRes.json();
            if (blobData.encoding !== 'base64') continue;
            const remoteBuffer = Buffer.from(blobData.content, 'base64');
            if (!fs.existsSync(localPath) || !fs.readFileSync(localPath).equals(remoteBuffer)) {
                fs.mkdirSync(path.dirname(localPath), { recursive: true });
                fs.writeFileSync(localPath, remoteBuffer);
                updatedCount++;
                changed.push(file.path);
            }
        }

        (function cleanDir(dir) {
            if (!fs.existsSync(dir)) return;
            for (const file of fs.readdirSync(dir)) {
                const fullPath = path.join(dir, file);
                const relPath = path.relative(hotDir, fullPath).replace(/\\/g, '/');
                if (fs.statSync(fullPath).isDirectory()) cleanDir(fullPath);
                else if (!validPaths.has(relPath)) fs.unlinkSync(fullPath);
            }
        })(hotDir);

        // Never keep an update that is OLDER than the app itself (a repo that still holds an old release).
        const hv = coreVersion(path.join(hotDir, 'plugins', '0core.js')), bv = coreVersion(path.join(appDir, 'plugins', '0core.js'));
        if (hv && bv && cmpVer(hv, bv) < 0) {
            try { moveHotAside(); saveSettings({ badTree: treeData.sha || '', hotTree: '' }); logLine('update was core ' + hv + ' but the app is ' + bv + ': ignored'); } catch (e) {}
            return { success: true, count: 0, changed: [], skipped: 'older than this app' };
        }
        if (treeData.sha) saveSettings({ hotTree: treeData.sha });
        return { success: true, count: updatedCount, changed };
    } catch (error) {
        console.error('[Libyapcore] [E]> Update failed:', error);
        return { success: false, error: error.message };
    }
}

// ---- 3.1: downloads, link previews, account sync ------------------------------------------------
// These are called from the Yappin page, so each one checks that the caller really is a trusted Yappin page first.
const fromTrustedPage = (event) => { try { return isTrustedUrl(event.sender.getURL()); } catch (e) { return false; } };
const isWebUrl = (u) => { try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:'; } catch (e) { return false; } };
const MAX_DL = 1024 * 1024 * 1024; // 1 GB
const MIME_EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/avif': '.avif', 'image/svg+xml': '.svg', 'image/bmp': '.bmp', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov', 'audio/mpeg': '.mp3', 'audio/ogg': '.ogg', 'audio/wav': '.wav', 'audio/webm': '.weba', 'application/pdf': '.pdf', 'text/plain': '.txt', 'application/zip': '.zip', 'application/json': '.json' };
const RISKY_EXT = /\.(exe|bat|cmd|com|scr|msi|msp|ps1|psm1|vbs|vbe|js|jse|wsf|wsh|jar|lnk|dll|reg|hta|cpl|pif|appx|msix|apk|sh|command|app|dmg|pkg)$/i;
function cleanName(name) {
    let n = path.basename(String(name || '').split(/[?#]/)[0]);
    try { n = decodeURIComponent(n); } catch (e) {}
    n = n.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/^\.+/, '').replace(/[. ]+$/, '').slice(0, 120);
    if (/^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i.test(n)) n = '_' + n;
    return n || 'file';
}
function uniquePath(dir, name) {
    const ext = path.extname(name), base = name.slice(0, name.length - ext.length);
    let p = path.join(dir, name), i = 1;
    while (fs.existsSync(p)) p = path.join(dir, base + ' (' + (i++) + ')' + ext);
    return p;
}
function headerName(res) {
    const cd = String(res.headers.get('content-disposition') || '');
    const m = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(cd) || /filename\s*=\s*"?([^";]+)"?/i.exec(cd);
    return m ? m[1].trim() : '';
}
const downloadsRoot = () => path.join(app.getPath('downloads'), 'GIP++');
ipcMain.handle('gip-download', async (event, o) => {
    if (!fromTrustedPage(event)) return { success: false, error: 'Not allowed from this page.' };
    o = o || {}; const url = String(o.url || '');
    if (!isWebUrl(url)) return { success: false, error: 'Only web links can be downloaded.' };
    let dest = '';
    try {
        const wc = event.sender; const ses = wc.session;
        const doFetch = ses && typeof ses.fetch === 'function' ? (u, op) => ses.fetch(u, op) : fetch;
        // Only wait 30 seconds for the server to start answering; once the file is flowing it may take as long as it needs (capped at 1 GB).
        // Yappin's own cookies are only sent to Yappin; every other site gets a clean request.
        const ctl = new AbortController(); const startT = setTimeout(() => ctl.abort(), 30000);
        let stall = 0; const poke = () => { clearTimeout(stall); stall = setTimeout(() => ctl.abort(), 60000); }; // gives up if no data arrives for 60 s
        let res; try { res = await doFetch(url, { signal: ctl.signal, credentials: isTrustedUrl(url) ? 'include' : 'omit' }); } finally { clearTimeout(startT); }
        if (!res.ok || !res.body) return { success: false, error: 'The server answered ' + res.status + '.' };
        if ((Number(res.headers.get('content-length')) || 0) > MAX_DL) { try { res.body.cancel(); } catch (e) {} return { success: false, error: 'That file is larger than 1 GB.' }; }
        let name = cleanName(o.name || headerName(res) || url);
        if (!path.extname(name)) { const t = String(res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase(); if (MIME_EXT[t]) name += MIME_EXT[t]; }
        if (!o.ask && RISKY_EXT.test(name)) { try { res.body.cancel(); } catch (e) {} return { success: false, error: 'Programs and scripts are not saved automatically. Turn on "Ask where to save" for this one.' }; }
        if (o.ask) {
            const host = BrowserWindow.fromWebContents(wc.hostWebContents || wc); const opts = { defaultPath: path.join(app.getPath('downloads'), name) };
            const r = await (host ? dialog.showSaveDialog(host, opts) : dialog.showSaveDialog(opts));
            if (r.canceled || !r.filePath) { try { res.body.cancel(); } catch (e) {} return { success: false, canceled: true }; }
            dest = r.filePath;
        } else {
            const dir = o.subdir ? path.join(downloadsRoot(), cleanName(o.subdir)) : downloadsRoot();
            fs.mkdirSync(dir, { recursive: true }); dest = uniquePath(dir, name);
        }
        let bytes = 0;
        const counter = new Transform({ transform(chunk, enc, cb) { poke(); bytes += chunk.length; if (bytes > MAX_DL) return cb(new Error('That file is larger than 1 GB.')); cb(null, chunk); } });
        poke();
        try { await pipeline(Readable.fromWeb(res.body), counter, fs.createWriteStream(dest)); } finally { clearTimeout(stall); }
        if (o.reveal) shell.showItemInFolder(dest);
        return { success: true, path: dest, name: path.basename(dest), bytes };
    } catch (e) {
        if (dest) { try { fs.unlinkSync(dest); } catch (x) {} }
        return { success: false, error: (e && e.message) || String(e) };
    }
});
ipcMain.handle('gip-open-downloads', (event) => {
    if (!fromTrustedPage(event)) return false;
    try { fs.mkdirSync(downloadsRoot(), { recursive: true }); shell.openPath(downloadsRoot()); return true; } catch (e) { return false; }
});

// Link preview (opt-in in the plugin). Fetched here, not in the page: no cookies, never a private or local address,
// at most 3 redirects (each one checked again), small size limits, and the picture comes back as data so the page never contacts the site itself.
function privateIp(ip) {
    if (net.isIPv4(ip)) { const p = ip.split('.').map(Number); return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || p[0] >= 224; }
    const v = ip.toLowerCase(); if (v.startsWith('::ffff:')) return privateIp(v.slice(7));
    return v === '::1' || v === '::' || /^f[cd]/.test(v) || /^fe[89ab]/.test(v);
}
async function publicHost(u) {
    const url = new URL(u); const h = url.hostname.replace(/^\[|\]$/g, '');
    if (/^localhost$|\.local$|\.internal$|\.localhost$/i.test(h)) return false;
    const addrs = net.isIP(h) ? [{ address: h }] : await dns.lookup(h, { all: true });
    return addrs.length > 0 && addrs.every(a => !privateIp(a.address));
}
async function readLimited(res, limit) {
    const chunks = []; let n = 0; const reader = res.body.getReader();
    for (;;) { const { done, value } = await reader.read(); if (done) break; n += value.length; chunks.push(Buffer.from(value)); if (n >= limit) { try { await reader.cancel(); } catch (e) {} break; } }
    return Buffer.concat(chunks).slice(0, limit);
}
async function safeGet(u, accept, limit) {
    let cur = u;
    for (let hop = 0; hop < 4; hop++) {
        if (!isWebUrl(cur) || !(await publicHost(cur))) throw new Error('blocked');
        const res = await fetch(cur, { redirect: 'manual', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GIPPreview)', 'Accept': accept } });
        if (res.status >= 300 && res.status < 400 && res.headers.get('location')) { cur = new URL(res.headers.get('location'), cur).href; continue; }
        if (!res.ok || !res.body) throw new Error('status ' + res.status);
        return { res, url: cur, buf: await readLimited(res, limit) };
    }
    throw new Error('too many redirects');
}
const unent = (s) => String(s || '').replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos|nbsp);/gi, (m, e) => { const t = e.toLowerCase(); if (t === 'amp') return '&'; if (t === 'lt') return '<'; if (t === 'gt') return '>'; if (t === 'quot') return '"'; if (t === 'apos') return "'"; if (t === 'nbsp') return ' '; const c = t[1] === 'x' ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10); try { return String.fromCodePoint(c); } catch (x) { return ''; } }).replace(/\s+/g, ' ').trim();
const metaCache = new Map();
ipcMain.handle('gip-link-meta', async (event, link, wantImage) => {
    if (!fromTrustedPage(event)) return { success: false, error: 'not-allowed' };
    link = String(link || ''); if (!isWebUrl(link)) return { success: false, error: 'bad-url' };
    const hit = metaCache.get(link); if (hit && Date.now() - hit.t < 600000) return hit.v;
    try {
        const { res, url, buf } = await safeGet(link, 'text/html,application/xhtml+xml', 300000);
        if (!/html/i.test(res.headers.get('content-type') || '')) return { success: true, url, title: '', description: '', site: '', image: null };
        const html = buf.toString('utf-8');
        const meta = (k) => { const re = new RegExp('<meta[^>]+(?:property|name)=["\']' + k + '["\'][^>]*>', 'i'); const m = re.exec(html); if (!m) return ''; const c = /content=["']([^"']*)["']/i.exec(m[0]); return c ? unent(c[1]) : ''; };
        const t = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
        const out = { success: true, url, title: (meta('og:title') || meta('twitter:title') || (t ? unent(t[1]) : '')).slice(0, 200), description: (meta('og:description') || meta('description') || meta('twitter:description')).slice(0, 400), site: meta('og:site_name').slice(0, 80), image: null };
        const img = meta('og:image') || meta('twitter:image');
        if (wantImage && img) {
            try {
                const im = await safeGet(new URL(img, url).href, 'image/*', 1500000);
                const type = String(im.res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
                if (/^image\/(png|jpeg|gif|webp|avif)$/.test(type) && im.buf.length) out.image = 'data:' + type + ';base64,' + im.buf.toString('base64');
            } catch (e) {}
        }
        if (metaCache.size > 100) metaCache.clear();
        metaCache.set(link, { t: Date.now(), v: out });
        return out;
    } catch (e) { return { success: false, error: (e && e.message) || 'failed' }; }
});

// Account sync: each account is its own window with its own saved settings. This shared file lets one account
// publish a copy of its settings and another account apply it. Only GIP++ settings are accepted, never logins.
const syncFile = () => path.join(app.getPath('userData'), 'gip-sync.json');
function readSync() { try { const o = JSON.parse(fs.readFileSync(syncFile(), 'utf-8')); return o && o.profiles && typeof o.profiles === 'object' ? o : { profiles: {} }; } catch (e) { return { profiles: {} }; } }
const okProfileId = (id) => id === 'default' || /^[a-z0-9]{4,16}$/.test(String(id));
ipcMain.handle('sync-save', (event, id, name, data) => {
    if (!fromTrustedPage(event)) return { success: false, error: 'Not allowed from this page.' };
    if (!okProfileId(id) || !data || typeof data !== 'object') return { success: false, error: 'Bad request.' };
    const clean = {}; let size = 0;
    for (const k of Object.keys(data)) {
        if (!/^(gip\.|yapplus\.)/.test(k) || /token|password|secret|session|cookie|auth/i.test(k) || typeof data[k] !== 'string') continue;
        size += k.length + data[k].length; if (size > 2500000) return { success: false, error: 'Too much data.' };
        clean[k] = data[k];
    }
    const s = readSync(); s.profiles[id] = { name: String(name || id).slice(0, 40), t: Date.now(), data: clean };
    try { fs.writeFileSync(syncFile(), JSON.stringify(s)); return { success: true, count: Object.keys(clean).length }; } catch (e) { return { success: false, error: e.message }; }
});
ipcMain.handle('sync-list', (event) => {
    if (!fromTrustedPage(event)) return [];
    const s = readSync(); return Object.keys(s.profiles).map(id => ({ id, name: s.profiles[id].name, t: s.profiles[id].t, count: Object.keys(s.profiles[id].data || {}).length }));
});
ipcMain.handle('sync-load', (event, id) => {
    if (!fromTrustedPage(event) || !okProfileId(id)) return null;
    const p = readSync().profiles[id]; return p ? p.data : null;
});

// ---- User counter -------------------------------------------------------------------------------
// Optional. Needs a counter server (see counter-worker/). Off until "gip.counterUrl" in package.json
// (or YAPPLUS_COUNTER_URL) is set to its https URL. The only thing ever sent is a random install id that
// is generated on this computer: no name, account, token, IP log or settings. Turning the
// "User Counter" plugin off in GIP++ stops the ping completely.
function counterUrl() {
    let fromPkg = '';
    try { fromPkg = (require(path.join(appDir, 'package.json')).gip || {}).counterUrl || ''; } catch (e) {}
    return String(process.env.YAPPLUS_COUNTER_URL || fromPkg || 'https://gip-counter.lentzlan000.workers.dev').trim().replace(/\/+$/, '');
}
function installId() {
    const id = loadSettings().installId;
    if (typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)) return id;
    const fresh = crypto.randomUUID();
    saveSettings({ installId: fresh });
    return fresh;
}
ipcMain.handle('gip-count', async (event, ping) => {
    const base = counterUrl();
    if (!/^https:\/\//i.test(base)) return { success: false, error: 'not-configured' };
    try {
        const opts = { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'GIPPlusPlus' } };
        if (ping) {
            opts.method = 'POST';
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify({ id: installId() });
        }
        const res = await fetch(base + (ping ? '/ping' : '/count'), opts);
        if (!res.ok) return { success: false, error: 'HTTP ' + res.status };
        const data = await res.json();
        const total = Number(data.total), active = Number(data.active);
        if (!Number.isFinite(total)) return { success: false, error: 'bad-response' };
        return { success: true, total, active: Number.isFinite(active) ? active : null };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// ---- Automatic updates --------------------------------------------------------------------------
// On launch (and every 6 hours while open) GIP++ checks the update repo and downloads anything that changed.
// If main.js or preload.js changed on launch it restarts once so the new version is the one you run.
// Can be turned off in GIP++ > Settings > Updates.
const autoUpdateOn = () => loadSettings().autoUpdate !== false;
// Lets the active GIP++ theme switch the app's own light/dark mode (prefers-color-scheme) to match, and put it back after.
ipcMain.handle('set-native-theme', (event, mode) => {
    try { nativeTheme.themeSource = (mode === 'light' || mode === 'dark') ? mode : 'system'; return nativeTheme.themeSource; } catch (e) { return null; }
});
ipcMain.handle('get-auto-update', () => autoUpdateOn());
ipcMain.handle('set-auto-update', (event, on) => { saveSettings({ autoUpdate: !!on }); return !!on; });
const CORE_FILES = ['main.js', 'preload.js'];

ipcMain.handle('update', async () => update());
ipcMain.handle('restart-app', () => { relaunch([], ['--safe-mode']); });

// ---- Alt manager --------------------------------------------------------------------------------
// Each account profile gets its own webview partition (own cookies/login/localStorage) and its own window,
// so several accounts can be signed in and open at the same time. 'default' keeps the original partition.
const DEFAULT_PROFILE = { id: 'default', name: 'Main', color: '' };
const partitionFor = (id) => id === 'default' ? 'persist:yapper' : 'persist:yapper-' + id;
function cleanProfile(p) {
    if (!p || typeof p !== 'object') return null;
    const id = String(p.id || '');
    if (!/^[a-z0-9]{4,16}$/.test(id) && id !== 'default') return null;
    const name = String(p.name || '').replace(/[\r\n\t]/g, ' ').trim().slice(0, 32);
    const color = /^#[0-9a-f]{6}$/i.test(p.color || '') ? p.color.toLowerCase() : '';
    return { id, name: name || (id === 'default' ? 'Main' : 'Alt'), color };
}
function getProfiles() {
    const saved = (loadSettings().profiles || []).map(cleanProfile).filter(p => p && p.id !== 'default');
    const def = cleanProfile(Object.assign({}, DEFAULT_PROFILE, loadSettings().defaultProfile || {}, { id: 'default' }));
    return [def].concat(saved);
}
const clientWindows = new Map();      // profile id -> BrowserWindow
const profileOfContents = new Map();  // webContents id (window or its webview) -> profile id
const senderProfile = (event) => {
    const wc = event.sender;
    const id = profileOfContents.get(wc.id) || (wc.hostWebContents && profileOfContents.get(wc.hostWebContents.id)) || 'default';
    return getProfiles().find(p => p.id === id) || getProfiles()[0];
};
ipcMain.handle('alts-self', (event) => senderProfile(event));
ipcMain.handle('alts-list', () => getProfiles().map(p => Object.assign({}, p, { open: clientWindows.has(p.id) && !clientWindows.get(p.id).isDestroyed() })));
ipcMain.handle('alts-save', (event, p) => {
    const c = cleanProfile(p);
    if (!c) return { success: false, error: 'Invalid profile' };
    if (c.id === 'default') {
        saveSettings({ defaultProfile: { name: c.name, color: c.color } });
    } else {
        const list = (loadSettings().profiles || []).map(cleanProfile).filter(Boolean);
        const i = list.findIndex(x => x.id === c.id);
        if (i >= 0) list[i] = c; else if (list.length >= 12) return { success: false, error: 'Up to 12 alts' }; else list.push(c);
        saveSettings({ profiles: list });
    }
    const win = clientWindows.get(c.id);
    if (win && !win.isDestroyed()) win.setTitle('GIP++ - ' + c.name);
    return { success: true, profile: c };
});
ipcMain.handle('alts-new', (event, name, color) => {
    const id = crypto.randomBytes(4).toString('hex');
    const c = cleanProfile({ id, name, color });
    const list = (loadSettings().profiles || []).map(cleanProfile).filter(Boolean);
    if (list.length >= 12) return { success: false, error: 'Up to 12 alts' };
    list.push(c);
    saveSettings({ profiles: list });
    return { success: true, profile: c };
});
ipcMain.handle('alts-open', (event, id) => {
    const p = getProfiles().find(x => x.id === id);
    if (!p) return { success: false, error: 'No such profile' };
    openClient(p);
    return { success: true };
});
ipcMain.handle('alts-delete', async (event, id) => {
    if (id === 'default') return { success: false, error: 'The main profile cannot be deleted' };
    const p = getProfiles().find(x => x.id === id);
    if (!p) return { success: false, error: 'No such profile' };
    const win = clientWindows.get(id);
    if (win && !win.isDestroyed()) win.destroy();
    try { await session.fromPartition(partitionFor(id)).clearStorageData(); } catch (e) {}
    saveSettings({ profiles: (loadSettings().profiles || []).filter(x => x && x.id !== id) });
    return { success: true };
});

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const pickerDone = new WeakSet();
function installScreenPicker(ses) {
    // Each account's webview has its own partition (see client.html), NOT the default session.
    // The handler has to be on that session or getDisplayMedia never reaches the picker.
    if (pickerDone.has(ses)) return;
    pickerDone.add(ses);
    ses.setDisplayMediaRequestHandler(async (request, callback) => {
        let finished = false;
        const finish = (streams) => { if (finished) return; finished = true; callback(streams); };
        try {
            const sources = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 320, height: 180 } });
            const sourcesData = sources.map(s => ({ id: s.id, name: s.name, thumbnail: s.thumbnail.toDataURL() }));

            const pickerWindow = new BrowserWindow({
                width: 860, height: 640, title: 'Select Screen to Share',
                autoHideMenuBar: true, alwaysOnTop: true,
                webPreferences: { nodeIntegration: true, contextIsolation: false }
            });

            // Window titles are untrusted text, so everything is escaped (upstream pasted names straight into HTML).
            const html = `<html><body style="background:#080808;color:#f3f3f1;font-family:Futura,'Century Gothic',sans-serif;padding:20px;">
                <h2 style="margin-top:0;font-weight:400;font-family:'Times New Roman',serif;font-size:28px;">Select a screen or window to share</h2>
                <div style="display:flex;flex-wrap:wrap;gap:14px;">
                ${sourcesData.map((s, i) => `
                    <div onclick="pick(${i})" style="cursor:pointer;text-align:center;width:240px;padding:10px;border:1px solid #444;">
                        <img src="${esc(s.thumbnail)}" style="width:100%;border:1px solid #222;" />
                        <div style="margin-top:8px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(s.name)}</div>
                    </div>`).join('')}
                </div>
                <script>
                    const { ipcRenderer } = require('electron');
                    window.pick = (i) => ipcRenderer.send('picked-screen', i);
                </script></body></html>`;
            pickerWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

            const onPick = (event, index) => {
                if (event.sender !== pickerWindow.webContents) return;
                const picked = sourcesData[index];
                ipcMain.removeListener('picked-screen', onPick);
                pickerWindow.close();
                if (!picked) return finish({});
                const streams = { video: sources[index] };
                if (request.audioRequested && process.platform === 'win32') streams.audio = 'loopback';
                finish(streams);
            };
            ipcMain.on('picked-screen', onPick);
            pickerWindow.on('closed', () => {
                ipcMain.removeListener('picked-screen', onPick);
                finish({});
            });
        } catch (err) {
            console.error('Screen picker failed:', err);
            finish({});
        }
    });
}

function openClient(profile) {
    const existing = clientWindows.get(profile.id);
    if (existing && !existing.isDestroyed()) { if (existing.isMinimized()) existing.restore(); existing.focus(); return; }
    const preloadPath = resolve('preload.js').replace(/\\/g, '/');
    const clientPath = resolve('html/client.html');

    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        backgroundColor: '#080808',
        title: 'GIP++' + (profile.id === 'default' ? '' : ' - ' + profile.name),
        icon: path.join(appDir, 'assets', 'Icon.ico'),
        webPreferences: {
            webviewTag: true,
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            additionalArguments: [`--preload-path=${preloadPath}`]
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (isTrustedUrl(url)) return { action: 'allow' };
        if (safeExternal(url)) shell.openExternal(url);
        return { action: 'deny' };
    });

    watchShift(mainWindow.webContents);
    let guest = null;
    const ZOOM_MIN = 0.5, ZOOM_MAX = 3;
    let zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(loadSettings().zoom) || 1));
    const setZoom = (z) => {
        zoom = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)) * 100) / 100;
        if (guest && !guest.isDestroyed()) guest.setZoomFactor(zoom);
        saveSettings({ zoom });
    };

    // Mouse side buttons (Windows sends these as app commands)
    // The GIP++ Back/Forward plugin (deprecated, off by default) walks the servers/channels you visited. If it is off, Yappin's own back/forward handles the buttons.
    mainWindow.on('app-command', (e, cmd) => {
        if (!guest || guest.isDestroyed()) return;
        const dir = cmd === 'browser-backward' ? 'back' : cmd === 'browser-forward' ? 'forward' : null;
        if (!dir) return;
        guest.executeJavaScript(`typeof window.__gipNavHandle === 'function' ? (window.__gipNavHandle('${dir}'), true) : false`).then((handled) => {
            // Not handled here means the plugin is off: Yappin's own back/forward takes the mouse event, so do nothing
            // (going through browser history as well would jump twice).
            void handled;
        }).catch(() => {});
    });

    mainWindow.webContents.on('did-attach-webview', (event, wc) => {
        guest = wc;
        watchShift(wc);
        wc.on('dom-ready', () => wc.setZoomFactor(zoom));
        // If the page process crashes, reload it (at most 3 times in 5 minutes) instead of leaving a dead window.
        const crashes = [];
        wc.on('render-process-gone', (ev, d) => {
            logLine('page process gone: ' + (d && d.reason));
            if (!d || d.reason === 'clean-exit') return;
            const now = Date.now(); while (crashes.length && now - crashes[0] > 300000) crashes.shift(); crashes.push(now);
            if (crashes.length <= 3) setTimeout(() => { try { if (!wc.isDestroyed()) wc.reload(); } catch (e) {} }, 1000);
        });

        // Links/files that open a new tab or window (target="_blank", window.open) happen inside the WEBVIEW, so the
        // handler on mainWindow never saw them and they silently did nothing. Send them to the real browser.
        wc.setWindowOpenHandler(({ url }) => {
            if (safeExternal(url)) shell.openExternal(url);
            return { action: 'deny' };
        });

        // Zoom, DevTools and reload shortcuts. The menu is removed, so none of these worked before.
        wc.on('before-input-event', (ev, input) => {
            if (input.type !== 'keyDown') return;
            const mod = input.control || input.meta;
            const k = input.key;
            if (mod && (k === '=' || k === '+')) { ev.preventDefault(); setZoom(zoom + 0.1); }
            else if (mod && (k === '-' || k === '_')) { ev.preventDefault(); setZoom(zoom - 0.1); }
            else if (mod && k === '0') { ev.preventDefault(); setZoom(1); }
            else if ((mod && input.shift && (k === 'I' || k === 'i')) || k === 'F12') { ev.preventDefault(); wc.openDevTools({ mode: 'detach' }); }
            else if (k === 'F5' || (mod && !input.shift && (k === 'r' || k === 'R'))) { ev.preventDefault(); wc.reload(); }
        });
        // Ctrl + mouse wheel
        wc.on('zoom-changed', (ev, direction) => setZoom(zoom + (direction === 'in' ? 0.1 : -0.1)));

        const linkHook = `
            document.addEventListener('click', (e) => {
                if (e.defaultPrevented) return; // Yappin's own "leaving the app" warning (or Link Preview) already took this click
                const a = e.target.closest ? e.target.closest('a') : null;
                if (!a) return;
                const href = a.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
                let host = '';
                try { host = new URL(a.href).hostname; } catch (err) { return; }
                const trusted = ${JSON.stringify(TRUSTED_HOSTS)}.some(h => host === h || host.endsWith('.' + h));
                if (trusted) return;
                if (href.startsWith('http://') || href.startsWith('https://')) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.electronAPI.openExternal(href);
                }
            }, false);
        `;
        wc.on('dom-ready', () => { wc.executeJavaScript(`if (!window.__gipLinkHook) { window.__gipLinkHook = true; ${linkHook} }`).catch(() => {}); });

        wc.on('will-navigate', (event, url) => {
            if (!isTrustedUrl(url)) {
                event.preventDefault();
                if (safeExternal(url)) shell.openExternal(url);
            }
        });
    });

    // client.html has its own <title>, which would overwrite the per-account window title.
    mainWindow.on('page-title-updated', (e) => e.preventDefault());
    clientWindows.set(profile.id, mainWindow);
    profileOfContents.set(mainWindow.webContents.id, profile.id);
    mainWindow.webContents.on('did-attach-webview', (event, wc) => { profileOfContents.set(wc.id, profile.id); installScreenPicker(wc.session); });
    mainWindow.on('closed', () => { clientWindows.delete(profile.id); });
    mainWindow.loadFile(clientPath, { query: { profile: profile.id } });
}

app.on('second-instance', () => {
    const w = Array.from(clientWindows.values()).find(x => x && !x.isDestroyed());
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});
app.whenReady().then(async () => {
    if (!gotLock) return;
    Menu.setApplicationMenu(null);
    installScreenPicker(session.defaultSession);

    // Update before the window opens (max 6 s so a slow network never blocks startup).
    if (autoUpdateOn()) {
        try {
            const r = await Promise.race([update(), new Promise(res => setTimeout(() => res(null), 6000))]);
            if (r && r.success && (r.changed || []).some(f => CORE_FILES.includes(f)) && !process.argv.includes('--gip-updated')) {
                relaunch(['--gip-updated']);
                return;
            }
        } catch (e) { console.error('[GIP++] auto-update failed:', e); }
        setInterval(() => { if (autoUpdateOn()) update().catch(() => {}); }, 6 * 60 * 60 * 1000);
    }

    openClient(getProfiles()[0]);
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
