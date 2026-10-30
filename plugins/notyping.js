const notyping = {
  id: 'notyping',
  name: 'SilentTyping',
  description: "So sigma and mysterious #alphawolf",
  
  start() {
    // Goes through the GIP++ patch registry, so turning other plugins on or off can never undo this (or be undone by it).
    window.YapPlus.patches.add('notyping', WebSocket.prototype, 'send', (next) => function (data) {
      try {
        if (typeof data === 'string') {
          const f = JSON.parse(data);
          if (f && f.type === 'typing') return;
        }
      } catch (e) {}
      return next.call(this, data);
    });
  },
  
  stop() {
    window.YapPlus.patches.removeOwner('notyping');
  },
};

PluginHost.register(notyping);
