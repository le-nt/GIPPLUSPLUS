const notyping = {
  id: 'notyping',
  name: 'SilentTyping',
  description: "So sigma and mysterious #alphawolf",
  origSend: null,
  
  start() {
    if (this.origSend) return;
    this.origSend = WebSocket.prototype.send;
    const orig = this.origSend;
    WebSocket.prototype.send = function (data) {
      try {
        if (typeof data === 'string') {
          const f = JSON.parse(data);
          if (f && f.type === 'typing') return; 
        }
      } catch (e) {}
      return orig.call(this, data);
    };
  },
  
  stop() {
    if (this.origSend) {
      WebSocket.prototype.send = this.origSend;
      this.origSend = null;
    }
  },
};

PluginHost.register(notyping);