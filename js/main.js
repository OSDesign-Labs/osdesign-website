// OS Design · site imersivo. Ordem: loader → burst → hero em moldura → processo → editor → código/lançamento → hospedagem → manifesto → serviços → trabalho → equipa → fala connosco.
import { $, $$, reduce, CapWave, splitChars } from './util.js';
import { initLoader } from './loader.js';
import { initProcess } from './process.js';
import { initEditor } from './editor.js';
import { initExport } from './export.js';
import { initMaintenance } from './maintenance.js';
import { initNav } from './nav.js';
import { initContact } from './contact.js';
import { initWork } from './work.js';

const LOGO_D = document.querySelector('#os-s path').getAttribute('d');
const hasGsap = !!(window.gsap && window.ScrollTrigger);
if (hasGsap) gsap.registerPlugin(ScrollTrigger);

// scroll suave (Lenis) ligado ao ScrollTrigger; desligado com movimento reduzido
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: .11, wheelMultiplier: 1 });
  window.__lenis = lenis;
  if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
}
const scrollToEl = (el, offset = 0) => lenis ? lenis.scrollTo(el, { offset, duration: 1.4 }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });

const contact = initContact();
const goTo = h => {
  if (h.startsWith('#contacto')) { contact.show(); return; }
  const t = $(h); if (t) scrollToEl(t, h === '#topo' ? 0 : 0);
};
$$('a[href^="#"]').forEach(a => { const h = a.getAttribute('href'); if (h.startsWith('#contacto') || a.closest('#menu') || a.closest('#cv')) return;
  a.addEventListener('click', e => { const t = $(h); if (!t) return; e.preventDefault(); scrollToEl(t); }); });

const loader = initLoader({ logoPath: LOGO_D });
const nav = initNav({ onNavigate: goTo });
const proc = initProcess();
const maint = initMaintenance();
const work = initWork();
initExport();
initEditor({ onNext: () => scrollToEl($('#processoB')) }).catch(() => { $('#edSummary').textContent = 'Não foi possível carregar os modelos.'; });

// faixa Capulana OS: no hero em stop motion (entra da esquerda quando o hero assenta, sai quando desces); no manifesto contínua
const capImg = new Image(); capImg.src = 'assets/os/capulana-band.jpg';
let heroCap = null;
capImg.onload = () => {
  heroCap = new CapWave($('#heroWave'), { img: capImg, amp: 10, period: 1400, thick: 42, fps: reduce ? 0 : 12, animate: false, hidden: !reduce });
  new CapWave($('#mfWave'), { img: capImg, fill: '#020817', amp: 22, period: 1300, thick: 56, animate: !reduce, speed: .00008 });
  tick();
};

// hero: relógio de Maputo, luz que segue o cursor e Ondas do S com parallax
const clock = $('#clock');
const setClock = () => { try { clock.textContent = new Intl.DateTimeFormat('pt-PT', { timeZone: 'Africa/Maputo', hour: '2-digit', minute: '2-digit' }).format(new Date()); } catch { clock.textContent = ''; } };
setClock(); setInterval(setClock, 30000);
const hero = $('#hero'), ondas = $('#ondas');
if (!reduce) hero.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  hero.style.setProperty('--lx', e.clientX + 'px'); hero.style.setProperty('--ly', e.clientY + 'px');
  ondas.style.setProperty('--ox', ((e.clientX / innerWidth - .5) * -24).toFixed(1) + 'px'); ondas.style.setProperty('--oy', ((e.clientY / innerHeight - .5) * -18).toFixed(1) + 'px');
});

let raf = 0;
function tick() {
  raf = 0;
  const L = loader.render() || {};
  nav.update(L);
  if (heroCap && !reduce) { if (L.heroReady) heroCap.enter(); else if (L.leave > .04 || L.lock < .9) heroCap.exit(); }
  proc.render(); maint.render(); work.render();
}
addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
// o título só aparece depois do burst; volta a verificar a capulana durante uns segundos sem precisar de scroll
setInterval(() => { if (!raf) raf = requestAnimationFrame(tick); }, 400);
if (document.fonts) document.fonts.ready.then(() => { loader.layout(); proc.fit(); work.layout(); hasGsap && ScrollTrigger.refresh(); });

// 5.4 · manifesto: sobe por cima da hospedagem (parallax) e as letras entram uma a uma
const mfChars = [...splitChars($('#mf-title')), ...splitChars($('#mfText'))];
if (hasGsap && !reduce) {
  gsap.set(mfChars, { yPercent: 110 });
  gsap.fromTo('#manifesto', { y: () => innerHeight * .25 }, { y: 0, ease: 'none', scrollTrigger: { trigger: '#manifesto', start: 'top bottom', end: 'top 20%', scrub: true, invalidateOnRefresh: true } });
  ScrollTrigger.create({ trigger: '#manifesto', start: 'top 45%', onEnter: () => gsap.to(mfChars, { yPercent: 0, duration: .9, ease: 'expo.out', stagger: .02, overwrite: true }),
    onLeaveBack: () => gsap.to(mfChars, { yPercent: 110, duration: .3, ease: 'power2.in', overwrite: true }) });
  // serviços: fundo com parallax suave
  gsap.to('.sv-bg .giant', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '#servicos', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('.sv-bg .rings', { yPercent: 14, rotate: 20, ease: 'none', scrollTrigger: { trigger: '#servicos', start: 'top bottom', end: 'bottom top', scrub: true } });
  // equipa: a madeira makonde desliza mais devagar que o conteúdo
  gsap.fromTo('.tm-bg', { '--ty': '-6%' }, { '--ty': '6%', ease: 'none', scrollTrigger: { trigger: '#equipa', start: 'top bottom', end: 'bottom top', scrub: true } });
  ScrollTrigger.batch('.svc, .person', { start: 'top 88%', once: true, onEnter: els => gsap.from(els, { y: 24, duration: .7, ease: 'expo.out', stagger: .06, clearProps: 'transform' }) });
}

// micro-interação: o anel Eco pulsa a partir do cursor (serviços e equipa)
$$('.svc, .person').forEach(card => {
  let last = 0;
  card.addEventListener('pointermove', e => {
    if (reduce || e.pointerType !== 'mouse' || performance.now() - last < 520) return; last = performance.now();
    const r = card.getBoundingClientRect(), ring = document.createElement('i'); ring.className = 'ring';
    ring.style.left = e.clientX - r.left + 'px'; ring.style.top = e.clientY - r.top + 'px'; card.append(ring);
    ring.animate([{ transform: 'scale(.4)', opacity: .7 }, { transform: 'scale(7)', opacity: 0 }], { duration: 1100, easing: 'cubic-bezier(.23,1,.32,1)' }).onfinish = () => ring.remove();
  });
});

$('#replay').addEventListener('click', () => lenis ? lenis.scrollTo(0, { duration: 2 }) : scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
tick();
