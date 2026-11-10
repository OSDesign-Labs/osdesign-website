// Navbar (como a referência): Menu à esquerda, marca ao centro, CTA ciano + WhatsApp à direita. Fica sempre visível depois do hero.
// O menu abre em ecrã inteiro; os links rolam em 3D e, ao passar, trocam para itálico ciano.
import { $, $$, reduce } from './util.js';

export function initNav({ onNavigate }) {
  const html = document.documentElement, nav = $('#nav'), menu = $('#menu'), btn = $('#menuBtn'), card = $('.menu-card', menu);
  const links = $$('.menu-links a', menu), foot = $('.menu-foot', menu);
  let isOpen = false, busy = false;
  function update({ navOn = 1, heroMode = false } = {}) { if (isOpen) return; nav.style.opacity = navOn; nav.classList.toggle('on', navOn > .5); nav.classList.toggle('solid', !heroMode); }

  function open() {
    if (isOpen || busy) return; isOpen = true;
    menu.hidden = false; html.classList.add('menu-open'); btn.setAttribute('aria-expanded', 'true'); window.__lenis?.stop();
    if (!reduce) {
      card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.23,1,.32,1)' });
      links.forEach((a, i) => a.animate([{ transform: 'translateY(45%) rotateX(-85deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 800, delay: 90 + i * 60, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' }));
      foot.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 380, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' });
    }
    links[0].focus({ preventScroll: true });
  }
  function shut(then) {
    if (!isOpen) { then?.(); return; }
    isOpen = false; busy = true; btn.setAttribute('aria-expanded', 'false');
    const done = () => { menu.hidden = true; html.classList.remove('menu-open'); window.__lenis?.start(); busy = false; then ? then() : btn.focus({ preventScroll: true }); };
    if (reduce) return done();
    links.forEach((a, i) => a.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-40%) rotateX(80deg)', opacity: 0 }], { duration: 380, delay: i * 30, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' }));
    card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 260, easing: 'ease-in', fill: 'forwards' }).onfinish = () => { done(); links.forEach(a => a.getAnimations().forEach(x => x.cancel())); card.getAnimations().forEach(x => x.cancel()); };
  }
  btn.addEventListener('click', () => isOpen ? shut() : open());
  addEventListener('keydown', e => {
    if (!isOpen) return;
    if (e.key === 'Escape') shut();
    if (e.key === 'Tab') { const f = [btn, ...$$('a', menu)], a = f[0], b = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); } else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); } }
  });
  links.forEach(a => a.addEventListener('click', e => { e.preventDefault(); const h = a.getAttribute('href'); shut(() => onNavigate(h)); }));
  return { update, shut };
}
