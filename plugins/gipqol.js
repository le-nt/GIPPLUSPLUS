// GIP quality-of-life plugins (client side only).

const giptextcursor = {
  id: 'giptextcursor',
  origin: 'gip',
  name: 'Text Cursor In Chat',
  description: 'Shows the text-selection cursor when you hover over message text.',
  el: null,
  start() {
    if (this.el) return;
    this.el = document.createElement('style');
    this.el.id = 'gip-textcursor';
    this.el.textContent = '.msg .msg-text, .msg .msg-text *:not(a):not(button):not(img):not(video){cursor:text !important;} .msg .msg-text{user-select:text;}';
    document.head.appendChild(this.el);
  },
  stop() { if (this.el) { this.el.remove(); this.el = null; } },
};
window.PluginHost.register(giptextcursor);

const giphifimic = {
  id: 'giphifimic',
  origin: 'gip',
  name: 'Hi-Fi Mic (experimental)',
  description: 'Asks for a raw stereo microphone: no echo cancel, noise suppression or auto gain, 48kHz. Use headphones or you will echo. Rejoin voice after toggling.',
  origGum: null,
  origOffer: null,
  origAnswer: null,
  munge(sdp) {
    if (typeof sdp !== 'string') return sdp;
    return sdp.replace(/a=fmtp:(\d+) ([^\r\n]*)/g, (line, pt, params) => {
      if (!/useinbandfec|minptime/.test(params) || /stereo=1/.test(params)) return line;
      return `a=fmtp:${pt} ${params};stereo=1;sprop-stereo=1;maxaveragebitrate=128000`;
    });
  },
  start() {
    if (this.on) return;
    this.on = true;
    const self = this;
    const md = navigator.mediaDevices; const P = window.YapPlus.patches;
    if (md && md.getUserMedia) {
      P.add('giphifimic', md, 'getUserMedia', (next) => function (constraints) {
        if (constraints && constraints.audio) {
          const base = typeof constraints.audio === 'object' ? constraints.audio : {};
          constraints = Object.assign({}, constraints, {
            audio: Object.assign({}, base, {
              channelCount: { ideal: 2 }, sampleRate: { ideal: 48000 },
              echoCancellation: false, noiseSuppression: false, autoGainControl: false,
            }),
          });
        }
        return next.call(this, constraints);
      });
    }
    const proto = window.RTCPeerConnection && window.RTCPeerConnection.prototype;
    if (proto) {
      ['createOffer', 'createAnswer'].forEach((name) => {
        P.add('giphifimic', proto, name, (next) => function () {
          return next.apply(this, arguments).then((d) => {
            if (d && d.sdp) { try { d.sdp = self.munge(d.sdp); } catch (e) {} }
            return d;
          });
        });
      });
    }
    console.log('[GIP HiFi Mic] armed');
  },
  stop() {
    window.YapPlus.patches.removeOwner('giphifimic'); this.on = false;
    console.log('[GIP HiFi Mic] disarmed');
  },
};
window.PluginHost.register(giphifimic);
