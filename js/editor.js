// Editor: templates por serviço, editáveis ao vivo (cores, navbar, hero, cartões, elementos, animações, imagens).
import { $, $$, reduce } from './util.js';
import { openProposal } from './export.js';

const NAVS = [['classic', 'Clássica'], ['centered', 'Centrada'], ['glass', 'Vidro flutuante'], ['minimal', 'Minimal']];
const HEROS = [['full', 'Imagem total'], ['split', 'Dividido'], ['angle', 'Produto em ângulo'], ['type', 'Só tipografia']];
const lum = hex => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const onColor = hex => lum(hex) > .4 ? '#14141a' : '#ffffff';
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mix = (hex, w) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * w + 255 * (1 - w))); return `rgb(${c.join(',')})`; };
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function initEditor({ onNext }) {
  const ids = await fetch('templates/index.json').then(r => r.json());
  const T = {}; await Promise.all(ids.map(id => fetch(`templates/${id}.json`).then(r => r.json()).then(j => { T[id] = j; })));
  const pv = $('#pv'), frame = $('#pvFrame');
  const S = { tpl: ids[0], pal: 0, accent: null, nav: null, hero: null, cards: true, decor: true, anim: !reduce, img: null };

  // pills de serviço (vidro)
  $('#edPills').innerHTML = ids.map(id => `<button type="button" class="pill-opt glass" data-t="${id}" aria-pressed="false">${escH(T[id].label)}</button>`).join('');
  const seg = (box, list, key) => { box.innerHTML = list.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="false">${l}</button>`).join('');
    box.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S[key] = b.dataset.v; sync(); }); };
  seg($('#edNav'), NAVS, 'nav'); seg($('#edHero'), HEROS, 'hero');
  $('#edPills').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; load(b.dataset.t); });
  $('#edPal').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.pal = +b.dataset.i; S.accent = null; sync(); });
  $('#edAccent').addEventListener('input', e => { S.accent = e.target.value; sync(); });
  [['#edCards', 'cards'], ['#edDecor', 'decor'], ['#edAnim', 'anim']].forEach(([s, k]) => $(s).addEventListener('change', e => { S[k] = e.target.checked; sync(); }));
  $('#edImg').addEventListener('change', e => { const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => { S.img = r.result; $('#edImgReset').hidden = false; sync(); }; r.readAsDataURL(f); });
  $('#edImgReset').addEventListener('click', () => { S.img = null; $('#edImg').value = ''; $('#edImgReset').hidden = true; sync(); });
  $('#edPropose').addEventListener('click', () => openProposal(summary()));
  $('#edNext').addEventListener('click', () => onNext?.());

  function load(id) { const t = T[id]; Object.assign(S, { tpl: id, pal: 0, accent: null, nav: t.nav, hero: t.hero }); sync(); }

  function sync() {
    const t = T[S.tpl], p = t.palettes[S.pal], accent = S.accent || p.accent;
    $$('#edPills button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === S.tpl)));
    $('#edPal').innerHTML = t.palettes.map((q, i) => `<button type="button" class="pal" data-i="${i}" aria-pressed="${i === S.pal && !S.accent}"><span><i style="background:${q.bg}"></i><i style="background:${q.fg}"></i><i style="background:${q.accent}"></i></span>${escH(q.name)}</button>`).join('');
    $('#edAccent').value = accent;
    $$('#edNav button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === S.nav)));
    $$('#edHero button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === S.hero)));
    $('#edCards').checked = S.cards; $('#edDecor').checked = S.decor; $('#edAnim').checked = S.anim;
    $('#edUrl').textContent = `${t.domain} — editor`;
    const abs = u => new URL(u, location.href).href;
    const img = S.img ? `url("${S.img}")` : t.image ? `url("${abs(t.image)}")` : t.art;
    Object.assign(pv.style, { background: p.bg, color: p.fg, fontFamily: 'var(--body)' });
    pv.style.setProperty('--pbg', p.bg); pv.style.setProperty('--pfg', p.fg); pv.style.setProperty('--pa', accent); pv.style.setProperty('--pao', onColor(accent));
    pv.style.setProperty('--psf', p.surface); pv.style.setProperty('--pd', `"${t.fonts.display}", Georgia, serif`); pv.style.setProperty('--pdw', t.fonts.weight); pv.style.setProperty('--pr', t.radius);
    pv.style.setProperty('--pimg', img);
    pv.style.setProperty('--pglass', rgba(p.bg, .55)); pv.style.setProperty('--pline', rgba(p.fg, .18)); pv.style.setProperty('--pov1', rgba(p.bg, .88)); pv.style.setProperty('--pov2', rgba(p.bg, .4));
    pv.style.setProperty('--pb1', mix(accent, .3)); pv.style.setProperty('--pb2', mix(accent, .7));
    pv.className = `pv h-${S.hero}${S.anim ? ' anim' : ''}`;
    const navCls = { classic: '', centered: 'centered', glass: 'floating', minimal: 'minimal' }[S.nav];
    const [l1, l2] = [t.links.slice(0, 2), t.links.slice(2)];
    const useProduct = S.hero === 'angle' && t.product && !S.img;
    pv.innerHTML = `
      <div class="n ${navCls}"><span class="l1 lk">${l1.map(x => `<span>${escH(x)}</span>`).join('')}</span><span class="lg">${escH(t.brand)}</span><span class="l2 lk">${l2.map(x => `<span>${escH(x)}</span>`).join('')}</span><span class="b">${escH(t.cta)}</span><span class="menu"></span></div>
      ${S.decor ? `<i class="dec" style="width:340px;height:340px;right:-90px;top:-110px;background:${accent};opacity:.22"></i><i class="dec" style="width:140px;height:140px;left:520px;top:560px;border:14px solid ${accent};opacity:.35"></i>` : ''}
      ${S.hero === 'angle' ? '<div class="block"></div>' : ''}
      <div class="img${useProduct ? ' prod' : ''}" ${useProduct ? `style="background-image:url('${abs(t.product)}')"` : ''}></div>
      <div class="hd"><h1>${escH(t.headline)}</h1><p>${escH(t.sub)}</p><span class="cta">${escH(t.cta)}</span></div>
      ${S.cards ? `<div class="cards">${t.cards.map(([a, b]) => `<div><b>${escH(a)}</b><span>${escH(b)}</span></div>`).join('')}</div>` : ''}`;
    $('#edSummary').textContent = `${t.label} · ${t.palettes[S.pal].name}${S.accent ? ' + cor própria' : ''} · ${NAVS.find(n => n[0] === S.nav)[1]} · ${HEROS.find(h => h[0] === S.hero)[1]}`;
  }
  function summary() {
    const t = T[S.tpl];
    return { template: t, state: { ...S }, palette: t.palettes[S.pal], accent: S.accent || t.palettes[S.pal].accent,
      navLabel: NAVS.find(n => n[0] === S.nav)[1], heroLabel: HEROS.find(h => h[0] === S.hero)[1],
      notes: $('#edNotes').value.trim(), preview: pv };
  }
  // ajusta a pré-visualização (1200×760) à largura da janela
  const fit = () => { pv.style.transform = `scale(${frame.clientWidth / 1200})`; };
  new ResizeObserver(fit).observe(frame); fit();
  load(ids[0]);
}
