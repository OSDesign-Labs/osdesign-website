// "Receber a minha proposta": mini-formulário em vidro → PDF (jsPDF + captura da pré-visualização) → WhatsApp.
// E-mail: precisa de um serviço de envio (função serverless com Resend ou EmailJS). Liga-se em OS_CONFIG.emailEndpoint
// quando o site estiver alojado; dentro do artefacto não há envio de e-mail.
import { $ } from './util.js';

export const OS_CONFIG = { whatsapp: '258840772648', emailEndpoint: null /* ex.: 'https://os.design/api/proposta' */ };
let current = null, lastFocus = null;

export function openProposal(data) {
  current = data; lastFocus = document.activeElement;
  $('#mForm').hidden = false; $('#mResult').hidden = true; $('#modal').hidden = false;
  window.__lenis?.stop();
  setTimeout(() => $('#mNome').focus(), 30);
}
function close() { $('#modal').hidden = true; window.__lenis?.start(); lastFocus?.focus?.(); }

function check() {
  const v = id => $(id).value.trim();
  const rules = [['#mfN', v('#mNome').length > 1, 'Escreve o teu nome.'], ['#mfE', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('#mEmail')), 'Escreve um e-mail válido.'],
    ['#mfW', v('#mWa').replace(/\D/g, '').length >= 9, 'Escreve um número de WhatsApp com 9 dígitos.']];
  let ok = true;
  rules.forEach(([id, good, msg]) => { $(id + ' .err').textContent = good ? '' : msg; ok = ok && good; });
  if (!$('#mOk').checked) { ok = false; $('#mOk').focus(); $('#mOk').closest('label').style.color = '#FF8A8A'; } else $('#mOk').closest('label').style.color = '';
  return ok && { nome: v('#mNome'), email: v('#mEmail'), wa: v('#mWa') };
}

async function capture(pv) {
  if (!window.html2canvas) return null;
  // captura uma cópia sem a escala da janela, para o PDF ficar nítido
  const clone = pv.cloneNode(true); clone.style.transform = 'none';
  const holder = document.createElement('div'); Object.assign(holder.style, { position: 'fixed', left: '-99999px', top: '0', width: '1200px', height: '760px' });
  holder.append(clone); document.body.append(holder);
  try { const c = await html2canvas(clone, { width: 1200, height: 760, scale: 1, useCORS: true, backgroundColor: null, logging: false }); return c.toDataURL('image/jpeg', .85); }
  catch { return null; } finally { holder.remove(); }
}

async function buildPdf(d, who) {
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 16; let y = 0;
  doc.setFillColor(3, 17, 48); doc.rect(0, 0, W, 34, 'F');
  doc.setTextColor(243, 247, 254); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('OS Design', M, 16);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text('Proposta inicial · ' + new Date().toLocaleDateString('pt-PT'), M, 24);
  doc.setTextColor(70, 198, 229); doc.text('+258 84 077 2648 · @os.design.mz', W - M, 24, { align: 'right' });
  y = 46; doc.setTextColor(2, 8, 23);
  const row = (k, v) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(94, 99, 111); doc.text(k.toUpperCase(), M, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(2, 8, 23); const lines = doc.splitTextToSize(v, W - M * 2 - 46); doc.text(lines, M + 46, y); y += Math.max(7, lines.length * 5.2 + 2); };
  row('Cliente', who.nome); row('E-mail', who.email); row('WhatsApp', who.wa);
  y += 3; doc.setDrawColor(207, 224, 255); doc.line(M, y, W - M, y); y += 9;
  row('Serviço', d.template.label); row('Modelo', `${d.template.brand} (${d.template.domain})`); row('Cores', `${d.palette.name} · destaque ${d.accent}`);
  row('Navbar', d.navLabel); row('Hero', d.heroLabel);
  row('Elementos', [d.state.cards ? 'cartões' : 'sem cartões', d.state.decor ? 'elementos decorativos' : 'sem decoração', d.state.anim ? 'com animações' : 'sem animações'].join(' · '));
  row('Imagens', d.state.img ? 'imagem própria carregada' : 'imagem do modelo');
  row('Comentários', d.notes || 'Sem comentários.');
  const shot = await capture(d.preview);
  if (shot) { y += 4; const iw = W - M * 2, ih = iw * 760 / 1200; doc.addImage(shot, 'JPEG', M, y, iw, ih); y += ih + 8; }
  doc.setFontSize(9); doc.setTextColor(94, 99, 111);
  doc.text(doc.splitTextToSize('Este documento resume as escolhas feitas no editor do site da OS Design. Os valores e o calendário seguem depois da primeira conversa.', W - M * 2), M, Math.min(y, 285));
  return doc.output('blob');
}

