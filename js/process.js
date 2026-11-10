// 5.3 · Processo: a mesma página passa por conversa → mapa → wireframe → design → código → no ar.
// Duas janelas (antes e depois do editor) partilham o mesmo desenho; o elemento guia acompanha tudo.
import { $, $$, clamp, lerp, seg, smooth, reduce } from './util.js';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CODE = [
  [['t-tag', '<section'], ['t-at', ' class'], ['', '='], ['t-str', '"hero"'], ['t-tag', '>']],
  [['', '  '], ['t-tag', '<h1>'], ['', 'Consultoria para empreendedores']],
  [['', '      e empresas em Maputo.'], ['t-tag', '</h1>']],
  [['', '  '], ['t-tag', '<p'], ['t-at', ' class'], ['', '='], ['t-str', '"lead"'], ['t-tag', '>'], ['', 'Gestão, estratégia e formações']],
  [['', '     práticas para quem quer crescer.'], ['t-tag', '</p>']],
  [['', '  '], ['t-tag', '<a'], ['t-at', ' class'], ['', '='], ['t-str', '"btn"'], ['t-at', ' href'], ['', '='], ['t-str', '"/contacto"'], ['t-tag', '>']],
  [['', '    Marcar conversa']], [['', '  '], ['t-tag', '</a>']], [['t-tag', '</section>']], [],
  [['t-tag', '<style>']], [['', '  '], ['t-sel', '.hero h1'], ['', ' {']],
  [['', '    '], ['t-prop', 'font'], ['', ': 800 36px/40px '], ['t-str', '"Syne"'], ['', ', sans-serif;']],
  [['', '    '], ['t-prop', 'color'], ['', ': var(--navy);']], [['', '  }']],
  [['', '  '], ['t-sel', '.btn'], ['', ' { '], ['t-prop', 'background'], ['', ': var(--gold); }']], [['t-tag', '</style>']],
];
function typer(box, lines, pos) {
  const els = lines.map((toks, i) => {
    const el = document.createElement('div'); el.className = 'ln'; el.dataset.n = i + 1;
    const inner = document.createElement('span');
    inner.innerHTML = toks.map(([c, s]) => c ? `<span class="${c}">${esc(s)}</span>` : esc(s)).join('');
    el.append(inner); box.append(el);
    return { el, inner, n: toks.reduce((a, [, s]) => a + s.length, 0) };
  });
  const total = els.reduce((a, l) => a + l.n, 0), caret = document.createElement('i'); caret.className = 'caret';
  let cur = null;
  return frac => {
    let left = Math.round(frac * total), at = null, col = 0;
    els.forEach(l => { const show = Math.min(l.n, left); left -= show; l.inner.style.width = show + 'ch'; if (show < l.n && at === null) { at = l; col = show; } });
    const line = at || els[els.length - 1]; line.el.append(caret);
    if (cur !== line) { cur?.el.classList.remove('cur'); line.el.classList.add('cur'); cur = line; }
    if (pos) pos.textContent = `Ln ${line.el.dataset.n}, Col ${(at ? col : line.n) + 1}`;
  };
}
// escreve o código sozinho (por tempo) enquanto a janela de código está à vista
function autoType(type, dur = 2800) {
  let active = false, t0 = 0, raf = 0;
  const step = ts => { if (!active) return; t0 ||= ts; const f = Math.min(1, (ts - t0) / dur); type(f); if (f < 1) raf = requestAnimationFrame(step); };
  type(0);
  return on => {
    if (on && !active) { active = true; t0 = 0; if (reduce) type(1); else raf = requestAnimationFrame(step); }
    else if (!on && active) { active = false; cancelAnimationFrame(raf); type(0); }
  };
}
const TERM = [['cmd', 'npm run dev'], ['', '  VITE v5.4  pronto em 312 ms'], ['url', '  ➜  Local:   http://localhost:5173/'], ['ok', '  ✓ hot reload · index.html'],
  ['ok', '  ✓ hot reload · styles.css'], ['', '  a otimizar imagens → webp (12)'], ['ok', '  ✓ Lighthouse móvel · rápido'], ['ok', '  ✓ hot reload · form.js']];
function terminal(box) {
  let i = 0, timer = 0;
  const push = () => { const [c, t] = TERM[i % TERM.length]; i++; const d = document.createElement('div'); if (c) d.className = c; d.textContent = t; box.append(d); while (box.children.length > 5) box.firstChild.remove(); };
  for (let k = 0; k < 3; k++) push();
  return on => { if (on && !timer && !reduce) timer = setInterval(push, 950); else if (!on && timer) { clearInterval(timer); timer = 0; } };
}

