// 08 · Hospedagem e manutenção: a janela (site + código + terminal) entra como as outras,
// isola-se no centro, tudo fica preto, e a câmara recua até ao portátil das mesmas pessoas da intro (parallax).
import { $, clamp, lerp, seg, ease, smooth, reduce, rectToQuad } from './util.js';

const IMG = { w: 1732, h: 908, quad: [[612, 542], [996, 538], [1039, 773], [646, 786]] };
const MW = 1280, MH = 800;
const CODE = [
  '<span class="t-com">// deploy.config.js · servidor OS</span>',
  '<span class="t-sel">export default</span> {',
  '  site: <span class="t-str">"castrosconsultoria.co.mz"</span>,',
  '  build: <span class="t-str">"npm run build"</span>,',
  '  ssl: <span class="t-prop">true</span>,',
  '  backups: <span class="t-str">"diários · 03:00"</span>,',
  '  monitor: {',
  '    every: <span class="t-str">"1 min"</span>,',
  '    alert: <span class="t-str">"whatsapp"</span>,',
  '  },',
  '  cache: { images: <span class="t-str">"webp"</span>, ttl: <span class="t-str">"30d"</span> },',
  '  updates: <span class="t-str">"semanais"</span>,',
  '};',
];
const LOG = [
  ['cmd', 'git pull origin main'], ['', 'Already up to date.'], ['cmd', 'npm install'], ['bar', '[████████████████░░░░] 82% a instalar dependências'],
  ['bar', '[████████████████████] 100%'], ['ok', '✓ 214 pacotes instalados em 6,2 s'], ['cmd', 'npm run build'], ['', 'vite v5 · a otimizar 38 imagens → webp'],
  ['ok', '✓ build ok · 412 kB · 1,8 s'], ['cmd', 'os deploy --prod'], ['', '↑ a enviar para o servidor OS (Maputo)…'], ['ok', '✓ SSL válido até mar 2027'],
  ['ok', '✓ cópia de segurança 03:00 · 1,2 GB'], ['ok', '✓ uptime 99,9 % · resposta 180 ms'], ['', 'a vigiar… próxima verificação em 60 s'],
];

