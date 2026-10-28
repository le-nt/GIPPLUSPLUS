const oneko = {
    id: 'oneko',
    name: 'Oneko',
    description: 'A little cat that follows your mouse around (real) (credits: @shizu)',
    SPRITE: 'https://raw.githubusercontent.com/adryd325/oneko.js/14bab15a755d0e35cd4ae19c931d96d306f99f42/oneko.gif',
    SPEED: 10,
    el: null,
    _rafId: null,
    _onMouseMove: null,
    nekoPosX: 32,
    nekoPosY: 32,
    mousePosX: 0,
    mousePosY: 0,
    frameCount: 0,
    idleTime: 0,
    idleAnimation: null,
    idleAnimationFrame: 0,
    _lastTs: null,

    SPRITES: {
      idle: [[-3, -3]],
      alert: [[-7, -3]],
      scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
      scratchWallN: [[0, 0], [0, -1]],
      scratchWallS: [[-7, -1], [-6, -2]],
      scratchWallE: [[-2, -2], [-2, -3]],
      scratchWallW: [[-4, 0], [-4, -1]],
      tired: [[-3, -2]],
      sleeping: [[-2, 0], [-2, -1]],
      N: [[-1, -2], [-1, -3]],
      NE: [[0, -2], [0, -3]],
      E: [[-3, 0], [-3, -1]],
      SE: [[-5, -1], [-5, -2]],
      S: [[-6, -3], [-7, -2]],
      SW: [[-5, -3], [-6, -1]],
      W: [[-4, -2], [-4, -3]],
      NW: [[-1, 0], [-1, -1]],
    },

    start() {
      if (this.el) return;
      const self = this;
      const spawn = function () { self.spawn(); };
      if (document.body) spawn();
      else {
        const wait = function () { if (document.body) spawn(); else setTimeout(wait, 100); };
        wait();
      }
    },

    spawn() {
      if (this.el) return;
      const self = this;

      const el = document.createElement('div');
      el.id = 'oneko';
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText =
        'width:32px;height:32px;position:fixed;' +
        'left:' + (self.nekoPosX - 16) + 'px;top:' + (self.nekoPosY - 16) + 'px;' +
        'pointer-events:none;image-rendering:pixelated;z-index:2147483647;' +
        'background-image:url("' + self.SPRITE + '");';
      document.body.appendChild(el);
      self.el = el;

      self._onMouseMove = function (e) {
        self.mousePosX = e.clientX;
        self.mousePosY = e.clientY;
      };
      document.addEventListener('mousemove', self._onMouseMove);

      const loop = function (ts) {
        if (!self.el || !self.el.isConnected) { self._rafId = null; return; }
        if (!self._lastTs) self._lastTs = ts;
        if (ts - self._lastTs > 100) {
          self._lastTs = ts;
          self.frame();
        }
        self._rafId = requestAnimationFrame(loop);
      };
      self._rafId = requestAnimationFrame(loop);
      console.log('a pussy appeared');
    },

    stop() {
      if (this.el) { this.el.remove(); this.el = null; }
      if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
      if (this._onMouseMove) { document.removeEventListener('mousemove', this._onMouseMove); this._onMouseMove = null; }
      this._lastTs = null;
      console.log('pussy (the cat i swear) ran away');
    },

    setSprite(name, frame) {
      const s = this.SPRITES[name];
      const sp = s[frame % s.length];
      this.el.style.backgroundPosition = (sp[0] * 32) + 'px ' + (sp[1] * 32) + 'px';
    },

    resetIdleAnimation() {
      this.idleAnimation = null;
      this.idleAnimationFrame = 0;
    },

    idle() {
      this.idleTime += 1;

      if (this.idleTime > 10 && Math.floor(Math.random() * 200) === 0 && this.idleAnimation == null) {
        const avail = ['sleeping', 'scratchSelf'];
        if (this.nekoPosX < 32) avail.push('scratchWallW');
        if (this.nekoPosY < 32) avail.push('scratchWallN');
        if (this.nekoPosX > window.innerWidth - 32) avail.push('scratchWallE');
        if (this.nekoPosY > window.innerHeight - 32) avail.push('scratchWallS');
        this.idleAnimation = avail[Math.floor(Math.random() * avail.length)];
      }

      switch (this.idleAnimation) {
        case 'sleeping':
          if (this.idleAnimationFrame < 8) { this.setSprite('tired', 0); break; }
          this.setSprite('sleeping', Math.floor(this.idleAnimationFrame / 4));
          if (this.idleAnimationFrame > 192) this.resetIdleAnimation();
          break;
        case 'scratchWallN':
        case 'scratchWallS':
        case 'scratchWallE':
        case 'scratchWallW':
        case 'scratchSelf':
          this.setSprite(this.idleAnimation, this.idleAnimationFrame);
          if (this.idleAnimationFrame > 9) this.resetIdleAnimation();
          break;
        default:
          this.setSprite('idle', 0);
          return;
      }
      this.idleAnimationFrame += 1;
    },

    frame() {
      this.frameCount += 1;
      const diffX = this.nekoPosX - this.mousePosX;
      const diffY = this.nekoPosY - this.mousePosY;
      const distance = Math.sqrt(diffX * diffX + diffY * diffY);

      if (distance < this.SPEED || distance < 48) { this.idle(); return; }

      this.idleAnimation = null;
      this.idleAnimationFrame = 0;

      if (this.idleTime > 1) {
        this.setSprite('alert', 0);
        this.idleTime = Math.min(this.idleTime, 7);
        this.idleTime -= 1;
        return;
      }

      let direction = '';
      direction += diffY / distance > 0.5 ? 'N' : '';
      direction += diffY / distance < -0.5 ? 'S' : '';
      direction += diffX / distance > 0.5 ? 'W' : '';
      direction += diffX / distance < -0.5 ? 'E' : '';
      this.setSprite(direction, this.frameCount);

      this.nekoPosX -= (diffX / distance) * this.SPEED;
      this.nekoPosY -= (diffY / distance) * this.SPEED;

      this.nekoPosX = Math.min(Math.max(16, this.nekoPosX), window.innerWidth - 16);
      this.nekoPosY = Math.min(Math.max(16, this.nekoPosY), window.innerHeight - 16);

      this.el.style.left = (this.nekoPosX - 16) + 'px';
      this.el.style.top = (this.nekoPosY - 16) + 'px';
    },
};

PluginHost.register(oneko);