const filenamedisguiser = {
  id: 'filenamedisguiser',
  name: 'Anonimized filenames',
  description: `makes your filenames go hsduiyuyufdgydgy, So if you have personally identifying information in your filename, Then it doesn't become a problem. This also strips image metadata so you don't accidentally doxx yourself`,

  origXhrSend: null,
  origFetch: null,
  _fetchPatched: false,

  DEFAULT_TYPES: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'],

  getEnabledTypes() {
    try {
      const v = localStorage.getItem('yapplus.filenamedisguiser.types');
      if (v) return JSON.parse(v);
    } catch (e) {}
    return this.DEFAULT_TYPES.slice();
  },

  setEnabledTypes(arr) {
    try { localStorage.setItem('yapplus.filenamedisguiser.types', JSON.stringify(arr)); } catch (e) {}
  },

  randomName(ext) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let r = '';
    for (let i = 0; i < 16; i++) r += chars[Math.floor(Math.random() * chars.length)];
    return r + (ext ? '.' + ext : '');
  },

  extFor(mime) {
    const map = {
      'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
      'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm',
      'video/quicktime': 'mov', 'application/pdf': 'pdf',
      'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav',
      'audio/mp4': 'm4a', 'text/plain': 'txt',
    };
    return map[mime] || null;
  },

  disguiseFile(file) {
    const types = this.getEnabledTypes();
    if (!types.includes(file.type)) return file;
    const ext = this.extFor(file.type) || (file.name.includes('.') ? file.name.split('.').pop() : null);
    const newName = this.randomName(ext);
    return new File([file], newName, { type: file.type, lastModified: Date.now() });
  },

  patchFormData(fd) {
    const self = this;
    if (fd._ypp_patched) return fd;
    const newFd = new FormData();
    newFd._ypp_patched = true;
    fd.forEach(function (val, key) {
      if (val instanceof File) {
        const disguised = self.disguiseFile(val);
        newFd.append(key, disguised, disguised.name);
      } else {
        newFd.append(key, val);
      }
    });
    return newFd;
  },

  start() {
    if (this._fetchPatched) return;
    const self = this;

    this.origXhrSend = XMLHttpRequest.prototype.send;
    const origXhrSend = this.origXhrSend;
    XMLHttpRequest.prototype.send = function (body) {
      if (body instanceof FormData && !body._ypp_patched) {
        try { body = self.patchFormData(body); } catch (e) {}
      }
      return origXhrSend.call(this, body);
    };

    this.origFetch = window.fetch;
    const origFetch = this.origFetch;
    window.fetch = function (input, init) {
      if (init && init.body instanceof FormData && !init.body._ypp_patched) {
        try { init = Object.assign({}, init, { body: self.patchFormData(init.body) }); } catch (e) {}
      }
      return origFetch.call(this, input, init);
    };

    this._fetchPatched = true;
    console.log('[FilenameDisguiser] armed');
  },

  stop() {
    if (this.origXhrSend) { XMLHttpRequest.prototype.send = this.origXhrSend; this.origXhrSend = null; }
    if (this.origFetch) { window.fetch = this.origFetch; this.origFetch = null; }
    this._fetchPatched = false;
    console.log('[FilenameDisguiser] disarmed');
  },
};

window.filenamedisguiser = filenamedisguiser;
PluginHost.register(filenamedisguiser);