export function initMaintenance() {
  const sec = $('#manutencao'), stage = $('#mStage'), world = $('#mWorld'), img = $('#mScene'), mon = $('#monitor'), glow = $('#mGlow');
  const black = $('#mBlack'), copyA = $('#mCopyA'), copyB = $('#mCopyB'), chrome = $('.mon-chrome', mon);
  $('#monCode').innerHTML = CODE.map((l, i) => `<div data-n="${i + 1}">${l}</div>`).join('');
  const term = $('#monTerm');
  let li = 0, timer = 0;
  const push = () => { const [c, t] = LOG[li % LOG.length]; li++; const d = document.createElement('div'); if (c) d.className = c; d.textContent = t; term.append(d); while (term.children.length > 9) term.firstChild.remove(); };
  for (let i = 0; i < 7; i++) push();
  new IntersectionObserver(es => { clearInterval(timer); timer = 0; if (es[0].isIntersecting && !reduce) timer = setInterval(push, 520); }).observe(sec);

  let G = null;
  const corners = r => [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
  function layout() {
    const vw = stage.clientWidth, vh = stage.clientHeight, mobile = vw <= 860, portrait = vw < vh;
    const s = Math.max(vw / IMG.w, vh / IMG.h) * (portrait ? 1.25 : 1);
    const scx = (IMG.quad[0][0] + IMG.quad[2][0]) / 2, scy = (IMG.quad[0][1] + IMG.quad[2][1]) / 2;
    const w = IMG.w * s, h = IMG.h * s, left = vw / 2 - scx * s, top = portrait ? vh * .62 - scy * s : Math.min(0, Math.max(vh - h, vh * .5 - scy * s));
    Object.assign(img.style, { width: w + 'px', height: h + 'px', left: left + 'px', top: top + 'px' });
    const q = IMG.quad.map(([x, y]) => [left + x * s, top + y * s]);
    const cx = q.reduce((n, p) => n + p[0], 0) / 4, cy = q.reduce((n, p) => n + p[1], 0) / 4;
    const qw = (q[1][0] - q[0][0] + q[2][0] - q[3][0]) / 2;
    world.style.transformOrigin = `${cx}px ${cy}px`;
    Object.assign(glow.style, { width: qw * 2.4 + 'px', height: qw * 2.4 + 'px', left: cx - qw * 1.2 + 'px', top: cy - qw * 1.2 + 'px' });
    // A: ao lado do texto, como as outras janelas · C: isolada no centro
    let A, C;
    if (mobile) {
      const ww = vw - 32, hh = ww / 1.6;
      A = { x: 16, y: Math.max(vh * .52, vh - hh - 110), w: ww, h: hh };
      C = { x: 16, y: (vh - hh) / 2, w: ww, h: hh };
    } else {
      const gl = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gl')) || 24;
      const cont = Math.min(1280, vw - gl * 2), cl = (vw - cont) / 2, col = (cont - 48) * 5 / 12, ww = (cont - 48) * 7 / 12;
      A = { x: cl + col + 48, y: (vh - ww / 1.6) / 2, w: ww, h: ww / 1.6 };
      const cw = Math.min(vw * .72, 1180, (vh - 180) * 1.6);
      C = { x: (vw - cw) / 2, y: (vh - cw / 1.6) / 2, w: cw, h: cw / 1.6 };
    }
    G = { vw, vh, q, cx, cy, A, C, zStart: C.w / qw };
    render();
  }
  function render() {
    if (!G) return;
    const r = sec.getBoundingClientRect(); if (r.bottom < -50 || r.top > innerHeight + 50) return;
    const { q, cx, cy, A, C, zStart } = G;
    const p = reduce ? 1 : clamp(-r.top / (sec.offsetHeight - G.vh));
    // A → C: a janela sai do lado do texto e isola-se no centro; o fundo fica preto
    const b = ease(seg(p, .14, .32));
    const W = { x: lerp(A.x, C.x, b), y: lerp(A.y, C.y, b), w: lerp(A.w, C.w, b), h: lerp(A.h, C.h, b) };
    copyA.style.opacity = 1 - seg(p, .12, .24); copyA.style.visibility = p > .25 ? 'hidden' : 'visible';
    copyA.style.translate = `${-40 * seg(p, .12, .24)}px 0`;
    black.style.opacity = seg(p, .18, .34);
    // C → secretária: as pessoas aparecem à volta e a câmara recua até ao portátil
    const t = 1 - ease(seg(p, .38, .74));           // 1 = janela no centro, 0 = portátil na secretária
    const z = Math.pow(zStart, t), wcx = W.x + W.w / 2, wcy = W.y + W.h / 2, dx = (wcx - cx) * t, dy = (wcy - cy) * t;
    world.style.transform = `translate(${dx}px, ${dy}px) scale(${z})`;
    world.style.opacity = seg(p, .36, .52);
    const k = smooth(seg(t, .5, 1)), win = corners(W);
    const dst = q.map(([x, y], i) => [lerp(cx + (x - cx) * z + dx, win[i][0], k), lerp(cy + (y - cy) * z + dy, win[i][1], k)]);
    mon.style.transform = rectToQuad(0, 0, MW, MH, dst);
    mon.style.borderRadius = lerp(3, 14, k) + 'px';
    chrome.style.opacity = k; mon.style.boxShadow = k < .05 ? 'none' : '';
    glow.style.opacity = 1 - t;
    copyB.style.opacity = seg(p, .74, .8); copyB.style.translate = `0 ${14 * (1 - seg(p, .74, .8))}px`;
  }
  img.complete ? layout() : img.addEventListener('load', layout);
  addEventListener('resize', layout);
  return { render, layout };
}
