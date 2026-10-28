const doubleclickreply = {
  id: 'doubleclickreply',
  name: 'Double Click Reply',
  description: `Double click another dude's message to reply to it and your own to edit it`,
  skip: 'button, a, input, textarea, select, img, video, audio, .msg-actions, .reactions, .reply-preview, .mention, .msg-image, .msg-linkimgs, .msg-edited',
  ondown: null,
  ondbl: null,
  findmsg(target) {
    if (!target || !target.closest) return null;
    if (target.closest(this.skip)) return null;
    const msg = target.closest('.messages .msg[data-message-id]');
    if (!msg || msg.hasAttribute('data-yp-ghost')) return null;
    return msg;
  },
  start() {
    if (this.ondbl) return;
    const self = this;
    this.ondown = function (e) {
      if (e.button !== 0 || e.detail < 2) return;
      if (self.findmsg(e.target)) e.preventDefault();
    };
    this.ondbl = function (e) {
      const msg = self.findmsg(e.target);
      if (!msg) return;
      const edit = msg.querySelector('.msg-actions button[aria-label="Edit"]');
      const reply = msg.querySelector('.msg-actions button[aria-label="Reply"]');
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
      if (edit) edit.click();
      else if (reply) reply.click();
    };

    document.addEventListener('mousedown', this.ondown, true);
    document.addEventListener('dblclick', this.ondbl, true);
  },
  stop() {
    if (this.ondown) document.removeEventListener('mousedown', this.ondown, true);
    if (this.ondbl) document.removeEventListener('dblclick', this.ondbl, true);
    this.ondown = null;
    this.ondbl = null;
  },
};

window.PluginHost.register(doubleclickreply);