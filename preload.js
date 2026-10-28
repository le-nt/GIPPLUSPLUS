const { contextBridge, ipcRenderer } = require('electron');

const preloadPathArg = process.argv.find(arg => arg.startsWith('--preload-path='));
const preloadPath = preloadPathArg ? preloadPathArg.split('=')[1] : '';

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
    userCount: (ping) => ipcRenderer.invoke('gip-count', !!ping)
});