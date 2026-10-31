const { contextBridge, ipcRenderer } = require('electron');

const preloadPathArg = process.argv.find(arg => arg.startsWith('--preload-path='));
// slice, not split('='): an install path that contains an "=" used to be cut off there, so the page got a broken preload path.
const preloadPath = preloadPathArg ? preloadPathArg.slice('--preload-path='.length) : '';

contextBridge.exposeInMainWorld('electronAPI', {
    getPluginFiles: () => ipcRenderer.invoke('get-plugin-files'),
    getAsset: (assetName) => ipcRenderer.invoke('get-asset', assetName),
    update: () => ipcRenderer.invoke('update'),
    getPreloadPath: () => preloadPath,
    restartApp: () => ipcRenderer.invoke('restart-app'),
    getThemes: () => ipcRenderer.invoke('get-themes'),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    setNativeTheme: (mode) => ipcRenderer.invoke('set-native-theme', mode),
    getAutoUpdate: () => ipcRenderer.invoke('get-auto-update'),
    setAutoUpdate: (on) => ipcRenderer.invoke('set-auto-update', on),
    altsSelf: () => ipcRenderer.invoke('alts-self'),
    altsList: () => ipcRenderer.invoke('alts-list'),
    altsSave: (p) => ipcRenderer.invoke('alts-save', p),
    altsNew: (name, color) => ipcRenderer.invoke('alts-new', name, color),
    altsOpen: (id) => ipcRenderer.invoke('alts-open', id),
    altsDelete: (id) => ipcRenderer.invoke('alts-delete', id),
    getSafeMode: () => ipcRenderer.invoke('get-safe-mode'),
    restartSafe: () => ipcRenderer.invoke('restart-safe'),
    getRunInfo: () => ipcRenderer.invoke('get-run-info'),
    resetHot: () => ipcRenderer.invoke('reset-hot'),
    bootResult: (ok) => ipcRenderer.invoke('boot-result', !!ok),
    logError: (text) => ipcRenderer.invoke('log-error', String(text)),
    openErrorLog: () => ipcRenderer.invoke('open-error-log'),
    userCount: (ping) => ipcRenderer.invoke('gip-count', !!ping),
    download: (o) => ipcRenderer.invoke('gip-download', o),
    openDownloads: () => ipcRenderer.invoke('gip-open-downloads'),
    linkMeta: (url, wantImage) => ipcRenderer.invoke('gip-link-meta', String(url), !!wantImage),
    syncSave: (id, name, data) => ipcRenderer.invoke('sync-save', id, name, data),
    syncList: () => ipcRenderer.invoke('sync-list'),
    syncLoad: (id) => ipcRenderer.invoke('sync-load', id)
});