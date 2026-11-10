// 5.2 · Hero burst: sete heros em ~1,3 s num <canvas>, micro-zoom 1,04 → 1 e flash branco entre cortes.
import { reduce } from './util.js';

export const HEROES = [
  'assets/heroes/01-house-of-flavors.webp', 'assets/heroes/02-kanimambo.webp', 'assets/heroes/03-selfxpress.webp',
  'assets/heroes/04-kapulana-co.webp', 'assets/heroes/05-mare.webp', 'assets/heroes/06-castros-consultoria.webp',
  'assets/heroes/07-lumen-curology-style.webp',
];
// o ritmo acelera a meio e abranda no fim, como um corte de montagem
const DUR = [190, 170, 155, 145, 140, 150, 190];

export function createBurst(canvas, { onDone } = {}) {
  const ctx = canvas.getContext('2d');
  const imgs = HEROES.map(src => { const i = new Image(); i.decoding = 'async'; i.src = src; return i; });
  const ready = Promise.all(imgs.map(i => i.decode().catch(() => null)));
  let raf = 0, state = 'idle', fadeAnim = null;

  function size() {
    const d = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * d)); canvas.height = Math.max(1, Math.round(canvas.clientHeight * d));
  }
  function cover(img, s) {
    const W = canvas.width, H = canvas.height, r = Math.max(W / img.naturalWidth, H / img.naturalHeight) * s;
    const w = img.naturalWidth * r, h = img.naturalHeight * r;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }
  function clear() { ctx.fillStyle = '#031130'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

  async function play() {
    if (state !== 'idle') return;
    state = 'playing';
    if (reduce) { finish(true); return; }
    await ready; if (state !== 'playing') return;
    size();
    const total = DUR.reduce((a, b) => a + b, 0), t0 = performance.now();
    const tick = now => {
      if (state !== 'playing') return;
      let t = now - t0;
      if (t >= total) { finish(); return; }
      let i = 0; while (t > DUR[i]) { t -= DUR[i]; i++; }
      const k = t / DUR[i], img = imgs[i];
      clear();
      if (img.naturalWidth) cover(img, 1.04 - .04 * (1 - Math.pow(1 - k, 3)));
      if (k < .28) { ctx.fillStyle = `rgba(243,247,254,${.42 * (1 - k / .28)})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function finish(instant) {
    state = 'done';
    if (instant) { canvas.style.opacity = 0; onDone?.(); return; }
    fadeAnim = canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' });
    onDone?.();
  }
  function reset() {
    cancelAnimationFrame(raf); fadeAnim?.cancel(); fadeAnim = null;
    state = 'idle'; canvas.style.opacity = 1; size(); clear();
  }
  addEventListener('resize', () => { if (state === 'idle') { size(); clear(); } });
  size(); clear();
  return { play, reset, get state() { return state; } };
}
