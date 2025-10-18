// Asegura que el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('list');
  const btnAddStopwatch = document.getElementById('addStopwatch');
  const btnAddCountdown = document.getElementById('addCountdown');
  const btnRequestNotif = document.getElementById('requestNotif');

  /* ---------- Notificaciones y patrón de 3 beeps ---------- */
  const notify = async (title, body) => {
    try { if (Notification?.permission === 'granted') new Notification(title, { body }); } catch (_) {}
  };

  const beep3 = (() => {
    let ctx;
    return () => {
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        const burst = (t) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = 880;
          o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
          o.start(t); o.stop(t + 0.27);
        };
        burst(now); burst(now + 0.35); burst(now + 0.70);
      } catch (_) {}
    };
  })();

  btnRequestNotif?.addEventListener('click', async () => {
    if (!('Notification' in window)) return alert('Tu navegador no soporta notificaciones.');
    if (Notification.permission === 'granted') return alert('Notificaciones ya activadas.');
    try { await Notification.requestPermission(); } catch (_) {}
  });

  /* ---------------- Utilidades tiempo ---------------- */
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  function normalizeHMS(h, m, s) {
    h = Number(h)||0; m = Number(m)||0; s = Number(s)||0;
    if (s >= 60) { m += Math.floor(s/60); s = s % 60; }
    if (m >= 60) { h += Math.floor(m/60); m = m % 60; }
    h = Math.min(Math.max(h, 0), 99);
    return { h, m, s };
  }
  function parseFixedHMS(str) {
    const [H='0', M='0', S='0'] = String(str).split(':');
    const { h, m, s } = normalizeHMS(H, M, S);
    return ((h*60 + m)*60 + s) * 1000;
  }
  function msToParts(ms) {
    ms = Math.max(0, Math.floor(ms));
    const h = Math.floor(ms/3600000);
    const m = Math.floor((ms%3600000)/60000);
    const s = Math.floor((ms%60000)/1000);
    const ms3 = Math.floor(ms%1000);
    return {h,m,s,ms3};
  }

  /* --------- Ajuste para encajar dígitos en el display --------- */
  function fitDigits(container, content) {
    const ro = new ResizeObserver(() => {
      content.style.transform = 'scale(1)';
      const availW = container.clientWidth - 34; // margen ms
      const availH = container.clientHeight - 16;
      const neededW = content.scrollWidth;
      const neededH = content.scrollHeight;
      const scale = Math.min(availW/neededW, availH/neededH, 1);
      content.style.transform = `scale(${scale})`;
    });
    ro.observe(container);
    return ro;
  }

  /* --------- Utilidades para input HH:MM:SS "overwrite" --------- */
  const DIG_POS = [0,1,3,4,6,7]; // posiciones de dígitos en "HH:MM:SS"
  const nextPos = (i) => DIG_POS[DIG_POS.indexOf(i)+1] ?? 7;
  const prevPos = (i) => DIG_POS[DIG_POS.indexOf(i)-1] ?? 0;
  function clampCaret(i){ return DIG_POS.includes(i) ? i : (i<1?0:(i<3?1:(i<4?3:(i<6?4:6)))); }

  function installTimeMask(input) {
    // Valor inicial seguro
    if (!/^\d{2}:\d{2}:\d{2}$/.test(input.value)) input.value = '00:01:00';

    input.addEventListener('keydown', (e) => {
      const key = e.key;
      let i = input.selectionStart ?? 0;
      let j = input.selectionEnd ?? i;

      // Si hay selección y escribimos, sustituimos con 0s (y caret al inicio del rango)
      if (j - i > 0 && key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Tab') {
        let v = input.value.split('');
        for (let k=i; k<j; k++){
          if (DIG_POS.includes(k)) v[k] = '0';
        }
        input.value = v.join('');
        input.setSelectionRange(clampCaret(i), clampCaret(i));
      }
      i = input.selectionStart ?? 0;

      if (key === 'ArrowLeft') {
        e.preventDefault();
        const p = prevPos(clampCaret(i));
        input.setSelectionRange(p, p);
        return;
      }
      if (key === 'ArrowRight') {
        e.preventDefault();
        const p = nextPos(clampCaret(i));
        input.setSelectionRange(p, p);
        return;
      }

      if (key === 'Backspace') {
        e.preventDefault();
        const p = prevPos(clampCaret(i));
        const v = input.value.split('');
        v[p] = '0';
        input.value = v.join('');
        input.setSelectionRange(p, p);
        return;
      }

      if (key === 'Delete') {
        e.preventDefault();
        const p = clampCaret(i);
        const v = input.value.split('');
        v[p] = '0';
        input.value = v.join('');
        input.setSelectionRange(p, p);
        return;
      }

      if (/^\d$/.test(key)) {
        e.preventDefault();
        const p = clampCaret(i);
        const v = input.value.split('');
        v[p] = key;
        input.value = v.join('');
        const np = nextPos(p);
        input.setSelectionRange(np, np);
        return;
      }

      // Bloquea otras teclas que modifiquen el valor (excepto Tab/Home/End)
      if (key.length === 1) e.preventDefault();
    });

    input.addEventListener('blur', () => {
      const ms = parseFixedHMS(input.value);
      const {h,m,s} = msToParts(ms);
      input.value = `${pad(h)}:${pad(m)}:${pad(s)}`;
    });

    input.addEventListener('focus', () => {
      const start = DIG_POS[0];
      input.setSelectionRange(start, start);
    });
  }

  /* ---------------- Clase TimerItem ---------------- */
  class TimerItem {
    constructor({ type = 'stopwatch', initialMs = 0 } = {}) {
      this.type = type;
      this.initialMs = type === 'countdown' ? Math.max(0, initialMs) : 0;
      this.elapsed = 0;
      this.remaining = type === 'countdown' ? this.initialMs : 0;
      this.running = false;
      this.wasStarted = false;
      this.lastTick = 0;

      // token de sesión para invalidar bucles antiguos (fix Pause/Resume)
      this._loopToken = 0;
      this._raf = null;

      this._build();
      this._render();
    }

    _build() {
      this.el = document.createElement('div');
      this.el.className = 'timer-card';

      const header = document.createElement('div');
      header.className = 'timer-header';
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = this.type === 'countdown' ? 'Cuenta atrás' : 'Cronómetro';
      const del = document.createElement('button');
      del.className = 'delete'; del.title = 'Eliminar'; del.textContent = '✖️';
      del.addEventListener('click', () => this.remove());
      header.append(badge, del);

      // Display
      this.display = document.createElement('div');
      this.display.className = 'display';

      this.fitbox = document.createElement('div');
      this.fitbox.className = 'fitbox';
      this.digits = document.createElement('div');
      this.digits.className = 'digits';
      this.fitbox.appendChild(this.digits);

      this.millis = document.createElement('div');
      this.millis.className = 'millis';

      this.display.append(this.fitbox, this.millis);

      // Controles
      const controls = document.createElement('div');
      controls.className = 'controls';
      this.btnStart = document.createElement('button');
      this.btnStart.className = 'btn-big btn-start';
      this.btnStart.textContent = 'Start';
      this.btnStart.addEventListener('click', () => this.toggle());

      this.btnClear = document.createElement('button');
      this.btnClear.className = 'btn-big btn-clear';
      this.btnClear.textContent = 'Clear';
      this.btnClear.addEventListener('click', () => this.clear());

      controls.append(this.btnStart, this.btnClear);

      this.el.append(header, this.display, controls);

      // Sub-bar para cuenta atrás (input overwrite HH:MM:SS)
      if (this.type === 'countdown') {
        const sub = document.createElement('div');
        sub.className = 'subbar';
        const input = document.createElement('input');
        input.className = 'time-input';
        input.placeholder = 'HH:MM:SS';
        input.value = this._fmtText(this.initialMs || 60_000);
        installTimeMask(input);

        const apply = document.createElement('button');
        apply.className = 'btn';
        apply.textContent = 'Aplicar';
        apply.addEventListener('click', () => {
          const ms = parseFixedHMS(input.value || '00:00:00');
          this.setCountdown(ms);
          input.value = this._fmtText(ms);
        });
        sub.append(input, apply);
        this.el.append(sub);
      }

      list.prepend(this.el);

      // Ajuste para encajar texto
      this._resObs = fitDigits(this.display, this.fitbox);
    }

    _fmtText(ms) { const {h,m,s} = msToParts(ms); return `${pad(h)}:${pad(m)}:${pad(s)}`; }

    _render() {
      const ms = this.type === 'countdown' ? this.remaining : this.elapsed;
      const {h,m,s,ms3} = msToParts(ms);
      this.digits.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
      this.millis.textContent = String(ms3).padStart(3,'0');

      // Start / Pause / Resume
      if (this.running) this.btnStart.textContent = 'Pause';
      else if (this.wasStarted && (ms > 0 || this.type === 'stopwatch')) this.btnStart.textContent = 'Resume';
      else this.btnStart.textContent = 'Start';
    }

    // Bucle con token anticarrera
    _loop = (t, token) => {
      if (token !== this._loopToken) return; // bucle antiguo, aborta
      if (!this.running) return;

      if (!this.lastTick) this.lastTick = t;
      const dt = t - this.lastTick;
      this.lastTick = t;

      if (this.type === 'stopwatch') {
        this.elapsed += dt;
      } else {
        this.remaining = Math.max(0, this.remaining - dt);
        if (this.remaining === 0) {
          this.pause();
          beep3();
          notify('Cuenta atrás finalizada', '¡Tiempo agotado!');
        }
      }

      this._render();

      if (this.running && token === this._loopToken) {
        this._raf = requestAnimationFrame((tt) => this._loop(tt, token));
      }
    };

    toggle() { this.running ? this.pause() : this.start(); }

    start() {
      if (this.running) return;
      if (this.type === 'countdown' && this.remaining <= 0) {
        this.remaining = this.initialMs || 60_000;
      }
      this.running = true;
      this.wasStarted = true;
      this.lastTick = 0;

      // invalida bucles antiguos y arranca uno nuevo
      this._loopToken++;
      const token = this._loopToken;

      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }

      this._raf = requestAnimationFrame((t) => this._loop(t, token));
      this._render();
    }

    pause() {
      if (!this.running) return;
      this.running = false;

      // invalida cualquier callback en vuelo
      this._loopToken++;

      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
      this.lastTick = 0; // evita saltos al reanudar
      this._render();
    }

    clear() {
      if (this.type === 'stopwatch') this.elapsed = 0;
      else this.remaining = this.initialMs;
      this.pause();
      this._render();
    }

    setCountdown(ms) {
      this.initialMs = Math.max(0, ms);
      this.remaining = this.initialMs;
      this.pause();
      this.wasStarted = false;
      this._render();
    }

    remove() {
      this.pause();
      this._resObs?.disconnect?.();
      this.el.remove();
    }
  }

  /* --------- Factories y eventos --------- */
  const createStopwatch = () => new TimerItem({ type: 'stopwatch' });
  const createCountdown  = (ms = 60_000) => new TimerItem({ type: 'countdown', initialMs: ms });

  btnAddStopwatch?.addEventListener('click', () => createStopwatch());
  btnAddCountdown?.addEventListener('click', () => createCountdown());

  // Demo inicial: 1 cuenta atrás 00:01:00 + 1 cronómetro
  createCountdown(60_000);
  createStopwatch();

  // Pedir permiso de notificaciones tras primer gesto
  let asked = false;
  const askOnce = async () => {
    if (asked) return; asked = true;
    try { if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); } catch (_) {}
    window.removeEventListener('pointerdown', askOnce, true);
  };
  window.addEventListener('pointerdown', askOnce, true);
});
