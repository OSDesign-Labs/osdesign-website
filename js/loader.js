// 5.1 · Loader: estúdio → o símbolo enche 0→100% no ecrã → logo + "online" → burst → mergulho no hero → o hero assenta numa moldura.
import { $, clamp, lerp, seg, ease, smooth, reduce, rectToQuad, splitChars } from './util.js';
import { createBurst } from './hero-burst.js';

const SCENES = {
  laptop: { el: 'scene', w: 1732, h: 908, quad: [[612, 542], [996, 538], [1039, 773], [646, 786]], round: 0.01 },   // medido ao píxel: ecrã (cinza 12) vs aro (0)
  phone: { el: 'scenePhone', w: 1734, h: 907, quad: [[740.8, 541.4], [879.9, 526.5], [931.7, 820.5], [790.6, 839.4]], round: 0.086, crop: 560 },   // ecrã medido (corpo recolhido 5 px, cantos 12 px)
};
// fases da intro (progresso 0–1 da secção fixa)
const T = { fill: [.03, .28], show: [.28, .31], zoom: [.36, .78], lock: [.8, .88], nav: [.8, .9] };

export function initLoader({ logoPath }) {
  const intro = $('#topo'), stage = $('#stage'), world = $('#world'), hero = $('#hero');
  const mark = $('#mark'), meta = $('#bootMeta'), hint = $('#hint'), hud = $('#hud'), frame = $('#frame'), root = document.documentElement;
  const title = $('#heroTitle'), chars = splitChars(title);
  let heroShown = false;
  const showTitle = (on) => {
    if (heroShown === on) return; heroShown = on;
    if (reduce || !window.gsap) { chars.forEach(c => c.style.transform = 'none'); return; }
    gsap.killTweensOf(chars);
    if (on) gsap.fromTo(chars, { yPercent: 110 }, { yPercent: 0, duration: .9, ease: 'expo.out', stagger: .02 });
    else gsap.set(chars, { yPercent: 110 });
  };
  if (!reduce && window.gsap) gsap.set(chars, { yPercent: 110 });
  const burst = createBurst($('#burst'), { onDone: () => showTitle(true) });

  // o símbolo: o anel fica, o S roda como uma moeda e assenta de frente aos 100%
  const globe = (() => {
    const N = 300, R = N / 2, RI = R * 0.855;
    const canvas = $('#globe'), ctx = canvas.getContext('2d');
    canvas.width = canvas.height = N;
    const tex = document.createElement('canvas'); tex.width = tex.height = N;
    const tctx = tex.getContext('2d'); tctx.scale(N / 512, N / 512); tctx.fill(new Path2D(logoPath), 'evenodd');
    const ink = tctx.getImageData(0, 0, N, N).data, inkAt = (x, y) => ink[((y | 0) * N + (x | 0)) * 4 + 3];
    const type = new Uint8Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = Math.hypot(x + .5 - R, y + .5 - R); type[y * N + x] = r > R ? 0 : r >= RI ? 1 : 2; }
    const img = ctx.createImageData(N, N), px = img.data; let last = '';
    return { draw(fill, theta) {
      const key = fill.toFixed(4) + '|' + theta.toFixed(4); if (key === last) return; last = key;
      const c = Math.cos(theta), ac = Math.abs(c), shade = .35 + .65 * ac, fy = N - fill * N;
      for (let y = 0, i = 0; y < N; y++) { const on = y >= fy ? 255 : 38;
        for (let x = 0; x < N; x++, i++) { const o = i * 4, k = type[i]; let a = 0;
          if (k === 1) a = inkAt(x, y);
          else if (k === 2 && ac > .02) { const xf = R + (x + .5 - R) / c; if (xf >= 0 && xf < N && Math.hypot(xf - R, y + .5 - R) < RI) a = inkAt(xf, y) * shade; }
          px[o] = px[o + 1] = px[o + 2] = on; px[o + 3] = a; } }
      ctx.putImageData(img, 0, 0);
    } };
  })();

  let IMG, QUAD, G = null;
  function layout() {
    const vw = stage.clientWidth, vh = stage.clientHeight, portrait = vw < vh * 1.1;
    const cfg = portrait ? SCENES.phone : SCENES.laptop; IMG = cfg; QUAD = cfg.quad;
    const scene = $('#' + cfg.el);
    for (const k in SCENES) $('#' + SCENES[k].el).hidden = SCENES[k] !== cfg;
    const s = portrait ? vw / cfg.crop : Math.max(vw / IMG.w, vh / IMG.h);
    const w = IMG.w * s, h = IMG.h * s, scx = (QUAD[0][0] + QUAD[2][0]) / 2;
    const left = portrait ? vw / 2 - scx * s : (vw - w) / 2, top = portrait ? vh - h : (vh - h) / 2;
    Object.assign(scene.style, { width: w + 'px', height: h + 'px', left: left + 'px', top: top + 'px' });
    scene.classList.toggle('fade-top', portrait);
    hint.style.bottom = portrait ? (h + 28) + 'px' : '';
    const q = QUAD.map(([x, y]) => [left + x * s, top + y * s]);
    const cx = q.reduce((n, p) => n + p[0], 0) / 4, cy = q.reduce((n, p) => n + p[1], 0) / 4;
    const qw = Math.min(q[1][0] - q[0][0], q[2][0] - q[3][0]), qh = Math.min(q[3][1] - q[0][1], q[2][1] - q[1][1]);
    world.style.transformOrigin = `${cx}px ${cy}px`;
    G = { vw, vh, q, cx, cy, qw, qh, zEnd: Math.max(vw / qw, vh / qh) * 1.2, fm: parseFloat(getComputedStyle(root).getPropertyValue('--fmax')) || 18 };
    render();
  }
  const progress = () => reduce ? 1 : clamp(-intro.getBoundingClientRect().top / (intro.offsetHeight - stage.clientHeight));

  function render() {
    if (!G) return {};
    const { vw, vh, q, cx, cy, qw, qh, zEnd } = G, p = progress();
    const fill = seg(p, ...T.fill), show = seg(p, ...T.show), t = ease(seg(p, ...T.zoom));
    // câmara: entra no ecrã e traz o ecrã ao centro
    const z = Math.pow(zEnd, t), dx = (vw / 2 - cx) * t, dy = (vh / 2 - cy) * t;
    world.style.transform = `translate(${dx}px, ${dy}px) scale(${z})`;
    world.style.filter = t > .6 ? `blur(${Math.min(8, (t - .6) * 10)}px)` : 'none';
    const k = smooth(seg(t, .45, 1)), vp = [[0, 0], [vw, 0], [vw, vh], [0, vh]];
    const dst = q.map(([x, y], i) => [lerp(cx + (x - cx) * z + dx, vp[i][0], k), lerp(cy + (y - cy) * z + dy, vp[i][1], k)]);
    const qa = qw / qh; let sw = vw, sh = vw / qa; if (sh > vh) { sh = vh; sw = vh * qa; }
    sw = lerp(sw, vw, k); sh = lerp(sh, vh, k);
    const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
    // moldura: o hero assenta num cartão com margem clara (e volta a encher o ecrã quando sais)
    const lock = ease(seg(p, ...T.lock)), introEnd = intro.offsetTop + intro.offsetHeight - vh;
    const leave = clamp((scrollY - introEnd) / (vh * .3)), fm = G.fm;
    const fr = fm * lock * (1 - leave), rad = (vw <= 640 ? 20 : 28) * lock * (1 - leave);
    root.style.setProperty('--fr', fr.toFixed(2) + 'px');
    hero.style.transform = rectToQuad(sx, sy, sw, sh, dst);
    hero.style.clipPath = `inset(${sy + fr}px ${sx + fr}px round ${Math.max((1 - k) * sw * IMG.round, rad)}px)`;
    hero.style.opacity = show;
    hero.style.pointerEvents = t > .98 ? 'auto' : 'none';
    frame.style.opacity = lock; world.style.opacity = 1 - lock;

    // o símbolo arranca no ecrã; aos 100% vira logo + online; desaparece quando o burst começa
    const bootSize = qh * .42, land = 1 - Math.pow(1 - fill, 3);
    globe.draw(fill, (1 - land) * Math.PI * 6);
    const fadeOut = 1 - seg(p, T.show[0] - .005, T.show[1]);
    mark.style.width = mark.style.height = bootSize + 'px';
    mark.style.transform = `translate(${cx - bootSize / 2}px, ${cy - bootSize / 2 - qh * .1}px)`;
    mark.style.opacity = fadeOut;
    const pct = Math.round(fill * 100);
    meta.classList.toggle('online', pct >= 100);
    meta.querySelector('.pct').textContent = String(pct).padStart(3, '0') + '%';
    meta.style.fontSize = Math.max(9, qh * .06) + 'px';
    meta.style.left = cx + 'px'; meta.style.top = (cy + bootSize / 2 - qh * .08) + 'px';
    meta.style.opacity = fadeOut;

    // burst: dispara quando fica online; volta ao início se a pessoa sobe
    if (pct >= 100 && p >= T.show[0]) burst.play();
    if (p < T.fill[1] - .06 && burst.state !== 'idle') { burst.reset(); showTitle(false); }

    hint.style.opacity = 1 - seg(p, 0, .06);
    hud.style.opacity = 1 - seg(p, .32, .45);
    const pastIntro = intro.getBoundingClientRect().bottom < vh * .5;
    return { p, lock, leave, navOn: Math.max(seg(p, ...T.nav), +pastIntro), heroMode: lock > .5 && leave < .6, heroReady: heroShown && lock > .98 && leave < .04 };
  }

  if (reduce) { intro.style.height = '100vh'; burst.play(); }
  ['#scene', '#scenePhone'].forEach(s => { const i = $(s); if (!i.complete) i.addEventListener('load', layout); });
  addEventListener('resize', layout);
  layout();
  return { render, layout };
}
