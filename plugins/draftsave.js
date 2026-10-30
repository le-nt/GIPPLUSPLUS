const draftsaved = {
  id: 'draftsaved',
  name: 'Draft Saver',
  description: 'Saves your unsent message drafts per channel so you dont lose them if you refresh or switch channels. (By @ood)',
  offs: null,
  saveTimer: null,
  isRestoring: false,

  getKey() {
    const cid = messagelogger.currentChannelId();
    return cid ? `yapplus.draft.${cid}` : null;
  },

  findComposer() {
    return document.querySelector('.composer textarea, .composer-box textarea, textarea.msg-input') || document.querySelector('.composer textarea');
  },

  // Everything comes from the shared GIP++ event bus (0core.js): 'sent' clears the draft when YOU send,
  // 'dom' and 'channel' find the message box again after Yappin redraws it. No page watcher or WebSocket patch of its own.
  // (The old version cleared the draft whenever ANYONE posted in the channel; now only your own send does.)
  start() {
    if (this.offs) return;
    const self = this; const E = window.YapPlus.events;
    this.offs = [
      E.on('sent', () => { setTimeout(() => { const key = self.getKey(); if (key) localStorage.removeItem(key); }, 50); }, 'draftsaved'),
      E.on('dom', () => self.hook(), 'draftsaved'),
      E.on('channel', () => { self.hook(); setTimeout(() => { const c = self.findComposer(); if (c && !c.value) self.restoreDraft(c); }, 300); }, 'draftsaved'),
    ];
    this.hook();
    console.log('[DraftSaver] armed');
  },

  hook() {
    const composer = this.findComposer();
    if (!composer || composer.dataset.ypDraftHooked) return;
    const self = this;
    composer.dataset.ypDraftHooked = '1';
    self.restoreDraft(composer);
    composer.__ypDraftInput = () => {
      if (self.isRestoring) return;
      clearTimeout(self.saveTimer);
      self.saveTimer = setTimeout(() => self.saveDraft(composer), 400);
    };
    composer.addEventListener('input', composer.__ypDraftInput);
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
    if (this.offs) { window.YapPlus.util.offAll(this.offs); this.offs = null; }
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
