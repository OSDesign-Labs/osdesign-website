// Trabalho: o scroll vertical passa a deslizar os projetos para a direita, como um carrossel com snap.
// Cada hero vive numa caixa arredondada (como o hero da awake), com o fundo de topografia por fora. No telemóvel: desliza com o dedo.
import { $, $$, clamp, lerp, reduce } from './util.js';

const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const PAD = .3;   // pausa no primeiro e no último projeto (em projetos)

export function initWork() {
  const sec = $('#trabalho'), topo = $('#trabalho .topo'), track = $('#workTrack'), cards = $$('.case', track), cap = $('#wcap');
  const nos = $$('.wno', sec), bars = $$('.work-bar i', sec), n = cards.length;
  const mq = matchMedia('(min-width: 1024px)');
  let on = false, cur = -1, vw = innerWidth, vh = innerHeight, bw = 0, gap = 0, snapT = 0;
  const label = i => { nos.forEach(e => e.textContent = `${String(i).padStart(2, '0')} / ${String(n).padStart(2, '0')}`); bars.forEach(b => b.style.setProperty('--wp', (i / n).toFixed(3))); };

  function caption(i) {
    if (i === cur) return; cur = i; const c = cards[i];
    $('.cl', cap).textContent = c.dataset.client; $('h3', cap).innerHTML = c.dataset.title; $('.tags', cap).textContent = c.dataset.tags.split(' · ').join('  •  ');
    label(i + 1);
    if (!reduce) [...cap.children].forEach((el, k) => el.animate([{ opacity: 0, transform: 'translateY(40%)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
      { duration: 600, delay: k * 50, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' }));
  }
  function layout() {
    vw = innerWidth; vh = innerHeight;
    on = mq.matches && !reduce;
    sec.classList.toggle('slide', on);
    track.style.transform = '';
    if (!on) { cards.forEach(c => { c.style.removeProperty('--sc'); c.style.removeProperty('--op'); }); render(); return; }
    let bh = vh - 400; bw = Math.min(vw * .72, bh * 1.6); bh = bw / 1.6; gap = Math.max(28, vw * .035);
    sec.style.setProperty('--bw', bw + 'px'); sec.style.setProperty('--bh', bh + 'px'); sec.style.setProperty('--gap', gap + 'px');
    sec.style.setProperty('--wh', Math.round(vh * (1 + (n - 1 + 2 * PAD) * .9)) + 'px');
    render();
  }
  const total = () => sec.offsetHeight - vh;
  function render() {
    if (!on) { const w = cards[0].offsetWidth + 24; label(Math.min(n, Math.round(track.scrollLeft / w) + 1)); return; }
    const r = sec.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) return;
    const p = clamp(-r.top / total());
    const raw = clamp(p * (n - 1 + 2 * PAD) - PAD, 0, n - 1), i0 = Math.min(n - 2, Math.floor(raw)), f = raw - i0;
    const s = i0 + easeIO(clamp((f - .28) / .44));          // descansa em cada projeto e muda com snap
    track.style.transform = `translate3d(${(vw / 2 - bw / 2 - s * (bw + gap)).toFixed(1)}px, 0, 0)`;
    cards.forEach((c, i) => { const d = Math.min(1, Math.abs(s - i)); c.style.setProperty('--sc', (1 - .1 * d).toFixed(3)); c.style.setProperty('--op', (1 - .55 * d).toFixed(3)); c.classList.toggle('act', d < .5); });
    topo.style.transform = `translate3d(${(-s * 2).toFixed(2)}%, 0, 0) scale(1.1)`;
    caption(Math.round(s));
    // snap: quando o scroll pára a meio de uma mudança, assenta no projeto mais próximo
    clearTimeout(snapT);
    snapT = setTimeout(() => {
      const L = window.__lenis; if (!L || Math.abs(L.velocity) > .05) return;
      const rr = sec.getBoundingClientRect(); if (rr.top > 1 || rr.bottom < vh - 1) return;
      const pp = clamp(-rr.top / total()), rw = pp * (n - 1 + 2 * PAD) - PAD, k = clamp(Math.round(rw), 0, n - 1);
      const kk = Math.floor(clamp(rw, 0, n - 1)), ff = clamp(rw, 0, n - 1) - kk;
      if (ff <= .28 || ff >= .72) return;                     // já está parado num projeto
      const y = scrollY + rr.top + ((k + PAD) / (n - 1 + 2 * PAD)) * total();
      L.scrollTo(y, { duration: .7, easing: easeIO });
    }, 160);
  }
  track.addEventListener('scroll', () => { if (!on) render(); }, { passive: true });
  mq.addEventListener('change', layout); addEventListener('resize', layout);
  layout(); caption(0);
  return { render, layout };
}