function keyRect(K, S) {
  if (S <= K[0][0]) return K[0].slice(1);
  for (let i = 1; i < K.length; i++) if (S <= K[i][0]) { const t = (S - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return [1, 2, 3].map(j => lerp(K[i - 1][j], K[i][j], t)); }
  return K[K.length - 1].slice(1);
}
const fade = (el, o, tf = '') => { el.style.opacity = o; el.style.visibility = o < .01 ? 'hidden' : 'visible'; el.style.transform = tf; };

function makeDevices(root) {
  const k = n => root.querySelector(`[data-k="${n}"]`), P = n => root.querySelector(`[data-p="${n}"]`);
  const desk = {
    wrap: k('winWrap'), box: k('win'), w: 1000, h: 640,
    L: { brief: k('lBrief'), map: k('lMap'), page: k('lPage'), design: k('pDesign'), select: k('pSelect'), left: k('lLeft'), right: k('lRight'), code: k('lCode'), cursor: k('lCursor'), btn: k('pBtn'), live: k('liveTag'), toast: k('lToast') },
    labs: [...root.querySelectorAll('[data-lab]')], type: autoType(typer(k('codeLines'), CODE, k('vsPos'))), term: terminal(k('vsTerm')),
    K: [[1.3, 430, 145, 140], [2, 120, 72, 760], [3, 225, 138, 540], [4, 505, 156, 480], [5, 0, 0, 1000]],
    draw(S) { const { L } = this;
      fade(L.brief, 1 - seg(S, .15, .6), `translateY(${-24 * seg(S, .15, .6)}px)`);
      fade(L.map, seg(S, .4, .85) * (1 - seg(S, 1.35, 1.8)), `scale(${lerp(.96, 1, seg(S, .4, .85))})`);
      const [px, py, pw] = keyRect(this.K, S); fade(L.page, seg(S, 1.2, 1.5), `translate(${px}px, ${py}px) scale(${pw / 1000})`);
      L.design.style.opacity = seg(S, 2.35, 2.85); L.select.style.opacity = seg(S, 2.7, 3) * (1 - seg(S, 3.3, 3.6));
      const kk = seg(S, 2.3, 2.95) * (1 - seg(S, 3.3, 3.8)); fade(L.left, kk, `translateX(${-210 * (1 - kk)}px)`); fade(L.right, kk, `translateX(${220 * (1 - kk)}px)`);
      const c = seg(S, 3.35, 3.7) * (1 - seg(S, 4.3, 4.7)); fade(L.code, c, `translateY(${28 * (1 - c)}px) scale(${.97 + .03 * c})`); this.type(c > .6); this.term(c > .6);
      fade(L.toast, seg(S, 4.78, 5), `translateY(${16 * (1 - seg(S, 4.78, 5))}px)`);
      this.labs.forEach(el => { el.style.opacity = clamp(1 - Math.abs(S - +el.dataset.lab) * 2.2); });
      L.live.style.opacity = seg(S, 4.6, 5);
      const m = seg(S, 4.55, 5); fade(L.cursor, seg(S, 4.5, 4.75), `translate(${lerp(760, 150, m)}px, ${lerp(560, 368, m)}px)`);
      L.btn.style.background = m > .97 ? '#9c7a26' : ''; }
  };
  const phone = {
    wrap: k('phoneWrap'), box: k('phone'), w: 380, h: 780,
    L: { brief: P('brief'), map: P('map'), page: P('page'), design: P('design'), select: P('select'), sheet: P('sheet'), code: P('code'), url: P('url'), tap: P('tap'), btn: P('btn') },
    labs: [...root.querySelectorAll('[data-plab]')], type: autoType(typer(root.querySelector('.code-lines'), CODE.map(l => l.map(([c, s]) => [c, s.replace('36px/40px', '26px/30px')])))),
    K: [[1.3, 130, 70, 100], [2, 30, 14, 300], [3, 40, 10, 280], [4, 100, 14, 160], [5, 0, 0, 360]],
    draw(S) { const { L } = this;
      fade(L.brief, 1 - seg(S, .15, .6), `translateY(${-24 * seg(S, .15, .6)}px)`);
      fade(L.map, seg(S, .4, .85) * (1 - seg(S, 1.35, 1.8)), `scale(${lerp(.96, 1, seg(S, .4, .85))})`);
      const [px, py, pw] = keyRect(this.K, S); fade(L.page, seg(S, 1.2, 1.5), `translate(${px}px, ${py}px) scale(${pw / 360})`);
      L.design.style.opacity = seg(S, 2.35, 2.85); L.select.style.opacity = seg(S, 2.7, 3) * (1 - seg(S, 3.3, 3.6));
      const kk = seg(S, 2.4, 2.95) * (1 - seg(S, 3.3, 3.7)); fade(L.sheet, kk, `translateY(${240 * (1 - kk)}px)`);
      const c = seg(S, 3.35, 3.7) * (1 - seg(S, 4.3, 4.7)); fade(L.code, c, `translateY(${380 * (1 - c)}px)`); this.type(c > .6);
      this.labs.forEach(el => { el.style.opacity = clamp(1 - Math.abs(S - +el.dataset.plab) * 2.2); });
      const u = seg(S, 4.5, 4.9); fade(L.url, u, `translateY(${30 * (1 - u)}px)`);
      const tp = seg(S, 4.8, 5); fade(L.tap, tp > 0 ? 1 - Math.max(0, tp - .6) * 1.5 : 0, `translate(78px, 312px) scale(${lerp(.4, 1.3, tp)})`);
      L.btn.style.background = tp > .5 ? '#9c7a26' : ''; }
  };
  return { desk, phone };
}

// mapeia o scroll de uma grelha de passos para o "estado" S da janela
function makeProc(root, map) {
  const steps = $$('.step', root), viz = $('.viz', root), { desk, phone } = makeDevices(root);
  let dev = desk, mobile = false, lastS = -1;
  function fit() {
    mobile = innerWidth <= 860; dev = mobile ? phone : desk;
    const vh = viz.clientHeight, pad = parseFloat(getComputedStyle(viz).paddingTop) || 0;
    const room = (vh - pad) * (mobile ? .94 : .8), sc = Math.min(dev.wrap.clientWidth / dev.w, room / dev.h);
    dev.box.style.transform = `scale(${sc})`; dev.box.style.left = (dev.wrap.clientWidth - dev.w * sc) / 2 + 'px'; dev.wrap.style.height = dev.h * sc + 'px';
    lastS = -1;
  }
  function render() {
    const vh = innerHeight, first = steps[0].getBoundingClientRect(), H = first.height || 1;
    const target = mobile ? vh * .72 : vh * .5, anchor = mobile ? .15 : .5;
    const s = clamp((target - (first.top + H * anchor)) / H, 0, steps.length - 1);
    const i = Math.floor(s), f = s - i, held = Math.min(steps.length - 1, i + smooth(clamp((f - .3) / .4)));
    const on = Math.round(s); steps.forEach((el, n) => el.classList.toggle('on', n === on));
    const S = map(held, steps.length - 1); if (Math.abs(S - lastS) > .0005) { dev.draw(S); lastS = S; }
    return on;
  }
  return { fit, render, root };
}

// elemento guia: muda de forma a cada fase
const PHASES = ['Conversa', 'Mapa do site', 'Wireframe', 'Design', 'Editor', 'Código', 'Lançamento', 'Manutenção'];
export function initProcess() {
  const A = makeProc($('#procA'), s => s);                          // 0 → 3
  const B = makeProc($('#procB'), (s, n) => 3.75 + (s / n) * 1.25); // código (VS Code) → no ar
  const guide = $('#guide'), icons = $$('.g-orb svg', guide), dots = $$('.g-dots i', guide);
  let phase = -1;
  function setPhase(n) {
    if (n === phase) return; phase = n;
    icons.forEach((s, i) => s.classList.toggle('on', i === n));
    dots.forEach((d, i) => { d.classList.toggle('on', i === n); d.classList.toggle('done', i < n); });
    $('#gNo').textContent = 'Fase ' + String(n + 1).padStart(2, '0'); $('#gName').textContent = PHASES[n];
  }
  setPhase(0);
  const inView = el => { const r = el.getBoundingClientRect(); return r.top < innerHeight * .5 && r.bottom > innerHeight * .5; };
  function render() {
    const a = A.render(), b = B.render();
    const procTop = $('#processo').getBoundingClientRect().top, mEnd = $('#manutencao').getBoundingClientRect().bottom;
    guide.classList.toggle('on', procTop < innerHeight * .6 && mEnd > innerHeight * .7);
    if (inView($('#manutencao'))) setPhase(7);
    else if (inView($('#processoB'))) setPhase(5 + b);
    else if (inView($('#editor'))) setPhase(4);
    else setPhase(a);
  }
  const fit = () => { A.fit(); B.fit(); render(); };
  addEventListener('resize', fit);
  fit();
  return { render, fit };
}