function waText(d, who) {
  return `Olá OS Design! Sou ${who.nome} (${who.email}, ${who.wa}).\nFiz a minha proposta no editor:\n• Serviço: ${d.template.label}\n• Cores: ${d.palette.name} (${d.accent})\n• Navbar: ${d.navLabel} · Hero: ${d.heroLabel}\n• ${d.state.cards ? 'Com' : 'Sem'} cartões · ${d.state.decor ? 'com' : 'sem'} elementos · ${d.state.anim ? 'com' : 'sem'} animações` + (d.notes ? `\n• Comentários: ${d.notes}` : '') + '\nO PDF segue em anexo.';
}

async function go() {
  const who = check(); if (!who || !current) return;
  const btn = $('#mGo'); btn.disabled = true; btn.firstChild.textContent = 'A gerar… ';
  const status = [];
  try {
    const blob = await buildPdf(current, who);
    const dl = window.claude ? await window.claude.use('downloads').catch(() => null) : null;
    if (dl) {
      try { await dl.save({ filename: `proposta-os-design-${current.template.id}.pdf`, data: blob }); status.push(['ok', 'PDF guardado no teu dispositivo.']); }
      catch (e) { status.push(['warn', e?.code === 'declined' ? 'Não guardaste o PDF. Podes gerá-lo outra vez.' : 'Não foi possível guardar o PDF aqui.']); }
    } else status.push(['warn', 'Gerámos o PDF, mas esta página não consegue guardar ficheiros aqui.']);
    if (OS_CONFIG.emailEndpoint) {
      try { const fd = new FormData(); fd.append('pdf', blob, 'proposta.pdf'); fd.append('to', who.email); fd.append('resumo', waText(current, who));
        const r = await fetch(OS_CONFIG.emailEndpoint, { method: 'POST', body: fd }); status.push([r.ok ? 'ok' : 'warn', r.ok ? `Enviámos a proposta para ${who.email} e para a OS Design.` : 'O envio por e-mail falhou. Usa o WhatsApp.']); }
      catch { status.push(['warn', 'O envio por e-mail falhou. Usa o WhatsApp.']); }
    }
  } catch { status.push(['warn', 'Não foi possível gerar o PDF. Envia o resumo pelo WhatsApp.']); }
  $('#mStatus').innerHTML = status.map(([c, t]) => `<div class="ok ${c === 'warn' ? 'warn' : ''}"></div>`).join('');
  [...$('#mStatus').children].forEach((el, i) => { el.textContent = status[i][1]; });
  $('#mWaLink').href = `https://wa.me/${OS_CONFIG.whatsapp}?text=${encodeURIComponent(waText(current, who))}`;
  $('#mForm').hidden = true; $('#mResult').hidden = false; $('#mWaLink').focus();
  btn.disabled = false; btn.firstChild.textContent = 'Gerar PDF ';
}

export function initExport() {
  $('#mGo').addEventListener('click', go);
  $('#mCancel').addEventListener('click', close); $('#mClose').addEventListener('click', close);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) close(); });
}
