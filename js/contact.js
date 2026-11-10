// Página de contacto (estilo awake): roda de pills "Preciso de…", nome + e-mail, WhatsApp + projeto, e a mensagem pronta.
// Abre com uma transição de página: um painel sobe, assenta no cartão e o conteúdo entra. Voltar faz o inverso.
import { $, $$, reduce } from './util.js';

const NEEDS = ['website', 'identidade visual', 'design', 'desenvolvimento', 'hospedagem', 'automação', 'um pouco de tudo'];
const WA = '258840772648';
const EASE_IO = 'cubic-bezier(.77,0,.175,1)', EASE_OUT = 'cubic-bezier(.23,1,.32,1)';

export function initContact() {
  const html = document.documentElement, cv = $('#cv'), pt = $('#pt'), panel = $('#ptPanel'), mark = $('.pt-mark', pt), wheel = $('#wheel');
  const S = { need: 0, step: 1, nome: '', email: '', wa: '', msg: '' };
  let open = false, busy = false, pushed = false, lastFocus = null;

  // ---- roda de serviços ----
  wheel.innerHTML = NEEDS.map((n, i) => `<button type="button" class="opt" role="option" id="need${i}" tabindex="-1">${n}</button>`).join('');
  const opts = $$('.opt', wheel), N = NEEDS.length;
  function setNeed(i) {
    S.need = ((i % N) + N) % N;
    opts.forEach((o, k) => {
      let d = k - S.need; if (d > N / 2) d -= N; if (d < -N / 2) d += N;
      o.style.setProperty('--d', d); o.style.setProperty('--o', Math.max(0, 1 - Math.abs(d) * .3));
      o.style.visibility = Math.abs(d) > 2.5 ? 'hidden' : 'visible';
      o.classList.toggle('on', d === 0); o.setAttribute('aria-selected', String(d === 0));
    });
    wheel.setAttribute('aria-activedescendant', 'need' + S.need);
    $$('[data-need]', cv).forEach(e => { e.textContent = NEEDS[S.need]; });
  }
  setNeed(0);
  let acc = 0, lastWheel = 0;
  wheel.addEventListener('wheel', e => { e.preventDefault(); acc += e.deltaY; const now = performance.now();
    if (Math.abs(acc) > 36 && now - lastWheel > 170) { setNeed(S.need + Math.sign(acc)); acc = 0; lastWheel = now; } }, { passive: false });
  let drag = null;
  wheel.addEventListener('pointerdown', e => { drag = { y: e.clientY, i: S.need, moved: false }; wheel.setPointerCapture(e.pointerId); });
  wheel.addEventListener('pointermove', e => { if (!drag) return; const gap = opts[0].offsetHeight * 1.25, d = Math.round((drag.y - e.clientY) / gap); if (d) drag.moved = true; setNeed(drag.i + d); });
  wheel.addEventListener('pointerup', e => { const d = drag; drag = null; if (d && !d.moved) { const o = document.elementFromPoint(e.clientX, e.clientY)?.closest('.opt'); if (o) setNeed(opts.indexOf(o)); } });
  wheel.addEventListener('pointercancel', () => { drag = null; });
  wheel.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); setNeed(S.need + 1); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); setNeed(S.need - 1); }
    if (e.key === 'Enter') { e.preventDefault(); next(); }
  });

  // ---- passos ----
  const step = n => $(`.cv-step[data-step="${n}"]`, cv), dots = $$('.cv-dots i', cv);
  function syncUrl() {
    const q = new URLSearchParams({ preciso: NEEDS[S.need] }); if (S.nome) q.set('nome', S.nome); if (S.email) q.set('email', S.email);
    try { history.replaceState(history.state, '', '#contacto?' + q.toString().replace(/\+/g, '%20')); } catch {}
  }
  function go(n, instant = false) {
    const a = step(S.step), b = step(n); if (a === b) return;
    S.step = n; dots.forEach((d, i) => d.classList.toggle('on', i === Math.min(n, 3) - 1)); syncUrl();
    const focusIn = () => { const f = n === 1 ? wheel : $('input, a', b); f?.focus({ preventScroll: true }); };
    if (instant || reduce) { a.hidden = true; b.hidden = false; focusIn(); return; }
    a.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'translateY(-28px)', filter: 'blur(4px)' }], { duration: 220, easing: 'ease-in' }).onfinish = () => {
      a.hidden = true; b.hidden = false;
      b.animate([{ opacity: 0, transform: 'translateY(34px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 520, easing: EASE_OUT });
      focusIn();
    };
  }
  const bad = (inp, on) => inp.closest('.bigin').classList.toggle('bad', on);
  function next() {
    if (S.step === 1) return go(2);
    if (S.step === 2) {
      const n = $('#cvNome'), m = $('#cvEmail'); S.nome = n.value.trim(); S.email = m.value.trim();
      const okN = S.nome.length > 1, okE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(S.email);
      bad(n, !okN); bad(m, !okE);
      $('#cvErr2').textContent = !okN ? 'Escreve o teu nome.' : !okE ? (/@[^.]+$/.test(S.email) ? 'Falta o domínio, ex.: ana@empresa.co.mz' : 'Escreve um e-mail válido.') : '';
      if (!okN) return n.focus(); if (!okE) return m.focus();
      $$('[data-name]', cv).forEach(e => { e.textContent = S.nome.split(' ')[0]; });
      return go(3);
    }
    if (S.step === 3) {
      const w = $('#cvWa'); S.wa = w.value.trim(); S.msg = $('#cvMsg').value.trim();
      const okW = !S.wa || S.wa.replace(/\D/g, '').length >= 9; bad(w, !okW);
      $('#cvErr3').textContent = okW ? '' : 'O WhatsApp tem 9 dígitos, ex.: 84 123 4567.';
      if (!okW) return w.focus();
      const text = `Olá OS Design! Sou ${S.nome} (${S.email}${S.wa ? ' · ' + S.wa : ''}).\nPreciso de: ${NEEDS[S.need]}.` + (S.msg ? `\n${S.msg}` : '');
      $('#cvWaGo').href = `https://wa.me/${WA}?text=` + encodeURIComponent(text);
      $('#cvName').textContent = S.nome.split(' ')[0];
      return go(4);
    }
  }
  $$('[data-next]', cv).forEach(b => b.addEventListener('click', next));
  $('#cvForm').addEventListener('submit', e => { e.preventDefault(); next(); });
  $$('.bigin input', cv).forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); next(); } }));
  $('#cvEdit').addEventListener('click', () => go(2));

  // ---- abrir / fechar com transição ----
  const fm = () => parseFloat(getComputedStyle(html).getPropertyValue('--fmax')) || 18;
  const rad = () => innerWidth <= 640 ? 20 : 28;
  const enterContent = () => $$('.cv-top, .cv-step:not([hidden]), .cv-dots, .cv .cpill', cv).forEach((el, i) =>
    el.animate([{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }], { duration: 640, delay: i * 50, easing: EASE_OUT, fill: 'backwards' }));
  async function show(need) {
    if (need) { const i = NEEDS.indexOf(need); if (i >= 0) setNeed(i); }
    if (open) return; open = true; busy = true; lastFocus = document.activeElement;
    window.__lenis?.stop(); html.classList.add('cv-open');
    if (S.step === 4) go(1, true);
    if (reduce) { cv.hidden = false; syncUrl(); wheel.focus({ preventScroll: true }); busy = false; return; }
    pt.classList.add('on'); panel.className = 'pt-panel'; panel.style.opacity = 1;
    mark.animate([{ opacity: 0, transform: 'scale(.6) rotate(-90deg)' }, { opacity: 1, transform: 'none', offset: .55 }, { opacity: 0, transform: 'scale(1.1)' }], { duration: 1000, delay: 180, easing: EASE_OUT });
    await panel.animate([{ transform: 'translateY(101%)', borderRadius: '45% 45% 0 0 / 22vh 22vh 0 0' }, { transform: 'translateY(0)', borderRadius: '0' }], { duration: 640, easing: EASE_IO, fill: 'forwards' }).finished;
    cv.hidden = false; cv.scrollTop = 0; syncUrl();
    const F = fm();
    await panel.animate([{ clipPath: 'inset(0px round 0px)' }, { clipPath: `inset(${F}px round ${rad()}px)` }], { duration: 460, easing: EASE_OUT, fill: 'forwards' }).finished;
    enterContent();
    await panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'linear', fill: 'forwards' }).finished;
    panel.getAnimations().forEach(a => a.cancel()); pt.classList.remove('on');
    wheel.focus({ preventScroll: true }); busy = false;
  }
  async function hide() {
    if (!open) return; open = false; busy = true;
    const done = () => { cv.hidden = true; html.classList.remove('cv-open'); window.__lenis?.start(); lastFocus?.focus?.({ preventScroll: true }); };
    if (reduce) { done(); busy = false; return; }
    pt.classList.add('on'); panel.className = 'pt-panel navy'; panel.style.opacity = 1;
    await panel.animate([{ transform: 'translateY(-101%)', borderRadius: '0 0 45% 45% / 0 0 22vh 22vh' }, { transform: 'translateY(0)', borderRadius: '0' }], { duration: 600, easing: EASE_IO, fill: 'forwards' }).finished;
    done();
    await panel.animate([{ transform: 'translateY(0)', borderRadius: '0' }, { transform: 'translateY(101%)', borderRadius: '45% 45% 0 0 / 22vh 22vh 0 0' }], { duration: 620, easing: EASE_IO, fill: 'forwards' }).finished;
    panel.getAnimations().forEach(a => a.cancel()); pt.classList.remove('on'); busy = false;
  }
  function openLink(need) { if (!isContact()) { try { history.pushState({ cv: 1 }, '', '#contacto'); pushed = true; } catch {} } show(need); }
  function back() { if (pushed) { pushed = false; history.back(); } else { try { history.replaceState(null, '', location.pathname + location.search); } catch {} hide(); } }
  const isContact = () => location.hash.startsWith('#contacto');
  const needFromHash = () => { const q = location.hash.split('?')[1]; return q ? new URLSearchParams(q).get('preciso') : null; };
  addEventListener('popstate', () => { if (isContact()) show(needFromHash()); else hide(); });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#contacto"]'); if (!a || cv.contains(a)) return;
    e.preventDefault(); if (!busy) openLink(a.dataset.need);
  });
  $('#cvBack').addEventListener('click', back);
  $('#cvHome').addEventListener('click', e => { e.preventDefault(); back(); });
  cv.addEventListener('keydown', e => {
    if (e.key === 'Escape') back();
    if (e.key === 'Tab') { const f = $$('a[href], button:not([hidden]), input, [tabindex="0"]', cv).filter(x => x.offsetParent), a = f[0], b = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); } else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); } }
  });
  if (isContact()) { cv.hidden = false; open = true; html.classList.add('cv-open'); setNeed(Math.max(0, NEEDS.indexOf(needFromHash()))); requestAnimationFrame(() => window.__lenis?.stop()); }
  return { show: openLink, hide };
}
