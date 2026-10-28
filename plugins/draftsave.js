const draftsaved = {
  id: 'draftsaved',
  name: 'Draft Saver',
  description: 'Saves your unsent message drafts per channel so you dont lose them if you refresh or switch channels. (By @ood)',
  origFetch: null,
  origAddEventListener: null,
  saveTimer: null,
  isRestoring: false,
  pendingRestore: false,

  getKey() {
    const cid = messagelogger.currentChannelId();
    return cid ? `yapplus.draft.${cid}` : null;
  },

  findComposer() {
    return document.querySelector('.composer textarea, .composer-box textarea, textarea.msg-input') || document.querySelector('.composer textarea');
  },

  start() {
    const self = this;
    if (this.origAddEventListener) return;

    if (!this.origAddEventListener) this.origAddEventListener = WebSocket.prototype.addEventListener;
    const origAddEL = this.origAddEventListener;

    WebSocket.prototype.addEventListener = function (type, listener, options) {
      if (type !== 'message') return origAddEL.call(this, type, listener, options);
      const wrapped = function (ev) {
        if (!self.isRestoring && !self.pendingRestore) {
          try {
            const frame = JSON.parse(ev.data);
            const data = frame && frame.payload && frame.payload.data;
            if (data && data.table === 'messages' && (data.type === 'INSERT' || frame.event === 'INSERT')) {
              const record = data.record;
              const cid = messagelogger.currentChannelId();
              if (record && record.channel_id === cid) {
                const key = self.getKey();
                if (key) localStorage.removeItem(key);
              }
            }
          } catch (e) {}
        }
        return listener.call(this, ev);
      };
      return origAddEL.call(this, type, wrapped, options);
    };

    this.installListeners();
    console.log('[DraftSaver] armed');
  },

  installListeners() {
    const self = this;
    const attach = () => {
      const composer = this.findComposer();
      if (!composer || composer.dataset.ypDraftHooked) return false;
      composer.dataset.ypDraftHooked = '1';

      self.restoreDraft(composer);

      composer.__ypDraftInput = () => {
        if (self.isRestoring) return;
        clearTimeout(self.saveTimer);
        self.saveTimer = setTimeout(() => self.saveDraft(composer), 400);
      };
      composer.addEventListener('input', composer.__ypDraftInput);

      composer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          setTimeout(() => {
            const key = self.getKey();
            if (key) localStorage.removeItem(key);
          }, 50);
        }
      });
      return true;
    };

    if (!attach()) {
      const obs = new MutationObserver(() => { if (attach()) obs.disconnect(); });
      obs.observe(document.body, { childList: true, subtree: true });
    }

    if (!this.navObserver) {
      this.navObserver = new MutationObserver(() => {
        const composer = this.findComposer();
        if (composer && !composer.dataset.ypDraftHooked) {
          this.installListeners();
        }
      });
      this.navObserver.observe(document.body, { childList: true, subtree: true });
    }
  },

  saveDraft(composer) {
    const key = this.getKey();
    if (!key) return;
    const val = composer.value;
    if (val && val.trim()) localStorage.setItem(key, val);
    else localStorage.removeItem(key);
  },

  restoreDraft(composer) {
    const key = this.getKey();
    if (!key) return;
    const saved = localStorage.getItem(key);
    if (saved) {
      this.isRestoring = true;
      composer.value = saved;
      composer.dispatchEvent(new Event('input', { bubbles: true }));
      setTimeout(() => { this.isRestoring = false; }, 100);
    }
  },

  stop() {
    if (this.origAddEventListener) {
      WebSocket.prototype.addEventListener = this.origAddEventListener;
      this.origAddEventListener = null;
    }
    if (this.navObserver) { this.navObserver.disconnect(); this.navObserver = null; }
    clearTimeout(this.saveTimer);
    const composer = this.findComposer();
    if (composer) {
      if (composer.__ypDraftInput) { composer.removeEventListener('input', composer.__ypDraftInput); delete composer.__ypDraftInput; }
      delete composer.dataset.ypDraftHooked;
    }
    console.log('[DraftSaver] disarmed');
  },
};

PluginHost.register(draftsaved);