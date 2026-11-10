// Utilitários partilhados
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (p, a, b) => clamp((p - a) / (b - a));
export const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const smooth = t => t * t * (3 - 2 * t);
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';

// CSS matrix3d que leva o retângulo (x0,y0,w,h) ao quadrilátero p (TL, TR, BR, BL)
export function rectToQuad(x0, y0, W, H, p) {
  const [p0, p1, p2, p3] = p;
  const sx = p0[0] - p1[0] + p2[0] - p3[0], sy = p0[1] - p1[1] + p2[1] - p3[1];
  let a, b, c, d, e, f, g, h;
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) {
    a = p1[0] - p0[0]; b = p3[0] - p0[0]; c = p0[0]; d = p1[1] - p0[1]; e = p3[1] - p0[1]; f = p0[1]; g = 0; h = 0;
  } else {
    const dx1 = p1[0] - p2[0], dx2 = p3[0] - p2[0], dy1 = p1[1] - p2[1], dy2 = p3[1] - p2[1];
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den; h = (dx1 * sy - sx * dy1) / den;
    a = p1[0] - p0[0] + g * p1[0]; b = p3[0] - p0[0] + h * p3[0]; c = p0[0];
    d = p1[1] - p0[1] + g * p1[1]; e = p3[1] - p0[1] + h * p3[1]; f = p0[1];
  }
  const m00 = a / W, m01 = b / H, m02 = c - a * x0 / W - b * y0 / H;
  const m10 = d / W, m11 = e / H, m12 = f - d * x0 / W - e * y0 / H;
  const m20 = g / W, m21 = h / H, m22 = 1 - g * x0 / W - h * y0 / H;
  return `matrix3d(${m00},${m10},0,${m20},${m01},${m11},0,${m21},0,0,1,0,${m02},${m12},0,${m22})`;
}

// Parte o texto em palavras e letras (para o reveal por caractere), mantendo spans internos (.it, .k1…)
export function splitChars(el) {
  if (el.dataset.split) return [...el.querySelectorAll('.c')];
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          [...part].forEach(ch => { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; w.append(c); });
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('br')) walk(n);
    });
  };
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  walk(el);
  [...el.children].forEach(c => c.setAttribute('aria-hidden', 'true'));
  el.dataset.split = '1';
  return [...el.querySelectorAll('.c')];
}

// Faixa Capulana OS a ondular: o padrão segue uma onda em fatias verticais finas.
// fps > 0 → stop motion (DS: 12 fps, tremor entre imagens, sombra de papel); enter()/exit() varrem da esquerda para a direita.
export class CapWave {
  constructor(canvas, { img, fill = null, amp = 18, period = 1100, thick = 54, speed = 0.00012, animate = true, flip = false, fps = 0, hidden = false }) {
    Object.assign(this, { canvas, img, fill, amp, period, thick, speed, animate, flip, fps, t: 0, on: false, a: 0, b: hidden ? 0 : 1, mode: 'idle', frame: -1, ph: 0, jx: 0, jy: 0 });
    this.ctx = canvas.getContext('2d'); this.off = document.createElement('canvas'); this.octx = this.off.getContext('2d');
    this.resize = this.resize.bind(this); this.loop = this.loop.bind(this);
    addEventListener('resize', this.resize); this.resize();
    if (animate || fps) new IntersectionObserver(es => { const was = this.on; this.on = es[0].isIntersecting; if (this.on && !was) requestAnimationFrame(this.loop); }).observe(canvas);
  }
  enter() { if (this.mode === 'in' || (this.mode === 'idle' && this.b >= 1 && this.a <= 0)) return; if (this.mode === 'out' || this.a > 0) { this.a = 0; this.b = 0; } this.mode = 'in'; this.kick(); }
  exit() { if (this.mode === 'out' || (this.mode === 'idle' && this.b <= this.a)) return; this.mode = 'out'; this.kick(); }
  show(v) { this.mode = 'idle'; this.a = 0; this.b = v ? 1 : 0; this.draw(); }
  kick() { if (this.on && !this.running) requestAnimationFrame(this.loop); }
  resize() { const c = this.canvas, d = Math.min(devicePixelRatio || 1, 1.5); c.width = Math.max(1, Math.round(c.clientWidth * d)); c.height = Math.max(1, Math.round(c.clientHeight * d)); this.off.width = c.width; this.off.height = c.height; this.d = d; this.draw(); }
  loop(ts) {
    this.running = false; if (!this.on) return;
    if (this.fps) {
      const f = Math.floor(ts / (1000 / this.fps));
      if (f !== this.frame) {
        this.frame = f; this.ph += .32; this.jx = (Math.random() - .5) * 2.2; this.jy = (Math.random() - .5) * 2.6;
        if (this.mode === 'in') { this.b = Math.min(1, this.b + 1 / 11); if (this.b >= 1) this.mode = 'idle'; }
        else if (this.mode === 'out') { this.a = Math.min(this.b, this.a + 1 / 9); if (this.a >= this.b) { this.mode = 'idle'; this.a = 0; this.b = 0; } }
        this.draw();
      }
      if (this.b <= this.a && this.mode === 'idle') { this.draw(); return; }   // escondida: pára
    } else { this.t = ts; this.ph = this.t * this.speed * Math.PI * 2; this.draw(); }
    this.running = true; requestAnimationFrame(this.loop);
  }
  draw() {
    const { ctx, canvas: c, img, d } = this, W = c.width, H = c.height; if (!W) return;
    ctx.clearRect(0, 0, W, H);
    const A = this.amp * d, P = this.period * d, th = this.thick * d, ph = this.ph;
    const yAt = x => H * .5 + A * Math.sin((x / P) * Math.PI * 2 + ph);
    const x0 = Math.floor(this.a * W), x1 = Math.ceil(this.b * W); if (x1 <= x0) return;
    if (this.fill) {   // preenchimento abaixo (ou acima) da onda, na cor da secção seguinte
      ctx.beginPath(); ctx.moveTo(0, this.flip ? 0 : H);
      for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, yAt(x) + (this.flip ? -th / 2 : th / 2) - 1);
      ctx.lineTo(W, this.flip ? 0 : H); ctx.closePath(); ctx.fillStyle = this.fill; ctx.fill();
    }
    if (!img || !img.complete || !img.naturalWidth) return;
    const o = this.fps ? this.octx : ctx; if (this.fps) o.clearRect(0, 0, W, H);
    const iw = img.naturalWidth, ih = img.naturalHeight, sc = th / ih, step = Math.max(2, Math.round(2 * d));
    for (let x = x0 - (x0 % step); x < x1; x += step) {
      const sx = ((x / sc) % iw);
      o.drawImage(img, sx, 0, Math.min(step / sc, iw - sx), ih, x, yAt(x) - th / 2, step + .6, th);
    }
    if (this.fps) {   // sombra de papel + tremor entre imagens
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowOffsetY = 3 * d; ctx.shadowBlur = 6 * d;
      ctx.drawImage(this.off, this.jx * d, this.jy * d); ctx.restore();
    }
  }
}
