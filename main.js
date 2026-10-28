// GIP++ main process.
// Based on Yap++ by salami (Apache-2.0). Changes from upstream are listed in CHANGES.md.
const { app, BrowserWindow, ipcMain, Menu, shell, desktopCapturer, session, nativeTheme } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

// Every plugin as its own entry, so one broken plugin cannot take the rest down with it.
function getPluginFiles() {
    const dirs = [
        hotDir ? path.join(hotDir, 'plugins') : null,
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
function getPluginCode() {
    return getPluginFiles().map(p => `\n// [Libyapcore] [P.L]> ${p.file} >.<\n${p.code}\n`).join('');
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

        return { success: true, count: updatedCount, changed };
    } catch (error) {
        console.error('[Libyapcore] [E]> Update failed:', error);
        return { success: false, error: error.message };
    }
}

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
ipcMain.handle('restart-app', () => {
    app.relaunch();
    app.exit(0);
});

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
    if (win && !win.isDestroyed()) win.setTitle('GIP++ (Unofficial) - ' + c.name);
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
        title: 'GIP++ (Unofficial)' + (profile.id === 'default' ? '' : ' - ' + profile.name),
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

    let guest = null;
    const ZOOM_MIN = 0.5, ZOOM_MAX = 3;
    let zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(loadSettings().zoom) || 1));
    const setZoom = (z) => {
        zoom = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)) * 100) / 100;
        if (guest && !guest.isDestroyed()) guest.setZoomFactor(zoom);
        saveSettings({ zoom });
    };

    // Mouse side buttons (Windows sends these as app commands)
    // The GIP++ Back/Forward plugin walks the servers/channels you visited; if it is off, fall back to browser history.
    mainWindow.on('app-command', (e, cmd) => {
        if (!guest || guest.isDestroyed()) return;
        const dir = cmd === 'browser-backward' ? 'back' : cmd === 'browser-forward' ? 'forward' : null;
        if (!dir) return;
        guest.executeJavaScript(`typeof window.__gipNavHandle === 'function' ? (window.__gipNavHandle('${dir}'), true) : false`).then((handled) => {
            if (handled || guest.isDestroyed()) return;
            const h = guest.navigationHistory;
            if (dir === 'back' && h && h.canGoBack()) h.goBack();
            if (dir === 'forward' && h && h.canGoForward()) h.goForward();
        }).catch(() => {});
    });

    mainWindow.webContents.on('did-attach-webview', (event, wc) => {
        guest = wc;
        wc.on('dom-ready', () => wc.setZoomFactor(zoom));

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
            }, true);
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

app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    installScreenPicker(session.defaultSession);

    // Update before the window opens (max 6 s so a slow network never blocks startup).
    if (autoUpdateOn()) {
        try {
            const r = await Promise.race([update(), new Promise(res => setTimeout(() => res(null), 6000))]);
            if (r && r.success && (r.changed || []).some(f => CORE_FILES.includes(f)) && !process.argv.includes('--gip-updated')) {
                app.relaunch({ args: process.argv.slice(1).concat('--gip-updated') });
                app.exit(0);
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
